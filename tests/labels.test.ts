import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupHint } from '../src/core/model.ts';
import { LABELS } from '../src/core/labels.ts';
import type { Group } from '../src/core/types.ts';

const group = (kind: Group['kind'], n: number): Group => ({
  code: 'g', kind, title: 'G', onRenders: true,
  options: Array.from({ length: n }, (_, i) => ({ code: `o${i}`, name: `O${i}`, note: '', swatch: null, image: null, isDefault: i === 0, priceCents: null })),
});

test('groupHint: a group with one option does not ask to pick', () => {
  assert.equal(groupHint(group('choice', 1), LABELS.en), '1 option');
  assert.equal(groupHint(group('paint', 1), LABELS.en), '1 colour');
  assert.equal(groupHint(group('choice', 1), LABELS.nl), '1 optie');
  assert.equal(groupHint(group('choice', 3), LABELS.en), '3 options · pick one');
  assert.equal(groupHint(group('paint', 6), LABELS.nl), '6 kleuren · kies er één');
  assert.equal(groupHint(group('toggle', 2), LABELS.en), 'Optional · add any');
});
