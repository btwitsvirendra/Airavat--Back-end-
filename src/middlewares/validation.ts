import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Validation error handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

// User registration validation
export const validateUserRegistration = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('full_name').trim().isLength({ min: 2 }).withMessage('Full name is required'),
  body('phone').optional().isMobilePhone('any').withMessage('Valid phone number is required'),
  body('business_name').trim().isLength({ min: 2 }).withMessage('Business name is required'),
  body('can_buy').optional().isBoolean().withMessage('can_buy must be a boolean'),
  body('can_sell').optional().isBoolean().withMessage('can_sell must be a boolean'),
  handleValidationErrors,
];

// User login validation
export const validateUserLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

// Product creation validation
export const validateProductCreation = [
  body('product_name').trim().isLength({ min: 2 }).withMessage('Product name is required'),
  body('category_id').isInt().withMessage('Valid category ID is required'),
  body('base_price').optional().isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
  body('currency_id').optional().isInt().withMessage('Valid currency ID is required'),
  body('price_unit_id').optional().isInt().withMessage('Valid price unit ID is required'),
  handleValidationErrors,
];

// Message validation
export const validateMessage = [
  body('conversation_id').notEmpty().withMessage('Conversation ID is required'),
  body('content').optional().trim().isLength({ max: 5000 }).withMessage('Message content too long'),
  body('message_type').optional().isIn(['text', 'product', 'quote', 'order', 'file', 'image']).withMessage('Invalid message type'),
  handleValidationErrors,
];

// ID parameter validation
export const validateId = [
  param('id').isInt({ min: 1 }).withMessage('Valid ID is required'),
  handleValidationErrors,
];

// Pagination validation
export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
];

