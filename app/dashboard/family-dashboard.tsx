'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useRoleAccess } from '@/lib/auth'
import { HouseholdService } from '@/lib/household-service'
import { BusinessService } from '@/lib/business-service'
import { DebtService } from '@/lib/debt-service'
import { FamilyService } from '@/lib/family-service'
import { Button } from '@/components/ui/button'
import { Wallet, Home, Package, BarChart3, LogOut, User, TrendingUp, TrendingDown, DollarSign, Settings, Users, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function FamilyDashboardPage() {
  const { user, loading, signOut, refreshUser, refreshSession } = useAuth()
  const { canAccessBusiness } = useRoleAccess()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState({
    household: { totalIncome: 0, totalExpenses: 0, balance: 0 },
    business: { totalOrders: 0, totalRevenue: 0, totalProfit: 0 },
    debts: { totalReceivables: 0, totalPayables: 0 }
  })
  const [familyData, setFamilyData] = useState({
    name: '',
    members: [] as any[]
  })
  const [dataLoading, setDataLoading] = useState(true)
  const [familyLoading, setFamilyLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Refs for real-time subscription channels
  const householdChannelRef = useRef<any>(null)
  const businessChannelRef = useRef<any>(null)
  const debtChannelRef = useRef<any>(null)
  const familyChannelRef = useRef<any>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    } else if (user) {
      loadDashboardData()
      loadFamilyData()
    }
    
    // Cleanup subscriptions on unmount
    return () => {
      if (householdChannelRef.current) {
        const householdService = new HouseholdService()
        householdService.unsubscribeFromFamilyTransactions(householdChannelRef.current)
      }
      if (businessChannelRef.current) {
        const businessService = new BusinessService()
        businessService.unsubscribeFromFamilyOrders(businessChannelRef.current)
      }
      if (debtChannelRef.current) {
        const debtService = new DebtService()
        debtService.unsubscribeFromFamilyDebts(debtChannelRef.current)
      }
      if (familyChannelRef.current) {
        const familyService = new FamilyService()
        familyService.unsubscribeFromFamilyMembers(familyChannelRef.current)
      }
    }
  }, [user, loading, router])

  // Add periodic session refresh
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (user && !loading) {
      interval = setInterval(() => {
        refreshSession();
      }, 10 * 60 * 1000); // Refresh every 10 minutes
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [user, loading, refreshSession]);

  const loadDashboardData = async () => {
    if (!user?.family_id) {
      setDataLoading(false)
      return
    }
    
    try {
      const householdService = new HouseholdService()
      const debtService = new DebtService()
      
      const [householdSummary, debtSummary] = await Promise.all([
        householdService.getFamilySummary(user.family_id),
        debtService.getFamilyDebtSummary(user.family_id)
      ])

      let businessSummary = { totalOrders: 0, totalRevenue: 0, totalProfit: 0 }
      
      if (canAccessBusiness) {
        const businessService = new BusinessService()
        businessSummary = await businessService.getFamilyBusinessSummary(user.family_id)
      }

      setDashboardData({
        household: householdSummary,
        business: businessSummary,
        debts: debtSummary
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const loadFamilyData = async () => {
    if (!user?.family_id) {
      setFamilyLoading(false)
      return
    }
    
    try {
      const familyService = new FamilyService()
      const family = await familyService.getFamilyById(user.family_id)
      
      if (family) {
        setFamilyData({
          name: family.name,
          members: family.members || []
        })
        
        // Setup real-time subscriptions
        setupRealTimeSubscriptions(user.family_id)
      }
    } catch (error) {
      console.error('Error loading family data:', error)
    } finally {
      setFamilyLoading(false)
    }
  }

  const setupRealTimeSubscriptions = (familyId: string) => {
    const householdService = new HouseholdService();
    const businessService = new BusinessService();
    const debtService = new DebtService();
    const familyService = new FamilyService();
    
    // Unsubscribe from existing channels first
    if (householdChannelRef.current) {
      householdService.unsubscribeFromFamilyTransactions(householdChannelRef.current);
    }
    if (businessChannelRef.current) {
      businessService.unsubscribeFromFamilyOrders(businessChannelRef.current);
    }
    if (debtChannelRef.current) {
      debtService.unsubscribeFromFamilyDebts(debtChannelRef.current);
    }
    if (familyChannelRef.current) {
      familyService.unsubscribeFromFamilyMembers(familyChannelRef.current);
    }
    
    // Subscribe to household transactions
    householdChannelRef.current = householdService.subscribeToFamilyTransactions(
      familyId,
      (payload: any) => {
        console.log('Household transaction updated:', payload);
        loadDashboardData(); // Refresh data when transactions change
      }
    );
    
    // Subscribe to business orders
    businessChannelRef.current = businessService.subscribeToFamilyOrders(
      familyId,
      (payload: any) => {
        console.log('Business order updated:', payload);
        loadDashboardData(); // Refresh data when orders change
      }
    );
    
    // Subscribe to debts
    debtChannelRef.current = debtService.subscribeToFamilyDebts(
      familyId,
      (payload: any) => {
        console.log('Debt updated:', payload);
        loadDashboardData(); // Refresh data when debts change
      }
    );
    
    // Subscribe to family members
    familyChannelRef.current = familyService.subscribeToFamilyMembers(
      familyId,
      (payload: any) => {
        console.log('Family member updated:', payload);
        // Add a small delay to ensure database is updated
        setTimeout(() => {
          loadFamilyData(); // Refresh family data when members change
        }, 1500);
      }
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([
      loadDashboardData(),
      loadFamilyData()
    ])
    await refreshUser()
    setRefreshing(false)
  }

  const handleLogout = async () => {
    try {
      await signOut()
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
          <p className="text-gray-600">Memuat dashboard keluarga...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const userName = user.name || user.email?.split('@')[0]
  const userRole = user.role || 'ibu'
  const isAyah = userRole === 'ayah'
  const isFamilyMember = !!user.family_id

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
                <p className="text-sm text-gray-600">
                  Dashboard {userRole === 'ayah' ? 'Ayah' : 'Ibu'}
                  {isFamilyMember && familyData.name && ` - Keluarga ${familyData.name}`}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Menyegarkan...' : 'Segarkan'}
              </Button>
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
        {/* Family Info */}
        {isFamilyMember && (
          <div className="mb-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-600 mr-2" />
                <span className="font-medium text-blue-900">
                  Keluarga: {familyData.name}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-blue-700 mr-2">
                  {familyData.members.length} anggota
                </span>
                <Link href="/settings">
                  <Button variant="outline" size="sm" className="text-blue-700 border-blue-300 hover:bg-blue-100">
                    Kelola Keluarga
                  </Button>
                </Link>
              </div>
            </div>
            {familyData.members.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {familyData.members.map((member: any) => (
                  <span 
                    key={member.id} 
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.id === user.id 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {member.name} {member.id === user.id && '(Anda)'}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {!isFamilyMember && (
          <div className="mb-6 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="font-medium text-yellow-900">
                  Belum Bergabung dengan Keluarga
                </span>
              </div>
              <Link href="/settings">
                <Button variant="outline" size="sm" className="text-yellow-700 border-yellow-300 hover:bg-yellow-100">
                  Bergabung dengan Keluarga
                </Button>
              </Link>
            </div>
            <p className="mt-1 text-sm text-yellow-700">
              Bergabung dengan keluarga untuk melihat dan menyinkronkan data keuangan keluarga secara real-time.
            </p>
          </div>
        )}

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
            {isFamilyMember && ' bersama keluarga Anda secara real-time'}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendapatan Bulanan</p>
                <p className="text-2xl font-bold text-gray-900">
                  Rp{dataLoading ? '0' : dashboardData.household.totalIncome.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pengeluaran Bulanan</p>
                <p className="text-2xl font-bold text-gray-900">
                  Rp{dataLoading ? '0' : dashboardData.household.totalExpenses.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Saldo</p>
                <p className={`text-2xl font-bold ${
                  dashboardData.household.balance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  Rp{dataLoading ? '0' : dashboardData.household.balance.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>

          {canAccessBusiness && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <Package className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pendapatan Usaha</p>
                  <p className="text-2xl font-bold text-gray-900">
                    Rp{dataLoading ? '0' : dashboardData.business.totalRevenue.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Menu Utama</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <Link href="/household/transactions">
              <Button variant="outline" className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-1 sm:space-y-2 w-full text-xs sm:text-sm">
                <Home className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>Keuangan Rumah</span>
              </Button>
            </Link>
            
            <Link href="/debts">
              <Button variant="outline" className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-1 sm:space-y-2 w-full text-xs sm:text-sm">
                <Wallet className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>Hutang Piutang</span>
              </Button>
            </Link>

            <Link href="/reports">
              <Button variant="outline" className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-1 sm:space-y-2 w-full text-xs sm:text-sm">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>Laporan</span>
              </Button>
            </Link>

            {canAccessBusiness && (
              <Link href="/business/orders">
                <Button variant="outline" className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-1 sm:space-y-2 w-full text-xs sm:text-sm">
                  <Package className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span>Usaha Konveksi</span>
                </Button>
              </Link>
            )}

            <Link href="/settings">
              <Button variant="outline" className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-1 sm:space-y-2 w-full text-xs sm:text-sm">
                <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>Pengaturan</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Real-time Notice */}
        {isFamilyMember && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="p-2 bg-green-100 rounded-full">
                  <RefreshCw className="h-5 w-5 text-green-600 animate-spin" />
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-semibold text-green-900">Sinkronisasi Real-time Aktif</h4>
                <p className="text-sm text-green-700 mt-1">
                  Data keuangan keluarga Anda diperbarui secara real-time. Perubahan yang dilakukan oleh anggota keluarga lain akan langsung terlihat.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}