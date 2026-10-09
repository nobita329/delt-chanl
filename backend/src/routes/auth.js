const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.get('/login', authController.login);
router.get('/callback', authController.callback);
router.get('/user', requireAuth, authController.getCurrentUser);
router.post('/logout', requireAuth, authController.logout);

module.exports = router;

