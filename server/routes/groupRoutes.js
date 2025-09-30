const express = require('express');
const groupController = require('../controllers/groupController');

const router = express.Router();

// Get user's group with members
router.get('/groups/my-group/:userId', groupController.getMyGroup);

// Get all group
router.get('/groups/all-group', groupController.getAllGroups);

// Get group by ID
router.get('/groups/group/:groupId', groupController.getGroupById);

// Get group members by group ID
router.get('/groups/members/:groupId', groupController.getGroupMembers);

module.exports = router;
