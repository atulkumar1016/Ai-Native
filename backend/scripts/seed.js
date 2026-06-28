require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const TestCase = require('../models/TestCase');
const TestExecution = require('../models/TestExecution');

const seedData = async (shouldDisconnect = true) => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_native_test_platform';
    
    // Only connect if mongoose is not already connected
    if (mongoose.connection.readyState === 0) {
      console.log(`Connecting to MongoDB for seeding: ${mongoUri}`);
      await mongoose.connect(mongoUri);
    }

    console.log('Clearing database tables...');
    await User.deleteMany({});
    await Project.deleteMany({});
    await TestCase.deleteMany({});
    await TestExecution.deleteMany({});

    console.log('Seeding user credentials...');
    // Create admin
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
    });

    // Create user
    const normalUser = await User.create({
      name: 'John Tester',
      email: 'user@test.com',
      password: 'password123',
      role: 'user',
    });

    console.log('Seeding initial project...');
    const project = await Project.create({
      name: 'Storefront E-Commerce App',
      description: 'Comprehensive testing sweep for our core e-commerce storefront API and frontend user flow.',
      owner: normalUser._id,
    });

    console.log('Seeding test cases...');
    
    // 1. Manual test case
    const tcManual = await TestCase.create({
      project: project._id,
      title: 'Verify cart item count badge update',
      description: 'Check that clicking "Add to Cart" increments the cart counter badge dynamically.',
      steps: [
        'Open the product details page of Item A',
        'Verify the cart header item badge is showing 0',
        'Click "Add to Cart" button',
        'Verify cart counter changes to 1'
      ],
      assertions: [
        'Cart item badge displays number "1"'
      ],
      tags: ['ui', 'cart', 'smoke'],
      priority: 'high',
      type: 'manual',
      createdBy: normalUser._id,
    });

    // 2. API test case (Hits our local API health endpoint out-of-the-box!)
    const tcApi = await TestCase.create({
      project: project._id,
      title: 'Verify backend API health status code',
      description: 'Check if the backend system serves health stats correctly.',
      steps: [
        'Send GET request to /api/health',
      ],
      assertions: [
        'Status is 200',
        'JSON contains status=healthy'
      ],
      tags: ['api', 'smoke', 'monitoring'],
      priority: 'medium',
      type: 'api',
      apiConfig: {
        url: 'http://localhost:5000/api/health',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        expectedStatus: 200,
        assertions: [
          { type: 'status_code', value: '200' },
          { type: 'json_contains', property: 'status', value: 'healthy' }
        ]
      },
      createdBy: normalUser._id,
    });

    // 3. Playwright test case
    const tcPlaywright = await TestCase.create({
      project: project._id,
      title: 'Verify Playwright title assert',
      description: 'Run automated Playwright browser test to inspect title matching of a default page.',
      steps: [
        'Launch browser, navigate to playwrigh.dev',
        'Check that page title contains Playwright keyword'
      ],
      assertions: [
        'Page title contains Playwright'
      ],
      tags: ['automation', 'playwright', 'regression'],
      priority: 'high',
      type: 'playwright',
      code: `const { test, expect } = require('@playwright/test');

test('Verify title on Playwright home page', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await expect(page).toHaveTitle(/Playwright/);
});`,
      createdBy: normalUser._id,
    });

    console.log('Seeding dummy test execution logs...');

    // Past 7 days data for dashboards charts representation
    const now = new Date();
    
    // Execution 1: Manual Test Passed (3 days ago)
    const d1 = new Date();
    d1.setDate(now.getDate() - 3);
    await TestExecution.create({
      testCase: tcManual._id,
      status: 'passed',
      runDuration: 4500,
      logs: 'Tester comments: Cart item badge increment verified successfully. Responsive UI is solid.',
      assertionsResult: [
        { assertion: 'Manual verification', passed: true }
      ],
      executedBy: normalUser._id,
      createdAt: d1
    });

    // Execution 2: API Test Passed (2 days ago)
    const d2 = new Date();
    d2.setDate(now.getDate() - 2);
    await TestExecution.create({
      testCase: tcApi._id,
      status: 'passed',
      runDuration: 230,
      logs: 'HTTP Status: 200\nResponse Headers: {"content-type": "application/json"}',
      responseStatus: 200,
      responseTime: 230,
      responseBody: '{\n  "success": true,\n  "status": "healthy"\n}',
      assertionsResult: [
        { assertion: 'Response HTTP Status is 200', passed: true },
        { assertion: 'JSON CONTAINS: status matches "healthy"', passed: true }
      ],
      executedBy: normalUser._id,
      createdAt: d2
    });

    // Execution 3: Playwright Test Failed (1 day ago)
    const d3 = new Date();
    d3.setDate(now.getDate() - 1);
    await TestExecution.create({
      testCase: tcPlaywright._id,
      status: 'failed',
      runDuration: 12400,
      logs: 'Running 1 test using 1 worker\n[chromium] › test_spec.js\n  1) Verify title on Playwright home page',
      errorMsg: 'Error: expect(received).toHaveTitle(expected)\n\nExpected pattern: /WrongTitle/\nReceived string:  "Fast and reliable end-to-end testing for modern web apps | Playwright"',
      screenshotPath: '', // Will simulate blank or placeholder failure path
      assertionsResult: [
        { assertion: 'Playwright Spec Execution', passed: false, error: 'Expected pattern: /WrongTitle/\nReceived string:  "Fast and reliable..."' }
      ],
      executedBy: normalUser._id,
      createdAt: d3
    });

    // Execution 4: Playwright Test Passed (Today)
    await TestExecution.create({
      testCase: tcPlaywright._id,
      status: 'passed',
      runDuration: 3400,
      logs: 'Running 1 test using 1 worker\n[chromium] › test_spec.js\n  ✓  Verify title on Playwright home page (3.4s)',
      assertionsResult: [
        { assertion: 'Playwright Spec Execution', passed: true }
      ],
      executedBy: normalUser._id,
      createdAt: now
    });

    // Execution 5: API Test Passed (Today)
    await TestExecution.create({
      testCase: tcApi._id,
      status: 'passed',
      runDuration: 85,
      logs: 'HTTP Status: 200\nResponse Headers: {"content-type": "application/json"}',
      responseStatus: 200,
      responseTime: 85,
      responseBody: '{\n  "success": true,\n  "status": "healthy"\n}',
      assertionsResult: [
        { assertion: 'Response HTTP Status is 200', passed: true },
        { assertion: 'JSON CONTAINS: status matches "healthy"', passed: true }
      ],
      executedBy: normalUser._id,
      createdAt: now
    });

    console.log('\nSeeding completed successfully!');
    console.log('----------------------------------------------------');
    console.log('Login Accounts:');
    console.log(`- Regular User: ${normalUser.email} / password123`);
    console.log(`- Administrator: ${adminUser.email} / password123`);
    console.log('----------------------------------------------------');
    
    if (shouldDisconnect) {
      await mongoose.disconnect();
    }
  } catch (error) {
    console.error('Seeding database error:', error.message);
    if (shouldDisconnect) {
      process.exit(1);
    } else {
      throw error;
    }
  }
};

if (require.main === module) {
  seedData(true);
} else {
  module.exports = seedData;
}
