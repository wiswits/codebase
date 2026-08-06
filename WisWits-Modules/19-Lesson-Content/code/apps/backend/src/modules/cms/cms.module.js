module.exports = [
  // Specific prefixes mount before the bare /api/cms taxonomy router (no path
  // overlap exists, but the ordering makes it impossible by construction).
  {
    // CMS — content assets: draft → review → publish workflow, versions, reorder
    name: 'cms.assets',
    prefix: '/api/cms/assets',
    router: require('./assets.routes'),
  },
  {
    // CMS — media metadata: external URL (primary) + existing-uploads attach; no S3
    name: 'cms.media',
    prefix: '/api/cms/media',
    router: require('./media.routes'),
  },
  {
    // CMS — content work assignments (my queue / assigner views)
    name: 'cms.assignments',
    prefix: '/api/cms/assignments',
    router: require('./assignments.routes'),
  },
  {
    // CMS — taxonomy (classes/subjects/chapters/topics, locked asset codes) + content types
    name: 'cms.taxonomy',
    prefix: '/api/cms',
    router: require('./taxonomy.routes'),
  },
];
