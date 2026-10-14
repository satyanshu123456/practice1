const registerChatHandlers = require('./chatSocket');

module.exports = function initializeSockets(io) {
  io.on('connection', (socket) => {
    // User registers their personal notification channel
    socket.on('join_user_channel', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
      }
    });

    // User joins a group room for instant document updates and chat
    socket.on('join_group_room', (groupId) => {
      if (groupId) {
        socket.join(`group_${groupId}`);
      }
    });

    socket.on('leave_group_room', (groupId) => {
      if (groupId) {
        socket.leave(`group_${groupId}`);
      }
    });

    // Register optional group chat handlers
    registerChatHandlers(io, socket);

    socket.on('disconnect', () => {});
  });
};
