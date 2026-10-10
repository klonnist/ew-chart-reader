// Kullanıcının yazdığı fiyatı sayıya çevirir. Türkçe ve İngilizce yazımları kabul eder:
// "60000", "60.000" (binlik), "60,000.5", "1,2955" (ondalık virgül), "1.2955" (ondalık nokta).
// Tek nokta + tam 3 hane ("70.000") Türkçe binlik ayırıcı kabul edilir.
export function parsePrice(raw) {
  let s = String(raw ?? '').trim().replace(/[\s₺$€]/g, '');
  if (!s) return NaN;
  const dots = (s.match(/\./g) || []).length;
  const commas = (s.match(/,/g) || []).length;
  if (dots && commas) {
    s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else if (commas) {
    s = commas > 1 ? s.replace(/,/g, '') : s.replace(',', '.');
  } else if (dots > 1 || /^-?\d{1,3}\.\d{3}$/.test(s)) {
    s = s.replace(/\./g, '');
  }
  return /^-?\d*\.?\d+$/.test(s) ? Number(s) : NaN;
}
