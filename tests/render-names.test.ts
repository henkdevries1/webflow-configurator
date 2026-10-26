import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapRenderFile, markDuplicates, proposeMapping, restatus } from '../src/core/render-names.ts';

const paints = [
  { code: 'rosso', name: 'Rosso Cordoba' },
  { code: 'verde', name: 'Verde Zeltweg Metallic' },
  { code: 'oro', name: 'Oro Chiaro' },
];
const views = Array.from({ length: 16 }, (_, i) => ({ code: String(i + 1).padStart(2, '0'), name: `View ${i + 1}` }));

const map = (path: string, selected: string | null = null) => {
  const r = mapRenderFile(path, paints, views, selected);
  return [r.paint, r.view, r.status];
};

test('folder = paint code, file = view code', () => {
  assert.deepEqual(map('rosso/01.jpg'), ['rosso', '01', 'ok']);
  assert.deepEqual(map('verde/16.png'), ['verde', '16', 'ok']);
  assert.deepEqual(map('OUT/Oro/07.JPG'), ['oro', '07', 'ok']);
});

test('folder may be the paint name; view numbers need no leading zero', () => {
  assert.deepEqual(map('renders/Rosso Cordoba/1.jpg'), ['rosso', '01', 'ok']);
  assert.deepEqual(map('Verde Zeltweg Metallic/0003.jpg'), ['verde', '03', 'ok']);
});

test('bare view numbers use the selected paint', () => {
  assert.deepEqual(map('01.jpg', 'oro'), ['oro', '01', 'ok']);
  assert.deepEqual(map('01.jpg'), [null, '01', 'no-paint']);
  assert.deepEqual(map('01.jpg', 'nonexistent'), [null, '01', 'no-paint']);
});

test('KeyShot-style "Scene.NN" names: number is the view, scene is not a paint', () => {
  assert.deepEqual(map('Quartetto.01.jpg', 'verde'), ['verde', '01', 'ok']);
  assert.deepEqual(map('Quartetto.v2.12.jpg', 'verde'), ['verde', '12', 'ok']);
  assert.deepEqual(map('Quartetto.0004.jpg', 'rosso'), ['rosso', '04', 'ok']);
});

test('paint and view in one file name', () => {
  assert.deepEqual(map('rosso_03.png'), ['rosso', '03', 'ok']);
  assert.deepEqual(map('oro.0007.jpg'), ['oro', '07', 'ok']);
  assert.deepEqual(map('Quartetto.Verde.05.jpg', 'rosso'), ['verde', '05', 'ok']);
  assert.deepEqual(map('Rosso Cordoba 11.jpg'), ['rosso', '11', 'ok']);
});

test('file name beats folder; nearest folder beats outer folder', () => {
  assert.deepEqual(map('rosso/verde_02.jpg'), ['verde', '02', 'ok']);
  assert.deepEqual(map('oro/rosso/02.jpg'), ['rosso', '02', 'ok']);
  const r = mapRenderFile('rosso/02.jpg', paints, views, 'oro');
  assert.equal(r.paintFrom, 'folder');
});

test('the last matching number is the view (dates and versions in front lose)', () => {
  assert.deepEqual(map('2026-10-01_rosso_03.jpg'), ['rosso', '03', 'ok']);
  assert.deepEqual(map('rosso/shot 3 of 99.jpg'), ['rosso', '03', 'ok']);
});

test('unknown views and non-images are reported, not guessed', () => {
  assert.deepEqual(map('rosso/17.jpg'), ['rosso', null, 'no-view']);
  assert.deepEqual(map('rosso/hero.jpg'), ['rosso', null, 'no-view']);
  assert.deepEqual(map('rosso/notes.txt'), [null, null, 'not-image']);
  assert.deepEqual(map('rosso/01.psd'), [null, null, 'not-image']);
});

test('accents and case do not matter for paint names', () => {
  const r = mapRenderFile('ROSSO-CÓRDOBA/05.jpeg', paints, views, null);
  assert.deepEqual([r.paint, r.view], ['rosso', '05']);
});

test('non-numeric view codes match literally', () => {
  const v = [{ code: 'front', name: 'Front' }, { code: '01', name: 'One' }];
  assert.equal(mapRenderFile('rosso/front.jpg', paints, v, null).view, 'front');
  assert.equal(mapRenderFile('rosso/1.jpg', paints, v, null).view, '01');
});

test('two files for one cell: the first in the list wins', () => {
  const rows = proposeMapping(['rosso/01.jpg', 'rosso_01.jpg', 'rosso/02.jpg', 'misc.txt'], paints, views, null);
  assert.deepEqual(rows.map((r) => r.status), ['ok', 'duplicate', 'ok', 'not-image']);
});

test('fixing a row by hand clears its duplicate and recomputes status', () => {
  let rows = proposeMapping(['rosso/01.jpg', 'rosso_01.jpg'], paints, views, null);
  rows = markDuplicates(rows.map((r) => (r.index === 1 ? restatus({ ...r, view: '02' }) : r)));
  assert.deepEqual(rows.map((r) => [r.view, r.status]), [['01', 'ok'], ['02', 'ok']]);
  assert.equal(restatus({ ...rows[0], paint: null }).status, 'no-paint');
});

test('a full design-handoff folder maps 1:1', () => {
  const paths = ['rosso', 'verde', 'oro'].flatMap((p) => views.map((v) => `renders/${p}/${v.code}.jpg`));
  const rows = proposeMapping(paths, paints, views, null);
  assert.equal(rows.filter((r) => r.status === 'ok').length, 48);
  assert.equal(new Set(rows.map((r) => `${r.paint}/${r.view}`)).size, 48);
});

// ---------------------------------------------------------------- render sets (options in the path)

/* The seed: Stradale wheels by default, roll cage OFF by default, helmet
   shell ON by default. The base renders show that default build. */
const options = [
  { id: 'o-stradale', code: 'stradale', name: 'Stradale', group: 'g-wheels', groupTitle: 'Velgen', choice: true, isDefault: true },
  { id: 'o-billet', code: 'billet', name: 'Billet', group: 'g-wheels', groupTitle: 'Velgen', choice: true, isDefault: false },
  { id: 'o-rc', code: 'rolkooi', name: 'Roll cage', group: 'g-cockpit', groupTitle: 'Cockpit', choice: false, isDefault: false },
  { id: 'o-hs', code: 'helmet-shell', name: 'Helmet Shell', group: 'g-cockpit', groupTitle: 'Cockpit', choice: false, isDefault: true },
];
const mapo = (path: string, selected: string | null = null) => {
  const r = mapRenderFile(path, paints, views, selected, options);
  return [r.paint, r.view, r.entries, r.status];
};
const asDefault = (path: string) => mapRenderFile(path, paints, views, null, options).asDefault;

test('render sets: the paint folder is the base (the default build); a sub-folder names deviations', () => {
  assert.deepEqual(mapo('rosso/01.jpg'), ['rosso', '01', [], 'ok']);
  assert.deepEqual(mapo('rosso/rolkooi/05.jpg'), ['rosso', '05', ['o-rc'], 'ok']);
  assert.deepEqual(mapo('rosso/billet/05.jpg'), ['rosso', '05', ['o-billet'], 'ok']);
  assert.deepEqual(mapo('renders/Rosso Cordoba/Roll Cage + Zonder Helmet Shell/Quartetto.0005.jpg'), ['rosso', '05', ['o-rc', '!o-hs'], 'ok']);
  assert.equal(mapRenderFile('rosso/rolkooi/05.jpg', paints, views, null, options).optionsFrom, 'folder');
});

test('render sets: zonder-, without-, no- and geen- switch a toggle OFF', () => {
  for (const word of ['zonder', 'without', 'no', 'geen', 'Zonder', 'NO']) {
    assert.deepEqual(mapo(`rosso/${word}-helmet-shell/05.jpg`), ['rosso', '05', ['!o-hs'], 'ok'], word);
  }
  assert.deepEqual(mapo('rosso/zonder helmet shell/05.jpg'), ['rosso', '05', ['!o-hs'], 'ok']);
  assert.deepEqual(mapo('rosso/zonderhelmetshell/05.jpg'), ['rosso', '05', ['!o-hs'], 'ok']);
  // By name too.
  assert.deepEqual(mapo('rosso/without Helmet Shell/05.jpg'), ['rosso', '05', ['!o-hs'], 'ok']);
  // Joined with "+".
  assert.deepEqual(mapo('rosso/rolkooi+zonder-helmet-shell/05.jpg'), ['rosso', '05', ['o-rc', '!o-hs'], 'ok']);
  assert.deepEqual(mapo('rosso/zonder-helmet-shell+billet/05.jpg'), ['rosso', '05', ['!o-hs', 'o-billet'], 'ok']);
});

test('render sets: a suffix after the view names the deviations', () => {
  assert.deepEqual(mapo('rosso/05_zonder-helmet-shell.jpg'), ['rosso', '05', ['!o-hs'], 'ok']);
  assert.deepEqual(mapo('rosso/05_rolkooi+zonder-helmet-shell.jpg'), ['rosso', '05', ['o-rc', '!o-hs'], 'ok']);
  assert.deepEqual(mapo('rosso_05_rolkooi.jpg'), ['rosso', '05', ['o-rc'], 'ok']);
  assert.deepEqual(mapo('05_no-helmet-shell.jpg', 'verde'), ['verde', '05', ['!o-hs'], 'ok']);
  assert.deepEqual(mapo('Quartetto.0007_billet+rolkooi.jpg', 'oro'), ['oro', '07', ['o-billet', 'o-rc'], 'ok']);
  assert.equal(mapRenderFile('rosso/05_rolkooi.jpg', paints, views, null, options).optionsFrom, 'name');
  // Folder and suffix together.
  assert.deepEqual(mapo('rosso/rolkooi/05_zonder-helmet-shell.jpg'), ['rosso', '05', ['o-rc', '!o-hs'], 'ok']);
});

test('render sets: a name for the DEFAULT state is the base, reported as such', () => {
  // Helmet shell is on by default: "helmet-shell" = as default = base.
  assert.deepEqual(mapo('rosso/helmet-shell/05.jpg'), ['rosso', '05', [], 'ok']);
  assert.deepEqual(asDefault('rosso/helmet-shell/05.jpg'), ['Helmet Shell']);
  // Roll cage is off by default: "zonder-rolkooi" = base.
  assert.deepEqual(mapo('rosso/05_zonder-rolkooi.jpg'), ['rosso', '05', [], 'ok']);
  assert.deepEqual(asDefault('rosso/05_zonder-rolkooi.jpg'), ['zonder Roll cage']);
  // The default wheel.
  assert.deepEqual(mapo('rosso/stradale/05.jpg'), ['rosso', '05', [], 'ok']);
  assert.deepEqual(asDefault('rosso/stradale/05.jpg'), ['Stradale']);
  // Mixed: the deviation stays, the default name is dropped.
  assert.deepEqual(mapo('rosso/rolkooi+helmet-shell/05.jpg'), ['rosso', '05', ['o-rc'], 'ok']);
  assert.deepEqual(asDefault('rosso/rolkooi+helmet-shell/05.jpg'), ['Helmet Shell']);
  assert.deepEqual(asDefault('rosso/rolkooi/05.jpg'), []);
  // "basis" spells out the base set.
  assert.deepEqual(mapo('rosso/basis/05.jpg'), ['rosso', '05', [], 'ok']);
  assert.deepEqual(asDefault('rosso/basis/05.jpg'), []);
});

test('render sets: options match code or name, case- and accent-insensitive', () => {
  assert.deepEqual(mapo('rosso/ROLKOOI+Zonder-Hélmet-Shell/05.jpg'), ['rosso', '05', ['o-rc', '!o-hs'], 'ok']);
  assert.deepEqual(mapo('rosso/roll-cage/05.jpg'), ['rosso', '05', ['o-rc'], 'ok']);
  // A repeated option counts once.
  assert.deepEqual(mapo('rosso/rolkooi/05_rolkooi.jpg'), ['rosso', '05', ['o-rc'], 'ok']);
});

test('render sets: unknown or contradictory names are a problem row, never the base set', () => {
  const r = mapRenderFile('rosso/rolkoi/05.jpg', paints, views, null, options);
  assert.deepEqual([r.paint, r.view, r.entries, r.status], ['rosso', '05', null, 'no-options']);
  assert.equal(r.optionProblem, 'Onbekende optie: rolkoi');
  assert.equal(mapRenderFile('rosso/05_rolkooi+wing.jpg', paints, views, null, options).optionProblem, 'Onbekende optie: wing');
  assert.equal(mapRenderFile('rosso/zonder-wing/05.jpg', paints, views, null, options).optionProblem, 'Onbekende optie: zonder-wing');
  assert.equal(mapRenderFile('rosso/final/v2/05.jpg', paints, views, null, options).optionProblem, 'Onbekende opties: final, v2');
  assert.deepEqual(mapo('rosso_05_v2.jpg'), ['rosso', '05', null, 'no-options']);
  // Two options of one choice group.
  const two = mapRenderFile('rosso/billet+stradale/05.jpg', paints, views, null, options);
  assert.equal(two.status, 'no-options');
  assert.equal(two.optionProblem, 'Eén optie uit Velgen per render: Billet of Stradale?');
  // A choice cannot be "zonder".
  const choiceOff = mapRenderFile('rosso/zonder-stradale/05.jpg', paints, views, null, options);
  assert.equal(choiceOff.status, 'no-options');
  assert.match(choiceOff.optionProblem!, /"zonder Stradale" kan niet/);
  // With and without the same toggle.
  const both = mapRenderFile('rosso/helmet-shell/05_zonder-helmet-shell.jpg', paints, views, null, options);
  assert.equal(both.status, 'no-options');
  assert.match(both.optionProblem!, /Helmet Shell staat er zowel mét als zonder in/);
  // Without any render-set options known, every option name is unknown.
  assert.equal(mapRenderFile('rosso/rolkooi/05.jpg', paints, views, null).status, 'no-options');
});

test('render sets: folders outside the paint folder only count when they are all options', () => {
  // Outer folders that are not options are ignored, as before.
  assert.deepEqual(mapo('renders/rosso/05.jpg'), ['rosso', '05', [], 'ok']);
  assert.deepEqual(mapo('2026-10/01.jpg', 'oro'), ['oro', '01', [], 'ok']);
  // An options folder with the selected paint or the paint in the name.
  assert.deepEqual(mapo('rolkooi/01.jpg', 'oro'), ['oro', '01', ['o-rc'], 'ok']);
  assert.deepEqual(mapo('zonder-helmet-shell/verde_02.jpg'), ['verde', '02', ['!o-hs'], 'ok']);
  // A suffix that is the view itself is no suffix; a name without a view has none.
  assert.deepEqual(mapo('2026-10-01_rosso_03.jpg'), ['rosso', '03', [], 'ok']);
  assert.deepEqual(mapo('rosso/hero_rolkooi.jpg'), ['rosso', null, [], 'no-view']);
});

test('render sets: the same view in two combinations is no duplicate; in one combination it is', () => {
  const rows = proposeMapping(
    [
      'rosso/05.jpg', 'rosso/helmet-shell/05.jpg', // base twice ("helmet-shell" = default)
      'rosso/rolkooi/05.jpg', 'rosso/05_rolkooi.jpg',
      'rosso/zonder-helmet-shell+rolkooi/05.jpg', 'rosso/rolkooi+no-helmet-shell/05.jpg',
      'rosso/zonder-helmet-shell/05.jpg',
    ],
    paints, views, null, options,
  );
  assert.deepEqual(rows.map((r) => r.status), ['ok', 'duplicate', 'ok', 'duplicate', 'ok', 'duplicate', 'ok']);
});

test('render sets: fixing a problem row by picking a combination', () => {
  const [row] = proposeMapping(['rosso/rolkoi/05.jpg'], paints, views, null, options);
  assert.equal(row.status, 'no-options');
  const fixed = restatus({ ...row, entries: ['o-rc'] });
  assert.deepEqual([fixed.status, fixed.optionProblem], ['ok', null]);
  assert.equal(restatus({ ...row, entries: ['!o-hs'] }).status, 'ok');
  assert.equal(restatus({ ...row, entries: [] }).status, 'ok');
  assert.equal(restatus({ ...fixed, entries: null }).status, 'no-options');
});
