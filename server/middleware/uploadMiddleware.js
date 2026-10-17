const multer = require('multer');

// Store files in memory buffer so they can be streamed to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error('Invalid file format. Only PDF, JPEG, PNG, WEBP, and DOC/DOCX files are allowed.'),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
  fileFilter: fileFilter,
});

module.exports = upload;

