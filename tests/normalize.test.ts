import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileNameOf, normalize, type RawData } from '../src/core/normalize.ts';
import { initialState, priceIndication, renderHint, stageRender, summarize, withToggle, withChoice } from '../src/core/model.ts';
import { labelsFor, parseAmount, formatMoney } from '../src/core/labels.ts';
import { readParams, writeParams } from '../src/core/url.ts';

const CDN = 'https://cdn.prod.website-files.com/65a0c0ffee/';
const asset = (name: string) => `${CDN}65f1a2b3c4d5e6f7a8b9c0d1_${name}`;

/* The Venduetto set-up, as an editor would enter it in the Webflow CMS:
   group titles instead of codes, prices as typed, renders by file name. */
const raw: RawData = {
  groups: [
    { title: 'Paint', kind: 'paint' },
    { title: 'Wheels', kind: 'choice' },
    { title: 'Cockpit', kind: 'toggle' },
    { title: 'Interior trim', kind: 'choice', onRenders: 'false' },
  ],
  options: [
    { group: 'Paint', name: 'Rosso Cordoba', swatch: '#8c1c13', default: 'true' },
    { group: 'paint', name: 'Verde Pino', swatch: '#1f3b2d', price: '2.500' },
    { group: 'Wheels', name: 'Stradale', default: 'yes' },
    { group: 'Wheels', name: 'Billet', price: '4850' },
    { group: 'Cockpit', name: 'Roll cage', price: '6.250,00' },
    { group: 'Cockpit', name: 'Helmet shell', default: 'true', price: '0' },
    { group: 'interior-trim', name: 'Leather' },
    { group: 'interior-trim', name: 'Alcantara', price: 1200 },
  ],
  renders: [
    asset('rosso_01.jpg'),
    asset('rosso_02.jpg'),
    asset('rosso_03.jpg'),
    asset('rosso_02_roll-cage.jpg'),
    asset('rosso_02_roll-cage%2Bzonder-helmet-shell.jpg'),
    asset('rosso-cordoba_03_billet.jpg'),
    { src: asset('IMG_4411.jpg'), paint: 'Rosso Cordoba', view: '3', set: 'roll cage' },
    asset('verde_01.jpg'),
    asset('verde_02.jpg'),
    asset('rosso_02_rolkooi.jpg'), // unknown option → warning, skipped
  ],
};

test('file names: Webflow asset id, encoding and responsive suffix are stripped', () => {
  assert.equal(fileNameOf(asset('rosso_02_roll-cage%2Bno-helmet-shell.jpg?v=2')), 'rosso_02_roll-cage+no-helmet-shell.jpg');
  assert.equal(fileNameOf(`${CDN}65f1a2b3c4d5e6f7a8b9c0d1_rosso_02-p-800.jpg`), 'rosso_02.jpg');
  // CMS image fields re-host an asset under a second id.
  assert.equal(fileNameOf(`${CDN}6adf3b736bdad5ff794114d0_6adf3a868ee76d877b41422e_rosso-cordoba_01.jpeg`), 'rosso-cordoba_01.jpeg');
});

test('prices as editors type them', () => {
  assert.equal(parseAmount('4850'), 485000);
  assert.equal(parseAmount('4.850'), 485000);
  assert.equal(parseAmount('4,850.50'), 485050);
  assert.equal(parseAmount('€ 4.850,50'), 485050);
  assert.equal(parseAmount('4850,-'), 485000);
  assert.equal(parseAmount(''), null);
  assert.equal(parseAmount('op aanvraag'), null);
  assert.equal(parseAmount('v.a. € 4.850'), 485000);
  assert.equal(parseAmount('ca. 4.850 incl. b.t.w.'), 485000);
  assert.equal(parseAmount('€ 4 850'), 485000);
  assert.equal(parseAmount('-500'), null);
  assert.equal(parseAmount('− €500'), null);
  assert.equal(parseAmount('2x 500'), null);
  assert.equal(formatMoney(485000, { locale: 'en-GB', currency: 'EUR' }), '€4,850');
});

test('normalize: groups by title or code, codes from names, renders from file names', () => {
  const { model, warnings } = normalize(raw);
  assert.deepEqual(model.groups.map((g) => [g.code, g.kind, g.onRenders]), [
    ['paint', 'paint', true], ['wheels', 'choice', true], ['cockpit', 'toggle', true], ['interior-trim', 'choice', false],
  ]);
  assert.deepEqual(model.groups[0].options.map((o) => o.code), ['rosso-cordoba', 'verde-pino']);
  assert.deepEqual(model.views.map((v) => v.code), ['01', '02', '03']);
  assert.deepEqual(Object.keys(model.renders['rosso-cordoba']), ['01', '02', '03']);
  assert.deepEqual(model.renderSets['rosso-cordoba'].map((s) => s.entries), [
    ['cockpit:roll-cage'],
    ['wheels:billet'],
    ['cockpit:roll-cage', '!cockpit:helmet-shell'],
  ]);
  assert.deepEqual(Object.keys(model.renderSets['rosso-cordoba'][0].views).sort(), ['02', '03']);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /rolkooi/);
});

test('the build: defaults, matching render, hint, summary, price', () => {
  const { model } = normalize(raw);
  const labels = labelsFor('en');
  let s = initialState(model, '02');
  assert.equal(s.paint, 'rosso-cordoba');
  assert.equal(s.view, '02');
  assert.deepEqual(s.toggles, { cockpit: ['helmet-shell'] });
  assert.equal(summarize(model, s), 'Rosso Cordoba · Stradale wheels · Helmet shell · Leather interior trim');
  assert.equal(priceIndication(model, s), 0);

  s = withToggle(model, s, 'cockpit', 'roll-cage');
  assert.equal(stageRender(model, s, '02')!.image.src, asset('rosso_02_roll-cage.jpg'));
  assert.equal(stageRender(model, s, '01')!.image.src, asset('rosso_01.jpg'));
  assert.equal(renderHint(model, stageRender(model, s, '01'), labels), 'Shown without roll cage — not rendered yet');
  assert.equal(priceIndication(model, s), 625000);

  s = withToggle(model, s, 'cockpit', 'helmet-shell');
  assert.equal(stageRender(model, s, '02')!.image.src, asset('rosso_02_roll-cage%2Bzonder-helmet-shell.jpg'));

  s = withChoice(model, s, 'wheels', 'billet');
  assert.equal(renderHint(model, stageRender(model, s, '01'), labelsFor('nl')),
    'Getoond met Stradale wheels en helmet shell en zonder roll cage — nog niet gerenderd');
});

test('the build in the URL and back', () => {
  const { model } = normalize(raw);
  let s = initialState(model, '02');
  s = withToggle(model, s, 'cockpit', 'roll-cage');
  s = withChoice(model, s, 'wheels', 'billet');
  const params = writeParams(model, s, new URLSearchParams('utm_source=x'));
  assert.equal(params.toString(),
    'utm_source=x&cfg-paint=rosso-cordoba&cfg-wheels=billet&cfg-cockpit=roll-cage.helmet-shell&cfg-interior-trim=leather&cfg-view=02');
  const back = readParams(model, initialState(model), params);
  assert.deepEqual(back, s);
  const junk = readParams(model, initialState(model), new URLSearchParams('cfg-paint=pink&cfg-cockpit=none&cfg-view=99'));
  assert.equal(junk.paint, 'rosso-cordoba');
  assert.deepEqual(junk.toggles.cockpit, []);
});

test('price lines and the build price (Venduetto rules)', async () => {
  const { optionPriceText, buildPrice, hasAnyPrice } = await import('../src/core/model.ts');
  const { model } = normalize(raw);
  const L = labelsFor('en');
  const money = { locale: 'en-GB', currency: 'EUR' };
  const g = (code: string) => model.groups.find((x) => x.code === code)!;
  const o = (group: string, code: string) => g(group).options.find((x) => x.code === code)!;
  // Wheels: Billet has a price, Stradale (default) not → "Standard".
  assert.equal(optionPriceText(o('wheels', 'billet'), g('wheels'), money, L), '+ €4,850');
  assert.equal(optionPriceText(o('wheels', 'stradale'), g('wheels'), money, L), 'Standard');
  assert.equal(optionPriceText(o('cockpit', 'helmet-shell'), g('cockpit'), money, L), 'Included');
  // Paint: Verde has a price, Rosso is the default → "Standard".
  assert.equal(optionPriceText(o('paint', 'rosso-cordoba'), g('paint'), money, L), 'Standard');
  // A group where nothing has a price shows no price lines.
  const leather = o('interior-trim', 'leather');
  assert.equal(optionPriceText(leather, { ...g('interior-trim'), options: [leather] }, money, L), null);

  let s = initialState(model);
  assert.deepEqual(buildPrice(model, s, 18500000, money, L), { baseCents: 18500000, optionsCents: 0, totalCents: 18500000, onRequest: 0 });
  s = withToggle(model, s, 'cockpit', 'roll-cage');
  s = withChoice(model, s, 'interior-trim', 'alcantara');
  assert.equal(buildPrice(model, s, null, money, L).totalCents, 625000 + 120000);
  assert.equal(hasAnyPrice(model, null), true);
});

test('an unpriced non-default option in a priced group is "On request" and counted', async () => {
  const { optionPriceText, buildPrice } = await import('../src/core/model.ts');
  const { model } = normalize({
    groups: [{ title: 'Paint', kind: 'paint' }, { title: 'Wheels' }],
    options: [
      { group: 'paint', name: 'Rosso', default: 'yes' },
      { group: 'Wheels', name: 'Stradale', default: 'yes' },
      { group: 'Wheels', name: 'Billet', price: '4850' },
      { group: 'Wheels', name: 'Turbina' },
    ],
  });
  const L = labelsFor('en');
  const money = { locale: 'en-GB', currency: 'EUR' };
  const wheels = model.groups[1];
  assert.equal(optionPriceText(wheels.options[2], wheels, money, L), 'On request');
  const s = withChoice(model, initialState(model), 'wheels', 'turbina');
  assert.deepEqual(buildPrice(model, s, 18500000, money, L), { baseCents: 18500000, optionsCents: null, totalCents: 18500000, onRequest: 1 });
});
