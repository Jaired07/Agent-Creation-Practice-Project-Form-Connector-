import { NextResponse } from 'next/server';

/**
 * API error response helper functions
 * 
 * This module provides standardized error response creation functions
 * to ensure consistent error formatting across all API endpoints.
 * All error responses include:
 * - error: User-friendly error message
 * - code: Machine-readable error code
 * - timestamp: ISO timestamp of when the error occurred
 */

/**
 * Creates a standardized error response
 * 
 * Returns a NextResponse with a consistent error format that includes
 * user-friendly messages, machine-readable codes, and timestamps.
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
 */
export function createErrorResponse(error, code, status = 500, additionalFields = {}) {
  return NextResponse.json(
    {
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
 * // Returns: { error: 'Email is required', code: 'VALIDATION_ERROR', field: 'email', timestamp: '...' }
 */
export function createValidationError(message, field = null) {
  const response = {
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
 * // Returns: { error: '...', code: 'RATE_LIMIT_EXCEEDED', resetTime: ..., remaining: 0, timestamp: '...' }
 */
export function createRateLimitError(resetTime, remaining = 0) {
  return NextResponse.json(
    {
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
 * // Returns: { error: 'Connector not found', code: 'NOT_FOUND', timestamp: '...' }
 */
export function createNotFoundError(resource = 'Resource') {
  return NextResponse.json(
    {
      error: `${resource} not found`,
      code: 'NOT_FOUND',
      timestamp: new Date().toISOString()
    },
    { status: 404 }
  );
}

