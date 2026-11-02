import { test } from 'node:test';
import assert from 'node:assert/strict';
import { comboKey, formatPrice, planSync, validateExport, type CmsItem, type ConfiguratorExport } from '../src/sync/venduetto.ts';
import { parseAmount } from '../src/core/labels.ts';

const img = (name: string) => ({ src: `https://cdn/${name}.jpg?width=1600`, full: `https://cdn/${name}.jpg?width=2400` });

const exp: ConfiguratorExport = {
  version: 1,
  generatedAt: '2026-11-02T10:00:00.000Z',
  model: {
    views: [{ code: '01', name: 'Front' }],
    groups: [
      {
        code: 'paint', kind: 'paint', title: 'Paint',
        options: [
          { code: 'rosso-cordoba', name: 'Rosso Cordoba', note: '', swatchHex: '#6b1e22', isDefault: true, priceCents: null },
          { code: 'verde-zeltweg', name: 'Verde Zeltweg', note: 'New.', swatchHex: '#33503a', isDefault: false, priceCents: 1157000 },
        ],
      },
      {
        code: 'cockpit', kind: 'toggle', title: 'Cockpit',
        options: [
          { code: 'roll-cage', name: 'Roll cage', note: '', swatchHex: null, isDefault: false, priceCents: 487000 },
          { code: 'helmet-shell', name: 'Helmet Shell', note: '', swatchHex: null, isDefault: true, priceCents: 249000 },
        ],
      },
    ],
    renders: { 'rosso-cordoba': { '01': img('r01') }, 'verde-zeltweg': { '01': img('v01') } },
    renderSets: {
      'rosso-cordoba': [
        { entries: ['cockpit:roll-cage', '!cockpit:helmet-shell'], views: { '01': img('r01c') }, seat: { seat: { parts: { shell: 'cb-matte' } } } },
      ],
    },
    basePriceCents: 26840000,
  },
};

const item = (id: string, fieldData: Record<string, unknown>): CmsItem => ({ id, fieldData });

test('formatPrice writes prices the way the CMS takes them, and the module reads them back', () => {
  assert.equal(formatPrice(26840000), '268.400');
  assert.equal(formatPrice(487000), '4.870');
  assert.equal(formatPrice(50000), '500');
  assert.equal(formatPrice(1250), '12,50');
  assert.equal(formatPrice(0), '0');
  assert.equal(formatPrice(null), null);
  for (const cents of [26840000, 487000, 50000, 1250, 0]) assert.equal(parseAmount(formatPrice(cents)), cents);
});

test('comboKey ignores order, case and the base spellings', () => {
  assert.equal(comboKey('zonder-helmet-shell + Roll-Cage'), 'roll-cage+zonder-helmet-shell');
  assert.equal(comboKey('basis'), '');
  assert.equal(comboKey(null), '');
});

test('validateExport refuses anything but a filled version 1 export', () => {
  assert.throws(() => validateExport({ version: 2, model: { groups: [] } }));
  assert.throws(() => validateExport({ version: 1, model: { groups: [] } }), /empty/);
  assert.equal(validateExport(exp), exp);
});

test('planSync: new paint, changed price, removed option, renders by paint + view + combination', () => {
  const plan = planSync({
    data: exp,
    templateGroups: ['paint', 'cockpit'],
    basePrice: '268.400',
    options: [
      item('o1', { group: 'paint', code: 'rosso-cordoba', name: 'Rosso Cordoba', note: null, price: null, default: true, swatch: '#6B1E22', order: 1, slug: 'rosso-cordoba' }),
      item('o2', { group: 'cockpit', code: 'roll-cage', name: 'Roll cage', note: null, price: '4.500', default: false, swatch: null, order: 3, slug: 'roll-cage' }),
      item('o3', { group: 'cockpit', code: 'helmet-shell', name: 'Helmet Shell', note: null, price: '2.490', default: true, swatch: null, order: 4, slug: 'helmet-shell' }),
      item('o4', { group: 'paint', code: 'oro-chiaro', name: 'Oro Chiaro', note: null, price: '11.570', default: false, swatch: '#B08A4E', order: 3, slug: 'oro-chiaro' }),
    ],
    renders: [
      item('r1', { paint: 'rosso-cordoba', view: '01', combination: 'basis', name: 'Rosso Cordoba 01 · standard', source: 'https://cdn/r01.jpg?width=2400', seat: null, slug: 'rosso-cordoba-standard-01' }),
      item('r2', { paint: 'rosso-cordoba', view: '01', combination: 'zonder-helmet-shell + roll-cage', name: 'old', slug: 'x' }),
      item('r3', { paint: 'oro-chiaro', view: '01', combination: 'basis', name: 'Oro 01', slug: 'oro-chiaro-01' }),
    ],
  });

  assert.deepEqual(plan.options.create.map((f) => f.code), ['verde-zeltweg']);
  assert.equal(plan.options.create[0].price, '11.570');
  assert.equal(plan.options.create[0].slug, 'verde-zeltweg');
  assert.deepEqual(plan.options.update.map((u) => [u.id, u.changes]), [['o2', ['price']]]);
  assert.deepEqual(plan.options.remove.map((r) => r.id), ['o4']);
  assert.equal(plan.options.unchanged, 2, 'swatch case does not count as a change');

  assert.equal(plan.renders.unchanged, 1);
  const r2 = plan.renders.update.find((u) => u.id === 'r2')!;
  assert.deepEqual(r2.changes, ['combination', 'name', 'source', 'seat']);
  assert.deepEqual(r2.fieldData.image, { url: 'https://cdn/r01c.jpg?width=2400' }, 'a new source sends the image');
  assert.equal(r2.fieldData.combination, 'roll-cage + zonder-helmet-shell');
  assert.equal(r2.fieldData.name, 'Rosso Cordoba 01 · roll cage, without helmet shell');
  assert.equal(r2.fieldData.seat, '{"seat":{"parts":{"shell":"cb-matte"}}}');
  assert.deepEqual(plan.renders.create.map((f) => [f.slug, f.combination, (f.image as { url: string }).url]), [
    ['verde-zeltweg-standard-01', 'basis', 'https://cdn/v01.jpg?width=2400'],
  ]);
  assert.deepEqual(plan.renders.remove.map((r) => r.id), ['r3']);

  assert.equal(plan.basePrice, null, 'base price unchanged');
  assert.deepEqual(plan.missingGroups, []);
});

test('planSync reports groups the template lacks, ambiguous codes, a base price change and duplicate items', () => {
  const data: ConfiguratorExport = {
    ...exp,
    model: {
      ...exp.model,
      groups: [
        ...exp.model.groups,
        { code: 'wheels', kind: 'choice', title: 'Wheels', options: [{ code: 'roll-cage', name: 'Odd', note: '', swatchHex: null, isDefault: true, priceCents: null }] },
      ],
    },
  };
  const dup = { paint: 'rosso-cordoba', view: '01', combination: 'basis', name: 'Rosso Cordoba 01 · standard', source: 'https://cdn/r01.jpg?width=2400', seat: null };
  const plan = planSync({
    data,
    templateGroups: ['paint', 'cockpit'],
    basePrice: '185.000',
    options: [],
    renders: [item('a', { ...dup, slug: 'a' }), item('b', { ...dup, slug: 'b' })],
  });
  assert.deepEqual(plan.missingGroups.map((g) => g.code), ['wheels']);
  assert.match(plan.warnings[0], /roll-cage/);
  assert.deepEqual(plan.basePrice, { from: '185.000', to: '268.400' });
  assert.deepEqual(plan.renders.remove.map((r) => r.id), ['b'], 'the second copy of a render goes');
});
