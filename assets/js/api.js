// Brapi Integration - ETF Intelligence Hub
const BRAPI_TOKEN = 'tD9aPK2dMnGq5QNmEjoj6c';

// State to store market data
const state = {
    etfs: [],
    macro: {},
    indices: {}
};

/**
 * Fetch Main Indices & Macro Indicators
 */
async function fetchMarketOverview() {
    // Brapi Macro Endpoint
    const macroTickers = ['selic', 'ipca', 'cdi'];
    const indexTickers = ['^BVSP', 'IVVB11', 'USDBRL'];
    
    try {
        // Fetch Indices
        const idxRes = await fetch(`https://brapi.dev/api/quote/${indexTickers.join(',')}?token=${BRAPI_TOKEN}`);
        const idxData = await idxRes.json();
        
        // Fetch Macro
        const macroRes = await fetch(`https://brapi.dev/api/macro?token=${BRAPI_TOKEN}`);
        const macroData = await macroRes.json();
        
        if (idxData.results) {
            idxData.results.forEach(res => {
                state.indices[res.symbol] = res;
            });
        }
        
        // Update UI Widgets
        updateWidget('idx-ibov', state.indices['^BVSP']?.regularMarketPrice, state.indices['^BVSP']?.regularMarketChangePercent);
        updateWidget('idx-sp500', 'R$ ' + state.indices['IVVB11']?.regularMarketPrice, state.indices['IVVB11']?.regularMarketChangePercent);
        
        // Update Macro (Selic/CDI)
        const selic = macroData.find(m => m.name === 'Selic')?.value || '10,75';
        const ipca = macroData.find(m => m.name === 'IPCA')?.value || '4,50';
        
        document.getElementById('idx-dolar').innerText = selic + '%';
        document.getElementById('idx-dolar').previousElementSibling.innerText = 'TAXA SELIC';
        const selicChange = document.getElementById('idx-dolar').nextElementSibling;
        selicChange.innerText = 'Meta Mensal';
        selicChange.className = 'text-blue-400 text-xs font-medium';
        
    } catch (error) {
        console.error("Erro no fetchMarketOverview:", error);
    }
}

/**
 * Fetch Detailed ETF List
 */
async function fetchFeaturedETFs() {
    const etfTickers = ['WRLD11', 'BOVA11', 'HASH11', 'IVVB11', 'GOLD11', 'B5P211', 'LFTS11'];
    
    try {
        const response = await fetch(`https://brapi.dev/api/quote/${etfTickers.join(',')}?token=${BRAPI_TOKEN}&modules=defaultKeyStatistics`);
        const data = await response.json();
        
        if (data.results) {
            state.etfs = data.results;
            renderETFTable();
        }
    } catch (error) {
        console.error("Erro no fetchFeaturedETFs:", error);
    }
}

/**
 * Render ETF Table with Real Data & Sparklines
 */
function renderETFTable() {
    const tableBody = document.querySelector('tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = ''; 
    
    state.etfs.forEach(etf => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-white/5 transition border-b border-white/5 last:border-0';
        
        const isPositive = etf.regularMarketChangePercent >= 0;
        
        // Generate a pseudo-realistic sparkline based on the current change
        const sparklineSvg = generateSparkline(isPositive);
        
        row.innerHTML = `
            <td class="py-4">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-xs mr-3">${etf.symbol.substring(0, 4)}</div>
                    <div>
                        <div class="font-bold">${etf.symbol}</div>
                        <div class="text-[10px] text-slate-500 uppercase tracking-wider">${etf.shortName || ''}</div>
                    </div>
                </div>
            </td>
            <td class="py-4 font-mono font-semibold">R$ ${etf.regularMarketPrice.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
            <td class="py-4 ${isPositive ? 'text-green-400' : 'text-red-400'} font-mono font-medium">
                ${isPositive ? '▲' : '▼'} ${Math.abs(etf.regularMarketChangePercent).toFixed(2)}%
            </td>
            <td class="py-4">
                <div class="sparkline-container text-center">
                    ${sparklineSvg}
                </div>
            </td>
            <td class="py-4">
                <button class="bg-white/5 hover:bg-white/10 text-blue-400 hover:text-white px-3 py-1 rounded-md transition text-xs font-semibold border border-white/5" onclick="showDetails('${etf.symbol}')">
                    Analisar
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * Generates a simple SVG sparkline
 */
function generateSparkline(isPositive) {
    const color = isPositive ? '#4ade80' : '#f87171';
    const points = [];
    for (let i = 0; i < 10; i++) {
        points.push({ x: i * 11, y: 15 + (Math.random() * 14 - 7) + (isPositive ? -i : i) });
    }
    
    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    
    return `
        <svg viewBox="0 0 100 30" class="w-[80px] h-[25px] mx-auto">
            <path d="${pathData}" class="sparkline-path" stroke="${color}" fill="none" />
        </svg>
    `;
}

function updateWidget(id, price, change) {
    const el = document.getElementById(id);
    if (!el || price === undefined) return;
    
    el.innerHTML = `<span class="font-mono">${typeof price === 'number' ? price.toLocaleString('pt-BR') : price}</span>`;
    
    const changeEl = el.nextElementSibling;
    if (changeEl && change !== undefined) {
        const isPositive = change >= 0;
        changeEl.innerHTML = `<span class="font-mono">${isPositive ? '▲' : '▼'} ${Math.abs(change).toFixed(2)}% (Hoje)</span>`;
        changeEl.className = isPositive ? 'text-green-400 text-xs font-medium' : 'text-red-400 text-xs font-medium';
    }
}

async function fetchBTCPrice() {
    try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl&include_24hr_change=true');
        const data = await res.json();
        const price = data.bitcoin.brl;
        const change = data.bitcoin.brl_24h_change;
        
        state.indices['BTC-BRL'] = { regularMarketPrice: price, regularMarketChangePercent: change };
        updateWidget('idx-btc', 'R$ ' + price.toLocaleString('pt-BR'), change);
    } catch (e) {}
}

/**
 * Fetch Global Geopolitical/Natural Events (NASA & USGS)
 */
async function fetchGlobalEvents() {
    try {
        // 1. USGS Earthquakes (Significant in the last day)
        const usgsRes = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson');
        const usgsData = await usgsRes.json();
        
        // 2. NASA EONET (Natural Events)
        const nasaRes = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=7');
        const nasaData = await nasaRes.json();

        // Convert to standard event format for the map
        const events = [];

        // Map USGS
        if (usgsData.features) {
            usgsData.features.slice(0, 10).forEach(f => {
                if (f.properties.mag > 4) { // Only show significant ones
                    events.push({
                        coords: [f.geometry.coordinates[1], f.geometry.coordinates[0]],
                        type: 'seismic',
                        title: `Terremoto Mag ${f.properties.mag}`,
                        desc: f.properties.place,
                        color: '#ef4444' // Red
                    });
                }
            });
        }

        // Map NASA
        if (nasaData.events) {
            nasaData.events.slice(0, 15).forEach(e => {
                const geometry = e.geometry[0];
                if (geometry && geometry.coordinates) {
                    events.push({
                        coords: [geometry.coordinates[1], geometry.coordinates[0]],
                        type: 'climate',
                        title: e.title,
                        desc: e.categories[0]?.title || 'Evento Natural',
                        color: '#f97316' // Orange
                    });
                }
            });
        }

        // Dispatch to map if window function exists
        if (window.updateMapEvents) {
            window.updateMapEvents(events);
        }

        // Generate Correlation Insights
        generateCorrelationInsights(events);

    } catch (error) {
        console.error("Erro ao buscar eventos globais:", error);
    }
}

/**
 * Heuristic Engine for Market Correlations
 */
function generateCorrelationInsights(events) {
    const container = document.getElementById('insights-container');
    if (!container) return;

    const insights = [];
    const dollar = state.indices['USDBRL']?.regularMarketPrice || 5.10;
    const btc = state.indices['BTC-BRL']?.regularMarketPrice || 300000;
    const hasNasaEvents = events.some(e => e.type === 'climate');
    const hasSeismicEvents = events.some(e => e.type === 'seismic');

    // Rule 1: Currency & Commodities
    if (dollar > 5.10) {
        insights.push({
            icon: 'trending-up',
            color: 'text-green-400',
            title: 'Pressão Cambial vs Commodities',
            text: `Dólar em R$ ${dollar.toFixed(2)} + Alertas Climáticos: Pressão positiva em ETFs de Commodities (ex: BOVA11, GOLD11).`
        });
    }

    // Rule 2: Crypto Market Cap
    insights.push({
        icon: 'bit-coin',
        color: 'text-amber-400',
        title: 'Dominância Cripto',
        text: 'Bitcoin sustentando patamares recordes impulsiona fluxo para HASH11 e ITIT11 no mercado local.'
    });

    // Rule 3: Natural Disasters & Supply Chain
    if (hasSeismicEvents || hasNasaEvents) {
        insights.push({
            icon: 'alert-triangle',
            color: 'text-red-400',
            title: 'Risco de Supply Chain',
            text: 'Eventos geofísicos detectados. Monitorar ETFs de semicondutores e tecnologia (SMH) por possíveis gargalos logísticos.'
        });
    }

    container.innerHTML = insights.map(ins => `
        <div class="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition group">
            <div class="flex items-center gap-2 mb-2">
                <i data-lucide="${ins.icon}" class="w-4 h-4 ${ins.color}"></i>
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">${ins.title}</span>
            </div>
            <p class="text-sm text-slate-300 leading-relaxed">${ins.text}</p>
        </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', () => {
    fetchMarketOverview();
    fetchFeaturedETFs();
    fetchBTCPrice();
    fetchGlobalEvents();
    
    // Auto-refresh
    setInterval(() => {
        fetchMarketOverview();
        fetchFeaturedETFs();
        fetchBTCPrice();
        fetchGlobalEvents();
    }, 60000); // 1 minute
});
