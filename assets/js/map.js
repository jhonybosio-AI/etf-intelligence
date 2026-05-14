// Map Initialization - ETF Intelligence Monitor
document.addEventListener('DOMContentLoaded', () => {
    const map = L.map('map', {
        center: [20, 0],
        zoom: 2,
        zoomControl: false,
        attributionControl: false
    });

    // Dark Theme Tiles (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
    }).addTo(map);

    // Mock Events (Integration with News concept)
    const events = [
        { coords: [38.89, -77.03], type: 'economic', title: 'FED Rate Decision', desc: 'Maintain high interest rates.', color: '#ef4444' },
        { coords: [-23.55, -46.63], type: 'market', title: 'B3 Volume Peak', desc: 'High demand for Commodity ETFs.', color: '#3b82f6' },
        { coords: [35.67, 139.65], type: 'tech', title: 'Tech Hub Expansion', desc: 'New chip plant in Japan.', color: '#fbbf24' },
        { coords: [51.50, -0.12], type: 'policy', title: 'UK Energy Reform', desc: 'Impact on Renewables.', color: '#10b981' }
    ];

    events.forEach(event => {
        const marker = L.circleMarker(event.coords, {
            radius: 8,
            fillColor: event.color,
            color: '#fff',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map);

        marker.bindPopup(`
            <div style="background: #1e293b; color: #fff; padding: 10px; border-radius: 8px;">
                <strong style="color: ${event.color}">${event.title}</strong><br>
                <span style="font-size: 11px; color: #94a3b8;">${event.desc}</span>
            </div>
        `, { className: 'custom-popup' });
        
        // Pulse Effect (simulated with CSS would be better, but simple for now)
        setInterval(() => {
            marker.setRadius(marker.getRadius() === 8 ? 10 : 8);
        }, 1000);
    });

    // Add Zoom Control at the bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Layer Group for Dynamic Events (NASA/USGS)
    const eventLayer = L.layerGroup().addTo(map);

    window.updateMapEvents = function(events) {
        eventLayer.clearLayers(); // Clean old markers

        events.forEach(event => {
            const marker = L.circleMarker(event.coords, {
                radius: 6,
                fillColor: event.color,
                color: '#fff',
                weight: 1,
                opacity: 0.8,
                fillOpacity: 0.6
            }).addTo(eventLayer);

            marker.bindPopup(`
                <div style="background: #1e293b; color: #fff; padding: 10px; border-radius: 8px; border-left: 4px solid ${event.color}">
                    <strong style="color: ${event.color}">${event.title}</strong><br>
                    <span style="font-size: 11px; color: #94a3b8;">${event.desc}</span>
                </div>
            `);
        });
    };

    // Global function to add markers from other scripts (like news.js)
    window.addNewsMarker = function(coords, title) {
        const marker = L.circleMarker(coords, {
            radius: 10,
            fillColor: '#fbbf24', // Gold for news
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
        }).addTo(map);

        marker.bindPopup(`
            <div style="background: #1e293b; color: #fff; padding: 10px; border-radius: 8px; max-width: 200px; border-left: 4px solid #fbbf24">
                <strong style="color: #fbbf24">ALERTA NEWS</strong><br>
                <span style="font-size: 11px; color: #94a3b8;">${title}</span>
            </div>
        `);
        
        // Auto-open news markers
        marker.openPopup();
    };
});
