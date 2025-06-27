const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

const socketHandler = (io) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User ${socket.user.username} connected`);

    // Update user online status
    await User.findByIdAndUpdate(socket.userId, { 
      isOnline: true,
      lastSeen: new Date()
    });

    // Join user's personal room
    socket.join(socket.userId);

    // Join all user's groups
    const user = await User.findById(socket.userId).populate('joinedGroups');
    user.joinedGroups.forEach(group => {
      socket.join(`group-${group._id}`);
    });

    // Notify others that user is online
    socket.broadcast.emit('user-online', socket.userId);

    // Handle sending messages
    socket.on('send-message', async (data) => {
      try {
        const { receiver, group, content, type = 'text', fileData } = data;

        const messageData = {
          sender: socket.userId,
          type,
          content: content || '',
          delivered: true
        };

        if (receiver) {
          messageData.receiver = receiver;
        } else if (group) {
          messageData.group = group;
        }

        if (fileData) {
          messageData.fileUrl = fileData.fileUrl;
          messageData.fileName = fileData.fileName;
          messageData.fileSize = fileData.fileSize;
        }

        const message = await Message.create(messageData);
        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'username profileImage')
          .populate('receiver', 'username profileImage')
          .populate('group', 'name');

        // Send to receiver or group
        if (receiver) {
          io.to(receiver).emit('receive-message', populatedMessage);
          io.to(socket.userId).emit('message-sent', populatedMessage);
        } else if (group) {
          io.to(`group-${group}`).emit('receive-message', populatedMessage);
        }
      } catch (error) {
        socket.emit('message-error', error.message);
      }
    });

    // Handle typing indicators
    socket.on('typing', ({ receiver, group }) => {
      if (receiver) {
        socket.to(receiver).emit('user-typing', { user: socket.userId });
      } else if (group) {
        socket.to(`group-${group}`).emit('user-typing', { 
          user: socket.userId, 
          group 
        });
      }
    });

    socket.on('stop-typing', ({ receiver, group }) => {
      if (receiver) {
        socket.to(receiver).emit('user-stop-typing', { user: socket.userId });
      } else if (group) {
        socket.to(`group-${group}`).emit('user-stop-typing', { 
          user: socket.userId, 
          group 
        });
      }
    });

    // Handle message read
    socket.on('mark-read', async ({ messageId }) => {
      await Message.findByIdAndUpdate(messageId, { read: true });
      socket.emit('message-read', messageId);
    });

    // Handle joining new group
    socket.on('join-group', (groupId) => {
      socket.join(`group-${groupId}`);
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User ${socket.user.username} disconnected`);
      
      // Update user offline status
      await User.findByIdAndUpdate(socket.userId, { 
        isOnline: false,
        lastSeen: new Date()
      });

      // Notify others that user is offline
      socket.broadcast.emit('user-offline', socket.userId);
    });
  });
};

module.exports = socketHandler;