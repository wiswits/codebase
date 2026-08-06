'use strict';
/**
 * BRANDING CONTROLLER
 * Single source of truth for org branding across the platform.
 */
const db = require('../../config/db');
const { pruneMissingUploads } = require('../../utils/uploadPath');

// Asset columns that hold an /uploads/* path — nulled in the response when the
// file is gone, so the UI falls back instead of 404-ing on every render.
const ASSET_COLS = ['logo_url', 'logo_dark_url', 'favicon_url', 'school_seal_url', 'principal_signature_url'];

const DEFAULT_BRANDING = {
  name: 'WISWITS School',
  short_name: 'WISWITS',
  tagline: 'Empowering Education',
  logo_url: null,
  logo_dark_url: null,
  favicon_url: null,
  school_seal_url: null,
  principal_signature_url: null,
  principal_name: null,
  brand_color: null,
  primary_color: '#7F77DD',
  secondary_color: '#534AB7',
  accent_color: '#1D9E75',
  address_line1: null,
  address_line2: null,
  city: null,
  state: null,
  pincode: null,
  country: 'India',
  phone: null,
  email: null,
  website: null,
  affiliation_number: null,
  affiliation_board: 'CBSE',
  report_card_footer: null,
  whatsapp_sender_name: null,
};

const SELECT_COLS = `
  id, name, short_name, tagline, logo_url, logo_dark_url, favicon_url,
  school_seal_url, principal_signature_url, principal_name,
  brand_color, primary_color, secondary_color, accent_color,
  address_line1, address_line2, city, state, pincode, country,
  phone, email, website, affiliation_number, affiliation_board,
  report_card_footer, whatsapp_sender_name, branding_updated_at
`;

exports.getBranding = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const [rows] = await db.pool.execute(
      `SELECT ${SELECT_COLS} FROM client_organizations WHERE id = ?`,
      [orgId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Organization not found' });
    return res.json({ success: true, branding: pruneMissingUploads({ ...DEFAULT_BRANDING, ...rows[0] }, ASSET_COLS) });
  } catch (err) {
    console.error('[branding.get]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateBranding = async (req, res) => {
  try {
    const orgId = req.user.org_id;
    const roleSlug = req.user.role_slug;
    if (!['owner', 'admin', 'principal'].includes(roleSlug)) {
      return res.status(403).json({ success: false, message: 'Only owners and admins can update branding' });
    }
    const allowed = [
      'name', 'display_name', 'short_name', 'tagline', 'logo_url', 'logo_dark_url', 'favicon_url',
      'school_seal_url', 'principal_signature_url', 'principal_name',
      'brand_color', 'primary_color', 'secondary_color', 'accent_color',
      'address_line1', 'address_line2', 'city', 'state', 'pincode', 'country',
      'phone', 'email', 'website', 'affiliation_number', 'affiliation_board',
      'report_card_footer', 'whatsapp_sender_name'
    ];
    const updates = {};
    for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];
    // display_name is the canonical name the app chrome renders (sidebar/header show
    // display_name || name). Keep it in lockstep with `name` so editing the school
    // name on the branding page actually updates what the school sees.
    if (updates.name !== undefined && updates.display_name === undefined) {
      updates.display_name = updates.name;
    }
    // brand_color is the CANONICAL accent column — the app chrome (OrgContext)
    // reads only brand_color. This page historically edited primary_color, so a
    // premium "Primary" save never changed the visible accent (split-brain D1,
    // AUDIT.md). Mirror it; primary_color keeps being written for one release
    // (deprecation §15), then the premium page moves to brand_color outright.
    if (updates.primary_color !== undefined && updates.brand_color === undefined) {
      updates.brand_color = updates.primary_color;
    }
    if (!Object.keys(updates).length) return res.status(400).json({ success: false, message: 'No valid fields to update' });

    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(updates), orgId];
    await db.pool.execute(`UPDATE client_organizations SET ${fields} WHERE id = ?`, values);

    const [rows] = await db.pool.execute(
      `SELECT ${SELECT_COLS} FROM client_organizations WHERE id = ?`,
      [orgId]
    );
    return res.json({ success: true, branding: pruneMissingUploads({ ...DEFAULT_BRANDING, ...rows[0] }, ASSET_COLS) });
  } catch (err) {
    console.error('[branding.update]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPublicBranding = async (req, res) => {
  try {
    const { org_id } = req.query;
    let targetOrgId = org_id;
    if (!targetOrgId) {
      const [orgRows] = await db.pool.execute('SELECT id FROM client_organizations WHERE id != 1 LIMIT 1');
      if (!orgRows.length) return res.json({ success: true, branding: DEFAULT_BRANDING });
      targetOrgId = orgRows[0].id;
    }
    const [rows] = await db.pool.execute(
      `SELECT name, short_name, tagline, logo_url, logo_dark_url, favicon_url, primary_color, secondary_color, accent_color
       FROM client_organizations WHERE id = ?`,
      [targetOrgId]
    );
    return res.json({ success: true, branding: { ...DEFAULT_BRANDING, ...(rows[0] || {}) } });
  } catch (err) {
    console.error('[branding.public]', err);
    return res.json({ success: true, branding: DEFAULT_BRANDING });
  }
};

exports.DEFAULT_BRANDING = DEFAULT_BRANDING;
