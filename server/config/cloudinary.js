const { Readable } = require('stream');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Checks if Cloudinary credentials are validly provided in the environment
 * @returns {boolean}
 */
const isCloudinaryConfigured = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  return Boolean(
    CLOUDINARY_CLOUD_NAME &&
    CLOUDINARY_API_KEY &&
    CLOUDINARY_API_SECRET &&
    !CLOUDINARY_CLOUD_NAME.includes('your_') &&
    !CLOUDINARY_API_KEY.includes('your_')
  );
};

/**
 * Upload a memory buffer stream directly to Cloudinary
 * @param {Buffer} buffer - Multer file buffer
 * @param {Object} options - Cloudinary upload options (folder, resource_type, etc.)
 * @returns {Promise<Object>}
 */
const uploadStreamToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: options.resource_type || 'auto',
        folder: options.folder || 'mern_collab',
        ...options,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
};

/**
 * Safely delete an asset from Cloudinary
 * @param {string} publicId - Cloudinary public id
 * @param {string} [resourceType='image'] - 'image' | 'raw' | 'video'
 * @returns {Promise<Object|null>}
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  if (!publicId) return null;
  try {
    const res = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return res;
  } catch (err) {
    console.error(`[Cloudinary] Failed to delete asset ${publicId}:`, err.message);
    return null;
  }
};

/**
 * Unified file uploader:
 * Uses Cloudinary if credentials are configured; otherwise seamlessly falls back to local disk storage.
 * @param {Object} file - Multer file object with buffer
 * @param {Object} options - { folder: string, resourceType: 'auto' | 'image' | 'raw' }
 * @returns {Promise<{ url: string, publicId: string|null, resourceType: string|null, provider: 'cloudinary'|'local' }>}
 */
const processFileUpload = async (file, options = {}) => {
  const { folder = 'mern_collab', resourceType = 'auto' } = options;

  // Ensure local uploads directory exists
  const uploadDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const ext = path.extname(file.originalname);
  const localFileName = uniqueSuffix + ext;
  const localFilePath = path.join(uploadDir, localFileName);

  // Always write local file backup (enables resilient local download/fallback)
  fs.writeFileSync(localFilePath, file.buffer);

  if (isCloudinaryConfigured()) {
    try {
      const sanitizedBase = path
        .parse(file.originalname)
        .name.replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 50);
      const publicId = `${Date.now()}-${sanitizedBase}`;

      const result = await uploadStreamToCloudinary(file.buffer, {
        folder,
        resource_type: resourceType,
        public_id: publicId,
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type || resourceType,
        provider: 'cloudinary',
        localFilePath,
      };
    } catch (cloudErr) {
      console.warn('[Cloudinary] Upload failed, falling back to local file storage:', cloudErr.message);
      return {
        url: `/uploads/${localFileName}`,
        publicId: null,
        resourceType: null,
        provider: 'local',
        localFilePath,
      };
    }
  }

  return {
    url: `/uploads/${localFileName}`,
    publicId: null,
    resourceType: null,
    provider: 'local',
    localFilePath,
  };
};

/**
 * Safely delete an uploaded file either from Cloudinary or from local disk
 * @param {string} url - File URL
 * @param {string|null} publicId - Cloudinary public id
 * @param {string} [resourceType='raw'] - Cloudinary resource type
 * @param {string|null} [localFilePath=null] - Local file path on disk
 */
const deleteUploadedFile = async (url, publicId, resourceType = 'raw', localFilePath = null) => {
  if (publicId) {
    await deleteFromCloudinary(publicId, resourceType);
  }

  if (localFilePath && fs.existsSync(localFilePath)) {
    try {
      fs.unlinkSync(localFilePath);
    } catch (err) {
      console.error(`[LocalStorage] Failed to delete local file ${localFilePath}:`, err.message);
    }
  }

  if (url && url.startsWith('/uploads/')) {
    const fallbackPath = path.join(__dirname, '..', url);
    if (fs.existsSync(fallbackPath)) {
      try {
        fs.unlinkSync(fallbackPath);
      } catch (err) {
        console.error(`[LocalStorage] Failed to delete file ${fallbackPath}:`, err.message);
      }
    }
  }
};

/**
 * Upload a local file from disk to Cloudinary and clean up the temporary file.
 * @param {string} localFilePath - Path to temporary file
 * @returns {Promise<Object|null>} - Cloudinary upload response or null
 */
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto',
      folder: 'uploads',
    });
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return response;
  } catch (error) {
    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (unlinkErr) {
        console.error('Failed to unlink temporary file on error:', unlinkErr.message);
      }
    }
    console.error('Cloudinary upload failed:', error?.message || error);
    return null;
  }
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadStreamToCloudinary,
  deleteFromCloudinary,
  processFileUpload,
  deleteUploadedFile,
  uploadOnCloudinary,
};
