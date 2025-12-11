import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { createErrorResponse, createNotFoundError } from '@/lib/apiErrors'

/**
 * GET single connector
 * 
 * Fetches a single connector by ID. Only returns connectors owned by the authenticated user.
 * Requires authentication - returns 401 if not authenticated, 404 if connector not found or not owned by user.
 * 
 * @param {Request} request - Request object
 * @param {Object} context - Route context
 * @param {Object} context.params - Route parameters
 * @param {string} context.params.id - Connector ID
 * @returns {Promise<NextResponse>} JSON response with connector data
 */
export async function GET(request, { params }) {
  try {
    // Get authenticated user ID
    const authResult = await requireAuth()
    if (!('userId' in authResult)) {
      return authResult // Return unauthorized error response
    }
    const { userId } = authResult

    const { id } = await params

    console.log(`📊 Fetching connector ${id} for user: ${userId}`)

    const { data, error } = await supabase
      .from('connectors')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned (connector not found or not owned by user)
        console.log(`❌ Connector ${id} not found or not owned by user ${userId}`)
        return createNotFoundError('Connector')
      }
      throw error
    }

    console.log(`✅ Found connector ${id}`)
    return NextResponse.json({ data, error: null })
  } catch (error) {
    console.error('❌ GET connector error:', error)
    return createErrorResponse(
      'Failed to fetch connector',
      'FETCH_ERROR',
      500,
      { details: error.message }
    )
  }
}

/**
 * PUT update connector
 * 
 * Updates a connector. Only allows updating connectors owned by the authenticated user.
 * Requires authentication - returns 401 if not authenticated, 404 if connector not found or not owned by user.
 * 
 * @param {Request} request - Request object with update data
 * @param {Object} context - Route context
 * @param {Object} context.params - Route parameters
 * @param {string} context.params.id - Connector ID
 * @returns {Promise<NextResponse>} JSON response with updated connector
 */
export async function PUT(request, { params }) {
  try {
    // Get authenticated user ID
    const authResult = await requireAuth()
    if (!('userId' in authResult)) {
      return authResult // Return unauthorized error response
    }
    const { userId } = authResult

    const { id } = await params
    const body = await request.json()
    const { name, description, destinations, is_active } = body

    console.log(`📝 Updating connector ${id} for user: ${userId}`)

    // First verify the connector exists and belongs to the user
    const { data: existingConnector, error: checkError } = await supabase
      .from('connectors')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (checkError || !existingConnector) {
      console.log(`❌ Connector ${id} not found or not owned by user ${userId}`)
      return createNotFoundError('Connector')
    }

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (destinations !== undefined) updateData.destinations = destinations
    if (is_active !== undefined) updateData.is_active = is_active
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('connectors')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId) // Double-check ownership
      .select()
      .single()

    if (error) throw error

    console.log(`✅ Connector ${id} updated successfully`)
    return NextResponse.json({ data, error: null })
  } catch (error) {
    console.error('❌ PUT connector error:', error)
    return createErrorResponse(
      'Failed to update connector',
      'UPDATE_ERROR',
      500,
      { details: error.message }
    )
  }
}

/**
 * DELETE connector
 * 
 * Deletes a connector. Only allows deleting connectors owned by the authenticated user.
 * Requires authentication - returns 401 if not authenticated, 404 if connector not found or not owned by user.
 * 
 * @param {Request} request - Request object
 * @param {Object} context - Route context
 * @param {Object} context.params - Route parameters
 * @param {string} context.params.id - Connector ID
 * @returns {Promise<NextResponse>} JSON response with success status
 */
export async function DELETE(request, { params }) {
  try {
    // Get authenticated user ID
    const authResult = await requireAuth()
    if (!('userId' in authResult)) {
      return authResult // Return unauthorized error response
    }
    const { userId } = authResult

    const { id } = await params

    console.log(`🗑️  Deleting connector ${id} for user: ${userId}`)

    // First verify the connector exists and belongs to the user
    const { data: existingConnector, error: checkError } = await supabase
      .from('connectors')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (checkError || !existingConnector) {
      console.log(`❌ Connector ${id} not found or not owned by user ${userId}`)
      return createNotFoundError('Connector')
    }

    const { error } = await supabase
      .from('connectors')
      .delete()
      .eq('id', id)
      .eq('user_id', userId) // Double-check ownership

    if (error) throw error

    console.log(`✅ Connector ${id} deleted successfully`)
    return NextResponse.json({ data: { success: true }, error: null })
  } catch (error) {
    console.error('❌ DELETE connector error:', error)
    return createErrorResponse(
      'Failed to delete connector',
      'DELETE_ERROR',
      500,
      { details: error.message }
    )
  }
}
