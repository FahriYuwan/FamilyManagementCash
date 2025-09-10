'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Wallet, Home, Package, BarChart3, LogOut, User } from 'lucide-react'

interface User {
  id: string
  email: string
  user_metadata?: {
    name?: string
    role?: 'ayah' | 'ibu'
  }
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push('/auth/login')
        return
      }
      
      setUser(user as User)
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      if (error) console.error('Error logging out:', error)
      router.push('/')
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const userName = user.user_metadata?.name || user.email?.split('@')[0]
  const userRole = user.user_metadata?.role || 'ibu'
  const isAyah = userRole === 'ayah'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Wallet className="h-8 w-8 text-primary-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Family Cash</h1>
                <p className="text-sm text-gray-600">Dashboard {userRole === 'ayah' ? 'Ayah' : 'Ibu'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-700">{userName}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Selamat Datang, {userName}!
          </h2>
          <p className="text-gray-600">
            {isAyah 
              ? 'Kelola keuangan rumah tangga dan usaha konveksi Anda'
              : 'Kelola keuangan rumah tangga keluarga'
            }
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <Wallet className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Saldo</p>
                <p className="text-2xl font-bold text-gray-900">Rp 0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <Home className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rumah Tangga</p>
                <p className="text-2xl font-bold text-gray-900">Rp 0</p>
              </div>
            </div>
          </div>

          {isAyah && (
            <>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100">
                    <Package className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Usaha</p>
                    <p className="text-2xl font-bold text-gray-900">Rp 0</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-orange-100">
                    <BarChart3 className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Order</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-auto p-4 flex flex-col items-center space-y-2">
              <Home className="h-6 w-6" />
              <span className="text-sm">Catat Pengeluaran</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Wallet className="h-6 w-6" />
              <span className="text-sm">Catat Pemasukan</span>
            </Button>

            {isAyah && (
              <>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                  <Package className="h-6 w-6" />
                  <span className="text-sm">Order Baru</span>
                </Button>

                <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                  <BarChart3 className="h-6 w-6" />
                  <span className="text-sm">Laporan</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Development Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="p-2 bg-blue-100 rounded-full">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-semibold text-blue-900">Dashboard dalam Pengembangan</h4>
              <p className="text-sm text-blue-700 mt-1">
                Fitur-fitur lengkap sedang dalam tahap pengembangan. Saat ini Anda dapat melihat struktur dasar dashboard 
                sesuai dengan role {userRole === 'ayah' ? 'Ayah (akses penuh)' : 'Ibu (fokus rumah tangga)'}.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}