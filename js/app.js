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

    // 3. Session restore: if user was logged in, skip auth screen
    if (currentUser) {
           unlockApplication(); // 3. Unlock the app for everyone — sign-in is optional now.
           if (!currentUser) enterGuestMode();
    } else {
        document.getElementById('auth-gateway-view').style.display  = 'flex';
        document.getElementById('main-app-wrapper').style.display   = 'none';
    }
}

initApp();
