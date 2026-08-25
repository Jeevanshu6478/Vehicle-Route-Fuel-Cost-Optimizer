/**
 * RouteWise — app.js
 * Application bootstrap: loads city data, renders initial state.
 * This is the LAST script loaded — all other modules must be ready.
 * Depends on: config.js, utils.js, auth.js, cities.js, fuel.js, saved-routes.js
 */

async function initApp() {
    // 1. Load city data (CSV → datalist)
    await loadCityData();

    // 2. Populate static views
    renderFuelRatesTable();
    updateFuelSimulator();

    // 3. Trigger initial car drive-in loading screen
    const storedUser = typeof getStoredSessionUser === 'function' ? getStoredSessionUser() : null;
    if (typeof triggerInitialLoadingSequence === 'function') {
        triggerInitialLoadingSequence(storedUser);
    } else {
        if (storedUser) {
            currentUser = storedUser;
            unlockApplication();
        } else {
            enterGuestMode();
        }
    }
}

initApp();
