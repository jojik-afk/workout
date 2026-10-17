// Minimal single-series line chart in plain SVG: best reps per day.
// One series → no legend (the card title names it); thin 2 px line, 8 px
// markers, recessive grid, tap/hover anywhere to read the nearest point.

const W = 320;
const H = 150;
const M = { top: 12, right: 12, bottom: 22, left: 28 };

const fmtDate = (k) => {
  const [, m, d] = k.split('-').map(Number);
  return `${d}/${m}`;
};

function niceMax(v) {
  if (v <= 5) return 5;
  const step = v <= 20 ? 5 : 10;
  return Math.ceil(v / step) * step;
}

// points: [{ date: 'YYYY-MM-DD', best: number }] sorted by date
export function lineChart(container, points, { unit = 'reps' } = {}) {
  const max = niceMax(Math.max(...points.map((p) => p.best)));
  const iw = W - M.left - M.right;
  const ih = H - M.top - M.bottom;
  const x = (i) => M.left + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw);
  const y = (v) => M.top + ih - (v / max) * ih;
  const ticks = [0, Math.round(max / 2), max];

  container.innerHTML = `
    <div class="chart-readout" aria-live="polite"></div>
    <svg class="chart" viewBox="0 0 ${W} ${H}" role="img"
      aria-label="Best set over time, latest ${points.at(-1).best} ${unit}">
      ${ticks
        .map(
          (t) => `<line class="chart-grid" x1="${M.left}" x2="${W - M.right}" y1="${y(t)}" y2="${y(t)}"/>
                  <text class="chart-tick" x="${M.left - 6}" y="${y(t) + 4}" text-anchor="end">${t}</text>`,
        )
        .join('')}
      <text class="chart-tick" x="${x(0)}" y="${H - 6}" text-anchor="${points.length === 1 ? 'middle' : 'start'}">${fmtDate(points[0].date)}</text>
      ${points.length > 1 ? `<text class="chart-tick" x="${x(points.length - 1)}" y="${H - 6}" text-anchor="end">${fmtDate(points.at(-1).date)}</text>` : ''}
      <path class="chart-line" d="${points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.best).toFixed(1)}`).join('')}"/>
      <line class="chart-cross" y1="${M.top}" y2="${M.top + ih}" visibility="hidden"/>
      ${points.map((p, i) => `<circle class="chart-dot" cx="${x(i).toFixed(1)}" cy="${y(p.best).toFixed(1)}" r="4"/>`).join('')}
      <rect class="chart-hit" x="${M.left}" y="0" width="${iw}" height="${H}"/>
    </svg>`;

  const svg = container.querySelector('svg');
  const readout = container.querySelector('.chart-readout');
  const cross = container.querySelector('.chart-cross');
  const dots = [...container.querySelectorAll('.chart-dot')];
  const show = (i) => {
    const p = points[i];
    readout.textContent = `${fmtDate(p.date)} · ${p.best} ${unit}`;
    cross.setAttribute('x1', x(i));
    cross.setAttribute('x2', x(i));
    cross.setAttribute('visibility', 'visible');
    dots.forEach((d, j) => d.classList.toggle('is-active', j === i));
  };
  const reset = () => {
    const last = points.at(-1);
    const best = Math.max(...points.map((p) => p.best));
    readout.textContent = `Latest ${last.best} · record ${best} ${unit}`;
    cross.setAttribute('visibility', 'hidden');
    dots.forEach((d) => d.classList.remove('is-active'));
  };
  const nearest = (evt) => {
    const r = svg.getBoundingClientRect();
    const px = ((evt.clientX - r.left) / r.width) * W;
    let bi = 0;
    for (let i = 1; i < points.length; i++) if (Math.abs(x(i) - px) < Math.abs(x(bi) - px)) bi = i;
    return bi;
  };
  svg.addEventListener('pointermove', (e) => show(nearest(e)));
  svg.addEventListener('pointerdown', (e) => show(nearest(e)));
  svg.addEventListener('pointerleave', reset);
  reset();
}
