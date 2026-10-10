// "Kurallar" sayfası: tüm kurallar, kural setleri ve bilgi notları.
import { RULES, RULE_SETS, TYPE_LABELS } from '../rules/index.js';
import { PATTERNS, PATTERN_ORDER } from '../engine/patterns.js';
import { NOTES, GENERAL_NOTES } from '../knowledge/notes.js';
import { esc } from './results.js';

const $ = (id) => document.getElementById(id);
const SET_SHORT = { fp: 'F&P', neely: 'Neely', course: 'Kurs' };
const VARIANT_TR = { contracting: 'daralan', expanding: 'genişleyen', 'double-zigzag': 'çift zigzag', combination: 'kombinasyon' };

export function initRulesPage() {
  $('rules-set').innerHTML = '<option value="">Hepsi</option>' + Object.values(RULE_SETS).map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
  $('rules-pattern').innerHTML =
    '<option value="">Hepsi</option><option value="*">Ortak (tüm kalıplar)</option>' +
    PATTERN_ORDER.map((id) => `<option value="${id}">${esc(PATTERNS[id].name)}</option>`).join('');
  for (const id of ['rules-set', 'rules-pattern', 'rules-type']) $(id).addEventListener('change', renderRules);
  $('rules-search').addEventListener('input', renderRules);
  renderRules();
  renderNotes();
}

function renderRules() {
  const set = $('rules-set').value;
  const pat = $('rules-pattern').value;
  const type = $('rules-type').value;
  const q = $('rules-search').value.trim().toLocaleLowerCase('tr');

  $('rules-sets').innerHTML = Object.values(RULE_SETS)
    .map((s) => `<div class="set-card ${s.id === set ? 'active' : ''}"><b>${esc(s.name)}</b><p class="muted">${esc(s.description)}</p></div>`)
    .join('');

  const match = (r) =>
    (!set || r.sets.includes(set)) &&
    (!pat || r.patterns.includes(pat)) &&
    (!type || r.type === type) &&
    (!q || `${r.id} ${r.name} ${r.description} ${r.source}`.toLocaleLowerCase('tr').includes(q));

  const groups = [['*', 'Ortak kurallar ve Hasanwavebot hatırlatmaları'], ...PATTERN_ORDER.map((id) => [id, PATTERNS[id].name])];
  const html = groups
    .map(([id, title]) => {
      const list = RULES.filter((r) => r.patterns.includes(id) && match(r));
      if (!list.length) return '';
      return `<div class="rule-group"><h2>${esc(title)} <span class="muted small">(${list.length})</span></h2>
        ${list.map((r) => `<div class="rule-item">
          <div class="top"><span class="badge ${r.type}">${TYPE_LABELS[r.type]}</span><span class="title">${esc(r.name)}</span><span class="rid">${esc(r.id)}</span></div>
          <p>${esc(r.description)}</p>
          <div class="top" style="margin-top:.35rem">
            ${r.sets.map((s) => `<span class="badge">${SET_SHORT[s]}</span>`).join('')}
            ${r.variants ? r.variants.map((v) => `<span class="badge">${esc(VARIANT_TR[v] || v)}</span>`).join('') : ''}
            <span class="src">Kaynak: ${esc(r.source)}</span>
          </div>
        </div>`).join('')}</div>`;
    })
    .join('');
  $('rules-list').innerHTML = html || '<div class="empty">Filtreye uyan kural yok.</div>';
}

function renderNotes() {
  const general = GENERAL_NOTES.map((n) => `<div class="card"><h3>${esc(n.title)}</h3><p>${esc(n.body)}</p></div>`).join('');
  const patterns = PATTERN_ORDER.map((id) => {
    const n = NOTES[id];
    return `<div class="card"><h3>${esc(n.title)}</h3><p>${esc(n.summary)}</p><ul>${n.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul><p class="muted small">Kaynaklar: ${esc(n.sources)}</p></div>`;
  }).join('');
  $('notes-list').innerHTML = general + patterns;
}
