import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { createErrorResponse, createNotFoundError, createValidationError } from '@/lib/apiErrors'

/**
 * GET submissions for a connector
 * 
 * Fetches all submissions for a specific connector.
 * Requires authentication and verifies user owns the connector.
 * 
 * Query parameters:
 * - connectorId: UUID of the connector
 * 
 * @param {Request} request - Request object with query parameters
 * @returns {Promise<NextResponse>} JSON response with submissions array
 */
export async function GET(request) {
  try {
    // Get authenticated user ID
    const authResult = await requireAuth()
    if (!('userId' in authResult)) {
      return authResult // Return unauthorized error response
    }
    const { userId } = authResult

    const { searchParams } = new URL(request.url)
    const connectorId = searchParams.get('connectorId')

    if (!connectorId) {
      return createValidationError('connectorId query parameter is required', 'connectorId')
    }

    console.log(`📊 Fetching submissions for connector ${connectorId} (user: ${userId})`)

    // First verify the connector exists and belongs to the user
    const { data: connector, error: connectorError } = await supabase
      .from('connectors')
      .select('id, user_id')
      .eq('id', connectorId)
      .eq('user_id', userId)
      .single()

    if (connectorError || !connector) {
      console.log(`❌ Connector ${connectorId} not found or not owned by user ${userId}`)
      return createNotFoundError('Connector')
    }

    // Fetch submissions for this connector
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('*')
      .eq('connector_id', connectorId)
      .order('created_at', { ascending: false })

    if (submissionsError) {
      console.error('❌ Error fetching submissions:', submissionsError)
      throw submissionsError
    }

    console.log(`✅ Found ${submissions?.length || 0} submission(s) for connector ${connectorId}`)

    return NextResponse.json({ 
      data: submissions || [], 
      error: null 
    })
  } catch (error) {
    console.error('❌ GET submissions error:', error)
    return createErrorResponse(
      'Failed to fetch submissions',
      'FETCH_ERROR',
      500,
      { details: error.message }
    )
  }
}

