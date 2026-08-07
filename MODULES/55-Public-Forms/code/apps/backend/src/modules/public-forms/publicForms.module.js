module.exports = [
  // PUBLIC intake — unauthenticated, own per-IP limiter. Mounted in the ROUTES
  // stage (like certmgmt-public) so it sits AFTER express.json() body-parsing;
  // preLimiter runs before the body parser, which would leave req.body empty.
  {
    name: 'public-forms.public',
    prefix: '/api/public/forms',
    router: require('./publicForms.public.routes'),
  },
  // ADMIN — authenticated management of the org's forms.
  {
    name: 'public-forms.admin',
    prefix: '/api/forms',
    router: require('./publicForms.admin.routes'),
  },
];
