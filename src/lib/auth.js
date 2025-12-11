import { auth } from '@clerk/nextjs/server';
import { createUnauthorizedError } from './apiErrors';

/**
 * Authentication utility module
 * 
 * This module provides helper functions for handling authentication
 * in API routes to reduce code duplication and ensure consistency.
 */

/**
 * Gets the authenticated user ID or returns an unauthorized error response
 * 
 * This function centralizes authentication checking logic used across
 * multiple API routes. It checks for a valid user ID and returns either
 * the userId or an error response that can be returned directly.
 * 
 * @returns {Promise<{userId: string}|NextResponse>} 
 *   - If authenticated: { userId: string }
 *   - If not authenticated: NextResponse with 401 status
 * 
 * @example
 * const authResult = await requireAuth();
 * if ('userId' in authResult) {
 *   const { userId } = authResult;
 *   // User is authenticated, proceed with request
 * } else {
 *   return authResult; // Return the error response
 * }
 */
export async function requireAuth() {
  const { userId } = await auth();
  
  if (!userId) {
    console.log('🔒 Unauthorized: No user ID found');
    return createUnauthorizedError();
  }
  
  return { userId };
}

