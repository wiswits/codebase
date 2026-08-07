'use strict';
/*
 * Defaults an organisation starts from: certificate types with professionally
 * worded copy, and layout presets.
 *
 * These are SEEDS, not rules. They are written into client_cert_types on first
 * use so an org can rename, reword, reorder or switch off anything — nothing here
 * is consulted again afterwards. That is the difference between a default and a
 * hardcoded enum, and it is why a coaching institute and a company can use the
 * same engine without either seeing the other's vocabulary.
 */

/*
 * Wording is deliberately formal and third-person: a certificate is a statement
 * by the organisation about a person, addressed to whoever reads it later.
 *
 * ── THE BODY CONTINUES THE SHEET; IT DOES NOT RESTART IT ────────────────────
 * Every built-in layout already prints two elements ABOVE the wording: a lead-in
 * ("This is to certify that", "Presented to") and the recipient's name in display
 * type. So a body that opened with "This is to certify that {{recipient_name}}…"
 * printed BOTH of them a second time, and every certificate from every theme read:
 *
 *      This is to certify that
 *           Priya Sharma
 *      ─────────────────────
 *      This is to certify that Priya Sharma has satisfactorily completed…
 *
 * The name twice, the lead-in twice — reported by AK. The wording therefore starts
 * at the PREDICATE and reads as the continuation of the name above it, which is
 * how a certificate has always been laid out. If a layout drops its name element,
 * put {{recipient_name}} back into the body for that layout — never into these
 * seeds, which are written for the shipped layouts.
 */
const DEFAULT_TYPES = [
  {
    name: 'Course Completion', code: 'CC', default_validity_months: null, sort_order: 10,
    default_body:
      'has successfully completed the course in {{department}} conducted by '
      + '{{organisation_name}} from {{start_date}} to {{end_date}}, a period of {{duration}}. '
      + 'Their performance throughout the course was assessed as {{performance}}.',
  },
  {
    name: 'Internship', code: 'INT', default_validity_months: null, sort_order: 20,
    default_body:
      'has satisfactorily completed an internship in {{department}} at {{organisation_name}}, '
      + 'serving as {{title}} from {{start_date}} to {{end_date}}, a period of {{duration}}. '
      + 'Their conduct and contribution throughout were assessed as {{performance}}.',
  },
  {
    name: 'Training', code: 'TRN', default_validity_months: 12, sort_order: 30,
    default_body:
      'has successfully undergone training in {{department}} at {{organisation_name}} '
      + 'from {{start_date}} to {{end_date}}. This certificate remains valid until {{valid_until}}.',
  },
  {
    name: 'Workshop', code: 'WSP', default_validity_months: null, sort_order: 40,
    default_body:
      'attended and completed the workshop on {{title}} conducted by {{organisation_name}} '
      + 'on {{start_date}}.',
  },
  {
    name: 'Appreciation', code: 'APR', default_validity_months: null, sort_order: 50,
    default_body:
      'is sincerely appreciated for their outstanding contribution to {{department}} '
      + 'at {{organisation_name}}, recognised on {{issue_date}}.',
  },
  {
    name: 'Participation', code: 'PTC', default_validity_months: null, sort_order: 60,
    default_body:
      'participated in {{title}} organised by {{organisation_name}} on {{start_date}}.',
  },
  {
    name: 'Experience', code: 'EXP', default_validity_months: null, sort_order: 70,
    default_body:
      'was employed with {{organisation_name}} as {{title}} in the {{department}} department '
      + 'from {{start_date}} to {{end_date}}. We record our appreciation of their service '
      + 'and wish them well.',
  },
];

// ── Layout presets ──────────────────────────────────────────────────────────
// Every coordinate is a fraction of the artwork (see certRender.js). `size` is a
// fraction of HEIGHT, so a preset drops onto artwork of any resolution unchanged.
const t = (key, over = {}) => ({ type: 'text', key, ...over });

const PRESETS = {
  classic: {
    label: 'Classic',
    elements: [
      t('heading', { text: 'CERTIFICATE OF COMPLETION', x: 0.5, y: 0.20, w: 0.8, size: 0.052, font: 'serif', weight: 600, letterSpacing: 0.14, color: '#16233F' }),
      t('lead', { text: 'This is to certify that', x: 0.5, y: 0.33, w: 0.6, size: 0.028, font: 'serif', italic: true, color: '#4A5573' }),
      t('recipient_name', { x: 0.5, y: 0.42, w: 0.75, size: 0.085, font: 'display', weight: 600, color: '#0F2147' }),
      t('body', { text: '{{body}}', x: 0.5, y: 0.585, w: 0.72, size: 0.028, font: 'serif', lineHeight: 1.7, color: '#45506D' }),
      t('signatory_name', { x: 0.24, y: 0.845, w: 0.26, size: 0.026, font: 'sans', weight: 700, color: '#16233F' }),
      t('signatory_role', { x: 0.24, y: 0.885, w: 0.26, size: 0.021, font: 'sans', color: '#6B7695' }),
      t('certificate_id', { x: 0.24, y: 0.945, w: 0.3, size: 0.019, font: 'mono', color: '#6B7695' }),
      t('issue_date', { text: 'Issued On {{issue_date}}', x: 0.5, y: 0.945, w: 0.3, size: 0.019, font: 'sans', color: '#6B7695' }),
      { type: 'qr', key: 'qr', x: 0.855, y: 0.855, w: 0.105 },
    ],
  },
  modern: {
    label: 'Modern',
    elements: [
      t('heading', { text: 'CERTIFICATE OF COMPLETION', x: 0.34, y: 0.19, w: 0.5, size: 0.042, font: 'sans', weight: 700, letterSpacing: 0.1, align: 'left', color: '#16233F' }),
      t('lead', { text: 'Presented to', x: 0.28, y: 0.30, w: 0.38, size: 0.026, font: 'sans', align: 'left', color: '#6B7695', uppercase: true, letterSpacing: 0.12 }),
      t('recipient_name', { x: 0.44, y: 0.40, w: 0.7, size: 0.082, font: 'sans', weight: 700, align: 'left', color: '#0F2147' }),
      t('body', { text: '{{body}}', x: 0.44, y: 0.58, w: 0.7, size: 0.027, font: 'sans', lineHeight: 1.75, align: 'left', color: '#45506D' }),
      t('signatory_name', { x: 0.22, y: 0.86, w: 0.26, size: 0.026, font: 'sans', weight: 700, align: 'left', color: '#16233F' }),
      t('signatory_role', { x: 0.22, y: 0.90, w: 0.26, size: 0.021, font: 'sans', align: 'left', color: '#6B7695' }),
      t('certificate_id', { x: 0.22, y: 0.95, w: 0.3, size: 0.019, font: 'mono', align: 'left', color: '#6B7695' }),
      { type: 'qr', key: 'qr', x: 0.87, y: 0.87, w: 0.1 },
    ],
  },
  minimal: {
    label: 'Minimal',
    elements: [
      t('recipient_name', { x: 0.5, y: 0.44, w: 0.8, size: 0.078, font: 'serif', weight: 500, color: '#16233F' }),
      t('body', { text: '{{body}}', x: 0.5, y: 0.60, w: 0.66, size: 0.026, font: 'serif', lineHeight: 1.8, color: '#5A6480' }),
      t('certificate_id', { x: 0.5, y: 0.93, w: 0.4, size: 0.018, font: 'mono', color: '#8A93A8' }),
      { type: 'qr', key: 'qr', x: 0.88, y: 0.88, w: 0.085 },
    ],
  },
  corporate: {
    label: 'Corporate',
    elements: [
      t('organisation_name', { x: 0.26, y: 0.14, w: 0.4, size: 0.028, font: 'sans', weight: 700, align: 'left', uppercase: true, letterSpacing: 0.1, color: '#16233F' }),
      t('heading', { text: 'CERTIFICATE OF {{certificate_type}}', x: 0.5, y: 0.27, w: 0.84, size: 0.046, font: 'sans', weight: 700, letterSpacing: 0.08, color: '#0F2147' }),
      t('recipient_name', { x: 0.5, y: 0.41, w: 0.8, size: 0.07, font: 'display', weight: 600, color: '#0F2147' }),
      t('body', { text: '{{body}}', x: 0.5, y: 0.58, w: 0.78, size: 0.026, font: 'sans', lineHeight: 1.7, color: '#45506D' }),
      t('signatory_name', { x: 0.2, y: 0.85, w: 0.24, size: 0.024, font: 'sans', weight: 700, color: '#16233F' }),
      t('signatory_role', { x: 0.2, y: 0.89, w: 0.24, size: 0.02, font: 'sans', color: '#6B7695' }),
      t('valid_until', { text: 'Valid until {{valid_until}}', x: 0.5, y: 0.94, w: 0.32, size: 0.019, font: 'sans', color: '#6B7695' }),
      t('certificate_id', { x: 0.2, y: 0.94, w: 0.3, size: 0.019, font: 'mono', color: '#6B7695' }),
      { type: 'qr', key: 'qr', x: 0.855, y: 0.86, w: 0.1 },
    ],
  },
  centred: {
    label: 'Centred',
    elements: [
      t('heading', { text: '{{certificate_type}}', x: 0.5, y: 0.24, w: 0.7, size: 0.048, font: 'serif', weight: 600, uppercase: true, letterSpacing: 0.16, color: '#16233F' }),
      t('recipient_name', { x: 0.5, y: 0.40, w: 0.8, size: 0.09, font: 'display', weight: 600, color: '#0F2147' }),
      t('body', { text: '{{body}}', x: 0.5, y: 0.60, w: 0.68, size: 0.027, font: 'serif', lineHeight: 1.75, color: '#45506D' }),
      t('signatory_name', { x: 0.5, y: 0.83, w: 0.3, size: 0.025, font: 'serif', weight: 700, color: '#16233F' }),
      t('signatory_role', { x: 0.5, y: 0.87, w: 0.3, size: 0.02, font: 'serif', color: '#6B7695' }),
      t('certificate_id', { x: 0.5, y: 0.95, w: 0.4, size: 0.019, font: 'mono', color: '#6B7695' }),
      { type: 'qr', key: 'qr', x: 0.87, y: 0.87, w: 0.095 },
    ],
  },
};

const PRESET_KEYS = Object.keys(PRESETS);

/** The shape every preset above is drawn for: A4 LANDSCAPE at 300 DPI. */
const PRESET_ASPECT = 3508 / 2480;

/*
 * Element types whose `w` is a fraction of the sheet's HEIGHT rather than its
 * width — they are drawn square and the renderer squares them off the height
 * (`wPct = size * sheetH / sheetW` in certRender.js).
 */
const HEIGHT_SIZED = new Set(['qr', 'seal', 'logo']);

/**
 * Re-fit a layout drawn for one sheet shape onto another.
 *
 * ⚠️ MIRRORED by fitElements() in apps/web/src/components/certificates/certLayout.ts.
 * Change one, change the other, or the editor and the server disagree about what
 * an uploaded letterhead should look like.
 *
 * THE BUG THIS KILLS: `size` is a fraction of the sheet's HEIGHT, and every
 * preset here is drawn for A4 LANDSCAPE. Upload an A4 PORTRAIT letterhead — which
 * is what a school letterhead always is — and each letter grows 41% at the exact
 * moment the sheet loses 29% of its width. The heading wrapped to two lines, the
 * recipient's name swelled to a third of the page, and the wording climbed
 * straight through both. It read as a broken editor; it was a preset being
 * measured against the wrong side of the paper.
 *
 * Scaling every height-derived length by the aspect ratio keeps each element the
 * same size RELATIVE TO THE WIDTH — and width is what decides where a line wraps.
 */
function fitElements(elements, fromAspect, toAspect) {
  const k = toAspect / fromAspect;
  const copy = (Array.isArray(elements) ? elements : []).map((e) => ({ ...e }));
  if (!Number.isFinite(k) || k <= 0 || Math.abs(k - 1) < 0.01) return copy;
  return copy.map((e) => {
    const next = { ...e };
    if (e.size != null) next.size = e.size * k;
    if (e.thickness != null) next.thickness = e.thickness * k;
    if (e.w != null && HEIGHT_SIZED.has(e.type)) next.w = e.w * k;
    return next;
  });
}

/**
 * The starting layout for a sheet of the given pixel size. Uploaded artwork of
 * ANY shape gets a layout that fits it — never the landscape preset verbatim.
 */
const defaultLayout = (width, height) => {
  const elements = width && height
    ? fitElements(PRESETS.classic.elements, PRESET_ASPECT, width / height)
    : PRESETS.classic.elements;
  return JSON.parse(JSON.stringify({ preset: 'classic', elements }));
};

module.exports = { DEFAULT_TYPES, PRESETS, PRESET_KEYS, PRESET_ASPECT, fitElements, defaultLayout };
