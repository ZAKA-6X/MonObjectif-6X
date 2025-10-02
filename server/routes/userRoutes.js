// server/routes/userRoutes.js
const express = require('express');
const { checkUser, setPassword } = require('../controllers/userController.js');

const router = express.Router();
router.post('/login', checkUser);
router.post('/set-password', setPassword);

module.exports = router;
