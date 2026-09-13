const TestCase = require('../models/TestCase');
const TestExecution = require('../models/TestExecution');
const Project = require('../models/Project');
const axios = require('axios');
const playwrightService = require('../services/playwrightService');
const pdfGenerator = require('../utils/pdfGenerator');
const csvGenerator = require('../utils/csvGenerator');
const mongoose = require('mongoose');

// Run a single test case (runs API/Playwright tests or records manual test results)
const runTestCase = async (req, res, next) => {
  try {
    const testCase = await TestCase.findById(req.params.id);
    if (!testCase) {
      return res.status(404).json({ success: false, message: 'Test case not found' });
    }

    const projectDoc = await Project.findById(testCase.project);
    if (!projectDoc) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    if (projectDoc.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to run this test case' });
    }

    let status = 'passed';
    let runDuration = 0;
    let logs = '';
    let errorMsg = '';
    let screenshotPath = '';
    let responseStatus = undefined;
    let responseTime = undefined;
    let responseBody = undefined;
    let assertionsResult = [];

    // Manual test cases
    if (testCase.type === 'manual') {
      status = req.body.status || 'passed';
      logs = req.body.logs || 'Manual test verified by tester';
      runDuration = req.body.runDuration || 0;
      
      assertionsResult.push({
        assertion: 'Manual verification',
        passed: status === 'passed',
        error: status === 'passed' ? null : 'Manually marked as failed'
      });
    }

    // API test cases
    else if (testCase.type === 'api') {
      const config = testCase.apiConfig;
      if (!config || !config.url) {
        return res.status(400).json({ success: false, message: 'Test case is missing API configuration parameters' });
      }

      const start = Date.now();
      
      try {
        const headers = config.headers ? Object.fromEntries(config.headers) : {};
        let bodyData = undefined;
        if (config.body) {
          try {
            bodyData = JSON.parse(config.body);
          } catch (e) {
            bodyData = config.body;
          }
        }

        const axiosConfig = {
          method: config.method || 'GET',
          url: config.url,
          headers,
          data: bodyData,
          timeout: 15000,
          validateStatus: () => true,
        };

        const response = await axios(axiosConfig);
        runDuration = Date.now() - start;
        responseTime = runDuration;
        responseStatus = response.status;
        responseBody = typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : String(response.data);
        logs = `HTTP Status: ${response.status}\nResponse Headers: ${JSON.stringify(response.headers, null, 2)}`;

        const expectedStatus = config.expectedStatus || 200;
        const passedStatus = responseStatus === expectedStatus;
        assertionsResult.push({
          assertion: `Response HTTP Status is ${expectedStatus}`,
          passed: passedStatus,
          error: passedStatus ? null : `Expected ${expectedStatus}, but got ${responseStatus}`,
        });

        if (!passedStatus) {
          status = 'failed';
        }

        if (config.assertions && config.assertions.length > 0) {
          for (const ass of config.assertions) {
            let passed = false;
            let err = '';

            if (ass.type === 'status_code') {
              passed = responseStatus === parseInt(ass.value);
              err = passed ? null : `Expected status ${ass.value}, got ${responseStatus}`;
            } else if (ass.type === 'response_time') {
              passed = responseTime <= parseInt(ass.value);
              err = passed ? null : `Expected response time <= ${ass.value}ms, got ${responseTime}ms`;
            } else if (ass.type === 'text_contains') {
              passed = responseBody.includes(ass.value);
              err = passed ? null : `Response body does not contain text: "${ass.value}"`;
            } else if (ass.type === 'header_exists') {
              passed = !!response.headers[ass.property.toLowerCase()];
              err = passed ? null : `Header "${ass.property}" is missing`;
            } else if (ass.type === 'json_contains') {
              try {
                const json = JSON.parse(responseBody);
                const getPathValue = (obj, pathStr) => {
                  return pathStr.split('.').reduce((acc, part) => acc && acc[part], obj);
                };
                const val = getPathValue(json, ass.property);
                passed = String(val) === String(ass.value);
                err = passed ? null : `Expected JSON path "${ass.property}" to be "${ass.value}", got "${val}"`;
              } catch (e) {
                passed = false;
                err = `Invalid JSON response body: ${e.message}`;
              }
            }

            assertionsResult.push({
              assertion: `${ass.type.replace('_', ' ').toUpperCase()}: ${ass.property || ''} ${ass.value ? 'matches "' + ass.value + '"' : 'exists'}`,
              passed,
              error: err,
            });

            if (!passed && status !== 'error') {
              status = 'failed';
            }
          }
        }
      } catch (axiosError) {
        runDuration = Date.now() - start;
        status = 'error';
        errorMsg = `HTTP Request failed: ${axiosError.message}`;
        logs = axiosError.stack || '';
      }
    }

    // Playwright browser tests
    else if (testCase.type === 'playwright') {
      if (!testCase.code) {
        return res.status(400).json({ success: false, message: 'Playwright test code is missing' });
      }

      const playResult = await playwrightService.runPlaywrightTest(testCase.code);
      status = playResult.status;
      runDuration = playResult.runDuration;
      logs = playResult.logs;
      errorMsg = playResult.errorMsg;
      screenshotPath = playResult.screenshotPath;

      assertionsResult.push({
        assertion: 'Playwright Spec Execution',
        passed: status === 'passed',
        error: status === 'passed' ? null : errorMsg,
      });
    }

    const execution = await TestExecution.create({
      testCase: testCase._id,
      status,
      runDuration,
      logs,
      errorMsg,
      screenshotPath,
      responseStatus,
      responseTime,
      responseBody,
      assertionsResult,
      executedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: execution,
    });
  } catch (error) {
    next(error);
  }
};

// Fetch test execution history
const getExecutions = async (req, res, next) => {
  try {
    const { testCase, project } = req.query;
    let query = {};

    if (testCase) {
      query.testCase = testCase;
    } else if (project) {
      const cases = await TestCase.find({ project });
      const caseIds = cases.map(c => c._id);
      query.testCase = { $in: caseIds };
    } else {
      let projectQuery = {};
      if (req.user.role !== 'admin') {
        projectQuery.owner = req.user._id;
      }
      const myProjects = await Project.find(projectQuery);
      const myProjectIds = myProjects.map(p => p._id);
      const myCases = await TestCase.find({ project: { $in: myProjectIds } });
      const myCaseIds = myCases.map(c => c._id);
      query.testCase = { $in: myCaseIds };
    }

    const executions = await TestExecution.find(query)
      .populate({
        path: 'testCase',
        populate: { path: 'project', select: 'name' }
      })
      .populate('executedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: executions.length, data: executions });
  } catch (error) {
    next(error);
  }
};

// Get stats and timeline data for dashboard
const getDashboardStats = async (req, res, next) => {
  try {
    let projectQuery = {};
    if (req.user.role !== 'admin') {
      projectQuery.owner = req.user._id;
    }

    const projects = await Project.find(projectQuery);
    const projectIds = projects.map(p => p._id);

    const testCases = await TestCase.find({ project: { $in: projectIds } });
    const testCaseIds = testCases.map(tc => tc._id);

    const executions = await TestExecution.find({ testCase: { $in: testCaseIds } })
      .populate('testCase')
      .sort({ createdAt: -1 });

    const totalProjects = projects.length;
    const totalTestCases = testCases.length;
    const totalExecutions = executions.length;

    const passedExecs = executions.filter(e => e.status === 'passed').length;
    const failedExecs = executions.filter(e => e.status === 'failed').length;
    const errorExecs = executions.filter(e => e.status === 'error').length;
    const successRate = totalExecutions > 0 ? parseFloat(((passedExecs / totalExecutions) * 100).toFixed(1)) : 0;

    const manualCount = testCases.filter(t => t.type === 'manual').length;
    const apiCount = testCases.filter(t => t.type === 'api').length;
    const playwrightCount = testCases.filter(t => t.type === 'playwright').length;

    const recentExecutions = executions.slice(0, 5);

    const timeline = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayRuns = executions.filter(e => {
        const runDate = new Date(e.createdAt);
        return runDate.toDateString() === d.toDateString();
      });

      const dayPassed = dayRuns.filter(e => e.status === 'passed').length;
      const dayFailed = dayRuns.filter(e => e.status === 'failed' || e.status === 'error').length;

      timeline.push({
        date: dateStr,
        passed: dayPassed,
        failed: dayFailed,
        total: dayRuns.length
      });
    }

    res.json({
      success: true,
      data: {
        stats: {
          totalProjects,
          totalTestCases,
          totalExecutions,
          successRate,
          statusDistribution: {
            passed: passedExecs,
            failed: failedExecs,
            error: errorExecs
          },
          typesDistribution: {
            manual: manualCount,
            api: apiCount,
            playwright: playwrightCount
          }
        },
        recentExecutions,
        timeline,
      }
    });
  } catch (error) {
    next(error);
  }
};

// Generate and stream PDF report
const downloadPDFReport = async (req, res, next) => {
  try {
    const { project } = req.query;
    let projectDoc = null;
    let testCaseQuery = {};

    if (project) {
      projectDoc = await Project.findById(project);
      if (!projectDoc) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }
      testCaseQuery.project = project;
    } else {
      let pQuery = {};
      if (req.user.role !== 'admin') pQuery.owner = req.user._id;
      const projs = await Project.find(pQuery);
      testCaseQuery.project = { $in: projs.map(p => p._id) };
    }

    const testCases = await TestCase.find(testCaseQuery);
    const caseIds = testCases.map(tc => tc._id);
    const executions = await TestExecution.find({ testCase: { $in: caseIds } })
      .populate('testCase')
      .sort({ createdAt: -1 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=execution-report-${Date.now()}.pdf`);

    pdfGenerator.generateReportPDF(projectDoc, testCases, executions, res);
  } catch (error) {
    next(error);
  }
};

// Generate and download CSV report
const downloadCSVReport = async (req, res, next) => {
  try {
    const { project } = req.query;
    let testCaseQuery = {};

    if (project) {
      const projectDoc = await Project.findById(project);
      if (!projectDoc) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }
      testCaseQuery.project = project;
    } else {
      let pQuery = {};
      if (req.user.role !== 'admin') pQuery.owner = req.user._id;
      const projs = await Project.find(pQuery);
      testCaseQuery.project = { $in: projs.map(p => p._id) };
    }

    const testCases = await TestCase.find(testCaseQuery);
    const caseIds = testCases.map(tc => tc._id);
    const executions = await TestExecution.find({ testCase: { $in: caseIds } })
      .populate('testCase')
      .sort({ createdAt: -1 });

    const csvContent = csvGenerator.generateReportCSV(executions);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=execution-report-${Date.now()}.csv`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

// Run an ad-hoc API test without saving
const runAdhocApiTest = async (req, res, next) => {
  try {
    const { url, method, headers, body, expectedStatus, assertions } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: 'API URL is required' });
    }

    const start = Date.now();
    let status = 'passed';
    let runDuration = 0;
    let logs = '';
    let errorMsg = '';
    let responseStatus = undefined;
    let responseTime = undefined;
    let responseBody = undefined;
    let assertionsResult = [];

    try {
      const parsedHeaders = headers || {};
      let bodyData = undefined;
      if (body) {
        try {
          bodyData = typeof body === 'string' ? JSON.parse(body) : body;
        } catch (e) {
          bodyData = body;
        }
      }

      const axiosConfig = {
        method: method || 'GET',
        url: url,
        headers: parsedHeaders,
        data: bodyData,
        timeout: 15000,
        validateStatus: () => true
      };

      const response = await axios(axiosConfig);
      runDuration = Date.now() - start;
      responseTime = runDuration;
      responseStatus = response.status;
      responseBody = typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : String(response.data);
      logs = `HTTP Status: ${response.status}\nResponse Headers: ${JSON.stringify(response.headers, null, 2)}`;

      const targetStatus = expectedStatus || 200;
      const passedStatus = responseStatus === parseInt(targetStatus);
      assertionsResult.push({
        assertion: `Response HTTP Status is ${targetStatus}`,
        passed: passedStatus,
        error: passedStatus ? null : `Expected ${targetStatus}, but got ${responseStatus}`,
      });

      if (!passedStatus) {
        status = 'failed';
      }

      if (assertions && assertions.length > 0) {
        for (const ass of assertions) {
          let passed = false;
          let err = '';

          if (ass.type === 'status_code') {
            passed = responseStatus === parseInt(ass.value);
            err = passed ? null : `Expected status ${ass.value}, got ${responseStatus}`;
          } else if (ass.type === 'response_time') {
            passed = responseTime <= parseInt(ass.value);
            err = passed ? null : `Expected response time <= ${ass.value}ms, got ${responseTime}ms`;
          } else if (ass.type === 'text_contains') {
            passed = responseBody.includes(ass.value);
            err = passed ? null : `Response body does not contain text: "${ass.value}"`;
          } else if (ass.type === 'header_exists') {
            passed = !!response.headers[ass.property.toLowerCase()];
            err = passed ? null : `Header "${ass.property}" is missing`;
          } else if (ass.type === 'json_contains') {
            try {
              const json = JSON.parse(responseBody);
              const getPathValue = (obj, pathStr) => {
                return pathStr.split('.').reduce((acc, part) => acc && acc[part], obj);
              };
              const val = getPathValue(json, ass.property);
              passed = String(val) === String(ass.value);
              err = passed ? null : `Expected JSON path "${ass.property}" to be "${ass.value}", got "${val}"`;
            } catch (e) {
              passed = false;
              err = `Invalid JSON response body: ${e.message}`;
            }
          }

          assertionsResult.push({
            assertion: `${ass.type.replace('_', ' ').toUpperCase()}: ${ass.property || ''} ${ass.value ? 'matches "' + ass.value + '"' : 'exists'}`,
            passed,
            error: err,
          });

          if (!passed && status !== 'error') {
            status = 'failed';
          }
        }
      }
    } catch (axiosError) {
      runDuration = Date.now() - start;
      status = 'error';
      errorMsg = `HTTP Request failed: ${axiosError.message}`;
      logs = axiosError.stack || '';
    }

    res.json({
      success: true,
      data: {
        status,
        runDuration,
        responseTime,
        responseStatus,
        responseBody,
        logs,
        errorMsg,
        assertionsResult
      }
    });
  } catch (error) {
    next(error);
  }
};

// Run an ad-hoc Playwright test without saving
const runAdhocPlaywrightTest = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Playwright spec code is required' });
    }

    const playResult = await playwrightService.runPlaywrightTest(code);

    res.json({
      success: true,
      data: playResult,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  runTestCase,
  getExecutions,
  getDashboardStats,
  downloadPDFReport,
  downloadCSVReport,
  runAdhocApiTest,
  runAdhocPlaywrightTest,
};
