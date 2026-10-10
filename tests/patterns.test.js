// Her kalıp için en az bir geçerli ve bir kuralı bozan sentetik örnek.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run, one, status, pts } from './helpers.js';
import { analyze } from '../src/engine/analyze.js';

// ---------- İtki ----------
const IMPULSE_OK = [0, 100, 40, 250, 170, 280];

test('itki: ders kitabı örneği tüm kuralları geçer', () => {
  const c = one('impulse', IMPULSE_OK);
  assert.equal(c.valid, true);
  for (const id of ['IMP-R1', 'IMP-R2', 'IMP-R3', 'IMP-R4', 'STR-1']) assert.equal(status(c, id), 'pass', id);
  assert.equal(status(c, 'IMP-G1'), 'pass'); // %60
  assert.equal(status(c, 'IMP-G2'), 'pass'); // 2,1×
  assert.equal(status(c, 'IMP-G3'), 'pass'); // %38
  assert.ok(c.score >= 80, `skor ${c.score}`);
});

test('itki: dalga 2 başlangıcı aşarsa ❌', () => {
  const c = one('impulse', [0, 100, -10, 250, 170, 280]);
  assert.equal(c.valid, false);
  assert.equal(status(c, 'IMP-R1'), 'fail');
  assert.equal(c.targets, null, 'geçersiz sayıma hedef çizilmez');
});

test('itki: dalga 3 en kısa ise ❌', () => {
  const c = one('impulse', [0, 100, 50, 130, 110, 240]);
  assert.equal(status(c, 'IMP-R3'), 'fail');
});

test('itki: dalga 3 dalga 1 sonunu geçemezse ❌', () => {
  const c = one('impulse', [0, 100, 40, 95, 60, 120]);
  assert.equal(status(c, 'IMP-R2'), 'fail');
});

// Kullanıcının istediği çapraz örnek: dalga 4 dalga 1'e giriyor.
const OVERLAP = [0, 100, 40, 130, 80, 140];

test('itki: dalga 4 dalga 1 bölgesine girerse ❌', () => {
  const c = one('impulse', OVERLAP);
  assert.equal(c.valid, false);
  assert.equal(status(c, 'IMP-R4'), 'fail');
});

test('diagonal: aynı noktalar (daralan kama) diagonal seçilince ✅', () => {
  const c = one('diagonal', OVERLAP);
  assert.equal(c.valid, true, c.results.filter((r) => r.status === 'fail').map((r) => r.rule.id + ': ' + r.detail).join(' | '));
  assert.equal(c.variant.shape, 'contracting');
  assert.equal(status(c, 'DIA-G1'), 'pass'); // örtüşme var
  assert.equal(status(c, 'DIA-R5'), 'pass');
});

test('diagonal: dalga 4 dalga 2 sonunu aşarsa ❌', () => {
  const c = one('diagonal', [0, 100, 40, 130, 30, 140]);
  assert.equal(status(c, 'DIA-R4'), 'fail');
  assert.equal(c.valid, false);
});

test('diagonal: genişleyen kama ✅, karışık geometri ❌', () => {
  const exp = one('diagonal', [0, 60, 20, 100, 40, 150]);
  assert.equal(exp.valid, true, exp.results.filter((r) => r.status === 'fail').map((r) => r.rule.id + ': ' + r.detail).join(' | '));
  assert.equal(exp.variant.shape, 'expanding');
  const mixed = one('diagonal', [0, 100, 40, 130, 80, 200]); // 5 > 3 ama 3 < 1
  assert.equal(mixed.valid, false);
});

test('bilmiyorum: örtüşmeli kama için en iyi aday diagonal, itki geçersiz', () => {
  const res = run(OVERLAP);
  assert.equal(res.best.pattern, 'diagonal');
  const imp = res.candidates.find((c) => c.pattern === 'impulse');
  assert.equal(imp.valid, false);
});

test('bilmiyorum: ders kitabı itkisinde ilk aday itki', () => {
  const res = run(IMPULSE_OK);
  assert.equal(res.best.pattern, 'impulse');
});

// ---------- Zigzag ----------
test('zigzag: 100→50→80→30 ✅ (B %60, C = A)', () => {
  const c = one('zigzag', [100, 50, 80, 30]);
  assert.equal(c.valid, true);
  assert.equal(status(c, 'ZZ-G1'), 'pass');
  assert.equal(status(c, 'ZZ-G2'), 'pass');
});

test('zigzag: B, A başlangıcını aşarsa ❌', () => {
  const c = one('zigzag', [100, 50, 110, 30]);
  assert.equal(status(c, 'ZZ-R1'), 'fail');
});

// ---------- Flat ----------
test('flat: regular flat ✅ (B %94, C ≈ A)', () => {
  const c = one('flat', [100, 50, 97, 48]);
  assert.equal(c.valid, true);
  assert.match(c.label, /regular/);
});

test('flat: expanded flat sınıflaması', () => {
  const c = one('flat', [100, 50, 110, 29]);
  assert.equal(c.valid, true);
  assert.match(c.label, /expanded/);
  assert.equal(status(c, 'FL-G2'), 'pass'); // C ≈ 1,618A
});

test('flat: running flat sınıflaması ve uyarısı', () => {
  const c = one('flat', [100, 50, 105, 60]);
  assert.match(c.label, /running/);
  assert.equal(status(c, 'FL-G3'), 'warn');
});

test('flat: B %60 ise F&P setinde ❌', () => {
  const c = one('flat', [100, 50, 80, 30]);
  assert.equal(status(c, 'FL-R1-FP'), 'fail');
});

// ---------- Üçgen ----------
const TRI_OK = [100, 60, 90, 68, 84, 74];

test('üçgen: daralan üçgen ✅', () => {
  const c = one('triangle', TRI_OK);
  assert.equal(c.valid, true, c.results.filter((r) => r.status === 'fail').map((r) => r.rule.id + ': ' + r.detail).join(' | '));
  assert.equal(c.variant.shape, 'contracting');
  assert.equal(status(c, 'TRI-R3'), 'pass');
  assert.ok(c.targets.items.length === 3, 'thrust hedefleri');
});

test('üçgen: E, C sonunu geçerse ❌', () => {
  const c = one('triangle', [100, 60, 90, 68, 84, 64]);
  assert.equal(c.valid, false);
});

test('üçgen: genişleyen üçgen ✅', () => {
  const c = one('triangle', [100, 90, 104, 84, 110, 76]);
  assert.equal(c.valid, true, c.results.filter((r) => r.status === 'fail').map((r) => r.rule.id + ': ' + r.detail).join(' | '));
  assert.equal(c.variant.shape, 'expanding');
});

// ---------- WXY ----------
test('WXY: çift zigzag ✅', () => {
  const c = one('wxy', [100, 70, 82, 50]);
  assert.equal(c.valid, true);
  assert.equal(c.variant.shape, 'double-zigzag');
});

test('WXY: X, W başlangıcını aşınca çift zigzag ❌, kombinasyon seçilir', () => {
  const res = analyze(pts([100, 70, 105, 69]), { pattern: 'wxy' });
  const c = res.candidates[0];
  assert.equal(c.variant.shape, 'combination');
  assert.equal(c.valid, true);
});

test('WXY: Y, X\'ten kısa ise ❌', () => {
  const c = one('wxy', [100, 70, 90, 85]);
  assert.equal(status(c, 'WXY-R2'), 'fail');
});

// ---------- Yapısal ----------
test('yön değiştirmeyen noktalar ❌ (STR-1)', () => {
  const c = one('impulse', [0, 100, 150, 250]);
  assert.equal(status(c, 'STR-1'), 'fail');
});

test('2 nokta reddedilir; kalıp kapasitesini aşan nokta sayısı reddedilir', () => {
  assert.equal(analyze(pts([0, 100]), {}).ok, false);
  assert.equal(analyze(pts([100, 50, 80, 30, 60]), { pattern: 'zigzag' }).ok, false);
  assert.equal(analyze(pts([1, 2, 1, 2, 1, 2, 1]), {}).ok, false);
});

test('düşen trendde de kurallar simetrik çalışır', () => {
  const c = one('impulse', IMPULSE_OK.map((x) => 1000 - x));
  assert.equal(c.valid, true);
  const bad = one('impulse', OVERLAP.map((x) => 1000 - x));
  assert.equal(status(bad, 'IMP-R4'), 'fail');
});
