/**
 * sw.js - Service Worker for Nature Camera
 * Provides offline App Shell caching and instantaneous boots.
 */
const CACHE_NAME = 'nature-cam-v1.4'; // BUMP TO v1.3

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/src/main.js',
  '/src/styles/reset.css',
  '/src/styles/variables.css',
  '/src/styles/base.css',
  '/src/styles/components/camera.css',
  '/src/styles/components/toast.css',
  '/src/styles/components/gallery.css',
  '/src/styles/components/auth.css',
  '/src/modules/camera/cameraEngine.js',
  '/src/modules/canvas/frameRenderer.js',
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


// 1. INSTALL: Pre-cache the App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('🌿 Precaching Nature Camera app shell...');
      return cache.addAll(APP_SHELL);
    }).then(() => self.skipWaiting()) // Activate new SW immediately
  );
});

// 2. ACTIVATE: Purge older cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('🧹 Removing obsolete cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all open pages immediately
  );
});

// 3. FETCH: Cache-first strategy for instant offline loads
self.addEventListener('fetch', (event) => {
  // Only handle standard GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // Return cached asset instantly
      }

      // If not in cache, request from network
      return fetch(event.request).catch(() => {
        // Fallback to cached index.html for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
