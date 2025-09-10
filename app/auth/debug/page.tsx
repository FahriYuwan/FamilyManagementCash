'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface DebugInfo {
  environment: any
  supabaseConfig: any
  authStatus: any
  networkTest: any
  loginTest: any
}

export default function AuthDebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    environment: {},
    supabaseConfig: {},
    authStatus: {},
    networkTest: {},
    loginTest: {}
  })
  const [testEmail, setTestEmail] = useState('ayah@demo.com')
  const [testPassword, setTestPassword] = useState('password123')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    runDiagnostics()
  }, [])

  const runDiagnostics = async () => {
    const supabase = createClient()
    
    // Check environment variables
    const environment = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET (length: ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length + ')' : 'NOT SET',
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'NOT SET',
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'server-side',
      origin: typeof window !== 'undefined' ? window.location.origin : 'server-side'
    }

    // Check Supabase configuration
    let supabaseConfig = {}
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      supabaseConfig = {
        sessionCheck: session ? 'Session exists' : 'No session',
        sessionError: error ? error.message : 'No error',
        clientInitialized: 'YES'
      }
    } catch (err) {
      supabaseConfig = {
        clientInitialized: 'NO',
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // Check auth status
    let authStatus = {}
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      authStatus = {
        userExists: user ? 'YES' : 'NO',
        userId: user?.id || 'N/A',
        userEmail: user?.email || 'N/A',
        error: error ? error.message : 'No error'
      }
    } catch (err) {
      authStatus = {
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }

    // Test network connectivity
    let networkTest = {}
    try {
      const response = await fetch('/api/health')
      networkTest = {
        apiHealth: response.ok ? 'OK' : 'FAILED',
        status: response.status,
        statusText: response.statusText
      }
    } catch (err) {
      networkTest = {
        apiHealth: 'FAILED',
        error: err instanceof Error ? err.message : 'Unknown error'
      }
    }

    setDebugInfo({
      environment,
      supabaseConfig,
      authStatus,
      networkTest,
      loginTest: {}
    })
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🔍 Authentication Debug Dashboard
          </h1>
          
          <div className="space-y-6">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}