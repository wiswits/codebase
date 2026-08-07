'use strict';

/**
 * The PL algorithm brain — 8 pure cores. No I/O lives here; services inject
 * data. ⚠️ Every function is reviewed by AK Sir. See docs/ALGORITHMS.md.
 */

module.exports = {
  constants: require('./constants'),
  util: require('./util'),
  weakAreaDetector: require('./weakAreaDetector'),
  rootCause: require('./rootCause'),
  behaviour: require('./behaviour'),
  distractor: require('./distractor'),
  worksheet: require('./worksheet'),
  recoveryCycle: require('./recoveryCycle'),
  benchmark: require('./benchmark'),
  sm2: require('./sm2'),
};
