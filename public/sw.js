const CACHE_NAME = 'family-cash-v1'
const urlsToCache = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/manifest.json',
  '/icon-192x190.png',
  '/icon-512x512.png'
]

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  )
  self.skipWaiting()
})

// Fetch event
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and external URLs
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return
  }

  // Skip API routes for real-time data
  if (event.request.url.includes('/api/') || event.request.url.includes('/supabase/')) {
    return
  }

  // Handle navigation requests (for PWA navigation)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/auth/login')
        .then((response) => {
          return response || fetch(event.request).catch(() => {
            // If fetch fails, serve the login page from cache as fallback
            return caches.match('/auth/login')
          })
        })
    )
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
      })
  )
})

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})