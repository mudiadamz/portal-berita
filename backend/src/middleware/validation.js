/**
 * Validation Middleware
 * Request validation using Joi schemas
 */

const { validate } = require('../utils/validation');
const { sendValidationError } = require('../utils/response');

/**
 * Create validation middleware
 * @param {object} schema - Joi validation schema
 * @param {string} property - Request property to validate (body, query, params)
 * @returns {function} - Express middleware function
 */
const validateRequest = (schema, property = 'body') => {
  return (req, res, next) => {
    const { isValid, errors, data } = validate(req[property], schema);
    
    if (!isValid) {
      return sendValidationError(res, errors);
    }
    
    // Replace request property with validated data
    req[property] = data;
    next();
  };
};

/**
 * Validate request body
 * @param {object} schema - Joi validation schema
 * @returns {function} - Express middleware function
 */
const validateBody = (schema) => {
  return validateRequest(schema, 'body');
};

/**
 * Validate query parameters
 * @param {object} schema - Joi validation schema
 * @returns {function} - Express middleware function
 */
const validateQuery = (schema) => {
  return validateRequest(schema, 'query');
};

/**
 * Validate route parameters
 * @param {object} schema - Joi validation schema
 * @returns {function} - Express middleware function
 */
const validateParams = (schema) => {
  return validateRequest(schema, 'params');
};

module.exports = {
  validateRequest,
  validateBody,
  validateQuery,
  validateParams
};
