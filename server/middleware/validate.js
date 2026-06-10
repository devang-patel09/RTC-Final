const { AppError } = require('../utils/errors');

const validate = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return next(new AppError(errors[0].message, 400));
      }
      req.validatedBody = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.query);
      if (!result.success) {
        const errors = result.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return next(new AppError(errors[0].message, 400));
      }
      req.validatedQuery = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { validate, validateQuery };
