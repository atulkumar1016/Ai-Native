const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');

const TEMP_DIR = path.join(__dirname, '..', 'temp_tests');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'screenshots');

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Runs a Playwright script by writing it to a temp file, executing the runner, and parsing JSON output
const runPlaywrightTest = (testCode, executionId = uuidv4()) => {
  return new Promise((resolve) => {
    const specFileName = `test_${executionId}.spec.js`;
    const specFilePath = path.join(TEMP_DIR, specFileName);

    let finalCode = testCode;
    if (!testCode.includes("require('@playwright/test')") && !testCode.includes("from '@playwright/test'")) {
      finalCode = `const { test, expect } = require('@playwright/test');\n\n${testCode}`;
    }

    fs.writeFileSync(specFilePath, finalCode, 'utf8');

    const command = `npx playwright test "${specFilePath}" --config="${path.join(__dirname, '..', 'playwright.config.js')}"`;
    const options = {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: undefined }
    };

    const startTime = Date.now();

    exec(command, options, (error, stdout, stderr) => {
      const runDuration = Date.now() - startTime;
      
      let parsedReport = null;
      let logs = '';
      let errorMsg = '';
      let status = 'error';
      let screenshotPath = '';

      let outputToParse = stdout;
      if (error && error.stdout) {
        outputToParse = error.stdout;
      }

      try {
        const jsonStartIndex = outputToParse.indexOf('{');
        if (jsonStartIndex !== -1) {
          const jsonString = outputToParse.substring(jsonStartIndex);
          parsedReport = JSON.parse(jsonString);
        }
      } catch (parseError) {
        console.error('Failed to parse Playwright JSON output:', parseError.message);
        logs = stdout + '\n' + stderr;
        errorMsg = error ? error.message : 'Unknown execution error';
      }

      if (parsedReport) {
        try {
          const suite = parsedReport.suites?.[0];
          const spec = suite?.specs?.[0];
          const testCase = spec?.tests?.[0];
          const result = testCase?.results?.[0];

          if (result) {
            status = result.status === 'passed' ? 'passed' : 'failed';
            logs = result.stdout?.map(log => log.text).join('\n') || '';
            
            if (result.errors && result.errors.length > 0) {
              errorMsg = result.errors.map(err => err.message || err.value).join('\n');
            } else if (result.error) {
              errorMsg = result.error.message || JSON.stringify(result.error);
            }

            const screenshotAttachment = result.attachments?.find(att => att.name === 'screenshot');
            if (screenshotAttachment && screenshotAttachment.path) {
              const srcPath = screenshotAttachment.path;
              const destFileName = `screenshot_${executionId}.png`;
              const destPath = path.join(UPLOADS_DIR, destFileName);
              
              if (fs.existsSync(srcPath)) {
                fs.copyFileSync(srcPath, destPath);
                screenshotPath = `/uploads/screenshots/${destFileName}`;
              }
            }
          } else {
            status = 'error';
            errorMsg = 'No test results returned. Possible compilation error in Playwright script.';
            logs = stdout + '\n' + stderr;
          }
        } catch (traverseError) {
          status = 'error';
          errorMsg = `Error parsing test report: ${traverseError.message}`;
          logs = stdout + '\n' + stderr;
        }
      } else {
        status = 'error';
        errorMsg = errorMsg || (error ? error.message : 'Test process failed to execute');
      }

      // Cleanup temp spec file
      try {
        if (fs.existsSync(specFilePath)) {
          fs.unlinkSync(specFilePath);
        }
      } catch (cleanupErr) {
        console.error('Failed to delete temp spec file:', cleanupErr.message);
      }

      // Cleanup playwright test-results folder
      try {
        const testResultsDir = path.join(__dirname, '..', 'test-results');
        if (fs.existsSync(testResultsDir)) {
          const files = fs.readdirSync(testResultsDir);
          files.forEach(file => {
            if (file.includes(executionId)) {
              const folderToDelete = path.join(testResultsDir, file);
              fs.rmSync(folderToDelete, { recursive: true, force: true });
            }
          });
        }
      } catch (cleanupResultsErr) {
        console.error('Failed to clean up test-results folder:', cleanupResultsErr.message);
      }

      resolve({
        status,
        runDuration: parsedReport ? (parsedReport.stats?.duration || runDuration) : runDuration,
        logs,
        errorMsg,
        screenshotPath,
      });
    });
  });
};

module.exports = {
  runPlaywrightTest,
};
