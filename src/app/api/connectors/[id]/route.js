import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET single connector
export async function GET(request, { params }) {
  try {
    const { id } = await params

    const { data, error } = await supabase
      .from('connectors')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return NextResponse.json({ data, error: null })
  } catch (error) {
    console.error('GET connector error:', error)
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }
}

// PUT update connector
export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, destinations } = body

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (destinations !== undefined) updateData.destinations = destinations
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('connectors')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data, error: null })
  } catch (error) {
    console.error('PUT connector error:', error)
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE connector
export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    const { error } = await supabase
      .from('connectors')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ data: { success: true }, error: null })
  } catch (error) {
    console.error('DELETE connector error:', error)
    return NextResponse.json(
      { data: null, error: error.message },
      { status: 500 }
    )
  }
}
