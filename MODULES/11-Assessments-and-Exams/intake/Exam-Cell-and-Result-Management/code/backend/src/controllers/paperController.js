import asyncHandler from 'express-async-handler';
import PDFDocument from 'pdfkit';
import Paper from '../models/Paper.js';
import Blueprint from '../models/Blueprint.js';
import Question from '../models/Question.js';

const SET_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Picks `count` questions for a chapter, preferring the requested difficulty mix,
// falling back to any available question in that chapter if the bank is thin.
const pickQuestionsForChapter = async (chapterRow, subjectId, usedIds) => {
  const wantedByDifficulty = [
    { difficulty: 'easy', weight: chapterRow.difficulty.easy },
    { difficulty: 'medium', weight: chapterRow.difficulty.medium },
    { difficulty: 'hard', weight: chapterRow.difficulty.hard },
  ];

  const pool = await Question.find({
    subject: subjectId,
    chapter: chapterRow.chapter,
    _id: { $nin: Array.from(usedIds) },
  });

  if (pool.length === 0) return [];

  const shuffledPool = shuffle(pool);
  const selected = [];
  let marksTarget = chapterRow.totalMarks;
  let cursor = 0;

  // Try to respect difficulty weighting proportionally, then fill the remaining
  // marks target with whatever is left in the pool.
  for (const bucket of wantedByDifficulty) {
    if (marksTarget <= 0) break;
    const bucketQuestions = shuffledPool.filter((q) => q.difficulty === bucket.difficulty);
    for (const q of bucketQuestions) {
      if (marksTarget <= 0) break;
      if (selected.find((s) => s._id.equals(q._id))) continue;
      selected.push(q);
      marksTarget -= q.marks;
    }
  }

  while (marksTarget > 0 && cursor < shuffledPool.length) {
    const q = shuffledPool[cursor];
    cursor += 1;
    if (selected.find((s) => s._id.equals(q._id))) continue;
    selected.push(q);
    marksTarget -= q.marks;
  }

  selected.forEach((q) => usedIds.add(String(q._id)));
  return selected;
};

// @desc    Generate paper set(s) from a blueprint
// @route   POST /api/papers/generate
// @access  Private (Admin, Exam Controller, Teacher)
export const generatePaper = asyncHandler(async (req, res) => {
  const { blueprintId, numberOfSets = 1, duration = 180, examId } = req.body;

  const blueprint = await Blueprint.findById(blueprintId).populate('subject class');
  if (!blueprint) {
    res.status(404);
    throw new Error('Blueprint not found');
  }

  const generatedPapers = [];
  const usedAcrossSets = new Set();

  for (let setIndex = 0; setIndex < Math.min(Number(numberOfSets) || 1, SET_LABELS.length); setIndex += 1) {
    const sections = [];
    let totalMarks = 0;
    const usedInThisSet = new Set();

    for (const chapterRow of blueprint.chapters) {
      const questions = await pickQuestionsForChapter(chapterRow, blueprint.subject._id, usedInThisSet);
      if (questions.length === 0) continue;

      const sectionMarks = questions.reduce((sum, q) => sum + q.marks, 0);
      sections.push({
        sectionName: chapterRow.chapter,
        questions: questions.map((q) => q._id),
        marksPerQuestion: Math.round(sectionMarks / questions.length),
        totalMarks: sectionMarks,
      });
      totalMarks += sectionMarks;
    }

    if (sections.length === 0) {
      res.status(400);
      throw new Error(
        'Not enough questions in the Question Bank to generate a paper for this blueprint. Add more questions for the listed chapters first.'
      );
    }

    const paper = await Paper.create({
      blueprint: blueprint._id,
      exam: examId || undefined,
      setLabel: SET_LABELS[setIndex],
      sections,
      totalMarks,
      duration: Number(duration),
      status: 'generated',
      createdBy: req.user._id,
    });

    generatedPapers.push(paper);
    usedInThisSet.forEach((id) => usedAcrossSets.add(id));
  }

  const populated = await Paper.populate(generatedPapers, {
    path: 'sections.questions',
    select: 'questionText marks difficulty bloomLevel questionType',
  });

  res.status(201).json({ success: true, data: populated });
});

// @desc    Get all generated papers (optionally filter by blueprint)
// @route   GET /api/papers
// @access  Private
export const getPapers = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.blueprint) query.blueprint = req.query.blueprint;

  const papers = await Paper.find(query)
    .populate({ path: 'blueprint', populate: ['subject', 'class'] })
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: papers });
});

// @desc    Get single paper with full question detail
// @route   GET /api/papers/:id
// @access  Private
export const getPaperById = asyncHandler(async (req, res) => {
  const paper = await Paper.findById(req.params.id)
    .populate({ path: 'blueprint', populate: ['subject', 'class'] })
    .populate('sections.questions')
    .populate('createdBy', 'name');

  if (!paper) {
    res.status(404);
    throw new Error('Paper not found');
  }
  res.json({ success: true, data: paper });
});

// @desc    Delete a generated paper
// @route   DELETE /api/papers/:id
// @access  Private (Admin, Exam Controller)
export const deletePaper = asyncHandler(async (req, res) => {
  const paper = await Paper.findById(req.params.id);
  if (!paper) {
    res.status(404);
    throw new Error('Paper not found');
  }
  await paper.deleteOne();
  res.json({ success: true, message: 'Paper deleted successfully' });
});

// @desc    Download a generated paper as a printable PDF question paper
// @route   GET /api/papers/:id/pdf
// @access  Private
export const downloadPaperPdf = asyncHandler(async (req, res) => {
  const paper = await Paper.findById(req.params.id)
    .populate({ path: 'blueprint', populate: ['subject', 'class'] })
    .populate('sections.questions');

  if (!paper) {
    res.status(404);
    throw new Error('Paper not found');
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=question-paper-set-${paper.setLabel}.pdf`);

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(res);

  doc.fontSize(18).font('Helvetica-Bold').fillColor('#1e293b').text('ECRMS', { align: 'center' });
  doc.fontSize(13).font('Helvetica').fillColor('#475569').text(
    `${paper.blueprint?.subject?.name || ''} — ${paper.blueprint?.class?.name || ''} ${paper.blueprint?.class?.section || ''}`,
    { align: 'center' }
  );
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor('#64748b').text(`Set ${paper.setLabel} | Total Marks: ${paper.totalMarks} | Duration: ${paper.duration} min`, {
    align: 'center',
  });
  doc.moveDown(1);
  doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor('#e2e8f0').stroke();
  doc.moveDown(1);

  let qNo = 1;
  paper.sections.forEach((section) => {
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#1e293b').text(`Section: ${section.sectionName} (${section.totalMarks} marks)`);
    doc.moveDown(0.5);

    section.questions.forEach((q) => {
      if (doc.y > doc.page.height - 100) doc.addPage();
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b').text(`Q${qNo}. `, { continued: true });
      doc.font('Helvetica').fillColor('#334155').text(`${q.questionText} [${q.marks} marks]`);

      if (q.questionType === 'mcq' && q.options?.length) {
        doc.font('Helvetica').fontSize(10).fillColor('#475569');
        q.options.forEach((opt, i) => {
          doc.text(`   ${String.fromCharCode(97 + i)}) ${opt}`);
        });
      }
      doc.moveDown(0.6);
      qNo += 1;
    });
    doc.moveDown(0.5);
  });

  doc.end();
});
