const multer = require('multer');
const path = require('path');
const fs = require('fs');

const os = require('os');

const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10);

// Use the OS temp directory (critical for Vercel/Serverless)
const tmpDir = os.tmpdir();
// No need to mkdirSync for os.tmpdir() usually, but safe to keep check if we use a subfolder
const uploadDir = path.join(tmpDir, 'style-ai-uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Save temporarily
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter for specific image extensions
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
    fileFilter: fileFilter
});

module.exports = upload;
