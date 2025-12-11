import { NextResponse } from 'next/server';

/**
 * API error response helper functions
 * 
 * This module provides standardized error response creation functions
 * to ensure consistent error formatting across all API endpoints.
 * All error responses follow the same structure as success responses:
 * - data: Always null for error responses (consistent with success format)
 * - error: User-friendly error message
 * - code: Machine-readable error code
 * - timestamp: ISO timestamp of when the error occurred
 * 
 * This ensures clients can always check `response.data` regardless of success/error.
 */

/**
 * Creates a standardized error response
 * 
 * Returns a NextResponse with a consistent error format that includes
 * user-friendly messages, machine-readable codes, and timestamps.
 * Includes `data: null` to maintain consistency with success responses.
 * 
 * @param {string} error - User-friendly error message
 * @param {string} code - Machine-readable error code (e.g., 'VALIDATION_ERROR')
 * @param {number} [status=500] - HTTP status code (default: 500)
 * @param {Object} [additionalFields] - Additional fields to include in the response
 * @returns {NextResponse} Next.js response object with error JSON
 * 
 * @example
 * return createErrorResponse(
 *   'Invalid input provided',
 *   'VALIDATION_ERROR',
 *   400,
 *   { field: 'email' }
 * );
 * // Returns: { data: null, error: 'Invalid input provided', code: 'VALIDATION_ERROR', field: 'email', timestamp: '...' }
 */
export function createErrorResponse(error, code, status = 500, additionalFields = {}) {
  return NextResponse.json(
    {
      data: null,
      error,
      code,
      timestamp: new Date().toISOString(),
      ...additionalFields
    },
    { status }
  );
}

/**
 * Creates a validation error response (400 Bad Request)
 * 
 * Used when request data fails validation checks.
 * Optionally includes the field name that failed validation.
 * 
 * @param {string} message - Validation error message
 * @param {string|null} [field=null] - Name of the field that failed validation
 * @returns {NextResponse} Next.js response with 400 status
 * 
 * @example
 * return createValidationError('Email is required', 'email');
 * // Returns: { data: null, error: 'Email is required', code: 'VALIDATION_ERROR', field: 'email', timestamp: '...' }
 */
export function createValidationError(message, field = null) {
  const response = {
    data: null,
    error: message,
    code: 'VALIDATION_ERROR',
    timestamp: new Date().toISOString()
  };

  if (field) {
    response.field = field;
  }

  return NextResponse.json(response, { status: 400 });
}

/**
 * Creates a rate limit error response (429 Too Many Requests)
 * 
 * Used when a client exceeds the allowed request rate.
 * Includes reset time and remaining request count to help clients
 * implement proper backoff strategies.
 * 
 * @param {number} resetTime - Unix timestamp (ms) when the rate limit resets
 * @param {number} [remaining=0] - Number of requests remaining in the current window
 * @returns {NextResponse} Next.js response with 429 status
 * 
 * @example
 * return createRateLimitError(Date.now() + 3600000, 0);
 * // Returns: { data: null, error: '...', code: 'RATE_LIMIT_EXCEEDED', resetTime: ..., remaining: 0, timestamp: '...' }
 */
export function createRateLimitError(resetTime, remaining = 0) {
  return NextResponse.json(
    {
      data: null,
      error: 'Rate limit exceeded. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      timestamp: new Date().toISOString(),
      resetTime,
      remaining
    },
    { status: 429 }
  );
}

/**
 * Creates a not found error response (404 Not Found)
 * 
 * Used when a requested resource cannot be found.
 * 
 * @param {string} [resource='Resource'] - Name of the resource that was not found
 * @returns {NextResponse} Next.js response with 404 status
 * 
 * @example
 * return createNotFoundError('Connector');
 * // Returns: { data: null, error: 'Connector not found', code: 'NOT_FOUND', timestamp: '...' }
 */
export function createNotFoundError(resource = 'Resource') {
  return NextResponse.json(
    {
      data: null,
      error: `${resource} not found`,
      code: 'NOT_FOUND',
      timestamp: new Date().toISOString()
    },
    { status: 404 }
  );
}

/**
 * Creates an unauthorized error response (401 Unauthorized)
 * 
 * Used when authentication is required but not provided or invalid.
 * 
 * @param {string} [message='Unauthorized'] - Custom error message
 * @returns {NextResponse} Next.js response with 401 status
 * 
 * @example
 * return createUnauthorizedError();
 * // Returns: { data: null, error: 'Unauthorized', code: 'UNAUTHORIZED', timestamp: '...' }
 */
export function createUnauthorizedError(message = 'Unauthorized') {
  return NextResponse.json(
    {
      data: null,
      error: message,
      code: 'UNAUTHORIZED',
      timestamp: new Date().toISOString()
    },
    { status: 401 }
  );
}

