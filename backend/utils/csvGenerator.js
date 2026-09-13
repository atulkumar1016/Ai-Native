/**
 * Formats value for safe placement in CSV files (escapes quotes and handles commas).
 */
const escapeCSVValue = (val) => {
  if (val === undefined || val === null) {
    return '""';
  }
  let str = String(val);
  // Replace double quotes with escaped double quotes
  str = str.replace(/"/g, '""');
  // Wrap in double quotes if there are commas, double quotes, or newlines
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str}"`;
  }
  return str;
};

/**
 * Generates a CSV string from test execution listings.
 */
const generateReportCSV = (executions) => {
  const headers = ['Execution ID', 'Test Case Title', 'Type', 'Status', 'Duration (ms)', 'Date Executed', 'Error Message'];
  
  const rows = executions.map(exec => {
    return [
      exec._id,
      exec.testCase?.title || 'N/A',
      exec.testCase?.type || 'manual',
      exec.status,
      exec.runDuration,
      exec.createdAt ? new Date(exec.createdAt).toISOString() : 'N/A',
      exec.errorMsg || ''
    ];
  });

  const csvContent = [
    headers.map(escapeCSVValue).join(','),
    ...rows.map(row => row.map(escapeCSVValue).join(','))
  ].join('\n');

  return csvContent;
};

module.exports = {
  generateReportCSV,
};
