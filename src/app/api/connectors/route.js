import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { randomUUID } from 'crypto'
import { requireAuth } from '@/lib/auth'
import { createErrorResponse, createValidationError } from '@/lib/apiErrors'

/**
 * GET all connectors for the authenticated user
 * 
 * Fetches all connectors owned by the current user.
 * Requires authentication - returns 401 if not authenticated.
 * 
 * @returns {Promise<NextResponse>} JSON response with connectors array
 */
export async function GET() {
  try {
    // Get authenticated user ID
    const authResult = await requireAuth()
    if (!('userId' in authResult)) {
      return authResult // Return unauthorized error response
    }
    const { userId } = authResult

    console.log(`📊 Fetching connectors for user: ${userId}`)

    // Try RPC first (bypasses schema cache)
    let { data, error } = await supabase.rpc('get_all_connectors')

    // If RPC doesn't exist, fall back to direct query with user_id filter
    if (error && error.message.includes('get_all_connectors')) {
      const result = await supabase
        .from('connectors')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      data = result.data
      error = result.error
    } else if (data) {
      // If RPC succeeded, filter by user_id in memory (RPC might not support filtering)
      const connectors = Array.isArray(data) ? data : (data || [])
      data = connectors.filter(connector => connector.user_id === userId)
    }

    if (error) throw error

    // RPC returns JSON, direct query returns array
    const connectors = Array.isArray(data) ? data : (data || [])
    
    console.log(`✅ Found ${connectors.length} connector(s) for user ${userId}`)

    return NextResponse.json({ data: connectors, error: null })
  } catch (error) {
    console.error('❌ GET connectors error:', error)
    return createErrorResponse(
      'Failed to fetch connectors',
      'FETCH_ERROR',
      500,
      { details: error.message }
    )
  }
}

/**
 * POST create new connector
 * 
 * Creates a new connector for the authenticated user.
 * Requires authentication - returns 401 if not authenticated.
 * 
 * @param {Request} request - Request object with connector data
 * @returns {Promise<NextResponse>} JSON response with created connector
 */
export async function POST(request) {
  try {
    // Get authenticated user ID
    const authResult = await requireAuth()
    if (!('userId' in authResult)) {
      return authResult // Return unauthorized error response
    }
    const { userId } = authResult

    const body = await request.json()
    const { name, description, destinations } = body

    if (!name) {
      return createValidationError('Name is required', 'name')
    }

    console.log(`📝 Creating connector "${name}" for user: ${userId}`)

    // Generate unique webhook URL
    const webhookId = randomUUID()
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const webhookUrl = `${baseUrl}/api/submit/${webhookId}`

    // Try RPC first (bypasses schema cache completely)
    let { data, error } = await supabase.rpc('create_connector', {
      p_name: name,
      p_description: description || null,
      p_webhook_url: webhookUrl,
      p_webhook_id: webhookId,
      p_destinations: destinations || [],
      p_user_id: userId
    })

    // If RPC doesn't exist, fall back to direct insert
    if (error && error.message.includes('create_connector')) {
      console.log('⚠️  RPC not found, falling back to direct insert')
      const result = await supabase
        .from('connectors')
        .insert([{
          name,
          description: description || null,
          webhook_url: webhookUrl,
          webhook_id: webhookId,
          destinations: destinations || [],
          user_id: userId,
          created_at: new Date().toISOString(),
        }])
        .select()
        .single()
      
      data = result.data
      error = result.error
    }

    // Handle schema cache errors with helpful message
    if (error && error.message && error.message.includes('schema cache')) {
      return createErrorResponse(
        'Database schema cache error. Please run setup-supabase-complete.sql in your Supabase SQL Editor, then restart your Supabase project (Settings → General → Restart Project).',
        'SCHEMA_CACHE_ERROR',
        500
      )
    }

    if (error) throw error

    return NextResponse.json({ data, error: null }, { status: 201 })
  } catch (error) {
    console.error('POST connector error:', error)
    return createErrorResponse(
      'Failed to create connector',
      'CREATE_ERROR',
      500,
      { details: error.message }
    )
  }
}
