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

    const newSaved = {
        id:       Date.now(),
        title:    `${currentTripResult.origin} to ${currentTripResult.destination}`,
        stops:    [...currentTripResult.orderedStops],
        distance: currentTripResult.distanceKm,
        cost:     currentTripResult.userTripCost,
        date:     currentTripResult.date
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
                <small class="text-muted">${route.stops.length} places • ${route.distance.toFixed(1)} km • ₹${route.cost.toFixed(0)} • Saved on ${route.date}</small>
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

    const modalEl = document.getElementById('savedRoutesModal');
    const modal   = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    switchTab('optimizer');
    runRouteOptimization();
    showToast(`Loaded "${route.title}" to planner!`, 'success');
};

// ── Delete Saved Route ────────────────────────────────────────────
window.deleteSavedRoute = (index) => {
    savedRoutes.splice(index, 1);
    localStorage.setItem('routeWiseSavedRoutes', JSON.stringify(savedRoutes));
    updateSavedCountBadge();
    openSavedRoutesModal();
    showToast('Trip removed from saved list', 'info');
};
