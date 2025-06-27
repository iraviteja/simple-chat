const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Create group
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, members } = req.body;
    
    const group = await Group.create({
      name,
      description,
      createdBy: req.user._id,
      members: [req.user._id, ...members]
    });

    // Update users' joinedGroups
    await User.updateMany(
      { _id: { $in: group.members } },
      { $push: { joinedGroups: group._id } }
    );

    const populatedGroup = await Group.findById(group._id)
      .populate('members', 'username profileImage')
      .populate('createdBy', 'username');

    res.status(201).json(populatedGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's groups
router.get('/my-groups', protect, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate('members', 'username profileImage')
      .populate('createdBy', 'username')
      .sort('-createdAt');

    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add members to group
router.post('/:groupId/members', protect, async (req, res) => {
  try {
    const { members } = req.body;
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only group creator can add members' });
    }

    // Add new members
    const newMembers = members.filter(m => !group.members.includes(m));
    group.members.push(...newMembers);
    await group.save();

    // Update users' joinedGroups
    await User.updateMany(
      { _id: { $in: newMembers } },
      { $push: { joinedGroups: group._id } }
    );

    const updatedGroup = await Group.findById(group._id)
      .populate('members', 'username profileImage');

    res.json(updatedGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Leave group
router.delete('/:groupId/leave', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    group.members = group.members.filter(
      member => member.toString() !== req.user._id.toString()
    );
    await group.save();

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { joinedGroups: group._id }
    });

    res.json({ message: 'Left group successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;