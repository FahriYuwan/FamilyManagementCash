'use client'

import { useState, useEffect } from 'react'
import { useAuth, useRoleAccess } from '@/lib/auth'
import { BusinessService } from '@/lib/business-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Package, Eye, ArrowLeft, Edit2, Trash2, Check, X, Home } from 'lucide-react'
import Link from 'next/link'
import { Order, OrderStatus } from '@/types'

export default function BusinessOrdersPage() {
  const { user, refreshSession } = useAuth()
  const { canAccessBusiness } = useRoleAccess()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingOrder, setEditingOrder] = useState<any>(null)
  const [formData, setFormData] = useState({
    order_number: '',
    customer_name: '',
    customer_contact: '',
    description: '',
    quantity: '',
    unit_price: '',
    status: 'pending' as OrderStatus,
    order_date: new Date().toISOString().split('T')[0],
    deadline_date: '',
    notes: ''
  })

  useEffect(() => {
    if (user && canAccessBusiness) {
      loadOrders()
    }
  }, [user, canAccessBusiness])

  // Add periodic session refresh
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (user && canAccessBusiness) {
      interval = setInterval(() => {
        refreshSession();
      }, 10 * 60 * 1000); // Refresh every 10 minutes
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [user, canAccessBusiness, refreshSession]);

  const loadOrders = async () => {
    try {
      const service = new BusinessService()
      const data = await service.getOrders(user!.id)
      setOrders(data)
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  // Function to generate order number
  const generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PSN-${year}${month}${day}-${random}`;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const service = new BusinessService()
      
      // Auto-generate order number if not editing
      const orderData = {
        ...formData,
        quantity: parseInt(formData.quantity),
        unit_price: parseFloat(formData.unit_price),
        order_number: editingOrder ? formData.order_number : generateOrderNumber()
      }
      
      if (editingOrder) {
        await service.updateOrder(editingOrder.id, orderData)
        setEditingOrder(null)
      } else {
        await service.createOrder(user!.id, orderData)
      }
      
      setShowForm(false)
      setFormData({
        order_number: '',
        customer_name: '',
        customer_contact: '',
        description: '',
        quantity: '',
        unit_price: '',
        status: 'pending' as OrderStatus,
        order_date: new Date().toISOString().split('T')[0],
        deadline_date: '',
        notes: ''
      })
      
      loadOrders()
    } catch (error) {
      console.error('Error saving order:', error)
    }
  }

  const handleEdit = (order: any) => {
    setEditingOrder(order)
    setFormData({
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_contact: order.customer_contact || '',
      description: order.description,
      quantity: order.quantity.toString(),
      unit_price: order.unit_price.toString(),
      status: order.status,
      order_date: order.order_date,
      deadline_date: order.deadline_date || '',
      notes: order.notes || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (orderId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus pesanan ini?')) {
      try {
        const service = new BusinessService()
        await service.deleteOrder(orderId)
        loadOrders()
      } catch (error) {
        console.error('Error deleting order:', error)
      }
    }
  }

  const handleCancelEdit = () => {
    setEditingOrder(null)
    setShowForm(false)
    setFormData({
      order_number: '',
      customer_name: '',
      customer_contact: '',
      description: '',
      quantity: '',
      unit_price: '',
      status: 'pending' as OrderStatus,
      order_date: new Date().toISOString().split('T')[0],
      deadline_date: '',
      notes: ''
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

  if (!canAccessBusiness) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">Only 'Ayah' role can access business management</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Back to Dashboard
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
            <div className="flex items-center">
              <Package className="h-8 w-8 text-primary-600 mr-3" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Pesanan Usaha Konveksi</h1>
                <p className="text-sm sm:text-base text-gray-600">Kelola pesanan pelanggan dan pantau keuntungan</p>
              </div>
            </div>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            {editingOrder ? 'Ubah Pesanan' : 'Tambah Pesanan'}
          </Button>
        </div>

        {/* Add Order Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">{editingOrder ? 'Ubah Pesanan' : 'Tambah Pesanan Baru'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Pesanan</label>
                  <Input
                    value={formData.order_number || (editingOrder ? '' : generateOrderNumber())}
                    onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
                    placeholder="Akan di-generate otomatis"
                    className="text-base p-3"
                    readOnly={!editingOrder}
                  />
                  {!editingOrder && (
                    <p className="text-xs text-gray-500 mt-1">Nomor pesanan akan di-generate otomatis</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pelanggan</label>
                  <Input
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    placeholder="Nama pelanggan"
                    className="text-base p-3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kontak (Opsional)</label>
                  <Input
                    value={formData.customer_contact}
                    onChange={(e) => setFormData({ ...formData, customer_contact: e.target.value })}
                    placeholder="No HP atau email"
                    className="text-base p-3"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Deskripsi pesanan (contoh: Sablon kaos)"
                    className="text-base p-3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="0"
                    className="text-base p-3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Satuan</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    placeholder="0.00"
                    className="text-base p-3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as OrderStatus })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  >
                    <option value="pending">Menunggu</option>
                    <option value="in_progress">Sedang Dikerjakan</option>
                    <option value="completed">Selesai</option>
                    <option value="cancelled">Dibatalkan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Pesanan</label>
                  <Input
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                    className="text-base p-3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batas Waktu (Opsional)</label>
                  <Input
                    type="date"
                    value={formData.deadline_date}
                    onChange={(e) => setFormData({ ...formData, deadline_date: e.target.value })}
                    className="text-base p-3"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (Opsional)</label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Catatan tambahan"
                    className="text-base p-3"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button type="submit" className="flex-1 sm:flex-none">
                  <Check className="h-4 w-4 mr-2" />
                  {editingOrder ? 'Simpan Perubahan' : 'Simpan Pesanan'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancelEdit} className="flex-1 sm:flex-none">
                  <X className="h-4 w-4 mr-2" />
                  Batal
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Orders Display */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Pesanan Terbaru</h3>
          </div>
          
          {orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="mb-4">
                <Package className="h-12 w-12 mx-auto text-gray-300" />
              </div>
              <p className="text-lg font-medium mb-2">Belum ada pesanan</p>
              <p className="text-sm">Tambahkan pesanan pertama Anda dengan mengklik tombol di atas</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block lg:hidden">
                <div className="divide-y divide-gray-200">
                  {orders.map((order: any) => (
                    <div key={order.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900">{order.order_number}</h4>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === 'completed' ? 'bg-green-100 text-green-800' :
                              order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {order.status === 'pending' ? 'Menunggu' :
                               order.status === 'in_progress' ? 'Dikerjakan' :
                               order.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{order.customer_name}</p>
                          <p className="text-sm text-gray-500 mb-2">{order.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Jumlah: {order.quantity}</span>
                            <span>@Rp{order.unit_price?.toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600 mb-2">
                            Rp{order.total_income.toLocaleString('id-ID')}
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEdit(order)}
                              className="p-1 h-8 w-8"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDelete(order.id)}
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
                        No Pesanan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pelanggan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Deskripsi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jumlah
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Pendapatan
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
                    {orders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.order_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.customer_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          Rp{order.total_income.toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {order.status === 'pending' ? 'Menunggu' :
                             order.status === 'in_progress' ? 'Dikerjakan' :
                             order.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEdit(order)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDelete(order.id)}
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