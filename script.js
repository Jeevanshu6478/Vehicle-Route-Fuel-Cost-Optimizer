let stops = JSON.parse(localStorage.getItem('routeStops')) || [];
let cityData = []; // Array to hold the parsed Kaggle dataset

const DOM = {
    search: document.getElementById('city-search'),
    options: document.getElementById('city-options'),
    list: document.getElementById('stops-list'),
    results: document.getElementById('results-container'),
    eff: document.getElementById('fuel-efficiency'),
    price: document.getElementById('fuel-price')
};

// 1. Fetch and Parse the Kaggle CSV
async function loadKaggleData() {
    try {
        const response = await fetch('cities.csv'); 
        const csvText = await response.text();
        
        const rows = csvText.split('\n');
        
        // Start at i=1 to skip the header row
        for (let i = 1; i < rows.length; i++) {
            if (!rows[i].trim()) continue; 
            
            // Standard CSV parsing
            // Adjust indices if your CSV columns are arranged differently!
            const cols = rows[i].split(',');
            const cityName = cols[0] ? cols[0].trim() : ''; 
            const lat = parseFloat(cols[2]); 
            const lng = parseFloat(cols[3]); 
            
            if (cityName && !isNaN(lat) && !isNaN(lng)) {
                cityData.push({ name: cityName, lat: lat, lng: lng });
                
                // Add to HTML datalist
                const option = document.createElement('option');
                option.value = cityName;
                DOM.options.appendChild(option);
            }
        }
    } catch (error) {
        console.error("CSV loading failed. Make sure you are running a local server!", error);
    }
}

// 2. Render Stops to UI
function renderStops() {
    DOM.list.innerHTML = stops.length ? '' : '<li class="list-group-item text-muted justify-content-center">No stops added</li>';
    
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
    });
    localStorage.setItem('routeStops', JSON.stringify(stops));
}

window.deleteStop = (i) => { stops.splice(i, 1); renderStops(); };

// 3. Add Stop from Dropdown
document.getElementById('add-stop-btn').addEventListener('click', () => {
    const searchValue = DOM.search.value.trim();
    
    // Find the matching city in our CSV data array
    const selectedCity = cityData.find(c => c.name.toLowerCase() === searchValue.toLowerCase());

    if (!selectedCity) {
        return alert("Please select a valid city from the dropdown list!");
    }

    stops.push({ name: selectedCity.name, lat: selectedCity.lat, lng: selectedCity.lng });
    DOM.search.value = ''; // Clear input
    renderStops();
});

document.getElementById('clear-btn').addEventListener('click', () => {
    stops = []; renderStops(); DOM.results.innerHTML = "Enter an origin and destination to calculate.";
});

// 4. Algorithm Math (Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const p = Math.PI / 180, c = Math.cos;
    const a = 0.5 - c((lat2 - lat1) * p)/2 + c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))/2;
    return 12742 * Math.asin(Math.sqrt(a)); 
}

// 5. Execution
document.getElementById('optimize-btn').addEventListener('click', () => {
    if (stops.length < 2) return alert("Need at least 2 stops to optimize");
    
    let unvisited = [...stops], current = unvisited.shift(), route = [current], dist = 0;

    // Nearest-Neighbor
    while (unvisited.length > 0) {
        let nearestIdx = 0, minDist = Infinity;
        unvisited.forEach((stop, i) => {
            let d = calculateDistance(current.lat, current.lng, stop.lat, stop.lng);
            if (d < minDist) { minDist = d; nearestIdx = i; }
        });
        current = unvisited.splice(nearestIdx, 1)[0];
        route.push(current);
        dist += minDist;
    }

    const cost = (dist / parseFloat(DOM.eff.value)) * parseFloat(DOM.price.value);

    let html = `<ol class="text-start mb-3">`;
    route.forEach(s => html += `<li><strong>${s.name}</strong></li>`);
    html += `</ol>
             <div class="row text-center border-top pt-3">
                <div class="col"><h4 class="text-primary">${dist.toFixed(2)} km</h4><small>Total Distance</small></div>
                <div class="col"><h4 class="text-success">₹${cost.toFixed(2)}</h4><small>Est. Fuel Cost</small></div>
             </div>`;
             
    DOM.results.innerHTML = html;
});

// Init
loadKaggleData();
renderStops();