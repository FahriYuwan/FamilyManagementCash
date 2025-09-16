'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth'
import { HouseholdService } from '@/lib/household-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, TrendingUp, TrendingDown, ArrowLeft, Edit2, Trash2, Check, X, Users, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { HouseholdTransaction, HouseholdCategory, TransactionType } from '@/types'

export default function HouseholdTransactionsPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<HouseholdTransaction[]>([])
  const [categories, setCategories] = useState<HouseholdCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<any>(null)
  const [formData, setFormData] = useState({
    type: 'expense' as TransactionType,
    amount: '',
    category_id: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [refreshing, setRefreshing] = useState(false)
  
  // Refs for real-time subscription channels
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (user) {
      loadData()
    }
    
    // Cleanup subscription on unmount
    return () => {
      if (channelRef.current) {
        const service = new HouseholdService()
        service.unsubscribeFromFamilyTransactions(channelRef.current)
      }
    }
  }, [user])

  const loadData = async () => {
    try {
      const service = new HouseholdService()
      
      // Load categories (same for all users)
      const categoryData = await service.getCategories(user!.id)
      setCategories(categoryData)
      
      if (categoryData.length > 0 && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: categoryData[0].id }))
      }
      
      // Load transactions based on family membership
      let transactionData: HouseholdTransaction[] = []
      if (user!.family_id) {
        // Load family transactions
        transactionData = await service.getFamilyTransactions(user!.family_id)
        // Setup real-time subscription for family transactions
        setupRealTimeSubscription(user!.family_id)
      } else {
        // Load user transactions only
        transactionData = await service.getTransactions(user!.id)
      }
      
      setTransactions(transactionData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealTimeSubscription = (familyId: string) => {
    const service = new HouseholdService()
    
    // Unsubscribe from previous channel if exists
    if (channelRef.current) {
      service.unsubscribeFromFamilyTransactions(channelRef.current)
    }
    
    // Subscribe to family transactions
    channelRef.current = service.subscribeToFamilyTransactions(
      familyId,
      (payload: any) => {
        console.log('Household transaction updated:', payload)
        loadData() // Refresh data when transactions change
      }
    )
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const service = new HouseholdService()
      
      if (editingTransaction) {
        await service.updateTransaction(editingTransaction.id, {
          ...formData,
          amount: parseFloat(formData.amount)
        })
        setEditingTransaction(null)
      } else {
        await service.createTransaction(user!.id, {
          ...formData,
          amount: parseFloat(formData.amount)
        })
      }
      
      setShowForm(false)
      setFormData({
        type: 'expense' as TransactionType,
        amount: '',
        category_id: formData.category_id,
        description: '',
        date: new Date().toISOString().split('T')[0]
      })
      
      loadData()
    } catch (error) {
      console.error('Error saving transaction:', error)
    }
  }

  const handleEdit = (transaction: any) => {
    // Allow family members to edit each other's transactions
    setEditingTransaction(transaction)
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      category_id: transaction.category_id || '',
      description: transaction.description,
      date: transaction.date
    })
    setShowForm(true)
  }

  const handleDelete = async (transactionId: string, transactionUserId: string) => {
    // Allow family members to delete each other's transactions
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      try {
        const service = new HouseholdService()
        await service.deleteTransaction(transactionId)
        loadData()
      } catch (error) {
        console.error('Error deleting transaction:', error)
      }
    }
  }

  const handleCancelEdit = () => {
    setEditingTransaction(null)
    setShowForm(false)
    setFormData({
      type: 'expense' as TransactionType,
      amount: '',
      category_id: categories[0]?.id || '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">Please login to access this page</p>
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const isFamilyMember = !!user.family_id

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center">
            <Link 
              href="/dashboard" 
              className="mr-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Transaksi Rumah Tangga</h1>
              <p className="text-sm sm:text-base text-gray-600">Kelola pemasukan dan pengeluaran keluarga harian</p>
            </div>
          </div>
          <div className="flex gap-2">
            {isFamilyMember && (
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Segarkan
              </Button>
            )}
            <Button onClick={() => setShowForm(!showForm)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              {editingTransaction ? 'Ubah Transaksi' : 'Tambah Transaksi'}
            </Button>
          </div>
        </div>

        {/* Family Info */}
        {isFamilyMember && (
          <div className="mb-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-medium text-blue-900">
                Menampilkan transaksi keluarga secara real-time
              </span>
            </div>
            <p className="mt-1 text-sm text-blue-700">
              Transaksi dari semua anggota keluarga akan muncul di sini dan diperbarui secara otomatis.
            </p>
          </div>
        )}

        {/* Add Transaction Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">{editingTransaction ? 'Ubah Transaksi' : 'Tambah Transaksi Baru'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jenis</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as TransactionType })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  >
                    <option value="expense">Pengeluaran</option>
                    <option value="income">Pemasukan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="text-base p-3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    required
                  >
                    {categories.map((category: HouseholdCategory) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="text-base p-3"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Keterangan transaksi"
                    className="text-base p-3"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button type="submit" className="flex-1 sm:flex-none">
                  <Check className="h-4 w-4 mr-2" />
                  {editingTransaction ? 'Simpan Perubahan' : 'Simpan Transaksi'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancelEdit} className="flex-1 sm:flex-none">
                  <X className="h-4 w-4 mr-2" />
                  Batal
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Transactions Display */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Transaksi Terbaru</h3>
          </div>
          
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="mb-4">
                <TrendingUp className="h-12 w-12 mx-auto text-gray-300" />
              </div>
              <p className="text-lg font-medium mb-2">Belum ada transaksi</p>
              <p className="text-sm">Tambah transaksi pertama Anda dengan mengklik tombol di atas</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block sm:hidden">
                <div className="divide-y divide-gray-200">
                  {transactions.map((transaction: any) => (
                    <div key={transaction.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.type === 'income' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.type === 'income' ? (
                                <TrendingUp className="h-3 w-3 mr-1" />
                              ) : (
                                <TrendingDown className="h-3 w-3 mr-1" />
                              )}
                              {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(transaction.date).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900 mb-1">{transaction.description}</h4>
                          <p className="text-sm text-gray-500">{transaction.category?.name || '-'}</p>
                          {isFamilyMember && transaction.user && (
                            <p className="text-xs text-gray-400 mt-1">
                              oleh {transaction.user.name}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            Rp{transaction.amount.toLocaleString('id-ID')}
                          </div>
                          <div className="flex gap-1 mt-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEdit(transaction)}
                              className="p-1 h-8 w-8"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDelete(transaction.id, transaction.user_id)}
                              className="p-1 h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Keterangan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jenis
                      </th>
                      {isFamilyMember && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dibuat oleh
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jumlah
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction: any) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(transaction.date).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.category?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.type === 'income' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.type === 'income' ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                          </div>
                        </td>
                        {isFamilyMember && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.user?.name || '-'}
                          </td>
                        )}
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          Rp{transaction.amount.toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEdit(transaction)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDelete(transaction.id, transaction.user_id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}