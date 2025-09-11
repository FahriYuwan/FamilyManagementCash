'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { HouseholdService } from '@/lib/household-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Settings, 
  Palette, 
  Tag,
  User,
  Bell,
  Shield,
  Database
} from 'lucide-react'
import { HouseholdCategory } from '@/types'

interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  currency: 'USD' | 'IDR' | 'EUR' | 'GBP'
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
  language: 'en' | 'id'
  notifications: {
    email: boolean
    push: boolean
    weekly_report: boolean
    monthly_report: boolean
    low_balance_alert: boolean
    debt_reminders: boolean
  }
  privacy: {
    profile_visibility: 'private' | 'family' | 'public'
    data_sharing: boolean
    analytics: boolean
  }
}

const DEFAULT_CATEGORIES = [
  { name: 'Makanan & Makan', icon: '🍽️', color: '#EF4444' },
  { name: 'Transportasi', icon: '🚗', color: '#3B82F6' },
  { name: 'Belanja Kebutuhan', icon: '🛒', color: '#8B5CF6' },
  { name: 'Hiburan', icon: '🎬', color: '#F59E0B' },
  { name: 'Tagihan & Listrik', icon: '💡', color: '#10B981' },
  { name: 'Kesehatan', icon: '🏥', color: '#EF4444' },
  { name: 'Pendidikan', icon: '📚', color: '#6366F1' },
  { name: 'Hadiah & Sumbangan', icon: '🎁', color: '#EC4899' },
  { name: 'Perjalanan', icon: '✈️', color: '#06B6D4' },
  { name: 'Perawatan Rumah', icon: '🏠', color: '#84CC16' },
  { name: 'Asuransi', icon: '🛡️', color: '#64748B' },
  { name: 'Tabungan', icon: '💰', color: '#10B981' },
  { name: 'Investasi', icon: '📈', color: '#8B5CF6' },
  { name: 'Gaji', icon: '💼', color: '#059669' },
  { name: 'Kerja Sampingan', icon: '💻', color: '#7C3AED' },
  { name: 'Usaha', icon: '🏢', color: '#DC2626' }
]

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' }
]

const COLOR_OPTIONS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
  '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#C026D3', '#EC4899', '#F43F5E', '#64748B'
]

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const [categories, setCategories] = useState<HouseholdCategory[]>([])
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'light',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    language: 'en',
    notifications: {
      email: true,
      push: true,
      weekly_report: true,
      monthly_report: true,
      low_balance_alert: true,
      debt_reminders: true
    },
    privacy: {
      profile_visibility: 'family',
      data_sharing: false,
      analytics: true
    }
  })
  const [editingCategory, setEditingCategory] = useState<HouseholdCategory | null>(null)
  const [newCategory, setNewCategory] = useState({ name: '', icon: '', color: COLOR_OPTIONS[0] })
  const [showAddForm, setShowAddForm] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      setDataLoading(true)
      const householdService = new HouseholdService()
      const categoriesData = await householdService.getCategories(user!.id)
      setCategories(categoriesData)
      
      // Load user preferences from localStorage or API
      const savedPreferences = localStorage.getItem(`preferences_${user!.id}`)
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences))
      }
    } catch (error) {
      console.error('Error loading settings data:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const savePreferences = async () => {
    try {
      setSaving(true)
      // Save to localStorage (in production, save to database)
      localStorage.setItem(`preferences_${user!.id}`, JSON.stringify(preferences))
      alert('Preferences saved successfully!')
    } catch (error) {
      console.error('Error saving preferences:', error)
      alert('Error saving preferences')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) return

    try {
      const householdService = new HouseholdService()
      await householdService.createCategory(user!.id, {
        name: newCategory.name,
        icon: newCategory.icon || '📝',
        color: newCategory.color
      })
      
      await loadData()
      setNewCategory({ name: '', icon: '', color: COLOR_OPTIONS[0] })
      setShowAddForm(false)
    } catch (error) {
      console.error('Error creating category:', error)
      alert('Error creating category')
    }
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory) return

    try {
      const householdService = new HouseholdService()
      await householdService.updateCategory(editingCategory.id, {
        name: editingCategory.name,
        icon: editingCategory.icon,
        color: editingCategory.color
      })
      
      await loadData()
      setEditingCategory(null)
    } catch (error) {
      console.error('Error updating category:', error)
      alert('Error updating category')
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      const householdService = new HouseholdService()
      await householdService.deleteCategory(categoryId)
      await loadData()
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Error deleting category')
    }
  }

  const addDefaultCategories = async () => {
    try {
      const householdService = new HouseholdService()
      
      for (const category of DEFAULT_CATEGORIES) {
        await householdService.createCategory(user!.id, category)
      }
      
      await loadData()
      alert('Default categories added successfully!')
    } catch (error) {
      console.error('Error adding default categories:', error)
      alert('Error adding default categories')
    }
  }

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your preferences and categories</p>
        </div>
        <Button onClick={savePreferences} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Expense Categories</CardTitle>
                <CardDescription>Manage your transaction categories</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button onClick={addDefaultCategories} variant="outline" size="sm">
                  <Database className="h-4 w-4 mr-2" />
                  Add Defaults
                </Button>
                <Button onClick={() => setShowAddForm(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Add New Category Form */}
              {showAddForm && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h4 className="font-medium mb-3">Add New Category</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Category name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                      <input
                        type="text"
                        value={newCategory.icon}
                        onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="🏠"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                      <div className="grid grid-cols-6 gap-2">
                        {COLOR_OPTIONS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setNewCategory({ ...newCategory, color })}
                            className={`w-8 h-8 rounded-full border-2 ${
                              newCategory.color === color ? 'border-gray-900' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-end space-x-2">
                      <Button onClick={handleCreateCategory} size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button onClick={() => setShowAddForm(false)} variant="outline" size="sm">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Categories List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <div key={category.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    {editingCategory?.id === category.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editingCategory.name}
                          onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <input
                          type="text"
                          value={editingCategory.icon || ''}
                          onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Icon"
                        />
                        <div className="grid grid-cols-6 gap-1">
                          {COLOR_OPTIONS.map((color) => (
                            <button
                              key={color}
                              onClick={() => setEditingCategory({ ...editingCategory, color })}
                              className={`w-6 h-6 rounded-full border ${
                                editingCategory.color === color ? 'border-gray-900 border-2' : 'border-gray-300'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <div className="flex space-x-2">
                          <Button onClick={handleUpdateCategory} size="sm">
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button onClick={() => setEditingCategory(null)} variant="outline" size="sm">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                            style={{ backgroundColor: category.color }}
                          >
                            {category.icon || '📝'}
                          </div>
                          <div>
                            <h4 className="font-medium">{category.name}</h4>
                            {category.is_default && (
                              <span className="text-xs text-gray-500">Default</span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button 
                            onClick={() => setEditingCategory(category)} 
                            variant="ghost" 
                            size="sm"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {!category.is_default && (
                            <Button 
                              onClick={() => handleDeleteCategory(category.id)} 
                              variant="ghost" 
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tema Tampilan</label>
                  <select
                    value={preferences.theme}
                    onChange={(e) => setPreferences({ ...preferences, theme: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="light">Terang</option>
                    <option value="dark">Gelap</option>
                    <option value="system">Ikuti Sistem</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bahasa</label>
                  <select
                    value={preferences.language}
                    onChange={(e) => setPreferences({ ...preferences, language: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="en">English</option>
                    <option value="id">Bahasa Indonesia</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Format Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                  <select
                    value={preferences.currency}
                    onChange={(e) => setPreferences({ ...preferences, currency: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                  <select
                    value={preferences.dateFormat}
                    onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notification Settings
              </CardTitle>
              <CardDescription>Choose what notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Delivery Methods</h4>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={preferences.notifications.email}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          notifications: { ...preferences.notifications, email: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm">Email notifications</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={preferences.notifications.push}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          notifications: { ...preferences.notifications, push: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm">Push notifications</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Report Notifications</h4>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={preferences.notifications.weekly_report}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          notifications: { ...preferences.notifications, weekly_report: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm">Weekly financial reports</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={preferences.notifications.monthly_report}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          notifications: { ...preferences.notifications, monthly_report: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm">Monthly financial reports</span>
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Privacy & Security
              </CardTitle>
              <CardDescription>Control your data and privacy settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">Profile Visibility</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      value="private"
                      checked={preferences.privacy.profile_visibility === 'private'}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        privacy: { ...preferences.privacy, profile_visibility: e.target.value as any }
                      })}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <span className="text-sm font-medium">Private</span>
                      <p className="text-xs text-gray-500">Only you can see your financial data</p>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      value="family"
                      checked={preferences.privacy.profile_visibility === 'family'}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        privacy: { ...preferences.privacy, profile_visibility: e.target.value as any }
                      })}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <span className="text-sm font-medium">Family</span>
                      <p className="text-xs text-gray-500">Family members can see your data</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Data Preferences</h4>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={preferences.privacy.data_sharing}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        privacy: { ...preferences.privacy, data_sharing: e.target.checked }
                      })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <span className="text-sm">Allow data sharing for app improvements</span>
                      <p className="text-xs text-gray-500">Anonymous data to help improve the app</p>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={preferences.privacy.analytics}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        privacy: { ...preferences.privacy, analytics: e.target.checked }
                      })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <span className="text-sm">Allow analytics</span>
                      <p className="text-xs text-gray-500">Help us understand how you use the app</p>
                    </div>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}