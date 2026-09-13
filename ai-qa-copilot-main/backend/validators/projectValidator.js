const Joi = require('joi');

const validateProject = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
      'string.empty': 'Project name is required',
      'string.min': 'Project name should be at least 2 characters',
    }),
    description: Joi.string().max(500).allow('').optional(),
  });

  return schema.validate(data);
};

module.exports = { validateProject };
