/**
 * RouteWise — auth.js
 * Account Database, Login, Signup, Logout, Session restore, Car animation.
 * Depends on: config.js, utils.js
 */

// ── Auth State & Registered Accounts Database ─────────────────────
let currentUser = JSON.parse(localStorage.getItem('routeWiseUser')) || null;

const DEFAULT_SEED_USERS = [
    { name: "Vikram Kumar", email: "driver@routewise.in", password: "password123", fuel: "cng", mileage: 25 },
    { name: "Ananya Sharma", email: "fleet@routewise.in", password: "password123", fuel: "diesel", mileage: 20 }
];

function getRegisteredUsers() {
    const stored = localStorage.getItem('routeWiseUsers');
    if (!stored) {
        localStorage.setItem('routeWiseUsers', JSON.stringify(DEFAULT_SEED_USERS));
        return DEFAULT_SEED_USERS;
    }
    try {
        return JSON.parse(stored) || DEFAULT_SEED_USERS;
    } catch (e) {
        return DEFAULT_SEED_USERS;
    }
}

function saveRegisteredUsers(users) {
    localStorage.setItem('routeWiseUsers', JSON.stringify(users));
}

// ── Auth Mode Toggle (Sign In / Sign Up tabs) ────────────────────
window.setGatewayAuthMode = (mode) => {
    const btnSignIn  = document.getElementById('gateway-tab-signin');
    const btnSignUp  = document.getElementById('gateway-tab-signup');
    const formSignIn = document.getElementById('gateway-signin-form');
    const formSignUp = document.getElementById('gateway-signup-form');

    if (mode === 'signin') {
        btnSignIn?.classList.add('active');    btnSignUp?.classList.remove('active');
        if (formSignIn) formSignIn.style.display = 'block';
        if (formSignUp) formSignUp.style.display = 'none';
    } else {
        btnSignUp?.classList.add('active');    btnSignIn?.classList.remove('active');
        if (formSignUp) formSignUp.style.display = 'block';
        if (formSignIn) formSignIn.style.display = 'none';
    }
};

// ── Form Submit Handlers ─────────────────────────────────────────

// 1. Sign In Form
document.getElementById('gateway-signin-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailInput    = document.getElementById('gateway-signin-email')?.value.trim();
    const passwordInput = document.getElementById('gateway-signin-password')?.value;

    if (!emailInput || !passwordInput) {
        showToast("Please enter both email/username and password.", "warning");
        return;
    }

    const users = getRegisteredUsers();
    const matchedUser = users.find(u =>
        u.email.toLowerCase() === emailInput.toLowerCase() && u.password === passwordInput
    );

    if (matchedUser) {
        triggerLoginSequence(matchedUser);
    } else {
        showToast("Invalid email or password. Please check your credentials or create an account.", "error");
    }
});

// 2. Sign Up Form
document.getElementById('gateway-signup-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name    = document.getElementById('gateway-signup-name')?.value.trim();
    const email   = document.getElementById('gateway-signup-email')?.value.trim().toLowerCase();
    const fuel    = document.getElementById('gateway-signup-fuel')?.value || 'cng';
    const mileage = parseFloat(document.getElementById('gateway-signup-mileage')?.value) || 24;
    const password= document.getElementById('gateway-signup-password')?.value;

    if (!name || !email || !password) {
        showToast("Please fill in all required account fields.", "warning");
        return;
    }

    if (password.length < 4) {
        showToast("Password must be at least 4 characters long.", "warning");
        return;
    }

    const users = getRegisteredUsers();
    const exists = users.some(u => u.email.toLowerCase() === email);

    if (exists) {
        showToast(`An account with email "${email}" already exists. Please sign in.`, "warning");
        setGatewayAuthMode('signin');
        const emailField = document.getElementById('gateway-signin-email');
        if (emailField) emailField.value = email;
        return;
    }

    const newUser = { name, email, password, fuel, mileage, createdAt: new Date().toISOString() };
    users.push(newUser);
    saveRegisteredUsers(users);

    triggerLoginSequence(newUser);
});

// ── Car Animation + App Unlock ───────────────────────────────────
function triggerLoginSequence(userObj) {
    currentUser = userObj;
    localStorage.setItem('routeWiseUser', JSON.stringify(currentUser));
    if (typeof refreshSavedRoutesForCurrentUser === 'function') refreshSavedRoutesForCurrentUser();

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

function getUserInitials(name) {
    if (!name) return 'U';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
        return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    }
    return words[0].charAt(0).toUpperCase();
}

function unlockApplication() {
    const authGateway    = document.getElementById('auth-gateway-view');
    const mainAppWrapper  = document.getElementById('main-app-wrapper');

    if (authGateway)    authGateway.style.display   = 'none';
    if (mainAppWrapper) mainAppWrapper.style.display = 'block';

    if (currentUser) {
        if (document.getElementById('nav-user-name'))    document.getElementById('nav-user-name').textContent    = currentUser.name;
        if (document.getElementById('nav-user-email'))   document.getElementById('nav-user-email').textContent   = currentUser.email;
        if (document.getElementById('nav-user-avatar'))  document.getElementById('nav-user-avatar').textContent  = getUserInitials(currentUser.name);
        if (document.getElementById('nav-user-vehicle')) document.getElementById('nav-user-vehicle').textContent = `Vehicle: ${currentUser.fuel.toUpperCase()} (${currentUser.mileage} km/unit)`;

        const fuelBtn = document.querySelector(`.fuel-btn[data-fuel="${currentUser.fuel}"]`);
        if (fuelBtn) fuelBtn.click();

        if (currentUser.mileage) {
            const effInput = document.getElementById('fuel-efficiency');
            if (effInput) effInput.value = currentUser.mileage;
        }
    }

    if (typeof initializeMap === 'function') initializeMap();
    setTimeout(() => { if (typeof map !== 'undefined' && map) map.invalidateSize(); }, 200);
    if (typeof updateSavedCountBadge === 'function') updateSavedCountBadge();
}

// ── Logout ───────────────────────────────────────────────────────
window.logoutUser = () => {
    currentUser = null;
    savedRoutes = [];
    localStorage.removeItem('routeWiseUser');

    // Reset input fields
    const signinEmail = document.getElementById('gateway-signin-email');
    const signinPass  = document.getElementById('gateway-signin-password');
    if (signinEmail) signinEmail.value = '';
    if (signinPass)  signinPass.value  = '';

    const mainAppWrapper = document.getElementById('main-app-wrapper');
    const authGateway    = document.getElementById('auth-gateway-view');

    if (mainAppWrapper) mainAppWrapper.style.display = 'none';
    if (authGateway)    authGateway.style.display    = 'flex';

    setGatewayAuthMode('signin');
    showToast("Signed out successfully from RouteWise", "info");
};
