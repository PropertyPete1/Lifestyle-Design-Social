// Standardized route handler utilities and error handling
import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

// Standard API response interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// Standard error response interface
export interface ApiError {
  success: false;
  error: string;
  details?: string;
  timestamp: string;
  statusCode: number;
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(error: string, details?: string, statusCode: number = 500): ApiError {
  return {
    success: false,
    error,
    details,
    timestamp: new Date().toISOString(),
    statusCode,
  };
}

/**
 * Standardized async route handler wrapper with error handling
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch((error: any) => {
      logger.error('Route handler error:', error);
      
      // Don't send response if headers already sent
      if (res.headersSent) {
        return next(error);
      }

      const statusCode = error.statusCode || error.status || 500;
      const errorMessage = error.message || 'Internal server error';
      
      res.status(statusCode).json(createErrorResponse(
        errorMessage,
        process.env.NODE_ENV === 'development' ? error.stack : undefined,
        statusCode
      ));
    });
  };
}

/**
 * Validation error handler
 */
export function handleValidationErrors(errors: any[]): ApiError {
  const errorMessages = errors.map(err => err.msg || err.message).join(', ');
  return createErrorResponse('Validation failed', errorMessages, 400);
}

/**
 * Database error handler
 */
export function handleDatabaseError(error: any): ApiError {
  logger.error('Database error:', error);
  
  // Don't expose internal database errors in production
  if (process.env.NODE_ENV === 'production') {
    return createErrorResponse('Database operation failed', undefined, 500);
  }
  
  return createErrorResponse('Database error', error.message, 500);
}

/**
 * Authentication error handler
 */
export function handleAuthError(message: string = 'Authentication required'): ApiError {
  return createErrorResponse(message, undefined, 401);
}

/**
 * Authorization error handler
 */
export function handleAuthorizationError(message: string = 'Insufficient permissions'): ApiError {
  return createErrorResponse(message, undefined, 403);
}

/**
 * Not found error handler
 */
export function handleNotFoundError(resource: string = 'Resource'): ApiError {
  return createErrorResponse(`${resource} not found`, undefined, 404);
}

/**
 * Rate limit error handler
 */
export function handleRateLimitError(): ApiError {
  return createErrorResponse('Too many requests', 'Please try again later', 429);
}

/**
 * Service unavailable error handler
 */
export function handleServiceUnavailableError(service: string): ApiError {
  return createErrorResponse(
    'Service temporarily unavailable', 
    `${service} is currently unavailable`,
    503
  );
}

/**
 * Middleware to set standard response headers
 */
export function setStandardHeaders(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add request ID for tracing
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', requestId);
  
  next();
}

/**
 * Middleware to log all requests
 */
export function logRequests(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const requestId = res.getHeader('X-Request-ID');
  
  logger.info(`🌐 ${req.method} ${req.path}`, {
    requestId,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    query: req.query,
  });
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`✅ ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`, {
      requestId,
      statusCode: res.statusCode,
      duration,
    });
  });
  
  next();
}

/**
 * Pagination helper
 */
export function getPaginationParams(req: Request): { limit: number; offset: number; page: number } {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100); // Max 100 items
  const page = Math.max(parseInt(req.query.page as string) || 1, 1); // Min page 1
  const offset = (page - 1) * limit;
  
  return { limit, offset, page };
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  message?: string
): ApiResponse<{
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {
  const totalPages = Math.ceil(total / limit);
  
  return createSuccessResponse({
    items: data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }, message);
} 