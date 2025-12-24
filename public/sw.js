// Service Worker para caché offline
const CACHE_VERSION = 'v1';
const CACHE_NAME = `eipet-cache-${CACHE_VERSION}`;

// Recursos estáticos a cachear
const STATIC_CACHE_URLS = [
  '/',
  '/products',
  '/favicon.svg'
];

// Estrategias de caché
const CACHE_STRATEGIES = {
  // Cache First: para categorías y marcas (cambian poco)
  CACHE_FIRST: 'cache-first',
  // Network First: para productos (más actualizados)
  NETWORK_FIRST: 'network-first',
  // Network Only: para datos que siempre deben ser frescos
  NETWORK_ONLY: 'network-only'
};

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cacheando recursos estáticos');
      return cache.addAll(STATIC_CACHE_URLS);
    }).then(() => {
      // Forzar activación inmediata
      return self.skipWaiting();
    })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Tomar control de todas las páginas
      return self.clients.claim();
    })
  );
});

// Interceptar peticiones
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Solo cachear peticiones GET
  if (event.request.method !== 'GET') {
    return;
  }

  // NO interceptar peticiones a Firebase Storage (firebasestorage.googleapis.com)
  // Estas deben ir directamente a la red sin pasar por el Service Worker
  if (url.hostname.includes('firebasestorage.googleapis.com') || 
      url.hostname.includes('firebaseapp.com') ||
      url.hostname.includes('googleapis.com')) {
    // Dejar que las peticiones a Firebase pasen directamente
    return;
  }

  // NO interceptar peticiones a Firestore API
  if (url.hostname.includes('firestore.googleapis.com')) {
    return;
  }

  // Determinar estrategia según el tipo de recurso
  if (url.pathname.includes('/categories') || url.pathname.includes('/brands')) {
    // Cache First para categorías y marcas
    event.respondWith(cacheFirstStrategy(event.request));
  } else if (url.pathname.includes('/products')) {
    // Network First para productos
    event.respondWith(networkFirstStrategy(event.request));
  } else if (url.origin === self.location.origin) {
    // Cache First para recursos estáticos de la misma origen
    event.respondWith(cacheFirstStrategy(event.request));
  } else {
    // Network Only para otros recursos
    event.respondWith(networkOnlyStrategy(event.request));
  }
});

// Estrategia Cache First: primero busca en caché, luego en red
async function cacheFirstStrategy(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Cache hit:', request.url);
      // Actualizar caché en segundo plano si hay conexión
      fetch(request).then((response) => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
      }).catch(() => {
        // Ignorar errores de actualización en segundo plano
      });
      return cachedResponse;
    }
    
    // Si no está en caché, obtener de la red
    console.log('[SW] Cache miss, obteniendo de red:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Error en cacheFirstStrategy:', error);
    // Si falla todo, intentar devolver respuesta básica
    return new Response('Offline', { status: 503 });
  }
}

// Estrategia Network First: primero intenta red, luego caché
async function networkFirstStrategy(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    
    try {
      // Intentar obtener de la red primero
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        console.log('[SW] Network response OK:', request.url);
        // Actualizar caché con la respuesta fresca
        cache.put(request, networkResponse.clone());
        return networkResponse;
      }
    } catch (networkError) {
      console.log('[SW] Network falló, buscando en caché:', request.url);
    }
    
    // Si la red falla, buscar en caché
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('[SW] Usando respuesta de caché:', request.url);
      return cachedResponse;
    }
    
    // Si no hay nada en caché, devolver error
    return new Response('Offline y sin caché', { status: 503 });
  } catch (error) {
    console.error('[SW] Error en networkFirstStrategy:', error);
    return new Response('Error', { status: 500 });
  }
}

// Estrategia Network Only: solo red, sin caché
async function networkOnlyStrategy(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.error('[SW] Error en networkOnlyStrategy:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Mensajes del cliente para invalidar caché
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[SW] Limpiando caché...');
    caches.delete(CACHE_NAME).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  } else if (event.data && event.data.type === 'CACHE_DATA') {
    // Cachear datos específicos desde el cliente
    const { key, data } = event.data;
    caches.open(CACHE_NAME).then((cache) => {
      const response = new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      });
      cache.put(new Request(`/cache/${key}`), response);
    });
  }
});

