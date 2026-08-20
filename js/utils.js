/**
 * RouteWise — utils.js
 * Shared helpers: toast notifications, tab router, footer year.
 * Depends on: config.js (for DOM)
 */

// ── Toast Notifications ──────────────────────────────────────────
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `custom-toast toast-${type}`;

    const icons = { success: 'check-circle', warning: 'exclamation-triangle', error: 'times-circle', info: 'info-circle' };
    const icon  = icons[type] || 'info-circle';

    toast.innerHTML = `<i class="fas fa-${icon}"></i><div class="flex-grow-1">${message}</div>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity   = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ── SPA Tab Router ───────────────────────────────────────────────
function switchTab(tabName) {
    if (typeof currentUser === 'undefined' || !currentUser) return;

    document.querySelectorAll('.tab-view-container').forEach(el => el.classList.remove('active-tab'));
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));

    const targetView = document.getElementById(`view-${tabName}`);
    const targetNav  = document.getElementById(`nav-btn-${tabName}`);

    if (targetView) targetView.classList.add('active-tab');
    if (targetNav)  targetNav.classList.add('active');

    // Leaflet needs a size refresh when its tab becomes visible
    if (tabName === 'optimizer' && typeof map !== 'undefined' && map) {
        setTimeout(() => map.invalidateSize(), 200);
    }

    // Close mobile hamburger if open
    const navbarCollapse = document.getElementById('navbarContent');
    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
        const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
        if (bsCollapse) bsCollapse.hide();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.switchTab = switchTab;

// Wire nav links
['optimizer', 'comparison', 'rates', 'about'].forEach(name => {
    document.getElementById(`nav-btn-${name}`)?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.hash = name;
        switchTab(name);
    });
});

// Hash-based deep linking
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (['optimizer', 'comparison', 'rates', 'about'].includes(hash)) switchTab(hash);
});

// Footer dynamic year
const yearEl = document.getElementById('current-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
