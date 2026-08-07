'use strict';

/**
 * External-module adapters.
 *
 * ⚠️ CONTRACT rule 16: this module must NEVER `require()` the QBank or
 * Curriculum modules directly. It talks to them over HTTP. In dev/test we swap
 * in mock adapters (USE_MOCK_EXTERNAL=true) so PL runs standalone.
 *
 * The two collaborators:
 *   curriculumApi.getPrerequisiteGraph()  → { [wiswits_id]: {requires, enables} }
 *   qbankApi.pick(...) / pickOne(...) / getOptionMeta(...) / get(...)
 */

const useMock = String(process.env.USE_MOCK_EXTERNAL || 'true') === 'true';

module.exports = useMock
  ? require('./mockAdapters')
  : require('./httpAdapters');
