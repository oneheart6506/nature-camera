/**
 * sw.js - Network-First for HTML/Code, Cache-Fallback for Offline
 */
const CACHE_NAME = 'nature-cam-v3.6';

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/src/main.js',
  '/src/styles/reset.css',
  '/src/styles/variables.css',
  '/src/styles/themes.css',
  '/src/styles/base.css',
  '/src/styles/components/camera.css',
  '/src/styles/components/toast.css',
  '/src/styles/components/gallery.css',
  '/src/styles/components/auth.css',
  '/src/modules/camera/cameraEngine.js',
  '/src/modules/canvas/frameRenderer.js',
  '/src/modules/canvas/postcardRenderer.js',
  '/src/modules/sensors/telemetryEngine.js',
  '/src/modules/storage/journalStore.js',
  '/src/modules/storage/cloudinaryUploader.js',
  '/src/modules/storage/cloudJournal.js',
  '/src/modules/auth/authManager.js',
  '/src/constants/aspectRatios.js',
  '/src/constants/filters.js',
  '/src/constants/frames.js',
  '/src/constants/categories.js',
  '/src/constants/cloudinary.js',
  '/src/constants/firebase.js'
];



self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null))
      )
    ).then(() => self.clients.claim())
  );
});

// Network-First for navigations, Cache-First for static assets
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
