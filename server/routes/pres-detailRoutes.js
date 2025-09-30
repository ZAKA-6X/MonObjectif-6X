const express = require('express');
const presentationController = require('../controllers/pres-detailController');

const router = express.Router();

// Get all active presentations
router.get('/presentations/active', presentationController.getActivePresentations);

// Get user's group presentations
router.get('/presentations/my-group/:userId', presentationController.getMyGroupPresentations);

// Get presentation details
router.get('/presentations/details/:presentationId', presentationController.getPresentationDetails);

// Rate a presentation
router.post('/presentations/:presentationId/rate', presentationController.ratePresentation);

// Add after the rate route
router.put('/presentations/:presentationId/description', presentationController.updatePresentationDescription);

// Update presentation feedback
router.put('/presentations/:presentationId/feedback', presentationController.updatePresentationFeedback);

// Download presentation file
router.get('/presentations/:presentationId/download', presentationController.downloadPresentation);

module.exports = router;
