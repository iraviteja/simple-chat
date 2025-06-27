const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");

const socketHandler = (io) => {
  // Keep track of online users
  const onlineUsers = new Set();

  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", async (socket) => {
    console.log(`User ${socket.user.name} connected`);

    // Update user online status
    await User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      lastSeen: new Date(),
    });

    // Add user to online users set
    onlineUsers.add(socket.userId);

    // Join user's personal room
    socket.join(socket.userId);

    // Join all user's groups
    const user = await User.findById(socket.userId).populate("joinedGroups");
    user.joinedGroups.forEach((group) => {
      socket.join(`group-${group._id}`);
    });

    // Send current online users to the newly connected user
    socket.emit("initial-online-users", Array.from(onlineUsers));

    // Notify others that user is online
    socket.broadcast.emit("user-online", socket.userId);

    // Handle sending messages
    socket.on("send-message", async (data) => {
      try {
        const { receiver, group, content, type = "text", fileData } = data;

        const messageData = {
          sender: socket.userId,
          type,
          content: content || "",
          delivered: true,
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
          .populate("sender", "name")
          .populate("receiver", "name")
          .populate("group", "name");

        // Send to receiver or group
        if (receiver) {
          io.to(receiver).emit("receive-message", populatedMessage);
          io.to(socket.userId).emit("message-sent", populatedMessage);
        } else if (group) {
          io.to(`group-${group}`).emit("receive-message", populatedMessage);
        }
      } catch (error) {
        socket.emit("message-error", error.message);
      }
    });

    // Handle typing indicators
    socket.on("typing", ({ receiver, group }) => {
      if (receiver) {
        socket.to(receiver).emit("user-typing", { user: socket.userId });
      } else if (group) {
        socket.to(`group-${group}`).emit("user-typing", {
          user: socket.userId,
          group,
        });
      }
    });

    socket.on("stop-typing", ({ receiver, group }) => {
      if (receiver) {
        socket.to(receiver).emit("user-stop-typing", { user: socket.userId });
      } else if (group) {
        socket.to(`group-${group}`).emit("user-stop-typing", {
          user: socket.userId,
          group,
        });
      }
    });

    // Handle message read
    socket.on("mark-read", async ({ messageId }) => {
      await Message.findByIdAndUpdate(messageId, { read: true });
      socket.emit("message-read", messageId);
    });

    // Handle reactions
    socket.on("message-reaction", async ({ messageId, emoji }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        // Remove user from all existing reactions
        message.reactions.forEach((reaction) => {
          const userIndex = reaction.users.indexOf(socket.userId);
          if (userIndex > -1) {
            reaction.users.splice(userIndex, 1);
          }
        });

        // Clean up reactions with no users
        message.reactions = message.reactions.filter((r) => r.users.length > 0);

        // Add new reaction
        const existingReaction = message.reactions.find(
          (r) => r.emoji === emoji
        );
        if (existingReaction) {
          existingReaction.users.push(socket.userId);
        } else {
          message.reactions.push({
            emoji,
            users: [socket.userId],
          });
        }

        await message.save();

        const updatedMessage = await Message.findById(messageId)
          .populate("sender", "name")
          .populate("receiver", "name")
          .populate("group", "name")
          .populate("reactions.users", "name");

        if (message.receiver) {
          io.to(message.receiver.toString()).emit(
            "message-reaction-updated",
            updatedMessage
          );
          io.to(socket.userId).emit("message-reaction-updated", updatedMessage);
        } else if (message.group) {
          io.to(`group-${message.group}`).emit(
            "message-reaction-updated",
            updatedMessage
          );
        }
      } catch (error) {
        console.error("Error handling reaction:", error);
      }
    });

    // Handle joining new group
    socket.on("join-group", (groupId) => {
      socket.join(`group-${groupId}`);
    });

    // Video call events
    socket.on("call-user", ({ to, offer }) => {
      io.to(to).emit("incoming-call", {
        from: socket.userId,
        offer,
      });
    });

    socket.on("call-answer", ({ to, answer }) => {
      io.to(to).emit("call-answered", {
        from: socket.userId,
        answer,
      });
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
      io.to(to).emit("ice-candidate", {
        from: socket.userId,
        candidate,
      });
    });

    socket.on("end-call", ({ to }) => {
      io.to(to).emit("call-ended", {
        from: socket.userId,
      });
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      console.log(`User ${socket.user.name} disconnected`);

      // Remove user from online users set
      onlineUsers.delete(socket.userId);

      // Update user offline status
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date(),
      });

      // Notify others that user is offline
      socket.broadcast.emit("user-offline", socket.userId);
    });
  });
};

module.exports = socketHandler;
