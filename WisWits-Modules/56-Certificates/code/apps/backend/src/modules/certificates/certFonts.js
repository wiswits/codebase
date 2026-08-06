'use strict';
/*
 * CERTIFICATE TYPEFACES — the one list, shared by the renderer and the editor.
 *
 * WHY THE FILES ARE IN THE REPO. The renderer is a headless Chrome on a Linux
 * server; the editor is Chrome/Safari on somebody's Mac. Naming a font that only
 * one of them has installed does not fail — it SILENTLY substitutes, and the
 * certificate that prints looks nothing like the one that was laid out. That is
 * the worst failure this module has, because it is only discovered on paper.
 * Shipping the actual woff2 files removes the question: both sides draw from the
 * same bytes, so the preview is a promise rather than a hope.
 *
 * The five original keys (serif/sans/mono/display/humanist) are KEPT FOREVER.
 * Certificates issued before this file existed store those names and must
 * re-render identically years later (§15, and a certificate is immutable).
 *
 * ⚠️ SINGLE QUOTES INSIDE EVERY STACK. These strings are emitted inside
 * style="…" attributes — a double quote closes the attribute and every
 * declaration after font-family is discarded as stray markup. The whole
 * certificate then renders as 16px left-aligned black text. Do not "tidy" them.
 *
 * Files come from Google Fonts (SIL Open Font License) via
 * scripts/fetch-cert-fonts.sh, which also writes fonts/manifest.tsv. Re-run it to
 * add a family; never hand-edit the manifest.
 */
const fs = require('fs');
const path = require('path');

const FONT_DIR = path.join(__dirname, 'fonts');

/*
 * Fallbacks after each family are the SAME on both sides, and end in a face that
 * exists on a bare Linux Chrome — so even a missing woff2 degrades to something
 * readable in the same shape rather than to a random default.
 */
const SERIF_TAIL = "'Liberation Serif', 'Times New Roman', serif";
const SANS_TAIL = "'Liberation Sans', Arial, sans-serif";

/** The Devanagari face appended to every stack, so a Hindi name inside an English
 *  certificate prints as Hindi instead of a row of empty boxes. */
const DEV_SERIF = "'Noto Serif Devanagari'";
const DEV_SANS = "'Noto Sans Devanagari'";

const FAMILIES = [
  // ── Legacy generic keys (pre-2026-08 certificates reference these) ────────
  { key: 'serif', label: 'Serif (system)', category: 'system', family: null, stack: `${DEV_SERIF}, ${SERIF_TAIL}` },
  { key: 'sans', label: 'Sans (system)', category: 'system', family: null, stack: `${DEV_SANS}, ${SANS_TAIL}` },
  { key: 'mono', label: 'Monospace', category: 'system', family: null, stack: "'Liberation Mono', 'Courier New', monospace" },
  { key: 'display', label: 'Display serif (system)', category: 'system', family: null, stack: `Georgia, ${DEV_SERIF}, ${SERIF_TAIL}` },
  { key: 'humanist', label: 'Humanist sans (system)', category: 'system', family: null, stack: `'DejaVu Sans', ${DEV_SANS}, ${SANS_TAIL}` },

  // ── Classic certificate faces ────────────────────────────────────────────
  { key: 'playfair', label: 'Playfair Display', category: 'classic', family: 'Playfair Display', slug: 'playfair' },
  { key: 'cinzel', label: 'Cinzel — engraved caps', category: 'classic', family: 'Cinzel', slug: 'cinzel' },
  { key: 'cormorant', label: 'Cormorant Garamond', category: 'classic', family: 'Cormorant Garamond', slug: 'cormorant' },
  { key: 'garamond', label: 'EB Garamond', category: 'classic', family: 'EB Garamond', slug: 'garamond' },
  { key: 'lora', label: 'Lora', category: 'classic', family: 'Lora', slug: 'lora' },
  { key: 'marcellus', label: 'Marcellus', category: 'classic', family: 'Marcellus', slug: 'marcellus' },

  // ── Calligraphy — for the recipient's name ───────────────────────────────
  { key: 'greatvibes', label: 'Great Vibes — calligraphy', category: 'script', family: 'Great Vibes', slug: 'greatvibes' },
  { key: 'tangerine', label: 'Tangerine — calligraphy', category: 'script', family: 'Tangerine', slug: 'tangerine' },
  { key: 'pinyon', label: 'Pinyon Script', category: 'script', family: 'Pinyon Script', slug: 'pinyon' },

  // ── Modern sans ──────────────────────────────────────────────────────────
  { key: 'montserrat', label: 'Montserrat', category: 'modern', family: 'Montserrat', slug: 'montserrat', sans: true },
  { key: 'poppins', label: 'Poppins', category: 'modern', family: 'Poppins', slug: 'poppins', sans: true },
  { key: 'sourcesans', label: 'Source Sans 3', category: 'modern', family: 'Source Sans 3', slug: 'sourcesans', sans: true },

  // ── Hindi / Devanagari ───────────────────────────────────────────────────
  { key: 'notoserifdev', label: 'Noto Serif Devanagari — हिन्दी', category: 'devanagari', family: 'Noto Serif Devanagari', slug: 'notoserifdev' },
  { key: 'notosansdev', label: 'Noto Sans Devanagari — हिन्दी', category: 'devanagari', family: 'Noto Sans Devanagari', slug: 'notosansdev', sans: true },
];

const CATEGORY_LABELS = {
  classic: 'Classic',
  script: 'Calligraphy',
  modern: 'Modern',
  devanagari: 'Hindi / Devanagari',
  system: 'Basic',
};

/*
 * Faces, read once from the manifest the download script wrote.
 * Line: <file>\t<weight>\t<subset>\t<unicode-range>
 * A missing or unreadable manifest is not fatal — every stack still has a
 * system tail, so the module degrades to how it behaved before the fonts existed.
 */
function readManifest() {
  const out = new Map();                       // slug → [{file, weight, range}]
  let raw = '';
  try { raw = fs.readFileSync(path.join(FONT_DIR, 'manifest.tsv'), 'utf8'); } catch { return out; }
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    const [file, weight, , range] = line.split('\t');
    if (!file || !/\.woff2$/.test(file)) continue;
    const slug = file.split('-')[0];
    if (!out.has(slug)) out.set(slug, []);
    out.get(slug).push({ file, weight: Number(weight) || 400, range: (range || '').trim() });
  }
  return out;
}
const FACES = readManifest();

/** Build every stack once: 'Family', <devanagari fallback>, <system tail>. */
for (const f of FAMILIES) {
  if (f.stack) continue;
  const tail = f.sans ? SANS_TAIL : SERIF_TAIL;
  const dev = f.sans ? DEV_SANS : DEV_SERIF;
  // A Devanagari family must not list itself as its own fallback.
  const devPart = f.category === 'devanagari' ? '' : `${dev}, `;
  f.stack = `'${f.family}', ${devPart}${tail}`;
}

const FONTS = Object.fromEntries(FAMILIES.map((f) => [f.key, f.stack]));
const FONT_KEYS = FAMILIES.map((f) => f.key);
const BY_KEY = new Map(FAMILIES.map((f) => [f.key, f]));

/** What the editor needs to draw the picker — labels, groups, and the exact
 *  stack, so it never re-derives a stack the renderer would not agree with. */
const FONT_CATALOGUE = FAMILIES.map((f) => ({
  key: f.key,
  label: f.label,
  category: f.category,
  category_label: CATEGORY_LABELS[f.category] || f.category,
  stack: f.stack,
}));

const DEVANAGARI = /[ऀ-ॿ]/;

/**
 * @font-face rules for the given font keys.
 *
 * @param keys      font keys used by the layout. Unknown keys are ignored.
 * @param opts.inline  true  → base64 data: URIs (the RENDER: page.setContent()
 *                            gives Chrome an about:blank document with no base
 *                            URL, so a url() would resolve to nothing and the
 *                            face would silently fall back)
 *                     false → url() against opts.base (the EDITOR: the browser
 *                            then downloads only the subsets it actually needs)
 * @param opts.text    when given, Devanagari faces are added only if the text
 *                     really contains Devanagari — a certificate in English
 *                     should not carry a quarter-megabyte of Hindi glyphs.
 */
function fontFaceCss(keys, opts = {}) {
  const { inline = false, base = '', text = null } = opts;
  const wanted = new Set();
  if (keys == null) {
    // null = "every face we ship" — the editor's stylesheet, where the browser
    // downloads lazily anyway and the admin may pick any font at any moment.
    for (const f of FAMILIES) if (f.slug) wanted.add(f.slug);
  } else {
    for (const k of keys) {
      const f = BY_KEY.get(k);
      if (f && f.slug) wanted.add(f.slug);
    }
  }
  // Devanagari is in every stack as a fallback, so its faces must be present
  // whenever Devanagari is actually being printed — not only when chosen.
  if (text == null || DEVANAGARI.test(String(text))) {
    wanted.add('notoserifdev');
    wanted.add('notosansdev');
  }

  const out = [];
  for (const f of FAMILIES) {
    if (!f.slug || !wanted.has(f.slug)) continue;
    for (const face of FACES.get(f.slug) || []) {
      // In the render, skip the Latin subsets of a family that is only present
      // as the Devanagari fallback — the chosen family already covers Latin.
      const src = inline ? inlineFace(face.file) : `url('${base}/${face.file}') format('woff2')`;
      if (!src) continue;
      out.push(
        '@font-face{'
        + `font-family:'${f.family}';`
        + 'font-style:normal;'
        + `font-weight:${face.weight};`
        + 'font-display:block;'          // block, never swap: a screenshot taken
        + `src:${src};`                  // mid-swap would print the fallback face
        + (face.range ? `unicode-range:${face.range};` : '')
        + '}'
      );
    }
  }
  return out.join('\n');
}

const inlineCache = new Map();
function inlineFace(file) {
  if (inlineCache.has(file)) return inlineCache.get(file);
  const abs = path.join(FONT_DIR, path.basename(file));      // basename: never escape the dir
  let src = null;
  try {
    src = `url(data:font/woff2;base64,${fs.readFileSync(abs).toString('base64')}) format('woff2')`;
  } catch { src = null; }
  inlineCache.set(file, src);
  return src;
}

/** Every font key a layout actually uses — so a render inlines only those. */
function fontKeysUsed(elements) {
  const keys = new Set(['sans']);              // signatory blocks are always sans
  for (const el of Array.isArray(elements) ? elements : []) {
    if (el && el.type === 'text' && el.font) keys.add(el.font);
  }
  return [...keys];
}

module.exports = {
  FONTS, FONT_KEYS, FONT_CATALOGUE, FAMILIES, FONT_DIR,
  fontFaceCss, fontKeysUsed, CATEGORY_LABELS,
};
