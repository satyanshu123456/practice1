const Document = require('../models/Document');
const Group = require('../models/Group');
const Notification = require('../models/Notification');
const fs = require('fs');
const path = require('path');

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

    const document = await Document.create({
      title,
      originalName: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
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

// @desc Get all documents for a group
// @route GET /api/documents/group/:groupId
exports.getGroupDocuments = async (req, res) => {
  try {
    const { groupId } = req.params;
    const documents = await Document.find({ group: groupId })
      .populate('uploadedBy', 'name email avatarUrl')
      .sort({ createdAt: -1 });

    res.json(documents);
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

    // Delete local file from disk
    const filePath = path.join(__dirname, '..', document.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

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
