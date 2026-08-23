/**
 * RouteWise — utils.js
 * Shared helpers: toast notifications, one-page scroll router, footer year.
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

// ── One-page scroll router ───────────────────────────────────────
// All four sections render at once (see .tab-view-container in
// base.css); navigating means scrolling to one rather than swapping
// which one is visible. The 62px sticky-header offset is handled in
// CSS via scroll-margin-top, so there are no magic offsets here.
const RW_SECTIONS = ['optimizer', 'comparison', 'rates', 'about'];

// Scroll-spy state. Declared before switchTab because switchTab sets
// the lock when it starts a programmatic scroll.
let spyLockedUntil = 0;
let spyQueued = false;

// Marks a section + its nav link as current. .active-tab no longer
// drives visibility, but it's still toggled so the class keeps its
// meaning for anything that reads it.
function setActiveSection(tabName) {
    document.querySelectorAll('.tab-view-container').forEach(el => el.classList.remove('active-tab'));
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));

    const targetView = document.getElementById(`view-${tabName}`);
    const targetNav  = document.getElementById(`nav-btn-${tabName}`);

    if (targetView) targetView.classList.add('active-tab');
    if (targetNav)  targetNav.classList.add('active');
}

function switchTab(tabName) {
    if (typeof currentUser === 'undefined' || !currentUser) return;

    setActiveSection(tabName);

    // Hold the scroll-spy off while the smooth scroll is in flight,
    // otherwise the underline flickers through every section on the way.
    spyLockedUntil = Date.now() + 900;

    const targetView = document.getElementById(`view-${tabName}`);
    if (targetView) {
        // An explicit behavior:'smooth' overrides the CSS reduced-motion
        // reset, so honour the preference here too.
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        targetView.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }

    // Leaflet needs a size refresh when its box changes
    if (tabName === 'optimizer' && typeof map !== 'undefined' && map) {
        setTimeout(() => map.invalidateSize(), 200);
    }

    // Close mobile hamburger if open
    const navbarCollapse = document.getElementById('navbarContent');
    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
        const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
        if (bsCollapse) bsCollapse.hide();
    }
}
window.switchTab = switchTab;

// Wire nav links
RW_SECTIONS.forEach(name => {
    document.getElementById(`nav-btn-${name}`)?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.hash = name;
        switchTab(name);
    });
});

// Hash-based deep linking
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (RW_SECTIONS.includes(hash)) switchTab(hash);
});

// ── Scroll-spy ───────────────────────────────────────────────────
// The active nav underline tracks whichever section the reader is in.
function updateActiveOnScroll() {
    spyQueued = false;
    if (Date.now() < spyLockedUntil) return;
    if (typeof currentUser === 'undefined' || !currentUser) return;

    let current = null;
    for (const name of RW_SECTIONS) {
        const el = document.getElementById(`view-${name}`);
        if (!el) continue;
        // A section becomes current once its top passes just under the
        // sticky header (62px + slack).
        if (el.getBoundingClientRect().top <= 90) current = name;
    }

    // The final section may be too short to ever cross the threshold,
    // so pin it once the document is scrolled to the end.
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        current = RW_SECTIONS[RW_SECTIONS.length - 1];
    }

    if (current) setActiveSection(current);
}

window.addEventListener('scroll', () => {
    if (spyQueued) return;
    spyQueued = true;
    requestAnimationFrame(updateActiveOnScroll);
}, { passive: true });

// Footer dynamic year
const yearEl = document.getElementById('current-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
