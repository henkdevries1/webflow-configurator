/* Raw data (from Webflow elements, a JSON block or the JS API) → Model.

   Lenient on purpose: an editor fills these in by hand in the Webflow CMS.
   - Codes may be left out: they are made from the name ("Rosso Cordoba" →
     "rosso-cordoba").
   - An option's group may be the group's code or its title.
   - A render's paint, view and combination may each be given explicitly, or
     are read from the image's FILE NAME with the Venduetto upload rules
     (render-names.ts): "rosso_05.jpg", "rosso_05_roll-cage.jpg",
     "rosso_05_roll-cage+zonder-helmet-shell.jpg". Webflow keeps the
     original file name in its asset URLs, after a 24-character asset id.
   - Without declared views, the view codes are the numbers in the render
     file names ("01", "02", …).
   Problems never throw: they are returned as warnings (and logged). */

import { decideEntries, matchPaint, matchView, mapRenderFile, norm, optionTokens, splitPath, tokens, type NamedCode, type RenderOptionName } from './render-names.ts';
import { parseAmount } from './labels.ts';
import { setKey } from './set-key.ts';
import { NO_PAINT, type Group, type GroupKind, type Image, type Model, type Option, type RenderSet, type View } from './types.ts';

export interface RawGroup {
  code?: string;
  kind?: string;
  title?: string;
  /** false / "false" / "no" = not visible on the renders. */
  onRenders?: boolean | string;
  sort?: number | string;
  options?: RawOption[];
}

export interface RawOption {
  group?: string;
  code?: string;
  name?: string;
  note?: string;
  price?: number | string | null;
  default?: boolean | string;
  swatch?: string | null;
  image?: Image | string | null;
  sort?: number | string;
}

export interface RawView {
  code?: string;
  name?: string;
  sort?: number | string;
}

export interface RawRender {
  src: string;
  srcset?: string | null;
  paint?: string | null;
  view?: string | null;
  /** The combination: "roll-cage + zonder-helmet-shell"; "" or "basis" =
   *  the base set. Absent (undefined/null) = read it from the file name. */
  set?: string | null;
}

export interface RawData {
  groups?: RawGroup[];
  options?: RawOption[];
  views?: RawView[];
  renders?: (RawRender | string)[];
}

export interface Normalized {
  model: Model;
  warnings: string[];
}

const PAINT_WORDS = new Set(['paint', 'paints', 'colour', 'colours', 'color', 'colors', 'kleur', 'kleuren', 'lak', 'lakken']);

export function slug(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truthy(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value !== 'string') return false;
  return ['true', 'yes', 'ja', 'on', 'aan', '1', 'default', 'standaard', 'standard'].includes(value.trim().toLowerCase());
}

function kindOf(value: unknown, code: string): GroupKind {
  const v = typeof value === 'string' ? norm(value) : '';
  if (v === 'paint' || v === 'colour' || v === 'color' || v === 'kleur' || v === 'lak') return 'paint';
  if (v === 'toggle' || v === 'switch' || v === 'onoff' || v === 'aanuit' || v === 'checkbox' || v === 'extra' || v === 'extras') return 'toggle';
  if (v === 'choice' || v === 'radio' || v === 'single' || v === 'keuze') return 'choice';
  return PAINT_WORDS.has(norm(code)) ? 'paint' : 'choice';
}

function num(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}

function image(value: RawOption['image']): Image | null {
  if (!value) return null;
  if (typeof value === 'string') return value.trim() ? { src: value.trim(), srcset: null } : null;
  return value.src ? { src: value.src, srcset: value.srcset ?? null } : null;
}

/** Sort by `sort` when given, else keep the input order. */
function sorted<T>(items: T[], sortOf: (t: T) => unknown): T[] {
  return items
    .map((item, i) => ({ item, key: num(sortOf(item), i) }))
    .sort((a, b) => a.key - b.key)
    .map((x) => x.item);
}

/** The file name a render URL carries: decoded, without the query, the
 *  Webflow asset id(s) ("64f1…e2_") and the responsive-size suffix ("-p-800"). */
export function fileNameOf(src: string): string {
  let name = src.split(/[?#]/)[0].split('/').pop() ?? '';
  try { name = decodeURIComponent(name); } catch { /* keep as is */ }
  // A CMS image is re-hosted with a second id in front: "<id>_<id>_rosso_01.jpeg".
  return name.replace(/^(?:[0-9a-f]{24}_)+/i, '').replace(/-p-\d+(?=\.[a-z0-9]+$)/i, '');
}

export function normalize(raw: RawData): Normalized {
  const warnings: string[] = [];

  // ---- groups and options
  const groups: Group[] = [];
  const groupSort = new Map<Group, number>();
  const findGroup = (ref: string): Group | undefined => {
    const t = norm(ref);
    return groups.find((g) => norm(g.code) === t) ?? groups.find((g) => norm(g.title) === t);
  };
  const addGroup = (g: RawGroup, index: number): Group => {
    const title = str(g.title) || str(g.code);
    const code = slug(str(g.code) || title) || `group-${index + 1}`;
    const existing = findGroup(code);
    if (existing) return existing;
    const group: Group = {
      code,
      kind: kindOf(g.kind, code),
      title: title || code,
      onRenders: g.onRenders === undefined || g.onRenders === '' ? true : truthy(g.onRenders),
      options: [],
    };
    groups.push(group);
    groupSort.set(group, num(g.sort, 1000 + index));
    return group;
  };

  const rawOptions: { group: Group; option: RawOption; index: number }[] = [];
  (raw.groups ?? []).forEach((g, i) => {
    const group = addGroup(g, i);
    for (const o of g.options ?? []) rawOptions.push({ group, option: o, index: rawOptions.length });
  });
  for (const o of raw.options ?? []) {
    const ref = str(o.group);
    if (!ref) {
      warnings.push(`Option "${str(o.name) || str(o.code)}" has no group (tcfg-group); it is skipped.`);
      continue;
    }
    const group = findGroup(ref) ?? addGroup({ code: ref, title: ref }, groups.length);
    rawOptions.push({ group, option: o, index: rawOptions.length });
  }

  for (const { group, option: o } of sorted(rawOptions, (x) => x.option.sort)) {
    const name = str(o.name) || str(o.code);
    if (!name) {
      warnings.push(`An option of "${group.title}" has no name; it is skipped.`);
      continue;
    }
    const code = slug(str(o.code) || name);
    if (group.options.some((x) => x.code === code)) {
      warnings.push(`"${group.title}" has two options with the code "${code}"; the second is skipped.`);
      continue;
    }
    const option: Option = {
      code,
      name,
      note: str(o.note),
      swatch: str(o.swatch) || null,
      image: image(o.image),
      isDefault: truthy(o.default),
      priceCents: parseAmount(o.price ?? null),
    };
    group.options.push(option);
  }
  // A paint or choice group starts with one option: keep only the first default.
  for (const g of groups) {
    if (g.kind === 'toggle') continue;
    let seen = false;
    for (const o of g.options) {
      if (o.isDefault && seen) o.isDefault = false;
      if (o.isDefault) seen = true;
    }
  }
  const paintGroups = groups.filter((g) => g.kind === 'paint');
  for (const extra of paintGroups.slice(1)) {
    warnings.push(`Only one paint group is supported; "${extra.title}" is treated as a choice.`);
    extra.kind = 'choice';
  }
  const ordered = sorted(groups, (g) => groupSort.get(g)).filter((g) => {
    if (g.options.length) return true;
    warnings.push(`Group "${g.title}" has no options; it is not shown.`);
    return false;
  });
  const paint = ordered.find((g) => g.kind === 'paint') ?? null;

  // ---- renders
  const renders = (raw.renders ?? []).map((r) => (typeof r === 'string' ? { src: r } : r)).filter((r) => r && r.src);
  const paints: NamedCode[] = paint ? paintNames(paint.options) : [{ code: NO_PAINT, name: NO_PAINT }];
  const renderOptions: RenderOptionName[] = [];
  for (const g of ordered) {
    if (g.kind === 'paint' || !g.onRenders) continue;
    const def = g.kind === 'choice' ? (g.options.find((o) => o.isDefault) ?? g.options[0]).code : null;
    for (const o of g.options) {
      renderOptions.push({
        id: `${g.code}:${o.code}`,
        code: o.code,
        name: o.name,
        group: g.code,
        groupTitle: g.title,
        choice: g.kind === 'choice',
        isDefault: g.kind === 'choice' ? o.code === def : o.isDefault,
      });
    }
  }

  let views: View[] = sorted(raw.views ?? [], (v) => v.sort)
    .map((v, i) => {
      const code = str(v.code) || String(i + 1).padStart(2, '0');
      return { code, name: str(v.name) || code };
    })
    .filter((v, i, all) => all.findIndex((x) => x.code === v.code) === i);
  if (!views.length) views = viewsFromRenders(renders);
  const viewNames: NamedCode[] = views.map((v) => ({ code: v.code, name: v.name }));

  const base: Record<string, Record<string, Image>> = {};
  const sets: Record<string, Map<string, RenderSet>> = {};
  for (const r of renders) {
    const file = fileNameOf(r.src);
    const explicitPaint = str(r.paint);
    const explicitView = str(r.view);
    const paintCode = !paint ? NO_PAINT : explicitPaint ? matchPaint(explicitPaint, paints) : null;
    if (paint && explicitPaint && !paintCode) {
      warnings.push(`Render ${file}: unknown paint "${explicitPaint}".`);
      continue;
    }
    const fromName = mapRenderFile(file, paints, viewNames, paintCode, renderOptions);
    const p = paintCode ?? fromName.paint;
    const view = explicitView ? matchView(explicitView, viewNames) ?? matchView(slug(explicitView), viewNames) : fromName.view;
    let entries: string[] | null;
    let problem: string | null = null;
    if (r.set !== undefined && r.set !== null) {
      const found = optionTokens(str(r.set).replace(/[,;&]/g, '+'), renderOptions);
      const decided = decideEntries(found.named, found.unknown);
      entries = decided.entries;
      problem = decided.problem;
    } else {
      entries = fromName.entries;
      problem = fromName.optionProblem;
    }
    if (!p) { warnings.push(`Render ${file}: no paint found (name it in the file or set tcfg-paint).`); continue; }
    if (!view) { warnings.push(`Render ${file}: no view found (a number in the file name, or tcfg-view).`); continue; }
    if (!entries) { warnings.push(`Render ${file}: ${problem ?? 'unknown combination'}.`); continue; }
    const img: Image = { src: r.src, srcset: r.srcset ?? null };
    if (!entries.length) {
      const byView = (base[p] ??= {});
      if (byView[view]) { warnings.push(`Render ${file}: ${p} view ${view} (base) is given twice; the first is used.`); continue; }
      byView[view] = img;
    } else {
      const key = setKey(entries);
      const map = (sets[p] ??= new Map());
      let set = map.get(key);
      if (!set) map.set(key, (set = { entries: sortEntries(entries, renderOptions), views: {} }));
      if (set.views[view]) { warnings.push(`Render ${file}: ${p} view ${view} (${entries.join(' + ')}) is given twice; the first is used.`); continue; }
      set.views[view] = img;
    }
  }

  const renderSets: Record<string, RenderSet[]> = {};
  for (const [p, map] of Object.entries(sets)) {
    renderSets[p] = [...map.values()].sort((a, b) => a.entries.length - b.entries.length);
  }
  for (const w of warnings) console.warn(`[tcfg] ${w}`);
  return { model: { views, groups: ordered, renders: base, renderSets }, warnings };
}

/** Paints by code and name, plus the first word of the name when no other
 *  paint starts with it: "rosso_02.jpg" finds "Rosso Cordoba". */
function paintNames(options: Option[]): NamedCode[] {
  const out: NamedCode[] = options.map((o) => ({ code: o.code, name: o.name }));
  const first = (o: Option) => norm(o.name.split(/[\s-]+/)[0] ?? '');
  for (const o of options) {
    const word = first(o);
    if (word && options.filter((x) => first(x) === word).length === 1) out.push({ code: o.code, name: word });
  }
  return out;
}

/** Entries in configurator order (group order, then option order). */
function sortEntries(entries: string[], options: RenderOptionName[]): string[] {
  const rank = (e: string) => options.findIndex((o) => o.id === e.replace(/^!/, ''));
  return [...entries].sort((a, b) => rank(a) - rank(b));
}

/** No declared views: every view code a render names — its tcfg-view, or
 *  the last number in its file name — in numeric order, "1" and "01" as one. */
function viewsFromRenders(renders: RawRender[]): View[] {
  const codes = new Map<string, string>();
  for (const r of renders) {
    let code = str(r.view);
    if (!code) {
      const { stem } = splitPath(fileNameOf(r.src));
      const head = stem.includes('_') && !/^\d+$/.test(stem.slice(stem.lastIndexOf('_') + 1)) ? stem.slice(0, stem.lastIndexOf('_')) : stem;
      const nums = tokens(head).filter((t) => /^\d+$/.test(t));
      code = nums.length ? nums[nums.length - 1] : '';
    }
    if (!code) continue;
    const key = /^\d+$/.test(code) ? String(Number(code)) : code.toLowerCase();
    if (!codes.has(key)) codes.set(key, /^\d+$/.test(code) ? String(Number(code)).padStart(2, '0') : code);
  }
  return [...codes.values()]
    .sort((a, b) => (/^\d+$/.test(a) && /^\d+$/.test(b) ? Number(a) - Number(b) : a.localeCompare(b)))
    .map((code) => ({ code, name: code }));
}
