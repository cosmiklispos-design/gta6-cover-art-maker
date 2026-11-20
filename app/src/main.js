// Wires Vice Lights: pick photos per panel, choose a layout and a grade,
// edit the caption, drag to position a photo, export the cover as a PNG.
// Photos are read on the user's own machine (FileReader / object URLs) and
// never uploaded. A `?shot=` query sets up a fixed scene for a screenshot.
import { LAYOUTS, GRADES, EXPORT_SIZES, renderCover, drawProceduralScene } from './cover.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const statusEl = $('status');
const panelList = $('panel-list');

const state = {
  layout: 'hero',
  grade: 'sunset',
  title: 'Sunset Heist',
  subtitle: 'Vice Lights · 2026',
  size: EXPORT_SIZES[0],
  panels: [],
};
let selected = 0;
let proceduralCanvas = null;

function panelCount() {
  return (LAYOUTS[state.layout] || LAYOUTS.hero).panels.length;
}

function ensurePanels() {
  const n = panelCount();
  while (state.panels.length < n) state.panels.push({ photo: null, kind: '', zoom: 1, ox: 0, oy: 0 });
  state.panels.length = n;
  if (selected >= n) selected = 0;
}

function sizeCanvas() {
  canvas.width = state.size.w;
  canvas.height = state.size.h;
}

function redraw() {
  ensurePanels();
  sizeCanvas();
  renderCover(canvas, state);
  renderPanelList();
}

function setStatus(text) {
  statusEl.textContent = text;
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Returns the procedural sample as a canvas element (drawn once). */
function proceduralPhoto() {
  if (!proceduralCanvas) {
    proceduralCanvas = document.createElement('canvas');
    proceduralCanvas.width = 1080;
    proceduralCanvas.height = 1080;
    drawProceduralScene(proceduralCanvas, 7);
  }
  return proceduralCanvas;
}

function setPanelPhoto(i, photo, kind) {
  ensurePanels();
  state.panels[i] = { photo, kind, zoom: 1, ox: 0, oy: 0 };
  redraw();
  setStatus(`Panel ${i + 1}: photo set (${kind}). Drag the preview to position it.`);
}

/** Builds the per-panel control rows. */
function renderPanelList() {
  panelList.innerHTML = '';
  state.panels.forEach((panel, i) => {
    const row = document.createElement('div');
    row.className = 'panel-row' + (i === selected ? ' selected' : '');
    row.innerHTML = `
      <button type="button" class="panel-pick" data-i="${i}">Panel ${i + 1}${panel.kind ? ' · ' + panel.kind : ''}</button>
      <label class="file-btn">Upload<input type="file" accept="image/*" data-i="${i}"></label>
      <select class="sample-pick" data-i="${i}" aria-label="Sample photo for panel ${i + 1}">
        <option value="">Sample…</option>
        <option value="pier">Pier dusk</option>
        <option value="boulevard">Boulevard</option>
        <option value="procedural">Neon skyline (drawn)</option>
      </select>
      <label class="zoom">Zoom <input type="range" min="1" max="2.5" step="0.05" value="${panel.zoom}" data-i="${i}"></label>`;
    panelList.appendChild(row);
  });
  panelList.querySelectorAll('.panel-pick').forEach((b) => {
    b.addEventListener('click', () => { selected = Number(b.dataset.i); redraw(); });
  });
  panelList.querySelectorAll('input[type=file]').forEach((input) => {
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const img = await loadImage(URL.createObjectURL(file));
      setPanelPhoto(Number(input.dataset.i), img, 'upload');
    });
  });
  panelList.querySelectorAll('.sample-pick').forEach((sel) => {
    sel.addEventListener('change', async (e) => {
      const v = e.target.value;
      if (!v) return;
      const i = Number(sel.dataset.i);
      if (v === 'procedural') setPanelPhoto(i, proceduralPhoto(), 'procedural');
      else setPanelPhoto(i, await loadImage(`samples/${v}.jpg`), 'sample');
      sel.value = '';
    });
  });
  panelList.querySelectorAll('input[type=range]').forEach((range) => {
    range.addEventListener('input', () => {
      const i = Number(range.dataset.i);
      state.panels[i].zoom = Number(range.value);
      // Repaint only: rebuilding the panel list here would destroy the
      // slider mid-drag.
      renderCover(canvas, state);
    });
  });
}

// Layout and grade pickers.
const layoutEl = $('layout');
for (const [id, def] of Object.entries(LAYOUTS)) {
  const opt = document.createElement('option');
  opt.value = id;
  opt.textContent = def.label;
  layoutEl.appendChild(opt);
}
layoutEl.addEventListener('change', () => { state.layout = layoutEl.value; redraw(); });

const gradeEl = $('grade');
for (const [id, def] of Object.entries(GRADES)) {
  const opt = document.createElement('option');
  opt.value = id;
  opt.textContent = def.label;
  gradeEl.appendChild(opt);
}
gradeEl.addEventListener('change', () => { state.grade = gradeEl.value; redraw(); });

const sizeEl = $('size');
for (const s of EXPORT_SIZES) {
  const opt = document.createElement('option');
  opt.value = s.id;
  opt.textContent = s.label;
  sizeEl.appendChild(opt);
}
sizeEl.addEventListener('change', () => {
  state.size = EXPORT_SIZES.find((s) => s.id === sizeEl.value) || EXPORT_SIZES[0];
  redraw();
});

// Caption inputs.
$('caption').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
$('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });

// Drag the preview to pan the selected panel's photo.
let drag = null;
function panelAt(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  const x = (clientX - r.left) / r.width;
  const y = (clientY - r.top) / r.height;
  const layout = LAYOUTS[state.layout];
  for (let i = 0; i < layout.panels.length; i++) {
    const [px, py, pw, ph] = layout.panels[i];
    if (x >= px && x < px + pw && y >= py && y < py + ph) return i;
  }
  return 0;
}
canvas.addEventListener('pointerdown', (e) => {
  selected = panelAt(e.clientX, e.clientY);
  drag = { x: e.clientX, y: e.clientY, ox: state.panels[selected].ox, oy: state.panels[selected].oy };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const r = canvas.getBoundingClientRect();
  const p = state.panels[selected];
  p.ox = drag.ox + (e.clientX - drag.x) / r.width;
  p.oy = drag.oy + (e.clientY - drag.y) / r.height;
  p.ox = Math.max(-0.5, Math.min(0.5, p.ox));
  p.oy = Math.max(-0.5, Math.min(0.5, p.oy));
  renderCover(canvas, state);
});
canvas.addEventListener('pointerup', () => { drag = null; renderPanelList(); });

// Export: render at the chosen size and download the PNG.
async function exportCover(size) {
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  renderCover(off, state);
  const blob = await new Promise((resolve) => off.toBlob(resolve, 'image/png'));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vice-lights-${size.w}x${size.h}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  setStatus(`Saved vice-lights-${size.w}x${size.h}.png`);
}
$('export').addEventListener('click', () => exportCover(state.size));
document.querySelectorAll('[data-export-size]').forEach((b) => {
  b.addEventListener('click', () => {
    const size = EXPORT_SIZES.find((s) => s.id === b.dataset.exportSize);
    if (size) exportCover(size);
  });
});

/** Loads the starter samples into the panels (used on first paint and by shots). */
export async function loadStarterSamples() {
  const pier = await loadImage('samples/pier.jpg');
  const boulevard = await loadImage('samples/boulevard.jpg');
  setPanelPhoto(0, pier, 'sample');
  setPanelPhoto(1, boulevard, 'sample');
  setPanelPhoto(2, proceduralPhoto(), 'procedural');
  return { pier, boulevard };
}

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, { state, loadImage, proceduralPhoto, setPanelPhoto, redraw });
} else {
  loadStarterSamples().then(() => setStatus('Loaded the sample photos. Replace any panel with your own photo.'));
}
