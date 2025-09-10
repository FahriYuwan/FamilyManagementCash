'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase'
import { Wallet, Eye, EyeOff, User, Users } from 'lucide-react'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'ibu' as 'ayah' | 'ibu'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleRoleChange = (role: 'ayah' | 'ibu') => {
    setFormData(prev => ({
      ...prev,
      role
    }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Password tidak cocok')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      
      // Sign up user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: formData.role
          }
        }
      })

      if (signUpError) {
        setError(signUpError.message)
      } else {
        setSuccess('Akun berhasil dibuat! Silakan cek email untuk konfirmasi.')
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
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
            Buat Akun Baru
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sudah punya akun?{' '}
            <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
              Masuk di sini
            </Link>
          </p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <form className="space-y-6" onSubmit={handleRegister}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                {success}
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label className="label">Peran dalam Keluarga</label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => handleRoleChange('ayah')}
                  className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                    formData.role === 'ayah'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <User className="h-6 w-6" />
                  <span className="font-medium">Ayah</span>
                  <span className="text-xs text-gray-500">Akses penuh</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('ibu')}
                  className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                    formData.role === 'ibu'
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Users className="h-6 w-6" />
                  <span className="font-medium">Ibu</span>
                  <span className="text-xs text-gray-500">Rumah tangga</span>
                </button>
              </div>
            </div>

            <div>
              <Input
                label="Nama Lengkap"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Masukkan nama lengkap"
                required
              />
            </div>

            <div>
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="nama@email.com"
                required
              />
            </div>

            <div className="relative">
              <Input
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Minimal 6 karakter"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Konfirmasi Password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Ulangi password"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            <div className="flex items-center">
              <input
                id="agree-terms"
                name="agree-terms"
                type="checkbox"
                required
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-900">
                Saya setuju dengan{' '}
                <Link href="/terms" className="text-primary-600 hover:text-primary-500">
                  Syarat & Ketentuan
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full"
            >
              {loading ? 'Membuat Akun...' : 'Buat Akun'}
            </Button>
          </form>

          {/* Role Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Perbedaan Peran:</h4>
            <div className="space-y-2 text-xs text-gray-500">
              <div className="bg-gray-50 p-3 rounded">
                <strong>Ayah:</strong> Akses lengkap - rumah tangga + usaha konveksi
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <strong>Ibu:</strong> Fokus pencatatan keuangan rumah tangga
              </div>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}