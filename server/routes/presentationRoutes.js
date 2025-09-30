const express = require('express');
const presentationController = require('../controllers/presentationController');

const router = express.Router();

// Get all active presentations
router.get('/presentations/active', presentationController.getActivePresentations);

// Get user's group presentations
router.get('/presentations/my-group/:userId', presentationController.getMyGroupPresentations);

module.exports = router;