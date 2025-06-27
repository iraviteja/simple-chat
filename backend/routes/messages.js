const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Message = require("../models/Message");
const { protect } = require("../middleware/auth");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|mp4|mov|avi/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

// Send message
router.post(
  "/",
  protect,
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        console.error("Multer error:", err);
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      console.log("Request body:", req.body);
      console.log("Request file:", req.file);
      const { receiver, group, content, type = "text" } = req.body;

      const messageData = {
        sender: req.user._id,
        type,
        content: content || "",
      };

      if (receiver) {
        messageData.receiver = receiver;
      } else if (group) {
        messageData.group = group;
      } else {
        return res.status(400).json({ message: "Receiver or group required" });
      }

      if (req.file) {
        messageData.fileUrl = `/uploads/${req.file.filename}`;
        messageData.fileName = req.file.originalname;
        messageData.fileSize = req.file.size;
      }

      const message = await Message.create(messageData);
      const populatedMessage = await Message.findById(message._id)
        .populate("sender", "name")
        .populate("receiver", "name")
        .populate("group", "name");

      // Emit message through Socket.IO
      const io = req.app.get("io");
      if (receiver) {
        // Send to specific user
        io.to(receiver).emit("receive-message", populatedMessage);
        io.to(req.user._id.toString()).emit("message-sent", populatedMessage);
      } else if (group) {
        // Send to group
        io.to(`group-${group}`).emit("receive-message", populatedMessage);
      }

      res.status(201).json(populatedMessage);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: error.message, stack: error.stack });
    }
  }
);

// Get chat history
router.get("/chat/:userId", protect, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id },
      ],
    })
      .populate("sender", "name")
      .populate("receiver", "name")
      .populate("reactions.users", "name")
      .sort("createdAt");

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get group messages
router.get("/group/:groupId", protect, async (req, res) => {
  try {
    const messages = await Message.find({ group: req.params.groupId })
      .populate("sender", "name")
      .populate("reactions.users", "name")
      .sort("createdAt");

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get recent conversations
router.get("/conversations", protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get latest message from each conversation
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$sender", userId] }, "$receiver", "$sender"],
          },
          lastMessage: { $first: "$$ROOT" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          user: {
            _id: 1,
            name: 1,
            isOnline: 1,
          },
          lastMessage: 1,
        },
      },
    ]);

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Edit message
router.put("/:messageId", protect, async (req, res) => {
  try {
    const { content } = req.body;
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only edit your own messages" });
    }

    // Check if message is deleted
    if (message.isDeleted) {
      return res.status(400).json({ message: "Cannot edit deleted message" });
    }

    // Update message
    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    const updatedMessage = await Message.findById(message._id)
      .populate("sender", "name")
      .populate("receiver", "name")
      .populate("group", "name");

    // Emit update through Socket.IO
    const io = req.app.get("io");
    if (message.receiver) {
      io.to(message.receiver.toString()).emit("message-edited", updatedMessage);
      io.to(req.user._id.toString()).emit("message-edited", updatedMessage);
    } else if (message.group) {
      io.to(`group-${message.group}`).emit("message-edited", updatedMessage);
    }

    res.json(updatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete message
router.delete("/:messageId", protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own messages" });
    }

    // Soft delete
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = "This message was deleted";
    await message.save();

    const deletedMessage = await Message.findById(message._id)
      .populate("sender", "name")
      .populate("receiver", "name")
      .populate("group", "name");

    // Emit delete through Socket.IO
    const io = req.app.get("io");
    if (message.receiver) {
      io.to(message.receiver.toString()).emit("message-deleted", deletedMessage);
      io.to(req.user._id.toString()).emit("message-deleted", deletedMessage);
    } else if (message.group) {
      io.to(`group-${message.group}`).emit("message-deleted", deletedMessage);
    }

    res.json(deletedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add reaction to message
router.post("/:messageId/reactions", protect, async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Find if this emoji already exists
    let reaction = message.reactions.find(r => r.emoji === emoji);
    
    if (reaction) {
      // Check if user already reacted with this emoji
      const userIndex = reaction.users.indexOf(req.user._id);
      if (userIndex > -1) {
        // Remove user's reaction
        reaction.users.splice(userIndex, 1);
        // If no users left, remove the reaction
        if (reaction.users.length === 0) {
          message.reactions = message.reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        // Add user's reaction
        reaction.users.push(req.user._id);
      }
    } else {
      // Add new reaction
      message.reactions.push({
        emoji,
        users: [req.user._id]
      });
    }

    await message.save();

    const updatedMessage = await Message.findById(message._id)
      .populate("sender", "name")
      .populate("receiver", "name")
      .populate("group", "name")
      .populate("reactions.users", "name");

    // Emit reaction update through Socket.IO
    const io = req.app.get("io");
    if (message.receiver) {
      io.to(message.receiver.toString()).emit("message-reaction-updated", updatedMessage);
      io.to(req.user._id.toString()).emit("message-reaction-updated", updatedMessage);
    } else if (message.group) {
      io.to(`group-${message.group}`).emit("message-reaction-updated", updatedMessage);
    }

    res.json(updatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
