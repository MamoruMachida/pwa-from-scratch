// CacheStorageに登録する名前
const cacheName = 'news-v1';
// キャッシュしておきたいstaticAssets
const staticAssets = [
    './',
    './style.css',
    './app.js',
    './fallback.json',
    './images/fetch-dog.jpg'
];

// ServiceWorkerへの登録が済んだ際に発行される'install'イベントへの紐付け
self.addEventListener('install', async () => {
    // cachesはCacheStorageのクライアント
    // データがあってもなくても開き、使用する準備をします。
    const cache = await caches.open(cacheName);
    // キャッシュしておきたいAssetsを追加します。
    cache.addAll(staticAssets);
});

// fetch()が呼ばれた際のイベントへの紐付けを行います。
self.addEventListener('fetch', e => {
    const req = e.request;
    const url = new URL(req.url);
    // アクセスが自身のページか、外部ページかどうか判定しています。
    if (url.origin === location.origin) {
        // 自身のページならばキャッシュしたstaticAssetsから取得できるか試す。
        e.respondWith(cacheFirst(req));
    } else {
        // 外部ページならばHTTPのリクエストを行い、失敗したらキャッシュ、またはエラーページを出す。
        e.respondWith(networkFirst(req));
    }
});

// キャッシュ>リクエストのレスポンスの順で取得する。
// 今回は主に自身のstaticAssetsの取得に使用
async function cacheFirst(req) {
    const cachedResponse = await caches.match(req);
    return cachedResponse || fetch(req);
}

// リクエストのレスポンス>キャッシュ>エラーデータの順で取得する。
// 今回は外部ページへのリクエストの制御に使用しています。
async function networkFirst(req) {
    const cache = await caches.open('news-dynamic');
    try {
        const res = await fetch(req);
        cache.put(req, res.clone());
        return res;
    } catch (error) {
        const cachedResponse = await cache.match(req);
        return cachedResponse || await caches.match('./fallback.json');
    }
}