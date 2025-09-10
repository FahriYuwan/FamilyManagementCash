import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check if environment variables are properly set
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ]

    const missingEnvVars = requiredEnvVars.filter(
      envVar => !process.env[envVar]
    )

    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          message: `Missing environment variables: ${missingEnvVars.join(', ')}`,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    // Basic health check
    return NextResponse.json({
      status: 'healthy',
      message: 'Family Management Cash API is running',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}