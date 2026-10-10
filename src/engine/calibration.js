// Fiyat ekseni kalibrasyonu: iki referans noktası (piksel y → fiyat).
// Log ölçekte ln(fiyat) piksel y ile doğrusal kabul edilir.

export function makeCalibration(ref1, ref2, logScale = false) {
  const { y: y1, price: p1 } = ref1;
  const { y: y2, price: p2 } = ref2;
  if (![y1, y2, p1, p2].every(Number.isFinite)) throw new Error('Kalibrasyon değerleri eksik.');
  if (y1 === y2) throw new Error('Kalibrasyon noktaları farklı yüksekliklerde olmalı.');
  if (p1 === p2) throw new Error('Kalibrasyon fiyatları birbirinden farklı olmalı.');
  if (logScale && (p1 <= 0 || p2 <= 0)) throw new Error('Log ölçekte fiyatlar pozitif olmalı.');
  const f = logScale ? Math.log : (x) => x;
  const g = logScale ? Math.exp : (x) => x;
  const a = f(p1);
  const k = (f(p2) - a) / (y2 - y1);
  return {
    logScale,
    toPrice: (y) => g(a + (y - y1) * k),
    toY: (p) => y1 + (f(p) - a) / k,
  };
}
