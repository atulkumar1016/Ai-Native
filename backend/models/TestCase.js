const mongoose = require('mongoose');

const assertionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['status_code', 'response_time', 'json_contains', 'header_exists', 'text_contains'],
  },
  property: { type: String }, // e.g. JSON path "user.id" or Header name "Content-Type"
  value: { type: String },    // Expected value
});

const apiConfigSchema = new mongoose.Schema({
  url: { type: String, trim: true },
  method: { type: String, enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], default: 'GET' },
  headers: { type: Map, of: String, default: {} },
  body: { type: String, default: '' },
  expectedStatus: { type: Number, default: 200 },
  assertions: [assertionSchema],
});

const testCaseSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    steps: [{
      type: String,
    }],
    assertions: [{
      type: String,
    }],
    tags: [{
      type: String,
    }],
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    type: {
      type: String,
      enum: ['manual', 'api', 'playwright'],
      default: 'manual',
    },
    code: {
      type: String, // playwright test code
    },
    apiConfig: {
      type: apiConfigSchema,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const TestCase = mongoose.model('TestCase', testCaseSchema);
module.exports = TestCase;
