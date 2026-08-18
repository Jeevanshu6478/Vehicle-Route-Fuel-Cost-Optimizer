/**
 * RouteWise - Vehicle Route & Multi-Fuel Cost Optimizer
 * Comprehensive Client Script with Auth Gateway, Car Animation, 
 * From-To Journey Planner, Map Distance Overlays, and Fuel Matrix
 */

// ====================================================================
// 1. Global State & Data Stores
// ====================================================================
let currentUser = JSON.parse(localStorage.getItem('routeWiseUser')) || null;
let savedRoutes = JSON.parse(localStorage.getItem('routeWiseSavedRoutes')) || [];
let cityData = [];
let intermediateStops = [];
let currentTripResult = null;

// Standard Metro Fuel Rate Reference Database (India)
const CITY_FUEL_RATES = [
    { city: "New Delhi", state: "Delhi", petrol: 94.72, diesel: 87.62, cng: 75.09, trend: "Stable" },
    { city: "Mumbai", state: "Maharashtra", petrol: 104.21, diesel: 92.15, cng: 76.00, trend: "Stable" },
    { city: "Bengaluru", state: "Karnataka", petrol: 102.86, diesel: 88.94, cng: 82.50, trend: "Slight Up" },
    { city: "Kolkata", state: "West Bengal", petrol: 103.94, diesel: 90.76, cng: 86.00, trend: "Stable" },
    { city: "Chennai", state: "Tamil Nadu", petrol: 100.75, diesel: 92.34, cng: 83.50, trend: "Stable" },
    { city: "Hyderabad", state: "Telangana", petrol: 107.41, diesel: 95.65, cng: 89.50, trend: "Slight Up" },
    { city: "Ahmedabad", state: "Gujarat", petrol: 96.42, diesel: 92.17, cng: 78.20, trend: "Stable" },
    { city: "Pune", state: "Maharashtra", petrol: 103.77, diesel: 90.31, cng: 78.00, trend: "Stable" },
    { city: "Jaipur", state: "Rajasthan", petrol: 104.88, diesel: 90.36, cng: 80.50, trend: "Stable" },
    { city: "Chandigarh", state: "Chandigarh", petrol: 94.24, diesel: 82.40, cng: 82.40, trend: "Stable" },
    { city: "Lucknow", state: "Uttar Pradesh", petrol: 94.65, diesel: 87.76, cng: 85.00, trend: "Stable" },
    { city: "Surat", state: "Gujarat", petrol: 96.31, diesel: 92.08, cng: 77.80, trend: "Stable" },
    { city: "Bhopal", state: "Madhya Pradesh", petrol: 106.47, diesel: 91.84, cng: 88.00, trend: "Slight Up" },
    { city: "Patna", state: "Bihar", petrol: 105.48, diesel: 92.32, cng: 84.50, trend: "Stable" },
    { city: "Kochi", state: "Kerala", petrol: 105.72, diesel: 94.66, cng: 83.00, trend: "Stable" }
];

// Fallback Indian Cities dataset for offline/local execution
const FALLBACK_INDIAN_CITIES = [
    { name: "Delhi", lat: 28.6139, lng: 77.2090 },
    { name: "New Delhi", lat: 28.6139, lng: 77.2090 },
    { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
    { name: "Bengaluru", lat: 12.9716, lng: 77.5946 },
    { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
    { name: "Chennai", lat: 13.0827, lng: 80.2707 },
    { name: "Hyderabad", lat: 17.3850, lng: 78.4867 },
    { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
    { name: "Pune", lat: 18.5204, lng: 73.8567 },
    { name: "Jaipur", lat: 26.9124, lng: 75.7873 },
    { name: "Surat", lat: 21.1702, lng: 72.8311 },
    { name: "Lucknow", lat: 26.8467, lng: 80.9462 },
    { name: "Kanpur", lat: 26.4499, lng: 80.3319 },
    { name: "Nagpur", lat: 21.1458, lng: 79.0882 },
    { name: "Indore", lat: 22.7196, lng: 75.8577 },
    { name: "Thane", lat: 19.2183, lng: 72.9781 },
    { name: "Bhopal", lat: 23.2599, lng: 77.4126 },
    { name: "Visakhapatnam", lat: 17.6868, lng: 83.2185 },
    { name: "Patna", lat: 25.5941, lng: 85.1376 },
    { name: "Vadodara", lat: 22.3072, lng: 73.1812 },
    { name: "Ghaziabad", lat: 28.6692, lng: 77.4538 },
    { name: "Ludhiana", lat: 30.9010, lng: 75.8573 },
    { name: "Agra", lat: 27.1767, lng: 78.0081 },
    { name: "Nashik", lat: 19.9975, lng: 73.7898 },
    { name: "Faridabad", lat: 28.4089, lng: 77.3178 },
    { name: "Meerut", lat: 28.9845, lng: 77.7064 },
    { name: "Rajkot", lat: 22.3039, lng: 70.8022 },
    { name: "Varanasi", lat: 25.3176, lng: 82.9739 },
    { name: "Srinagar", lat: 34.0837, lng: 74.7973 },
    { name: "Aurangabad", lat: 19.8762, lng: 75.3433 },
    { name: "Dhanbad", lat: 23.7957, lng: 86.4304 },
    { name: "Amritsar", lat: 31.6340, lng: 74.8723 },
    { name: "Chandigarh", lat: 30.7333, lng: 76.7794 },
    { name: "Coimbatore", lat: 11.0168, lng: 76.9558 },
    { name: "Kochi", lat: 9.9312, lng: 76.2673 },
    { name: "Hisar", lat: 29.1492, lng: 75.7217 },
    { name: "Gurugram", lat: 28.4595, lng: 77.0266 },
    { name: "Noida", lat: 28.5355, lng: 77.3910 },
    { name: "Dehradun", lat: 30.3165, lng: 78.0322 },
    { name: "Shimla", lat: 31.1048, lng: 77.1734 }
];

// Active Vehicle Fuel Configurations
const FUEL_DEFAULTS = {
    petrol: { efficiency: 15, price: 94.72, unit: "km/L", priceUnit: "₹/L", co2Factor: 2.31 },
    diesel: { efficiency: 20, price: 87.62, unit: "km/L", priceUnit: "₹/L", co2Factor: 2.68 },
    cng: { efficiency: 25, price: 75.09, unit: "km/kg", priceUnit: "₹/kg", co2Factor: 1.85 },
    compare: { efficiency: 25, price: 75.09, unit: "km/unit", priceUnit: "₹/unit", co2Factor: 1.85 }
};

let currentFuelType = 'cng';

// DOM Element Registry
const DOM = {
    authGateway: document.getElementById('auth-gateway-view'),
    mainAppWrapper: document.getElementById('main-app-wrapper'),
    carOverlay: document.getElementById('car-transition-overlay'),
    carProgress: document.getElementById('car-anim-progress'),
    carTitle: document.getElementById('car-anim-title'),
    carSubtitle: document.getElementById('car-anim-subtitle'),
    
    // Auth Navbar elements
    navUserName: document.getElementById('nav-user-name'),
    navUserEmail: document.getElementById('nav-user-email'),
    navUserAvatar: document.getElementById('nav-user-avatar'),
    navUserVehicle: document.getElementById('nav-user-vehicle'),
    savedCountBadge: document.getElementById('saved-count-badge'),
    
    // Journey inputs
    originInput: document.getElementById('origin-city-input'),
    destInput: document.getElementById('dest-city-input'),
    intermediateInput: document.getElementById('intermediate-city-input'),
    intermediateList: document.getElementById('intermediate-stops-list'),
    stopsCounterBadge: document.getElementById('stops-counter-badge'),
    options: document.getElementById('city-options'),
    
    // Fuel inputs
    effInput: document.getElementById('fuel-efficiency'),
    priceInput: document.getElementById('fuel-price'),
    effLabel: document.getElementById('eff-label'),
    effUnit: document.getElementById('eff-unit'),
    priceLabel: document.getElementById('price-label'),
    citySyncSelect: document.getElementById('city-rate-sync-select'),
    
    // Map & Output
    mapDistanceBanner: document.getElementById('map-distance-banner'),
    mapRouteTitle: document.getElementById('map-route-title'),
    mapDistVal: document.getElementById('map-dist-val'),
    results: document.getElementById('results-container'),
    fuelTbody: document.getElementById('fuel-rates-tbody'),
    filterRatesInput: document.getElementById('filter-rates-input'),
    toastContainer: document.getElementById('toast-container')
};

// ====================================================================
// 2. Leaflet Map Initialization
// ====================================================================
let map = null;
let markers = [];
let routeLayer = null;

function initializeMap() {
    if (map) return;
    
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    map = L.map('map').setView([20.5937, 78.9629], 5); // Centers on India

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
    }).addTo(map);

    map.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        const ptName = `Pin (${lat.toFixed(2)}, ${lng.toFixed(2)})`;
        intermediateStops.push({ name: ptName, lat, lng });
        renderIntermediateStops();
        showToast(`Added intermediate waypoint on map`, 'info');
    });
}

// ====================================================================
// 3. City Data Loader (CSV + Fallback Dataset)
// ====================================================================
async function loadCityData() {
    let loadedFromCsv = false;
    try {
        const response = await fetch('cities.csv');
        if (response.ok) {
            const csvText = await response.text();
            const rows = csvText.split('\n');
            
            for (let i = 1; i < rows.length; i++) {
                if (!rows[i].trim()) continue;
                const cols = rows[i].split(',');
                let rawLocation = cols[1] ? cols[1].trim() : '';
                let cityName = rawLocation.replace(/Latitude and Longitude/gi, '').trim();
                const lat = parseFloat(cols[2]);
                const lng = parseFloat(cols[3]);

                if (cityName && !isNaN(lat) && !isNaN(lng)) {
                    cityData.push({ name: cityName, lat, lng });
                }
            }
            if (cityData.length > 0) loadedFromCsv = true;
        }
    } catch (err) {
        console.warn("Using fallback high-coverage Indian cities data.", err);
    }

    if (!loadedFromCsv || cityData.length === 0) {
        cityData = [...FALLBACK_INDIAN_CITIES];
    } else {
        FALLBACK_INDIAN_CITIES.forEach(metro => {
            if (!cityData.some(c => c.name.toLowerCase() === metro.name.toLowerCase())) {
                cityData.unshift(metro);
            }
        });
    }

    if (DOM.options) {
        DOM.options.innerHTML = '';
        cityData.slice(0, 1500).forEach(city => {
            const opt = document.createElement('option');
            opt.value = city.name;
            DOM.options.appendChild(opt);
        });
    }
}

// ====================================================================
// 4. Authentication Gateway & Car Animation Trigger
// ====================================================================
window.setGatewayAuthMode = (mode) => {
    const btnSignIn = document.getElementById('gateway-tab-signin');
    const btnSignUp = document.getElementById('gateway-tab-signup');
    const formSignIn = document.getElementById('gateway-signin-form');
    const formSignUp = document.getElementById('gateway-signup-form');

    if (mode === 'signin') {
        btnSignIn.classList.add('active');
        btnSignUp.classList.remove('active');
        formSignIn.style.display = 'block';
        formSignUp.style.display = 'none';
    } else {
        btnSignUp.classList.add('active');
        btnSignIn.classList.remove('active');
        formSignUp.style.display = 'block';
        formSignIn.style.display = 'none';
    }
};

document.getElementById('gateway-signin-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('gateway-signin-email')?.value.trim() || 'driver@routewise.in';
    triggerLoginSequence({
        name: email.split('@')[0].toUpperCase(),
        email: email,
        fuel: 'cng',
        mileage: 25
    });
});

document.getElementById('gateway-signup-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('gateway-signup-name')?.value.trim() || 'New User';
    const email = document.getElementById('gateway-signup-email')?.value.trim() || 'user@routewise.in';
    const fuel = document.getElementById('gateway-signup-fuel')?.value || 'cng';
    const mileage = parseFloat(document.getElementById('gateway-signup-mileage')?.value) || 24;

    triggerLoginSequence({ name, email, fuel, mileage });
});

document.getElementById('btn-quick-cng-driver')?.addEventListener('click', () => {
    triggerLoginSequence({
        name: "Vikram (CNG Commuter)",
        email: "vikram.cng@driver.in",
        fuel: "cng",
        mileage: 26
    });
});

document.getElementById('btn-quick-fleet-mgr')?.addEventListener('click', () => {
    triggerLoginSequence({
        name: "Ananya (Fleet Manager)",
        email: "ananya.fleet@logistics.in",
        fuel: "diesel",
        mileage: 20
    });
});

function triggerLoginSequence(userObj) {
    currentUser = userObj;
    localStorage.setItem('routeWiseUser', JSON.stringify(currentUser));

    if (DOM.carOverlay) {
        DOM.carOverlay.classList.add('active');
        if (DOM.carProgress) DOM.carProgress.style.width = '0%';
        if (DOM.carTitle) DOM.carTitle.textContent = "Starting Your Engine...";
        if (DOM.carSubtitle) DOM.carSubtitle.textContent = `Authenticating profile for ${userObj.name}...`;

        setTimeout(() => {
            if (DOM.carProgress) DOM.carProgress.style.width = '45%';
            if (DOM.carTitle) DOM.carTitle.textContent = "Connecting Highway Satellite Networks...";
            if (DOM.carSubtitle) DOM.carSubtitle.textContent = "Loading 4,000+ Indian road networks and live fuel rates...";
        }, 650);

        setTimeout(() => {
            if (DOM.carProgress) DOM.carProgress.style.width = '100%';
            if (DOM.carTitle) DOM.carTitle.textContent = `Welcome to RouteWise, ${userObj.name}!`;
            if (DOM.carSubtitle) DOM.carSubtitle.textContent = "Launching RouteWise Journey Planner...";
        }, 1400);

        setTimeout(() => {
            DOM.carOverlay.classList.remove('active');
            unlockApplication();
            showToast(`Welcome back to RouteWise, ${userObj.name}!`, 'success');
        }, 2200);
    } else {
        unlockApplication();
    }
}

function unlockApplication() {
    if (DOM.authGateway) DOM.authGateway.style.display = 'none';
    if (DOM.mainAppWrapper) DOM.mainAppWrapper.style.display = 'block';

    if (currentUser) {
        if (DOM.navUserName) DOM.navUserName.textContent = currentUser.name;
        if (DOM.navUserEmail) DOM.navUserEmail.textContent = currentUser.email;
        if (DOM.navUserAvatar) DOM.navUserAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
        if (DOM.navUserVehicle) DOM.navUserVehicle.textContent = `Vehicle: ${currentUser.fuel.toUpperCase()} (${currentUser.mileage} km/unit)`;
        
        if (currentUser.fuel) {
            const btn = document.querySelector(`.fuel-btn[data-fuel="${currentUser.fuel}"]`);
            if (btn) btn.click();
        }
    }

    initializeMap();
    setTimeout(() => {
        if (map) map.invalidateSize();
    }, 200);

    updateSavedCountBadge();
}

window.logoutUser = () => {
    currentUser = null;
    localStorage.removeItem('routeWiseUser');
    if (DOM.mainAppWrapper) DOM.mainAppWrapper.style.display = 'none';
    if (DOM.authGateway) DOM.authGateway.style.display = 'flex';
    showToast("Signed out successfully from RouteWise", "info");
};

// ====================================================================
// 5. "From -> To" Journey Planner Logic
// ====================================================================

document.getElementById('btn-swap-from-to')?.addEventListener('click', () => {
    const originVal = DOM.originInput?.value || '';
    const destVal = DOM.destInput?.value || '';
    if (DOM.originInput) DOM.originInput.value = destVal;
    if (DOM.destInput) DOM.destInput.value = originVal;
    showToast("Swapped Origin & Destination", "info");
});

document.getElementById('btn-add-intermediate')?.addEventListener('click', () => {
    const cityVal = DOM.intermediateInput?.value.trim();
    if (!cityVal) return;

    const cityObj = findCity(cityVal);
    if (!cityObj) {
        showToast(`City "${cityVal}" not found in database.`, 'error');
        return;
    }

    intermediateStops.push(cityObj);
    if (DOM.intermediateInput) DOM.intermediateInput.value = '';
    renderIntermediateStops();
    showToast(`Added intermediate stop: ${cityObj.name}`, 'success');
});

function renderIntermediateStops() {
    if (!DOM.intermediateList) return;
    DOM.intermediateList.innerHTML = '';

    intermediateStops.forEach((stop, idx) => {
        const li = document.createElement('li');
        li.className = "d-flex justify-content-between align-items-center p-2 mb-1 bg-white rounded border small";
        li.innerHTML = `
            <div>
                <span class="badge bg-secondary me-1">Via ${idx + 1}</span>
                <strong>${stop.name}</strong>
            </div>
            <button class="btn btn-sm btn-outline-danger py-0 px-2" onclick="removeIntermediateStop(${idx})">
                <i class="fas fa-times"></i>
            </button>
        `;
        DOM.intermediateList.appendChild(li);
    });

    const totalCount = 2 + intermediateStops.length;
    if (DOM.stopsCounterBadge) {
        DOM.stopsCounterBadge.textContent = `${totalCount} places`;
    }
}

window.removeIntermediateStop = (idx) => {
    intermediateStops.splice(idx, 1);
    renderIntermediateStops();
    showToast("Removed waypoint", "warning");
};

document.querySelectorAll('.city-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        const cityName = chip.getAttribute('data-city');
        if (!DOM.originInput.value) {
            DOM.originInput.value = cityName;
            showToast(`Set ${cityName} as Origin`, 'info');
        } else if (!DOM.destInput.value) {
            DOM.destInput.value = cityName;
            showToast(`Set ${cityName} as Destination`, 'info');
        } else {
            const cityObj = findCity(cityName);
            if (cityObj) {
                intermediateStops.push(cityObj);
                renderIntermediateStops();
                showToast(`Added ${cityName} as intermediate stop`, 'info');
            }
        }
    });
});

document.getElementById('btn-quick-delhi-mumbai')?.addEventListener('click', () => {
    if (DOM.originInput) DOM.originInput.value = "Delhi";
    if (DOM.destInput) DOM.destInput.value = "Mumbai";
    intermediateStops = [{ name: "Jaipur", lat: 26.9124, lng: 75.7873 }];
    renderIntermediateStops();
    runRouteOptimization();
});

function findCity(query) {
    if (!query) return null;
    const clean = query.trim().toLowerCase();
    return cityData.find(c => c.name.toLowerCase() === clean) ||
           cityData.find(c => c.name.toLowerCase().includes(clean));
}

// ====================================================================
// 6. Fuel Type Switching & Auto-Sync
// ====================================================================
const fuelButtons = document.querySelectorAll('.fuel-btn');
fuelButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        fuelButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFuelType = btn.getAttribute('data-fuel');
        updateFuelInputsForType(currentFuelType);
    });
});

function updateFuelInputsForType(fuelType) {
    const config = FUEL_DEFAULTS[fuelType] || FUEL_DEFAULTS.cng;
    if (DOM.effInput) DOM.effInput.value = config.efficiency;
    if (DOM.priceInput) DOM.priceInput.value = config.price;
    if (DOM.effUnit) DOM.effUnit.textContent = config.unit;
    if (DOM.effLabel) DOM.effLabel.textContent = `Mileage (${config.unit})`;
    if (DOM.priceLabel) DOM.priceLabel.textContent = `Fuel Price (${config.priceUnit})`;
}

DOM.citySyncSelect?.addEventListener('change', (e) => {
    const selectedKey = e.target.value;
    if (selectedKey === 'custom') return;

    const cityObj = CITY_FUEL_RATES.find(c => c.city.toLowerCase().includes(selectedKey.toLowerCase()));
    if (!cityObj) return;

    let price = cityObj.cng;
    if (currentFuelType === 'petrol') price = cityObj.petrol;
    if (currentFuelType === 'diesel') price = cityObj.diesel;

    if (DOM.priceInput) DOM.priceInput.value = price;
    showToast(`Updated price for ${cityObj.city}: ₹${price}`, "info");
});

// ====================================================================
// 7. Route Optimization, Distance On Map & Multi-Fuel Matrix
// ====================================================================
document.getElementById('optimize-btn')?.addEventListener('click', runRouteOptimization);

async function runRouteOptimization() {
    const originName = DOM.originInput?.value.trim();
    const destName = DOM.destInput?.value.trim();

    if (!originName || !destName) {
        showToast("Please enter both a Starting Place (From) and Destination (To).", "warning");
        return;
    }

    const originCity = findCity(originName);
    const destCity = findCity(destName);

    if (!originCity) {
        showToast(`Origin place "${originName}" could not be found.`, "error");
        return;
    }
    if (!destCity) {
        showToast(`Destination place "${destName}" could not be found.`, "error");
        return;
    }

    const activeStops = [
        { name: originCity.name, lat: originCity.lat, lng: originCity.lng, type: 'origin' },
        ...intermediateStops.map(s => ({ name: s.name, lat: s.lat, lng: s.lng, type: 'intermediate' })),
        { name: destCity.name, lat: destCity.lat, lng: destCity.lng, type: 'destination' }
    ];

    if (DOM.results) {
        DOM.results.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary mb-2" role="status"></div>
                <div class="fw-bold text-dark">Calculating Highway Distance & Fuel Prices...</div>
                <small class="text-muted">Fetching OpenStreetMap routing for ${originCity.name} ➔ ${destCity.name}</small>
            </div>
        `;
    }

    renderMapWaypoints(activeStops);

    const coordsString = activeStops.map(s => `${s.lng},${s.lat}`).join(';');
    const osrmUrl = `https://router.project-osrm.org/trip/v1/driving/${coordsString}?source=first&roundtrip=false&geometries=geojson&overview=full`;

    try {
        let distanceKm = 0;
        let durationMinutes = 0;
        let orderedStops = [...activeStops];

        const response = await fetch(osrmUrl);
        const data = await response.json();

        if (data.code === 'Ok' && data.trips && data.trips.length > 0) {
            distanceKm = data.trips[0].distance / 1000;
            durationMinutes = Math.round(data.trips[0].duration / 60);

            if (routeLayer) map.removeLayer(routeLayer);
            routeLayer = L.geoJSON(data.trips[0].geometry, {
                style: { color: '#2563eb', weight: 6, opacity: 0.9 }
            }).addTo(map);

            routeLayer.bindTooltip(`🚗 <strong>${originCity.name} ➔ ${destCity.name}</strong><br>Distance: <strong>${distanceKm.toFixed(1)} km</strong>`, {
                sticky: true,
                className: 'route-polyline-tooltip'
            });

            map.fitBounds(routeLayer.getBounds(), { padding: [40, 40] });

            if (data.waypoints && data.waypoints.length === activeStops.length) {
                orderedStops = [];
                data.waypoints.forEach(wp => {
                    orderedStops.push(activeStops[wp.waypoint_index]);
                });
            }
        } else {
            distanceKm = calculateHaversineTotal(activeStops) * 1.25;
            durationMinutes = Math.round((distanceKm / 55) * 60);
        }

        if (DOM.mapDistanceBanner) {
            DOM.mapDistanceBanner.style.display = 'flex';
            if (DOM.mapRouteTitle) {
                DOM.mapRouteTitle.innerHTML = `<i class="fas fa-map-marker-alt text-danger me-1"></i> ${originCity.name} ➔ ${destCity.name}`;
            }
            if (DOM.mapDistVal) {
                DOM.mapDistVal.textContent = `${distanceKm.toFixed(1)} km`;
            }
        }

        const petrolEff = 15;
        const dieselEff = 20;
        const cngEff = 25;

        const petrolPricePerL = 94.72;
        const dieselPricePerL = 87.62;
        const cngPricePerKg = 75.09;

        const petrolAmountL = distanceKm / petrolEff;
        const dieselAmountL = distanceKm / dieselEff;
        const cngAmountKg = distanceKm / cngEff;

        const petrolTotalCost = petrolAmountL * petrolPricePerL;
        const dieselTotalCost = dieselAmountL * dieselPricePerL;
        const cngTotalCost = cngAmountKg * cngPricePerKg;

        const userEff = parseFloat(DOM.effInput?.value) || 25;
        const userPrice = parseFloat(DOM.priceInput?.value) || 75.09;
        const userAmount = distanceKm / userEff;
        const userTripCost = userAmount * userPrice;

        const cngSavingsVsPetrol = petrolTotalCost - cngTotalCost;
        const cngSavingsPct = ((cngSavingsVsPetrol / petrolTotalCost) * 100).toFixed(1);

        const hours = Math.floor(durationMinutes / 60);
        const mins = durationMinutes % 60;
        const durationText = hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`;

        currentTripResult = {
            origin: originCity.name,
            destination: destCity.name,
            distanceKm,
            durationText,
            orderedStops,
            petrolAmountL,
            petrolPricePerL,
            petrolTotalCost,
            dieselAmountL,
            dieselPricePerL,
            dieselTotalCost,
            cngAmountKg,
            cngPricePerKg,
            cngTotalCost,
            userTripCost,
            date: new Date().toLocaleDateString()
        };

        renderDetailedResults(currentTripResult, cngSavingsVsPetrol, cngSavingsPct);
        showToast(`RouteWise Distance: ${distanceKm.toFixed(1)} km calculated!`, "success");

    } catch (err) {
        console.error("Routing error:", err);
        const fallbackDist = calculateHaversineTotal(activeStops) * 1.25;
        const fallbackCost = (fallbackDist / 25) * 75;
        DOM.results.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i><strong>Estimated Road Distance:</strong> ${fallbackDist.toFixed(1)} km. Estimated CNG Fuel Cost: <strong>₹${fallbackCost.toFixed(2)}</strong>.
            </div>
        `;
    }
}

function renderMapWaypoints(stopsList) {
    if (!map) return;

    markers.forEach(m => map.removeLayer(m));
    markers = [];
    if (routeLayer) map.removeLayer(routeLayer);

    let bounds = L.latLngBounds();

    stopsList.forEach((stop, idx) => {
        let pinColor = '#64748b';
        let pinIcon = idx + 1;
        let label = `Via Stop #${idx}`;

        if (stop.type === 'origin') {
            pinColor = '#2563eb';
            pinIcon = '<i class="fas fa-play" style="font-size:10px; margin-left:2px;"></i>';
            label = 'From (Origin)';
        } else if (stop.type === 'destination') {
            pinColor = '#10b981';
            pinIcon = '<i class="fas fa-flag-checkered" style="font-size:10px;"></i>';
            label = 'To (Destination)';
        }

        const customIcon = L.divIcon({
            className: 'custom-leaflet-pin',
            html: `<div style="background-color: ${pinColor}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px; box-shadow: 0 4px 10px rgba(0,0,0,0.35); border: 2.5px solid white;">${pinIcon}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        let marker = L.marker([stop.lat, stop.lng], { icon: customIcon }).addTo(map)
            .bindPopup(`<strong>${stop.name}</strong><br><small class="text-muted">${label}</small>`);
        markers.push(marker);
        bounds.extend([stop.lat, stop.lng]);
    });

    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
}

function renderDetailedResults(res, cngSavings, cngSavingsPct) {
    if (!DOM.results) return;

    let stopsOrderHtml = res.orderedStops.map((s, idx) => 
        `<span class="badge ${s.type === 'origin' ? 'bg-primary' : (s.type === 'destination' ? 'bg-success' : 'bg-light text-dark border')} me-1 mb-1">${idx + 1}. ${s.name}</span>`
    ).join(' <i class="fas fa-arrow-right text-muted small me-1"></i> ');

    DOM.results.innerHTML = `
        <div class="animate-fade-in">
            
            <div class="route-distance-hero-box">
                <div>
                    <span class="badge bg-primary text-white rounded-pill px-2 py-1 mb-1" style="font-size: 0.72rem;">ROAD DISTANCE</span>
                    <div class="route-distance-hero-title">
                        <i class="fas fa-map-marker-alt text-danger"></i>
                        <span>${res.origin} ➔ ${res.destination}</span>
                    </div>
                    <small class="text-light opacity-75">Estimated Highway Drive Time: <strong>${res.durationText}</strong></small>
                </div>
                <div class="route-distance-hero-stat">
                    <div class="route-distance-large-num">${res.distanceKm.toFixed(1)} <span class="fs-6 fw-normal text-light">km</span></div>
                    <small class="text-light opacity-75">Total Road Distance</small>
                </div>
            </div>

            <div class="p-2 bg-light rounded border mb-3 small">
                <div class="text-muted fw-bold mb-1"><i class="fas fa-directions text-primary me-1"></i>Optimized Waypoint Sequence:</div>
                <div class="d-flex flex-wrap align-items-center">${stopsOrderHtml}</div>
            </div>

            <div class="fw-bold text-dark small mb-2"><i class="fas fa-gas-pump text-primary me-1"></i>Fuel Amount (L/kg), Unit Price & Total Trip Cost:</div>
            
            <div class="fuel-comp-grid">
                
                <!-- PETROL CARD -->
                <div class="fuel-card petrol">
                    <div>
                        <div class="fuel-card-title"><i class="fas fa-gas-pump"></i> Petrol</div>
                        <div class="fuel-card-cost">₹${res.petrolTotalCost.toFixed(2)}</div>
                    </div>
                    <div class="fuel-card-details-box">
                        <div class="fuel-card-row">
                            <span>Amount Needed:</span>
                            <strong>${res.petrolAmountL.toFixed(1)} Litres</strong>
                        </div>
                        <div class="fuel-card-row">
                            <span>Unit Rate:</span>
                            <span>₹${res.petrolPricePerL.toFixed(2)} / L</span>
                        </div>
                        <div class="fuel-card-row">
                            <span>Running Cost:</span>
                            <span>₹${(res.petrolTotalCost / res.distanceKm).toFixed(2)} / km</span>
                        </div>
                        <div class="fuel-card-row">
                            <span>Assumed Mileage:</span>
                            <span>15 km/L</span>
                        </div>
                    </div>
                </div>

                <!-- DIESEL CARD -->
                <div class="fuel-card diesel">
                    <div>
                        <div class="fuel-card-title"><i class="fas fa-truck"></i> Diesel</div>
                        <div class="fuel-card-cost">₹${res.dieselTotalCost.toFixed(2)}</div>
                    </div>
                    <div class="fuel-card-details-box">
                        <div class="fuel-card-row">
                            <span>Amount Needed:</span>
                            <strong>${res.dieselAmountL.toFixed(1)} Litres</strong>
                        </div>
                        <div class="fuel-card-row">
                            <span>Unit Rate:</span>
                            <span>₹${res.dieselPricePerL.toFixed(2)} / L</span>
                        </div>
                        <div class="fuel-card-row">
                            <span>Running Cost:</span>
                            <span>₹${(res.dieselTotalCost / res.distanceKm).toFixed(2)} / km</span>
                        </div>
                        <div class="fuel-card-row">
                            <span>Assumed Mileage:</span>
                            <span>20 km/L</span>
                        </div>
                    </div>
                </div>

                <!-- CNG CARD -->
                <div class="fuel-card cng">
                    <span class="fuel-best-badge">BEST VALUE</span>
                    <div>
                        <div class="fuel-card-title"><i class="fas fa-leaf"></i> CNG</div>
                        <div class="fuel-card-cost">₹${res.cngTotalCost.toFixed(2)}</div>
                    </div>
                    <div class="fuel-card-details-box">
                        <div class="fuel-card-row">
                            <span>Amount Needed:</span>
                            <strong class="text-success">${res.cngAmountKg.toFixed(1)} kg</strong>
                        </div>
                        <div class="fuel-card-row">
                            <span>Unit Rate:</span>
                            <span>₹${res.cngPricePerKg.toFixed(2)} / kg</span>
                        </div>
                        <div class="fuel-card-row">
                            <span>Running Cost:</span>
                            <span class="text-success fw-bold">₹${(res.cngTotalCost / res.distanceKm).toFixed(2)} / km</span>
                        </div>
                        <div class="fuel-card-row">
                            <span>Assumed Mileage:</span>
                            <span>25 km/kg</span>
                        </div>
                    </div>
                </div>

            </div>

            <div class="savings-banner">
                <div class="savings-banner-text">
                    <i class="fas fa-leaf me-1 text-warning"></i>
                    <strong>CNG Green Savings:</strong> 
                    Save <span class="fw-bold text-white">₹${cngSavings.toFixed(2)}</span> (${cngSavingsPct}%) compared to Petrol on this ${res.distanceKm.toFixed(0)} km journey!
                </div>
                <div class="savings-banner-amount">
                    Save Budget
                </div>
            </div>

        </div>
    `;
}

function calculateHaversineTotal(stopList) {
    let total = 0;
    for (let i = 0; i < stopList.length - 1; i++) {
        total += haversineDistance(stopList[i].lat, stopList[i].lng, stopList[i+1].lat, stopList[i+1].lng);
    }
    return total;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// ====================================================================
// 8. Fuel Comparison Tab & Simulator Engine (View 2)
// ====================================================================
const simRange = document.getElementById('calc-dist-range');
const simDistVal = document.getElementById('calc-dist-val');
const simDistDisplay = document.getElementById('sim-distance-display');

function updateFuelSimulator() {
    if (!simRange) return;

    const distance = parseFloat(simRange.value) || 500;
    if (simDistVal) simDistVal.textContent = distance;
    if (simDistDisplay) simDistDisplay.textContent = `${distance} km Trip`;

    const petrolEff = parseFloat(document.getElementById('sim-petrol-eff')?.value) || 15;
    const dieselEff = parseFloat(document.getElementById('sim-diesel-eff')?.value) || 20;
    const cngEff = parseFloat(document.getElementById('sim-cng-eff')?.value) || 25;

    const petrolPrice = parseFloat(document.getElementById('sim-petrol-price')?.value) || 94.72;
    const dieselPrice = parseFloat(document.getElementById('sim-diesel-price')?.value) || 87.62;
    const cngPrice = parseFloat(document.getElementById('sim-cng-price')?.value) || 75.09;

    const petrolL = distance / petrolEff;
    const dieselL = distance / dieselEff;
    const cngKg = distance / cngEff;

    const petrolTotal = petrolL * petrolPrice;
    const dieselTotal = dieselL * dieselPrice;
    const cngTotal = cngKg * cngPrice;

    document.getElementById('sim-petrol-cost').textContent = `₹${petrolTotal.toFixed(2)} (${petrolL.toFixed(1)} L)`;
    document.getElementById('sim-diesel-cost').textContent = `₹${dieselTotal.toFixed(2)} (${dieselL.toFixed(1)} L)`;
    document.getElementById('sim-cng-cost').textContent = `₹${cngTotal.toFixed(2)} (${cngKg.toFixed(1)} kg)`;

    const maxCost = petrolTotal;
    const dieselWidthPct = Math.min(100, (dieselTotal / maxCost) * 100);
    const cngWidthPct = Math.min(100, (cngTotal / maxCost) * 100);

    document.getElementById('sim-diesel-bar').style.width = `${dieselWidthPct}%`;
    document.getElementById('sim-cng-bar').style.width = `${cngWidthPct}%`;

    const savings = petrolTotal - cngTotal;
    const savingsPct = ((savings / petrolTotal) * 100).toFixed(1);

    document.getElementById('sim-savings-amount').textContent = `Save ₹${savings.toFixed(2)}`;
    document.getElementById('sim-savings-pct').textContent = `${savingsPct}%`;

    updateCommuteCalculator(petrolTotal / distance, cngTotal / distance);
}

function updateCommuteCalculator(petrolPerKm, cngPerKm) {
    const dailyKm = parseFloat(document.getElementById('commute-daily-km')?.value) || 40;
    const daysMonth = parseFloat(document.getElementById('commute-days-month')?.value) || 24;

    const monthlyKm = dailyKm * daysMonth;
    const monthlyPetrol = monthlyKm * (petrolPerKm || 6.31);
    const monthlyCng = monthlyKm * (cngPerKm || 3.00);

    const monthlySave = monthlyPetrol - monthlyCng;
    const annualSave = monthlySave * 12;

    const mSaveEl = document.getElementById('commute-monthly-save');
    const aSaveEl = document.getElementById('commute-annual-save');

    if (mSaveEl) mSaveEl.textContent = `₹${Math.round(monthlySave).toLocaleString('en-IN')} / month`;
    if (aSaveEl) aSaveEl.textContent = `₹${Math.round(annualSave).toLocaleString('en-IN')} / year`;
}

simRange?.addEventListener('input', updateFuelSimulator);
['sim-petrol-eff', 'sim-diesel-eff', 'sim-cng-eff', 'sim-petrol-price', 'sim-diesel-price', 'sim-cng-price', 'commute-daily-km', 'commute-days-month'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateFuelSimulator);
});

// ====================================================================
// 9. Live City Fuel Rates Table (View 3)
// ====================================================================
function renderFuelRatesTable(filterText = '') {
    if (!DOM.fuelTbody) return;

    const filtered = CITY_FUEL_RATES.filter(item => 
        item.city.toLowerCase().includes(filterText.toLowerCase()) ||
        item.state.toLowerCase().includes(filterText.toLowerCase())
    );

    if (filtered.length === 0) {
        DOM.fuelTbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No cities matched your search.</td></tr>`;
        return;
    }

    DOM.fuelTbody.innerHTML = '';
    filtered.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <strong>${row.city}</strong><br>
                <small class="text-muted">${row.state}</small>
            </td>
            <td><span class="badge bg-warning text-dark">₹${row.petrol.toFixed(2)}/L</span></td>
            <td><span class="badge bg-info text-white">₹${row.diesel.toFixed(2)}/L</span></td>
            <td><span class="badge bg-success text-white">₹${row.cng.toFixed(2)}/kg</span></td>
            <td><span class="badge bg-light text-muted border">${row.trend}</span></td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-primary" onclick="applyCityRates('${row.city}')">
                    <i class="fas fa-check me-1"></i> Apply to Route
                </button>
            </td>
        `;
        DOM.fuelTbody.appendChild(tr);
    });
}

DOM.filterRatesInput?.addEventListener('input', (e) => {
    renderFuelRatesTable(e.target.value);
});

window.applyCityRates = (cityName) => {
    const cityObj = CITY_FUEL_RATES.find(c => c.city.toLowerCase() === cityName.toLowerCase());
    if (!cityObj) return;

    let price = cityObj.cng;
    if (currentFuelType === 'petrol') price = cityObj.petrol;
    if (currentFuelType === 'diesel') price = cityObj.diesel;

    if (DOM.priceInput) DOM.priceInput.value = price;
    if (DOM.citySyncSelect) DOM.citySyncSelect.value = 'custom';

    switchTab('optimizer');
    showToast(`Loaded ${cityObj.city} fuel prices (₹${price}) to Planner!`, 'success');
};

// ====================================================================
// 10. Saved Trips System
// ====================================================================
document.getElementById('btn-save-current-route')?.addEventListener('click', () => {
    if (!currentTripResult) {
        showToast("Please calculate a route first before saving.", "warning");
        return;
    }

    const tripTitle = `${currentTripResult.origin} to ${currentTripResult.destination}`;
    const newSaved = {
        id: Date.now(),
        title: tripTitle,
        stops: [...currentTripResult.orderedStops],
        distance: currentTripResult.distanceKm,
        cost: currentTripResult.userTripCost,
        date: currentTripResult.date
    };

    savedRoutes.unshift(newSaved);
    localStorage.setItem('routeWiseSavedRoutes', JSON.stringify(savedRoutes));
    updateSavedCountBadge();
    showToast(`Saved trip "${tripTitle}"!`, 'success');
});

document.getElementById('btn-show-saved-routes')?.addEventListener('click', openSavedRoutesModal);

window.openSavedRoutesModal = () => {
    const listEl = document.getElementById('saved-routes-list-modal');
    if (!listEl) return;

    if (savedRoutes.length === 0) {
        listEl.innerHTML = `<p class="text-muted text-center my-4"><i class="fas fa-bookmark fa-2x mb-2 text-secondary opacity-50 d-block"></i>No saved trips yet. Calculate a route and click "Save Trip"!</p>`;
    } else {
        listEl.innerHTML = '';
        savedRoutes.forEach((route, i) => {
            const div = document.createElement('div');
            div.className = "p-3 border rounded-3 mb-2 bg-light d-flex justify-content-between align-items-center flex-wrap gap-2";
            div.innerHTML = `
                <div>
                    <h6 class="fw-bold mb-1 text-primary"><i class="fas fa-map-marker-alt me-1"></i> ${route.title}</h6>
                    <small class="text-muted">${route.stops.length} places • ${route.distance.toFixed(1)} km • ₹${route.cost.toFixed(0)} • Saved on ${route.date}</small>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-primary" onclick="loadSavedRoute(${i})">
                        <i class="fas fa-external-link-alt me-1"></i> Load Route
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteSavedRoute(${i})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            listEl.appendChild(div);
        });
    }

    const modal = new bootstrap.Modal(document.getElementById('savedRoutesModal'));
    modal.show();
};

window.loadSavedRoute = (index) => {
    const route = savedRoutes[index];
    if (!route) return;

    if (DOM.originInput) DOM.originInput.value = route.stops[0].name;
    if (DOM.destInput) DOM.destInput.value = route.stops[route.stops.length - 1].name;

    intermediateStops = route.stops.slice(1, -1);
    renderIntermediateStops();

    const modalEl = document.getElementById('savedRoutesModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    switchTab('optimizer');
    runRouteOptimization();
    showToast(`Loaded "${route.title}" to planner!`, 'success');
};

window.deleteSavedRoute = (index) => {
    savedRoutes.splice(index, 1);
    localStorage.setItem('routeWiseSavedRoutes', JSON.stringify(savedRoutes));
    updateSavedCountBadge();
    openSavedRoutesModal();
    showToast("Trip removed from saved list", "info");
};

function updateSavedCountBadge() {
    if (DOM.savedCountBadge) {
        DOM.savedCountBadge.textContent = savedRoutes.length;
    }
}

// ====================================================================
// 11. Contact Form & Feedback
// ====================================================================
document.getElementById('contact-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-contact');
    if (btn) {
        btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Sending...`;
        btn.disabled = true;
    }

    setTimeout(() => {
        if (btn) {
            btn.innerHTML = `<i class="fas fa-check me-1"></i> Message Sent!`;
            btn.classList.replace('btn-primary-custom', 'btn-success-custom');
        }
        showToast("Thank you! Your message has been sent to the RouteWise team.", "success");
        document.getElementById('contact-form')?.reset();

        setTimeout(() => {
            if (btn) {
                btn.innerHTML = `<i class="fas fa-paper-plane me-1"></i> Send Message`;
                btn.classList.replace('btn-success-custom', 'btn-primary-custom');
                btn.disabled = false;
            }
        }, 3000);
    }, 1000);
});

// ====================================================================
// 12. Toast Notification Helper
// ====================================================================
function showToast(message, type = 'info') {
    if (!DOM.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `custom-toast toast-${type}`;

    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    if (type === 'error') icon = 'times-circle';

    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <div class="flex-grow-1">${message}</div>
    `;

    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ====================================================================
// 13. SPA Tab Router & Navigation
// ====================================================================
window.switchTab = (tabName) => {
    document.querySelectorAll('.tab-view-container').forEach(el => el.classList.remove('active-tab'));
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));

    const targetView = document.getElementById(`view-${tabName}`);
    const targetNav = document.getElementById(`nav-btn-${tabName}`);

    if (targetView) targetView.classList.add('active-tab');
    if (targetNav) targetNav.classList.add('active');

    if (tabName === 'optimizer' && map) {
        setTimeout(() => map.invalidateSize(), 200);
    }

    const navbarCollapse = document.getElementById('navbarContent');
    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
        const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
        if (bsCollapse) bsCollapse.hide();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (['optimizer', 'comparison', 'rates', 'about'].includes(hash)) {
        switchTab(hash);
    }
});

['optimizer', 'comparison', 'rates', 'about'].forEach(name => {
    document.getElementById(`nav-btn-${name}`)?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.hash = name;
        switchTab(name);
    });
});

const yearEl = document.getElementById('current-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ====================================================================
// 14. Application Initialization
// ====================================================================
async function initApp() {
    await loadCityData();
    renderFuelRatesTable();
    updateFuelSimulator();

    if (currentUser) {
        unlockApplication();
    } else {
        if (DOM.authGateway) DOM.authGateway.style.display = 'flex';
        if (DOM.mainAppWrapper) DOM.mainAppWrapper.style.display = 'none';
    }
}

initApp();