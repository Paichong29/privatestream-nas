const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { authenticateToken } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// All file routes are protected.
// Download is special (query param token), handled by middleware logic or custom logic. 
// Ideally we keep authenticateToken for all, and download uses ?token=.
// The middleware 'authenticateToken' already handles query param 'token'.

router.get('/', authenticateToken, fileController.getFiles);
router.post('/', authenticateToken, upload.single('file'), fileController.uploadFile);
router.delete('/:id', authenticateToken, fileController.deleteFile);
router.patch('/:id', authenticateToken, fileController.renameFile);
router.post('/:id/tier', authenticateToken, fileController.toggleTier);
router.get('/:id/download', authenticateToken, fileController.downloadFile);

module.exports = router;
