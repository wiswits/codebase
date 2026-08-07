// NOTE: the recovery nightly cron (services/cron/recoveryCron) is a boot
// side-effect started from server.js — deliberately NOT part of this mount.
module.exports = [
  {
    name: 'recovery.recovery',
    prefix: '/api/recovery',
    router: require('./recovery.routes'),
  },
];
