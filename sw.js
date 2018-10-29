/* eslint-env browser, serviceworker, es6 */
'use strict';

/* eslint-disable max-len */

const applicationServerPublicKey = 'BH8-hIchXKMI6AKSee8gD0hhPThRqaEhIEtMJwcTjEQhiOKdG-_2tTIO-6hOAK4kwg5M9Saedjxp4hVE-khhWxY';

/* eslint-enable max-len */

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// CacheStorageに登録する名前
const cacheName = 'news-v1';
// キャッシュしておきたいstaticAssets
const staticAssets = [
    './',
    './style.css',
    './app.js',
    './fallback.json',
    './images/fetch-dog.jpg',
    './images/icon.png',
    './images/badge.png'
];
const applicationServerPrivKey = 'e61JIYf95H0UjWQHXZF99-HDxVF3q3OBc5YLyz0dUC8';

// ServiceWorkerへの登録が済んだ際に発行される'install'イベントへの紐付け
self.addEventListener('install', async () => {
    // cachesはCacheStorageのクライアント
    // データがあってもなくても開き、使用する準備をします。
    const cache = await caches.open(cacheName);
    // キャッシュしておきたいAssetsを追加します。
    cache.addAll(staticAssets);
});

// fetch()が呼ばれた際のイベントへの紐付けを行います。
self.addEventListener('fetch', async (e) => {
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

// リクエストのレスポンス>キャッシュ>エラーデータの順で取得する。
// 今回は外部ページへのリクエストの制御に使用しています。
async function networkFirst(req) {
    const cache = await caches.open('news-dynamic');
    try {
        const res = await fetch(req);
        await cache.put(req, res.clone());
        return res;
    } catch (error) {
        const cachedResponse = await cache.match(req);
        return cachedResponse || await caches.match('./fallback.json');
    }
}

// pushイベントを感知してNotificationを表示する
self.addEventListener('push', function (event) {
    console.log('[Service Worker] Push Received.');
    console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

    const title = 'Push Codelab';
    const options = {
        body: 'Yay it works.',
        icon: './images/icon.png',
        badge: './images/badge.png'
    };

    // waitUntilはPromiseを受け取り、そのPromiseが解決されるまで処理を継続する。
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification click Received.');

    event.notification.close();

    event.waitUntil(
        clients.openWindow('https://developers.google.com/web/')
    );
});