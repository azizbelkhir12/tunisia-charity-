const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

//login route

router.post('/login', authController.login);
router.get('/me', authController.getCurrentUser);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);


router.post('/register-admin', authController.registerAdmin);

module.exports = router;