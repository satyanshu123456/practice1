const Document = require('../models/Document');
const Group = require('../models/Group');
const Notification = require('../models/Notification');
const fs = require('fs');
const path = require('path');
const { processFileUpload, deleteUploadedFile } = require('../config/cloudinary');

// @desc Upload document & notify all other group members instantly
// @route POST /api/documents/upload
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded or invalid file format' });
    }

    const { title, groupId, deleteAllowedRoles } = req.body;
    if (!title || !groupId) {
      return res.status(400).json({ message: 'Title and groupId are required' });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isMember = group.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    let parsedRoles = ['Admin'];
    if (deleteAllowedRoles) {
      try {
        parsedRoles = Array.isArray(deleteAllowedRoles)
          ? deleteAllowedRoles
          : JSON.parse(deleteAllowedRoles);
      } catch (e) {
        parsedRoles = ['Admin'];
      }
    }

    // Upload to Cloudinary (or fallback to local disk)
    const uploadResult = await processFileUpload(req.file, {
      folder: 'mern_collab/documents',
      resourceType: 'auto',
    });

    const document = await Document.create({
      title,
      originalName: req.file.originalname,
      fileUrl: uploadResult.url,
      cloudinaryPublicId: uploadResult.publicId,
      cloudinaryResourceType: uploadResult.resourceType,
      localFilePath: uploadResult.localFilePath,
      storageProvider: uploadResult.provider,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      group: groupId,
      uploadedBy: req.user._id,
      deleteAllowedRoles: parsedRoles,
    });

    await document.populate('uploadedBy', 'name email avatarUrl');

    // Notify all other group members
    const otherMembers = group.members.filter(
      (m) => m.user.toString() !== req.user._id.toString()
    );

    if (otherMembers.length > 0) {
      const notificationsToCreate = otherMembers.map((m) => ({
        recipient: m.user,
        sender: req.user._id,
        group: groupId,
        document: document._id,
        type: 'DOCUMENT_UPLOADED',
        message: `${req.user.name} uploaded a new document: "${document.title}" in ${group.name}`,
      }));

      const createdNotifications = await Notification.insertMany(notificationsToCreate);

      // Instant Socket.io broadcast to individual users and group room
      const io = req.app.get('socketio');
      if (io) {
        createdNotifications.forEach((notif) => {
          io.to(`user_${notif.recipient.toString()}`).emit('new_notification', {
            ...notif.toObject(),
            sender: { _id: req.user._id, name: req.user.name, avatarUrl: req.user.avatarUrl },
            group: { _id: group._id, name: group.name },
            document: { _id: document._id, title: document.title },
          });
        });

        io.to(`group_${groupId}`).emit('document_added', document);
      }
    } else {
      // Still emit to group room
      const io = req.app.get('socketio');
      if (io) {
        io.to(`group_${groupId}`).emit('document_added', document);
      }
    }

    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get all documents for a group (Protected: Members only)
// @route GET /api/documents/group/:groupId
exports.getGroupDocuments = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isMember = group.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this group' });
    }

    const documents = await Document.find({ group: groupId })
      .populate('uploadedBy', 'name email avatarUrl')
      .sort({ createdAt: -1 });

    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Securely download or view document (Members only)
// @route GET /api/documents/:id/download
exports.downloadDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });

    const group = await Group.findById(document.group);
    if (!group) return res.status(404).json({ message: 'Associated group not found' });

    const isMember = group.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this group' });
    }

    // 1. If local file exists, stream directly (avoids Cloudinary PDF 401 issues)
    if (document.localFilePath && fs.existsSync(document.localFilePath)) {
      return res.download(document.localFilePath, document.originalName);
    }

    // 2. Legacy /uploads path
    if (document.fileUrl && document.fileUrl.startsWith('/uploads/')) {
      const legacyPath = path.join(__dirname, '..', document.fileUrl);
      if (fs.existsSync(legacyPath)) {
        return res.download(legacyPath, document.originalName);
      }
    }

    // 3. Fallback to cloud URL
    return res.redirect(document.fileUrl);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete document (Admin or roles with permission)
// @route DELETE /api/documents/:id
exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });

    const group = await Group.findById(document.group);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const member = group.members.find((m) => m.user.toString() === req.user._id.toString());
    if (!member) return res.status(403).json({ message: 'Not authorized for this group' });

    const isUploader = document.uploadedBy.toString() === req.user._id.toString();
    const hasPermission =
      member.role === 'Admin' ||
      document.deleteAllowedRoles.includes(member.role) ||
      isUploader;

    if (!hasPermission) {
      return res.status(403).json({
        message: 'Forbidden: You do not have permission to delete this document',
      });
    }

    // Delete file from Cloudinary and local disk
    await deleteUploadedFile(
      document.fileUrl,
      document.cloudinaryPublicId,
      document.cloudinaryResourceType || 'raw',
      document.localFilePath
    );

    await Document.findByIdAndDelete(document._id);

    const io = req.app.get('socketio');
    if (io) {
      io.to(`group_${document.group}`).emit('document_deleted', document._id);
    }

    res.json({ message: 'Document deleted successfully', documentId: document._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
