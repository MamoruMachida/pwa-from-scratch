/* eslint-env browser, es7 */
'use strict';

const apiKey = '87fe463ccbef4c9cabc36aad233d2fc6';
const applicationServerPubKey = 'BLEp9zk0_wpydHwcyX1r99rd6pJiQXsB_f4WU-qo_Y_XCoIQ8DRS0ROYncracaUXV7OZHmrT3OehSVX8LnfkI0M';
const main = document.querySelector('main');
const sourceSelector = document.querySelector('#sources');
const defaultSource = 'the-washington-post';
const subscribeButton = document.querySelector('#subscribeButton');
let isSubscribed;
let swRegistration;

window.addEventListener('load', async e => {
    updateNews();
    await updateSources();
    sourceSelector.value = defaultSource;

    sourceSelector.addEventListener('change', e => {
        updateNews(e.target.value);
    });

    // ServiceWorkerに対応しているブラウザか判定
    if('serviceWorker' in navigator) {
        try {
            // sw.jsをサービスワーカーに登録
            swRegistration = await navigator.serviceWorker.register('sw.js');
            console.log(`SW registered`);
        } catch (error) {
            console.log(`SW not registered`);
        }

        // PushManagerに対応しているか確認する
        if ('PushManager' in window) {
            console.log('Push is supported');
            initializeSubscribeBtn();
        } else {
            console.warn('Push messaging is not supported');
            subscribeButton.textContent = 'Push Not Supported';
            subscribeButton.disabled = true;
        }
    }
});

async function initializeSubscribeBtn() {

    subscribeButton.addEventListener('click', () => {
        subscribeButton.disabled = true;
        if (isSubscribed) {
            // TODO: un subscribe user
        } else {
            subscribeUser();
        }
    });

    // Set the initial subscription value
    const subscription = await swRegistration.pushManager.getSubscription();
    isSubscribed = !(subscription === null);

    if (isSubscribed) {
        console.log('User is subscribed.');
    } else {
        console.log('User is NOT subscribed.');
    }
    updateSubscribeBtn();
}

function updateSubscribeBtn() {
    if (Notification.permission === 'denied') {
        subscribeButton.textContent = 'Push Messaging Blocked.';
        subscribeButton.disabled = true;
        updateSubscriptionOnServer(null);
        return;
    }

    subscribeButton.textContent = isSubscribed ? 'Un Subscribe' : 'Subscribe';
    subscribeButton.disabled = false;
}

async function updateSources() {
    const res = await fetch(`https://newsapi.org/v2/sources?apiKey=${apiKey}`);
    const json = await res.json();

    sourceSelector.innerHTML = json.sources
        .map(src => `<option value="${src.id}">${src.name}</option>`)
        .join('\n');
}

function subscribeUser() {
    const applicationServerKey = urlB64ToUint8Array(applicationServerPubKey);
    swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
    })
    .then((subscription) => {
        console.log('User is subscribed');
        console.log(JSON.stringify(subscription));

        updateSubscriptionOnServer(subscription);

        isSubscribed = true;

        updateSubscribeBtn();
    })
    .catch((err) => {
        console.log(`Failed to subscribe the user: ${err}`);
        updateSubscribeBtn();
    });
}

function unsubscribeUser() {
    swRegistration.pushManager.getSubscription()
    .then(function(subscription) {
      if (subscription) {
        return subscription.unsubscribe();
      }
    })
    .catch(function(error) {
      console.log('Error unsubscribing', error);
    })
    .then(function() {
      updateSubscriptionOnServer(null);

      console.log('User is unsubscribed.');
      isSubscribed = false;

      updateSubscribeBtn();
    });
  }

function updateSubscriptionOnServer(subscription) {
     // TODO: Send subscription to application server
    console.log(subscription);
}

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

async function updateNews(source = defaultSource) {
    const res = await fetch(`https://newsapi.org/v2/top-headlines?sources=${source}&sortBy=top&apiKey=${apiKey}`)
    const json = await res.json();

    main.innerHTML = json.articles.map(createArticle).join('\n');
}

function createArticle(article) {
    return `
        <div class="article">
            <a href="${article.url}">
                <h2>${article.title}</h2>
                <img src="${article.urlToImage}" alt="${article.title}">
                <p>${article.description}</p>
            </a>
        </div>
    `;
}