const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect } = require("../middleware/auth");

// Get all users (for search and online users list)
router.get("/", protect, async (req, res) => {
  try {
    const keyword = req.query.search
      ? {
          name: { $regex: req.query.search, $options: "i" },
        }
      : {};

    const users = await User.find(keyword)
      .find({ _id: { $ne: req.user._id } })
      .select("_id name isOnline lastSeen")
      .sort({ isOnline: -1, name: 1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user profile
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("_id name isOnline lastSeen joinedGroups")
      .populate("joinedGroups");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
