const mongoose = require('mongoose');

const assertionResultSchema = new mongoose.Schema({
  assertion: { type: String, required: true },
  passed: { type: Boolean, required: true },
  error: { type: String },
});

const testExecutionSchema = new mongoose.Schema(
  {
    testCase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestCase',
      required: true,
    },
    status: {
      type: String,
      enum: ['passed', 'failed', 'error'],
      required: true,
    },
    runDuration: {
      type: Number, // in ms
      required: true,
    },
    logs: {
      type: String,
      default: '',
    },
    errorMsg: {
      type: String,
    },
    screenshotPath: {
      type: String, // local path or base64 data URL, we can store /uploads/screenshots/name.png
    },
    responseStatus: {
      type: Number,
    },
    responseTime: {
      type: Number,
    },
    responseBody: {
      type: String,
    },
    assertionsResult: [assertionResultSchema],
    executedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const TestExecution = mongoose.model('TestExecution', testExecutionSchema);
module.exports = TestExecution;
