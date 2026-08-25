/**
 * RouteWise — saved-routes.js
 * Save, load, delete and display bookmarked trips.
 * Guest Mode safe: prompts user when saving requires account login.
 * Depends on: utils.js, map.js (runRouteOptimization, renderIntermediateStops)
 */

let pendingTripToSave = null;

function getSavedRoutesStorageKey() {
    const accountId = currentUser?.email?.trim().toLowerCase();
    return accountId ? `routeWiseSavedRoutes:${accountId}` : null;
}

function loadSavedRoutesForCurrentUser() {
    const storageKey = getSavedRoutesStorageKey();
    if (!storageKey) return [];

    try {
        return JSON.parse(localStorage.getItem(storageKey)) || [];
    } catch (e) {
        return [];
    }
}

function persistSavedRoutes() {
    const storageKey = getSavedRoutesStorageKey();
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(savedRoutes));
}

let savedRoutes = loadSavedRoutesForCurrentUser();

window.refreshSavedRoutesForCurrentUser = () => {
    savedRoutes = loadSavedRoutesForCurrentUser();
    updateSavedCountBadge();
};

// ── Badge Counter ─────────────────────────────────────────────────
function updateSavedCountBadge() {
    const badge = document.getElementById('saved-count-badge');
    if (badge) badge.textContent = savedRoutes.length;
}

// ── Internal Helper to Persist a Trip Object ──────────────────────
function saveTripData(tripObj) {
    if (!tripObj) return;
    savedRoutes.unshift(tripObj);
    persistSavedRoutes();
    updateSavedCountBadge();
    showToast(`Saved trip "${tripObj.title}" to your account!`, 'success');
}

// ── Process Pending Trip Saved from Guest Prompt ──────────────────
window.processPendingTripSave = () => {
    if (pendingTripToSave && currentUser) {
        saveTripData(pendingTripToSave);
        pendingTripToSave = null;
    }
};

// ── Save Current Trip ─────────────────────────────────────────────
document.getElementById('btn-save-current-route')?.addEventListener('click', () => {
    if (!currentTripResult) { 
        showToast('Please calculate a route first before saving.', 'warning'); 
        return; 
    }

    const tripObj = {
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

    // If currently in Guest Mode, prompt for account sign in / register
    if (!currentUser) {
        pendingTripToSave = tripObj;
        const promptModalEl = document.getElementById('guestSavePromptModal');
        if (promptModalEl) {
            new bootstrap.Modal(promptModalEl).show();
        } else {
            showToast('Saving trips requires an account. Please sign in or register.', 'warning');
            showAuthGateway('signin');
        }
        return;
    }

    // Authenticated user
    saveTripData(tripObj);
});

// ── Open Saved Trips Modal ────────────────────────────────────────
window.openSavedRoutesModal = () => {
    const listEl = document.getElementById('saved-routes-list-modal');
    if (!listEl) return;

    if (!currentUser) {
        listEl.innerHTML = `
            <div class="text-center py-4">
                <div class="mb-3">
                    <span class="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle" style="width: 60px; height: 60px; font-size: 26px;">
                        <i class="fas fa-bookmark"></i>
                    </span>
                </div>
                <h5 class="fw-bold text-dark mb-2">Guest Mode Active</h5>
                <p class="text-muted small mb-4" style="max-width: 440px; margin: 0 auto;">
                    You are exploring in <strong>Guest Mode</strong>. Saved trips are stored securely in user accounts so you can access and load them across sessions.
                </p>
                <div class="d-flex justify-content-center gap-2 flex-wrap">
                    <button class="btn btn-sm btn-primary px-3 py-2 fw-semibold" onclick="bootstrap.Modal.getInstance(document.getElementById('savedRoutesModal'))?.hide(); showAuthGateway('signin');">
                        <i class="fas fa-sign-in-alt me-1"></i> Sign In / Create Account
                    </button>
                </div>
            </div>`;
        new bootstrap.Modal(document.getElementById('savedRoutesModal')).show();
        return;
    }

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
    persistSavedRoutes();
    updateSavedCountBadge();
    openSavedRoutesModal();
    showToast('Trip removed from saved list', 'info');
};