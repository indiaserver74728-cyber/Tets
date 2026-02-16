const CACHE_NAME = 'warhub-v1';
const assetsToCache = [
    '/',
    '/index.html',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/lucide@latest',
    // All images from assets.ts
    'https://i.ibb.co/3kC5bC1/QZT1xHE.jpeg',
    'https://i.ibb.co/bF9g05d/k2msaY1.jpeg',
    'https://i.ibb.co/ZJ3nC5z/5lI4C0N.jpeg',
    'https://i.ibb.co/Yhv7gJv/i9OPd1g.jpeg',
    'https://i.ibb.co/0Jt8C3d/c1g23gX.jpeg',
    'https://i.ibb.co/mBv04vj/o1bcsi0.jpeg',
    'https://i.ibb.co/q0Vv9D1/jY4z55e.jpeg',
    'https://i.ibb.co/2dG4Q0c/5aB6A31.png',
    'https://i.ibb.co/sKk3Pq4/P4a4n62.png',
    'https://i.ibb.co/RSC51B6/V7a6nZ0.png',
    'https://i.ibb.co/gDHs2z2/2uS0aG1.png',
    'https://i.ibb.co/zH9X5pZ/ChImk6h.png',
    'https://www.transparenttextures.com/patterns/subtle-prism.png',
    'https://i.ibb.co/8N1VY27/eB4GPci.png',
    'https://i.ibb.co/wB7zT0R/tLe3hA1.png',
    'https://i.ibb.co/R4Hbj59/Gg5Z3rC.png',
    'https://i.ibb.co/7tD0RXsd/7009bdd1a131.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('ServiceWorker: Caching app shell');
            return cache.addAll(assetsToCache);
        })
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }
    
    const url = new URL(event.request.url);

    // Don't cache Firestore or other Google API requests to ensure data is always fresh.
    if (url.hostname.includes('googleapis.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                // Cache hit - return response
                return response;
            }

            return fetch(event.request).then((response) => {
                // Check if we received a valid response
                if (!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors')) {
                    return response;
                }

                // Clone the response to store it in the cache.
                const responseToCache = response.clone();

                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            });
        })
    );
});
