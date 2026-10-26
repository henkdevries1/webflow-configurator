/* Which render to show for a build — the render-set resolver.
   Ported from the Venduetto configurator (src/lib/configurator/render-match.ts).

   - The BASE set of a paint is the DEFAULT BUILD: each visual choice group's
     default option, each visual toggle in its default state. If the helmet
     shell is ON by default, the base renders show it.
   - Any other set lists explicit ENTRIES, its deviations from the default
     build: a choice option ('wheels:billet'), a toggle ON
     ('cockpit:roll-cage') or a toggle OFF ('!cockpit:helmet-shell').

   A "unit" is one visual choice group or one visual toggle option (groups
   with onRenders === false and the paint group take no part). What a set
   DEPICTS for a unit = its explicit entry when it has one, else the default.

   For one view:
   1. Qualify: the set has a render of the view AND every explicit entry
      agrees with the visitor's build (a render never shows a deviation the
      visitor did not choose). The base always qualifies when it has the view.
   2. Score: the number of units the set depicts as the visitor chose them.
   3. Ties: fewer explicit entries first, then entries earlier in configurator
      order, then input order. Deterministic.
   4. `exact` = every unit is depicted as chosen. `differs` lists, per unit,
      what the render shows INSTEAD: 'wheels:stradale', 'cockpit:helmet-shell'
      (shown WITH), '!cockpit:roll-cage' (shown WITHOUT).

   Options are referenced as '<group code>:<option code>'. Pure and
   import-free: runs in the browser and under `node --test`. */

import type { GroupKind } from './types.ts';

/** '<group code>:<option code>', e.g. 'cockpit:roll-cage'. */
export type OptionRef = string;

/** An explicit entry of a render set: an OptionRef (a choice option, or a
 *  toggle ON) or '!' + OptionRef (a toggle OFF). */
export type EntryRef = string;

export function optionRef(group: string, option: string): OptionRef {
  return `${group}:${option}`;
}

export function parseOptionRef(ref: OptionRef): { group: string; option: string } | null {
  const i = ref.indexOf(':');
  return i > 0 && i < ref.length - 1 ? { group: ref.slice(0, i), option: ref.slice(i + 1) } : null;
}

export function entryRef(ref: OptionRef, on = true): EntryRef {
  return on ? ref : `!${ref}`;
}

/** 'cockpit:roll-cage' → on; '!cockpit:helmet-shell' → off. */
export function parseEntryRef(entry: EntryRef): { ref: OptionRef; on: boolean } {
  return entry.startsWith('!') ? { ref: entry.slice(1), on: false } : { ref: entry, on: true };
}

export interface MatchGroup {
  code: string;
  kind: GroupKind;
  /** Choice/toggle: visible on the renders. Absent = true. */
  onRenders?: boolean;
  /** In configurator order. */
  options: readonly { code: string; isDefault: boolean }[];
}

export interface RenderSetLike<I> {
  /** Explicit entries (EntryRef); empty = the base set (the default build). */
  entries: readonly EntryRef[];
  /** view code → image. */
  views: Readonly<Record<string, I>>;
}

/** What the visitor chose (BuildState / BuildConfig fit). Paint is not part
 *  of it: the sets passed in are already the paint's. */
export interface MatchSelection {
  /** choice group code → option code; a missing group = its default. */
  choices: Readonly<Record<string, string>>;
  /** toggle group code → the option codes that are on. */
  toggles: Readonly<Record<string, readonly string[]>>;
}

export interface RenderMatch<I> {
  image: I;
  set: RenderSetLike<I>;
  /** Every visual group and toggle is depicted as chosen. */
  exact: boolean;
  /** What the render shows where it differs from the build, one entry per
   *  choice group / toggle, in configurator order: 'wheels:stradale',
   *  'cockpit:helmet-shell' (shown with), '!cockpit:roll-cage' (shown
   *  without). Empty when exact. */
  differs: EntryRef[];
}

export function isVisualGroup(g: Pick<MatchGroup, 'kind' | 'onRenders'>): boolean {
  return g.kind !== 'paint' && g.onRenders !== false;
}

/** One visual choice group, or one visual toggle option. */
interface Unit {
  /** Choice: the group code; toggle: the option ref. */
  key: string;
  group: string;
  choice: boolean;
  /** Choice: option code; toggle: on. */
  def: string | boolean;
  chosen: string | boolean;
}

/** The selection, digested once for many lookups (all views of a paint). */
export interface PreparedSelection {
  /** Visual units in configurator order. */
  units: readonly Unit[];
  /** Every visual option ref → its unit, the value it stands for and its
   *  position in configurator order. */
  refs: ReadonlyMap<OptionRef, { unit: Unit; value: string | boolean; rank: number }>;
}

export function prepareSelection(groups: readonly MatchGroup[], selection: MatchSelection): PreparedSelection {
  const units: Unit[] = [];
  const refs = new Map<OptionRef, { unit: Unit; value: string | boolean; rank: number }>();
  for (const g of groups) {
    if (!isVisualGroup(g) || !g.options.length) continue;
    if (g.kind === 'choice') {
      const def = (g.options.find((o) => o.isDefault) ?? g.options[0]).code;
      const picked = selection.choices[g.code];
      const chosen = picked && g.options.some((o) => o.code === picked) ? picked : def;
      const unit: Unit = { key: g.code, group: g.code, choice: true, def, chosen };
      units.push(unit);
      for (const o of g.options) refs.set(optionRef(g.code, o.code), { unit, value: o.code, rank: refs.size });
    } else {
      const on = new Set(selection.toggles[g.code] ?? []);
      for (const o of g.options) {
        const ref = optionRef(g.code, o.code);
        const unit: Unit = { key: ref, group: g.code, choice: false, def: o.isDefault, chosen: on.has(o.code) };
        units.push(unit);
        refs.set(ref, { unit, value: true, rank: refs.size });
      }
    }
  }
  return { units, refs };
}

/** What a unit's value reads as an entry ref. */
function asEntry(unit: Unit, value: string | boolean): EntryRef {
  return unit.choice ? optionRef(unit.group, value as string) : entryRef(unit.key, value as boolean);
}

interface Scored<I> {
  set: RenderSetLike<I>;
  index: number;
  score: number;
  ranks: number[];
  explicit: Map<string, string | boolean>;
}

/** null when the set does not qualify: an entry the visitor did not choose,
 *  or one that is unknown, of a hidden group, a choice "off", or two
 *  entries for the same unit. */
function score<I>(p: PreparedSelection, set: RenderSetLike<I>, index: number): Scored<I> | null {
  const explicit = new Map<string, string | boolean>();
  const ranks: number[] = [];
  for (const raw of set.entries) {
    const { ref, on } = parseEntryRef(raw);
    const hit = p.refs.get(ref);
    if (!hit) return null;
    if (hit.unit.choice && !on) return null;
    const value = hit.unit.choice ? hit.value : on;
    if (explicit.has(hit.unit.key)) return null;
    if (value !== hit.unit.chosen) return null;
    explicit.set(hit.unit.key, value);
    ranks.push(hit.rank);
  }
  let n = 0;
  for (const u of p.units) if ((explicit.has(u.key) ? explicit.get(u.key) : u.def) === u.chosen) n++;
  return { set, index, score: n, ranks: ranks.sort((a, b) => a - b), explicit };
}

/** > 0 when a is the better pick. */
function compare<I>(a: Scored<I>, b: Scored<I>): number {
  if (a.score !== b.score) return a.score - b.score;
  if (a.ranks.length !== b.ranks.length) return b.ranks.length - a.ranks.length;
  for (let i = 0; i < a.ranks.length; i++) if (a.ranks[i] !== b.ranks[i]) return b.ranks[i] - a.ranks[i];
  return b.index - a.index;
}

/** The render for `view`, or null when no set may show it (see the rules
 *  at the top). `sets` are the paint's sets, the base set included. Pass a
 *  `prepared` selection when resolving many views. */
export function resolveRender<I>(
  groups: readonly MatchGroup[],
  sets: readonly RenderSetLike<I>[],
  selection: MatchSelection,
  view: string,
  prepared: PreparedSelection = prepareSelection(groups, selection),
): RenderMatch<I> | null {
  let best: Scored<I> | null = null;
  for (let index = 0; index < sets.length; index++) {
    const set = sets[index];
    if (!Object.prototype.hasOwnProperty.call(set.views, view) || set.views[view] == null) continue;
    const s = score(prepared, set, index);
    if (s && (!best || compare(s, best) > 0)) best = s;
  }
  if (!best) return null;
  const b: Scored<I> = best;
  const differs: EntryRef[] = [];
  for (const u of prepared.units) {
    const shown = b.explicit.has(u.key) ? b.explicit.get(u.key)! : u.def;
    if (shown !== u.chosen) differs.push(asEntry(u, shown));
  }
  return { image: b.set.views[view], set: b.set, exact: differs.length === 0, differs };
}

/** Every view (in the given order) that has a render for this selection —
 *  the thumbnails strip — with the match per view. */
export function viewsForSelection<I>(
  groups: readonly MatchGroup[],
  sets: readonly RenderSetLike<I>[],
  selection: MatchSelection,
  viewOrder: readonly string[],
): { view: string; match: RenderMatch<I> }[] {
  const prepared = prepareSelection(groups, selection);
  const out: { view: string; match: RenderMatch<I> }[] = [];
  for (const view of viewOrder) {
    const match = resolveRender(groups, sets, selection, view, prepared);
    if (match) out.push({ view, match });
  }
  return out;
}

/** The default build's state of every visual unit, as entry refs in
 *  configurator order: what the base set depicts ('wheels:stradale',
 *  '!cockpit:roll-cage', 'cockpit:helmet-shell'). */
export function defaultEntries(groups: readonly MatchGroup[]): EntryRef[] {
  return prepareSelection(groups, { choices: {}, toggles: {} }).units.map((u) => asEntry(u, u.def));
}

/** Entries that only restate the default build (redundant: such a set
 *  depicts the same as the base for that unit). Unknown entries are left
 *  out. */
export function redundantEntries(groups: readonly MatchGroup[], entries: readonly EntryRef[]): EntryRef[] {
  const defaults = new Set(defaultEntries(groups));
  return entries.filter((e) => defaults.has(e));
}

// ---------------------------------------------------------------- on the public model

/** The parts of the public ConfiguratorModel (src/components/configurator/
 *  model.ts) the helpers below need. */
export interface RenderModelGroup extends MatchGroup {
  options: readonly { code: string; isDefault: boolean; name?: string }[];
}

export interface RenderModel<I> {
  views: readonly { code: string }[];
  groups: readonly RenderModelGroup[];
  /** Base set: paint code → view code → image. */
  renders: Readonly<Record<string, Readonly<Record<string, I>>>>;
  /** The other sets per paint code (never the base). */
  renderSets?: Readonly<Record<string, readonly RenderSetLike<I>[]>>;
}

/** A paint's sets: the base set first, then the other sets. */
export function renderSetsFor<I>(model: RenderModel<I>, paint: string | null): RenderSetLike<I>[] {
  if (!paint) return [];
  return [{ entries: [], views: model.renders[paint] ?? {} }, ...(model.renderSets?.[paint] ?? [])];
}

/** The render of `view` for a build (paint + choices + toggles). */
export function resolveModelRender<I>(
  model: RenderModel<I>,
  state: MatchSelection & { paint: string | null },
  view: string,
): RenderMatch<I> | null {
  return resolveRender(model.groups, renderSetsFor(model, state.paint), state, view);
}

/** Views with a render for this build, in camera order. */
export function modelViewsFor<I>(
  model: RenderModel<I>,
  state: MatchSelection & { paint: string | null },
): { view: string; match: RenderMatch<I> }[] {
  return viewsForSelection(model.groups, renderSetsFor(model, state.paint), state, model.views.map((v) => v.code));
}

/** Option names for refs or entry refs ("Roll cage"; the '!' is ignored).
 *  Unknown refs are left out. */
export function optionNames(model: Pick<RenderModel<unknown>, 'groups'>, refs: readonly EntryRef[]): string[] {
  const out: string[] = [];
  for (const entry of refs) {
    const r = parseOptionRef(parseEntryRef(entry).ref);
    const o = r && model.groups.find((g) => g.code === r.group)?.options.find((x) => x.code === r.option);
    if (o) out.push(o.name ?? o.code);
  }
  return out;
}
