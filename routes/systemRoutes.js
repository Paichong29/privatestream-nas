const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { authenticateToken } = require('../middleware/auth');

router.get('/stats', authenticateToken, systemController.getStats);
router.get('/logs', authenticateToken, systemController.getLogs);
router.get('/notifications', authenticateToken, systemController.getNotifications);
router.patch('/notifications/:id/read', authenticateToken, systemController.markNotificationRead);
router.get('/settings', authenticateToken, systemController.getSettings);
router.patch('/settings', authenticateToken, systemController.updateSettings);

module.exports = router;
