// practice_case_log.md'deki gerçek sayımlar (2026-09-17, yaklaşık fiyatlar).
// Amaç: motorun o günkü elle yapılmış kural kontrolleriyle aynı sonuca vardığını doğrulamak.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { one, status } from './helpers.js';
import { analyze } from '../src/engine/analyze.js';

const near = (a, b, tol) => Math.abs(a - b) <= tol;

test('Vaka 1 BTC: 116k düşüşünü itki saymak dalga 3 kısalığı uyarısı verir, zigzag geçerli', () => {
  const pts = [116000, 67000, 82000, 58500];
  const imp = one('impulse', pts);
  assert.equal(status(imp, 'IMP-R3'), 'warn', 'dalga 3 dalga 1\'den kısa');
  const zz = one('zigzag', pts);
  assert.equal(zz.valid, true);
});

test('Vaka 1 BTC: 58,5k → 87,5k → 76,6k dalga 1-2; geçersizlik 58,5k, dalga 3 hedefi ~116-123k', () => {
  const c = one('impulse', [58500, 87500, 76600]);
  assert.equal(c.valid, true);
  assert.equal(c.invalidation[0].price, 58500);
  const t = c.targets.items.map((x) => x.price);
  assert.ok(near(t[1], 123522, 50), `1,618 hedefi ${t[1]}`);
  assert.ok(t[0] >= 105000 && t[0] <= 106000);
});

test('Vaka 2 ETH: 1700 → 2600 → 2453; geçersizlik 1700, 1,618 hedefi ~3.900', () => {
  const c = one('impulse', [1700, 2600, 2453]);
  assert.equal(c.valid, true);
  assert.equal(c.invalidation[0].price, 1700);
  assert.ok(near(c.targets.items[1].price, 3909, 2));
});

test('Vaka 3 XRP: 0,975 → 1,60 → 1,2955; yaklaşık %50 geri çekilme (geniş bantta ⚠️ yumuşak)', () => {
  const c = one('impulse', [0.975, 1.6, 1.2955]);
  assert.equal(c.valid, true);
  const r = c.ratios.find((x) => x.ruleId === 'IMP-G1');
  assert.ok(near(r.value, 0.487, 0.005), `oran ${r.value}`);
  assert.equal(status(c, 'IMP-G1'), 'pass'); // %48,7 → %50'ye 0,03 tolerans içinde
});

test('Vaka 3b XRP 15dk: başlangıç 1,50 ise dalga 2 (1,49) geçerli, dalga 5 hedefi ~1,18-1,20', () => {
  const c = one('impulse', [1.5, 1.365, 1.49, 1.255, 1.32]);
  assert.equal(c.valid, true, c.results.filter((r) => r.status === 'fail').map((r) => r.rule.id).join());
  assert.equal(status(c, 'IMP-R4'), 'pass', 'dalga 4 (1,32) dalga 1 bölgesine (1,365) girmiyor');
  const eq = c.targets.items.find((x) => x.label === 'Dalga 5 = dalga 1');
  assert.ok(near(eq.price, 1.185, 0.002), `hedef ${eq.price}`);
});

test('Vaka 3b XRP: başlangıç 1,45 olsaydı dalga 2 (1,49) başlangıcı aşar ❌ (logdaki "açık nokta")', () => {
  const c = one('impulse', [1.45, 1.365, 1.49, 1.255, 1.32]);
  assert.equal(status(c, 'IMP-R1'), 'fail');
});

test('Vaka 3b XRP: alternasyon (dalga 2 sert spike, dalga 4 yatay) yakalanır', () => {
  // dalga 2 kısa sürede, dalga 4 uzun sürede: süreleri farklı veriyoruz
  const points = [
    { t: 0, p: 1.5 }, { t: 10, p: 1.365 }, { t: 13, p: 1.49 }, { t: 30, p: 1.255 }, { t: 60, p: 1.32 },
  ];
  const c = analyze(points, { pattern: 'impulse' }).candidates[0];
  assert.equal(status(c, 'IMP-G5'), 'pass');
});
