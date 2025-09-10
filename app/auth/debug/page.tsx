'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Dynamic import with error handling
let createClient: any = null
try {
  const supabaseModule = require('@/lib/supabase')
  createClient = supabaseModule.createClient
  console.log('🔍 Supabase module imported successfully')
} catch (err) {
  console.error('🚨 Failed to import Supabase module:', err)
}

interface DebugInfo {
  environment: any
  supabaseConfig: any
  authStatus: any
  networkTest: any
  loginTest: any
}

export default function AuthDebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    environment: { status: 'Loading...' },
    supabaseConfig: { status: 'Loading...' },
    authStatus: { status: 'Loading...' },
    networkTest: { status: 'Loading...' },
    loginTest: { status: 'Not tested' }
  })
  const [testEmail, setTestEmail] = useState('ayah@demo.com')
  const [testPassword, setTestPassword] = useState('password123')
  const [loading, setLoading] = useState(false)
  const [manualEnvCheck, setManualEnvCheck] = useState<any>({})

  useEffect(() => {
    // Manual environment check that runs immediately
    const checkEnvManually = () => {
      try {
        const envCheck = {
          NODE_ENV: process.env.NODE_ENV,
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
          NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ? 'SET' : 'NOT SET',
          windowLocation: typeof window !== 'undefined' ? window.location.href : 'SSR',
          timestamp: new Date().toISOString()
        }
        console.log('Manual env check:', envCheck)
        setManualEnvCheck(envCheck)
      } catch (err) {
        console.error('Manual env check failed:', err)
        setManualEnvCheck({ error: 'Failed to check environment variables' })
      }
    }
    
    checkEnvManually()
    runDiagnostics()
  }, [])

  const runDiagnostics = async () => {
    console.log('🔍 Starting diagnostics...')
    
    try {
      // Check environment variables
      const environment = {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
        supabaseUrlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? `SET (length: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length})` : 'NOT SET',
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'NOT SET',
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'server-side',
        origin: typeof window !== 'undefined' ? window.location.origin : 'server-side',
        userAgent: typeof window !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : 'server-side'
      }
      
      console.log('Environment check:', environment)
      
      // Check Supabase configuration with error handling
      let supabaseConfig = {}
      try {
        if (!createClient) {
          throw new Error('Supabase createClient function not available')
        }
        
        console.log('🔍 Initializing Supabase client...')
        const supabase = createClient()
        console.log('🔍 Supabase client created, getting session...')
        
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('🔍 Session result:', { hasSession: !!session, error: error?.message })
        
        supabaseConfig = {
          clientInitialized: 'YES',
          sessionCheck: session ? 'Session exists' : 'No session',
          sessionError: error ? error.message : 'No error',
          sessionUserId: session?.user?.id || 'No user ID'
        }
      } catch (err) {
        console.error('🚨 Supabase client error:', err)
        supabaseConfig = {
          clientInitialized: 'NO',
          error: err instanceof Error ? err.message : 'Unknown error',
          errorType: err instanceof Error ? err.constructor.name : 'Unknown',
          createClientAvailable: !!createClient
        }
      }
      
      // Check auth status with detailed error handling
      let authStatus = {}
      try {
        console.log('🔍 Getting user info...')
        const supabase = createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        console.log('🔍 User result:', { hasUser: !!user, error: error?.message })
        
        authStatus = {
          userExists: user ? 'YES' : 'NO',
          userId: user?.id || 'N/A',
          userEmail: user?.email || 'N/A',
          emailConfirmed: user?.email_confirmed_at ? 'YES' : 'NO',
          error: error ? error.message : 'No error'
        }
      } catch (err) {
        console.error('🚨 Auth status error:', err)
        authStatus = {
          error: err instanceof Error ? err.message : 'Unknown error',
          errorType: err instanceof Error ? err.constructor.name : 'Unknown'
        }
      }
      
      // Test network connectivity
      let networkTest = {}
      try {
        console.log('🔍 Testing API health...')
        const response = await fetch('/api/health')
        const responseText = await response.text()
        console.log('🔍 API health response:', { status: response.status, ok: response.ok })
        
        networkTest = {
          apiHealth: response.ok ? 'OK' : 'FAILED',
          status: response.status,
          statusText: response.statusText,
          responseText: responseText.substring(0, 100)
        }
      } catch (err) {
        console.error('🚨 Network test error:', err)
        networkTest = {
          apiHealth: 'FAILED',
          error: err instanceof Error ? err.message : 'Unknown error',
          errorType: err instanceof Error ? err.constructor.name : 'Unknown'
        }
      }
      
      console.log('🔍 Diagnostics complete:', { environment, supabaseConfig, authStatus, networkTest })
      
      setDebugInfo({
        environment,
        supabaseConfig,
        authStatus,
        networkTest,
        loginTest: {}
      })
      
    } catch (err) {
      console.error('🚨 Diagnostics failed:', err)
      setDebugInfo({
        environment: { error: 'Failed to check environment' },
        supabaseConfig: { error: 'Failed to check Supabase' },
        authStatus: { error: 'Failed to check auth' },
        networkTest: { error: 'Failed to check network' },
        loginTest: { error: 'Failed to initialize' }
      })
    }
  }

  const testLogin = async () => {
    setLoading(true)
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      })

      const loginTest = {
        success: !error,
        error: error ? error.message : 'No error',
        userData: data.user ? {
          id: data.user.id,
          email: data.user.email,
          emailConfirmed: data.user.email_confirmed_at ? 'YES' : 'NO'
        } : 'No user data',
        sessionData: data.session ? 'Session created' : 'No session'
      }

      setDebugInfo(prev => ({ ...prev, loginTest }))
    } catch (err) {
      const loginTest = {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      }
      setDebugInfo(prev => ({ ...prev, loginTest }))
    }
    
    setLoading(false)
  }

  const copyDebugInfo = () => {
    const debugText = JSON.stringify(debugInfo, null, 2)
    navigator.clipboard.writeText(debugText)
    alert('Debug info copied to clipboard!')
  }

  const testBasicFunctionality = () => {
    console.log('Testing basic functionality...')
    console.log('Window object:', typeof window)
    console.log('Process.env keys:', Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')))
    console.log('Current URL:', typeof window !== 'undefined' ? window.location.href : 'SSR')
    console.log('createClient available:', !!createClient)
    
    if (!createClient) {
      return 'FAILED: createClient function not available'
    }
    
    try {
      const testSupabase = createClient()
      console.log('Supabase client created successfully')
      return 'SUCCESS'
    } catch (err) {
      console.error('Failed to create Supabase client:', err)
      return `FAILED: ${err instanceof Error ? err.message : 'Unknown error'}`
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🔍 Authentication Debug Dashboard
          </h1>
          
          <div className="space-y-6">
            {/* Manual Environment Check */}
            <div className="border rounded-lg p-4 bg-blue-50">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Manual Environment Check</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {Object.entries(manualEnvCheck).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="font-medium">{key}:</span>
                    <span className={value === 'NOT SET' ? 'text-red-600' : 'text-green-600'}>
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Environment Variables */}
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Environment Variables</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {Object.entries(debugInfo.environment).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="font-medium">{key}:</span>
                    <span className={value === 'NOT SET' ? 'text-red-600' : 'text-green-600'}>
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Supabase Configuration */}
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Supabase Configuration</h2>
              <div className="space-y-2 text-sm">
                {Object.entries(debugInfo.supabaseConfig).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="font-medium">{key}:</span>
                    <span className={key === 'error' && value !== 'No error' ? 'text-red-600' : 'text-gray-700'}>
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Auth Status */}
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Authentication Status</h2>
              <div className="space-y-2 text-sm">
                {Object.entries(debugInfo.authStatus).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="font-medium">{key}:</span>
                    <span className={key === 'error' && value !== 'No error' ? 'text-red-600' : 'text-gray-700'}>
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Network Test */}
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Network Connectivity</h2>
              <div className="space-y-2 text-sm">
                {Object.entries(debugInfo.networkTest).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="font-medium">{key}:</span>
                    <span className={key === 'error' || (key === 'apiHealth' && value === 'FAILED') ? 'text-red-600' : 'text-green-600'}>
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Login Test */}
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Login Test</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Test Email"
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Enter test email"
                  />
                  <Input
                    label="Test Password"
                    type="password"
                    value={testPassword}
                    onChange={(e) => setTestPassword(e.target.value)}
                    placeholder="Enter test password"
                  />
                </div>
                
                <Button 
                  onClick={testLogin} 
                  loading={loading}
                  className="w-full md:w-auto"
                >
                  {loading ? 'Testing Login...' : 'Test Login'}
                </Button>

                {Object.keys(debugInfo.loginTest).length > 0 && (
                  <div className="space-y-2 text-sm mt-4">
                    {Object.entries(debugInfo.loginTest).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="font-medium">{key}:</span>
                        <span className={
                          key === 'success' 
                            ? (value ? 'text-green-600' : 'text-red-600')
                            : key === 'error' && value !== 'No error' 
                            ? 'text-red-600' 
                            : 'text-gray-700'
                        }>
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={runDiagnostics} variant="outline">
                🔄 Refresh Diagnostics
              </Button>
              <Button onClick={copyDebugInfo} variant="outline">
                📋 Copy Debug Info
              </Button>
              <Button onClick={() => console.log('Basic test:', testBasicFunctionality())} variant="outline">
                🧪 Test Basic Functions
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}