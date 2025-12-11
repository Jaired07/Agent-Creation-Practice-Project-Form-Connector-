/**
 * Rate limiting module for API endpoints
 * 
 * This module implements an in-memory rate limiting system using a sliding window
 * approach. It tracks requests per identifier (e.g., connector ID, IP address)
 * and enforces limits within a specified time window.
 * 
 * The rate limiter uses a Map to store request timestamps for each identifier.
 * When the Map exceeds 1000 items, it automatically cleans up expired entries
 * to prevent memory leaks.
 */

// In-memory storage for rate limit tracking
// Structure: Map<identifier, Array<timestamp>>
const requestMap = new Map();

// Cleanup threshold - when Map exceeds this size, expired entries are removed
const CLEANUP_THRESHOLD = 1000;

/**
 * Rate limits requests for a given identifier
 * 
 * This function implements a sliding window rate limiting algorithm:
 * 1. Retrieves or creates a timestamp array for the identifier
 * 2. Filters out timestamps outside the current window
 * 3. Checks if adding a new request would exceed the limit
 * 4. If allowed, adds the current timestamp to the array
 * 5. Performs cleanup if the Map exceeds the cleanup threshold
 * 
 * @param {string} identifier - Unique identifier for rate limiting (e.g., connector ID, IP address)
 * @param {number} maxRequests - Maximum number of requests allowed in the window (default: 100)
 * @param {number} windowMs - Time window in milliseconds (default: 3600000 = 1 hour)
 * @returns {Object} Rate limit result object
 * @returns {boolean} returns.allowed - Whether the request is allowed
 * @returns {number} returns.remaining - Number of requests remaining in the window
 * @returns {number} returns.resetTime - Unix timestamp (ms) when the window resets
 * 
 * @example
 * const result = rateLimit('connector-123', 100, 3600000);
 * if (!result.allowed) {
 *   // Rate limit exceeded
 *   console.log(`Rate limit exceeded. Reset at: ${new Date(result.resetTime)}`);
 * }
 */
export function rateLimit(identifier, maxRequests = 100, windowMs = 3600000) {
  const now = Date.now();
  
  // Get or create timestamp array for this identifier
  let timestamps = requestMap.get(identifier);
  
  if (!timestamps) {
    timestamps = [];
    requestMap.set(identifier, timestamps);
  }

  // Filter out timestamps outside the current window
  const windowStart = now - windowMs;
  const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
  
  // Update the array with only valid timestamps
  requestMap.set(identifier, validTimestamps);

  // Check if adding this request would exceed the limit
  const requestCount = validTimestamps.length;
  const allowed = requestCount < maxRequests;

  if (allowed) {
    // Add current timestamp
    validTimestamps.push(now);
    requestMap.set(identifier, validTimestamps);
  }

  // Calculate remaining requests
  const remaining = Math.max(0, maxRequests - requestCount - (allowed ? 0 : 1));
  
  // Calculate reset time (oldest timestamp + window duration)
  const oldestTimestamp = validTimestamps.length > 0 
    ? Math.min(...validTimestamps)
    : now;
  const resetTime = oldestTimestamp + windowMs;

  // Perform cleanup if Map exceeds threshold
  if (requestMap.size > CLEANUP_THRESHOLD) {
    cleanupExpiredEntries(windowMs);
  }

  const result = {
    allowed,
    remaining,
    resetTime
  };

  console.log(
    `🚦 Rate limit check for "${identifier}": ${requestCount + (allowed ? 1 : 0)}/${maxRequests} requests, ` +
    `${remaining} remaining, reset at ${new Date(resetTime).toISOString()}`
  );

  return result;
}

/**
 * Cleans up expired entries from the request Map
 * 
 * This function iterates through all entries and removes those that have
 * no valid timestamps within the current window. This prevents memory leaks
 * when many identifiers are tracked.
 * 
 * @param {number} windowMs - Time window in milliseconds
 * @private
 */
function cleanupExpiredEntries(windowMs) {
  const now = Date.now();
  const windowStart = now - windowMs;
  let cleanedCount = 0;

  for (const [identifier, timestamps] of requestMap.entries()) {
    // Filter to keep only valid timestamps
    const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
    
    if (validTimestamps.length === 0) {
      // No valid timestamps, remove the entry
      requestMap.delete(identifier);
      cleanedCount++;
    } else {
      // Update with only valid timestamps
      requestMap.set(identifier, validTimestamps);
    }
  }

  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} expired rate limit entries`);
  }
}

/**
 * Resets rate limit for a specific identifier
 * Useful for testing or manual reset scenarios
 * 
 * @param {string} identifier - Identifier to reset
 */
export function resetRateLimit(identifier) {
  requestMap.delete(identifier);
  console.log(`🔄 Rate limit reset for "${identifier}"`);
}

/**
 * Gets current rate limit status for an identifier without incrementing
 * Useful for checking status without consuming a request
 * 
 * @param {string} identifier - Identifier to check
 * @param {number} maxRequests - Maximum number of requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object} Rate limit status object (same format as rateLimit)
 */
export function getRateLimitStatus(identifier, maxRequests = 100, windowMs = 3600000) {
  const now = Date.now();
  const timestamps = requestMap.get(identifier) || [];
  const windowStart = now - windowMs;
  const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
  
  const requestCount = validTimestamps.length;
  const remaining = Math.max(0, maxRequests - requestCount);
  
  const oldestTimestamp = validTimestamps.length > 0 
    ? Math.min(...validTimestamps)
    : now;
  const resetTime = oldestTimestamp + windowMs;

  return {
    allowed: requestCount < maxRequests,
    remaining,
    resetTime
  };
}

