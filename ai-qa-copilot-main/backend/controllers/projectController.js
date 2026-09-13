const Project = require('../models/Project');
const TestCase = require('../models/TestCase');
const TestExecution = require('../models/TestExecution');
const { validateProject } = require('../validators/projectValidator');

/**
 * @desc    Get all projects
 * @route   GET /api/projects
 * @access  Private
 */
const getProjects = async (req, res, next) => {
  try {
    let query = {};
    // If not admin, only show projects owned by this user
    if (req.user.role !== 'admin') {
      query.owner = req.user._id;
    }

    const projects = await Project.find(query).populate('owner', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single project
 * @route   GET /api/projects/:id
 * @access  Private
 */
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate('owner', 'name email');
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Authorization: Must own the project or be admin
    if (project.owner._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this project' });
    }

    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private
 */
const createProject = async (req, res, next) => {
  try {
    const { error } = validateProject(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { name, description } = req.body;

    const project = await Project.create({
      name,
      description,
      owner: req.user._id,
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a project
 * @route   PUT /api/projects/:id
 * @access  Private
 */
const updateProject = async (req, res, next) => {
  try {
    const { error } = validateProject(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    let project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Authorization
    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this project' });
    }

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a project and its cascading tests/executions
 * @route   DELETE /api/projects/:id
 * @access  Private
 */
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Authorization
    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this project' });
    }

    // Cascading Delete:
    // 1. Get all test cases associated with this project
    const testCases = await TestCase.find({ project: project._id });
    const testCaseIds = testCases.map(tc => tc._id);

    // 2. Delete all test executions for these test cases
    await TestExecution.deleteMany({ testCase: { $in: testCaseIds } });

    // 3. Delete the test cases
    await TestCase.deleteMany({ project: project._id });

    // 4. Delete the project itself
    await Project.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Project and all related test cases & execution logs deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
