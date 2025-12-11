import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

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
    const { userId } = await auth()
    
    if (!userId) {
      console.log('🔒 Unauthorized: No user ID found')
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

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
        return NextResponse.json(
          { data: null, error: 'Connector not found' },
          { status: 404 }
        )
      }
      throw error
    }

    console.log(`✅ Found connector ${id}`)
    return NextResponse.json({ data, error: null })
  } catch (error) {
    console.error('❌ GET connector error:', error)
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
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
    const { userId } = await auth()
    
    if (!userId) {
      console.log('🔒 Unauthorized: No user ID found')
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

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
      return NextResponse.json(
        { data: null, error: 'Connector not found' },
        { status: 404 }
      )
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
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
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
    const { userId } = await auth()
    
    if (!userId) {
      console.log('🔒 Unauthorized: No user ID found')
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

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
      return NextResponse.json(
        { data: null, error: 'Connector not found' },
        { status: 404 }
      )
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
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }
}
