const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  } catch (err) {
    console.error('Failed to initialize GoogleGenerativeAI client:', err.message);
  }
}

// Generates test cases using the Gemini API. Falls back to mock data if key is missing or call fails.
const generateTestCases = async ({ pageDescription, features, requirements, priority = 'medium', type = 'manual' }) => {
  if (!genAI) {
    console.warn('GEMINI_API_KEY not found. Using mock fallback data.');
    return getMockedTestCases(pageDescription, features, type);
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  let prompt = `You are a professional QA automation engineer.
Generate 4 test cases for the following application feature:
- Description: ${pageDescription || 'N/A'}
- Key Features: ${features || 'N/A'}
- Additional Requirements: ${requirements || 'N/A'}
- Test Case Type: ${type} (manual, api, or playwright)

Make sure to cover different test aspects: Positive, Negative, Boundary, and Security/Edge cases.

Format the response strictly as a JSON array of objects. Do not include any markdown backticks, json prefix, or extra text outside the JSON array.
Each object must have the following structure:
{
  "title": "Descriptive test case title",
  "description": "Short explanation of what this test verifies",
  "steps": ["Step 1...", "Step 2..."],
  "assertions": ["Assert action/result 1...", "Assert action/result 2..."],
  "priority": "${priority}",
  "tags": ["smoke", "security", "boundary", "regression"],
  "code": "If the type was 'playwright', provide a clean, complete, executable Playwright JS script that uses playwright library. If not 'playwright', leave this field empty."
}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    
    if (text.startsWith('```')) {
      text = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini API generateTestCases error:', error.message);
    return getMockedTestCases(pageDescription, features, type);
  }
};

// Analyzes a stack trace or log error to determine the root cause and suggestions.
const analyzeStackTrace = async (stackTrace) => {
  if (!genAI) {
    console.warn('GEMINI_API_KEY not found. Using mock stack trace analyzer.');
    return getMockedBugAnalysis(stackTrace);
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are an expert software developer and test automation consultant.
Analyze this stack trace / test log error:
"${stackTrace}"

Identify:
1. The Root Cause of the failure.
2. A concrete Fix Suggestion (code fix or configuration adjustment).
3. A Confidence Score (0 to 100) representing how certain you are of the analysis.

Format the response strictly as a JSON object (no markdown backticks, no json wrapper):
{
  "rootCause": "Explanation of why the error happened...",
  "fixSuggestion": "Provide the concrete code or config fix...",
  "confidenceScore": 85
}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    
    if (text.startsWith('```')) {
      text = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini API analyzeStackTrace error:', error.message);
    return getMockedBugAnalysis(stackTrace);
  }
};

// Mock data fallbacks
const getMockedTestCases = (description = '', features = '', type = 'manual') => {
  const codeSnippet = type === 'playwright' ? `const { test, expect } = require('@playwright/test');

test('Verify successful operation', async ({ page }) => {
  await page.goto('https://example.com/login');
  await page.fill('#username', 'testuser');
  await page.fill('#password', 'password123');
  await page.click('#submit-btn');
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.locator('#welcome-banner')).toContainText('Welcome');
});` : '';

  return [
    {
      title: `Verify successful user flow - ${features || 'Feature'}`,
      description: `Ensure the core happy path for ${description || 'the feature'} is fully functional.`,
      steps: [
        'Navigate to the application web page',
        'Input valid authentication and payload inputs',
        'Submit the details'
      ],
      assertions: [
        'Confirm response status is successful',
        'Check that the success banner or dashboard dashboard is visible'
      ],
      priority: 'high',
      tags: ['smoke', 'positive', 'regression'],
      code: codeSnippet
    },
    {
      title: `Verify validation constraints and error handling - ${features || 'Feature'}`,
      description: 'Ensure fields block invalid inputs and present useful errors.',
      steps: [
        'Navigate to the application page',
        'Submit blank or invalid formatting inputs',
        'Verify submit button state'
      ],
      assertions: [
        'Assert validation error is displayed next to the invalid fields',
        'Assert submission is prevented'
      ],
      priority: 'medium',
      tags: ['negative', 'validation'],
      code: type === 'playwright' ? `const { test, expect } = require('@playwright/test');

test('Verify validation error on empty fields', async ({ page }) => {
  await page.goto('https://example.com/login');
  await page.click('#submit-btn');
  const errorText = await page.locator('.error-message').textContent();
  expect(errorText).toContain('Username is required');
});` : ''
    },
    {
      title: `Verify boundary data processing - ${features || 'Feature'}`,
      description: 'Test upper/lower limits of length, size, or counts.',
      steps: [
        'Navigate to page form fields',
        'Enter maximum allowed length strings in inputs',
        'Submit form'
      ],
      assertions: [
        'Verify characters are truncated or successfully handled without internal server error code 500'
      ],
      priority: 'low',
      tags: ['boundary'],
      code: ''
    },
    {
      title: `Verify injection protection - ${features || 'Feature'}`,
      description: 'Ensure inputs filter standard scripting tags (XSS, SQL Injection).',
      steps: [
        'Type <script>alert(1)</script> and OR 1=1 into parameters',
        'Submit the payload details'
      ],
      assertions: [
        'Verify comments are sanitized or error code is thrown gracefully',
        'No popup alert executes'
      ],
      priority: 'high',
      tags: ['security', 'edge'],
      code: ''
    }
  ];
};

const getMockedBugAnalysis = (stackTrace = '') => {
  let rootCause = 'Unknown test assertion failure or timeout.';
  let fixSuggestion = 'Review test assertion locator target or verify standard web elements are visible before asserting state.';
  let confidenceScore = 65;

  if (stackTrace.includes('TimeoutError') || stackTrace.includes('timeout exceeded')) {
    rootCause = 'Test runner exceeded the default locator or page action timeout limit (typically 30000ms). The page loaded too slowly or the target selector is invalid.';
    fixSuggestion = '1. Double check the target CSS selector in your page locator.\n2. Increase the timeout limit or add an explicit await page.waitForSelector(selector) call before acting.';
    confidenceScore = 90;
  } else if (stackTrace.includes('locator.click') || stackTrace.includes('not visible')) {
    rootCause = 'Playwright attempted to click on a DOM element that is hidden, covered, or has not yet loaded onto the screen.';
    fixSuggestion = 'Ensure the element is fully scrolled into view, or use { force: true } inside click if standard pointer events are hijacked.';
    confidenceScore = 85;
  } else if (stackTrace.includes('status code 401') || stackTrace.includes('Unauthorized')) {
    rootCause = 'Authentication token is expired, missing, or improperly structured in HTTP headers.';
    fixSuggestion = 'Validate auth credentials lifecycle, check JWT token expiration date, and confirm Bearer token attaches successfully in headers.';
    confidenceScore = 95;
  } else if (stackTrace.includes('MongooseError') || stackTrace.includes('MongoNetworkError')) {
    rootCause = 'Connection to the MongoDB database server failed. The server is not running locally or credentials are stale.';
    fixSuggestion = 'Start your local MongoDB instance using: net start MongoDB (on Windows) or verify the MONGODB_URI connection string inside your .env configuration.';
    confidenceScore = 98;
  }

  return { rootCause, fixSuggestion, confidenceScore };
};

module.exports = {
  generateTestCases,
  analyzeStackTrace,
};
