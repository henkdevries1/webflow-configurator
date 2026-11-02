/* Venduetto → Webflow CMS sync: the plan (pure, no I/O).

   Venduetto's /manage is the source of the Venduetto case's configurator.
   GET https://venduetto.com/api/export/configurator (Bearer EXPORT_TOKEN)
   gives its read model; this module turns that into the items the
   "Configurator Options" and "Configurator Renders" collections should hold
   and compares them with what Webflow has, so scripts/sync-venduetto.ts only
   has to carry out the plan. Items are matched on meaning, not on Webflow
   ids: an option on group + code, a render on paint + view + combination. */

export interface ExportImage {
  src: string;
  full?: string;
}

export interface ExportOption {
  code: string;
  name: string;
  note: string;
  swatchHex: string | null;
  isDefault: boolean;
  priceCents: number | null;
}

export interface ExportGroup {
  code: string;
  kind: 'paint' | 'choice' | 'toggle';
  title: string;
  options: ExportOption[];
  onRenders?: boolean;
}

export interface ExportRenderSet {
  entries: string[];
  views: Record<string, ExportImage>;
  seat?: unknown;
}

export interface ExportModel {
  views: { code: string; name: string }[];
  groups: ExportGroup[];
  renders: Record<string, Record<string, ExportImage>>;
  renderSets?: Record<string, ExportRenderSet[]>;
  baseSeats?: Record<string, unknown>;
  basePriceCents?: number | null;
}

export interface ConfiguratorExport {
  version: number;
  generatedAt: string;
  model: ExportModel;
}

/** A CMS item as the Webflow Data API returns it. */
export interface CmsItem {
  id: string;
  fieldData: Record<string, unknown>;
}

export type FieldData = Record<string, unknown>;

export interface CollectionPlan {
  create: FieldData[];
  update: { id: string; fieldData: FieldData; changes: string[] }[];
  remove: { id: string; label: string }[];
  unchanged: number;
}

export interface SyncPlan {
  options: CollectionPlan;
  renders: CollectionPlan;
  basePrice: { from: string | null; to: string | null } | null;
  /** Groups Venduetto has that the Webflow template does not declare. */
  missingGroups: ExportGroup[];
  warnings: string[];
}

export function validateExport(data: unknown): ConfiguratorExport {
  const d = data as Partial<ConfiguratorExport> | null;
  if (!d || d.version !== 1 || !d.model || !Array.isArray(d.model.groups)) {
    throw new Error('Not a Venduetto configurator export (version 1).');
  }
  if (!d.model.groups.length) throw new Error('The export has no option groups; refusing to sync an empty configurator.');
  return d as ConfiguratorExport;
}

/** Cents → the way prices are typed in the CMS: "4.850", "268.400", "12,50". */
export function formatPrice(cents: number | null | undefined): string | null {
  if (cents === null || cents === undefined) return null;
  const euros = Math.floor(cents / 100);
  const rest = cents % 100;
  const whole = String(euros).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return rest ? `${whole},${String(rest).padStart(2, '0')}` : whole;
}

export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** "roll-cage + zonder-helmet-shell" → a canonical key ("" = base). */
export function comboKey(combination: unknown): string {
  const text = typeof combination === 'string' ? combination.trim().toLowerCase() : '';
  if (!text || text === 'basis' || text === 'base') return '';
  return text
    .split('+')
    .map((t) => t.trim())
    .filter(Boolean)
    .sort()
    .join('+');
}

const str = (v: unknown): string => (typeof v === 'string' ? v : v === null || v === undefined ? '' : String(v));
const same = (a: unknown, b: unknown): boolean => {
  const norm = (v: unknown) => (v === null || v === undefined ? '' : typeof v === 'string' ? v.trim() : v);
  const x = norm(a);
  const y = norm(b);
  return typeof x === 'string' && typeof y === 'string' && /^#[0-9a-f]{3,8}$/i.test(x) ? x.toLowerCase() === y.toLowerCase() : x === y;
};

function diffFields(current: FieldData, wanted: FieldData, keys: string[]): string[] {
  return keys.filter((k) => !same(current[k], wanted[k]));
}

function uniqueSlug(base: string, taken: Set<string>): string {
  let slug = base || 'item';
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
  taken.add(slug);
  return slug;
}

const OPTION_FIELDS = ['group', 'code', 'name', 'note', 'price', 'default', 'swatch', 'order'];
const RENDER_FIELDS = ['paint', 'view', 'combination', 'name', 'source', 'seat'];

/** An entry ref ("cockpit:roll-cage" / "!cockpit:helmet-shell") → the
 *  token the module reads in a combination ("roll-cage" / "zonder-helmet-shell"). */
function entryToken(entry: string): string {
  const off = entry.startsWith('!');
  const ref = off ? entry.slice(1) : entry;
  const code = ref.slice(ref.indexOf(':') + 1);
  return off ? `zonder-${code}` : code;
}

function entryLabel(entry: string, names: Map<string, string>): string {
  const off = entry.startsWith('!');
  const ref = off ? entry.slice(1) : entry;
  const name = names.get(ref) ?? ref.slice(ref.indexOf(':') + 1);
  return off ? `without ${name.toLowerCase()}` : name.toLowerCase();
}

function seatText(seat: unknown): string | null {
  return seat && typeof seat === 'object' && Object.keys(seat).length ? JSON.stringify(seat) : null;
}

export interface PlanInput {
  data: ConfiguratorExport;
  options: CmsItem[];
  renders: CmsItem[];
  /** Group codes the Webflow template declares (tcfg-element="group"). */
  templateGroups: string[];
  /** The Works item's current base price text, or undefined to leave it alone. */
  basePrice?: string | null;
}

export function planSync(input: PlanInput): SyncPlan {
  const { model } = input.data;
  const warnings: string[] = [];

  /* ---- options ---- */
  const wantedOptions = new Map<string, FieldData>();
  let order = 0;
  for (const g of model.groups) {
    for (const o of g.options) {
      order++;
      wantedOptions.set(`${g.code}:${o.code}`, {
        group: g.code,
        code: o.code,
        name: o.name,
        note: o.note || null,
        price: formatPrice(o.priceCents),
        default: o.isDefault,
        swatch: o.swatchHex,
        order,
      });
    }
  }
  const optionSlugs = new Set(input.options.map((i) => str(i.fieldData.slug)));
  const options = compare(
    input.options,
    wantedOptions,
    (i) => `${str(i.fieldData.group).trim()}:${str(i.fieldData.code).trim() || slugify(str(i.fieldData.name))}`,
    OPTION_FIELDS,
    (key, f) => ({ ...f, slug: uniqueSlug(slugify(str(f.code)), optionSlugs) }),
    (i) => `${str(i.fieldData.group)} · ${str(i.fieldData.name)}`,
  );

  /* ---- renders ---- */
  const paints = model.groups.find((g) => g.kind === 'paint');
  const paintName = new Map(paints?.options.map((o) => [o.code, o.name]) ?? []);
  const optionName = new Map<string, string>();
  const codeGroups = new Map<string, string[]>();
  for (const g of model.groups) {
    if (g.kind === 'paint') continue;
    for (const o of g.options) {
      optionName.set(`${g.code}:${o.code}`, o.name);
      codeGroups.set(o.code, [...(codeGroups.get(o.code) ?? []), g.code]);
    }
  }
  for (const [code, groups] of codeGroups) {
    if (groups.length > 1) warnings.push(`Option code "${code}" is used in ${groups.join(' and ')}; render combinations naming it are ambiguous on the website.`);
  }

  const wantedRenders = new Map<string, FieldData>();
  const addRender = (paint: string, view: string, entries: string[], img: ExportImage, seat: unknown) => {
    const combination = entries.length ? entries.map(entryToken).join(' + ') : 'basis';
    const key = `${paint}|${view}|${comboKey(combination)}`;
    const label = entries.length ? entries.map((e) => entryLabel(e, optionName)).join(', ') : 'standard';
    wantedRenders.set(key, {
      paint,
      view,
      combination,
      name: `${paintName.get(paint) ?? paint} ${view} · ${label}`,
      source: img.full ?? img.src,
      seat: seatText(seat),
    });
  };
  for (const [paint, views] of Object.entries(model.renders)) {
    for (const [view, img] of Object.entries(views)) addRender(paint, view, [], img, model.baseSeats?.[paint]);
  }
  for (const [paint, sets] of Object.entries(model.renderSets ?? {})) {
    for (const set of sets) {
      for (const [view, img] of Object.entries(set.views)) addRender(paint, view, set.entries, img, set.seat);
    }
  }
  const renderSlugs = new Set(input.renders.map((i) => str(i.fieldData.slug)));
  const renders = compare(
    input.renders,
    wantedRenders,
    (i) => `${str(i.fieldData.paint).trim()}|${str(i.fieldData.view).trim()}|${comboKey(i.fieldData.combination)}`,
    RENDER_FIELDS,
    (key, f) => ({
      ...f,
      slug: uniqueSlug(slugify(`${f.paint}-${comboKey(f.combination).replace(/\+/g, '-') || 'standard'}-${f.view}`), renderSlugs),
      image: { url: f.source },
    }),
    (i) => str(i.fieldData.name) || str(i.fieldData.slug),
  );
  // A changed source means a new picture: send the image too.
  for (const u of renders.update) if (u.changes.includes('source')) u.fieldData.image = { url: u.fieldData.source };

  /* ---- groups the template does not know ---- */
  const declared = new Set(input.templateGroups.map((c) => c.toLowerCase()));
  const missingGroups = model.groups.filter((g) => !declared.has(g.code.toLowerCase()));

  /* ---- base price ---- */
  let basePrice: SyncPlan['basePrice'] = null;
  if (input.basePrice !== undefined) {
    const to = formatPrice(model.basePriceCents ?? null);
    if (!same(input.basePrice, to)) basePrice = { from: input.basePrice ?? null, to };
  }

  return { options, renders, basePrice, missingGroups, warnings };
}

function compare(
  current: CmsItem[],
  wanted: Map<string, FieldData>,
  keyOf: (i: CmsItem) => string,
  fields: string[],
  forCreate: (key: string, f: FieldData) => FieldData,
  labelOf: (i: CmsItem) => string,
): CollectionPlan {
  const plan: CollectionPlan = { create: [], update: [], remove: [], unchanged: 0 };
  const seen = new Set<string>();
  for (const item of current) {
    const key = keyOf(item);
    const want = wanted.get(key);
    if (!want || seen.has(key)) {
      plan.remove.push({ id: item.id, label: labelOf(item) });
      continue;
    }
    seen.add(key);
    const changes = diffFields(item.fieldData, want, fields);
    if (changes.length) plan.update.push({ id: item.id, fieldData: Object.fromEntries(changes.map((k) => [k, want[k]])), changes });
    else plan.unchanged++;
  }
  for (const [key, want] of wanted) if (!seen.has(key)) plan.create.push(forCreate(key, want));
  return plan;
}
