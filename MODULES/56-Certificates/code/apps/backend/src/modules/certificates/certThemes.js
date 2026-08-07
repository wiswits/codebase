'use strict';
/*
 * Built-in certificate designs.
 *
 * WHY THESE ARE DRAWN, NOT SHIPPED AS PNGs:
 * a PNG background is fixed at one resolution and one orientation. Ship six of
 * them and you ship twelve files (landscape + portrait), each of which is either
 * too small to print or too heavy to store, and none of which can pick up the
 * organisation's own colours. These themes are markup instead — the same Chrome
 * that renders the certificate draws the frame, so it is vector-sharp at 300 DPI
 * or 1200, works in both orientations from one definition, and costs nothing in
 * the repository.
 *
 * Uploading custom artwork stays fully supported; a theme is simply what an
 * organisation gets before it has any.
 *
 * EVERY dimension here is a FRACTION of the sheet height, resolved once by the
 * caller against px (screenshot) or mm (PDF) — see certRender.js. No pixel
 * literals: they would silently mean different physical sizes in the two renders.
 */

/**
 * Fraction of sheet height → CSS length, resolved at draw time against --sh.
 *
 * Lives HERE rather than in certRender because certRender imports this file for
 * the theme table; defining it there and importing it back created a require
 * cycle in which THEMES was momentarily undefined.
 */
const CSS_H = (n) => `calc(var(--sh) * ${Number(n).toFixed(6)})`;

/**
 * A theme's frame markup, ready to drop into any sheet that defines --sh.
 * The backend renders it into the PNG/PDF; the bootstrap endpoint ships the same
 * string to the editor. One definition, three renderers, no drift.
 */
function themeFrame(key, landscape = true) {
  const th = THEMES[key];
  return th ? th.background(CSS_H, landscape) : '';
}

// Shared element factory. Coordinates are fractions of the sheet (see certRender).
const t = (key, over = {}) => ({ type: 'text', key, ...over });

/**
 * Frame markup. `f(n)` converts a fraction-of-height into a concrete length in
 * the caller's unit, so a theme never needs to know whether it is being drawn
 * in millimetres or pixels.
 */
function layer(style) {
  return `<div style="position:absolute;${style};pointer-events:none"></div>`;
}

function corners(inset, size, weight, colour, f) {
  const i = (inset * 100).toFixed(3);
  const s = f(size);
  const w = f(weight);
  const c = (v, extra) => layer(`${v};width:${s};height:${s};${extra};border-color:${colour};border-style:solid`);
  return [
    c(`left:${i}%;top:${i}%`, `border-width:${w} 0 0 ${w}`),
    c(`right:${i}%;top:${i}%`, `border-width:${w} ${w} 0 0`),
    c(`left:${i}%;bottom:${i}%`, `border-width:0 0 ${w} ${w}`),
    c(`right:${i}%;bottom:${i}%`, `border-width:0 ${w} ${w} 0`),
  ].join('');
}

const THEMES = {
  // ── 1 ─────────────────────────────────────────────────────────────────────
  'royal-navy': {
    label: 'Royal Navy',
    description: 'Double navy frame with a gold inner rule. The safe corporate default.',
    ground: '#FCFAF3',
    accent: '#B8912F',
    ink: '#0F2147',
    background: (f) => [
      layer(`inset:${f(0.03)};border:${f(0.009)} solid #0F2147`),
      layer(`inset:${f(0.045)};border:${f(0.0022)} solid #B8912F`),
      corners(0.062, 0.055, 0.004, '#B8912F', f),
    ].join(''),
  },

  // ── 2 ─────────────────────────────────────────────────────────────────────
  'gold-deco': {
    label: 'Gold Deco',
    description: 'Ivory ground, stepped gold frame. Warmer — suits awards and appreciation.',
    ground: '#FBF7EC',
    accent: '#A8842B',
    ink: '#2E2716',
    background: (f) => [
      layer(`inset:${f(0.028)};border:${f(0.0035)} solid #A8842B`),
      layer(`inset:${f(0.04)};border:${f(0.011)} solid #C9A94E`),
      layer(`inset:${f(0.058)};border:${f(0.0018)} solid #A8842B`),
      // Stepped corner blocks — the deco motif, built from the same primitive.
      corners(0.075, 0.038, 0.006, '#A8842B', f),
      corners(0.095, 0.02, 0.005, '#C9A94E', f),
    ].join(''),
  },

  // ── 3 ─────────────────────────────────────────────────────────────────────
  'minimal-line': {
    label: 'Minimal Line',
    description: 'White, two hairlines, generous space. Lets the typography carry it.',
    ground: '#FFFFFF',
    accent: '#8A8F9C',
    ink: '#14181F',
    background: (f) => [
      layer(`left:12%;right:12%;top:${f(0.07)};height:${f(0.0022)};background:#14181F`),
      layer(`left:12%;right:12%;bottom:${f(0.07)};height:${f(0.0022)};background:#14181F`),
      layer(`left:12%;right:12%;bottom:${f(0.083)};height:${f(0.0008)};background:#B9BDC6`),
    ].join(''),
  },

  // ── 4 ─────────────────────────────────────────────────────────────────────
  'academic-seal': {
    label: 'Academic Seal',
    description: 'Cream with an ornate double border and a watermark disc. Traditional and formal.',
    ground: '#FAF6EA',
    accent: '#8C6B2F',
    ink: '#25201A',
    background: (f) => [
      // Watermark disc, centred and very pale — reads as texture, not decoration.
      layer(`left:50%;top:50%;width:${f(0.62)};height:${f(0.62)};margin-left:-${f(0.31)};margin-top:-${f(0.31)};border-radius:50%;border:${f(0.05)} solid rgba(140,107,47,.055)`),
      layer(`left:50%;top:50%;width:${f(0.42)};height:${f(0.42)};margin-left:-${f(0.21)};margin-top:-${f(0.21)};border-radius:50%;border:${f(0.012)} solid rgba(140,107,47,.07)`),
      layer(`inset:${f(0.032)};border:${f(0.0026)} solid #8C6B2F`),
      layer(`inset:${f(0.042)};border:${f(0.008)} solid #8C6B2F`),
      layer(`inset:${f(0.056)};border:${f(0.0026)} solid #8C6B2F`),
    ].join(''),
  },

  // ── 5 ─────────────────────────────────────────────────────────────────────
  'modern-slate': {
    label: 'Modern Slate',
    description: 'A slate band down one edge, everything else clean. Contemporary, left-aligned.',
    ground: '#FFFFFF',
    accent: '#C8A04E',
    ink: '#111827',
    // The band runs down the left in landscape and across the top in portrait —
    // the same idea adapted, rather than a sideways copy.
    background: (f, landscape) => (landscape
      ? [
        layer('left:0;top:0;bottom:0;width:14%;background:linear-gradient(160deg,#16213B,#0B1220)'),
        layer(`left:14%;top:0;bottom:0;width:${f(0.008)};background:#C8A04E`),
      ].join('')
      : [
        layer('left:0;right:0;top:0;height:11%;background:linear-gradient(160deg,#16213B,#0B1220)'),
        layer(`left:0;right:0;top:11%;height:${f(0.008)};background:#C8A04E`),
      ].join('')),
  },

  // ── 6 ─────────────────────────────────────────────────────────────────────
  'emerald-classic': {
    label: 'Emerald Classic',
    description: 'Deep green border with a gold hairline. Distinct without being loud.',
    ground: '#FAFBF8',
    accent: '#B08D3C',
    ink: '#0E2A1E',
    background: (f) => [
      layer(`inset:${f(0.03)};border:${f(0.012)} solid #0E4630`),
      layer(`inset:${f(0.048)};border:${f(0.002)} solid #B08D3C`),
      corners(0.066, 0.045, 0.0035, '#B08D3C', f),
    ].join(''),
  },
};

// ── Layouts ────────────────────────────────────────────────────────────────
/*
 * One layout per (theme, orientation). Portrait is NOT landscape with swapped
 * numbers: a portrait sheet is narrow, so the name needs a wider column
 * fraction, the body wraps sooner, and the signature row has to stack rather
 * than sit three-across. Deriving one from the other looked fine in a thumbnail
 * and fell apart on a real A4 print.
 */

/**
 * A row of signature blocks.
 *
 * Portrait is the constrained case: the sheet is narrow, so three blocks across
 * leave each one about 20% of the width and a designation like "Programme
 * Director" wraps to two lines, pushing that block out of alignment with its
 * neighbours. Beyond two signatories a portrait sheet gets a second row instead
 * of thinner columns.
 */
const signatoryRow = (count, y, size = 0.022, landscape = true) => {
  const n = Math.max(1, Math.min(4, count));
  const perRow = landscape ? n : Math.min(n, 2);
  const rows = Math.ceil(n / perRow);
  const rowGap = landscape ? 0 : 0.085;
  // Centre the whole group on `y` however many rows it turns out to need.
  const firstY = y - ((rows - 1) * rowGap) / 2;

  return Array.from({ length: n }, (_, i) => {
    const row = Math.floor(i / perRow);
    const inRow = Math.min(perRow, n - row * perRow);
    const col = i % perRow;
    const span = landscape ? 0.72 : 0.66;
    const step = span / inRow;
    return {
      type: 'signatory',
      key: `signatory:${i}`,
      idx: i,
      x: (1 - span) / 2 + step * (col + 0.5),
      y: firstY + row * rowGap,
      w: Math.min(landscape ? 0.26 : 0.3, step * 0.88),
      size,
    };
  });
};

/*
 * The shared "formal centred" layout, tuned per orientation.
 *
 * Portrait is NOT landscape with different numbers. On a narrow sheet the
 * heading wraps, the body needs more lines and every block grows TALLER — and
 * because elements are centre-anchored, a taller block grows into its
 * neighbours in both directions. The first portrait pass had the heading
 * colliding with the lead-in, the name sitting on top of the body, and the ID
 * printed over the issue date. These values are the ones that survived actually
 * being rendered and looked at.
 */
function classicLayout(landscape) {
  const x = 0.5;
  const w = landscape ? 0.74 : 0.84;
  // The inner frame sits at ~5.6% inset in portrait, so a footer at 0.945 prints
  // ON the border. Kept clear of it deliberately.
  const foot = landscape ? 0.935 : 0.905;
  return [
    { type: 'logo', key: 'logo', x, y: landscape ? 0.115 : 0.085, w: landscape ? 0.085 : 0.06 },
    t('organisation_name', {
      x, y: landscape ? 0.175 : 0.135, w,
      size: landscape ? 0.019 : 0.014, font: 'sans', uppercase: true,
      letterSpacing: 0.22, color: '#6B7695',
    }),
    t('heading', {
      text: 'CERTIFICATE OF {{certificate_type}}',
      x, y: landscape ? 0.25 : 0.195, w: landscape ? 0.8 : 0.88,
      // Smaller in portrait so a long type name ("Course Completion") stays on
      // one line instead of wrapping into the lead-in below it.
      size: landscape ? 0.044 : 0.03, font: 'serif', weight: 600,
      uppercase: true, letterSpacing: landscape ? 0.1 : 0.06,
    }),
    t('lead', {
      text: 'This is to certify that',
      x, y: landscape ? 0.325 : 0.255, w: 0.6,
      size: landscape ? 0.024 : 0.017, font: 'serif', italic: true, color: '#4A5573',
    }),
    t('recipient_name', {
      x, y: landscape ? 0.42 : 0.335, w: landscape ? 0.8 : 0.88,
      size: landscape ? 0.082 : 0.052, font: 'display', weight: 600,
    }),
    { type: 'rule', key: 'rule', x, y: landscape ? 0.482 : 0.383, w: landscape ? 0.42 : 0.5 },
    t('body', {
      text: '{{body}}',
      x, y: landscape ? 0.6 : 0.5, w: landscape ? 0.72 : 0.8,
      size: landscape ? 0.024 : 0.0165, font: 'serif',
      lineHeight: landscape ? 1.75 : 1.8, color: '#45506D',
    }),
    ...signatoryRow(1, landscape ? 0.8 : 0.73, landscape ? 0.022 : 0.016, landscape),
    // The seal sits opposite the QR, balancing the foot of the sheet. It is what
    // makes a certificate read as issued rather than printed.
    { type: 'seal', key: 'seal', x: landscape ? 0.155 : 0.21, y: landscape ? 0.855 : 0.875, w: landscape ? 0.135 : 0.1 },
    // ID left, date right — on one line at the same x they overlapped in portrait.
    t('certificate_id', { x: landscape ? 0.26 : 0.3, y: foot, w: 0.34, size: landscape ? 0.017 : 0.013, font: 'mono', color: '#6B7695' }),
    t('issue_date', {
      text: 'Issued On {{issue_date}}',
      x: landscape ? 0.55 : 0.62, y: foot, w: 0.3,
      size: landscape ? 0.017 : 0.013, font: 'sans', color: '#6B7695',
    }),
    // Clear of the corner ornaments, which sit at ~6% inset.
    // Clear of the corner ornaments (deepest sits ~9.5% in). In portrait the QR is
    // sized off HEIGHT but positioned across a narrower WIDTH, so the same x would
    // put its right edge through the bracket — hence the different value.
    { type: 'qr', key: 'qr', x: landscape ? 0.845 : 0.79, y: landscape ? 0.855 : 0.875, w: landscape ? 0.085 : 0.06 },
  ];
}

const LAYOUTS = {
  'royal-navy': {
    landscape: classicLayout(true),
    portrait: classicLayout(false),
  },
  'gold-deco': {
    landscape: classicLayout(true),
    portrait: classicLayout(false),
  },
  'academic-seal': {
    landscape: classicLayout(true),
    portrait: classicLayout(false),
  },
  'emerald-classic': {
    landscape: classicLayout(true),
    portrait: classicLayout(false),
  },

  'minimal-line': {
    landscape: [
      t('organisation_name', { x: 0.5, y: 0.16, w: 0.6, size: 0.018, font: 'sans', uppercase: true, letterSpacing: 0.24, color: '#8A8F9C' }),
      t('recipient_name', { x: 0.5, y: 0.42, w: 0.82, size: 0.078, font: 'serif', weight: 500, color: '#14181F' }),
      t('body', { text: '{{body}}', x: 0.5, y: 0.6, w: 0.62, size: 0.023, font: 'serif', lineHeight: 1.85, color: '#4A5162' }),
      ...signatoryRow(1, 0.79),
      // BELOW the closing hairlines (0.917 / 0.93), not on them.
      t('certificate_id', { x: 0.5, y: 0.962, w: 0.4, size: 0.015, font: 'mono', color: '#9AA0AC' }),
      { type: 'qr', key: 'qr', x: 0.88, y: 0.845, w: 0.075 },
    ],
    portrait: [
      t('organisation_name', { x: 0.5, y: 0.14, w: 0.7, size: 0.016, font: 'sans', uppercase: true, letterSpacing: 0.24, color: '#8A8F9C' }),
      t('recipient_name', { x: 0.5, y: 0.36, w: 0.86, size: 0.056, font: 'serif', weight: 500, color: '#14181F' }),
      t('body', { text: '{{body}}', x: 0.5, y: 0.52, w: 0.76, size: 0.021, font: 'serif', lineHeight: 1.85, color: '#4A5162' }),
      ...signatoryRow(1, 0.74, 0.016, false),
      t('certificate_id', { x: 0.5, y: 0.962, w: 0.5, size: 0.012, font: 'mono', color: '#9AA0AC' }),
      { type: 'qr', key: 'qr', x: 0.8, y: 0.845, w: 0.058 },
    ],
  },

  'modern-slate': {
    landscape: [
      { type: 'logo', key: 'logo', x: 0.07, y: 0.16, w: 0.07 },
      t('organisation_name', { x: 0.07, y: 0.34, w: 0.11, size: 0.016, font: 'sans', weight: 700, uppercase: true, letterSpacing: 0.1, color: '#E7EAF2', lineHeight: 1.5 }),
      t('heading', { text: 'CERTIFICATE OF {{certificate_type}}', x: 0.56, y: 0.2, w: 0.7, size: 0.036, font: 'sans', weight: 700, uppercase: true, letterSpacing: 0.08, align: 'left', color: '#111827' }),
      t('lead', { text: 'Presented to', x: 0.56, y: 0.3, w: 0.7, size: 0.019, font: 'sans', uppercase: true, letterSpacing: 0.16, align: 'left', color: '#6B7280' }),
      t('recipient_name', { x: 0.56, y: 0.4, w: 0.7, size: 0.072, font: 'sans', weight: 700, align: 'left', color: '#111827' }),
      t('body', { text: '{{body}}', x: 0.56, y: 0.58, w: 0.7, size: 0.022, font: 'sans', lineHeight: 1.8, align: 'left', color: '#4B5563' }),
      ...signatoryRow(1, 0.82).map((s) => ({ ...s, x: 0.32, w: 0.22 })),
      t('certificate_id', { x: 0.6, y: 0.93, w: 0.3, size: 0.016, font: 'mono', align: 'left', color: '#9CA3AF' }),
      { type: 'qr', key: 'qr', x: 0.9, y: 0.86, w: 0.085 },
    ],
    portrait: [
      { type: 'logo', key: 'logo', x: 0.5, y: 0.055, w: 0.075 },
      t('organisation_name', { x: 0.5, y: 0.095, w: 0.8, size: 0.014, font: 'sans', weight: 700, uppercase: true, letterSpacing: 0.14, color: '#E7EAF2' }),
      t('heading', { text: 'CERTIFICATE OF {{certificate_type}}', x: 0.5, y: 0.2, w: 0.82, size: 0.028, font: 'sans', weight: 700, uppercase: true, letterSpacing: 0.07, color: '#111827' }),
      t('lead', { text: 'Presented to', x: 0.5, y: 0.27, w: 0.6, size: 0.016, font: 'sans', uppercase: true, letterSpacing: 0.16, color: '#6B7280' }),
      t('recipient_name', { x: 0.5, y: 0.35, w: 0.86, size: 0.052, font: 'sans', weight: 700, color: '#111827' }),
      t('body', { text: '{{body}}', x: 0.5, y: 0.5, w: 0.8, size: 0.02, font: 'sans', lineHeight: 1.8, color: '#4B5563' }),
      ...signatoryRow(1, 0.75, 0.016, false),
      t('certificate_id', { x: 0.35, y: 0.92, w: 0.4, size: 0.015, font: 'mono', color: '#9CA3AF' }),
      { type: 'qr', key: 'qr', x: 0.8, y: 0.865, w: 0.06 },
    ],
  },
};

const THEME_KEYS = Object.keys(THEMES);

/** Layout for a theme + orientation + signatory count, deep-copied so callers may mutate. */
function themeLayout(key, orientation = 'landscape', signatoryCount = 1) {
  const set = LAYOUTS[key] || LAYOUTS['royal-navy'];
  const base = set[orientation === 'portrait' ? 'portrait' : 'landscape'] || set.landscape;
  const elements = JSON.parse(JSON.stringify(base));

  // Re-space the signature row for the actual number of signatories. Certificates
  // routinely carry two or three (Principal + Director + Coordinator) and a row
  // laid out for one leaves them overlapping.
  const n = Math.max(1, Math.min(4, Number(signatoryCount) || 1));
  if (n !== 1) {
    const existing = elements.find((e) => e.type === 'signatory');
    const y = existing ? existing.y : 0.8;
    const size = existing ? existing.size : 0.022;
    const rest = elements.filter((e) => e.type !== 'signatory');
    const landscape = orientation !== 'portrait';
    return { preset: key, elements: [...rest, ...signatoryRow(n, y, size, landscape)] };
  }
  return { preset: key, elements };
}

module.exports = { THEMES, THEME_KEYS, LAYOUTS, CSS_H, themeLayout, themeFrame, signatoryRow };
