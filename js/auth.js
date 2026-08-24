/**
 * RouteWise — auth.js
 * Account Database, Login, Signup, Logout, Guest Mode, Session restore, Car animation.
 * Depends on: config.js, utils.js
 */

// ── Auth State & Registered Accounts Database ─────────────────────
let currentUser = null;

const DEFAULT_SEED_USERS = [
    { name: "Vikram Kumar", email: "driver@routewise.in", password: "password123", fuel: "cng", mileage: 25 },
    { name: "Ananya Sharma", email: "fleet@routewise.in", password: "password123", fuel: "diesel", mileage: 20 }
];

function getStoredSessionUser() {
    try {
        const stored = localStorage.getItem('routeWiseUser');
        return stored ? JSON.parse(stored) : null;
    } catch (e) {
        return null;
    }
}

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
        hideAuthGateway();
        triggerLoginSequence(matchedUser);
    } else {
        showToast("Invalid email or password. Please check credentials or create an account.", "error");
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

    hideAuthGateway();
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

            // If a trip was pending to save from guest prompt, save it now
            if (typeof processPendingTripSave === 'function') {
                processPendingTripSave();
            }
        }, 2200);
    } else {
        unlockApplication();
        if (typeof processPendingTripSave === 'function') {
            processPendingTripSave();
        }
    }
}

// ── Initial Website Load Screen Animation ─────────────────────────
window.triggerInitialLoadingSequence = (userObj) => {
    if (userObj) {
        currentUser = userObj;
        if (typeof refreshSavedRoutesForCurrentUser === 'function') refreshSavedRoutesForCurrentUser();
    } else {
        currentUser = null;
    }

    const overlay   = document.getElementById('car-transition-overlay');
    const progress  = document.getElementById('car-anim-progress');
    const title     = document.getElementById('car-anim-title');
    const subtitle  = document.getElementById('car-anim-subtitle');

    if (overlay) {
        overlay.classList.add('active');
        if (progress) progress.style.width = '0%';
        if (title)    title.textContent    = "Starting Your Engine...";
        if (subtitle) subtitle.textContent = userObj ? `Restoring profile for ${userObj.name}...` : "Calibrating Highway Networks & Fuel Prices...";

        setTimeout(() => {
            if (progress) progress.style.width = '55%';
            if (title)    title.textContent    = "Connecting Satellite Road Graphs...";
            if (subtitle) subtitle.textContent = "Loading 4,000+ Indian road networks and live fuel rates...";
        }, 550);

        setTimeout(() => {
            if (progress) progress.style.width = '100%';
            if (title)    title.textContent    = userObj ? `Welcome back, ${userObj.name}!` : "Welcome to RouteWise!";
            if (subtitle) subtitle.textContent = "Launching RouteWise Journey Planner...";
        }, 1200);

        setTimeout(() => {
            overlay.classList.remove('active');
            unlockApplication();
        }, 1800);
    } else {
        unlockApplication();
    }
};

function getUserInitials(name) {
    if (!name) return 'U';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
        return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    }
    return words[0].charAt(0).toUpperCase();
}

// ── Dynamic Navbar Rendering (Guest vs Logged In) ────────────────
function renderAuthNavbar() {
    const authNavContainer = document.getElementById('auth-nav-container');
    if (!authNavContainer) return;

    if (currentUser) {
        // Authenticated State
        const initials = getUserInitials(currentUser.name);
        const fuelUpper = (currentUser.fuel || 'CNG').toUpperCase();
        const mileage = currentUser.mileage || 25;
        const savedCount = (typeof savedRoutes !== 'undefined' && Array.isArray(savedRoutes)) ? savedRoutes.length : 0;

        authNavContainer.innerHTML = `
            <div class="dropdown">
                <div class="user-profile-badge dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" title="Click to view account">
                    <span class="user-avatar-mini">${initials}</span>
                    <span class="d-none d-sm-inline fw-bold">${currentUser.name}</span>
                </div>
                <ul class="dropdown-menu dropdown-menu-end shadow-sm" style="min-width: 240px;">
                    <li>
                        <h6 class="dropdown-header d-flex justify-content-between align-items-center">
                            <span><i class="fas fa-user-check me-1 text-success"></i> Signed In</span>
                            <span class="badge bg-success-subtle text-success border border-success-subtle">Active</span>
                        </h6>
                    </li>
                    <li><span class="dropdown-item-text small text-muted text-truncate d-block" style="max-width: 210px;">${currentUser.email}</span></li>
                    <li><span class="dropdown-item-text small fw-bold text-dark"><i class="fas fa-car me-1 text-primary"></i> ${fuelUpper} · ${mileage} km/unit</span></li>
                    <li><hr class="dropdown-divider"></li>
                    <li>
                        <a class="dropdown-item text-primary fw-semibold d-flex justify-content-between align-items-center" href="#" onclick="openSavedRoutesModal()">
                            <span><i class="fas fa-bookmark me-2"></i>My Saved Trips</span>
                            <span class="badge bg-primary rounded-pill" id="saved-count-badge">${savedCount}</span>
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item text-secondary small" href="#" onclick="toggleTheme()">
                            <i class="fas fa-adjust me-2"></i>Toggle Dark / Light
                        </a>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" onclick="logoutUser()"><i class="fas fa-sign-out-alt me-2"></i>Sign Out to Guest</a></li>
                </ul>
            </div>
        `;
    } else {
        // Guest Mode State
        authNavContainer.innerHTML = `
            <div class="dropdown">
                <div class="user-profile-badge dropdown-toggle guest-badge-glow" data-bs-toggle="dropdown" aria-expanded="false" title="Guest Mode Active - Click to Sign In">
                    <span class="user-avatar-mini guest-avatar-bg"><i class="fas fa-user"></i></span>
                    <span class="d-none d-sm-inline fw-bold">Guest Mode</span>
                </div>
                <ul class="dropdown-menu dropdown-menu-end shadow-sm" style="min-width: 230px;">
                    <li>
                        <h6 class="dropdown-header d-flex justify-content-between align-items-center">
                            <span><i class="fas fa-user-clock me-1 text-primary"></i> Guest Mode</span>
                            <span class="badge bg-primary-subtle text-primary border border-primary-subtle">Unlocked</span>
                        </h6>
                    </li>
                    <li><span class="dropdown-item-text small text-muted">All route &amp; fuel tools active</span></li>
                    <li><hr class="dropdown-divider"></li>
                    <li>
                        <a class="dropdown-item text-primary fw-bold" href="#" onclick="showAuthGateway('signin')">
                            <i class="fas fa-sign-in-alt me-2"></i>Sign In / Register
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item text-secondary small" href="#" onclick="toggleTheme()">
                            <i class="fas fa-adjust me-2"></i>Toggle Dark / Light
                        </a>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    <li>
                        <a class="dropdown-item text-secondary small" href="#" onclick="openSavedRoutesModal()">
                            <i class="fas fa-bookmark me-2"></i>My Saved Trips <span class="badge bg-light text-muted border ms-1">Account</span>
                        </a>
                    </li>
                </ul>
            </div>
        `;
    }
}

function unlockApplication() {
    const authGateway    = document.getElementById('auth-gateway-view');
    const mainAppWrapper  = document.getElementById('main-app-wrapper');

    if (authGateway)    authGateway.style.display   = 'none';
    if (mainAppWrapper) mainAppWrapper.style.display = 'block';

    renderAuthNavbar();

    if (currentUser) {
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
    if (typeof initLandingSequence === 'function') initLandingSequence();
}

// ── Guest Mode ───────────────────────────────────────────────────
window.enterGuestMode = () => {
    currentUser = null;
    localStorage.removeItem('routeWiseUser');
    unlockApplication();
};

// ── Logout ───────────────────────────────────────────────────────
window.logoutUser = () => {
    currentUser = null;
    localStorage.removeItem('routeWiseUser');
    if (typeof refreshSavedRoutesForCurrentUser === 'function') refreshSavedRoutesForCurrentUser();

    // Reset input fields
    const signinEmail = document.getElementById('gateway-signin-email');
    const signinPass  = document.getElementById('gateway-signin-password');
    if (signinEmail) signinEmail.value = '';
    if (signinPass)  signinPass.value  = '';

    // Seamlessly transition to Guest Mode without blocking user
    enterGuestMode();
    showToast("Signed out. Switched to Guest Mode.", "info");
};

// ── Auth Gateway Controls ─────────────────────────────────────────
window.showAuthGateway = (mode = 'signin') => {
    const authGateway = document.getElementById('auth-gateway-view');
    if (authGateway) {
        authGateway.style.display = 'flex';
        setGatewayAuthMode(mode);
    }
};

window.hideAuthGateway = () => {
    const authGateway = document.getElementById('auth-gateway-view');
    if (authGateway) {
        authGateway.style.display = 'none';
    }
};

// ── Guest Modal Helpers ───────────────────────────────────────────
window.handleGuestPromptSignIn = () => {
    const modalEl = document.getElementById('guestSavePromptModal');
    if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
    }
    showAuthGateway('signin');
};
