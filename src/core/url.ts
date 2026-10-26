/* The build in the address bar, so a link reopens the same car:
   ?cfg-paint=rosso&cfg-wheels=billet&cfg-cockpit=roll-cage.helmet-shell&cfg-view=05
   One parameter per group (its code), toggles joined by "." ("none" when
   all are off), plus the view. Only codes — never anything personal.
   Unknown codes are ignored, so an old link never breaks the page. */

import { settleView } from './model.ts';
import { NO_PAINT, type BuildState, type Model } from './types.ts';

export const DEFAULT_PREFIX = 'cfg-';
const NONE = 'none';

export function writeParams(model: Model, state: BuildState, params: URLSearchParams, prefix = DEFAULT_PREFIX): URLSearchParams {
  for (const g of model.groups) {
    const key = prefix + g.code;
    if (g.kind === 'paint') setOrDelete(params, key, state.paint === NO_PAINT ? null : state.paint);
    else if (g.kind === 'choice') setOrDelete(params, key, state.choices[g.code] ?? null);
    else {
      const on = state.toggles[g.code] ?? [];
      params.set(key, on.length ? on.join('.') : NONE);
    }
  }
  setOrDelete(params, `${prefix}view`, state.view);
  return params;
}

function setOrDelete(params: URLSearchParams, key: string, value: string | null) {
  if (value) params.set(key, value);
  else params.delete(key);
}

/** True when the params name any of this configurator's groups. */
export function hasParams(model: Model, params: URLSearchParams, prefix = DEFAULT_PREFIX): boolean {
  return model.groups.some((g) => params.has(prefix + g.code)) || params.has(`${prefix}view`);
}

/** The state from the params, starting from `base` (the default build). */
export function readParams(model: Model, base: BuildState, params: URLSearchParams, prefix = DEFAULT_PREFIX): BuildState {
  let state: BuildState = { ...base, choices: { ...base.choices }, toggles: { ...base.toggles } };
  for (const g of model.groups) {
    const raw = params.get(prefix + g.code);
    if (raw === null) continue;
    const codes = new Set(g.options.map((o) => o.code));
    if (g.kind === 'paint') {
      if (codes.has(raw)) state.paint = raw;
    } else if (g.kind === 'choice') {
      if (codes.has(raw)) state.choices[g.code] = raw;
    } else {
      const on = new Set(raw === NONE ? [] : raw.split('.'));
      state.toggles[g.code] = g.options.map((o) => o.code).filter((c) => on.has(c));
    }
  }
  const view = params.get(`${prefix}view`);
  if (view && model.views.some((v) => v.code === view)) state.view = view;
  state = settleView(model, state);
  return state;
}
