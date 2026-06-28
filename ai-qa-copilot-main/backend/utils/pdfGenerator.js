const PDFDocument = require('pdfkit');

/**
 * Generates a styled PDF report for test executions and pipes it to a stream (e.g. res).
 */
const generateReportPDF = (project, testCases, executions, writeStream) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(writeStream);

  // Colors
  const primaryColor = '#4F46E5'; // Indigo
  const darkTextColor = '#1F2937';
  const lightTextColor = '#6B7280';
  const greenColor = '#10B981';
  const redColor = '#EF4444';
  const grayColor = '#E5E7EB';

  // --- HEADER SECTION ---
  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(24)
    .text('AI-Native Test Platform Report', { align: 'left' });
  
  doc
    .fillColor(lightTextColor)
    .font('Helvetica')
    .fontSize(10)
    .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });
  
  doc.moveDown();
  
  // Horizontal Line
  doc.strokeColor(primaryColor).lineWidth(2).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1.5);

  // --- SUMMARY CARD ---
  doc
    .fillColor(darkTextColor)
    .font('Helvetica-Bold')
    .fontSize(16)
    .text(`Project: ${project ? project.name : 'All Projects'}`);
  
  if (project && project.description) {
    doc
      .fillColor(lightTextColor)
      .font('Helvetica-Oblique')
      .fontSize(10)
      .text(project.description);
  }
  doc.moveDown();

  const totalRuns = executions.length;
  const passedRuns = executions.filter(e => e.status === 'passed').length;
  const failedRuns = executions.filter(e => e.status === 'failed').length;
  const errorRuns = executions.filter(e => e.status === 'error').length;
  const successRate = totalRuns > 0 ? ((passedRuns / totalRuns) * 100).toFixed(1) : 0;

  // Stats Grid box
  const startY = doc.y;
  doc
    .rect(50, startY, 495, 60)
    .fillColor('#F3F4F6')
    .fill();

  doc
    .fillColor(darkTextColor)
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('Total Runs', 70, startY + 12)
    .text('Passed', 170, startY + 12)
    .text('Failed', 270, startY + 12)
    .text('Errors', 370, startY + 12)
    .text('Success Rate', 450, startY + 12);

  doc
    .font('Helvetica')
    .fontSize(14)
    .fillColor(primaryColor)
    .text(`${totalRuns}`, 70, startY + 32)
    .fillColor(greenColor)
    .text(`${passedRuns}`, 170, startY + 32)
    .fillColor(redColor)
    .text(`${failedRuns}`, 270, startY + 32)
    .fillColor('#F59E0B') // Amber
    .text(`${errorRuns}`, 370, startY + 32)
    .fillColor(darkTextColor)
    .text(`${successRate}%`, 450, startY + 32);

  doc.moveDown(4);

  // --- DETAILED EXECUTION LIST ---
  doc
    .fillColor(darkTextColor)
    .font('Helvetica-Bold')
    .fontSize(16)
    .text('Recent Test Executions', 50);
  
  doc.moveDown(0.5);

  // Table Headers
  const tableTop = doc.y;
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(darkTextColor)
    .text('Test Case', 50, tableTop)
    .text('Type', 250, tableTop)
    .text('Duration', 330, tableTop)
    .text('Status', 420, tableTop)
    .text('Date', 480, tableTop);

  doc.strokeColor(grayColor).lineWidth(1).moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();

  let currentY = tableTop + 22;

  // Print executions
  executions.slice(0, 15).forEach((exec) => {
    // Add page if needed
    if (currentY > 730) {
      doc.addPage();
      currentY = 50;
    }

    const testTitle = exec.testCase?.title || 'Unknown Test';
    const type = exec.testCase?.type || 'manual';
    const duration = `${(exec.runDuration / 1000).toFixed(2)}s`;
    const status = exec.status.toUpperCase();
    const date = new Date(exec.createdAt).toLocaleDateString();

    const statusColor = exec.status === 'passed' ? greenColor : (exec.status === 'failed' ? redColor : '#F59E0B');

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(darkTextColor)
      .text(testTitle.substring(0, 38), 50, currentY, { width: 190 })
      .text(type, 250, currentY)
      .text(duration, 330, currentY)
      .fillColor(statusColor)
      .text(status, 420, currentY)
      .fillColor(lightTextColor)
      .text(date, 480, currentY);

    currentY += 25;
  });

  // Footer page number
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc
      .fillColor(lightTextColor)
      .fontSize(8)
      .text(
        `Page ${i + 1} of ${pages.count} | AI-Native Test Automation Platform`,
        50,
        785,
        { align: 'center', width: 495 }
      );
  }

  doc.end();
};

module.exports = {
  generateReportPDF,
};
