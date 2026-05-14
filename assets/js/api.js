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
 * Render ETF Table with Real Data
 */
function renderETFTable() {
    const tableBody = document.querySelector('tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = ''; // Clear current
    
    state.etfs.forEach(etf => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-white/5 transition';
        
        const isPositive = etf.regularMarketChangePercent >= 0;
        
        row.innerHTML = `
            <td class="py-4">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-xs mr-3">${etf.symbol.substring(0, 4)}</div>
                    <div>
                        <div class="font-bold">${etf.symbol}</div>
                        <div class="text-[10px] text-slate-500">${etf.shortName || ''}</div>
                    </div>
                </div>
            </td>
            <td class="py-4 font-semibold">R$ ${etf.regularMarketPrice.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
            <td class="py-4 ${isPositive ? 'text-green-400' : 'text-red-400'} font-medium">
                ${isPositive ? '+' : ''}${etf.regularMarketChangePercent.toFixed(2)}%
            </td>
            <td class="py-4 text-slate-400 text-sm">SETOR B3</td>
            <td class="py-4">
                <button class="text-blue-400 hover:text-white transition text-sm" onclick="showDetails('${etf.symbol}')">Analisar</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function updateWidget(id, price, change) {
    const el = document.getElementById(id);
    if (!el || price === undefined) return;
    
    el.innerText = typeof price === 'number' ? price.toLocaleString('pt-BR') : price;
    
    const changeEl = el.nextElementSibling;
    if (changeEl && change !== undefined) {
        const isPositive = change >= 0;
        changeEl.innerText = `${isPositive ? '+' : ''}${change.toFixed(2)}% (Hoje)`;
        changeEl.className = isPositive ? 'text-green-400 text-xs font-medium' : 'text-red-400 text-xs font-medium';
    }
}

async function fetchBTCPrice() {
    try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl&include_24hr_change=true');
        const data = await res.json();
        const price = data.bitcoin.brl;
        const change = data.bitcoin.brl_24h_change;
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

    } catch (error) {
        console.error("Erro ao buscar eventos globais:", error);
    }
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
