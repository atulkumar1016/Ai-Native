const express = require('express');
const router = express.Router();
const { signupUser, loginUser, getCurrentUser } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', signupUser);
router.post('/login', loginUser);
router.get('/me', protect, getCurrentUser);

module.exports = router;
