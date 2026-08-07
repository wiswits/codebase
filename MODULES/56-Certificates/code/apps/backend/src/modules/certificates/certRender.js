'use strict';
/*
 * Certificate renderer — layout JSON → HTML → PNG / PDF.
 *
 * THE ONE RULE THIS FILE EXISTS TO ENFORCE: the finished certificate is produced
 * HERE, on the server, from coordinates. The browser sends positions, never pixels.
 * If the client could upload a rendered image, anyone with an admin session could
 * POST any picture and have it stored, QR-stamped and publicly verified as an
 * official certificate. Coordinates in, artwork out — no exceptions.
 *
 * COORDINATES ARE FRACTIONS (0..1) of the artwork's width/height, never pixels.
 * That is what makes the editor preview honest: the same layout renders identically
 * against a 1200px preview and a 3508px print master, so "what you positioned" and
 * "what printed" cannot drift. Font sizes are fractions of HEIGHT for the same reason.
 *
 * Mirrored by apps/web/src/components/certificates/certLayout.ts — the editor builds
 * the same CSS from the same JSON. Change the element→CSS mapping in one, change it
 * in the other, or the preview starts lying.
 */
const fs = require('fs');
const path = require('path');
const { getBrowser } = require('../../services/pdf/htmlToPdf');
const { THEMES, CSS_H } = require('./certThemes');

const UPLOAD_ROOT = path.join(__dirname, '../../../uploads');

/*
 * Typefaces now come from certFonts.js, which ships the actual woff2 files and
 * inlines them into this document — so a chosen face cannot silently fall back
 * to something else on the render server. The five original generic keys are
 * still there and still mean the same thing; see the header of that file.
 */
const { FONTS, FONT_KEYS, fontFaceCss, fontKeysUsed } = require('./certFonts');

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const num = (v, dflt, min, max) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return dflt;
  return Math.min(max, Math.max(min, n));
};

const HEX = /^#[0-9a-fA-F]{3,8}$/;
const colour = (v, dflt = '#16233F') => (HEX.test(String(v || '')) ? String(v) : dflt);

// ── Placeholders ────────────────────────────────────────────────────────────
// Substitution happens on the SERVER, from the stored row — so the printed
// wording and the database record cannot disagree. Values are HTML-escaped:
// a recipient named `<script>` is a name, not markup.
const fmtDate = (d) => {
  if (!d) return '';
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
};

function buildVars(cert) {
  return {
    recipient_name: cert.recipient_name || '',
    intern_name: cert.recipient_name || '',      // accepted alias — the original spec used this
    department: cert.department || '',
    title: cert.title || '',
    internship_title: cert.title || '',          // alias
    certificate_id: cert.certificate_id || '',
    certificate_type: cert.type_name || '',
    organisation_name: cert.organisation_name || '',
    company_name: cert.organisation_name || '',  // alias
    start_date: fmtDate(cert.start_date),
    end_date: fmtDate(cert.end_date),
    issue_date: fmtDate(cert.issue_date),
    valid_until: cert.expires_on ? fmtDate(cert.expires_on) : 'No expiry',
    duration: cert.duration_text || '',
    performance: cert.performance || '',
    signatory_name: cert.signatory_name || '',
    signatory_role: cert.signatory_role || '',
    verification_url: cert.verification_url || '',
  };
}

/** Replace {{token}} with the certificate's value. Unknown tokens are left visible. */
function substitute(text, vars) {
  return String(text || '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (whole, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : whole);
}

// A slot that resolved to nothing. Never reaches the page — it only marks the
// sentence for removal below.
const EMPTY_SLOT = '\u0000';

/**
 * Substitute the certificate WORDING, dropping any sentence whose placeholder
 * had no value.
 *
 * The default copy mentions optional fields: "Their conduct and contribution
 * throughout were assessed as {{performance}}." Leave Performance blank — which
 * is entirely reasonable for a workshop or an appreciation — and the plain
 * substitution printed "...were assessed as ." on a permanent document nobody
 * can correct afterwards.
 *
 * So an empty value marks its sentence, and marked sentences are removed whole.
 * The certificate simply says less, which is the right failure: a shorter true
 * sentence beats a longer broken one.
 *
 * THE RESULT IS ALWAYS ONE PARAGRAPH. Text elements render with
 * `white-space: pre-wrap` (elementStyle below), so any newline that survives is a
 * HARD line break on the printed sheet. The old cleanup collapsed `\s{2,}` — which
 * a single "\n" does not match — so one stray Enter in the wording box split the
 * certificate into stacked fragments instead of a flowing paragraph. Reported by
 * AK as "content shows as fragmented lines". Collapsing every whitespace RUN makes
 * a single paragraph the only possible output, whatever was typed or pasted.
 */
function substituteBody(text, vars) {
  const marked = String(text || '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (whole, key) => {
    if (!Object.prototype.hasOwnProperty.call(vars, key)) return whole;
    const v = vars[key];
    return v === '' || v == null ? EMPTY_SLOT : v;
  });
  return marked
    // Keep the terminator with its sentence so the split is lossless.
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !sentence.includes(EMPTY_SLOT))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Element → CSS ───────────────────────────────────────────────────────────
/**
 * One element's inline style.
 *
 * `H` is the sheet's height and `unit` the unit it is expressed in — the ONE
 * place a fraction becomes a concrete length. Two callers, two units:
 *   PNG → H = artwork height in px  (3508×2480 = true 300 DPI)
 *   PDF → H = 210 (or 297) in mm    (a real A4 page)
 * Because the layout is entirely fractional, the same numbers produce the same
 * design at both scales. Rendering the PDF in px was what made it spill onto
 * three pages: 3508 CSS px is 36 inches wide, so an A4 @page could not hold it.
 */
function elementStyle(el, H, unit = 'px') {
  const x = num(el.x, 0.5, -0.5, 1.5);
  const y = num(el.y, 0.5, -0.5, 1.5);
  const w = num(el.w, 0.6, 0.02, 1.5);
  const rotate = num(el.rotate, 0, -180, 180);
  const parts = [
    'position:absolute',
    `left:${(x * 100).toFixed(4)}%`,
    `top:${(y * 100).toFixed(4)}%`,
    `width:${(w * 100).toFixed(4)}%`,
    // translate(-50%,-50%) makes x,y the element's CENTRE. Centring is what a
    // certificate layout is mostly made of, and a centre anchor stays put when
    // the text length changes — a top-left anchor visibly drifts.
    `transform:translate(-50%,-50%) rotate(${rotate}deg)`,
  ];
  if (el.type === 'text') {
    const size = num(el.size, 0.05, 0.004, 0.5) * H;
    parts.push(
      `font-family:${FONTS[el.font] || FONTS.serif}`,
      `font-size:${size.toFixed(3)}${unit}`,
      `font-weight:${num(el.weight, 400, 100, 900)}`,
      `color:${colour(el.color)}`,
      // `justify` = both edges flush, for the wording paragraph. text-align-last
      // keeps its short last line centred — see the same pair in certLayout.ts,
      // which is what the editor draws. They must stay identical.
      `text-align:${['left', 'center', 'right', 'justify'].includes(el.align) ? el.align : 'center'}`,
      ...(el.align === 'justify' ? ['text-align-last:center'] : []),
      `line-height:${num(el.lineHeight, 1.3, 0.6, 3)}`,
      `letter-spacing:${(num(el.letterSpacing, 0, -0.1, 1) * size).toFixed(4)}${unit}`,
      'white-space:pre-wrap',
      'word-break:break-word',
    );
    if (el.italic) parts.push('font-style:italic');
    if (el.underline) parts.push('text-decoration:underline');
    if (el.uppercase) parts.push('text-transform:uppercase');
  }
  return parts.join(';');
}

// Extension → MIME for inlining. A data URI labelled image/png that actually
// holds a WebP will not decode, so this list must track the accepted uploads.
const MIME_BY_EXT = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
};

function dataUri(absPath) {
  const mime = MIME_BY_EXT[path.extname(absPath).toLowerCase()] || 'image/png';
  return `data:${mime};base64,${fs.readFileSync(absPath).toString('base64')}`;
}

/**
 * Resolve a stored `/uploads/...` path to a data URI.
 *
 * Inlined rather than referenced: page.setContent() gives Chrome an about:blank
 * document, from which file:// subresources are blocked and an http:// fetch
 * would depend on the API being reachable from inside its own container. A data
 * URI always loads, so a render can't half-succeed with a missing background.
 *
 * Path traversal is refused explicitly — these values come from the database, but
 * a template path is user-influenced at upload time and this function reads disk.
 */
function inlineUpload(storedPath) {
  if (!storedPath) return null;
  const rel = String(storedPath).replace(/^\/?uploads\//, '');
  const abs = path.resolve(UPLOAD_ROOT, rel);
  if (!abs.startsWith(path.resolve(UPLOAD_ROOT) + path.sep)) return null;
  if (!fs.existsSync(abs)) return null;
  try { return dataUri(abs); } catch { return null; }
}


/** A horizontal rule element — a divider under the recipient's name. */
function layerRule(el, w, f) {
  const x = num(el.x, 0.5, 0, 1) * 100;
  const y = num(el.y, 0.5, 0, 1) * 100;
  const h = f(num(el.thickness, 0.0016, 0.0004, 0.02));
  const colour = /^#[0-9a-fA-F]{3,8}$/.test(String(el.color || '')) ? el.color : '#B8912F';
  return `<div style="position:absolute;left:${x.toFixed(4)}%;top:${y.toFixed(4)}%;width:${(w * 100).toFixed(4)}%;`
    + `height:${h};background:${colour};transform:translate(-50%,-50%)"></div>`;
}

/**
 * Build the complete standalone HTML document for one certificate.
 * @param {object} cert   the client_cert_issued row (or a draft shaped like one)
 * @param {object} layout {elements:[…]}
 * @param {object} assets {qrDataUri, signatureDataUri}
 */
function buildHtml(cert, layout, assets = {}, mode = 'png') {
  const W = num(cert.width_px, 3508, 200, 12000);
  const H = num(cert.height_px, 2480, 200, 12000);
  const landscape = W >= H;

  /*
   * The sheet is sized in PIXELS for the screenshot and in MILLIMETRES for the
   * PDF. Same layout, same proportions — only the unit differs, which is exactly
   * what fractional coordinates buy us. Using px for the PDF gave a 36-inch-wide
   * sheet that A4 could not contain, and Chrome silently paginated it across
   * three pages. Caught on staging 2026-07-23.
   */
  const pdf = mode === 'pdf';
  const sheetW = pdf ? (landscape ? 297 : 210) : W;
  const sheetH = pdf ? (landscape ? 210 : 297) : H;
  const unit = pdf ? 'mm' : 'px';

  const vars = buildVars(cert);
  const bg = inlineUpload(cert.template_path);
  const elements = Array.isArray(layout?.elements) ? layout.elements : [];

  /*
   * f() turns a fraction-of-sheet-height into a length — as a calc() against a
   * CSS variable rather than a resolved number.
   *
   * That indirection is the whole trick: the SAME markup then works in three
   * places that set --sh differently — the PNG render (--sh: 2480px), the PDF
   * render (--sh: 210mm) and the browser editor (--sh: <measured px>). The theme
   * frames are shipped to the frontend verbatim in the bootstrap payload, so the
   * editor draws the identical border the printer will, with no second
   * implementation to drift out of step.
   */
  const f = CSS_H;
  const signatories = Array.isArray(assets.signatories) ? assets.signatories : [];

  // Resolved before the element loop: a seal takes its metal from the theme.
  const theme = !bg && cert.theme_key ? THEMES[cert.theme_key] : null;
  const accent = theme ? theme.accent : '#B8912F';
  const ground = theme ? theme.ground : '#ffffff';

  const body = elements.map((el) => {
    const style = elementStyle(el, sheetH, unit);

    if (el.type === 'qr') {
      if (!assets.qrDataUri) return '';
      /*
       * The QR is anchored by its CENTRE and forced square via aspect-ratio.
       * A QR sized by width alone drifts out of square the moment the sheet
       * aspect changes (landscape vs portrait), and a non-square QR is not a
       * cosmetic problem — scanners fail on it. The white padding is the
       * quiet zone the spec requires; without it a code printed onto a dark
       * frame simply does not read.
       */
      const size = num(el.w, 0.1, 0.02, 0.5);
      const wPct = ((size * sheetH) / sheetW) * 100;   // square, in sheet units
      const hPct = size * 100;
      return `<div style="position:absolute;left:${(num(el.x, 0.85, 0, 1) * 100).toFixed(4)}%;top:${(num(el.y, 0.85, 0, 1) * 100).toFixed(4)}%;`
        + `width:${wPct.toFixed(4)}%;height:${hPct.toFixed(4)}%;transform:translate(-50%,-50%);`
        + `background:#fff;padding:${f(size * 0.06)};box-sizing:border-box">`
        + `<img src="${assets.qrDataUri}" alt="" style="display:block;width:100%;height:100%;image-rendering:pixelated"></div>`;
    }

    if (el.type === 'seal') {
      /*
       * An embossed seal — concentric rings, a scalloped rim and the issuing
       * organisation's initials. Drawn, not an image: it takes its metal from
       * the theme, scales to any DPI, and an organisation gets one without
       * having to commission artwork.
       *
       * repeating-conic-gradient makes the rim notches; a real seal is scalloped
       * and a plain circle reads as a sticker.
       */
      const size = num(el.w, 0.16, 0.04, 0.6);
      const wPct = ((size * sheetH) / sheetW) * 100;
      const initials = String(cert.organisation_name || '')
        .split(/\s+/).filter(Boolean).slice(0, 3).map((x) => x[0]).join('').toUpperCase() || 'W';
      const notch = `repeating-conic-gradient(${accent} 0deg 6deg, transparent 6deg 12deg)`;
      return `<div style="position:absolute;left:${(num(el.x, 0.2, 0, 1) * 100).toFixed(4)}%;top:${(num(el.y, 0.8, 0, 1) * 100).toFixed(4)}%;`
        + `width:${wPct.toFixed(4)}%;height:${(size * 100).toFixed(4)}%;transform:translate(-50%,-50%) rotate(${num(el.rotate, 0, -180, 180)}deg)">`
        + `<div style="position:absolute;inset:0;border-radius:50%;background:${notch};opacity:.85"></div>`
        + `<div style="position:absolute;inset:8%;border-radius:50%;background:${ground};border:${f(size * 0.045)} solid ${accent}"></div>`
        + `<div style="position:absolute;inset:16%;border-radius:50%;border:${f(size * 0.012)} solid ${accent};opacity:.75"></div>`
        + `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;`
        + `font-family:${FONTS.display};font-weight:700;color:${accent};`
        + `font-size:${(size * sheetH * 0.3).toFixed(3)}${unit};letter-spacing:${(size * sheetH * 0.01).toFixed(3)}${unit}">${esc(initials)}</div>`
        + '</div>';
    }

    if (el.type === 'logo') {
      if (!assets.logoDataUri) return '';
      const size = num(el.w, 0.09, 0.02, 0.4);
      const wPct = ((size * sheetH) / sheetW) * 100;
      return `<div style="position:absolute;left:${(num(el.x, 0.5, 0, 1) * 100).toFixed(4)}%;top:${(num(el.y, 0.12, 0, 1) * 100).toFixed(4)}%;`
        + `width:${wPct.toFixed(4)}%;height:${(size * 100).toFixed(4)}%;transform:translate(-50%,-50%)">`
        + `<img src="${assets.logoDataUri}" alt="" style="display:block;width:100%;height:100%;object-fit:contain"></div>`;
    }

    if (el.type === 'rule') {
      const w = num(el.w, 0.4, 0.05, 1);
      return layerRule(el, w, f);
    }

    if (el.type === 'signatory') {
      /*
       * A signature is a BLOCK, not three loose text elements: image, rule,
       * name, designation, stacked and centred. Certificates routinely carry
       * two or three signatories, and keeping each as one movable unit is the
       * difference between dragging a signature and reassembling one.
       */
      const s = signatories[num(el.idx, 0, 0, 3)];
      if (!s || (!s.name && !s.dataUri)) return '';
      const size = num(el.size, 0.022, 0.008, 0.06) * sheetH;
      // A scanned signature reads as a signature only when it spans most of the
      // rule beneath it. Sized off the block's own width so it stays right on a
      // two-signatory row and a four-signatory one; the height cap stops a very
      // wide scan from towering over the name.
      const sigH = num(el.size, 0.022, 0.008, 0.06) * 3.2;
      const img = s.dataUri
        ? `<img src="${s.dataUri}" alt="" style="display:block;max-height:${f(sigH)};max-width:86%;width:auto;margin:0 auto ${f(0.005)};object-fit:contain">`
        : `<div style="height:${f(sigH)}"></div>`;
      return `<div style="${style};text-align:center">`
        + img
        + `<div style="height:${f(0.0016)};background:#16233F;margin-bottom:${f(0.008)}"></div>`
        + `<div style="font-family:${FONTS.sans};font-size:${size.toFixed(3)}${unit};font-weight:700;color:#16233F;line-height:1.3">${esc(s.name || '')}</div>`
        + (s.designation
          ? `<div style="font-family:${FONTS.sans};font-size:${(size * 0.82).toFixed(3)}${unit};color:#6B7695;line-height:1.35">${esc(s.designation)}</div>`
          : '')
        + '</div>';
    }

    if (el.type === 'image') {
      const src = el.key === 'signature' ? assets.signatureDataUri : inlineUpload(el.src);
      if (!src) return '';
      return `<img src="${src}" alt="" style="${style}">`;
    }

    // Text: the authored string may itself contain placeholders.
    const text = substitute(el.text != null ? el.text : `{{${el.key}}}`, vars);
    if (!text) return '';
    return `<div style="${style}">${esc(text)}</div>`;
  }).join('\n');

  // Theme frame, drawn only when there is no uploaded artwork to sit under.
  const themeBg = theme ? theme.background(f, landscape) : '';

  // @page with a zero margin + a sheet of exactly that size is what makes the
  // PDF land on ONE true-A4 page with no scaling. printBackground plus
  // preferCSSPageSize in the caller completes the contract.
  /*
   * The typefaces travel INSIDE the document as base64. page.setContent() hands
   * Chrome an about:blank page with no base URL and no network guarantee, so a
   * url() would resolve to nothing — and a missing @font-face does not error, it
   * quietly draws the fallback. Only the faces this layout uses are inlined, plus
   * Devanagari when the certificate actually contains Devanagari.
   */
  const faces = fontFaceCss(fontKeysUsed(elements), {
    inline: true,
    text: `${body} ${cert.recipient_name || ''} ${cert.body_text || ''}`,
  });

  return `<!doctype html><html><head><meta charset="utf-8">
<style>
  ${faces}
  @page { size: ${sheetW}${unit} ${sheetH}${unit}; margin: 0; }
  html, body { margin: 0; padding: 0; background: #ffffff; }
  .sheet {
    --sh: ${sheetH}${unit};        /* every f() length resolves against this */
    position: relative;
    width: ${sheetW}${unit}; height: ${sheetH}${unit};
    overflow: hidden;
    background: ${ground} ${bg ? `url("${bg}") center/100% 100% no-repeat` : ''};
  }
  .sheet div, .sheet img { box-sizing: border-box; }
</style></head>
<body><div class="sheet">${themeBg}${body}</div></body></html>`;
}

// ── Output ──────────────────────────────────────────────────────────────────
/**
 * Render to PNG at the artwork's native pixel size — for a 3508×2480 A4 master
 * that IS 300 DPI, so "print-ready" is a measurement rather than a claim.
 */
async function renderPng(html, W, H, scale = 1) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    /*
     * The viewport is ALWAYS the sheet's full CSS size; `scale` changes the
     * output resolution via deviceScaleFactor. Shrinking the viewport instead
     * does not shrink the page — a 3508px-wide sheet in a 1169px viewport is
     * simply cropped, and the "preview" came out as a close-up of the top-left
     * corner. Caught 2026-07-23 by looking at the render instead of trusting it.
     *
     *   scale 1    → W×H          (3508×2480 = true 300 DPI print master)
     *   scale 1/3  → W/3 × H/3    (same design, a ninth of the pixels)
     */
    await page.setViewport({
      width: Math.round(W),
      height: Math.round(H),
      deviceScaleFactor: Math.max(0.1, Math.min(4, scale)),
    });
    await page.setContent(html, { waitUntil: 'load', timeout: 60000 });
    // eslint-disable-next-line no-undef -- runs in the browser context
    await page.evaluate(() => document.fonts.ready);
    const buf = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: Math.round(W), height: Math.round(H) } });
    return Buffer.from(buf);
  } finally {
    await page.close();
  }
}

async function renderPdf(html, landscape) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'load', timeout: 60000 });
    // eslint-disable-next-line no-undef -- runs in the browser context
    await page.evaluate(() => document.fonts.ready);
    const buf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,      // honour the @page size above, don't re-fit
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
      landscape: !!landscape,
    });
    return Buffer.from(buf);
  } finally {
    await page.close();
  }
}

module.exports = {
  FONTS, FONT_KEYS, CSS_H,
  buildVars, substitute, substituteBody, buildHtml, renderPng, renderPdf,
  inlineUpload, elementStyle, esc, fmtDate,
};
