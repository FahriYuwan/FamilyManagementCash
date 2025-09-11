'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { DebtService } from '@/lib/debt-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, CreditCard, DollarSign, ArrowLeft, Calendar, Edit2, Trash2, Check, X } from 'lucide-react'
import Link from 'next/link'
import { Debt, DebtType } from '@/types'

export default function DebtsPage() {
  const { user } = useAuth()
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingDebt, setEditingDebt] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'receivable' | 'payable'>('all')
  const [formData, setFormData] = useState({
    type: 'payable' as DebtType,
    debtor_creditor_name: '',
    amount: '',
    description: '',
    due_date: ''
  })

  useEffect(() => {
    if (user) {
      loadDebts()
    }
  }, [user])

  const loadDebts = async () => {
    try {
      const service = new DebtService()
      const data = await service.getDebts(user!.id)
      setDebts(data)
    } catch (error) {
      console.error('Error loading debts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const service = new DebtService()
      
      if (editingDebt) {
        await service.updateDebt(editingDebt.id, {
          ...formData,
          amount: parseFloat(formData.amount)
        })
        setEditingDebt(null)
      } else {
        await service.createDebt(user!.id, {
          ...formData,
          amount: parseFloat(formData.amount)
        })
      }
      
      setShowForm(false)
      setFormData({
        type: 'payable' as DebtType,
        debtor_creditor_name: '',
        amount: '',
        description: '',
        due_date: ''
      })
      
      loadDebts()
    } catch (error) {
      console.error('Error saving debt:', error)
    }
  }

  const handleEdit = (debt: any) => {
    setEditingDebt(debt)
    setFormData({
      type: debt.type,
      debtor_creditor_name: debt.debtor_creditor_name,
      amount: debt.amount.toString(),
      description: debt.description,
      due_date: debt.due_date || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (debtId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus hutang/piutang ini?')) {
      try {
        const service = new DebtService()
        await service.deleteDebt(debtId)
        loadDebts()
      } catch (error) {
        console.error('Error deleting debt:', error)
      }
    }
  }

  const handleCancelEdit = () => {
    setEditingDebt(null)
    setShowForm(false)
    setFormData({
      type: 'payable' as DebtType,
      debtor_creditor_name: '',
      amount: '',
      description: '',
      due_date: ''
    })
  }

  const filteredDebts = debts.filter((debt: any) => {
    if (activeTab === 'all') return true
    return debt.type === activeTab
  })

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
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Hutang & Piutang</h1>
              <p className="text-sm sm:text-base text-gray-600">Kelola catatan hutang dan piutang keluarga</p>
            </div>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            {editingDebt ? 'Ubah Data' : 'Tambah Hutang/Piutang'}
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-full bg-green-100">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Piutang</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">
                  Rp{debts.filter((d: any) => d.type === 'receivable').reduce((sum: number, d: any) => sum + d.amount, 0).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-full bg-red-100">
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Hutang</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600">
                  Rp{debts.filter((d: any) => d.type === 'payable').reduce((sum: number, d: any) => sum + d.amount, 0).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm sm:col-span-2 lg:col-span-1">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-full bg-blue-100">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Posisi Bersih</p>
                <p className={`text-lg sm:text-2xl font-bold ${
                  debts.filter((d: any) => d.type === 'receivable').reduce((sum: number, d: any) => sum + d.amount, 0) -
                  debts.filter((d: any) => d.type === 'payable').reduce((sum: number, d: any) => sum + d.amount, 0) >= 0
                    ? 'text-green-600' : 'text-red-600'
                }`}>
                  Rp{(debts.filter((d: any) => d.type === 'receivable').reduce((sum: number, d: any) => sum + d.amount, 0) -
                     debts.filter((d: any) => d.type === 'payable').reduce((sum: number, d: any) => sum + d.amount, 0)).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Add Debt Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">{editingDebt ? 'Ubah Hutang/Piutang' : 'Tambah Hutang/Piutang Baru'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jenis</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as DebtType })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  >
                    <option value="payable">Hutang (Uang yang Saya Hutangi)</option>
                    <option value="receivable">Piutang (Uang yang Dihutangi ke Saya)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.type === 'payable' ? 'Nama Pemberi Hutang' : 'Nama Penghutang'}
                  </label>
                  <Input
                    value={formData.debtor_creditor_name}
                    onChange={(e) => setFormData({ ...formData, debtor_creditor_name: e.target.value })}
                    placeholder={formData.type === 'payable' ? 'Kepada siapa Anda berhutang' : 'Siapa yang berhutang kepada Anda'}
                    className="text-base p-3"
                    required
                  />
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jatuh Tempo</label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="text-base p-3"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Untuk apa hutang/piutang ini?"
                    className="text-base p-3"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button type="submit" className="flex-1 sm:flex-none">
                  <Check className="h-4 w-4 mr-2" />
                  {editingDebt ? 'Simpan Perubahan' : 'Simpan'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancelEdit} className="flex-1 sm:flex-none">
                  <X className="h-4 w-4 mr-2" />
                  Batal
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              {[
                { key: 'all', label: 'Semua', count: debts.length },
                { key: 'receivable', label: 'Piutang', count: debts.filter((d: any) => d.type === 'receivable').length },
                { key: 'payable', label: 'Hutang', count: debts.filter((d: any) => d.type === 'payable').length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Debts Display */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {filteredDebts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="mb-4">
                <CreditCard className="h-12 w-12 mx-auto text-gray-300" />
              </div>
              <p className="text-lg font-medium mb-2">Belum ada data</p>
              <p className="text-sm">Tidak ada {activeTab === 'all' ? 'hutang atau piutang' : activeTab} yang ditemukan</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block lg:hidden">
                <div className="divide-y divide-gray-200">
                  {filteredDebts.map((debt: any) => (
                    <div key={debt.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              debt.type === 'receivable' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {debt.type === 'receivable' ? 'Piutang' : 'Hutang'}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              debt.is_settled 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {debt.is_settled ? 'Lunas' : 'Belum Lunas'}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900 mb-1">{debt.debtor_creditor_name}</h4>
                          <p className="text-sm text-gray-500 mb-2">{debt.description}</p>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>Jatuh Tempo: {debt.due_date ? new Date(debt.due_date).toLocaleDateString('id-ID') : '-'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900 mb-1">
                            Rp{debt.amount.toLocaleString('id-ID')}
                          </div>
                          <div className="text-sm text-gray-500 mb-2">
                            Dibayar: Rp{debt.paid_amount.toLocaleString('id-ID')}
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEdit(debt)}
                              className="p-1 h-8 w-8"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDelete(debt.id)}
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
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jenis
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nama
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Keterangan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jumlah
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dibayar
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sisa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jatuh Tempo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDebts.map((debt: any) => (
                      <tr key={debt.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            debt.type === 'receivable' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {debt.type === 'receivable' ? 'Piutang' : 'Hutang'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {debt.debtor_creditor_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {debt.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Rp{debt.amount.toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Rp{debt.paid_amount.toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Rp{debt.remaining_amount.toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {debt.due_date ? new Date(debt.due_date).toLocaleDateString('id-ID') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            debt.is_settled 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {debt.is_settled ? 'Lunas' : 'Belum Lunas'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEdit(debt)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDelete(debt.id)}
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