/* The build state and everything derived from it: which views a build has,
   the render per view, the hint when a render does not show the whole
   build, the summary and the price indication. Pure; ported from the
   Venduetto configurator (src/components/configurator/model.ts) with the
   copy moved to labels.ts. */

import { modelViewsFor, parseEntryRef, parseOptionRef, resolveModelRender, type RenderMatch } from './resolve.ts';
import { fill, formatMoney, list, type Labels, type MoneyFormat } from './labels.ts';
import { NO_PAINT, type BuildState, type Group, type Image, type Model, type Option, type View } from './types.ts';

export type StageRender = RenderMatch<Image>;
export type BuildSelection = Pick<BuildState, 'paint' | 'choices' | 'toggles'>;

export function paintGroup(model: Model): Group | null {
  return model.groups.find((g) => g.kind === 'paint') ?? null;
}

/** Every view this build has a render for, in camera order, with its render. */
export function buildViews(model: Model, sel: BuildSelection): { view: View; render: StageRender }[] {
  if (!sel.paint) return [];
  const byCode = new Map(model.views.map((v) => [v.code, v]));
  return modelViewsFor(model, sel).map(({ view, match }) => ({ view: byCode.get(view)!, render: match }));
}

export function stageRender(model: Model, sel: BuildSelection, view: string | null): StageRender | null {
  return view && sel.paint ? resolveModelRender(model, sel, view) : null;
}

export function availableViews(model: Model, sel: BuildSelection): View[] {
  return buildViews(model, sel).map((x) => x.view);
}

/** Keep `current` if the build has it, else the nearest view it has (camera
 *  order; on a tie the following one). Without a current view: `preferred`
 *  when the build has it, else its first view. null without renders. */
export function resolveView(model: Model, sel: BuildSelection, current: string | null, preferred: string | null = null): string | null {
  const views = availableViews(model, sel);
  if (!views.length) return null;
  if (current && views.some((v) => v.code === current)) return current;
  const order = model.views.map((v) => v.code);
  const at = current ? order.indexOf(current) : -1;
  if (at < 0) return preferred && views.some((v) => v.code === preferred) ? preferred : views[0].code;
  let best = views[0].code;
  let dist = Infinity;
  for (const v of views) {
    const i = order.indexOf(v.code);
    const d = Math.abs(i - at);
    if (d < dist || (d === dist && i > at)) {
      best = v.code;
      dist = d;
    }
  }
  return best;
}

/** Next/previous view of this build, wrapping around. */
export function stepView(model: Model, sel: BuildSelection, view: string | null, delta: number): string | null {
  const views = availableViews(model, sel);
  if (!views.length) return null;
  const i = views.findIndex((v) => v.code === view);
  if (i < 0) return views[0].code;
  const n = views.length;
  return views[(((i + delta) % n) + n) % n].code;
}

/** "03 / 16" — position among this build's views. */
export function viewPosition(model: Model, sel: BuildSelection, view: string | null): string {
  const views = availableViews(model, sel);
  const i = views.findIndex((v) => v.code === view);
  return `${pad(i + 1)} / ${pad(views.length)}`;
}

/** "Oro Chiaro: 8 of 16 views rendered so far." — or null when complete. */
export function partialNote(model: Model, sel: BuildSelection, labels: Labels): string | null {
  const have = availableViews(model, sel).length;
  const total = model.views.length;
  if (!sel.paint || !have || have >= total) return null;
  const name = paintGroup(model)?.options.find((o) => o.code === sel.paint)?.name;
  if (!name) return null;
  return fill(labels.partial, { name, n: have, total });
}

/** The quiet line on the image when the render does not show the whole
 *  build: "Shown with Stradale wheels and helmet shell and without roll
 *  cage — not rendered yet". null when exact. */
export function renderHint(model: Model, render: Pick<StageRender, 'exact' | 'differs'> | null, labels: Labels): string | null {
  if (!render || render.exact) return null;
  const withItems: string[] = [];
  const withToggles: string[] = [];
  const without: string[] = [];
  for (const entry of render.differs) {
    const { ref, on } = parseEntryRef(entry);
    const r = parseOptionRef(ref);
    const g = r && model.groups.find((x) => x.code === r.group);
    const o = g?.options.find((x) => x.code === r!.option);
    if (!g || !o) continue;
    if (g.kind === 'choice') withItems.push(choiceLabel(o, g));
    else if (g.kind === 'toggle') (on ? withToggles : without).push(inSentence(o.name));
  }
  const withAll = [...withItems, ...withToggles];
  const parts: string[] = [];
  if (withAll.length) parts.push(`${labels.with} ${list(withAll, labels.and)}`);
  if (without.length) parts.push(`${labels.without} ${list(without, labels.and)}`);
  return parts.length ? fill(labels.shown, { list: parts.join(` ${labels.and} `) }) : null;
}

/** "Billet wheels": the option followed by its group title, unless the
 *  name already contains it ("Billet wheels" in group "Wheels"). */
export function choiceLabel(o: Pick<Option, 'name'>, g: Pick<Group, 'title'>): string {
  const title = g.title.trim().toLowerCase();
  if (!title || o.name.toLowerCase().includes(title)) return o.name;
  return `${o.name} ${title}`;
}

/** "Helmet Shell" → "helmet shell" inside a sentence; HANS, McLaren stay. */
function inSentence(name: string): string {
  return name.replace(/\b([A-Z])([a-z]*)\b/g, (_, a: string, rest: string) => a.toLowerCase() + rest);
}

/** Renders one click away in the current view, for preloading. */
export function nearbyRenders(model: Model, state: BuildState, limit = 6): StageRender[] {
  const now = stageRender(model, state, state.view);
  if (!now) return [];
  const seen = new Set([now.image.src]);
  const out: StageRender[] = [];
  for (const g of model.groups) {
    if (g.kind === 'paint' || !g.onRenders) continue;
    for (const o of g.options) {
      let next: BuildState;
      if (g.kind === 'toggle') next = withToggle(model, state, g.code, o.code);
      else if (state.choices[g.code] === o.code) continue;
      else next = { ...state, choices: { ...state.choices, [g.code]: o.code } };
      const r = stageRender(model, next, state.view);
      if (r && !seen.has(r.image.src)) {
        seen.add(r.image.src);
        out.push(r);
        if (out.length >= limit) return out;
      }
    }
  }
  return out;
}

export function initialState(model: Model, preferredView: string | null = null): BuildState {
  const choices: Record<string, string> = {};
  const toggles: Record<string, string[]> = {};
  let paint: string | null = paintGroup(model) ? null : NO_PAINT;
  for (const g of model.groups) {
    if (g.kind === 'toggle') {
      toggles[g.code] = g.options.filter((o) => o.isDefault).map((o) => o.code);
    } else if (g.options.length) {
      const code = (g.options.find((o) => o.isDefault) ?? g.options[0]).code;
      if (g.kind === 'paint') paint = code;
      else choices[g.code] = code;
    }
  }
  return { paint, view: resolveView(model, { paint, choices, toggles }, null, preferredView), choices, toggles };
}

/** The same build, looking at the view it should now show. */
export function settleView(model: Model, state: BuildState, preferred: string | null = null): BuildState {
  const view = resolveView(model, state, state.view, preferred);
  return view === state.view ? state : { ...state, view };
}

export function withPaint(model: Model, state: BuildState, paint: string): BuildState {
  return settleView(model, { ...state, paint });
}

export function withChoice(model: Model, state: BuildState, group: string, option: string): BuildState {
  return settleView(model, { ...state, choices: { ...state.choices, [group]: option } });
}

/** Flip one toggle; the list stays in the group's option order. */
export function withToggle(model: Model, state: BuildState, group: string, option: string): BuildState {
  const on = new Set(state.toggles[group] ?? []);
  if (on.has(option)) on.delete(option);
  else on.add(option);
  const order = model.groups.find((g) => g.code === group)?.options.map((o) => o.code) ?? [...on];
  return settleView(model, { ...state, toggles: { ...state.toggles, [group]: order.filter((c) => on.has(c)) } });
}

/** The options this build has chosen, in group order. */
export function chosenOptions(model: Model, state: BuildState): { group: Group; option: Option }[] {
  const out: { group: Group; option: Option }[] = [];
  for (const g of model.groups) {
    if (g.kind === 'paint') {
      const o = g.options.find((x) => x.code === state.paint);
      if (o) out.push({ group: g, option: o });
    } else if (g.kind === 'choice') {
      const o = g.options.find((x) => x.code === state.choices[g.code]);
      if (o) out.push({ group: g, option: o });
    } else {
      const on = state.toggles[g.code] ?? [];
      for (const o of g.options) if (on.includes(o.code)) out.push({ group: g, option: o });
    }
  }
  return out;
}

/** "Rosso Cordoba · Stradale wheels · Helmet Shell". */
export function summarize(model: Model, state: BuildState): string {
  return chosenOptions(model, state)
    .map(({ group, option }) => (group.kind === 'choice' ? choiceLabel(option, group) : option.name))
    .join(' · ');
}

/** One line per group, for form fields and e-mails: "Wheels" → "Billet",
 *  "Cockpit" → "Roll cage, Helmet shell" (or "—"). */
export function summaryByGroup(model: Model, state: BuildState): { group: Group; value: string }[] {
  const chosen = chosenOptions(model, state);
  return model.groups.map((g) => {
    const names = chosen.filter((c) => c.group === g).map((c) => c.option.name);
    return { group: g, value: names.length ? names.join(', ') : '—' };
  });
}

const hasPrice = (o: Option): o is Option & { priceCents: number } =>
  typeof o.priceCents === 'number' && Number.isInteger(o.priceCents) && o.priceCents >= 0;

/** Sum of the chosen options' prices (cents), or null when none has one. */
export function priceIndication(model: Model, state: BuildState): number | null {
  const priced = chosenOptions(model, state).map((c) => c.option).filter(hasPrice);
  return priced.length ? priced.reduce((sum, o) => sum + o.priceCents, 0) : null;
}

/** "+ €4,850" / "Included" next to an option, or null (show nothing). */
export function optionPriceLabel(o: Option, money: MoneyFormat, labels: Labels): string | null {
  if (!hasPrice(o)) return null;
  return o.priceCents === 0 ? labels.included : `+ ${formatMoney(o.priceCents, money)}`;
}

/** The line under an option's name: its note, else "Standard" for the
 *  option a build starts with (when it has no price label). */
export function optionSub(o: Option, money: MoneyFormat, labels: Labels): string {
  const note = o.note.trim();
  if (note) return note;
  return o.isDefault && optionPriceLabel(o, money, labels) === null ? labels.standard : '';
}

/** The line under a group's title: what the card asks for. */
export function groupHint(group: Group, labels: Labels): string {
  const n = group.options.length;
  if (group.kind === 'toggle') return n === 1 ? labels.optional : labels.optionalAny;
  return fill(group.kind === 'paint' ? labels.pickColour : labels.pickOne, { n });
}

/** The machine-readable build: codes only. */
export function buildConfig(state: BuildState): { paint: string | null; choices: Record<string, string>; toggles: Record<string, string[]> } {
  return {
    paint: state.paint === NO_PAINT ? null : state.paint,
    choices: { ...state.choices },
    toggles: Object.fromEntries(Object.entries(state.toggles).map(([k, v]) => [k, [...v]])),
  };
}

export function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
