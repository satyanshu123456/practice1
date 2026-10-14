const Comment = require('../models/Comment');

module.exports = function registerChatHandlers(io, socket) {
  socket.on('send_group_message', async ({ groupId, authorId, message }) => {
    try {
      if (!groupId || !authorId || !message) return;

      const newComment = await Comment.create({
        group: groupId,
        author: authorId,
        message,
      });

      await newComment.populate('author', 'name avatarUrl');

      // Broadcast to everyone in group room
      io.to(`group_${groupId}`).emit('group_message_received', newComment);
    } catch (err) {
      socket.emit('chat_error', { message: err.message });
    }
  });
};
