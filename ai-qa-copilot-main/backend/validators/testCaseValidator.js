const Joi = require('joi');

const validateTestCase = (data) => {
  const assertionSchema = Joi.object({
    type: Joi.string().valid('status_code', 'response_time', 'json_contains', 'header_exists', 'text_contains').required(),
    property: Joi.string().allow('').optional(),
    value: Joi.string().allow('').optional(),
  });

  const apiConfigSchema = Joi.object({
    url: Joi.string().uri().required().messages({
      'string.uri': 'Please provide a valid API URL',
      'any.required': 'API URL is required for API tests',
    }),
    method: Joi.string().valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH').default('GET'),
    headers: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
    body: Joi.string().allow('').optional(),
    expectedStatus: Joi.number().integer().min(100).max(599).default(200),
    assertions: Joi.array().items(assertionSchema).optional(),
  });

  const schema = Joi.object({
    project: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
      'string.pattern.base': 'Invalid project ID format',
    }),
    title: Joi.string().min(3).max(150).required().messages({
      'string.empty': 'Test case title is required',
    }),
    description: Joi.string().max(1000).allow('').optional(),
    steps: Joi.array().items(Joi.string()).optional(),
    assertions: Joi.array().items(Joi.string()).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    priority: Joi.string().valid('high', 'medium', 'low').default('medium'),
    type: Joi.string().valid('manual', 'api', 'playwright').default('manual'),
    code: Joi.string().allow('').optional(),
    apiConfig: Joi.alternatives().conditional('type', {
      is: 'api',
      then: apiConfigSchema.required(),
      otherwise: apiConfigSchema.optional().allow(null),
    }),
  });

  return schema.validate(data);
};

module.exports = { validateTestCase };
