const express = require('express');
const router = express.Router();
const modController = require('../controllers/modController');

router.get('/:userId', modController.isMod);

module.exports = router;
