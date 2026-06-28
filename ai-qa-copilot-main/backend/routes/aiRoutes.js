const express = require('express');
const router = express.Router();
const { generateTestCases, analyzeBug } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Secure routes

router.post('/generate', generateTestCases);
router.post('/analyze-bug', analyzeBug);

module.exports = router;
