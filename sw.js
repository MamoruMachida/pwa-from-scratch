const staticAssets = [
    './',
    './style.css',
    './app.js',
]

self.addEventListener('install', async () => {
    const cache = await caches.open('news-static');
    cache.addAll(staticAssets);
});

self.addEventListener('fetch', e => {
    console.log(`fetch`);
    const req = e.request;
    e.respondWith(cacheFirst(req));
});

async function cacheFirst(req) {
    const cachedResposnse = await caches.match(req);
    return cachedResposnse || fetch(req);
}