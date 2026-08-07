/**
 * Standard API Response Utilities
 * Follows WisWits API response format
 */

export const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    statusCode,
    message,
    data,
  });
};

export const errorResponse = (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    statusCode,
    message,
  };
  
  if (errors) {
    response.errors = Array.isArray(errors) ? errors : [errors];
  }
  
  return res.status(statusCode).json(response);
};

export const validationErrorResponse = (res, errors, message = 'Validation failed') => {
  return errorResponse(res, message, 400, errors);
};

export const notFoundResponse = (res, entity = 'Resource') => {
  return errorResponse(res, `${entity} not found`, 404);
};

export const unauthorizedResponse = (res, message = 'Unauthorized') => {
  return errorResponse(res, message, 401);
};

export const forbiddenResponse = (res, message = 'Forbidden') => {
  return errorResponse(res, message, 403);
};

export default {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
};