import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePrice } from '../src/ui/parse.js';

test('fiyat yazımları', () => {
  const cases = {
    '60000': 60000, '60.000': 60000, '1.234.567': 1234567, '60,000.5': 60000.5, '60.000,5': 60000.5,
    '1,2955': 1.2955, '1.2955': 1.2955, '0.95': 0.95, '0,95': 0.95, '$65,000.25': 65000.25, '1,234,567': 1234567,
    '': NaN, 'abc': NaN, '12a': NaN,
  };
  for (const [k, v] of Object.entries(cases)) {
    const got = parsePrice(k);
    if (Number.isNaN(v)) assert.ok(Number.isNaN(got), k);
    else assert.equal(got, v, k);
  }
});
