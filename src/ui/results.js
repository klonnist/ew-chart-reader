// Analiz sonucunu HTML olarak çizer.
import { price } from '../engine/helpers.js';
import { NOTES } from '../knowledge/notes.js';
import { RULE_SETS } from '../rules/index.js';

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

const ICON = { pass: '✅', fail: '❌', warn: '⚠️', na: '⏳', info: '📋' };
const DISCLAIMER = '<div class="disclaimer">Yatırım tavsiyesi değildir.</div>';

function candCard(c, i, selected) {
  const cls = ['cand', selected ? 'selected' : '', c.valid ? '' : 'invalid'].join(' ');
  const badge = c.valid ? '<span class="badge ok">Kurallar geçti</span>' : `<span class="badge rule">${c.fails} kural bozuldu</span>`;
  return `<button type="button" class="${cls}" data-cand="${i}">
    <span class="rank">#${i + 1} ${badge}</span>
    <span class="name">${esc(c.label)}</span>
    <div class="bar"><span style="width:${c.score}%"></span></div>
    <div class="meta"><span>Skor ${c.score}/100</span><span>${c.warns} uyarı</span></div>
  </button>`;
}

function ruleRows(list) {
  return list
    .map(
      (r) => `<tr class="${r.status}">
      <td class="st" title="${r.status}">${ICON[r.status]}</td>
      <td><b>${esc(r.rule.name)}</b> <span class="rid">${esc(r.rule.id)}</span><span class="src">${esc(r.rule.source)}</span></td>
      <td>${esc(r.detail)}</td>
    </tr>`,
    )
    .join('');
}

function levels(items) {
  return items
    .map((x) => `<div class="lvl"><span>${esc(x.label)}</span><span class="price">${x.price === null ? '—' : esc(price(x.price))}</span></div>`)
    .join('');
}

export function renderResults(el, res, sel, opts) {
  if (!res.ok) {
    el.innerHTML = `<div class="error-box">${esc(res.error)}</div>${DISCLAIMER}`;
    return;
  }
  const c = res.candidates[sel];
  const set = RULE_SETS[res.options.ruleSet];
  const auto = res.options.pattern === 'auto';
  const rules = c.results.filter((r) => r.rule.type === 'rule');
  const guides = c.results.filter((r) => r.rule.type === 'guideline');
  const reminders = c.results.filter((r) => r.status === 'info');
  const note = NOTES[c.noteId];
  const anyValid = res.candidates.some((x) => x.valid);

  el.innerHTML = `
    <div class="results-head">
      <h2>${auto ? 'Adaylar (skora göre sıralı)' : 'Sonuç'}</h2>
      <span class="muted small">${res.n} nokta · kural seti: ${esc(set.name)} · ${res.options.logScale ? 'log ölçek' : 'lineer ölçek'}</span>
    </div>
    ${auto && !anyValid ? '<div class="error-box">Hiçbir kalıbın kırılmaz kurallarının hepsi geçmedi. Noktaları kontrol et ya da alternatif bir dalga derecesi düşün.</div>' : ''}
    <div class="cand-list">${res.candidates.map((x, i) => candCard(x, i, i === sel)).join('')}</div>

    <div class="detail">
      <div class="card wide">
        <h3>${esc(c.label)} ${c.valid ? '<span class="badge ok">Geçerli sayım</span>' : '<span class="badge rule">Geçersiz sayım</span>'}</h3>
        <p class="muted small">Etiketler: ${c.labels.map(esc).join(' – ')} · ${c.complete ? 'Kalıp tamamlandı' : 'Kalıp devam ediyor (yarım sayım)'} · Skor ${c.score}/100 (yalnızca kılavuzlardan hesaplanır)${c.alternatives?.length ? ` · Diğer geçerli varyant: ${c.alternatives.map(esc).join(', ')}` : ''}</p>
      </div>

      <div class="card invalidation">
        <h3>Geçersizlik seviyesi</h3>
        ${c.invalidation.length ? levels(c.invalidation) : '<p class="muted">Bu aşamada sabit bir seviye yok.</p>'}
      </div>

      <div class="card targets">
        <h3>${c.targets ? esc(c.targets.title) : 'Fibonacci hedefleri'}</h3>
        ${c.targets
          ? c.targets.items.length ? levels(c.targets.items) + '<p class="muted small">Hedefler grafikte yeşil kesikli çizgiyle gösterilir.</p>' : `<p class="muted">${esc(c.targets.note || 'Hedef yok.')}</p>`
          : '<p class="muted">Kırılmaz bir kural bozulduğu için hedef hesaplanmadı (önce geçerli sayım, sonra oran).</p>'}
      </div>

      <div class="card">
        <h3>Ölçülen oranlar</h3>
        ${c.ratios.length ? `<div class="table-wrap"><table><thead><tr><th>Oran</th><th>Değer</th><th>Tipik</th><th></th></tr></thead><tbody>
          ${c.ratios.map((r) => `<tr><td>${esc(r.label)}</td><td><b>${esc(r.display)}</b></td><td class="muted">${esc(r.typical)}</td><td>${r.ok ? '✅' : '⚠️'}</td></tr>`).join('')}
        </tbody></table></div>` : '<p class="muted">Henüz ölçülecek oran yok.</p>'}
      </div>

      <div class="card wide">
        <h3>Kural tablosu</h3>
        <div class="table-wrap"><table>
          <thead><tr><th></th><th>Kontrol</th><th>Neden</th></tr></thead>
          <tbody>
            <tr><td colspan="3" class="group-title">Kırılmaz kurallar</td></tr>
            ${ruleRows(rules)}
            <tr><td colspan="3" class="group-title">Kılavuzlar</td></tr>
            ${guides.length ? ruleRows(guides) : '<tr><td colspan="3" class="muted">Bu kalıp ve sette kılavuz yok.</td></tr>'}
          </tbody>
        </table></div>
        <p class="muted small">✅ geçti · ❌ bozuldu · ⚠️ kılavuzdan sapma · ⏳ henüz kontrol edilemez (nokta eksik)</p>
      </div>

      <div class="card wide">
        <h3>Kontrol hatırlatmaları</h3>
        <ul class="reminders">${reminders.map((r) => `<li>📋 <b>${esc(r.rule.name)}:</b> ${esc(r.detail)}</li>`).join('')}</ul>
      </div>

      ${note ? `<div class="card wide"><details class="note"><summary>Bilgi notu: ${esc(note.title)}</summary>
        <p>${esc(note.summary)}</p><ul>${note.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
        <p class="muted small">Kaynaklar: ${esc(note.sources)}</p></details></div>` : ''}
    </div>
    ${DISCLAIMER}`;

  el.querySelectorAll('[data-cand]').forEach((b) => b.addEventListener('click', () => opts.onSelect(Number(b.dataset.cand))));
}
