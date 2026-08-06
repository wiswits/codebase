// ============================================
// FILE UPLOAD MIDDLEWARE
// ============================================

const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ============================================
// STORAGE CONFIGURATION
// ============================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = 'uploads/';
        
        // Determine folder based on file type
        if (file.fieldname === 'omr_file') {
            uploadPath += 'omr/';
        } else if (file.fieldname === 'doubt_file') {
            uploadPath += 'doubts/';
        } else if (file.fieldname === 'profile_image') {
            uploadPath += 'profiles/';
        } else if (file.fieldname === 'question_image') {
            uploadPath += 'questions/';
        } else {
            uploadPath += 'others/';
        }
        
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `${uuidv4()}${ext}`;
        cb(null, filename);
    }
});

// ============================================
// FILE FILTER
// ============================================
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, PDF, and DOC files are allowed.'), false);
    }
};

// ============================================
// MULTER CONFIG
// ============================================
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: fileFilter
});

// ============================================
// SPECIFIC UPLOAD MIDDLEWARES
// ============================================
const uploadOMR = upload.single('omr_file');
const uploadDoubtFile = upload.single('doubt_file');
const uploadProfileImage = upload.single('profile_image');
const uploadQuestionImage = upload.single('question_image');

// ============================================
// MULTIPLE FILE UPLOAD
// ============================================
const uploadMultiple = upload.fields([
    { name: 'omr_file', maxCount: 1 },
    { name: 'doubt_file', maxCount: 1 },
    { name: 'profile_image', maxCount: 1 },
    { name: 'question_image', maxCount: 1 }
]);

// ============================================
// ERROR HANDLER FOR MULTER
// ============================================
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'FILE_TOO_LARGE',
                    message: 'File size exceeds 5MB limit.'
                }
            });
        }
        return res.status(400).json({
            success: false,
            error: {
                code: 'UPLOAD_ERROR',
                message: err.message
            }
        });
    }
    next(err);
};

module.exports = {
    upload,
    uploadOMR,
    uploadDoubtFile,
    uploadProfileImage,
    uploadQuestionImage,
    uploadMultiple,
    handleMulterError
};