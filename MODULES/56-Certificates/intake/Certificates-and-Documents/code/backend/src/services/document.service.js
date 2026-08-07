const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const sharp = require('sharp');
const { createHash } = require('crypto');
const { logger } = require('../utils/logger');
const { encrypt } = require('../utils/encryption');

const generateDocument = async ({ document, template, metadata }) => {
  try {
    const designData = template.design_data;
    const placeholders = template.placeholder_data || {};
    
    // Generate hash for verification
    const hash = createHash('sha256')
      .update(JSON.stringify({ documentId: document.id, ...metadata }))
      .digest('hex');

    // Generate QR code
    const qrData = {
      documentNumber: document.document_number,
      hash,
      verificationUrl: `${process.env.VERIFICATION_URL}/${document.document_number}`
    };
    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

    // Generate PDF
    const pdfBuffer = await generatePDF({
      designData,
      placeholders,
      metadata,
      document,
      qrCode
    });

    // Generate verification code
    const verificationCode = generateVerificationCode();

    return {
      pdf: pdfBuffer.toString('base64'),
      hash,
      qrCode,
      verificationCode,
      documentNumber: document.document_number
    };
  } catch (error) {
    logger.error('Document generation error:', error);
    throw error;
  }
};

const generatePDF = async ({ designData, placeholders, metadata, document, qrCode }) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'portrait',
        margin: 50
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Apply design data
      if (designData.background) {
        // Add background color or image
        doc.rect(0, 0, doc.page.width, doc.page.height)
          .fill(designData.background || '#ffffff');
      }

      // Add border
      if (designData.border) {
        doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
          .stroke(designData.borderColor || '#000000');
      }

      // Add logo if provided
      if (designData.logo) {
        // Add logo logic
      }

      // Add title
      if (designData.title) {
        doc.fontSize(designData.titleSize || 24)
          .font('Helvetica-Bold')
          .fillColor(designData.titleColor || '#000000')
          .text(
            designData.title,
            doc.page.width / 2 - 100,
            80,
            { align: 'center', width: 200 }
          );
      }

      // Add content with placeholders
      let yPosition = 150;
      if (designData.content) {
        for (const section of designData.content) {
          let text = section.text;
          // Replace placeholders
          for (const [key, value] of Object.entries(placeholders)) {
            text = text.replace(`{{${key}}}`, metadata[key] || value);
          }

          doc.fontSize(section.fontSize || 12)
            .font(section.font || 'Helvetica')
            .fillColor(section.color || '#000000')
            .text(
              text,
              50,
              yPosition,
              { align: section.align || 'left', width: doc.page.width - 100 }
            );
          
          yPosition += section.spacing || 20;
        }
      }

      // Add QR code
      if (qrCode) {
        const qrImage = Buffer.from(qrCode.split(',')[1], 'base64');
        doc.image(qrImage, doc.page.width - 130, doc.page.height - 130, {
          width: 80,
          height: 80
        });
      }

      // Add footer
      if (designData.footer) {
        doc.fontSize(8)
          .fillColor('#666666')
          .text(
            designData.footer,
            50,
            doc.page.height - 50,
            { align: 'center', width: doc.page.width - 100 }
          );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

const generateVerificationCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `VC-${code}`;
};

const validateDocumentHash = (document, hash) => {
  const calculated = createHash('sha256')
    .update(JSON.stringify({ documentId: document.id, ...document.metadata }))
    .digest('hex');
  return calculated === hash;
};

module.exports = {
  generateDocument,
  generatePDF,
  generateVerificationCode,
  validateDocumentHash
};