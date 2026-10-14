const Group = require('../models/Group');

const checkGroupPermission = (allowedRoles = ['Admin']) => {
  return async (req, res, next) => {
    try {
      const groupId = req.params.groupId || req.body.groupId;
      if (!groupId) {
        return res.status(400).json({ message: 'Group ID is required for access verification' });
      }

      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }

      const member = group.members.find(
        (m) => m.user.toString() === req.user._id.toString()
      );

      if (!member) {
        return res.status(403).json({ message: 'Access denied: You are not a member of this group' });
      }

      if (!allowedRoles.includes(member.role)) {
        return res.status(403).json({
          message: `Forbidden: Action requires one of the following roles: [${allowedRoles.join(', ')}]`,
        });
      }

      req.group = group;
      req.memberRole = member.role;
      next();
    } catch (error) {
      return res.status(500).json({ message: 'Error verifying permissions', error: error.message });
    }
  };
};

module.exports = { checkGroupPermission };
