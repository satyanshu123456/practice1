const express = require('express');
const router = express.Router();
const upload = require('../middlewares/multer.middleware');
const { uploadOnCloudinary } = require('../utils/cloudinary');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/v1/upload
 * @desc    Upload an image file to Cloudinary (Protected)
 * @access  Private
 */
router.post('/upload', protect, (req, res) => {
  // Catch Multer errors (e.g. file size exceeded or invalid mimetype)
  upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error',
      });
    }

    try {
      // Validate that file was provided
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please provide an image file under the field name "image"',
        });
      }

      // Upload local temporary file to Cloudinary & auto-remove local copy
      const cloudinaryResponse = await uploadOnCloudinary(req.file.path);

      if (!cloudinaryResponse) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image to cloud storage',
        });
      }

      // Return clean JSON response with secure_url and public_id
      return res.status(200).json({
        success: true,
        message: 'Image uploaded successfully to Cloudinary',
        data: {
          secure_url: cloudinaryResponse.secure_url,
          public_id: cloudinaryResponse.public_id,
          format: cloudinaryResponse.format,
          bytes: cloudinaryResponse.bytes,
          created_at: cloudinaryResponse.created_at,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Server error while processing image upload',
        error: error.message,
      });
    }
  });
});

module.exports = router;
