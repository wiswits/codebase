const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const path = require('path');

class FileUploadService {
  constructor() {
    this.storage = multer.diskStorage({
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      }
    });

    this.upload = multer({
      storage: this.storage,
      limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type'), false);
        }
      }
    });
  }

  getUploadMiddleware() {
    return this.upload;
  }

  async uploadToCloudinary(file, folder = 'emps') {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: folder,
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true
      });

      return {
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        resource_type: result.resource_type,
        size: result.bytes,
        format: result.format
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return { success: false, error: error.message };
    }
  }

  async uploadMultipleToCloudinary(files, folder = 'emps') {
    const uploadPromises = files.map(file => this.uploadToCloudinary(file, folder));
    const results = await Promise.all(uploadPromises);
    return results;
  }

  async deleteFromCloudinary(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return { success: true, result };
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteMultipleFromCloudinary(publicIds) {
    const deletePromises = publicIds.map(id => this.deleteFromCloudinary(id));
    const results = await Promise.all(deletePromises);
    return results;
  }

  getFileType(mimetype) {
    const types = {
      'image/jpeg': 'image',
      'image/png': 'image',
      'image/gif': 'image',
      'application/pdf': 'pdf',
      'application/msword': 'document',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
      'application/vnd.ms-excel': 'spreadsheet',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'spreadsheet'
    };
    return types[mimetype] || 'other';
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = new FileUploadService();