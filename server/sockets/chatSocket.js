const Comment = require('../models/Comment');
const Group = require('../models/Group');

module.exports = function registerChatHandlers(io, socket) {
  socket.on('send_group_message', async ({ groupId, authorId, message }) => {
    try {
      if (!groupId || !authorId || !message || !message.trim()) return;

      const group = await Group.findById(groupId);
      if (!group) return socket.emit('chat_error', { message: 'Group not found' });

      const isMember = group.members.some(
        (m) => m.user && m.user.toString() === authorId.toString()
      );
      if (!isMember) {
        return socket.emit('chat_error', { message: 'You are not a member of this group' });
      }

      const newComment = await Comment.create({
        group: groupId,
        author: authorId,
        message: message.trim(),
      });

      await newComment.populate('author', 'name avatarUrl');

      // Broadcast to everyone in group room
      io.to(`group_${groupId}`).emit('group_message_received', newComment);
    } catch (err) {
      socket.emit('chat_error', { message: err.message });
    }
  });
};

