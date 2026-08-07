'use strict';
const express = require('express');
const router  = express.Router();
const db      = require('../../config/db');

router.get('/manifest', async (req, res) => {
  const slug = (req.query.org || 'default').toString().toLowerCase().replace(/[^a-z0-9_-]/g,'');
  let org = null;
  try {
    const q = `SELECT name, display_name, slug, logo_url, brand_color, primary_color, tagline, platform_name
               FROM client_organizations WHERE slug=? OR CAST(id AS CHAR)=? OR org_code=? LIMIT 1`;
    const [rows] = await db.pool.execute(q, [slug, slug, slug]);
    if (rows && rows.length) org = rows[0];
  } catch (e) { console.error('manifest db error:', e.message); }

  const name  = (org && (org.platform_name || org.display_name || org.name)) || 'WISWITS';
  const short = name.split(' ').slice(0,2).join(' ').slice(0,12);
  const logo  = (org && org.logo_url) || '/icons/icon-512x512.png';
  const theme = (org && (org.brand_color || org.primary_color)) || '#6366f1';
  const desc  = (org && org.tagline) || (name + ' - Academic Intelligence Platform');

  res.set('Cache-Control','public, max-age=60');
  res.json({
    name, short_name: short, description: desc,
    start_url:'/', scope:'/', display:'standalone',
    orientation:'portrait-primary',
    background_color:'#ffffff', theme_color: theme,
    icons:[
      { src: logo, sizes:'192x192', type:'image/png', purpose:'any maskable' },
      { src: logo, sizes:'512x512', type:'image/png', purpose:'any maskable' }
    ]
  });
});

module.exports = router;
