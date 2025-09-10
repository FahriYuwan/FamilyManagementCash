import Link from 'next/link'
import { Home, PlusCircle, BarChart3, Settings, Wallet, Package } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Wallet className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Family Cash</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Selamat datang!</span>
              <Link href="/auth/login" className="btn-primary">
                Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Kelola Keuangan
            <span className="text-primary-600"> Keluarga & Usaha</span>
          </h2>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Aplikasi PWA untuk mencatat keuangan rumah tangga dan usaha konveksi. 
            Install di smartphone, akses offline, sinkronisasi otomatis.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link href="/auth/login" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10">
                Mulai Sekarang
              </Link>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Link href="#features" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10">
                Pelajari Lebih Lanjut
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="mt-24">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-gray-900">Fitur Utama</h3>
            <p className="mt-4 text-lg text-gray-600">
              Solusi lengkap untuk mengelola keuangan keluarga dan usaha
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Keuangan Rumah Tangga */}
            <div className="card">
              <div className="flex items-center">
                <Home className="h-8 w-8 text-primary-600" />
                <h4 className="ml-3 text-lg font-medium text-gray-900">Keuangan Rumah Tangga</h4>
              </div>
              <p className="mt-3 text-gray-500">
                Catat pemasukan dan pengeluaran harian dengan kategori yang dapat disesuaikan.
              </p>
              <ul className="mt-4 text-sm text-gray-600 space-y-1">
                <li>• Kategori default (makan, transport, listrik)</li>
                <li>• Custom kategori sesuai kebutuhan</li>
                <li>• Laporan pie chart per kategori</li>
              </ul>
            </div>

            {/* Usaha Konveksi */}
            <div className="card">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-primary-600" />
                <h4 className="ml-3 text-lg font-medium text-gray-900">Usaha Konveksi</h4>
              </div>
              <p className="mt-3 text-gray-500">
                Kelola order, breakdown biaya, dan hitung laba rugi per pesanan.
              </p>
              <ul className="mt-4 text-sm text-gray-600 space-y-1">
                <li>• Input order dengan detail pelanggan</li>
                <li>• Breakdown biaya (bahan, produksi, tenaga kerja)</li>
                <li>• Laporan laba rugi otomatis</li>
              </ul>
            </div>

            {/* Laporan & Analisa */}
            <div className="card">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-primary-600" />
                <h4 className="ml-3 text-lg font-medium text-gray-900">Laporan & Analisa</h4>
              </div>
              <p className="mt-3 text-gray-500">
                Dashboard visual dengan grafik dan ekspor laporan ke PDF/Excel.
              </p>
              <ul className="mt-4 text-sm text-gray-600 space-y-1">
                <li>• Grafik pemasukan vs pengeluaran</li>
                <li>• Ringkasan harian, mingguan, bulanan</li>
                <li>• Ekspor laporan PDF & Excel</li>
              </ul>
            </div>

            {/* Input Cepat */}
            <div className="card">
              <div className="flex items-center">
                <PlusCircle className="h-8 w-8 text-primary-600" />
                <h4 className="ml-3 text-lg font-medium text-gray-900">Input Cepat</h4>
              </div>
              <p className="mt-3 text-gray-500">
                Interface mobile-friendly untuk input transaksi dengan cepat dan mudah.
              </p>
              <ul className="mt-4 text-sm text-gray-600 space-y-1">
                <li>• Form sederhana dan intuitif</li>
                <li>• Akses offline untuk input darurat</li>
                <li>• Sinkronisasi otomatis saat online</li>
              </ul>
            </div>

            {/* Multi-User */}
            <div className="card">
              <div className="flex items-center">
                <Settings className="h-8 w-8 text-primary-600" />
                <h4 className="ml-3 text-lg font-medium text-gray-900">Multi-User</h4>
              </div>
              <p className="mt-3 text-gray-500">
                Akses untuk ayah dan ibu dengan role yang berbeda sesuai kebutuhan.
              </p>
              <ul className="mt-4 text-sm text-gray-600 space-y-1">
                <li>• Login aman dengan Supabase Auth</li>
                <li>• Role ayah: akses semua fitur</li>
                <li>• Role ibu: fokus rumah tangga</li>
              </ul>
            </div>

            {/* PWA Features */}
            <div className="card">
              <div className="flex items-center">
                <Wallet className="h-8 w-8 text-primary-600" />
                <h4 className="ml-3 text-lg font-medium text-gray-900">Progressive Web App</h4>
              </div>
              <p className="mt-3 text-gray-500">
                Install seperti aplikasi native, akses offline, notifikasi push.
              </p>
              <ul className="mt-4 text-sm text-gray-600 space-y-1">
                <li>• Install di Android, iOS, Desktop</li>
                <li>• Bekerja offline</li>
                <li>• Update otomatis</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center">
          <h3 className="text-2xl font-bold text-gray-900">Siap Mulai Mengelola Keuangan?</h3>
          <p className="mt-4 text-lg text-gray-600">
            Daftar sekarang dan rasakan kemudahan mengelola keuangan keluarga & usaha
          </p>
          <div className="mt-8">
            <Link href="/auth/register" className="btn-primary text-lg px-8 py-3">
              Daftar Gratis
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-500">&copy; 2025 Family Management Cash. Dibuat untuk PKL.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}