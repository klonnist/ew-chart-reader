// Uygulama denetleyicisi: görsel yükleme, kalibrasyon, noktalar, analiz, geçmiş ve sayfa yönlendirme.
import { analyze } from '../engine/analyze.js';
import { makeCalibration } from '../engine/calibration.js';
import { PATTERNS, PATTERN_CHOICES } from '../engine/patterns.js';
import { price as fmtPrice } from '../engine/helpers.js';
import { RULE_SETS } from '../rules/index.js';
import { ChartCanvas } from './canvas.js';
import { renderResults, esc } from './results.js';
import { initRulesPage } from './rulesPage.js';
import * as history from './history.js';
import { parsePrice } from './parse.js';

const $ = (id) => document.getElementById(id);
const SETTINGS_KEY = 'ew-chart-reader:settings:v1';
const MAX_IMAGE_W = 1600;

const state = {
  imageData: null,      // çalışma görseli (data URL, en fazla 1600 px)
  cal: null,            // geçerli kalibrasyon ya da null
  result: null,         // son analiz sonucu
  selected: 0,
  analyzed: false,      // "Analiz et"e basıldıysa değişikliklerde canlı yeniden analiz
  entryId: null,        // geçmişteki güncel kayıt
  undo: [],
  calibAutoSwitched: false,
};

const chart = new ChartCanvas($('chart'), {
  onBeforeChange: pushUndo,
  onChange(kind) {
    if (kind === 'full') return flash(`Bu kalıp en fazla ${maxPoints()} nokta alır. Noktaları sürükleyerek düzeltebilirsin.`);
    if (kind === 'calib') focusNextCalibInput();
    refresh(kind !== 'drag');
  },
});

// ---------- Ayarlar ----------
function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch { return {}; }
}
function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      pattern: $('opt-pattern').value, diagKind: $('opt-diag-kind').value, ruleSet: $('opt-ruleset').value,
      log: $('opt-log').checked, leverage: $('opt-leverage').checked,
    }));
  } catch { /* depolama kapalı olabilir */ }
}

function initControls() {
  $('opt-pattern').innerHTML = PATTERN_CHOICES.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  $('opt-ruleset').innerHTML = Object.values(RULE_SETS).map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
  const s = loadSettings();
  if (s.pattern && PATTERN_CHOICES.some((p) => p.id === s.pattern)) $('opt-pattern').value = s.pattern;
  if (s.diagKind) $('opt-diag-kind').value = s.diagKind;
  if (s.ruleSet && RULE_SETS[s.ruleSet]) $('opt-ruleset').value = s.ruleSet;
  $('opt-log').checked = !!s.log;
  $('opt-leverage').checked = !!s.leverage;

  for (const id of ['opt-pattern', 'opt-diag-kind', 'opt-ruleset', 'opt-log', 'opt-leverage']) {
    $(id).addEventListener('change', () => { saveSettings(); refresh(true); });
  }
  for (const id of ['calib-p1', 'calib-p2']) $(id).addEventListener('input', () => refresh(true));

  document.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
  $('btn-undo').addEventListener('click', undo);
  $('btn-clear').addEventListener('click', () => { pushUndo(); chart.points = []; refresh(true); });
  $('btn-analyze').addEventListener('click', () => runAnalysis(true));
  $('btn-remove-image').addEventListener('click', removeImage);
}

// ---------- Görsel yükleme ----------
function readFile(file) {
  if (!file || !file.type.startsWith('image/')) return flash('Lütfen bir görsel dosyası seç.');
  const fr = new FileReader();
  fr.onload = () => loadImage(fr.result);
  fr.readAsDataURL(file);
}

function loadImage(src, keep = false) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Büyük görselleri küçült: hem performans hem geçmiş depolaması için.
      const k = Math.min(1, MAX_IMAGE_W / img.naturalWidth);
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * k);
      c.height = Math.round(img.naturalHeight * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      state.imageData = k < 1 || !src.startsWith('data:image/jpeg') ? c.toDataURL('image/jpeg', 0.85) : src;
      if (!keep) {
        chart.points = [];
        chart.calib = [];
        state.undo = [];
        state.result = null;
        state.analyzed = false;
        state.entryId = null;
        state.calibAutoSwitched = false;
        $('calib-p1').value = '';
        $('calib-p2').value = '';
      }
      $('dropzone').hidden = true;
      $('canvas-wrap').hidden = false;
      chart.setImage(c);
      $('image-status').textContent = `${c.width}×${c.height} px görsel yüklendi.`;
      $('btn-remove-image').disabled = false;
      if (!keep) setMode('calib');
      refresh(false);
      resolve();
    };
    img.onerror = () => { flash('Görsel okunamadı.'); resolve(); };
    img.src = src;
  });
}

function removeImage() {
  state.imageData = null;
  chart.image = null;
  chart.points = [];
  chart.calib = [];
  state.result = null;
  state.analyzed = false;
  state.entryId = null;
  $('dropzone').hidden = false;
  $('canvas-wrap').hidden = true;
  $('results').hidden = true;
  $('image-status').textContent = 'Henüz görsel yok.';
  $('btn-remove-image').disabled = true;
  refresh(false);
}

function initDropAndPaste() {
  const dz = $('dropzone');
  $('file-input').addEventListener('change', (e) => { readFile(e.target.files[0]); e.target.value = ''; });
  dz.addEventListener('click', (e) => { if (e.target.tagName !== 'LABEL') $('file-input').click(); });
  dz.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('file-input').click(); } });
  for (const el of [dz, $('canvas-wrap')]) {
    el.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('over'); });
    el.addEventListener('dragleave', () => dz.classList.remove('over'));
    el.addEventListener('drop', (e) => {
      e.preventDefault();
      dz.classList.remove('over');
      readFile(e.dataTransfer.files[0]);
    });
  }
  document.addEventListener('paste', (e) => {
    if (currentRoute() !== 'analiz') return;
    const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'));
    if (item) { e.preventDefault(); readFile(item.getAsFile()); }
  });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName)) {
      e.preventDefault();
      undo();
    }
  });
}

// ---------- Mod, geri al ----------
function setMode(mode) {
  chart.setMode(mode);
  document.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mode === mode)));
  $('mode-hint').textContent = {
    calib: 'Fiyatı bilinen iki yüksekliğe tıkla (K1, K2). İşaretleri sürükleyebilirsin.',
    points: 'Dönüş noktalarına soldan sağa sırayla tıkla. Noktaları sürükleyerek düzeltebilirsin.',
    pan: 'Kaydırma modu: tıklamalar nokta eklemez.',
  }[mode];
}

function pushUndo() {
  state.undo.push(JSON.stringify({ points: chart.points, calib: chart.calib }));
  if (state.undo.length > 100) state.undo.shift();
}

function undo() {
  const snap = state.undo.pop();
  if (!snap) return;
  const s = JSON.parse(snap);
  chart.points = s.points;
  chart.calib = s.calib;
  refresh(true);
}

function focusNextCalibInput() {
  const id = chart.calib.length === 1 ? 'calib-p1' : 'calib-p2';
  if (!$(id).value) $(id).focus({ preventScroll: true });
}

// ---------- Kalibrasyon ----------
function computeCalibration() {
  const p1 = parsePrice($('calib-p1').value);
  const p2 = parsePrice($('calib-p2').value);
  const st = $('calib-status');
  st.className = 'status small';
  chart.calibText = [Number.isFinite(p1) ? fmtPrice(p1) : '', Number.isFinite(p2) ? fmtPrice(p2) : ''];
  if (chart.calib.length < 2) {
    st.textContent = `Grafikte ${2 - chart.calib.length} kalibrasyon noktası daha koy.`;
    return null;
  }
  if (!Number.isFinite(p1) || !Number.isFinite(p2)) {
    st.textContent = 'İki noktanın fiyatını yaz.';
    return null;
  }
  try {
    const cal = makeCalibration({ y: chart.calib[0].y, price: p1 }, { y: chart.calib[1].y, price: p2 }, $('opt-log').checked);
    // Üstteki nokta daha yüksek fiyat olmalı (ters eksenli grafikler hariç uyarı).
    const upper = chart.calib[0].y < chart.calib[1].y ? p1 : p2;
    const lower = upper === p1 ? p2 : p1;
    const read = `K1 = ${fmtPrice(p1)}, K2 = ${fmtPrice(p2)}`;
    st.classList.add(upper > lower ? 'ok' : 'bad');
    st.textContent = upper > lower ? `✓ Kalibrasyon tamam (${read}).` : `Dikkat: üstteki nokta daha düşük fiyatlı (${read}). Fiyatları doğru yazdın mı?`;
    return cal;
  } catch (e) {
    st.classList.add('bad');
    st.textContent = e.message;
    return null;
  }
}

// ---------- Ana yenileme ----------
function maxPoints() {
  const p = $('opt-pattern').value;
  return p === 'auto' ? 6 : PATTERNS[p].maxPoints;
}

function currentOptions() {
  return {
    pattern: $('opt-pattern').value,
    ruleSet: $('opt-ruleset').value,
    logScale: $('opt-log').checked,
    leverage: $('opt-leverage').checked,
    diagonalKind: $('opt-diag-kind').value,
  };
}

function enginePoints() {
  return chart.points.map((q) => ({ t: q.x, p: state.cal.toPrice(q.y) }));
}

function pointsProblem() {
  const pts = chart.points;
  if (pts.length < 3) return `En az 3 dönüş noktası koy (${pts.length}/3).`;
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].x <= pts[i - 1].x) return `Noktalar soldan sağa (zaman sırasıyla) olmalı: ${i}. nokta ${i - 1}. noktanın solunda.`;
  }
  if (pts.length > maxPoints()) return `Bu kalıp en fazla ${maxPoints()} nokta alır; fazla noktaları geri al.`;
  return null;
}

function refresh(rerun) {
  const pattern = $('opt-pattern').value;
  chart.maxPoints = maxPoints();
  state.cal = computeCalibration();

  // Ayar görünürlükleri
  $('diag-kind-wrap').hidden = !(pattern === 'auto' || pattern === 'diagonal');
  $('leverage-wrap').hidden = $('opt-ruleset').value !== 'course';
  $('ruleset-desc').textContent = RULE_SETS[$('opt-ruleset').value].description;
  const labels = pattern === 'auto' ? ['0', '1', '2', '3', '4', '5'] : PATTERNS[pattern].labels;
  $('points-hint').textContent = `Sıra: ${labels.join(' → ')}. En az 3 nokta; yarım sayım desteklenir.${pattern === 'auto' ? ' Noktalar tüm kalıplara karşı test edilir.' : ''}`;

  // Kalibrasyon tamamlanınca bir kez nokta moduna geç
  if (state.cal && !state.calibAutoSwitched && chart.image) {
    state.calibAutoSwitched = true;
    setMode('points');
  }

  // Nokta listesi
  const labelSet = currentLabels(labels);
  $('point-list').innerHTML = chart.points
    .map((q, i) => `<li><span class="lbl">${esc(labelSet[i] ?? i)}</span><span>${state.cal ? esc(fmtPrice(state.cal.toPrice(q.y))) : '—'}</span></li>`)
    .join('');

  // Adım durumları
  $('step-image').classList.toggle('done', !!chart.image);
  $('step-calib').classList.toggle('done', !!state.cal);
  $('step-points').classList.toggle('done', chart.points.length >= 3 && !pointsProblem());
  $('btn-undo').disabled = !state.undo.length;
  $('btn-clear').disabled = !chart.points.length;

  const problem = !chart.image ? 'Önce bir grafik görseli yükle.' : !state.cal ? 'Fiyat kalibrasyonunu tamamla.' : pointsProblem();
  $('btn-analyze').disabled = !!problem;
  $('analyze-hint').textContent = problem || '';

  if (rerun && state.analyzed && !problem) runAnalysis(false);
  else {
    if (problem && state.analyzed) {
      state.result = null;
      chart.overlay = { targets: [], invalid: [] };
    }
    chart.labels = labelSet;
    chart.draw();
  }
}

function currentLabels(fallback) {
  const c = state.result?.ok && state.result.candidates[state.selected];
  return c ? c.labels : fallback;
}

// ---------- Analiz ----------
function runAnalysis(fromButton) {
  const opts = currentOptions();
  const res = analyze(enginePoints(), opts);
  if (fromButton) state.selected = 0;
  state.result = res;
  state.analyzed = true;
  if (res.ok && state.selected >= res.candidates.length) state.selected = 0;
  showResult();
  if (res.ok) saveToHistory(fromButton);
  if (fromButton) $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showResult() {
  const res = state.result;
  const el = $('results');
  el.hidden = false;
  renderResults(el, res, state.selected, {
    onSelect(i) {
      state.selected = i;
      showResult();
      saveToHistory(false);
    },
  });
  const c = res.ok ? res.candidates[state.selected] : null;
  const toY = (p) => state.cal.toY(p);
  const inView = (y) => Number.isFinite(y);
  chart.overlay = {
    targets: c?.targets ? c.targets.items.map((t) => ({ y: toY(t.price), label: `${t.label}: ${fmtPrice(t.price)}` })).filter((t) => inView(t.y)) : [],
    invalid: c ? c.invalidation.filter((t) => t.price !== null).map((t) => ({ y: toY(t.price), label: `Geçersizlik: ${fmtPrice(t.price)}` })).filter((t) => inView(t.y)) : [],
  };
  chart.labels = c ? c.labels : chart.labels;
  chart.draw();
  const labels = c ? c.labels : [];
  $('point-list').querySelectorAll('.lbl').forEach((el2, i) => { if (labels[i]) el2.textContent = labels[i]; });
}

function saveToHistory(isNew) {
  if (!state.result?.ok || !state.imageData) return;
  if (isNew || !state.entryId) state.entryId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const c = state.result.candidates[state.selected];
  const entry = {
    id: state.entryId,
    date: new Date().toISOString(),
    image: state.imageData,
    thumb: chart.snapshot(360, 0.7),
    calib: { refs: chart.calib.map((q, i) => ({ ...q, price: parsePrice($(i ? 'calib-p2' : 'calib-p1').value) })), log: $('opt-log').checked },
    points: chart.points,
    settings: currentOptions(),
    selected: state.selected,
    summary: { label: c.label, score: c.score, valid: c.valid, labels: c.labels, prices: enginePoints().map((q) => q.p) },
  };
  const r = history.upsertEntry(entry);
  if (!r.ok) flash('Geçmiş kaydedilemedi: tarayıcı depolaması dolu veya kapalı.');
  else if (r.dropped) flash(`Depolama sınırı nedeniyle en eski ${r.dropped} kayıt silindi.`);
}

async function openEntry(e) {
  location.hash = '#/analiz';
  await loadImage(e.image);
  chart.calib = e.calib.refs.map((q) => ({ x: q.x, y: q.y }));
  $('calib-p1').value = e.calib.refs[0].price;
  $('calib-p2').value = e.calib.refs[1].price;
  $('opt-log').checked = !!e.calib.log;
  const s = e.settings || {};
  if (s.pattern) $('opt-pattern').value = s.pattern;
  if (s.ruleSet && RULE_SETS[s.ruleSet]) $('opt-ruleset').value = s.ruleSet;
  if (s.diagonalKind) $('opt-diag-kind').value = s.diagonalKind;
  $('opt-leverage').checked = !!s.leverage;
  chart.points = e.points.map((q) => ({ x: q.x, y: q.y }));
  state.calibAutoSwitched = true;
  setMode('points');
  state.entryId = e.id;
  state.analyzed = true;
  state.selected = e.selected || 0;
  refresh(true);
}

// ---------- Geçmiş sayfası ----------
function renderHistory() {
  const list = history.loadHistory();
  const el = $('history-list');
  if (!list.length) {
    el.innerHTML = '<div class="empty">Henüz kayıtlı analiz yok. Analiz ettiğin her grafik burada saklanır.</div>';
    return;
  }
  el.innerHTML = list
    .map((e) => {
      const d = new Date(e.date);
      const when = Number.isNaN(d.getTime()) ? '' : d.toLocaleString('tr-TR');
      const sum = e.summary || {};
      const pr = (sum.prices || []).map((p, i) => `${esc(sum.labels?.[i] ?? i)}: ${esc(fmtPrice(p))}`).join(' · ');
      const thumb = typeof e.thumb === 'string' && e.thumb.startsWith('data:image/') ? e.thumb : e.image;
      return `<div class="hist">
        <img src="${esc(thumb)}" alt="Analiz küçük resmi" loading="lazy">
        <div class="body">
          <b>${esc(sum.label || 'Analiz')}</b>
          <span class="muted small">${esc(when)} · ${sum.valid ? '✅ geçerli' : '❌ geçersiz'} · skor ${esc(sum.score ?? '—')}</span>
          <span class="small" style="font-family:var(--mono)">${pr}</span>
          <div class="row">
            <button type="button" class="btn small" data-open="${esc(e.id)}">Aç</button>
            <button type="button" class="btn small danger" data-del="${esc(e.id)}">Sil</button>
          </div>
        </div>
      </div>`;
    })
    .join('');
  el.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => {
    const e = history.loadHistory().find((x) => x.id === b.dataset.open);
    if (e) openEntry(e);
  }));
  el.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => {
    history.removeEntry(b.dataset.del);
    if (state.entryId === b.dataset.del) state.entryId = null;
    renderHistory();
  }));
}

function initHistoryPage() {
  $('btn-export').addEventListener('click', () => {
    const blob = new Blob([history.exportJSON()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ew-analizleri-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('import-input').addEventListener('change', async (ev) => {
    const f = ev.target.files[0];
    ev.target.value = '';
    if (!f) return;
    const st = $('history-status');
    try {
      const r = history.importEntries(await f.text());
      st.className = 'status small ok';
      st.textContent = `${r.added} kayıt eklendi${r.skipped ? `, ${r.skipped} kayıt zaten vardı` : ''}${r.dropped ? `, depolama sınırı nedeniyle ${r.dropped} eski kayıt atıldı` : ''}.`;
    } catch (e) {
      st.className = 'status small bad';
      st.textContent = `İçe aktarılamadı: ${e.message}`;
    }
    renderHistory();
  });
  $('btn-clear-history').addEventListener('click', () => {
    if (!confirm('Tüm analiz geçmişi bu tarayıcıdan silinsin mi?')) return;
    history.clearHistory();
    state.entryId = null;
    renderHistory();
  });
}

// ---------- Yönlendirme ----------
function currentRoute() {
  const r = location.hash.replace(/^#\/?/, '') || 'analiz';
  return ['analiz', 'kurallar', 'gecmis'].includes(r) ? r : 'analiz';
}

let rulesReady = false;
function route() {
  const r = currentRoute();
  document.querySelectorAll('.view').forEach((v) => { v.hidden = v.dataset.view !== r; });
  document.querySelectorAll('[data-route]').forEach((a) => a.classList.toggle('active', a.dataset.route === r));
  if (r === 'kurallar' && !rulesReady) { initRulesPage(); rulesReady = true; }
  if (r === 'gecmis') renderHistory();
  if (r === 'analiz') chart.draw();
}

let flashTimer;
function flash(msg) {
  const el = $('analyze-hint');
  el.textContent = msg;
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => refresh(false), 3500);
}

initControls();
initDropAndPaste();
initHistoryPage();
setMode('calib');
window.addEventListener('hashchange', route);
route();
refresh(false);
