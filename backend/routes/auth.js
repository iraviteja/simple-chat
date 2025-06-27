const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { generateToken } = require("../middleware/auth");

// Join chat with name
router.post(
  "/join",
  [body("name").isLength({ min: 2 }).trim()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;

    try {
      // Find or create user
      let user = await User.findOne({ name });

      if (!user) {
        user = await User.create({ name });
      }

      // Update online status
      user.isOnline = true;
      await user.save();

      const token = generateToken(user._id);

      res.json({
        _id: user._id,
        name: user.name,
        token,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Logout
router.post("/logout", async (req, res) => {
  try {
    const userId = req.user?._id;
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        user.isOnline = false;
        user.lastSeen = new Date();
        await user.save();
      }
    }
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
