let stops = JSON.parse(localStorage.getItem('routeStops')) || [];
let cityData = []; 

const DOM = {
    search: document.getElementById('city-search'),
    options: document.getElementById('city-options'),
    list: document.getElementById('stops-list'),
    results: document.getElementById('results-container'),
    eff: document.getElementById('fuel-efficiency'),
    price: document.getElementById('fuel-price')
};

// --- MAP INITIALIZATION ---
let map = L.map('map').setView([20.5937, 78.9629], 5); // Centers on India
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let markers = []; 
let routeLayer = null; 

// --- FETCH CSV DATA ---
async function loadKaggleData() {
    try {
        const response = await fetch('cities.csv'); 
        const csvText = await response.text();
        const rows = csvText.split('\n');
        
        for (let i = 1; i < rows.length; i++) {
            if (!rows[i].trim()) continue; 
            const cols = rows[i].split(',');
            const cityName = cols[1] ? cols[1].trim() : ''; 
            const lat = parseFloat(cols[2]); 
            const lng = parseFloat(cols[3]); 
            
            if (cityName && !isNaN(lat) && !isNaN(lng)) {
                cityData.push({ name: cityName, lat: lat, lng: lng });
                const option = document.createElement('option');
                option.value = cityName;
                DOM.options.appendChild(option);
            }
        }
    } catch (error) {
        console.error("CSV loading failed.", error);
    }
}

// --- RENDER STOPS AND DROP PINS ---
function renderStops() {
    DOM.list.innerHTML = stops.length ? '' : '<li class="list-group-item text-muted justify-content-center">No stops added</li>';
    
    // Clear old map pins and routes
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    if (routeLayer) map.removeLayer(routeLayer);
    
    let bounds = L.latLngBounds();

    stops.forEach((stop, i) => {
        const badge = i === 0 ? `<span class="badge bg-primary ms-2">Origin</span>` : '';
        DOM.list.innerHTML += `
            <li class="list-group-item">
                <div>
                    <strong>${stop.name}</strong> ${badge}<br>
                    <small class="text-muted">${stop.lat.toFixed(4)}, ${stop.lng.toFixed(4)}</small>
                </div>
                <button class="btn btn-sm btn-danger" onclick="deleteStop(${i})"><i class="fas fa-times"></i></button>
            </li>`;
            
        // Drop a pin on the map
        let marker = L.marker([stop.lat, stop.lng]).addTo(map).bindPopup(`<b>${stop.name}</b>`);
        markers.push(marker);
        bounds.extend([stop.lat, stop.lng]);
    });
    
    // Zoom map to fit all pins
    if (stops.length > 0) {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
    } else {
        map.setView([20.5937, 78.9629], 5);
    }

    localStorage.setItem('routeStops', JSON.stringify(stops));
}

window.deleteStop = (i) => { stops.splice(i, 1); renderStops(); };

// --- ADD STOP BUTTON ---
document.getElementById('add-stop-btn').addEventListener('click', () => {
    const searchValue = DOM.search.value.trim();
    const selectedCity = cityData.find(c => c.name.toLowerCase() === searchValue.toLowerCase());

    if (!selectedCity) return alert("Please select a valid city from the dropdown list!");

    stops.push({ name: selectedCity.name, lat: selectedCity.lat, lng: selectedCity.lng });
    DOM.search.value = ''; 
    renderStops();
});

document.getElementById('clear-btn').addEventListener('click', () => {
    stops = []; renderStops(); DOM.results.innerHTML = "Enter an origin and destination to calculate.";
});

// --- EXECUTE OPTIMIZATION & DRAW ROUTE ---
document.getElementById('optimize-btn').addEventListener('click', async () => {
    if (stops.length < 2) return alert("Need at least 2 stops to optimize");
    
    DOM.results.innerHTML = "<div class='text-center p-3'><em>Routing via live map networks...</em></div>";

    const coordsString = stops.map(stop => `${stop.lng},${stop.lat}`).join(';');
    
    // We request geometries=geojson so the API gives us the line to draw
    const osrmUrl = `https://router.project-osrm.org/trip/v1/driving/${coordsString}?source=first&roundtrip=false&geometries=geojson&overview=full`;

    try {
        const response = await fetch(osrmUrl);
        const data = await response.json();

        if (data.code !== 'Ok') throw new Error("API routing failed");

        // Draw the blue road route on the map!
        if (routeLayer) map.removeLayer(routeLayer);
        routeLayer = L.geoJSON(data.trips[0].geometry, {
            style: { color: '#0d6efd', weight: 5, opacity: 0.8 } 
        }).addTo(map);
        map.fitBounds(routeLayer.getBounds(), { padding: [30, 30] });

        // Sort our stops based on the optimized index
        const optimizedStops = [];
        data.waypoints.forEach(wp => {
            optimizedStops.push(stops[wp.waypoint_index]);
        });

        const realDistanceKm = data.trips[0].distance / 1000;
        const cost = (realDistanceKm / parseFloat(DOM.eff.value)) * parseFloat(DOM.price.value);

        let html = `<ol class="text-start mb-3">`;
        optimizedStops.forEach(s => html += `<li><strong>${s.name}</strong></li>`);
        html += `</ol>
                 <div class="row text-center border-top pt-3">
                    <div class="col"><h4 class="text-primary">${realDistanceKm.toFixed(2)} km</h4><small>Real Road Distance</small></div>
                    <div class="col"><h4 class="text-success">₹${cost.toFixed(2)}</h4><small>Est. Fuel Cost</small></div>
                 </div>`;
                 
        DOM.results.innerHTML = html;

    } catch (error) {
        console.error("Routing Error:", error);
        DOM.results.innerHTML = `<span class="text-danger">Failed to calculate route. Ensure you have an internet connection.</span>`;
    }
});

// Init
loadKaggleData();
renderStops();