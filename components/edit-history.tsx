// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { EditHistoryService } from '@/lib/edit-history-service'
import { EditHistory } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface EditHistoryProps {
  familyId: string
}

export function EditHistoryComponent({ familyId }: EditHistoryProps) {
  const [editHistory, setEditHistory] = useState<EditHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadEditHistory = async () => {
      try {
        const service = new EditHistoryService()
        const history = await service.getEditHistoryForFamily(familyId)
        setEditHistory(history)
      } catch (error) {
        console.error('Error loading edit history:', error)
      } finally {
        setLoading(false)
      }
    }

    if (familyId) {
      loadEditHistory()
    }
  }, [familyId])

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create': return 'Dibuat'
      case 'update': return 'Diubah'
      case 'delete': return 'Dihapus'
      default: return action
    }
  }

  const getTableLabel = (tableName: string) => {
    switch (tableName) {
      case 'household_transactions': return 'Transaksi Rumah Tangga'
      case 'orders': return 'Pesanan'
      case 'order_expenses': return 'Biaya Pesanan'
      case 'debts': return 'Hutang/Piutang'
      case 'debt_payments': return 'Pembayaran Hutang'
      default: return tableName
    }
  }

  if (loading) {
    return <div className="text-center py-4">Memuat riwayat edit...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat Edit</CardTitle>
        <CardDescription>Aktivitas terbaru anggota keluarga</CardDescription>
      </CardHeader>
      <CardContent>
        {editHistory.length === 0 ? (
          <p className="text-center text-gray-500 py-4">Belum ada riwayat edit</p>
        ) : (
          <div className="space-y-4">
            {editHistory.map((entry) => (
              <div key={entry.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{entry.user?.name}</span>
                      <Badge variant="secondary" className="capitalize">
                        {entry.user?.role === 'ayah' ? 'Ayah' : 'Ibu'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {getActionLabel(entry.action)} {getTableLabel(entry.table_name)}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {format(new Date(entry.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                  </span>
                </div>
                {entry.new_values && (
                  <div className="mt-2 text-sm bg-gray-50 p-2 rounded">
                    <pre className="overflow-x-auto">
                      {JSON.stringify(entry.new_values, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}