// Analiz geçmişi: localStorage'da saklanır, JSON olarak dışa/içe aktarılır.
const KEY = 'ew-chart-reader:history:v1';
const MAX = 20;

export function loadHistory() {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function persist(list) {
  // Kota dolarsa en eski kayıtları atarak tekrar dene.
  let l = list.slice(0, MAX);
  while (l.length) {
    try {
      localStorage.setItem(KEY, JSON.stringify(l));
      return { ok: true, kept: l.length, dropped: list.length - l.length };
    } catch {
      l = l.slice(0, -1);
    }
  }
  try { localStorage.removeItem(KEY); } catch { /* yok say */ }
  return { ok: false, kept: 0, dropped: list.length };
}

// Aynı kimlikli kayıt varsa günceller, yoksa en başa ekler.
export function upsertEntry(entry) {
  const list = loadHistory().filter((e) => e.id !== entry.id);
  list.unshift(entry);
  return persist(list);
}

export function removeEntry(id) {
  return persist(loadHistory().filter((e) => e.id !== id));
}

export function clearHistory() {
  try { localStorage.removeItem(KEY); } catch { /* yok say */ }
}

export function isValidEntry(e) {
  return (
    e && typeof e === 'object' && typeof e.id === 'string' &&
    typeof e.image === 'string' && e.image.startsWith('data:image/') &&
    Array.isArray(e.points) && e.points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)) &&
    Array.isArray(e.calib?.refs) && e.calib.refs.length === 2
  );
}

export function importEntries(json) {
  const data = JSON.parse(json);
  const incoming = (Array.isArray(data) ? data : data.entries || []).filter(isValidEntry);
  const list = loadHistory();
  const ids = new Set(list.map((e) => e.id));
  const fresh = incoming.filter((e) => !ids.has(e.id));
  const merged = [...fresh, ...list].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const res = persist(merged);
  return { ...res, added: fresh.length, skipped: incoming.length - fresh.length };
}

export function exportJSON() {
  return JSON.stringify({ app: 'ew-chart-reader', version: 1, exported: new Date().toISOString(), entries: loadHistory() }, null, 1);
}
