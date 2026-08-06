module.exports = [
  {
    // HR core (hr-cms module) — employee directory, departments, pods
    name: 'hr.employees',
    prefix: '/api/hr/employees',
    router: require('./employees.routes'),
  },
  {
    // HR — geofenced employee check-in/out, policy, holidays (distinct from /api/attendance class-marking)
    name: 'hr.attendance',
    prefix: '/api/hr/attendance',
    router: require('./attendance.routes'),
  },
  {
    // HR — daily work reports with server-computed auto_metrics
    name: 'hr.work-reports',
    prefix: '/api/hr/work-reports',
    router: require('./workReports.routes'),
  },
];
