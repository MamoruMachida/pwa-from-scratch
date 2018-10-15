const apiKey = '87fe463ccbef4c9cabc36aad233d2fc6';
const main = document.querySelector('main');
const sourceSelector = document.querySelector('#sources');
const defaultSource = 'the-washington-post';

window.addEventListener('load', async e => {
    updateNews();
    await updateSources();
    sourceSelector.value = defaultSource;

    sourceSelector.addEventListener('change', e => {
        updateNews(e.target.value);
    });

    if('serviceWorker' in navigator) {
        try {
            navigator.serviceWorker.register('sw.js');
            console.log(`SW registered`);
        } catch (error) {
            console.log(`SW not registered`);
        }
    }
});

async function updateSources() {
    const res = await fetch(`http://newsapi.org/v1/sources`);
    const json = await res.json();

    sourceSelector.innerHTML = json.sources
        .map(src => `<option value="${src.id}">${src.name}</option>`)
        .join('\n');
}

async function updateNews(source = defaultSource) {
    const res = await fetch(`http://newsapi.org/v1/articles?source=${source}&apiKey=${apiKey}`)
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