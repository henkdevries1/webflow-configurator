/* Copies the Venduetto configurator from venduetto.com into the Webflow CMS.

     EXPORT_TOKEN=… WEBFLOW_TOKEN=… node scripts/sync-venduetto.ts            dry run: prints the plan
     EXPORT_TOKEN=… WEBFLOW_TOKEN=… node scripts/sync-venduetto.ts --apply    carries it out (staged)
       --publish-staging   then publishes the site to webflow.io only (never a custom domain)
       --allow-deletes     needed when the plan removes more than MAX_QUIET_DELETES items

   Reads GET <exportUrl> (Bearer EXPORT_TOKEN, see Venduetto docs/ARCHITECTURE.md
   → "Webflow export") and the two configurator collections through the Webflow
   Data API (WEBFLOW_TOKEN: a site token with CMS read/write, and Sites write
   for --publish-staging). What should change is decided in src/sync/venduetto.ts.
   Webflow fetches every new or changed render itself from its `full` URL. */

import { readFileSync } from 'node:fs';
import { planSync, validateExport, type CmsItem, type CollectionPlan, type FieldData } from '../src/sync/venduetto.ts';

interface Config {
  exportUrl: string;
  siteId: string;
  optionsCollection: string;
  rendersCollection: string;
  worksCollection: string;
  worksItem: string;
  basePriceField: string;
  templateGroups: string[];
}

const config: Config = JSON.parse(readFileSync(new URL('./sync-venduetto.config.json', import.meta.url), 'utf8'));
const args = new Set(process.argv.slice(2));
const APPLY = args.has('--apply');
const PUBLISH = args.has('--publish-staging');
const MAX_QUIET_DELETES = 10;
const API = 'https://api.webflow.com/v2';

function need(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing ${name}.`);
    process.exit(2);
  }
  return v;
}

const EXPORT_TOKEN = need('EXPORT_TOKEN');
const WEBFLOW_TOKEN = need('WEBFLOW_TOKEN');

/* Webflow allows ~60 requests a minute on most plans: one call per second,
   and a 429 waits for Retry-After. */
let last = 0;
async function webflow(method: string, path: string, body?: unknown): Promise<any> {
  for (let attempt = 0; ; attempt++) {
    const wait = last + 1050 - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    last = Date.now();
    const res = await fetch(API + path, {
      method,
      headers: { Authorization: `Bearer ${WEBFLOW_TOKEN}`, 'Content-Type': 'application/json', accept: 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if ((res.status === 429 || res.status >= 500) && attempt < 5) {
      const after = Number(res.headers.get('retry-after')) || 2 ** attempt * 2;
      await new Promise((r) => setTimeout(r, after * 1000));
      continue;
    }
    const text = await res.text();
    if (!res.ok) throw new Error(`Webflow ${method} ${path} → ${res.status}: ${text.slice(0, 500)}`);
    return text ? JSON.parse(text) : null;
  }
}

async function listItems(collection: string): Promise<CmsItem[]> {
  const items: CmsItem[] = [];
  for (let offset = 0; ; offset += 100) {
    const page = await webflow('GET', `/collections/${collection}/items?limit=100&offset=${offset}`);
    items.push(...page.items);
    if (items.length >= page.pagination.total || !page.items.length) return items;
  }
}

function chunks<T>(list: T[], size = 50): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

async function carryOut(collection: string, plan: CollectionPlan): Promise<void> {
  for (const part of chunks(plan.create)) {
    await webflow('POST', `/collections/${collection}/items`, {
      items: part.map((fieldData) => ({ isArchived: false, isDraft: false, fieldData })),
    });
  }
  for (const part of chunks(plan.update)) {
    await webflow('PATCH', `/collections/${collection}/items`, {
      items: part.map((u) => ({ id: u.id, fieldData: u.fieldData })),
    });
  }
  for (const part of chunks(plan.remove)) {
    await webflow('DELETE', `/collections/${collection}/items`, { items: part.map((r) => ({ id: r.id })) });
  }
}

function report(title: string, plan: CollectionPlan, describe: (f: FieldData) => string): void {
  console.log(`\n${title}: ${plan.create.length} new, ${plan.update.length} changed, ${plan.remove.length} removed, ${plan.unchanged} unchanged`);
  for (const f of plan.create) console.log(`  + ${describe(f)}`);
  for (const u of plan.update) console.log(`  ~ ${u.id} (${u.changes.join(', ')})`);
  for (const r of plan.remove) console.log(`  - ${r.label}`);
}

const res = await fetch(config.exportUrl, { headers: { Authorization: `Bearer ${EXPORT_TOKEN}`, accept: 'application/json' } });
if (!res.ok) {
  console.error(`Export ${config.exportUrl} → ${res.status}: ${(await res.text()).slice(0, 300)}`);
  process.exit(1);
}
const data = validateExport(await res.json());
console.log(`Venduetto export of ${data.generatedAt}: ${data.model.groups.length} groups, ${Object.keys(data.model.renders).length} paints.`);

const [options, renders, works] = await Promise.all([
  listItems(config.optionsCollection),
  listItems(config.rendersCollection),
  webflow('GET', `/collections/${config.worksCollection}/items/${config.worksItem}`),
]);

const plan = planSync({
  data,
  options,
  renders,
  templateGroups: config.templateGroups,
  basePrice: (works.fieldData[config.basePriceField] as string | null) ?? null,
});

report('Options', plan.options, (f) => `${f.group} · ${f.name}${f.price ? ` (€${f.price})` : ''}`);
report('Renders', plan.renders, (f) => String(f.name));
if (plan.basePrice) console.log(`\nBase price: ${plan.basePrice.from ?? '—'} → ${plan.basePrice.to ?? '—'}`);
for (const g of plan.missingGroups) {
  console.log(`\n! Group "${g.code}" (${g.kind}, "${g.title}") is not in the Webflow template. Add a tcfg-element="group" for it, else its options are ignored.`);
}
for (const w of plan.warnings) console.log(`! ${w}`);

const deletes = plan.options.remove.length + plan.renders.remove.length;
if (!APPLY) {
  console.log('\nDry run. Run again with --apply to carry this out.');
  process.exit(0);
}
if (deletes > MAX_QUIET_DELETES && !args.has('--allow-deletes')) {
  console.error(`\nThe plan removes ${deletes} items. Check the list above and run again with --allow-deletes.`);
  process.exit(1);
}

await carryOut(config.optionsCollection, plan.options);
await carryOut(config.rendersCollection, plan.renders);
if (plan.basePrice) {
  await webflow('PATCH', `/collections/${config.worksCollection}/items/${config.worksItem}`, {
    fieldData: { [config.basePriceField]: plan.basePrice.to },
  });
}
console.log('\nCMS updated (staged).');

if (PUBLISH) {
  await webflow('POST', `/sites/${config.siteId}/publish`, { publishToWebflowSubdomain: true });
  console.log('Published to webflow.io (no custom domains).');
} else {
  console.log('Not published. Publish to webflow.io with --publish-staging, or from the Designer.');
}
