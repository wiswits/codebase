const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const Enquiry = require('../models/Enquiry');
const Application = require('../models/Application');
const ApplicationDocument = require('../models/ApplicationDocument');
const TestResult = require('../models/TestResult');
const Interview = require('../models/Interview');
const Offer = require('../models/Offer');
const SourceCost = require('../models/SourceCost');

const buildDateFilter = (from, to, field = 'createdAt') => {
  const filter = {};
  if (from || to) filter[field] = {};
  if (from) filter[field].$gte = new Date(from);
  if (to) filter[field].$lte = new Date(to);
  return filter;
};

// GET /api/analytics/dashboard - top-level stat cards for the home dashboard
const dashboardStats = asyncHandler(async (req, res) => {
  const fy = process.env.CURRENT_FY;
  const [totalEnquiries, totalApplications, testConducted, offersSent, admissions] = await Promise.all([
    Enquiry.countDocuments({ fy }),
    Application.countDocuments({ fy, isDraft: false }),
    TestResult.countDocuments({}),
    Offer.countDocuments({}),
    Application.countDocuments({ fy, status: 'Admitted' }),
  ]);

  res.json(new ApiResponse(200, { totalEnquiries, totalApplications, testConducted, offersSent, admissions }));
});

// GET /api/analytics/funnel (FR31/FR33)
const funnel = asyncHandler(async (req, res) => {
  const { from, to, classApplied, source, counselor } = req.query;
  const fy = process.env.CURRENT_FY;

  const enquiryFilter = { fy, ...buildDateFilter(from, to) };
  const appFilter = { fy, isDraft: false, ...buildDateFilter(from, to) };
  if (classApplied) appFilter['student.classAppliedFor'] = classApplied;
  if (source) {
    enquiryFilter.source = source;
    appFilter.source = source;
  }
  if (counselor) {
    enquiryFilter.counselor = counselor;
    appFilter.counselor = counselor;
  }

  const [enquiries, applications, docsVerified, testQualified, interviewed, offersSent, admissions] = await Promise.all([
    Enquiry.countDocuments(enquiryFilter),
    Application.countDocuments(appFilter),
    Application.countDocuments({ ...appFilter, status: { $in: ['Documents Verified', 'Test Scheduled', 'Test Qualified', 'Interview Scheduled', 'Interviewed', 'Offer Sent', 'Accepted', 'Admitted'] } }),
    Application.countDocuments({ ...appFilter, status: { $in: ['Test Qualified', 'Interview Scheduled', 'Interviewed', 'Offer Sent', 'Accepted', 'Admitted'] } }),
    Application.countDocuments({ ...appFilter, status: { $in: ['Interviewed', 'Offer Sent', 'Accepted', 'Admitted'] } }),
    Application.countDocuments({ ...appFilter, status: { $in: ['Offer Sent', 'Accepted', 'Admitted'] } }),
    Application.countDocuments({ ...appFilter, status: 'Admitted' }),
  ]);

  const stages = [
    { stage: 'Enquiries', count: enquiries },
    { stage: 'Applications', count: applications },
    { stage: 'Documents Verified', count: docsVerified },
    { stage: 'Test Qualified', count: testQualified },
    { stage: 'Interviewed', count: interviewed },
    { stage: 'Offers Sent', count: offersSent },
    { stage: 'Admissions', count: admissions },
  ];

  const withDropoff = stages.map((s, i) => ({
    ...s,
    percentOfTop: enquiries ? Math.round((s.count / enquiries) * 1000) / 10 : 0,
    dropoffFromPrev:
      i === 0 ? 0 : stages[i - 1].count ? Math.round(((stages[i - 1].count - s.count) / stages[i - 1].count) * 1000) / 10 : 0,
  }));

  const conversion = {
    enquiryToApplication: enquiries ? Math.round((applications / enquiries) * 1000) / 10 : 0,
    applicationToDocs: applications ? Math.round((docsVerified / applications) * 1000) / 10 : 0,
    docsToTest: docsVerified ? Math.round((testQualified / docsVerified) * 1000) / 10 : 0,
    testToInterview: testQualified ? Math.round((interviewed / testQualified) * 1000) / 10 : 0,
    interviewToOffer: interviewed ? Math.round((offersSent / interviewed) * 1000) / 10 : 0,
    offerToAdmission: offersSent ? Math.round((admissions / offersSent) * 1000) / 10 : 0,
    overall: enquiries ? Math.round((admissions / enquiries) * 1000) / 10 : 0,
  };

  res.json(new ApiResponse(200, { stages: withDropoff, conversion }));
});

// GET /api/analytics/source-roi (FR32)
const sourceRoi = asyncHandler(async (req, res) => {
  const fy = process.env.CURRENT_FY;
  const applications = await Application.find({ fy, isDraft: false }).select('source status');
  const costs = await SourceCost.find({ fy });

  const bySource = {};
  applications.forEach((a) => {
    const s = a.source || 'Unknown';
    bySource[s] = bySource[s] || { source: s, applications: 0, admits: 0 };
    bySource[s].applications += 1;
    if (a.status === 'Admitted') bySource[s].admits += 1;
  });

  const costMap = {};
  costs.forEach((c) => {
    costMap[c.source] = (costMap[c.source] || 0) + c.cost;
  });

  const result = Object.values(bySource).map((row) => {
    const cost = costMap[row.source] || 0;
    return {
      ...row,
      cost,
      costPerAdmission: row.admits ? Math.round((cost / row.admits) * 100) / 100 : null,
    };
  });

  res.json(new ApiResponse(200, { sourceRoi: result }));
});

// POST /api/analytics/source-cost (manual cost input, FR32)
const setSourceCost = asyncHandler(async (req, res) => {
  const { source, campaign = 'Default', cost } = req.body;
  const fy = process.env.CURRENT_FY;
  const record = await SourceCost.findOneAndUpdate(
    { source, campaign, fy },
    { cost },
    { upsert: true, new: true }
  );
  res.json(new ApiResponse(200, { record }, 'Source cost updated'));
});

module.exports = { dashboardStats, funnel, sourceRoi, setSourceCost };
