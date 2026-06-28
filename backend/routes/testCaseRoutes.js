const express = require('express');
const router = express.Router();
const {
  getTestCases,
  getTestCaseById,
  createTestCase,
  updateTestCase,
  deleteTestCase,
  bulkCreateTestCases,
} = require('../controllers/testCaseController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Secure all routes

router.route('/')
  .get(getTestCases)
  .post(createTestCase);

router.post('/bulk', bulkCreateTestCases);

router.route('/:id')
  .get(getTestCaseById)
  .put(updateTestCase)
  .delete(deleteTestCase);

module.exports = router;
