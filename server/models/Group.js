const mongoose = require('mongoose');
const crypto = require('crypto');

const groupMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['Admin', 'Editor', 'Viewer'],
      default: 'Viewer',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const invitationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ['Admin', 'Editor', 'Viewer'],
      default: 'Viewer',
    },
    inviteToken: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Expired'],
      default: 'Pending',
    },
    expiresAt: {
      type: Date,
      default: () => new Date(+new Date() + 7 * 24 * 60 * 60 * 1000), // 7 days expiration
    },
  },
  { timestamps: true }
);

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [groupMemberSchema],
    invitations: [invitationSchema],
  },
  { timestamps: true }
);

// Method to generate secure unique invitation tokens
groupSchema.methods.generateInviteToken = function () {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = mongoose.model('Group', groupSchema);
