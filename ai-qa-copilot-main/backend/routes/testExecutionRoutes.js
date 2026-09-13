const express = require('express');
const router = express.Router();
const {
  runTestCase,
  getExecutions,
  getDashboardStats,
  downloadPDFReport,
  downloadCSVReport,
  runAdhocApiTest,
  runAdhocPlaywrightTest,
} = require('../controllers/testExecutionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Secure all execution endpoints

router.post('/run/:id', runTestCase);
router.post('/run-adhoc', runAdhocApiTest);
router.post('/run-adhoc-playwright', runAdhocPlaywrightTest);
router.get('/', getExecutions);
router.get('/dashboard', getDashboardStats);
router.get('/report/pdf', downloadPDFReport);
router.get('/report/csv', downloadCSVReport);

module.exports = router;
