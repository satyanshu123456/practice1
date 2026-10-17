const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure temporary upload directory exists reliably
const tempDir = path.join(__dirname, '../public/temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// 1. Configure Multer Disk Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitizedOriginal = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedOriginal}`);
  },
});

// 2. Strict Image Filter (jpg, jpeg, png, webp)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error('Invalid file format. Only JPG, JPEG, PNG, and WEBP images are allowed.'),
      false
    );
  }
};

// 3. Multer Instance with 5MB Limit
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter,
});

module.exports = upload;
