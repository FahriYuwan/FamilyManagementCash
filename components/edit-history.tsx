// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { EditHistoryService } from '@/lib/edit-history-service'
import { EditHistory } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface EditHistoryProps {
  familyId: string
}

export function EditHistoryComponent({ familyId }: EditHistoryProps) {
  const [editHistory, setEditHistory] = useState<EditHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({})

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

  const toggleEntry = (id: string) => {
    setExpandedEntries(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

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

  // Format values for better readability
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A'
    if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak'
    if (typeof value === 'number') return value.toString()
    if (typeof value === 'string') {
      // Check if it's a date
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
        return format(new Date(value), 'dd MMM yyyy', { locale: id })
      }
      return value
    }
    return JSON.stringify(value)
  }

  // Format object for display
  const formatObject = (obj: any): Record<string, string> => {
    const formatted: Record<string, string> = {}
    for (const [key, value] of Object.entries(obj)) {
      formatted[key] = formatValue(value)
    }
    return formatted
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
                  <div className="mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto font-normal text-left w-full justify-start"
                      onClick={() => toggleEntry(entry.id)}
                    >
                      {expandedEntries[entry.id] ? (
                        <ChevronDown className="h-4 w-4 mr-1" />
                      ) : (
                        <ChevronRight className="h-4 w-4 mr-1" />
                      )}
                      <span className="text-sm">
                        {expandedEntries[entry.id] ? 'Sembunyikan detail' : 'Tampilkan detail'}
                      </span>
                    </Button>
                    
                    {expandedEntries[entry.id] && (
                      <div className="mt-2 bg-gray-50 p-3 rounded border text-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {Object.entries(formatObject(entry.new_values)).map(([key, value]) => (
                            <div key={key} className="flex">
                              <span className="font-medium mr-2">{key}:</span>
                              <span className="truncate">{value}</span>
                            </div>
                          ))}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            const jsonStr = JSON.stringify(entry.new_values, null, 2)
                            navigator.clipboard.writeText(jsonStr)
                            alert('JSON copied to clipboard!')
                          }}
                        >
                          Copy JSON
                        </Button>
                        
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-gray-500">Lihat JSON mentah</summary>
                          <pre className="mt-1 text-xs overflow-x-auto p-2 bg-gray-100 rounded max-h-40 overflow-y-auto">
                            {JSON.stringify(entry.new_values, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
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