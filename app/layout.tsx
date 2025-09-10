import './globals.css'
import { Inter } from 'next/font/google'
import { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { AuthProvider } from '@/lib/auth'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Family Management Cash',
    template: '%s | Family Management Cash'
  },
  description: 'Aplikasi pencatatan keuangan keluarga dan usaha konveksi',
  manifest: '/manifest.json',
  keywords: ['keuangan', 'keluarga', 'konveksi', 'pencatatan', 'PWA', 'family', 'finance'],
  authors: [{ name: 'Family Management Team' }],
  creator: 'Family Management Team',
  publisher: 'Family Management Team',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [{ url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Family Cash',
  },
  openGraph: {
    type: 'website',
    siteName: 'Family Management Cash',
    title: 'Family Management Cash',
    description: 'Aplikasi pencatatan keuangan keluarga dan usaha konveksi',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    images: [{
      url: '/icon-512x512.png',
      width: 512,
      height: 512,
      alt: 'Family Management Cash Logo'
    }]
  },
  twitter: {
    card: 'summary',
    title: 'Family Management Cash',
    description: 'Aplikasi pencatatan keuangan keluarga dan usaha konveksi',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Family Cash" />
        <meta name="application-name" content="Family Cash" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            {children}
          </div>
        </AuthProvider>
        
        {/* Service Worker Registration */}
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(registration) {
                    console.log('SW registered: ', registration);
                  })
                  .catch(function(registrationError) {
                    console.log('SW registration failed: ', registrationError);
                  });
              });
            }
          `}
        </Script>
        
        {/* Analytics (if enabled) */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}