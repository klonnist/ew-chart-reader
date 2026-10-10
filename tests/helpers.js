// Test yardımcıları: fiyat dizisinden eşit aralıklı noktalar üretir.
import { analyze, evaluate } from '../src/engine/analyze.js';

export const pts = (prices, step = 10) => prices.map((p, i) => ({ t: i * step, p }));

export const status = (cand, id) => cand.results.find((r) => r.rule.id === id)?.status;

export function run(prices, opts = {}) {
  const res = analyze(pts(prices, opts.step), opts);
  if (!res.ok) throw new Error(res.error);
  return res;
}

export const one = (pattern, prices, opts = {}) => run(prices, { ...opts, pattern }).candidates[0];

export { evaluate };
