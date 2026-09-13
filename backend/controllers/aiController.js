const geminiService = require('../services/geminiService');

/**
 * @desc    Generate test cases using Gemini AI
 * @route   POST /api/ai/generate
 * @access  Private
 */
const generateTestCases = async (req, res, next) => {
  try {
    const { pageDescription, features, requirements, priority, type } = req.body;

    if (!pageDescription && !features) {
      return res.status(400).json({ success: false, message: 'Please provide either pageDescription or features list for test generation' });
    }

    const testCases = await geminiService.generateTestCases({
      pageDescription,
      features,
      requirements,
      priority,
      type,
    });

    res.json({
      success: true,
      data: testCases,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Analyze a stack trace or log error message
 * @route   POST /api/ai/analyze-bug
 * @access  Private
 */
const analyzeBug = async (req, res, next) => {
  try {
    const { stackTrace } = req.body;

    if (!stackTrace) {
      return res.status(400).json({ success: false, message: 'stackTrace field is required' });
    }

    const analysis = await geminiService.analyzeStackTrace(stackTrace);

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateTestCases,
  analyzeBug,
};
