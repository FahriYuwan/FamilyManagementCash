import Link from 'next/link'
import { Wallet, ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href="/auth/register" className="mr-4">
              <ArrowLeft className="h-5 w-5 text-gray-600 hover:text-gray-900" />
            </Link>
            <div className="flex items-center">
              <Wallet className="h-6 w-6 text-primary-600 mr-2" />
              <h1 className="text-xl font-bold text-gray-900">Family Cash</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Syarat & Ketentuan</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-sm text-gray-500 mb-6">
              Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Penerimaan Syarat</h2>
              <p className="text-gray-700 mb-4">
                Dengan menggunakan aplikasi Family Management Cash ("Aplikasi"), Anda menyetujui untuk terikat dengan syarat dan ketentuan ini.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Deskripsi Layanan</h2>
              <p className="text-gray-700 mb-4">
                Family Management Cash adalah aplikasi Progressive Web App (PWA) yang dirancang untuk membantu keluarga mengelola keuangan rumah tangga dan usaha konveksi.
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Pencatatan keuangan rumah tangga</li>
                <li>Manajemen usaha konveksi (untuk role Ayah)</li>
                <li>Laporan dan analisis keuangan</li>
                <li>Export data ke PDF dan Excel</li>
                <li>Akses multi-user dengan role berbeda</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Akun Pengguna</h2>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Anda bertanggung jawab menjaga keamanan akun dan password</li>
                <li>Informasi yang Anda berikan harus akurat dan terkini</li>
                <li>Anda tidak boleh berbagi akun dengan orang lain</li>
                <li>Segera laporkan jika terjadi penggunaan akun yang tidak sah</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Privasi Data</h2>
              <p className="text-gray-700 mb-4">
                Kami berkomitmen melindungi privasi data Anda:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Data keuangan Anda disimpan dengan aman menggunakan Supabase</li>
                <li>Data tidak akan dibagikan kepada pihak ketiga tanpa persetujuan</li>
                <li>Anda dapat menghapus akun dan data kapan saja</li>
                <li>Kami menggunakan enkripsi untuk melindungi data sensitif</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Penggunaan yang Dilarang</h2>
              <p className="text-gray-700 mb-4">Anda tidak diperkenankan:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Menggunakan aplikasi untuk tujuan ilegal</li>
                <li>Mencoba mengakses akun orang lain</li>
                <li>Merusak atau mengganggu infrastruktur aplikasi</li>
                <li>Melakukan reverse engineering pada aplikasi</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Batasan Tanggung Jawab</h2>
              <p className="text-gray-700 mb-4">
                Aplikasi ini disediakan "sebagaimana adanya". Kami tidak bertanggung jawab atas:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Kehilangan data akibat kesalahan pengguna</li>
                <li>Keputusan keuangan berdasarkan data dalam aplikasi</li>
                <li>Gangguan layanan yang di luar kendali kami</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Perubahan Syarat</h2>
              <p className="text-gray-700 mb-4">
                Kami berhak mengubah syarat dan ketentuan ini. Perubahan akan diberitahukan melalui aplikasi atau email yang terdaftar.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Kontak</h2>
              <p className="text-gray-700 mb-4">
                Jika Anda memiliki pertanyaan tentang syarat dan ketentuan ini, silakan hubungi kami di:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> support@familycash.com<br />
                  <strong>Aplikasi:</strong> Family Management Cash<br />
                  <strong>Tujuan:</strong> PKL (Praktik Kerja Lapangan)
                </p>
              </div>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Dengan mendaftar dan menggunakan aplikasi Family Management Cash, Anda menyatakan telah membaca, 
                memahami, dan menyetujui seluruh syarat dan ketentuan di atas.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}