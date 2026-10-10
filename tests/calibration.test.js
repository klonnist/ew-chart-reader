import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeCalibration } from '../src/engine/calibration.js';
import { one } from './helpers.js';
import { num, price } from '../src/engine/helpers.js';

test('lineer kalibrasyon: iki noktadan fiyat ve geri dönüşüm', () => {
  const cal = makeCalibration({ y: 400, price: 60000 }, { y: 100, price: 65000 });
  assert.equal(cal.toPrice(250), 62500);
  assert.equal(cal.toY(62500), 250);
});

test('log kalibrasyon: orta piksel geometrik ortalamaya denk gelir', () => {
  const cal = makeCalibration({ y: 400, price: 100 }, { y: 0, price: 10000 }, true);
  assert.ok(Math.abs(cal.toPrice(200) - 1000) < 1e-6);
  assert.ok(Math.abs(cal.toY(1000) - 200) < 1e-6);
});

test('kalibrasyon hataları', () => {
  assert.throws(() => makeCalibration({ y: 1, price: 1 }, { y: 1, price: 2 }));
  assert.throws(() => makeCalibration({ y: 1, price: 0 }, { y: 2, price: 2 }, true));
});

test('log ölçekte oranlar yüzde bazında ölçülür', () => {
  // 100 → 200 (+%100, ln2) → 141,42 (ln farkı ln2/2) ⇒ log geri çekilme %50
  const c = one('impulse', [100, 200, 141.421356], { logScale: true });
  const r = c.ratios.find((x) => x.ruleId === 'IMP-G1').value;
  assert.ok(Math.abs(r - 0.5) < 1e-6);
  const lin = one('impulse', [100, 200, 141.421356]);
  assert.ok(Math.abs(lin.ratios.find((x) => x.ruleId === 'IMP-G1').value - 0.5858) < 1e-3);
});

test('Türkçe sayı biçimi', () => {
  assert.equal(num(1234567.891, 2), '1.234.567,89');
  assert.equal(price(65000), '65.000');
  assert.equal(price(1.2955), '1,296');
});
