/**
 * RouteWise — saved-routes.js
 * Save, load, delete and display bookmarked trips.
 * Depends on: utils.js, map.js (runRouteOptimization, renderIntermediateStops)
 */

let savedRoutes = JSON.parse(localStorage.getItem('routeWiseSavedRoutes')) || [];

// ── Badge Counter ─────────────────────────────────────────────────
function updateSavedCountBadge() {
    const badge = document.getElementById('saved-count-badge');
    if (badge) badge.textContent = savedRoutes.length;
}

// ── Save Current Trip ─────────────────────────────────────────────
document.getElementById('btn-save-current-route')?.addEventListener('click', () => {
    if (!currentTripResult) { showToast('Please calculate a route first before saving.', 'warning'); return; }

    // Fix #6 — also save current fuel settings so they restore on load
    const newSaved = {
        id:        Date.now(),
        title:     `${currentTripResult.origin} to ${currentTripResult.destination}`,
        stops:     [...currentTripResult.orderedStops],
        distance:  currentTripResult.distanceKm,
        cost:      currentTripResult.userTripCost,
        fuelType:  currentFuelType,
        fuelEff:   parseFloat(document.getElementById('fuel-efficiency')?.value)  || 25,
        fuelPrice: parseFloat(document.getElementById('fuel-price')?.value)        || 75.09,
        cityName:  currentTripResult.selectedCityName || 'Reference (Delhi)',
        date:      currentTripResult.date
    };
    savedRoutes.unshift(newSaved);
    localStorage.setItem('routeWiseSavedRoutes', JSON.stringify(savedRoutes));
    updateSavedCountBadge();
    showToast(`Saved trip "${newSaved.title}"!`, 'success');
});

// ── Open Saved Trips Modal ────────────────────────────────────────
window.openSavedRoutesModal = () => {
    const listEl = document.getElementById('saved-routes-list-modal');
    if (!listEl) return;

    listEl.innerHTML = savedRoutes.length === 0
        ? `<p class="text-muted text-center my-4"><i class="fas fa-bookmark fa-2x mb-2 text-secondary opacity-50 d-block"></i>No saved trips yet. Calculate a route and click "Save Trip"!</p>`
        : '';

    savedRoutes.forEach((route, i) => {
        const div = document.createElement('div');
        div.className = 'p-3 border rounded-3 mb-2 bg-light d-flex justify-content-between align-items-center flex-wrap gap-2';
        div.innerHTML = `
            <div>
                <h6 class="fw-bold mb-1 text-primary"><i class="fas fa-map-marker-alt me-1"></i> ${route.title}</h6>
                <small class="text-muted">${route.stops.length} places &bull; ${route.distance.toFixed(1)} km &bull; &#8377;${route.cost.toFixed(0)} &bull; ${route.fuelType ? route.fuelType.toUpperCase() : 'CNG'} &bull; Saved ${route.date}</small>
            </div>
            <div class="d-flex gap-2">
                <button class="btn btn-sm btn-primary"        onclick="loadSavedRoute(${i})">  <i class="fas fa-external-link-alt me-1"></i> Load Route</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteSavedRoute(${i})"><i class="fas fa-trash"></i></button>
            </div>`;
        listEl.appendChild(div);
    });

    new bootstrap.Modal(document.getElementById('savedRoutesModal')).show();
};

document.getElementById('btn-show-saved-routes')?.addEventListener('click', openSavedRoutesModal);

// ── Load Saved Route ──────────────────────────────────────────────
window.loadSavedRoute = (index) => {
    const route = savedRoutes[index];
    if (!route) return;

    document.getElementById('origin-city-input').value = route.stops[0].name;
    document.getElementById('dest-city-input').value   = route.stops[route.stops.length - 1].name;
    intermediateStops = route.stops.slice(1, -1);
    renderIntermediateStops();

    // Fix #6 — restore fuel type, efficiency and price from saved trip
    if (route.fuelType) {
        const fuelBtn = document.querySelector(`.fuel-btn[data-fuel="${route.fuelType}"]`);
        if (fuelBtn) fuelBtn.click();
    }
    if (route.fuelEff) {
        const effInput = document.getElementById('fuel-efficiency');
        if (effInput) effInput.value = route.fuelEff;
    }
    if (route.fuelPrice) {
        const priceInput = document.getElementById('fuel-price');
        if (priceInput) priceInput.value = route.fuelPrice;
    }

    const modalEl = document.getElementById('savedRoutesModal');
    const modal   = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    switchTab('optimizer');
    runRouteOptimization();
    showToast(`Loaded "${route.title}" to planner!`, 'success');
};

// Fix #10 — Confirm before deleting a saved trip
window.deleteSavedRoute = (index) => {
    const title = savedRoutes[index]?.title || 'this trip';
    if (!confirm(`Remove "${title}" from your saved trips?`)) return;
    savedRoutes.splice(index, 1);
    localStorage.setItem('routeWiseSavedRoutes', JSON.stringify(savedRoutes));
    updateSavedCountBadge();
    openSavedRoutesModal();
    showToast('Trip removed from saved list', 'info');
};
