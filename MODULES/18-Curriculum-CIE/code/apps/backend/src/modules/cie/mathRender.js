'use strict';
/*
 * mathRender — turn the LaTeX in an authored lesson into static SVG, once, at
 * import time.
 *
 * ── WHY PRE-RENDER AND NOT SHIP MATHJAX ─────────────────────────────────────
 * The Academic Team's lessons carry a LOT of maths: 684 of 727 files, 52,101
 * expressions, an average of 76 per page. They render it in the browser with
 * MathJax 3 loaded from cdn.jsdelivr.net.
 *
 * That cannot work inside this product, for two independent reasons:
 *   1. Our CSP is `script-src 'self' 'unsafe-inline' https://checkout.razorpay.com`.
 *      jsdelivr is not on it and must not be — so the CDN script is blocked and
 *      every equation on every page would render as raw `\(\frac{a}{b}\)`.
 *   2. Even self-hosted, it means shipping ~1.1 MB of JavaScript and then
 *      typesetting 76 expressions on a low-end Android before a student can read.
 *
 * Measured, not assumed, on a real lesson (TN_MATH10C01T01, 123 expressions):
 *
 *     pre-rendered      30 KB gzipped over the wire, renders instantly, zero JS
 *     original+MathJax  17 KB + ~1100 KB of MathJax on first view, 1-3 s typeset
 *
 * 30 KB is smaller than one photo. And because the result contains NO script at
 * all, the reader can put it in an iframe with a fully locked `sandbox` — no
 * allow-scripts, no opaque-origin CSP puzzle, and it works offline.
 *
 * ── THE FONT CACHE IS THE WHOLE DIFFERENCE ──────────────────────────────────
 * The first version of this used SVG's default per-expression font cache and
 * produced 401 KB for that same file — worse than shipping MathJax. With
 * `fontCache: 'global'` the glyph outlines are emitted ONCE into a shared <defs>
 * and every expression references them: 138 KB of markup + 15 KB of cache.
 *
 * That is why the cache must be emitted into the document exactly once, and why
 * a fresh MathJax document is created per FILE rather than shared across files —
 * a cache shared across files would have to be emitted into all of them or none.
 *
 * ── PACKAGES ────────────────────────────────────────────────────────────────
 * The lessons' own MathJax config asks for ams, mathtools, physics, cancel,
 * mhchem, braket and color. KaTeX cannot do physics, braket or full mhchem,
 * which is why this is MathJax and not the lighter option. Verified: 123/123
 * expressions from a real file render with no error.
 *
 * mathjax-full@3 is deprecated upstream in favour of @mathjax/src (v4). v4 is a
 * rewrite with a different API; v3 is what these expressions are proven against,
 * so the upgrade is a separate, tested change and not a side effect of this one.
 */

const { mathjax } = require('mathjax-full/js/mathjax.js');
const { TeX } = require('mathjax-full/js/input/tex.js');
const { SVG } = require('mathjax-full/js/output/svg.js');
const { liteAdaptor } = require('mathjax-full/js/adaptors/liteAdaptor.js');
const { RegisterHTMLHandler } = require('mathjax-full/js/handlers/html.js');
require('mathjax-full/js/input/tex/AllPackages.js');

// The adaptor and handler are process-global in mathjax-full — registering twice
// throws. Do it once, lazily, so merely requiring this file costs nothing.
let adaptor = null;
function ensureAdaptor() {
  if (!adaptor) {
    adaptor = liteAdaptor();
    RegisterHTMLHandler(adaptor);
  }
  return adaptor;
}

const PACKAGES = [
  'base', 'ams', 'mathtools', 'physics', 'cancel', 'mhchem', 'braket', 'color',
  'newcommand', 'configmacros',
];

// The delimiters the lessons actually use, from their own MathJax config:
//   inlineMath  \( … \)
//   displayMath \[ … \]
// Deliberately NOT $…$ — the CMS work banned bare $ maths (cms/shared.js
// latexCheck) precisely because it collides with currency in ordinary prose.
const MATH_RE = /\\\((.+?)\\\)|\\\[([\s\S]+?)\\\]/g;

// ── THE RUPEE SIGN, WHICH BROKE 88 OF 50,746 EXPRESSIONS ────────────────────
// Every single failure in the first full run was one cause: a bare ₹ inside math
// mode. TeX has no math character for it, and MathJax throws rather than
// reporting an merror, so it does not even look like a typesetting failure.
//
// `\text{₹}` converts cleanly. MathJax has no ₹ glyph in its SVG font either, so
// it emits a <text> node the browser draws with a system font — which is exactly
// right for a currency symbol sitting in an equation, and leaves no undefined
// glyph reference behind (verified).
//
// Money arithmetic is all over Class 6-8 maths, so this is not an edge case.
const CURRENCY_IN_MATH = /(?<!\\text\{)₹/g;

// When MathJax still refuses, the expression must not be shown as raw LaTeX — a
// student reading `= 450 \times 10` learns nothing and loses trust in the page.
// These substitutions turn the operators that actually appear into the characters
// a person reads, so the worst case is plain, correct arithmetic rather than markup.
const TEX_TO_TEXT = [
  [/\\times\b/g, '×'], [/\\div\b/g, '÷'], [/\\pm\b/g, '±'], [/\\mp\b/g, '∓'],
  [/\\leq?\b/g, '≤'], [/\\geq?\b/g, '≥'], [/\\neq?\b/g, '≠'], [/\\approx\b/g, '≈'],
  [/\\cdot\b/g, '·'], [/\\ldots\b/g, '…'], [/\\dots\b/g, '…'],
  [/\\text\{([^}]*)\}/g, '$1'], [/\\mathrm\{([^}]*)\}/g, '$1'],
  [/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)'],
  [/\\sqrt\{([^{}]*)\}/g, '√($1)'],
  [/\\left|\\right/g, ''],
  [/\\,|\\;|\\!|\\quad|\\qquad/g, ' '],
];

/** Last resort: make an untypesettable expression readable rather than raw. */
function texToReadableText(tex) {
  let t = tex;
  for (const [re, to] of TEX_TO_TEXT) t = t.replace(re, to);
  // Anything still backslash-prefixed is a command we have no reading for; drop
  // the backslash rather than print it, and collapse the whitespace it leaves.
  t = t.replace(/\\([a-zA-Z]+)/g, '$1').replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
  return t;
}

/**
 * Replace every LaTeX expression in one document with static SVG.
 *
 * @param {string} html  a whole authored document
 * @returns {{ html: string, rendered: number, failed: Array<{tex:string,error:string}> }}
 *   `html` has the shared glyph cache injected once, immediately before </body>.
 *   A failed expression degrades to READABLE TEXT (× ÷ ≤ √ and so on) — never
 *   dropped, never an error box, and never raw LaTeX. A silently removed equation
 *   is a lesson that teaches the wrong thing, and a visible `\times` is a lesson
 *   a student stops believing.
 */
// The fallback text goes into a document, so it must not be able to introduce
// markup of its own.
const escapeText = (t) => String(t)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function renderMathInHtml(html) {
  const ad = ensureAdaptor();
  // A fresh document per file, because the font cache is per document.
  const svg = new SVG({ fontCache: 'global' });
  const doc = mathjax.document('', { InputJax: new TeX({ packages: PACKAGES }), OutputJax: svg });

  let rendered = 0;
  const failed = [];

  let out = html.replace(MATH_RE, (whole, inline, display) => {
    const rawTex = (inline ?? display).trim();
    if (!rawTex) return whole;
    const tex = rawTex.replace(CURRENCY_IN_MATH, '\\text{₹}');
    try {
      const node = doc.convert(tex, { display: inline === undefined });
      const markup = ad.outerHTML(node);
      // MathJax reports a bad expression as an merror node rather than throwing,
      // so a "success" that contains one is a failure we would otherwise ship.
      if (!markup.includes('<svg') || markup.includes('merror') || markup.includes('data-mjx-error')) {
        failed.push({ tex: rawTex.slice(0, 120), error: 'MathJax could not typeset it' });
        return escapeText(texToReadableText(rawTex));
      }
      rendered++;
      return markup;
    } catch (e) {
      failed.push({ tex: rawTex.slice(0, 120), error: e.message });
      return escapeText(texToReadableText(rawTex));
    }
  });

  if (rendered > 0) {
    // ── THE CACHE MUST BE INSIDE AN <svg> ROOT ────────────────────────────
    // `getCache()` returns a bare <defs>. Inserted into an HTML document as-is,
    // the parser treats <defs> and its <path> children as UNKNOWN HTML elements,
    // not SVG — so every `<use xlink:href="#MJX-…">` in the page resolves to
    // nothing and every equation renders as blank space.
    //
    // That shipped. It looked correct to a string check: the ids were present and
    // every reference matched one. What the check never asked was whether the
    // browser would treat them as SVG at all. Only an <svg> start tag puts the
    // parser into SVG foreign-content mode, and that is the whole fix.
    //
    // display:none is safe and is what MathJax's own browser output does — <defs>
    // never renders anyway, and `<use>` can still reference into a hidden root.
    const defs = ad.outerHTML(svg.fontCache.getCache());
    const cache = `<svg id="MJX-SVG-global-cache" xmlns="http://www.w3.org/2000/svg" `
      + `style="display:none" aria-hidden="true" focusable="false">${defs}</svg>`;
    // Before </body>: inside <head> a stray <svg> is dropped by the parser, and
    // last means it never shifts the layout of anything above it.
    out = out.includes('</body>')
      ? out.replace('</body>', `${cache}\n</body>`)
      : `${out}\n${cache}`;
  }

  return { html: out, rendered, failed };
}

module.exports = { renderMathInHtml, PACKAGES };
