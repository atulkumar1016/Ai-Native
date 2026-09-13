const TestCase = require('../models/TestCase');
const TestExecution = require('../models/TestExecution');
const Project = require('../models/Project');
const { validateTestCase } = require('../validators/testCaseValidator');

// Get all test cases for a project with optional filters
const getTestCases = async (req, res, next) => {
  try {
    const { project, search, priority, type, tag } = req.query;

    if (!project) {
      return res.status(400).json({ success: false, message: 'Project query parameter is required' });
    }

    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    if (projectDoc.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view these test cases' });
    }

    let filter = { project };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (priority) {
      filter.priority = priority;
    }

    if (type) {
      filter.type = type;
    }

    if (tag) {
      filter.tags = tag;
    }

    const testCases = await TestCase.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: testCases.length, data: testCases });
  } catch (error) {
    next(error);
  }
};

// Get single test case details
const getTestCaseById = async (req, res, next) => {
  try {
    const testCase = await TestCase.findById(req.params.id).populate('project');
    if (!testCase) {
      return res.status(404).json({ success: false, message: 'Test case not found' });
    }

    if (testCase.project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this test case' });
    }

    res.json({ success: true, data: testCase });
  } catch (error) {
    next(error);
  }
};

// Create a new test case
const createTestCase = async (req, res, next) => {
  try {
    const { error } = validateTestCase(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const projectDoc = await Project.findById(req.body.project);
    if (!projectDoc) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    if (projectDoc.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to add test cases to this project' });
    }

    const testCase = await TestCase.create({
      ...req.body,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: testCase });
  } catch (error) {
    next(error);
  }
};

// Update an existing test case
const updateTestCase = async (req, res, next) => {
  try {
    const { error } = validateTestCase(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    let testCase = await TestCase.findById(req.params.id);
    if (!testCase) {
      return res.status(404).json({ success: false, message: 'Test case not found' });
    }

    const projectDoc = await Project.findById(testCase.project);
    if (projectDoc.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this test case' });
    }

    testCase = await TestCase.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: testCase });
  } catch (error) {
    next(error);
  }
};

// Delete a test case and its execution history
const deleteTestCase = async (req, res, next) => {
  try {
    const testCase = await TestCase.findById(req.params.id);
    if (!testCase) {
      return res.status(404).json({ success: false, message: 'Test case not found' });
    }

    const projectDoc = await Project.findById(testCase.project);
    if (projectDoc.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this test case' });
    }

    await TestExecution.deleteMany({ testCase: testCase._id });
    await TestCase.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Test case and execution history deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Bulk create test cases (mostly used for AI generation saves)
const bulkCreateTestCases = async (req, res, next) => {
  try {
    const { project, testCases } = req.body;

    if (!project || !Array.isArray(testCases)) {
      return res.status(400).json({ success: false, message: 'Project ID and testCases array are required' });
    }

    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    if (projectDoc.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this project' });
    }

    const formattedTestCases = testCases.map(tc => ({
      ...tc,
      project,
      createdBy: req.user._id,
    }));

    const insertedDocs = await TestCase.insertMany(formattedTestCases);

    res.status(201).json({
      success: true,
      count: insertedDocs.length,
      data: insertedDocs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTestCases,
  getTestCaseById,
  createTestCase,
  updateTestCase,
  deleteTestCase,
  bulkCreateTestCases,
};
