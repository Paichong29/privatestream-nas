const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

router.get('/', authenticateToken, userController.getUsers);
router.post('/', authenticateToken, validate(schemas.createUser), userController.createUser);
router.delete('/:id', authenticateToken, userController.deleteUser);

module.exports = router;
