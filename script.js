const USERS_KEY = 'routewise-users';

// Check if Leaflet is loaded
window.addEventListener('load', () => {
  if (window.L) {
    console.log('Leaflet library loaded successfully');
  } else {
    console.warn('Leaflet library not loaded. Please check if the CDN link is working.');
  }
});

const FUEL_CONFIG = {
  petrol: { label: 'Petrol', price: 105.5, color: '#2563eb' },
  diesel: { label: 'Diesel', price: 92.4, color: '#f59e0b' },
  cng: { label: 'CNG', price: 76.2, color: '#16a34a' }
};

const state = {
  mode: 'login',
  stops: [],
  currentPage: 'dashboard',
  map: null,
  routeMarkers: [],
  routePolyline: null,
  cityData: [] // 🌟 NEW: Array to hold Kaggle CSV Data
};

document.addEventListener('DOMContentLoaded', () => {
  loadCSVData(); // 🌟 Load the CSV when the page starts
  bindAuthEvents();
  bindRouteEvents();
  bindNavigationEvents();
  renderFuelCards();
  renderStops();
  updateFuelCalculation();
});

// 🌟 NEW: Fetch and Parse the Kaggle CSV
async function loadCSVData() {
  try {
    const response = await fetch('cities.csv');
    const csvText = await response.text();
    const rows = csvText.split('\n');
    const datalist = document.getElementById('city-options');

    for (let i = 1; i < rows.length; i++) {
      if (!rows[i].trim()) continue;
      const cols = rows[i].split(',');
      const cityName = cols[1] ? cols[1].trim() : '';
      const lat = parseFloat(cols[2]);
      const lng = parseFloat(cols[3]);

      if (cityName && !isNaN(lat) && !isNaN(lng)) {
        state.cityData.push({ name: cityName, lat: lat, lon: lng });
        
        const option = document.createElement('option');
        option.value = cityName;
        datalist.appendChild(option);
      }
    }
  } catch (error) {
    console.error("CSV loading failed. Make sure you are using a local server:", error);
  }
}

function bindAuthEvents() {
  const authTabs = document.querySelectorAll('.tab-button');
  const authForm = document.getElementById('auth-form');
  const authSubmit = document.getElementById('auth-submit');
  const authTitle = document.getElementById('auth-title');
  const nameField = document.getElementById('name-field');
  const authView = document.getElementById('auth-view');
  const dashboardView = document.getElementById('dashboard-view');
  const logoutBtn = document.getElementById('logout-btn');
  const userName = document.getElementById('user-name');
  const authMessage = document.getElementById('auth-message');
  const nameInput = document.getElementById('name-input');
  const emailInput = document.getElementById('email-input');
  const passwordInput = document.getElementById('password-input');

  authTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      state.mode = tab.dataset.mode;
      authTabs.forEach((item) => item.classList.toggle('active', item === tab));

      const isSignup = state.mode === 'signup';
      nameField.classList.toggle('hidden', !isSignup);
      authTitle.textContent = isSignup ? 'Create your account' : 'Welcome back';
      authSubmit.textContent = isSignup ? 'Create Account' : 'Log In';
      authMessage.classList.add('hidden');
      
      nameInput.value = '';
      emailInput.value = '';
      passwordInput.value = '';
    });
  });

  authForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = document.getElementById('name-input').value.trim();
    const email = document.getElementById('email-input').value.trim().toLowerCase();
    const password = document.getElementById('password-input').value;

    if (state.mode === 'signup') {
      if (!name || !email || !password) return setAuthMessage('Please fill in all fields.', 'error');
      const users = getUsers();
      if (users.some((user) => user.email.toLowerCase() === email)) return setAuthMessage('Account already exists.', 'error');
      
      users.push({ name, email, password });
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      setAuthMessage('Account created successfully. Please log in.', 'success');
      
      nameInput.value = emailInput.value = passwordInput.value = '';
      state.mode = 'login';
      authTabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.mode === 'login'));
      nameField.classList.add('hidden');
      authTitle.textContent = 'Welcome back';
      authSubmit.textContent = 'Log In';
      return;
    }

    if (!email || !password) return setAuthMessage('Email and password required.', 'error');
    const users = getUsers();
    const match = users.find((user) => user.email.toLowerCase() === email && user.password === password);

    if (!match) return setAuthMessage('Invalid email or password.', 'error');

    userName.textContent = match.name;
    authView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    emailInput.value = passwordInput.value = '';
    
    setTimeout(() => initializeMap(), 500);
  });

  logoutBtn.addEventListener('click', () => {
    document.getElementById('email-input').value = '';
    document.getElementById('password-input').value = '';
    
    authView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
    document.getElementById('about-view').classList.add('hidden');
  });
}

function bindNavigationEvents() {
  const navbar = document.getElementById('navbar-menu');
  const navLinks = navbar.querySelectorAll('.nav-link');
  
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      const page = link.dataset.page;
      switchPage(page);
      navLinks.forEach((item) => item.classList.remove('active'));
      link.classList.add('active');
    });
  });
}

function switchPage(page) {
  const dashboardView = document.getElementById('dashboard-view');
  const aboutView = document.getElementById('about-view');
  
  if (page === 'dashboard') {
    dashboardView.classList.remove('hidden');
    aboutView.classList.add('hidden');
    if (state.map) setTimeout(() => state.map.invalidateSize(), 100);
  } else if (page === 'about') {
    dashboardView.classList.add('hidden');
    aboutView.classList.remove('hidden');
  }
}

function bindRouteEvents() {
  const routeForm = document.getElementById('route-form');
  const addStopBtn = document.getElementById('add-stop-btn');
  const distanceInput = document.getElementById('distance-input');
  const mileageInputs = document.querySelectorAll('.mileage-input');

  addStopBtn.addEventListener('click', () => {
    state.stops.push({ id: generateId(), value: '' });
    renderStops();
  });

  routeForm.addEventListener('submit', (event) => {
    event.preventDefault();
    optimizeRoute();
  });

  distanceInput.addEventListener('input', updateFuelCalculation);
  mileageInputs.forEach((input) => input.addEventListener('input', updateFuelCalculation));
}

function renderStops() {
  const stopList = document.getElementById('stop-list');
  stopList.innerHTML = '';

  state.stops.forEach((stop, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'stop-item';

    const number = document.createElement('div');
    number.className = 'stop-number';
    number.textContent = index + 1;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = stop.value;
    input.placeholder = 'Stop city or place';
    input.setAttribute('list', 'city-options'); // 🌟 Link the input to the CSV Autocomplete!
    
    input.addEventListener('input', (event) => {
      stop.value = event.target.value;
    });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-stop';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => {
      state.stops = state.stops.filter((item) => item.id !== stop.id);
      renderStops();
    });

    wrapper.append(number, input, removeBtn);
    stopList.appendChild(wrapper);
  });
}

function generateId() {
  return `stop-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function getUsers() {
  try {
    const data = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}

function setAuthMessage(message, type) {
  const authMessage = document.getElementById('auth-message');
  authMessage.textContent = message;
  authMessage.classList.toggle('hidden', !message);
  authMessage.classList.remove('error', 'success');
  if (type) authMessage.classList.add(type);
}

function renderFuelCards() {
  const container = document.getElementById('fuel-cards');
  container.innerHTML = Object.entries(FUEL_CONFIG)
    .map(
      ([key, item]) => `
        <article class="fuel-card" data-fuel="${key}">
          <div class="fuel-head">
            <span class="fuel-dot" style="background:${item.color};"></span>
            <h4>${item.label}</h4>
          </div>
          <div class="metric-row">
            <span>Price</span>
            <strong>₹${item.price.toFixed(2)}/L</strong>
          </div>
          <div class="metric-row">
            <span>Fuel used</span>
            <strong id="${key}-used">0.00 L</strong>
          </div>
          <div class="metric-row">
            <span>Cost</span>
            <strong id="${key}-cost">₹0.00</strong>
          </div>
        </article>
      `
    ).join('');
}

function updateFuelCalculation() {
  const distance = Number(document.getElementById('distance-input').value || 0);
  const entries = Object.entries(FUEL_CONFIG).map(([key, item]) => {
    const mileage = Number(document.getElementById(`${key}-mileage`).value || 0);
    const fuelUsed = mileage > 0 ? distance / mileage : 0;
    const totalCost = fuelUsed * item.price;

    const usedEl = document.getElementById(`${key}-used`);
    const costEl = document.getElementById(`${key}-cost`);
    if (usedEl) usedEl.textContent = `${fuelUsed.toFixed(2)} L`;
    if (costEl) costEl.textContent = `₹${totalCost.toFixed(2)}`;

    return { key, label: item.label, color: item.color, cost: totalCost };
  });

  // 🌟 THIS LINE WAS MISSING: It tells the chart to draw itself!
  renderFuelChart(entries);
}
// 🌟 RESTORED: The function that draws the SVG chart
function renderFuelChart(entries) {
  const svg = document.getElementById('fuel-chart');
  const width = 420;
  const height = 220;
  const padding = 40;
  const barWidth = 50;
  const groupSpacing = 100;

  svg.innerHTML = '';

  // Add title
  const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  title.setAttribute('x', String(width / 2));
  title.setAttribute('y', '20');
  title.setAttribute('text-anchor', 'middle');
  title.setAttribute('font-size', '14');
  title.setAttribute('font-weight', 'bold');
  title.setAttribute('fill', '#0f172a');
  title.textContent = 'Market Price vs Trip Cost Comparison';
  svg.appendChild(title);

  // Get price data and max values for scaling
  const priceData = Object.entries(FUEL_CONFIG).map(([key, config]) => ({
    label: config.label,
    color: config.color,
    price: config.price
  }));

  const maxPrice = Math.max(...priceData.map((p) => p.price), Math.max(...entries.map((e) => e.cost), 1));

  // Draw Y-axis
  const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  yAxis.setAttribute('x1', String(padding - 5));
  yAxis.setAttribute('y1', String(padding));
  yAxis.setAttribute('x2', String(padding - 5));
  yAxis.setAttribute('y2', String(height - padding));
  yAxis.setAttribute('stroke', '#0f172a');
  yAxis.setAttribute('stroke-width', '2');
  svg.appendChild(yAxis);

  // Draw X-axis
  const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  xAxis.setAttribute('x1', String(padding - 5));
  xAxis.setAttribute('y1', String(height - padding));
  xAxis.setAttribute('x2', String(width - 10));
  xAxis.setAttribute('y2', String(height - padding));
  xAxis.setAttribute('stroke', '#0f172a');
  xAxis.setAttribute('stroke-width', '2');
  svg.appendChild(xAxis);

  // Draw grid lines and Y-axis labels
  for (let i = 0; i <= 4; i++) {
    const value = (maxPrice / 4) * i;
    const y = height - padding - (i * (height - padding * 1.5)) / 4;

    const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    gridLine.setAttribute('x1', String(padding - 5));
    gridLine.setAttribute('x2', String(width - 10));
    gridLine.setAttribute('y1', String(y));
    gridLine.setAttribute('y2', String(y));
    gridLine.setAttribute('stroke', 'rgba(148,163,184,0.15)');
    gridLine.setAttribute('stroke-width', '1');
    svg.appendChild(gridLine);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', String(padding - 15));
    label.setAttribute('y', String(y + 4));
    label.setAttribute('text-anchor', 'end');
    label.setAttribute('font-size', '11');
    label.setAttribute('fill', '#64748b');
    label.textContent = `₹${value.toFixed(0)}`;
    svg.appendChild(label);
  }

  // Draw bars for each fuel type
  priceData.forEach((fuel, index) => {
    const groupX = padding + 20 + index * groupSpacing;
    const tripEntry = entries[index];

    // Market price bar
    const priceHeight = (fuel.price / maxPrice) * (height - padding * 1.5);
    const priceBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    priceBar.setAttribute('x', String(groupX - barWidth / 2));
    priceBar.setAttribute('y', String(height - padding - priceHeight));
    priceBar.setAttribute('width', String(barWidth - 8));
    priceBar.setAttribute('height', String(priceHeight));
    priceBar.setAttribute('fill', fuel.color);
    priceBar.setAttribute('opacity', '0.8');
    priceBar.setAttribute('rx', '4');

    const priceBarTooltip = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    priceBarTooltip.textContent = `${fuel.label} Market Price: ₹${fuel.price.toFixed(2)}/L`;
    priceBar.appendChild(priceBarTooltip);
    svg.appendChild(priceBar);

    // Trip cost bar
    if (tripEntry) {
      const costHeight = (tripEntry.cost / maxPrice) * (height - padding * 1.5);
      const costBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      costBar.setAttribute('x', String(groupX + 2));
      costBar.setAttribute('y', String(height - padding - costHeight));
      costBar.setAttribute('width', String(barWidth - 8));
      costBar.setAttribute('height', String(costHeight));
      costBar.setAttribute('fill', fuel.color);
      costBar.setAttribute('opacity', '0.4');
      costBar.setAttribute('rx', '4');

      const costBarTooltip = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      costBarTooltip.textContent = `${fuel.label} Trip Cost: ₹${tripEntry.cost.toFixed(2)}`;
      costBar.appendChild(costBarTooltip);
      svg.appendChild(costBar);
    }

    // X-axis label
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', String(groupX));
    label.setAttribute('y', String(height - padding + 18));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '12');
    label.setAttribute('font-weight', 'bold');
    label.setAttribute('fill', '#0f172a');
    label.textContent = fuel.label;
    svg.appendChild(label);
  });

  // Add legend
  const legendY = height - 10;
  const legend1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  legend1.setAttribute('x', '50');
  legend1.setAttribute('y', String(legendY));
  legend1.setAttribute('width', '12');
  legend1.setAttribute('height', '12');
  legend1.setAttribute('fill', '#94a3b8');
  legend1.setAttribute('opacity', '0.8');
  legend1.setAttribute('rx', '2');
  svg.appendChild(legend1);

  const legend1Text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  legend1Text.setAttribute('x', '68');
  legend1Text.setAttribute('y', String(legendY + 10));
  legend1Text.setAttribute('font-size', '10');
  legend1Text.setAttribute('fill', '#64748b');
  legend1Text.textContent = 'Market Price';
  svg.appendChild(legend1Text);

  const legend2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  legend2.setAttribute('x', '210');
  legend2.setAttribute('y', String(legendY));
  legend2.setAttribute('width', '12');
  legend2.setAttribute('height', '12');
  legend2.setAttribute('fill', '#94a3b8');
  legend2.setAttribute('opacity', '0.4');
  legend2.setAttribute('rx', '2');
  svg.appendChild(legend2);

  const legend2Text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  legend2Text.setAttribute('x', '228');
  legend2Text.setAttribute('y', String(legendY + 10));
  legend2Text.setAttribute('font-size', '10');
  legend2Text.setAttribute('fill', '#64748b');
  legend2Text.textContent = 'Trip Cost';
  svg.appendChild(legend2Text);
}

  // Skip rendering the complex chart code for brevity, you can keep your existing renderFuelChart here if you want.
  // (Assuming you have your renderFuelChart function from earlier)


// 🌟 NEW: Real OSRM Optimization instead of fake distance calculations
async function optimizeRoute() {
  const routeStatus = document.getElementById('route-status');
  const startVal = document.getElementById('start-location').value.trim();
  const destVal = document.getElementById('destination-location').value.trim();

  if (!startVal || !destVal) {
    routeStatus.textContent = 'Please enter both a start and destination.';
    routeStatus.classList.remove('hidden');
    return;
  }

  // 1. Validate Cities from CSV
  const startCity = state.cityData.find(c => c.name.toLowerCase() === startVal.toLowerCase());
  const destCity = state.cityData.find(c => c.name.toLowerCase() === destVal.toLowerCase());

  if (!startCity) return alert(`Start city "${startVal}" not found in database.`);
  if (!destCity) return alert(`Destination city "${destVal}" not found in database.`);

  const validStops = [];
  for (const stop of state.stops) {
    if (!stop.value.trim()) continue;
    const city = state.cityData.find(c => c.name.toLowerCase() === stop.value.trim().toLowerCase());
    if (!city) return alert(`Stop city "${stop.value}" not found in database.`);
    validStops.push(city);
  }

  routeStatus.textContent = 'Connecting to routing engine...';
  routeStatus.classList.remove('hidden');

  // 2. Format Coordinates for OSRM API [Start, ...Stops, Dest]
  const sequence = [startCity, ...validStops, destCity];
  const coordsString = sequence.map(c => `${c.lon},${c.lat}`).join(';');

  // source=first & destination=last solves the Traveling Salesman problem for the stops in the middle!
  const osrmUrl = `https://router.project-osrm.org/trip/v1/driving/${coordsString}?source=first&destination=last&roundtrip=false&geometries=geojson&overview=full`;

  try {
    const response = await fetch(osrmUrl);
    const data = await response.json();

    if (data.code !== 'Ok') throw new Error("API routing failed");

    // 3. Extract Real Math
    const realDistanceKm = data.trips[0].distance / 1000;
    const estimatedTime = Math.max(1, Math.round(data.trips[0].duration / 3600)); // duration is in seconds

    // 4. Update UI
    document.getElementById('distance-input').value = Math.round(realDistanceKm);
    updateFuelCalculation();

    const summary = document.getElementById('route-summary');
    summary.innerHTML = `
      <div class="summary-card">
        <div class="summary-label">Distance</div>
        <div class="summary-value">${realDistanceKm.toFixed(1)} km</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Travel time</div>
        <div class="summary-value">${estimatedTime} hrs</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Stops</div>
        <div class="summary-value">${validStops.length}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Status</div>
        <div class="summary-value">Optimized</div>
      </div>
    `;

    routeStatus.textContent = `Actual Road Distance Calculated: ${realDistanceKm.toFixed(1)} km.`;
    
    // 5. Draw the real map
    drawRouteOnMap(sequence, data.trips[0].geometry);

  } catch (error) {
    console.error("Routing Error:", error);
    routeStatus.textContent = 'Failed to calculate route. Ensure you have an internet connection.';
  }
}

function initializeMap() {
  const mapContainer = document.getElementById('route-map');
  if (!mapContainer || !window.L || mapContainer.offsetHeight === 0) {
    setTimeout(initializeMap, 300);
    return;
  }

  if (state.map) {
    state.map.remove();
    state.routeMarkers = [];
    state.routePolyline = null;
  }

  state.map = window.L.map('route-map', {
    center: [23.1815, 79.9864],
    zoom: 5
  });

  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
  }).addTo(state.map);
}

// 🌟 NEW: Draw real GeoJSON paths instead of straight lines
function drawRouteOnMap(sequence, geometry) {
  if (!state.map) {
    initializeMap();
    setTimeout(() => drawRouteOnMap(sequence, geometry), 300);
    return;
  }

  // Clear existing items
  if (state.routeMarkers) state.routeMarkers.forEach(m => state.map.removeLayer(m));
  if (state.routePolyline) state.map.removeLayer(state.routePolyline);
  state.routeMarkers = [];
  
  // Draw the real road polyline
  if (geometry && window.L) {
    state.routePolyline = window.L.geoJSON(geometry, {
      style: { color: '#2563eb', weight: 4, opacity: 0.8 }
    }).addTo(state.map);
    
    state.map.fitBounds(state.routePolyline.getBounds(), { padding: [50, 50] });
  }

  // Draw the pins
  sequence.forEach((city, index) => {
    let type = 'stop';
    let label = String(index);
    let color = '#2563eb'; // Blue

    if (index === 0) {
        type = 'start';
        label = 'A';
        color = '#16a34a'; // Green
    } else if (index === sequence.length - 1) {
        type = 'destination';
        label = 'B';
        color = '#f59e0b'; // Orange
    }

    const svgIcon = `<svg width="40" height="50" viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="18" r="16" fill="${color}"/>
      <path d="M20 50C8 35 0 26 0 18C0 7.9 9 0 20 0C31 0 40 7.9 40 18C40 26 32 35 20 50Z" fill="${color}"/>
      <text x="20" y="22" text-anchor="middle" fill="white" font-size="18" font-weight="bold" font-family="Arial">${label}</text>
    </svg>`;

    const markerIcon = window.L.icon({
      iconUrl: 'data:image/svg+xml;base64,' + btoa(svgIcon),
      iconSize: [40, 50],
      iconAnchor: [20, 50],
      popupAnchor: [0, -50]
    });

    const marker = window.L.marker([city.lat, city.lon], { icon: markerIcon })
      .bindPopup(`<b>${city.name}</b><br><small>${type.toUpperCase()}</small>`)
      .addTo(state.map);

    state.routeMarkers.push(marker);
  });
}