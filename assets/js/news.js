// News Integration - ETF Intelligence Hub
const NEWS_RSS_URL = 'https://www.cnbc.com/id/100003114/device/rss/rss.html'; // Top News
const RSS_CONVERTER_API = 'https://api.rss2json.com/v1/api.json?rss_url=';

async function fetchNews() {
    try {
        const response = await fetch(RSS_CONVERTER_API + encodeURIComponent(NEWS_RSS_URL));
        const data = await response.json();
        
        if (data.status === 'ok' && data.items) {
            renderNewsFeed(data.items);
            // Optionally update map markers based on news content
            updateMapWithNews(data.items);
        }
    } catch (error) {
        console.error("Erro ao buscar notícias:", error);
    }
}

function renderNewsFeed(items) {
    const feedContainer = document.querySelector('.space-y-6.overflow-y-auto');
    if (!feedContainer) return;
    
    feedContainer.innerHTML = ''; // Clear mock
    
    items.slice(0, 8).forEach(item => {
        const date = new Date(item.pubDate);
        const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        const newsEl = document.createElement('div');
        newsEl.className = 'border-l-2 border-blue-500 pl-4 py-1 animate-fade';
        newsEl.innerHTML = `
            <span class="text-[10px] text-slate-500 block uppercase">${timeStr}</span>
            <h4 class="font-semibold text-sm leading-tight hover:text-blue-400 cursor-pointer transition">
                <a href="${item.link}" target="_blank">${item.title}</a>
            </h4>
            <p class="text-[10px] text-slate-400 mt-1">${item.author || 'Global News'}</p>
        `;
        feedContainer.appendChild(newsEl);
    });
}

function updateMapWithNews(items) {
    // This is a simple heuristic: if news mentions a country, move the map or add a marker
    // For a real app, we'd use a Geocoding API or a NLP service.
    const regionKeywords = {
        'US': [38.89, -77.03],
        'Brazil': [-23.55, -46.63],
        'China': [39.90, 116.40],
        'Europe': [48.85, 2.35],
        'UK': [51.50, -0.12],
        'Japan': [35.67, 139.65],
        'Germany': [52.52, 13.40]
    };

    // We can clear old dynamic markers and add new ones based on the first few news titles
    if (window.addNewsMarker) {
        items.slice(0, 3).forEach(item => {
            for (let [region, coords] of Object.entries(regionKeywords)) {
                if (item.title.toLowerCase().includes(region.toLowerCase())) {
                    window.addNewsMarker(coords, item.title);
                    break;
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchNews();
    setInterval(fetchNews, 600000); // 10 minutes
});
