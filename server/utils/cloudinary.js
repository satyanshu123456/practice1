const cloudinary = require('cloudinary').v2;
const fs = require('fs');
require('dotenv').config();

// Configure Cloudinary SDK with environment credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload a local file from disk to Cloudinary and clean up the temporary file.
 * @param {string} localFilePath - Path to temporary file in ./public/temp
 * @returns {Promise<Object|null>} - Cloudinary upload response or null
 */
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'image',
      folder: 'uploads',
    });

    // File uploaded successfully, remove the local temporary file
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return response;
  } catch (error) {
    // Remove the locally saved temporary file as the upload operation failed
    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (unlinkErr) {
        console.error('Failed to unlink temporary file on error:', unlinkErr.message);
      }
    }
    const errorDetails = error?.message || error?.error?.message || error;
    console.error('Cloudinary upload failed:', errorDetails);
    return null;
  }
};

module.exports = {
  cloudinary,
  uploadOnCloudinary,
};
