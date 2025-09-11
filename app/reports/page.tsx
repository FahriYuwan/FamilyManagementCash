'use client'

import { useEffect, useState } from 'react'
import { useAuth, useRoleAccess } from '@/lib/auth'
import { ReportsService, MonthlyReport, CategoryReport, DebtReport, BusinessOrderReport } from '@/lib/reports-service'
import { ExportService, ExportData } from '@/lib/export-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import { Calendar, Download, TrendingUp, TrendingDown, BarChart3, FileText, FileSpreadsheet } from 'lucide-react'
import { format } from 'date-fns'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function ReportsPage() {
  const { user, loading } = useAuth()
  const { canAccessBusiness } = useRoleAccess()
  const [monthlyData, setMonthlyData] = useState<MonthlyReport[]>([])
  const [categoryData, setCategoryData] = useState<{
    income: CategoryReport[]
    expense: CategoryReport[]
  }>({ income: [], expense: [] })
  const [debtTrend, setDebtTrend] = useState<DebtReport[]>([])
  const [businessReport, setBusinessReport] = useState<BusinessOrderReport[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'3' | '6' | '12'>('6')

  useEffect(() => {
    if (user) {
      loadReportsData()
    }
  }, [user, timeRange])

  const loadReportsData = async () => {
    try {
      setDataLoading(true)
      const reportsService = new ReportsService()
      const months = parseInt(timeRange)

      const [monthly, incomeCategories, expenseCategories, debts, business] = await Promise.all([
        reportsService.getMonthlyReport(user!.id, months),
        reportsService.getCategoryReport(user!.id, 'income', months),
        reportsService.getCategoryReport(user!.id, 'expense', months),
        reportsService.getDebtTrend(user!.id, months),
        canAccessBusiness ? reportsService.getBusinessReport(user!.id, months) : Promise.resolve([])
      ])

      setMonthlyData(monthly)
      setCategoryData({ income: incomeCategories, expense: expenseCategories })
      setDebtTrend(debts)
      setBusinessReport(business)
    } catch (error) {
      console.error('Error loading reports data:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const exportToCSV = (data: any[], filename: string) => {
    ExportService.exportToCSV(data, filename)
  }

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    const exportData: ExportData = {
      monthly: monthlyData,
      categories: categoryData,
      debts: debtTrend,
      business: canAccessBusiness ? businessReport : undefined
    }

    await ExportService.exportAllData(exportData, user?.name || 'User', format)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laporan Keuangan</h1>
          <p className="text-gray-600 mt-2">Analisis dan wawasan keuangan yang komprehensif</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '3' | '6' | '12')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="3">3 bulan terakhir</option>
            <option value="6">6 bulan terakhir</option>
            <option value="12">12 bulan terakhir</option>
          </select>
          <div className="flex space-x-2">
            <Button
              onClick={() => handleExport('pdf')}
              variant="outline"
              size="sm"
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button
              onClick={() => handleExport('excel')}
              variant="outline"
              size="sm"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button
              onClick={() => exportToCSV(monthlyData, 'monthly_report')}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Rp{monthlyData.reduce((sum, month) => sum + month.income, 0).toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {timeRange} bulan terakhir
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              Rp{monthlyData.reduce((sum, month) => sum + month.expenses, 0).toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {timeRange} bulan terakhir
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Bersih</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              monthlyData.reduce((sum, month) => sum + month.balance, 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              Rp{monthlyData.reduce((sum, month) => sum + month.balance, 0).toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {timeRange} bulan terakhir
            </p>
          </CardContent>
        </Card>

        {canAccessBusiness && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Keuntungan Usaha</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                Rp{businessReport.reduce((sum, month) => sum + month.profit, 0).toLocaleString('id-ID')}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {timeRange} bulan terakhir
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="categories">Kategori</TabsTrigger>
          <TabsTrigger value="debts">Hutang</TabsTrigger>
          {canAccessBusiness && <TabsTrigger value="business">Usaha</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pemasukan vs Pengeluaran Bulanan</CardTitle>
              <CardDescription>Lacak kinerja keuangan Anda dari waktu ke waktu</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`Rp${Number(value).toLocaleString('id-ID')}`, '']} />
                  <Legend />
                  <Area type="monotone" dataKey="income" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="expenses" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tren Saldo Bulanan</CardTitle>
              <CardDescription>Posisi keuangan bersih Anda setiap bulan</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`Rp${Number(value).toLocaleString('id-ID')}`, 'Saldo']} />
                  <Line 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pemasukan berdasarkan Kategori</CardTitle>
                <CardDescription>Rincian sumber pemasukan</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryData.income.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData.income}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percentage }) => `${category} (${percentage.toFixed(1)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {categoryData.income.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`Rp${Number(value).toLocaleString('id-ID')}`, 'Jumlah']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-gray-500">Data pemasukan tidak tersedia</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pengeluaran berdasarkan Kategori</CardTitle>
                <CardDescription>Kemana uang Anda pergi</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryData.expense.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData.expense}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percentage }) => `${category} (${percentage.toFixed(1)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {categoryData.expense.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`Rp${Number(value).toLocaleString('id-ID')}`, 'Jumlah']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-gray-500">Data pengeluaran tidak tersedia</div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Kategori Pengeluaran Tertinggi</CardTitle>
              <CardDescription>Kategori pengeluaran terbesar Anda</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData.expense.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Amount']} />
                  <Bar dataKey="amount" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tren Posisi Hutang</CardTitle>
              <CardDescription>Lacak piutang dan hutang dari waktu ke waktu</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={debtTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`Rp${Number(value).toLocaleString('id-ID')}`, '']} />
                  <Legend />
                  <Line type="monotone" dataKey="receivables" stroke="#10B981" strokeWidth={2} />
                  <Line type="monotone" dataKey="payables" stroke="#EF4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="net_position" stroke="#3B82F6" strokeWidth={3} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {canAccessBusiness && (
          <TabsContent value="business" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pendapatan & Keuntungan Usaha</CardTitle>
                  <CardDescription>Kinerja usaha bulanan</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={businessReport}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`Rp${Number(value).toLocaleString('id-ID')}`, '']} />
                      <Legend />
                      <Area type="monotone" dataKey="total_revenue" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="profit" stackId="2" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Kinerja Pesanan</CardTitle>
                  <CardDescription>Jumlah pesanan dan nilai rata-rata</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={businessReport}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [
                        name === 'orders_count' ? value : `Rp${Number(value).toLocaleString('id-ID')}`,
                        name === 'orders_count' ? 'Pesanan' : 'Nilai Pesanan Rata-rata'
                      ]} />
                      <Legend />
                      <Bar dataKey="orders_count" fill="#ffc658" />
                      <Bar dataKey="average_order_value" fill="#ff7300" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}