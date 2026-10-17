const mongoose = require('mongoose');
const Group = require('../models/Group');
const User = require('../models/User');
const Comment = require('../models/Comment');
const { sendGroupInviteEmail } = require('../config/emailService');

// @desc Create group (Creator is automatically default Admin)
// @route POST /api/groups
exports.createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Group name is required' });

    const newGroup = await Group.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      createdBy: req.user._id,
      members: [
        {
          user: req.user._id,
          role: 'Admin',
          joinedAt: new Date(),
        },
      ],
    });

    const populatedGroup = await Group.findById(newGroup._id).populate('members.user', 'name email avatarUrl');
    res.status(201).json(populatedGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get all groups the current user belongs to
// @route GET /api/groups
exports.getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({ 'members.user': req.user._id })
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email avatarUrl title')
      .sort({ updatedAt: -1 });

    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get single group details (Protected: Members only)
// @route GET /api/groups/:groupId
exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email avatarUrl skills title location');

    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isMember = group.members.some(
      (m) => m.user && (m.user._id ? m.user._id.toString() : m.user.toString()) === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this group' });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Public preview of invitation information
// @route GET /api/groups/invite-info
exports.getInviteInfo = async (req, res) => {
  try {
    const { token, groupId } = req.query;
    if (!token || !groupId) {
      return res.status(400).json({ valid: false, message: 'Invite token and Group ID are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ valid: false, message: 'Invalid Group ID format' });
    }

    const group = await Group.findById(groupId)
      .populate('createdBy', 'name email avatarUrl')
      .populate('invitations.invitedBy', 'name email');

    if (!group) {
      return res.status(404).json({ valid: false, message: 'Workspace / Group not found' });
    }

    const invite = group.invitations.find(
      (inv) => inv.inviteToken === token && new Date() < new Date(inv.expiresAt)
    );

    if (!invite) {
      return res.status(400).json({
        valid: false,
        message: 'This invitation link is invalid or has expired. Please request a new invite from the group admin.',
      });
    }

    let inviterName = group.createdBy?.name || 'Workspace Admin';
    if (invite.invitedBy?.name) {
      inviterName = invite.invitedBy.name;
    }

    return res.status(200).json({
      valid: true,
      groupId: group._id,
      groupName: group.name,
      description: group.description,
      role: invite.role || 'Viewer',
      inviterName,
      targetEmail: invite.email || null,
      isShareable: !invite.email,
      isAccepted: invite.status === 'Accepted',
      expiresAt: invite.expiresAt,
      memberCount: group.members.length,
    });
  } catch (error) {
    res.status(500).json({ valid: false, message: error.message });
  }
};

// @desc Admin invites user by email or generates shareable join link
// @route POST /api/groups/:groupId/invite
exports.inviteUser = async (req, res) => {
  try {
    const { email, role = 'Viewer' } = req.body;
    const group = req.group;

    const cleanEmail = email ? email.trim().toLowerCase() : '';

    // If a specific email is provided, check if that user is already a member
    if (cleanEmail) {
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        const isAlreadyMember = group.members.some(
          (m) => m.user && m.user.toString() === existingUser._id.toString()
        );
        if (isAlreadyMember) {
          return res.status(400).json({ message: `${cleanEmail} is already a member of this workspace` });
        }
      }
    }

    const token = group.generateInviteToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    group.invitations.push({
      email: cleanEmail,
      role,
      inviteToken: token,
      invitedBy: req.user._id,
      status: 'Pending',
      expiresAt,
    });

    await group.save();

    const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/join-group?token=${token}&groupId=${group._id}`;

    // If an email was provided, asynchronously send invitation email
    if (cleanEmail) {
      sendGroupInviteEmail(cleanEmail, {
        groupName: group.name,
        inviterName: req.user.name,
        role,
        inviteLink,
      }).catch((emailErr) => {
        console.error('Failed to send group invite email:', emailErr.message);
      });
    }

    res.status(200).json({
      message: cleanEmail
        ? `Invitation generated and sent to ${cleanEmail}`
        : 'Shareable workspace join link created successfully',
      inviteLink,
      token,
      email: cleanEmail || null,
      role,
      expiresAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Accept invitation link / Join group
// @route POST /api/groups/join
exports.acceptInvitation = async (req, res) => {
  try {
    const { token, groupId } = req.body;
    if (!token || !groupId) {
      return res.status(400).json({ message: 'Invitation token and Group ID are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: 'Invalid Group ID format' });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Workspace not found' });

    // Check if user is already a member (e.g. re-clicked link or duplicate request)
    const isAlreadyMember = group.members.some(
      (m) => m.user && m.user.toString() === req.user._id.toString()
    );
    if (isAlreadyMember) {
      return res.status(200).json({
        message: 'You are already a member of this workspace',
        groupId: group._id,
        alreadyMember: true,
      });
    }

    // Look for matching invitation
    const invite = group.invitations.find(
      (inv) => inv.inviteToken === token && new Date() < new Date(inv.expiresAt)
    );

    if (!invite) {
      return res.status(400).json({
        message: 'Invalid or expired invitation link. Please request a new invite from the workspace admin.',
      });
    }

    // If it was a targeted single-use email invite that was already accepted:
    if (invite.email && invite.status === 'Accepted') {
      return res.status(400).json({ message: 'This single-use invitation has already been accepted.' });
    }

    // Add user as member
    const assignedRole = invite.role || 'Viewer';
    group.members.push({
      user: req.user._id,
      role: assignedRole,
      joinedAt: new Date(),
    });

    // If targeted email invite, mark as accepted
    if (invite.email) {
      invite.status = 'Accepted';
      invite.acceptedBy = req.user._id;
    }

    await group.save();

    // Populate user details for real-time socket broadcast
    const userDoc = await User.findById(req.user._id).select('name email avatarUrl title');

    // Real-time broadcast to group room
    const io = req.app.get('socketio');
    if (io) {
      io.to(`group_${group._id}`).emit('member_joined', {
        groupId: group._id,
        member: {
          user: userDoc || { _id: req.user._id, name: req.user.name, email: req.user.email },
          role: assignedRole,
          joinedAt: new Date(),
        },
      });
    }

    res.status(200).json({
      message: `Successfully joined ${group.name}!`,
      groupId: group._id,
      role: assignedRole,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update member role (Admin only)
// @route PUT /api/groups/:groupId/members/:userId
exports.updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body;
    const { userId } = req.params;
    const group = req.group;

    if (!['Admin', 'Editor', 'Viewer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    const member = group.members.find((m) => m.user.toString() === userId);
    if (!member) return res.status(404).json({ message: 'Member not found in group' });

    member.role = role;
    await group.save();

    res.json({ message: 'Member role updated successfully', member });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get group discussion comments (Members only)
// @route GET /api/groups/:groupId/comments
exports.getGroupComments = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isMember = group.members.some(
      (m) => m.user && (m.user._id ? m.user._id.toString() : m.user.toString()) === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this group' });
    }

    const comments = await Comment.find({ group: groupId })
      .populate('author', 'name avatarUrl')
      .sort({ createdAt: 1 })
      .limit(100);

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Add comment to group discussion (Members only)
// @route POST /api/groups/:groupId/comments
exports.addGroupComment = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isMember = group.members.some(
      (m) => m.user && (m.user._id ? m.user._id.toString() : m.user.toString()) === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this group' });
    }

    const comment = await Comment.create({
      group: groupId,
      author: req.user._id,
      message: message.trim(),
    });

    await comment.populate('author', 'name avatarUrl');

    const io = req.app.get('socketio');
    if (io) {
      io.to(`group_${groupId}`).emit('group_message_received', comment);
    }

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
