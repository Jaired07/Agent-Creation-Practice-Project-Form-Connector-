import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { randomUUID } from 'crypto'

// GET all connectors
export async function GET() {
  try {
    // Try RPC first (bypasses schema cache)
    let { data, error } = await supabase.rpc('get_all_connectors')

    // If RPC doesn't exist, fall back to direct query
    if (error && error.message.includes('get_all_connectors')) {
      const result = await supabase
        .from('connectors')
        .select('*')
        .order('created_at', { ascending: false })
      
      data = result.data
      error = result.error
    }

    if (error) throw error

    // RPC returns JSON, direct query returns array
    const connectors = Array.isArray(data) ? data : (data || [])

    return NextResponse.json({ data: connectors, error: null })
  } catch (error) {
    console.error('GET connectors error:', error)
    return NextResponse.json(
      { data: [], error: error.message },
      { status: 500 }
    )
  }
}

// POST create new connector
export async function POST(request) {
  try {
    const body = await request.json()
    const { name, description, destinations } = body

    if (!name) {
      return NextResponse.json(
        { data: null, error: 'Name is required' },
        { status: 400 }
      )
    }

    // Generate unique webhook URL
    const webhookId = randomUUID()
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const webhookUrl = `${baseUrl}/api/webhook/${webhookId}`

    // Try RPC first (bypasses schema cache completely)
    let { data, error } = await supabase.rpc('create_connector', {
      p_name: name,
      p_description: description || null,
      p_webhook_url: webhookUrl,
      p_webhook_id: webhookId,
      p_destinations: destinations || []
    })

    // If RPC doesn't exist, fall back to direct insert
    if (error && error.message.includes('create_connector')) {
      console.log('RPC not found, falling back to direct insert')
      const result = await supabase
        .from('connectors')
        .insert([{
          name,
          description: description || null,
          webhook_url: webhookUrl,
          webhook_id: webhookId,
          destinations: destinations || [],
          created_at: new Date().toISOString(),
        }])
        .select()
        .single()
      
      data = result.data
      error = result.error
    }

    // Handle schema cache errors with helpful message
    if (error && error.message && error.message.includes('schema cache')) {
      return NextResponse.json(
        { 
          data: null, 
          error: 'Database schema cache error. Please run setup-supabase-complete.sql in your Supabase SQL Editor, then restart your Supabase project (Settings → General → Restart Project).' 
        },
        { status: 500 }
      )
    }

    if (error) throw error

    return NextResponse.json({ data, error: null }, { status: 201 })
  } catch (error) {
    console.error('POST connector error:', error)
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }
}
