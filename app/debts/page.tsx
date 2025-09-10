'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { DebtService } from '@/lib/debt-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, CreditCard, DollarSign, ArrowLeft, Calendar } from 'lucide-react'
import Link from 'next/link'
import { Debt, DebtType } from '@/types'

export default function DebtsPage() {
  const { user } = useAuth()
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
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
      await service.createDebt(user!.id, {
        ...formData,
        amount: parseFloat(formData.amount)
      })
      
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
      console.error('Error creating debt:', error)
    }
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link 
              href="/dashboard" 
              className="mr-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Debt & Receivables</h1>
              <p className="text-gray-600">Track money you owe and money owed to you</p>
            </div>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Debt/Receivable
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Receivables</p>
                <p className="text-2xl font-bold text-green-600">
                  ${debts.filter((d: any) => d.type === 'receivable').reduce((sum: number, d: any) => sum + d.amount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <CreditCard className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Payables</p>
                <p className="text-2xl font-bold text-red-600">
                  ${debts.filter((d: any) => d.type === 'payable').reduce((sum: number, d: any) => sum + d.amount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Net Position</p>
                <p className={`text-2xl font-bold ${
                  debts.filter((d: any) => d.type === 'receivable').reduce((sum: number, d: any) => sum + d.amount, 0) -
                  debts.filter((d: any) => d.type === 'payable').reduce((sum: number, d: any) => sum + d.amount, 0) >= 0
                    ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${(debts.filter((d: any) => d.type === 'receivable').reduce((sum: number, d: any) => sum + d.amount, 0) -
                     debts.filter((d: any) => d.type === 'payable').reduce((sum: number, d: any) => sum + d.amount, 0)).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Add Debt Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Add New Debt/Receivable</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as DebtType })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="payable">Debt (Money I Owe)</option>
                  <option value="receivable">Receivable (Money Owed to Me)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.type === 'payable' ? 'Creditor Name' : 'Debtor Name'}
                </label>
                <Input
                  value={formData.debtor_creditor_name}
                  onChange={(e) => setFormData({ ...formData, debtor_creditor_name: e.target.value })}
                  placeholder={formData.type === 'payable' ? 'Who you owe money to' : 'Who owes you money'}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What is this debt/receivable for?"
                  required
                />
              </div>

              <div className="flex space-x-2 md:col-span-2 lg:col-span-3">
                <Button type="submit">Save</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'all', label: 'All', count: debts.length },
                { key: 'receivable', label: 'Receivables', count: debts.filter((d: any) => d.type === 'receivable').length },
                { key: 'payable', label: 'Payables', count: debts.filter((d: any) => d.type === 'payable').length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
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

        {/* Debts Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remaining
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDebts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No {activeTab === 'all' ? 'debts or receivables' : activeTab} found.
                    </td>
                  </tr>
                ) : (
                  filteredDebts.map((debt: any) => (
                    <tr key={debt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          debt.type === 'receivable' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {debt.type === 'receivable' ? 'Receivable' : 'Payable'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {debt.debtor_creditor_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {debt.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${debt.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${debt.paid_amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${debt.remaining_amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {debt.due_date ? new Date(debt.due_date).toLocaleDateString('en-US') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          debt.is_settled 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {debt.is_settled ? 'Settled' : 'Outstanding'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}