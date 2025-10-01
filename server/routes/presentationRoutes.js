const express = require('express');
const presentationController = require('../controllers/presentationController');

const router = express.Router();

// Get all active presentations
router.get('/presentations/active', presentationController.getActivePresentations);

// Get user's group presentations
router.get('/presentations/my-group/:userId', presentationController.getMyGroupPresentations);


// ✅ NEW: Get presentations by groupId (what the frontend calls)
router.get('/presentations/group/:groupId', presentationController.getPresentationsByGroupId);

module.exports = router;