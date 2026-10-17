const express = require('express');
const router = express.Router();
const {
  createGroup,
  getMyGroups,
  getGroupById,
  inviteUser,
  acceptInvitation,
  updateMemberRole,
  getGroupComments,
  addGroupComment,
  getInviteInfo,
} = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');
const { checkGroupPermission } = require('../middleware/rbacMiddleware');

// Public route to inspect invitation preview (no auth required)
router.get('/invite-info', getInviteInfo);

// Protected routes below
router.use(protect);

router.route('/').post(createGroup).get(getMyGroups);
router.post('/join', acceptInvitation);
router.get('/:groupId', getGroupById);

// Discussion / Comments
router.route('/:groupId/comments').get(getGroupComments).post(addGroupComment);

// Admin-only operations
router.post('/:groupId/invite', checkGroupPermission(['Admin']), inviteUser);
router.put('/:groupId/members/:userId', checkGroupPermission(['Admin']), updateMemberRole);

module.exports = router;
