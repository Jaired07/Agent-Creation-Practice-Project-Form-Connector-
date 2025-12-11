import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { rateLimit } from '@/lib/rateLimit';
import { validateSubmission } from '@/lib/validation';
import { destinationHandlers } from '@/lib/destinations';
import {
  createRateLimitError,
  createValidationError,
  createNotFoundError,
  createErrorResponse
} from '@/lib/apiErrors';

/**
 * Processes a form submission and routes it to configured destinations
 * 
 * This endpoint handles form submissions by:
 * 1. Validating rate limits (100 requests per hour per connector)
 * 2. Validating input data (size, field count, types, lengths)
 * 3. Fetching the connector configuration from the database
 * 4. Checking if the connector is active
 * 5. Storing the submission in the database
 * 6. Processing all enabled destinations (email, slack, sms, sheets, webhook)
 * 7. Updating the submission with processing results
 * 
 * **Security Features:**
 * - Rate limiting per connector ID
 * - Input validation (payload size, field count, types, string lengths)
 * - Connector active status check
 * - HTML escaping to prevent XSS attacks
 * 
 * **Request Format:**
 * POST /api/submit/{connectorId}
 * Content-Type: application/json
 * 
 * Body: { "field1": "value1", "field2": "value2", ... }
 * 
 * **Response Format:**
 * Success (200):
 * {
 *   success: true,
 *   submissionId: "uuid",
 *   results: {
 *     email: { success: true },
 *     slack: { success: false, error: "...", timestamp: "..." }
 *   }
 * }
 * 
 * Error (400/403/404/429/500):
 * {
 *   error: "User-friendly message",
 *   code: "ERROR_CODE",
 *   timestamp: "ISO timestamp",
 *   ...additional fields
 * }
 * 
 * @param {Request} request - Next.js request object containing form submission data
 * @param {Object} context - Next.js route context
 * @param {Object} context.params - Route parameters (must be awaited in Next.js 15+)
 * @param {string} context.params.connectorId - UUID of the connector to submit to
 * @returns {Promise<NextResponse>} JSON response with submission results or error details
 * @throws {Error} If request parsing fails or unexpected errors occur
 * 
 * @example
 * // POST /api/submit/abc-123-def-456
 * // Body: { "name": "John Doe", "email": "john@example.com", "message": "Hello" }
 * // 
 * // Response:
 * // {
 * //   success: true,
 * //   submissionId: "sub-789",
 * //   results: { email: { success: true } }
 * // }
 */
export async function POST(request, context) {
  try {
    // In Next.js 15+, params must be awaited
    const { connectorId } = await context.params;
    const formData = await request.json();

    console.log('📥 Received submission for connector:', connectorId);
    console.log('📋 Form data:', formData);

    // SECURITY CHECK 1: Rate limiting
    const rateLimitResult = rateLimit(connectorId, 100, 3600000); // 100 requests per hour
    if (!rateLimitResult.allowed) {
      console.log('🚫 Rate limit exceeded for connector:', connectorId);
      return createRateLimitError(rateLimitResult.resetTime, rateLimitResult.remaining);
    }
    console.log('✅ Rate limit check passed');

    // SECURITY CHECK 2: Input validation
    try {
      validateSubmission(formData);
      console.log('✅ Input validation passed');
    } catch (validationError) {
      console.error('❌ Input validation failed:', validationError.message);
      return createValidationError(validationError.message);
    }

    // 1. Look up the connector
    const { data: connector, error: connectorError } = await supabase
      .from('connectors')
      .select('*')
      .eq('id', connectorId)
      .single();

    if (connectorError || !connector) {
      console.error('❌ Connector not found:', connectorError);
      return createNotFoundError('Connector');
    }

    console.log('✅ Connector found:', connector.name);

    // SECURITY CHECK 3: Connector active status check
    if (connector.is_active !== true) {
      console.log('🚫 Connector is not active:', connectorId);
      return createErrorResponse(
        'This connector is currently inactive',
        'CONNECTOR_INACTIVE',
        403
      );
    }
    console.log('✅ Connector is active');

    // 3. Store submission in database
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert({
        connector_id: connectorId,
        form_data: formData,
        destinations_sent: {},
        errors: null
      })
      .select()
      .single();

    if (submissionError) {
      console.error('❌ Error storing submission:', submissionError);
      return createErrorResponse(
        'Failed to store submission',
        'SUBMISSION_STORAGE_ERROR',
        500,
        { details: submissionError.message }
      );
    }

    console.log('✅ Submission stored with ID:', submission.id);

    // 4. Process destinations
    const destinations = connector.destinations || [];
    console.log('🔍 Raw destinations from database:', JSON.stringify(destinations, null, 2));
    console.log('🔍 Destinations type:', typeof destinations);
    console.log('🔍 Is array?:', Array.isArray(destinations));
    console.log('🔍 Length:', destinations.length);
    
    const results = {};

    // Flatten if double nested (fix for [[...]] format)
    let flatDestinations = destinations;
    if (destinations.length > 0 && Array.isArray(destinations[0])) {
      console.log('⚠️  Detected double-nested array, flattening...');
      flatDestinations = destinations[0];
    }

    console.log('🔍 Processing destinations:', JSON.stringify(flatDestinations, null, 2));

    for (const destination of flatDestinations) {
      const handler = destinationHandlers[destination.type];
      
      if (!handler) {
        console.log(`⚠️  Unknown destination type: ${destination.type}`);
        continue;
      }
      
      if (!destination.enabled) {
        console.log(`⏭️  Skipping disabled destination: ${destination.type}`);
        continue;
      }
      
      console.log(`🔄 Processing ${destination.type} destination...`);
      
      try {
        await handler(destination, formData, connector);
        results[destination.type] = { success: true };
        console.log(`✅ ${destination.type} processed successfully`);
      } catch (error) {
        results[destination.type] = { 
          success: false, 
          error: error.message,
          timestamp: new Date().toISOString()
        };
        console.error(`❌ ${destination.type} failed:`, error.message);
      }
    }

    // 5. Update submission with results
    console.log('💾 Updating submission with results:', results);
    await supabase
      .from('submissions')
      .update({
        destinations_sent: results
      })
      .eq('id', submission.id);

    console.log('✅ Submission processed successfully');

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      results
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return createErrorResponse(
      'Internal server error',
      'INTERNAL_SERVER_ERROR',
      500,
      { details: error.message }
    );
  }
}

/**
 * Handles CORS preflight requests
 * 
 * This function responds to OPTIONS requests with appropriate CORS headers
 * to allow cross-origin requests from web forms. It enables:
 * - All origins (*)
 * - Common HTTP methods (GET, POST, PUT, DELETE, OPTIONS)
 * - Content-Type and Authorization headers
 * 
 * @param {Request} request - Next.js request object (unused but required by Next.js)
 * @returns {NextResponse} Response with CORS headers and 200 status
 * 
 * @example
 * // OPTIONS /api/submit/abc-123
 * // Response: 200 OK with CORS headers
 */
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
