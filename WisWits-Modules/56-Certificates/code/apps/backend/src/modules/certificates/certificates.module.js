module.exports = [
  {
    // Certificates module (native, ADR-012 §7) — staff→student certificates.
    name: 'certificates.certificates',
    prefix: '/api/certificates',
    router: require('./certificates.routes'),
  },
  {
    // Certificate ENGINE — public verification. Mounted BEFORE the admin surface
    // and as its own descriptor because it must not sit behind `authenticate`:
    // whoever scans a printed QR has no session. Keeping it in a separate router
    // means the auth boundary is a file boundary, not a line someone can move.
    name: 'certificates.certmgmt-public',
    prefix: '/api/cert-mgmt/public',
    router: require('./certmgmt.public.routes'),
  },
  {
    // Certificate ENGINE — admin surface (tenant-configurable types, artwork,
    // layout editor, server-side render, delivery).
    name: 'certificates.certmgmt',
    prefix: '/api/cert-mgmt',
    router: require('./certmgmt.routes'),
  },
];
