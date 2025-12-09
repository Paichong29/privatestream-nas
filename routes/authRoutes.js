const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, loginLimiter } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

router.post('/login', loginLimiter, validate(schemas.login), authController.login);
router.post('/change-password', authenticateToken, validate(schemas.changePassword), authController.changePassword);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password-confirm', authController.resetPasswordConfirm);

module.exports = router;
