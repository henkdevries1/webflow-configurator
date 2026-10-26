import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultEntries, entryRef, modelViewsFor, optionNames, optionRef, parseEntryRef, parseOptionRef, prepareSelection,
  redundantEntries, renderSetsFor, resolveModelRender, resolveRender, viewsForSelection,
  type MatchGroup, type MatchSelection, type RenderSetLike,
} from '../src/core/resolve.ts';

/* The seeded configurator: paint, wheels (choice, default Stradale),
   cockpit (toggles: roll cage OFF by default, helmet shell ON by default).
   The base set is the default build: Stradale, no roll cage, helmet shell. */
const groups: MatchGroup[] = [
  { code: 'paint', kind: 'paint', options: [{ code: 'rosso', isDefault: true }, { code: 'verde', isDefault: false }] },
  { code: 'wheels', kind: 'choice', options: [{ code: 'stradale', isDefault: true }, { code: 'billet', isDefault: false }, { code: 'turbina', isDefault: false }] },
  { code: 'cockpit', kind: 'toggle', options: [{ code: 'roll-cage', isDefault: false }, { code: 'helmet-shell', isDefault: true }] },
];
const RC = 'cockpit:roll-cage';
const HS = 'cockpit:helmet-shell';
const NO_RC = '!cockpit:roll-cage';
const NO_HS = '!cockpit:helmet-shell';
const BILLET = 'wheels:billet';
const STRADALE = 'wheels:stradale';

/** A set whose image for each view is "<label>/<view>". */
function set(label: string, entries: string[], views: string[]): RenderSetLike<string> {
  return { entries, views: Object.fromEntries(views.map((v) => [v, `${label}/${v}`])) };
}
const ALL = ['01', '02', '03', '04', '05'];
/** A build: wheels choice and the cockpit toggles that are ON. Default
 *  build = sel() with helmet shell on. */
const sel = (choices: Record<string, string> = {}, cockpit: string[] = ['helmet-shell']): MatchSelection => ({ choices, toggles: { cockpit } });
const DEFAULT = sel();
const NO_SHELL = sel({}, []);
const CAGE = sel({}, ['roll-cage', 'helmet-shell']);
const CAGE_NO_SHELL = sel({}, ['roll-cage']);
const pick = (sets: RenderSetLike<string>[], s: MatchSelection, view: string, g: MatchGroup[] = groups) => resolveRender(g, sets, s, view);

/** Owner's sets for rosso: base (= with helmet shell) everywhere, "zonder
 *  helmet shell" for 01–03, "+ roll cage" for 01–04, "+ roll cage · zonder
 *  helmet shell" for 01 only. */
const owner = [
  set('base', [], ALL),
  set('no-hs', [NO_HS], ['01', '02', '03']),
  set('rc', [RC], ['01', '02', '03', '04']),
  set('rc-no-hs', [RC, NO_HS], ['01']),
];

test('refs and entry refs', () => {
  assert.equal(optionRef('cockpit', 'roll-cage'), RC);
  assert.deepEqual(parseOptionRef(RC), { group: 'cockpit', option: 'roll-cage' });
  assert.equal(parseOptionRef('nogroup'), null);
  assert.equal(parseOptionRef(':x'), null);
  assert.equal(entryRef(HS, false), NO_HS);
  assert.equal(entryRef(HS), HS);
  assert.deepEqual(parseEntryRef(NO_HS), { ref: HS, on: false });
  assert.deepEqual(parseEntryRef(RC), { ref: RC, on: true });
});

test('the default build shows the base render, exact, no differences', () => {
  for (const view of ALL) {
    const m = pick(owner, DEFAULT, view)!;
    assert.equal(m.image, `base/${view}`);
    assert.equal(m.exact, true);
    assert.deepEqual(m.differs, []);
  }
});

test('helmet shell off: the "zonder" render where it exists, else the base WITH the shell', () => {
  const m = pick(owner, NO_SHELL, '02')!;
  assert.equal(m.image, 'no-hs/02');
  assert.equal(m.exact, true);
  const four = pick(owner, NO_SHELL, '04')!;
  assert.equal(four.image, 'base/04');
  assert.equal(four.exact, false);
  assert.deepEqual(four.differs, [HS], 'shown WITH helmet shell');
  // Without any "zonder" render at all: the base, with the hint.
  const m2 = pick([set('base', [], ALL)], NO_SHELL, '01')!;
  assert.equal(m2.image, 'base/01');
  assert.deepEqual(m2.differs, [HS]);
});

test('a "zonder" render is never shown to a visitor who keeps the default', () => {
  // Only the zonder set has view 09: the default build has no view 09.
  const sets = [set('base', [], ['01']), set('no-hs', [NO_HS], ['01', '09'])];
  assert.equal(pick(sets, DEFAULT, '01')!.image, 'base/01');
  assert.equal(pick(sets, DEFAULT, '09'), null);
  assert.equal(pick(sets, NO_SHELL, '09')!.image, 'no-hs/09');
});

test('roll cage on: the roll-cage render, else the base without it', () => {
  const m = pick(owner, CAGE, '03')!;
  assert.equal(m.image, 'rc/03');
  assert.equal(m.exact, true);
  const five = pick(owner, CAGE, '05')!;
  assert.equal(five.image, 'base/05');
  assert.deepEqual(five.differs, [NO_RC], 'shown WITHOUT roll cage');
});

test('roll cage on and helmet shell off: both deviations', () => {
  assert.equal(pick(owner, CAGE_NO_SHELL, '01')!.image, 'rc-no-hs/01');
  assert.equal(pick(owner, CAGE_NO_SHELL, '01')!.exact, true);
  // 02: {rc} and {zonder hs} each cover one of the two deviations — a tie
  // on score and entry count: configurator order (roll cage comes first).
  const two = pick(owner, CAGE_NO_SHELL, '02')!;
  assert.equal(two.image, 'rc/02');
  assert.deepEqual(two.differs, [HS]);
  // 04: only {rc} and the base: {rc}.
  assert.deepEqual([pick(owner, CAGE_NO_SHELL, '04')!.image, pick(owner, CAGE_NO_SHELL, '04')!.differs], ['rc/04', [HS]]);
  // 05: only the base: shows neither deviation.
  const five = pick(owner, CAGE_NO_SHELL, '05')!;
  assert.equal(five.image, 'base/05');
  assert.deepEqual(five.differs, [NO_RC, HS]);
  // The combined set is never shown for one of the two alone.
  assert.equal(pick(owner, CAGE, '01')!.image, 'rc/01');
  assert.equal(pick(owner, NO_SHELL, '01')!.image, 'no-hs/01');
});

test('ties: fewer explicit entries first, then configurator order, then input order', () => {
  // Same score, different entry counts: a redundant "+ helmet shell" set
  // depicts the default build too, but the base wins.
  const redundant = [set('hs', [HS], ALL), set('base', [], ALL)];
  assert.equal(pick(redundant, DEFAULT, '01')!.image, 'base/01');
  // …and it qualifies like the base where the base lacks the view.
  assert.equal(pick([set('base', [], ['02']), set('hs', [HS], ['01'])], DEFAULT, '01')!.image, 'hs/01');
  // Never for a visitor without the shell.
  assert.equal(pick([set('base', [], ['02']), set('hs', [HS], ['01'])], NO_SHELL, '01'), null);
  // {rc + hs(redundant)} vs {rc}: same score, {rc} has fewer entries.
  assert.equal(pick([set('rc+hs', [RC, HS], ALL), set('rc', [RC], ALL)], CAGE, '01')!.image, 'rc/01');
  // Across groups: wheels come before the cockpit.
  const mixed = sel({ wheels: 'billet' }, ['roll-cage', 'helmet-shell']);
  const c = [set('rc', [RC], ALL), set('billet', [BILLET], ALL), set('base', [], ALL)];
  assert.equal(pick(c, mixed, '01')!.image, 'billet/01');
  assert.equal(pick([...c].reverse(), mixed, '01')!.image, 'billet/01');
  // Reordering the groups flips it.
  assert.equal(pick(c, mixed, '01', [groups[0], groups[2], groups[1]])!.image, 'rc/01');
  // Identical entries (cannot happen per paint, but deterministic): the first.
  assert.equal(pick([set('a', [RC], ALL), set('b', [RC], ALL)], CAGE, '01')!.image, 'a/01');
});

test('choices: a set names the option it shows; the base shows the default', () => {
  const sets = [set('base', [], ALL), set('billet', [BILLET], ['01'])];
  assert.equal(pick(sets, sel({ wheels: 'billet' }), '01')!.image, 'billet/01');
  const two = pick(sets, sel({ wheels: 'billet' }), '02')!;
  assert.equal(two.image, 'base/02');
  assert.deepEqual(two.differs, [STRADALE], 'shown with Stradale');
  // A missing or unknown choice = the default.
  assert.equal(pick(sets, sel({}), '01')!.exact, true);
  assert.equal(pick(sets, sel({ wheels: 'nope' }), '01')!.image, 'base/01');
  // Billet is never shown to a Stradale build.
  assert.equal(pick([set('billet', [BILLET], ALL)], DEFAULT, '01'), null);
  // A set naming the default wheel is redundant: the base wins a tie.
  assert.equal(pick([set('stradale', [STRADALE], ALL), set('base', [], ALL)], DEFAULT, '01')!.image, 'base/01');
});

test('the stored state is explicit: flipping a default does not change what a set depicts', () => {
  // Staff make helmet shell OFF by default. The "zonder" set still depicts
  // the shell OFF; the base now counts as the default build (shell off).
  const flipped: MatchGroup[] = groups.map((g) => (g.code === 'cockpit'
    ? { ...g, options: g.options.map((o) => ({ ...o, isDefault: false })) }
    : g));
  const sets = [set('base', [], ALL), set('no-hs', [NO_HS], ['01'])];
  // Visitor with the shell ON: the zonder set never qualifies.
  const on = pick(sets, DEFAULT, '01', flipped)!;
  assert.equal(on.image, 'base/01');
  assert.deepEqual(on.differs, [NO_HS], 'base now depicts the new default: without the shell');
  // Visitor with the shell OFF (now the default build): base and the
  // zonder set depict the same; the base wins on fewer entries.
  assert.equal(pick(sets, NO_SHELL, '01', flipped)!.image, 'base/01');
  assert.deepEqual(redundantEntries(flipped, [NO_HS]), [NO_HS], 'the zonder set is now redundant');
  assert.deepEqual(redundantEntries(groups, [NO_HS]), []);
});

test('defaultEntries / redundantEntries', () => {
  assert.deepEqual(defaultEntries(groups), [STRADALE, NO_RC, HS]);
  assert.deepEqual(redundantEntries(groups, [RC, HS, BILLET, STRADALE, NO_HS]), [HS, STRADALE]);
});

test('invalid sets are never shown: unknown, hidden, paint, choice off, two entries for one unit', () => {
  const sets = [
    set('base', [], ALL),
    set('gone', ['cockpit:gone'], ALL),
    set('nogroup', ['trim:carbon'], ALL),
    set('paint', ['paint:rosso'], ALL),
    set('choice-off', ['!wheels:stradale'], ALL),
    set('both', [RC, NO_RC], ALL),
    set('two-wheels', [BILLET, STRADALE], ALL),
  ];
  for (const s of [DEFAULT, CAGE, sel({ wheels: 'billet' }), NO_SHELL]) assert.equal(pick(sets, s, '01')!.image, 'base/01');
});

test('groups not visible on renders neither match nor count', () => {
  const hidden: MatchGroup[] = groups.map((g) => (g.code === 'wheels' ? { ...g, onRenders: false } : g));
  const sets = [set('base', [], ALL), set('billet', [BILLET], ALL), set('rc', [RC], ALL)];
  const m = pick(sets, sel({ wheels: 'billet' }), '01', hidden)!;
  assert.equal(m.image, 'base/01');
  assert.equal(m.exact, true);
  assert.equal(pick(sets, sel({ wheels: 'billet' }, ['roll-cage', 'helmet-shell']), '01', hidden)!.image, 'rc/01');
});

test('missing views: null when no qualifying set has the view', () => {
  assert.equal(pick(owner, DEFAULT, '12'), null);
  assert.equal(pick([], DEFAULT, '01'), null);
  assert.equal(pick([{ entries: [], views: { '01': null as unknown as string } }], DEFAULT, '01'), null);
});

test('choice groups without options are skipped', () => {
  const g: MatchGroup[] = [...groups, { code: 'seats', kind: 'choice', options: [] }];
  assert.deepEqual(prepareSelection(g, sel({ seats: 'x' })).units.map((u) => u.key), ['wheels', RC, HS]);
});

test('viewsForSelection lists every view with a render, in the given order', () => {
  const out = viewsForSelection(groups, owner, CAGE_NO_SHELL, ['05', '04', '01']);
  assert.deepEqual(out.map((x) => [x.view, x.match.image, x.match.exact]), [
    ['05', 'base/05', false],
    ['04', 'rc/04', false],
    ['01', 'rc-no-hs/01', true],
  ]);
});

test('on the public model: base = renders[paint], other sets from renderSets', () => {
  const model = {
    views: [{ code: '01' }, { code: '02' }, { code: '03' }],
    groups: groups.map((g) => ({ ...g, options: g.options.map((o) => ({ ...o, name: o.code === 'roll-cage' ? 'Roll cage' : o.code })) })),
    renders: { rosso: { '01': 'r01', '02': 'r02' }, verde: { '01': 'v01' } },
    renderSets: { rosso: [{ entries: [RC], views: { '02': 'r02-rc', '03': 'r03-rc' } }] },
  };
  assert.deepEqual(renderSetsFor(model, 'rosso').map((s) => s.entries), [[], [RC]]);
  assert.deepEqual(renderSetsFor(model, null), []);
  assert.deepEqual(renderSetsFor(model, 'oro'), [{ entries: [], views: {} }]);
  const state = { paint: 'rosso', ...CAGE };
  assert.equal(resolveModelRender(model, state, '02')!.image, 'r02-rc');
  assert.equal(resolveModelRender(model, state, '01')!.image, 'r01');
  assert.deepEqual(optionNames(model, resolveModelRender(model, state, '01')!.differs), ['Roll cage']);
  assert.deepEqual(modelViewsFor(model, state).map((x) => x.view), ['01', '02', '03']);
  assert.deepEqual(modelViewsFor(model, { paint: 'rosso', ...DEFAULT }).map((x) => x.view), ['01', '02']);
  assert.deepEqual(modelViewsFor(model, { paint: 'verde', ...DEFAULT }).map((x) => x.match.image), ['v01']);
  // A model without renderSets (older JSON) keeps working.
  const old = { views: model.views, groups: model.groups, renders: model.renders };
  assert.equal(resolveModelRender(old, state, '02')!.image, 'r02');
  assert.deepEqual(optionNames(model, ['x:y', NO_RC]), ['Roll cage']);
});
