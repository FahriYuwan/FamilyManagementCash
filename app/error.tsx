'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Oops! Terjadi Kesalahan
          </h1>
          <p className="text-gray-600 mb-6">
            Mohon maaf, terjadi kesalahan yang tidak terduga. Tim kami telah mendapat notifikasi tentang masalah ini.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 mb-2">
                Detail Error (Development)
              </summary>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto text-red-600">
                {error.message}
              </pre>
            </details>
          )}
          
          <div className="space-y-3">
            <Button onClick={reset} className="w-full">
              Coba Lagi
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Kembali ke Beranda
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 mt-6">
            Error ID: {error.digest || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  )
}