/* Bulk render upload: which paint, which option combination (render set)
   and which camera view does a file belong to, judging by its name? Pure,
   shared by the render matrix screen and the tests.

   Supported shapes (case-insensitive, any image extension):

     rosso/01.jpg                 folder = paint code, file = view code
     renders/Rosso Cordoba/1.jpg  folder may be the paint's name; "1" = "01"
     01.jpg                       paint = the one selected in the screen
     Quartetto.01.jpg             scene/model prefix from a KeyShot export;
                                  paint = selected, view = the number
     rosso_03.png, oro.0007.jpg   paint and view in one name (frame numbers
                                  with leading zeros are fine)

   Render sets (docs/ARCHITECTURE.md → "Render sets"). The base renders
   are the DEFAULT BUILD (default wheels, every toggle in its default state,
   e.g. WITH helmet shell); a set names how its renders DEVIATE from it:

     rosso/01.jpg                       the base set (the default build)
     rosso/rolkooi/05.jpg               a folder INSIDE the paint folder names
                                        the deviations: roll cage ON
     rosso/zonder-helmet-shell/05.jpg   helmet shell OFF ("zonder-", "without-",
                                        "no-" and "geen-" in front of an option)
     rosso/rolkooi+zonder-helmet-shell/05.jpg   several, joined by "+"
     rosso/billet/05.jpg                a choice: the option the render shows
     rosso/05_zonder-helmet-shell.jpg   or a suffix after the view: "_" + names
     rosso_05_rolkooi.jpg               (works with every shape above)
     rosso/basis/05.jpg                 "basis" (or "base") = the base set

   A name for an option in its DEFAULT state ("helmet-shell" while the
   helmet shell is on by default, "zonder-rolkooi", "stradale") changes
   nothing: it is the same as the default build, so it is left out (the row
   says "= basis" / "… = standaard" so staff notice).

   Rules: the view is the LAST number in the file name that matches a view
   code (so a date or a version in front of it does not win). The paint is a
   path segment or name token that equals a paint's code or its full name
   (letters and digits only, so "Rosso Cordoba" = "rosso-cordoba"); the file
   name wins over folders, the nearest folder over outer ones. Nothing found
   falls back to the selected paint. An option token equals an option's code
   or name the same way (accents and case do not matter) and must belong to
   a group that is visible on renders. Folders deeper than the paint folder
   and a suffix after the view are ALWAYS option names: an unknown one makes
   the row a problem ("Onbekende optie"), so a typo never lands a roll-cage
   render on the base set. A folder above the paint folder (or any folder
   when the paint came from the file name or the selected paint) only counts
   when every token in it is a known option; otherwise it is ignored, as
   before. */

export interface NamedCode {
  code: string;
  name: string;
}

/** An option that may appear in a render set (non-paint, visible on renders). */
export interface RenderOptionName extends NamedCode {
  id: string;
  /** Group id: at most one option per choice group. */
  group: string;
  /** Group title, for messages. */
  groupTitle: string;
  choice: boolean;
  /** Part of the default build (the choice group's default, a toggle that
   *  is on by default). */
  isDefault: boolean;
}

export type MappingStatus = 'ok' | 'no-paint' | 'no-view' | 'no-options' | 'duplicate' | 'not-image';

export interface ProposedMapping {
  /** Index into the input list. */
  index: number;
  path: string;
  paint: string | null;
  view: string | null;
  /** Entries of the render set as signed option ids ('<id>' = shown / on,
   *  '!<id>' = a toggle off); [] = the base set; null = not decided
   *  (unknown option names: see `optionProblem`). */
  entries: string[] | null;
  /** Names the path gave for options in their DEFAULT state ("Helmet
   *  Shell", "zonder Roll cage"): left out of `entries`, shown in the table
   *  ("= basis") so staff notice. */
  asDefault: string[];
  /** How the paint was found, for the confirmation table. */
  paintFrom: 'name' | 'folder' | 'selected' | null;
  /** Where the options came from (null = none named: the base set). */
  optionsFrom: 'folder' | 'name' | null;
  /** Why the options could not be decided, e.g. 'Onbekende optie: rolkoi'. */
  optionProblem: string | null;
  status: MappingStatus;
}

const IMAGE_EXT = /\.(jpe?g|jfif|png|webp|avif|tiff?|heic|gif|svg)$/i;
/** Spelled-out "no options". */
const BASE_TOKENS = new Set(['basis', 'base', 'standaard', 'default']);
/** "zonder-helmet-shell": the option OFF (longest first; matched on the
 *  normalised token, after an exact option match failed). */
const OFF_PREFIXES = ['without', 'zonder', 'geen', 'no'];
/** "met-rolkooi", "with-roll-cage", "plus-roll-cage": the option ON, said
 *  out loud (Webflow module addition). */
const ON_PREFIXES = ['with', 'plus', 'met'];

export function norm(value: string): string {
  return value.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function splitPath(path: string): { folders: string[]; stem: string } {
  const segments = path.split(/[\\/]+/).filter(Boolean);
  const file = segments.pop() ?? '';
  return { folders: segments, stem: file.replace(/\.[^.]+$/, '') };
}

export function tokens(stem: string): string[] {
  return stem.split(/[\s._\-+()[\]]+/).filter(Boolean);
}

/** '1', '01', '0001' all mean view '01' when that code exists. Non-numeric
 *  view codes are matched literally. */
export function matchView(token: string, views: NamedCode[]): string | null {
  const t = token.toLowerCase();
  const literal = views.find((v) => v.code.toLowerCase() === t);
  if (literal) return literal.code;
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  const numeric = views.find((v) => /^\d+$/.test(v.code) && Number(v.code) === n);
  return numeric ? numeric.code : null;
}

export function matchPaint(text: string, paints: NamedCode[]): string | null {
  const t = norm(text);
  if (!t) return null;
  const hit = paints.find((p) => norm(p.code) === t) ?? paints.find((p) => norm(p.name) === t);
  return hit ? hit.code : null;
}

function paintFromTokens(parts: string[], paints: NamedCode[]): string | null {
  // Single tokens first ("rosso"), then adjacent pairs/triples so a name
  // with spaces inside a file name ("Rosso Cordoba 01") still matches.
  for (const t of parts) {
    const hit = matchPaint(t, paints);
    if (hit) return hit;
  }
  for (let size = 2; size <= 3; size++) {
    for (let i = 0; i + size <= parts.length; i++) {
      const hit = matchPaint(parts.slice(i, i + size).join(''), paints);
      if (hit) return hit;
    }
  }
  return null;
}

function findOption(t: string, options: RenderOptionName[]): RenderOptionName[] {
  const hits = options.filter((o) => norm(o.code) === t);
  return hits.length ? hits : options.filter((o) => norm(o.name) === t);
}

/** One token's meaning, in the order a text names them. */
interface Named {
  option: RenderOptionName;
  on: boolean;
}

/** Entries for one "+"-joined text ("rolkooi+zonder-helmet-shell"): the
 *  options with their state, the unknown tokens, and whether it said
 *  "basis". A token is an option's code or name (the option ON / the choice
 *  it shows), or "zonder-", "without-", "geen-" or "no-" + one (OFF).
 *  Ambiguous tokens (an option code in two groups) count as unknown. */
export function optionTokens(text: string, options: RenderOptionName[]): { named: Named[]; unknown: string[]; base: boolean } {
  const named: Named[] = [];
  const unknown: string[] = [];
  let base = false;
  for (const raw of text.split('+').map((t) => t.trim()).filter(Boolean)) {
    const t = norm(raw);
    if (BASE_TOKENS.has(t)) { base = true; continue; }
    const hits = findOption(t, options);
    if (hits.length === 1) { named.push({ option: hits[0], on: true }); continue; }
    let off: RenderOptionName | null = null;
    if (!hits.length) {
      for (const prefix of OFF_PREFIXES) {
        if (t.length <= prefix.length || !t.startsWith(prefix)) continue;
        const rest = findOption(t.slice(prefix.length), options);
        if (rest.length === 1) { off = rest[0]; break; }
      }
    }
    let on: RenderOptionName | null = null;
    if (!hits.length && !off) {
      for (const prefix of ON_PREFIXES) {
        if (t.length <= prefix.length || !t.startsWith(prefix)) continue;
        const rest = findOption(t.slice(prefix.length), options);
        if (rest.length === 1) { on = rest[0]; break; }
      }
    }
    if (off) named.push({ option: off, on: false });
    else if (on) named.push({ option: on, on: true });
    else unknown.push(raw);
  }
  return { named, unknown, base };
}

/** "Helmet Shell" / "zonder Roll cage" for messages and the table. */
export function namedLabel(n: Named): string {
  return n.on ? n.option.name : `zonder ${n.option.name}`;
}

/** Decides the set's entries from what the path named: duplicates dropped,
 *  names in the default state left out (reported as `asDefault`), at most
 *  one option per choice group, a toggle in one state only, a choice never
 *  "zonder". */
export function decideEntries(named: Named[], unknown: string[]):
  { entries: string[] | null; asDefault: string[]; problem: string | null } {
  if (unknown.length) {
    return { entries: null, asDefault: [], problem: `Onbekende optie${unknown.length === 1 ? '' : 's'}: ${unknown.join(', ')}` };
  }
  const byOption = new Map<string, Named>();
  for (const n of named) {
    const seen = byOption.get(n.option.id);
    if (seen && seen.on !== n.on) {
      return { entries: null, asDefault: [], problem: `${n.option.name} staat er zowel mét als zonder in` };
    }
    byOption.set(n.option.id, n);
  }
  const unique = [...byOption.values()];
  const choiceOff = unique.find((n) => n.option.choice && !n.on);
  if (choiceOff) {
    return { entries: null, asDefault: [], problem: `"zonder ${choiceOff.option.name}" kan niet: noem de ${choiceOff.option.groupTitle.toLowerCase()} die wél op de render staat` };
  }
  const byGroup = new Map<string, RenderOptionName[]>();
  for (const n of unique) if (n.option.choice) byGroup.set(n.option.group, [...(byGroup.get(n.option.group) ?? []), n.option]);
  for (const list of byGroup.values()) {
    if (list.length > 1) {
      return { entries: null, asDefault: [], problem: `Eén optie uit ${list[0].groupTitle} per render: ${list.map((o) => o.name).join(' of ')}?` };
    }
  }
  const isDefaultState = (n: Named) => (n.option.choice ? n.option.isDefault : n.on === n.option.isDefault);
  return {
    entries: unique.filter((n) => !isDefaultState(n)).map((n) => (n.on ? n.option.id : `!${n.option.id}`)),
    asDefault: unique.filter(isDefaultState).map(namedLabel),
    problem: null,
  };
}

export function mapRenderFile(
  path: string,
  paints: NamedCode[],
  views: NamedCode[],
  selectedPaint: string | null,
  options: RenderOptionName[] = [],
): Omit<ProposedMapping, 'index' | 'status'> & { status: Exclude<MappingStatus, 'duplicate'> } {
  if (!IMAGE_EXT.test(path)) {
    return { path, paint: null, view: null, entries: null, asDefault: [], paintFrom: null, optionsFrom: null, optionProblem: null, status: 'not-image' };
  }
  const { folders, stem } = splitPath(path);

  // An option suffix: the part after the last "_", when it is not itself
  // the view and the part before it holds the view ("05_rolkooi+zonder-helmet").
  let nameStem = stem;
  let suffix: string | null = null;
  const cut = stem.lastIndexOf('_');
  if (cut > 0 && cut < stem.length - 1) {
    const head = stem.slice(0, cut);
    const tail = stem.slice(cut + 1);
    if (!matchView(tail, views) && tokens(head).some((t) => matchView(t, views))) {
      nameStem = head;
      suffix = tail;
    }
  }
  const parts = tokens(nameStem);

  let view: string | null = null;
  for (let i = parts.length - 1; i >= 0 && !view; i--) view = matchView(parts[i], views);

  let paint: string | null = paintFromTokens(parts.filter((p) => !/^\d+$/.test(p)), paints);
  let paintFrom: ProposedMapping['paintFrom'] = paint ? 'name' : null;
  let paintFolder = -1;
  for (let i = folders.length - 1; i >= 0 && !paint; i--) {
    paint = matchPaint(folders[i], paints) ?? paintFromTokens(tokens(folders[i]), paints);
    if (paint) { paintFrom = 'folder'; paintFolder = i; }
  }
  if (!paint && selectedPaint && paints.some((p) => p.code === selectedPaint)) {
    paint = selectedPaint;
    paintFrom = 'selected';
  }

  // Options: strict below the paint folder and in the suffix, lenient elsewhere.
  const named: Named[] = [];
  const unknown: string[] = [];
  let optionsFrom: ProposedMapping['optionsFrom'] = null;
  for (const [i, folder] of folders.entries()) {
    if (i === paintFolder) continue;
    const found = optionTokens(folder, options);
    const strict = paintFolder >= 0 && i > paintFolder;
    if (!strict && (found.unknown.length || (!found.named.length && !found.base))) continue;
    named.push(...found.named);
    unknown.push(...found.unknown);
    if (found.named.length || found.unknown.length || found.base) optionsFrom ??= 'folder';
  }
  if (suffix !== null) {
    const found = optionTokens(suffix, options);
    named.push(...found.named);
    unknown.push(...found.unknown);
    optionsFrom = 'name';
  }
  const decided = decideEntries(named, unknown);

  const status = !paint ? 'no-paint' : !view ? 'no-view' : decided.entries === null ? 'no-options' : 'ok';
  return {
    path, paint, view, entries: decided.entries, asDefault: decided.asDefault, paintFrom, optionsFrom, optionProblem: decided.problem, status,
  };
}

/** The render-set part of a cell key: the entries sorted by option id. */
function entriesKey(entries: string[] | null): string {
  return entries ? [...entries].sort((a, b) => (a.replace(/^!/, '') < b.replace(/^!/, '') ? -1 : 1)).join(',') : '';
}

/** Maps a whole drop. When two files land on the same cell (paint ×
 *  combination × view), the first one in the list is kept and the others
 *  are marked duplicate (the screen sorts the list by path first). */
export function proposeMapping(
  paths: string[],
  paints: NamedCode[],
  views: NamedCode[],
  selectedPaint: string | null,
  options: RenderOptionName[] = [],
): ProposedMapping[] {
  const out = paths.map((path, index) => ({ index, ...mapRenderFile(path, paints, views, selectedPaint, options) }) as ProposedMapping);
  return markDuplicates(out);
}

export function markDuplicates(rows: ProposedMapping[]): ProposedMapping[] {
  const seen = new Set<string>();
  const order = [...rows].sort((a, b) => a.index - b.index);
  const dupes = new Set<number>();
  for (const row of order) {
    if (row.status !== 'ok' && row.status !== 'duplicate') continue;
    const cell = `${row.paint}\u0000${entriesKey(row.entries)}\u0000${row.view}`;
    if (seen.has(cell)) dupes.add(row.index);
    else seen.add(cell);
  }
  return rows.map((r) => {
    if (dupes.has(r.index)) return { ...r, status: 'duplicate' as const };
    if (r.status === 'duplicate') return { ...r, status: 'ok' as const };
    return r;
  });
}

/** After the user changes a row by hand: recompute its status. */
export function restatus(row: ProposedMapping): ProposedMapping {
  if (row.status === 'not-image') return row;
  const entries = row.entries === undefined ? [] : row.entries;
  return {
    ...row,
    entries,
    optionProblem: entries === null ? row.optionProblem : null,
    status: !row.paint ? 'no-paint' : !row.view ? 'no-view' : entries === null ? 'no-options' : 'ok',
  };
}
