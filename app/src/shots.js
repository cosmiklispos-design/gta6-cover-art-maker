// Fixed scenes for screenshots: ?shot=editor shows the page with sample
// photos loaded; ?shot=cover shows the exported cover alone at the chosen
// size. Query params: size=square|portrait|landscape, photo=pier|boulevard|
// procedural|mix, caption=..., layout=hero|triptych|grid, grade=sunset|neon|
// palm|noir. window.__shotReady is set once painted.
import { EXPORT_SIZES } from './cover.js';

export async function runShot(shot, query, api) {
  const { state, loadImage, proceduralPhoto, setPanelPhoto, redraw } = api;
  const sizeId = query.get('size') || 'square';
  state.size = EXPORT_SIZES.find((s) => s.id === sizeId) || EXPORT_SIZES[0];
  state.layout = query.get('layout') || 'hero';
  state.grade = query.get('grade') || 'sunset';
  state.title = query.get('caption') || 'Sunset Heist';
  state.subtitle = query.get('subtitle') || 'Vice Lights · 2026';
  document.getElementById('layout').value = state.layout;
  document.getElementById('grade').value = state.grade;
  document.getElementById('size').value = state.size.id;
  document.getElementById('caption').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;

  const photo = query.get('photo') || 'mix';
  const pier = await loadImage('samples/pier.jpg');
  const boulevard = await loadImage('samples/boulevard.jpg');
  const skyline = proceduralPhoto();
  const pick = (name) => (name === 'pier' ? pier : name === 'boulevard' ? boulevard : skyline);
  if (photo === 'mix') {
    // Fill every panel the layout has (hero/triptych have 3, grid has 4).
    const fill = [pier, boulevard, skyline, pier];
    const kinds = ['sample', 'sample', 'procedural', 'sample'];
    for (let i = 0; i < 4; i++) setPanelPhoto(i, fill[i], kinds[i]);
  } else {
    const img = pick(photo);
    const kind = photo === 'procedural' ? 'procedural' : 'sample';
    setPanelPhoto(0, img, kind);
    setPanelPhoto(1, img, kind);
    setPanelPhoto(2, img, kind);
  }
  if (shot === 'cover') document.body.classList.add('shot-cover');
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
