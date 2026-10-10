// Kural setleri arası farklar ve kendi_kendini_sinama.md senaryoları.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { one, status } from './helpers.js';

const FLAT_65 = [100, 50, 82.5, 30]; // B = %65

test('flat B=%65: F&P ❌, Neely ✅, Kurs ❌', () => {
  assert.equal(one('flat', FLAT_65, { ruleSet: 'fp' }).valid, false);
  assert.equal(one('flat', FLAT_65, { ruleSet: 'neely' }).valid, true);
  assert.equal(one('flat', FLAT_65, { ruleSet: 'course' }).valid, false);
});

test('flat B=%75: Kurs setinde geçer (en az %70)', () => {
  assert.equal(status(one('flat', [100, 50, 87.5, 40], { ruleSet: 'course' }), 'FL-R1-COURSE'), 'pass');
});

test('zigzag B=%70: F&P ✅, Neely ❌ (B ≤ %61,8)', () => {
  const pts = [100, 50, 85, 30];
  assert.equal(one('zigzag', pts, { ruleSet: 'fp' }).valid, true);
  assert.equal(status(one('zigzag', pts, { ruleSet: 'neely' }), 'NEE-ZZ-1'), 'fail');
});

test('Neely Litmus: en uzun dalga bir sonrakinin %150\'si ise ❌ (sınama senaryo 1)', () => {
  // 1=100, 3=150, 5=100 → 3/1 = %150
  const pts = [0, 100, 50, 200, 150, 250];
  assert.equal(status(one('impulse', pts, { ruleSet: 'neely' }), 'NEE-IMP-EXT'), 'fail');
  assert.equal(one('impulse', pts, { ruleSet: 'fp' }).valid, true);
});

test('Kurs: kaldıraç toleransı açıksa %10 örtüşme ⚠️, kapalıysa ❌', () => {
  const pts = [0, 100, 40, 250, 90, 200]; // dalga 4 dalga 1'e %10 girer
  assert.equal(status(one('impulse', pts, { ruleSet: 'course', leverage: true }), 'IMP-R4'), 'warn');
  assert.equal(status(one('impulse', pts, { ruleSet: 'course', leverage: false }), 'IMP-R4'), 'fail');
  assert.equal(status(one('impulse', pts, { ruleSet: 'fp', leverage: true }), 'IMP-R4'), 'fail');
});

test('Kurs: dalga 2 %15 düzeltme ❌ (en az %20)', () => {
  assert.equal(status(one('impulse', [0, 100, 85, 250], { ruleSet: 'course' }), 'CRS-IMP-1'), 'fail');
});

test('Kurs: genişleyen diagonal bu sette geçersiz (dalga 5 her zaman dalga 3\'ten kısa)', () => {
  const pts = [0, 60, 20, 100, 40, 150];
  assert.equal(one('diagonal', pts, { ruleSet: 'fp' }).valid, true);
  assert.equal(one('diagonal', pts, { ruleSet: 'course' }).valid, false);
});

test('Kurs: daralan diagonal kurs kurallarını da geçer', () => {
  const c = one('diagonal', [0, 100, 40, 130, 80, 140], { ruleSet: 'course' });
  assert.equal(c.valid, true, c.results.filter((r) => r.status === 'fail').map((r) => r.rule.id + ': ' + r.detail).join(' | '));
});

test('Neely Time Rule: üç eşit süreli dalga ⚠️', () => {
  const c = one('impulse', [0, 100, 40, 250, 170, 280], { ruleSet: 'neely' });
  assert.equal(status(c, 'NEE-TIME'), 'warn'); // eşit aralıklı noktalar
});

test('alternasyon: 2 ve 4 aynı derinlik ve sürede ise ⚠️', () => {
  // dalga 2 = %50, dalga 4 = %50 ve eşit süreler
  const c = one('impulse', [0, 100, 50, 250, 150, 300]);
  assert.equal(status(c, 'IMP-G5'), 'warn');
});
