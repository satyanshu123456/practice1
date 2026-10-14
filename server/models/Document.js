const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true, // Local path: "/uploads/..." or Cloud URL
    },
    fileType: {
      type: String,
      enum: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      required: true,
    },
    fileSize: {
      type: Number,
      required: true, // In bytes
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Permissions: Which roles are allowed to delete this document
    deleteAllowedRoles: {
      type: [String],
      enum: ['Admin', 'Editor', 'Viewer'],
      default: ['Admin'],
    },
    // Optional / Scalability: Storage Provider (Local or Google Drive placeholder)
    storageProvider: {
      type: String,
      enum: ['local', 'google-drive', 's3'],
      default: 'local',
    },
    externalDriveFileId: {
      type: String,
      default: null,
    },
    // Optional / Scalability: Document Versioning
    version: {
      type: Number,
      default: 1,
    },
    parentDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);
