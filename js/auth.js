/**
 * RouteWise — auth.js
 * Login, signup, logout, session restore, car animation trigger.
 * Depends on: config.js, utils.js
 */

// ── Auth State ───────────────────────────────────────────────────
let currentUser = JSON.parse(localStorage.getItem('routeWiseUser')) || null;

// ── Auth Mode Toggle (Sign In / Sign Up tabs) ────────────────────
window.setGatewayAuthMode = (mode) => {
    const btnSignIn  = document.getElementById('gateway-tab-signin');
    const btnSignUp  = document.getElementById('gateway-tab-signup');
    const formSignIn = document.getElementById('gateway-signin-form');
    const formSignUp = document.getElementById('gateway-signup-form');

    if (mode === 'signin') {
        btnSignIn.classList.add('active');    btnSignUp.classList.remove('active');
        formSignIn.style.display = 'block';   formSignUp.style.display = 'none';
    } else {
        btnSignUp.classList.add('active');    btnSignIn.classList.remove('active');
        formSignUp.style.display = 'block';   formSignIn.style.display = 'none';
    }
};

// ── Form Submit Handlers ─────────────────────────────────────────
document.getElementById('gateway-signin-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('gateway-signin-email')?.value.trim() || 'driver@routewise.in';
    triggerLoginSequence({ name: email.split('@')[0].toUpperCase(), email, fuel: 'cng', mileage: 25 });
});

document.getElementById('gateway-signup-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name    = document.getElementById('gateway-signup-name')?.value.trim()    || 'New User';
    const email   = document.getElementById('gateway-signup-email')?.value.trim()   || 'user@routewise.in';
    const fuel    = document.getElementById('gateway-signup-fuel')?.value            || 'cng';
    const mileage = parseFloat(document.getElementById('gateway-signup-mileage')?.value) || 24;
    triggerLoginSequence({ name, email, fuel, mileage });
});

// ── Demo Quick Login Buttons ─────────────────────────────────────
document.getElementById('btn-quick-cng-driver')?.addEventListener('click', () => {
    triggerLoginSequence({ name: "Vikram (CNG Commuter)", email: "vikram.cng@driver.in", fuel: "cng", mileage: 26 });
});
document.getElementById('btn-quick-fleet-mgr')?.addEventListener('click', () => {
    triggerLoginSequence({ name: "Ananya (Fleet Manager)", email: "ananya.fleet@logistics.in", fuel: "diesel", mileage: 20 });
});

// ── Car Animation + App Unlock ───────────────────────────────────
function triggerLoginSequence(userObj) {
    currentUser = userObj;
    localStorage.setItem('routeWiseUser', JSON.stringify(currentUser));

    const overlay   = document.getElementById('car-transition-overlay');
    const progress  = document.getElementById('car-anim-progress');
    const title     = document.getElementById('car-anim-title');
    const subtitle  = document.getElementById('car-anim-subtitle');

    if (overlay) {
        overlay.classList.add('active');
        if (progress) progress.style.width = '0%';
        if (title)    title.textContent    = "Starting Your Engine...";
        if (subtitle) subtitle.textContent = `Authenticating profile for ${userObj.name}...`;

        setTimeout(() => {
            if (progress) progress.style.width = '45%';
            if (title)    title.textContent    = "Connecting Highway Satellite Networks...";
            if (subtitle) subtitle.textContent = "Loading 4,000+ Indian road networks and live fuel rates...";
        }, 650);

        setTimeout(() => {
            if (progress) progress.style.width = '100%';
            if (title)    title.textContent    = `Welcome to RouteWise, ${userObj.name}!`;
            if (subtitle) subtitle.textContent = "Launching RouteWise Journey Planner...";
        }, 1400);

        setTimeout(() => {
            overlay.classList.remove('active');
            unlockApplication();
            showToast(`Welcome back to RouteWise, ${userObj.name}!`, 'success');
        }, 2200);
    } else {
        unlockApplication();
    }
}

function unlockApplication() {
    const authGateway   = document.getElementById('auth-gateway-view');
    const mainAppWrapper = document.getElementById('main-app-wrapper');

    if (authGateway)    authGateway.style.display   = 'none';
    if (mainAppWrapper) mainAppWrapper.style.display = 'block';

    if (currentUser) {
        document.getElementById('nav-user-name')?.    textContent && (document.getElementById('nav-user-name').textContent    = currentUser.name);
        document.getElementById('nav-user-email')?.   textContent && (document.getElementById('nav-user-email').textContent   = currentUser.email);
        document.getElementById('nav-user-avatar')?.  textContent && (document.getElementById('nav-user-avatar').textContent  = currentUser.name.charAt(0).toUpperCase());
        document.getElementById('nav-user-vehicle')?.textContent  && (document.getElementById('nav-user-vehicle').textContent = `Vehicle: ${currentUser.fuel.toUpperCase()} (${currentUser.mileage} km/unit)`);

        const fuelBtn = document.querySelector(`.fuel-btn[data-fuel="${currentUser.fuel}"]`);
        if (fuelBtn) fuelBtn.click();
    }

    initializeMap();
    setTimeout(() => { if (map) map.invalidateSize(); }, 200);
    updateSavedCountBadge();
}

// ── Logout ───────────────────────────────────────────────────────
window.logoutUser = () => {
    currentUser = null;
    localStorage.removeItem('routeWiseUser');
    document.getElementById('main-app-wrapper').style.display = 'none';
    document.getElementById('auth-gateway-view').style.display = 'flex';
    showToast("Signed out successfully from RouteWise", "info");
};
