import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

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
    const { userId } = await auth()
    
    if (!userId) {
      console.log('🔒 Unauthorized: No user ID found')
      return NextResponse.json(
        { data: [], error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const connectorId = searchParams.get('connectorId')

    if (!connectorId) {
      return NextResponse.json(
        { data: [], error: 'connectorId query parameter is required' },
        { status: 400 }
      )
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
      return NextResponse.json(
        { data: [], error: 'Connector not found' },
        { status: 404 }
      )
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
    return NextResponse.json(
      { data: [], error: error.message },
      { status: 500 }
    )
  }
}

