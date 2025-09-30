// server/routes/userRoutes.js
const express = require('express');
const { checkUser } = require('../controllers/userController.js');

const router = express.Router();
router.post('/login', checkUser);

module.exports = router;
