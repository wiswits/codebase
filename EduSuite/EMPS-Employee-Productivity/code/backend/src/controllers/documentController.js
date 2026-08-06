const Document = require('../models/Document');
const cloudinary = require('../config/cloudinary');

exports.getAllDocuments = async (req, res) => {
  try {
    const { type, category, department } = req.query;
    const query = { isActive: true };

    if (type) query.type = type;
    if (category) query.category = category;
    if (department) query.department = department;

    const documents = await Document.find(query)
      .populate('uploadedBy', 'firstName lastName employeeId')
      .populate('department', 'name code')
      .populate('employee', 'firstName lastName employeeId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents
    });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get documents'
    });
  }
};

exports.getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('uploadedBy', 'firstName lastName employeeId')
      .populate('department', 'name code')
      .populate('employee', 'firstName lastName employeeId');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.status(200).json({
      success: true,
      data: document
    });

  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get document'
    });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    const {
      title, description, type, category, department,
      employee, isPublic, accessRoles, tags, expiresAt
    } = req.body;

    let fileUrl = '';
    let fileData = {};

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'emps/documents',
        resource_type: 'auto'
      });
      fileUrl = result.secure_url;
      fileData = {
        name: req.file.originalname,
        url: result.secure_url,
        size: req.file.size,
        mimeType: req.file.mimetype
      };
    }

    const document = new Document({
      title,
      description,
      type,
      category,
      file: fileData,
      uploadedBy: req.user.id,
      department,
      employee,
      isPublic: isPublic || false,
      accessRoles: accessRoles || ['admin', 'hr'],
      tags,
      expiresAt,
      isActive: true
    });

    await document.save();

    const populatedDocument = await Document.findById(document._id)
      .populate('uploadedBy', 'firstName lastName employeeId')
      .populate('department', 'name code')
      .populate('employee', 'firstName lastName employeeId');

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: populatedDocument
    });

  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document'
    });
  }
};

exports.updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    if (document.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this document'
      });
    }

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'emps/documents',
        resource_type: 'auto'
      });

      document.previousVersions.push({
        name: document.file.name,
        url: document.file.url,
        size: document.file.size,
        uploadedAt: new Date()
      });

      document.file = {
        name: req.file.originalname,
        url: result.secure_url,
        size: req.file.size,
        mimeType: req.file.mimetype
      };
      document.version += 1;
    }

    Object.assign(document, updates);

    await document.save();

    const updatedDocument = await Document.findById(id)
      .populate('uploadedBy', 'firstName lastName employeeId')
      .populate('department', 'name code')
      .populate('employee', 'firstName lastName employeeId');

    res.status(200).json({
      success: true,
      message: 'Document updated successfully',
      data: updatedDocument
    });

  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update document'
    });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    if (document.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this document'
      });
    }

    if (document.file && document.file.url) {
      const publicId = document.file.url.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`emps/documents/${publicId}`);
    }

    await document.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document'
    });
  }
};

exports.getEmployeeDocuments = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const documents = await Document.find({
      employee: employeeId,
      isActive: true
    })
    .populate('uploadedBy', 'firstName lastName employeeId')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents
    });

  } catch (error) {
    console.error('Get employee documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get employee documents'
    });
  }
};

exports.getPolicyDocuments = async (req, res) => {
  try {
    const documents = await Document.find({
      category: 'policy',
      isActive: true
    })
    .populate('uploadedBy', 'firstName lastName employeeId')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents
    });

  } catch (error) {
    console.error('Get policy documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get policy documents'
    });
  }
};