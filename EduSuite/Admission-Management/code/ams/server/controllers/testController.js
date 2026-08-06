const { parse } = require('csv-parse/sync');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const EntranceTest = require('../models/EntranceTest');
const TestResult = require('../models/TestResult');
const Application = require('../models/Application');

// POST /api/tests (FR14)
const createTest = asyncHandler(async (req, res) => {
  const { name, classApplied, subjects, maxMarks, date, venue, cutoff } = req.body;
  if (!name || !classApplied || !date) throw new ApiError(400, 'name, classApplied and date are required');

  const test = await EntranceTest.create({
    name,
    classApplied,
    subjects,
    maxMarks,
    date,
    venue,
    cutoff,
    fy: process.env.CURRENT_FY,
  });

  res.status(201).json(new ApiResponse(201, { test }, 'Entrance test created'));
});

// GET /api/tests
const listTests = asyncHandler(async (req, res) => {
  const tests = await EntranceTest.find({ fy: process.env.CURRENT_FY }).sort({ date: -1 });
  res.json(new ApiResponse(200, { tests }));
});

/**
 * POST /api/tests/:id/bulk-upload (FR15-FR17)
 * CSV columns expected: rollNo,applicationNo,marksObtained
 * Chunked processing so a full cohort (a few thousand rows, per NFR Performance)
 * doesn't block the event loop or time out - processed in batches of 200.
 */
const bulkUploadResults = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'CSV file is required');
  const test = await EntranceTest.findById(req.params.id);
  if (!test) throw new ApiError(404, 'Test not found');

  const records = parse(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true });
  if (!records.length) throw new ApiError(400, 'CSV appears to be empty');

  const CHUNK_SIZE = 200;
  const errors = [];
  let processed = 0;

  for (let i = 0; i < records.length; i += CHUNK_SIZE) {
    const chunk = records.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map(async (row) => {
        try {
          const application = await Application.findOne({ applicationNo: row.applicationNo?.trim() });
          if (!application) {
            errors.push(`Row skipped - unknown applicationNo: ${row.applicationNo}`);
            return;
          }
          const marksObtained = Number(row.marksObtained);
          if (Number.isNaN(marksObtained)) {
            errors.push(`Row skipped - invalid marks for ${row.applicationNo}`);
            return;
          }

          const belowCutoff = test.cutoff > 0 && marksObtained < test.cutoff;

          const result = await TestResult.findOneAndUpdate(
            { test: test._id, application: application._id },
            {
              test: test._id,
              application: application._id,
              rollNo: row.rollNo,
              marksObtained,
              maxMarks: test.maxMarks,
              belowCutoff,
            },
            { upsert: true, new: true }
          );

          application.testResult = result._id;
          application.status = belowCutoff ? 'Below Cutoff' : 'Test Qualified';
          await application.save();
          processed += 1;
        } catch (e) {
          errors.push(`Row error for ${row.applicationNo}: ${e.message}`);
        }
      })
    );
  }

  // FR16: auto-compute rank & percentile, per class (test) and per quota category
  await recomputeRanks(test._id);

  res.json(new ApiResponse(200, { processed, totalRows: records.length, errors }, 'Bulk upload processed'));
});

const recomputeRanks = async (testId) => {
  const results = await TestResult.find({ test: testId }).populate('application', 'quotaCategory');
  results.sort((a, b) => b.marksObtained - a.marksObtained);

  const n = results.length;
  const byCategory = {};

  for (let i = 0; i < n; i++) {
    const r = results[i];
    r.rankOverall = i + 1;
    r.percentile = n > 1 ? Math.round(((n - (i + 1)) / (n - 1)) * 1000) / 10 : 100;

    const cat = r.application?.quotaCategory || 'General';
    byCategory[cat] = byCategory[cat] || [];
    byCategory[cat].push(r);
  }

  const saves = [];
  Object.values(byCategory).forEach((list) => {
    list.sort((a, b) => b.marksObtained - a.marksObtained);
    list.forEach((r, idx) => {
      r.rankInCategory = idx + 1;
      saves.push(r.save());
    });
  });
  await Promise.all(saves);
};

// GET /api/tests/:id/results (FR16 view, sortable by rank)
const getResults = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const [results, total] = await Promise.all([
    TestResult.find({ test: req.params.id })
      .populate('application', 'applicationNo student.name quotaCategory')
      .sort({ rankOverall: 1 })
      .skip(skip)
      .limit(Number(limit)),
    TestResult.countDocuments({ test: req.params.id }),
  ]);
  res.json(new ApiResponse(200, { results, total, page: Number(page), pages: Math.ceil(total / limit) }));
});

// PATCH /api/tests/results/:resultId/override (FR17 - manual override of below-cutoff flag)
const overrideCutoff = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason) throw new ApiError(400, 'A reason is required to override the cutoff');

  const result = await TestResult.findById(req.params.resultId);
  if (!result) throw new ApiError(404, 'Result not found');

  result.belowCutoff = false;
  result.cutoffOverride = true;
  result.overrideReason = reason;
  await result.save();

  await Application.findByIdAndUpdate(result.application, { status: 'Test Qualified' });

  res.json(new ApiResponse(200, { result }, 'Cutoff override applied'));
});

module.exports = { createTest, listTests, bulkUploadResults, getResults, overrideCutoff };
