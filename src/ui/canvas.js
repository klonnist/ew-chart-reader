// Grafik tuvali: görsel + kalibrasyon işaretleri + dönüş noktaları + hedef/geçersizlik çizgileri.
// Fare ve dokunma için Pointer Events kullanır; noktalar sürüklenerek düzeltilebilir.

const COLORS = {
  line: '#00b3a4',
  point: '#00e0cc',
  calib: '#2f81f7',
  target: '#1f9d4a',
  invalid: '#e5484d',
  labelBg: 'rgba(13,17,23,.88)',
  labelText: '#ffffff',
};

export class ChartCanvas {
  constructor(canvas, { onBeforeChange, onChange }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onBeforeChange = onBeforeChange;
    this.onChange = onChange;
    this.image = null;
    this.points = [];
    this.calib = [];
    this.labels = [];
    this.maxPoints = 6;
    this.mode = 'calib';
    this.overlay = { targets: [], invalid: [] };
    this.calibText = ['', ''];
    this.drag = null;
    this.pending = null;

    canvas.addEventListener('pointerdown', (e) => this.down(e));
    canvas.addEventListener('pointermove', (e) => this.move(e));
    canvas.addEventListener('pointerup', (e) => this.up(e));
    canvas.addEventListener('pointercancel', () => { this.drag = null; this.pending = null; });
    new ResizeObserver(() => this.draw()).observe(canvas);
  }

  setImage(img) {
    this.image = img;
    this.canvas.width = img.naturalWidth || img.width;
    this.canvas.height = img.naturalHeight || img.height;
    this.draw();
  }

  setMode(mode) {
    this.mode = mode;
    this.canvas.classList.toggle('pan', mode === 'pan');
  }

  // CSS pikselinden tuval pikseline oran
  scale() {
    const r = this.canvas.getBoundingClientRect();
    return r.width ? this.canvas.width / r.width : 1;
  }

  toImg(e) {
    const r = this.canvas.getBoundingClientRect();
    const s = this.canvas.width / r.width;
    return { x: (e.clientX - r.left) * s, y: (e.clientY - r.top) * (this.canvas.height / r.height) };
  }

  hit(p) {
    const rad = 14 * this.scale();
    for (let i = this.points.length - 1; i >= 0; i--) {
      if (Math.hypot(this.points[i].x - p.x, this.points[i].y - p.y) <= rad) return { type: 'point', i };
    }
    for (let i = 0; i < this.calib.length; i++) {
      if (Math.hypot(this.calib[i].x - p.x, this.calib[i].y - p.y) <= rad) return { type: 'calib', i };
    }
    return null;
  }

  down(e) {
    if (!this.image || this.mode === 'pan') return;
    const p = this.toImg(e);
    const h = this.hit(p);
    if (h) {
      this.onBeforeChange();
      this.drag = h;
      this.canvas.setPointerCapture(e.pointerId);
      this.canvas.classList.add('dragging');
      e.preventDefault();
    } else {
      this.pending = { ...p, sx: e.clientX, sy: e.clientY };
    }
  }

  move(e) {
    if (!this.drag) return;
    const p = this.toImg(e);
    const x = Math.max(0, Math.min(this.canvas.width, p.x));
    const y = Math.max(0, Math.min(this.canvas.height, p.y));
    const arr = this.drag.type === 'point' ? this.points : this.calib;
    arr[this.drag.i] = { x, y };
    this.draw();
    this.onChange('drag');
  }

  up(e) {
    if (this.drag) {
      this.drag = null;
      this.canvas.classList.remove('dragging');
      this.onChange('drag-end');
      return;
    }
    const pend = this.pending;
    this.pending = null;
    if (!pend || Math.hypot(e.clientX - pend.sx, e.clientY - pend.sy) > 8) return;
    const p = { x: pend.x, y: pend.y };
    if (this.mode === 'calib') {
      this.onBeforeChange();
      if (this.calib.length < 2) this.calib.push(p);
      else {
        const i = Math.abs(this.calib[0].y - p.y) < Math.abs(this.calib[1].y - p.y) ? 0 : 1;
        this.calib[i] = p;
      }
      this.draw();
      this.onChange('calib');
    } else if (this.mode === 'points') {
      if (this.points.length >= this.maxPoints) {
        this.onChange('full');
        return;
      }
      this.onBeforeChange();
      this.points.push(p);
      this.draw();
      this.onChange('points');
    }
  }

  // ---------- Çizim ----------
  draw() {
    const { ctx, canvas } = this;
    if (!this.image) return;
    const s = this.scale();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(this.image, 0, 0, canvas.width, canvas.height);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const tags = [];
    this.calib.forEach((c, i) => tags.push(this.hline(c.y, COLORS.calib, `K${i + 1}${this.calibText[i] ? ': ' + this.calibText[i] : ''}`, s, [6, 4], c.x)));
    for (const t of this.overlay.targets) tags.push(this.hline(t.y, COLORS.target, t.label, s, [8, 5]));
    for (const t of this.overlay.invalid) tags.push(this.hline(t.y, COLORS.invalid, t.label, s, [3, 3], null, 2.2));
    // Yakın seviyelerin etiketleri üst üste binmesin: y'ye göre sırala, gerekirse aşağı kaydır.
    const h = 20 * s;
    let last = -Infinity;
    tags.sort((a, b) => a.y - b.y).forEach((t) => {
      const y = Math.max(t.y, last + h);
      last = y;
      this.tag(t.text, canvas.width - 6 * s, y, s, t.color, false, 'right');
    });

    const pts = this.points;
    if (pts.length > 1) {
      ctx.setLineDash([]);
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.strokeStyle = 'rgba(0,0,0,.55)';
      ctx.lineWidth = 5 * s;
      ctx.stroke();
      ctx.strokeStyle = COLORS.line;
      ctx.lineWidth = 2.5 * s;
      ctx.stroke();
    }
    pts.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6 * s, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.point;
      ctx.fill();
      ctx.lineWidth = 2 * s;
      ctx.strokeStyle = '#0d1117';
      ctx.stroke();
      const prev = pts[i - 1], next = pts[i + 1];
      const ref = next || prev;
      const isPeak = ref ? p.y <= ref.y : true;
      const label = this.labels[i] ?? String(i);
      this.tag(label, p.x, p.y + (isPeak ? -18 : 22) * s, s, COLORS.point, true);
    });
  }

  hline(y, color, label, s, dash, handleX = null, width = 1.6) {
    const { ctx, canvas } = this;
    ctx.save();
    ctx.setLineDash(dash.map((d) => d * s));
    ctx.strokeStyle = color;
    ctx.lineWidth = width * s;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
    ctx.restore();
    if (handleX !== null) {
      ctx.beginPath();
      ctx.arc(handleX, y, 7 * s, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 2 * s;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
    }
    return { y, text: label, color };
  }

  tag(text, x, y, s, color, bold, align = 'center') {
    const { ctx } = this;
    ctx.save();
    ctx.font = `${bold ? 700 : 500} ${Math.round(12.5 * s)}px system-ui, sans-serif`;
    const w = ctx.measureText(text).width + 10 * s;
    const h = 18 * s;
    let left = align === 'right' ? x - w : x - w / 2;
    left = Math.max(2 * s, Math.min(this.canvas.width - w - 2 * s, left));
    const top = Math.max(2 * s, Math.min(this.canvas.height - h - 2 * s, y - h / 2));
    ctx.fillStyle = COLORS.labelBg;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2 * s;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(left, top, w, h, 4 * s) : ctx.rect(left, top, w, h);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = bold ? color : COLORS.labelText;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, left + 5 * s, top + h / 2 + 0.5 * s);
    ctx.restore();
  }

  // Geçmiş için küçük resim (çizimlerle birlikte)
  snapshot(maxW, quality = 0.75) {
    const k = Math.min(1, maxW / this.canvas.width);
    const c = document.createElement('canvas');
    c.width = Math.round(this.canvas.width * k);
    c.height = Math.round(this.canvas.height * k);
    c.getContext('2d').drawImage(this.canvas, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', quality);
  }
}
