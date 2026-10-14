const Group = require('../models/Group');
const User = require('../models/User');

// @desc Create group (Creator is automatically default Admin)
// @route POST /api/groups
exports.createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Group name is required' });

    const newGroup = await Group.create({
      name,
      description: description || '',
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

// @desc Get single group details
// @route GET /api/groups/:groupId
exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email avatarUrl skills title location');

    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Admin invites user by email
// @route POST /api/groups/:groupId/invite
exports.inviteUser = async (req, res) => {
  try {
    const { email, role = 'Viewer' } = req.body;
    const group = req.group;

    if (!email) return res.status(400).json({ message: 'Email address is required for sending invitations' });

    // Check if user is already a member
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const isAlreadyMember = group.members.some(
        (m) => m.user.toString() === existingUser._id.toString()
      );
      if (isAlreadyMember) {
        return res.status(400).json({ message: 'User is already a member of this group' });
      }
    }

    const token = group.generateInviteToken();
    group.invitations.push({
      email: email.toLowerCase(),
      role,
      inviteToken: token,
      status: 'Pending',
    });

    await group.save();

    const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/join-group?token=${token}&groupId=${group._id}`;

    res.status(200).json({
      message: `Invitation generated successfully for ${email}`,
      inviteLink,
      token,
      email,
      role,
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

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const invite = group.invitations.find(
      (inv) => inv.inviteToken === token && inv.status === 'Pending' && new Date() < new Date(inv.expiresAt)
    );

    if (!invite) {
      return res.status(400).json({ message: 'Invalid or expired invitation token' });
    }

    // Verify invited email matches current user email
    if (invite.email !== req.user.email.toLowerCase()) {
      return res.status(403).json({
        message: `This invitation was issued for ${invite.email}. Please login with that email account.`,
      });
    }

    // Add user as member if not already joined
    const isMember = group.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) {
      group.members.push({
        user: req.user._id,
        role: invite.role,
        joinedAt: new Date(),
      });
    }

    invite.status = 'Accepted';
    await group.save();

    res.status(200).json({ message: 'Successfully joined group', groupId: group._id });
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
