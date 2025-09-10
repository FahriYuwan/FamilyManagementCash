'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase'
import { Wallet, ArrowLeft, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="flex items-center space-x-2">
                <Wallet className="h-8 w-8 text-primary-600" />
                <span className="text-2xl font-bold text-gray-900">Family Cash</span>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <Mail className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Email Terkirim!
              </h2>
              <p className="text-gray-600 mb-4">
                Kami telah mengirimkan link reset password ke email Anda. 
                Silakan cek inbox atau folder spam Anda.
              </p>
              <Link href="/auth/login">
                <Button className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali ke Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-2">
              <Wallet className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">Family Cash</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Lupa Password?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Masukkan email Anda dan kami akan mengirimkan link untuk reset password.
          </p>
        </div>

        {/* Reset Form */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <form className="space-y-6" onSubmit={handleResetPassword}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
              />
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full"
            >
              {loading ? 'Mengirim...' : 'Kirim Link Reset'}
            </Button>
          </form>
        </div>

        {/* Back to Login */}
        <div className="text-center">
          <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 inline mr-1" />
            Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  )
}