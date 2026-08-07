const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { uploadDir } = require('../middleware/upload');

/**
 * Generates a school-letterhead offer letter PDF (FR22).
 * Letterhead assets (logo, signature) are placeholder text here since no brand
 * assets were provided - swap in real image files under /server/assets if available.
 */
const generateOfferLetterPdf = async ({ application, offer }) => {
  const fileName = `offer-${application.applicationNo.replace(/\//g, '_')}.pdf`;
  const filePath = path.join(uploadDir, fileName);

  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.fontSize(18).fillColor('#1e40af').text(process.env.SCHOOL_NAME || 'EduSuite School', { align: 'center' });
  doc.moveDown(0.2);
  doc.fontSize(12).fillColor('#374151').text('Offer of Admission', { align: 'center' });
  doc.moveDown(1);
  doc.fontSize(10).fillColor('#6b7280').text(`Date: ${new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
  doc.moveDown(1);

  doc.fillColor('#111827').fontSize(11);
  doc.text(`Dear ${application.parent?.fatherName || application.student.name}'s Parent/Guardian,`);
  doc.moveDown(0.5);
  doc.text(
    `We are pleased to offer ${application.student.name} admission to Class ${application.student.classAppliedFor} ` +
      `for the academic session ${application.fy}. Please confirm your acceptance by paying the token amount of ` +
      `INR ${offer.tokenAmount || 0} before ${offer.validTill.toLocaleDateString('en-IN')}.`
  );
  doc.moveDown(0.5);
  doc.text(`Application No: ${application.applicationNo}`);
  doc.text(`Quota Category: ${application.quotaCategory}`);
  doc.moveDown(1);
  doc.text('Warm regards,');
  doc.moveDown(2);
  doc.text('Principal');

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return { fileName, filePath };
};

module.exports = { generateOfferLetterPdf };
