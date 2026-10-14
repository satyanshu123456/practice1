const express = require('express');
const router = express.Router();
const {
  createGroup,
  getMyGroups,
  getGroupById,
  inviteUser,
  acceptInvitation,
  updateMemberRole,
} = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');
const { checkGroupPermission } = require('../middleware/rbacMiddleware');

router.use(protect);

router.route('/').post(createGroup).get(getMyGroups);
router.post('/join', acceptInvitation);
router.get('/:groupId', getGroupById);

// Admin-only operations
router.post('/:groupId/invite', checkGroupPermission(['Admin']), inviteUser);
router.put('/:groupId/members/:userId', checkGroupPermission(['Admin']), updateMemberRole);

module.exports = router;
