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

    // 3. Always require login on opening the site (no auto-open without login)
    currentUser = null;
    localStorage.removeItem('routeWiseUser');
    const authGateway = document.getElementById('auth-gateway-view');
    const mainApp     = document.getElementById('main-app-wrapper');
    if (authGateway) authGateway.style.display = 'flex';
    if (mainApp)     mainApp.style.display     = 'none';
}

initApp();
