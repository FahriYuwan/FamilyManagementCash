'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-6 text-center">
        <div className="mb-8">
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-3-8.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM12 18.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
            />
          </svg>
        </div>
        
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-gray-600 mb-8">
          Maaf, halaman yang Anda cari tidak dapat ditemukan. Mungkin halaman telah dipindahkan atau dihapus.
        </p>
        
        <div className="space-y-3">
          <Link href="/" className="block">
            <Button className="w-full">
              Kembali ke Beranda
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full"
          >
            Kembali ke Halaman Sebelumnya
          </Button>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Butuh bantuan?{' '}
            <Link href="mailto:support@familycash.com" className="text-primary-600 hover:text-primary-700">
              Hubungi kami
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}