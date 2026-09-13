const Joi = require('joi');

const validateSignup = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(50).required().messages({
      'string.empty': 'Name cannot be empty',
      'string.min': 'Name should be at least 2 characters long',
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Please enter a valid email address',
      'string.empty': 'Email cannot be empty',
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.empty': 'Password cannot be empty',
    }),
    role: Joi.string().valid('user', 'admin').default('user'),
  });

  return schema.validate(data);
};

const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please enter a valid email address',
      'string.empty': 'Email cannot be empty',
    }),
    password: Joi.string().required().messages({
      'string.empty': 'Password cannot be empty',
    }),
  });

  return schema.validate(data);
};

module.exports = { validateSignup, validateLogin };
