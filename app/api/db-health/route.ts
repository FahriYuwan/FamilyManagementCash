import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Handle case where supabase client could not be created
    if (!supabase) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          message: 'Failed to create Supabase client',
          error: 'Supabase client is null',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }
    
    // Test database connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
      .single()

    if (error) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          message: 'Database connection failed',
          error: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: 'healthy',
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        message: 'Database check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}