// Cover art engine for Vice Lights: multi-panel poster layouts, sunset/neon
// colour grades and bold caption lettering, all drawn on canvas. Every
// function here is original work; no Rockstar artwork, logo or font is used.
// Panels are defined in relative coordinates so the same layout renders at
// any export size (1080x1080, 1080x1350, 1920x1080).

/** Panel layouts: each panel is [x, y, w, h] in fractions of the cover. */
export const LAYOUTS = {
  hero: {
    label: 'Hero + two',
    panels: [
      [0, 0, 0.64, 1],
      [0.64, 0, 0.36, 0.5],
      [0.64, 0.5, 0.36, 0.5],
    ],
  },
  triptych: {
    label: 'Triptych',
    panels: [
      [0, 0, 0.34, 1],
      [0.34, 0, 0.32, 1],
      [0.66, 0, 0.34, 1],
    ],
  },
  grid: {
    label: 'Four squares',
    panels: [
      [0, 0, 0.5, 0.5],
      [0.5, 0, 0.5, 0.5],
      [0, 0.5, 0.5, 0.5],
      [0.5, 0.5, 0.5, 0.5],
    ],
  },
};

/** Colour grades: a canvas filter plus a gradient overlay per grade. */
export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    filter: 'saturate(1.28) contrast(1.06) sepia(0.16)',
    overlay: (w, h) => {
      const g = { stops: [[0, 'rgba(255,170,60,0.10)'], [0.55, 'rgba(255,110,80,0.16)'], [1, 'rgba(190,40,120,0.30)']], vertical: true };
      return g;
    },
  },
  neon: {
    label: 'Neon Nights',
    filter: 'saturate(1.55) contrast(1.12) hue-rotate(-12deg)',
    overlay: () => ({ stops: [[0, 'rgba(255,0,160,0.16)'], [0.5, 'rgba(80,0,120,0.10)'], [1, 'rgba(0,220,255,0.20)']], vertical: false }),
  },
  palm: {
    label: 'Palm Dusk',
    filter: 'saturate(1.18) contrast(1.08)',
    overlay: () => ({ stops: [[0, 'rgba(0,140,150,0.18)'], [0.6, 'rgba(255,150,60,0.08)'], [1, 'rgba(255,90,40,0.22)']], vertical: true }),
  },
  noir: {
    label: 'Noir',
    filter: 'grayscale(1) contrast(1.18) brightness(0.96)',
    overlay: () => ({ stops: [[0, 'rgba(120,80,180,0.10)'], [1, 'rgba(10,10,30,0.28)']], vertical: true }),
  },
};

export const EXPORT_SIZES = [
  { id: 'square', label: 'Square 1080 x 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  { id: 'landscape', label: 'Wide 1920 x 1080', w: 1920, h: 1080 },
];

/** Small deterministic PRNG so the procedural sample is stable. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Draws an original procedural sample scene (sunset skyline with palms and
 * water) onto `canvas` at its own size. No photo, no borrowed artwork.
 */
export function drawProceduralScene(canvas, seed = 7) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const rnd = mulberry32(seed);
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.72);
  sky.addColorStop(0, '#2b1055');
  sky.addColorStop(0.45, '#c94b7c');
  sky.addColorStop(0.75, '#ff7e3d');
  sky.addColorStop(1, '#ffc46b');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.72);
  // Sun with glow.
  const sunX = w * 0.62, sunY = h * 0.52, sunR = h * 0.13;
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.4);
  glow.addColorStop(0, 'rgba(255,240,180,0.9)');
  glow.addColorStop(1, 'rgba(255,140,60,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h * 0.72);
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath(); ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2); ctx.fill();
  // Skyline.
  const base = h * 0.72;
  let x = 0;
  while (x < w) {
    const bw = w * (0.06 + rnd() * 0.09);
    const bh = h * (0.12 + rnd() * 0.3);
    ctx.fillStyle = '#1c0f2e';
    ctx.fillRect(x, base - bh, bw, bh);
    ctx.fillStyle = 'rgba(255,210,110,0.85)';
    for (let wy = base - bh + 8; wy < base - 10; wy += 16) {
      for (let wx = x + 6; wx < x + bw - 6; wx += 14) {
        if (rnd() < 0.45) ctx.fillRect(wx, wy, 5, 7);
      }
    }
    x += bw + w * 0.012;
  }
  // Water with sun reflection.
  const sea = ctx.createLinearGradient(0, base, 0, h);
  sea.addColorStop(0, '#7a2d6e');
  sea.addColorStop(1, '#12082a');
  ctx.fillStyle = sea;
  ctx.fillRect(0, base, w, h - base);
  ctx.fillStyle = 'rgba(255,220,140,0.5)';
  for (let i = 0; i < 26; i++) {
    const ry = base + 6 + rnd() * (h - base - 12);
    const rw = w * (0.02 + rnd() * 0.09);
    ctx.fillRect(sunX - rw / 2 + (rnd() - 0.5) * w * 0.08, ry, rw, 3);
  }
  // Palm silhouettes.
  const palm = (px, py, s) => {
    ctx.strokeStyle = '#140a24';
    ctx.lineWidth = Math.max(3, s * 0.03);
    ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + s * 0.12, py - s * 0.5, px + s * 0.3, py - s * 0.62); ctx.stroke();
    ctx.lineWidth = Math.max(2, s * 0.02);
    for (let f = 0; f < 6; f++) {
      const a = Math.PI * (0.15 + f * 0.22);
      const tx = px + s * 0.3 + Math.cos(a) * s * 0.34;
      const ty = py - s * 0.62 + Math.sin(a) * s * 0.22 - s * 0.08;
      ctx.beginPath(); ctx.moveTo(px + s * 0.3, py - s * 0.62);
      ctx.quadraticCurveTo(px + s * 0.3 + Math.cos(a) * s * 0.18, py - s * 0.62 - s * 0.16, tx, ty); ctx.stroke();
    }
  };
  palm(w * 0.08, base, h * 0.34);
  palm(w * 0.9, base, h * 0.26);
}

/** Draws one photo into a panel rect with cover-fit, zoom and pan. */
function drawPanelPhoto(ctx, photo, rect, panel) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const iw = photo.naturalWidth || photo.width;
  const ih = photo.naturalHeight || photo.height;
  const zoom = panel.zoom || 1;
  const base = Math.max(w / iw, h / ih) * zoom;
  const pw = iw * base, ph = ih * base;
  const ox = (panel.ox || 0) * w, oy = (panel.oy || 0) * h;
  ctx.drawImage(photo, x + (w - pw) / 2 + ox, y + (h - ph) / 2 + oy, pw, ph);
  ctx.restore();
}

/** Paints the grade overlay over a rect. */
function gradeOverlay(ctx, grade, rect) {
  const spec = GRADES[grade] || GRADES.sunset;
  const { x, y, w, h } = rect;
  const def = spec.overlay(w, h);
  const g = def.vertical
    ? ctx.createLinearGradient(x, y, x, y + h)
    : ctx.createLinearGradient(x, y, x + w, y + h);
  for (const [stop, color] of def.stops) g.addColorStop(stop, color);
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/** Fits `text` to `maxWidth` by shrinking the font, returns the size used. */
function fitFont(ctx, text, maxWidth, startSize, family) {
  let size = startSize;
  ctx.font = `900 ${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > 12) {
    size -= 2;
    ctx.font = `900 ${size}px ${family}`;
  }
  return size;
}

const TITLE_FAMILY = `'Arial Black', 'Archivo Black', 'Helvetica Neue', Arial, sans-serif`;

/** Draws the caption band: scrim, bold title, subtitle, thin rule. */
function drawCaption(ctx, state, w, h) {
  const title = (state.title || '').trim().toUpperCase();
  const sub = (state.subtitle || '').trim();
  if (!title && !sub) return;
  const bandH = h * 0.21;
  const bandY = h - bandH;
  const scrim = ctx.createLinearGradient(0, bandY - h * 0.06, 0, h);
  scrim.addColorStop(0, 'rgba(10,4,24,0)');
  scrim.addColorStop(0.35, 'rgba(10,4,24,0.72)');
  scrim.addColorStop(1, 'rgba(10,4,24,0.92)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, bandY - h * 0.06, w, bandH + h * 0.06);
  // Accent rule above the title.
  ctx.fillStyle = '#ff5e8a';
  ctx.fillRect(w * 0.06, bandY + bandH * 0.14, w * 0.16, Math.max(3, h * 0.006));
  if (title) {
    const size = fitFont(ctx, title, w * 0.88, h * 0.085, TITLE_FAMILY);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(20,4,30,0.9)';
    ctx.lineWidth = size * 0.14;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255,60,140,0.55)';
    ctx.shadowBlur = size * 0.25;
    const ty = bandY + bandH * 0.14 + size * 1.05;
    ctx.strokeText(title, w * 0.06, ty);
    ctx.fillText(title, w * 0.06, ty);
    ctx.shadowBlur = 0;
    if (sub) {
      ctx.font = `700 ${Math.max(14, h * 0.024)}px 'Helvetica Neue', Arial, sans-serif`;
      ctx.fillStyle = '#ffd166';
      ctx.fillText(sub.toUpperCase(), w * 0.06, ty + h * 0.055);
    }
  } else if (sub) {
    ctx.font = `700 ${Math.max(14, h * 0.03)}px 'Helvetica Neue', Arial, sans-serif`;
    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'left';
    ctx.fillText(sub.toUpperCase(), w * 0.06, bandY + bandH * 0.55);
  }
}

/**
 * Renders the whole cover onto `canvas` at its own size, from `state`:
 * { layout, grade, title, subtitle, panels: [{ photo, zoom, ox, oy }] }.
 * A panel with no photo draws a procedural placeholder gradient.
 */
export function renderCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const layout = LAYOUTS[state.layout] || LAYOUTS.hero;
  ctx.fillStyle = '#12082a';
  ctx.fillRect(0, 0, w, h);
  const gutter = Math.max(2, Math.round(w * 0.004));
  layout.panels.forEach((p, i) => {
    const rect = {
      x: p[0] * w + (p[0] > 0 ? gutter : 0),
      y: p[1] * h + (p[1] > 0 ? gutter : 0),
      w: p[2] * w - (p[0] > 0 ? gutter : 0) - (p[0] + p[2] < 1 ? gutter : 0),
      h: p[3] * h - (p[1] > 0 ? gutter : 0) - (p[1] + p[3] < 1 ? gutter : 0),
    };
    const panel = state.panels[i] || {};
    if (panel.photo) {
      ctx.save();
      ctx.filter = (GRADES[state.grade] || GRADES.sunset).filter;
      drawPanelPhoto(ctx, panel.photo, rect, panel);
      ctx.restore();
      gradeOverlay(ctx, state.grade, rect);
    } else {
      const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
      g.addColorStop(0, '#3a1c5e');
      g.addColorStop(1, '#12082a');
      ctx.fillStyle = g;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = `700 ${Math.max(12, h * 0.018)}px 'Helvetica Neue', Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
    }
    // Vignette per panel.
    const vg = ctx.createRadialGradient(
      rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.35,
      rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.75,
    );
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.32)');
    ctx.fillStyle = vg;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    // White gutter frame.
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = gutter;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });
  drawCaption(ctx, state, w, h);
  // Thin outer frame.
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(3, w * 0.004);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
}
