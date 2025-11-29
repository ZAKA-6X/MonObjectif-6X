// server/routes/userRoutes.js
const express = require('express');
const { checkUser, setPassword, getAllStudents, resetStudentPassword, changeStudentGroup } = require('../controllers/userController.js');

const router = express.Router();
router.post('/login', checkUser);
router.post('/set-password', setPassword);
router.get('/students', getAllStudents);
router.put('/students/:id/reset-password', resetStudentPassword);
router.put('/students/:studentId/group', changeStudentGroup);

module.exports = router;
