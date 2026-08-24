/**
 * RouteWise — landing.js
 * Hero map (separate Leaflet instance), load sequence, scroll reveals.
 * Loaded AFTER map.js — does NOT touch the planner's `map` global.
 * Depends on: config.js (for FALLBACK_INDIAN_CITIES)
 */

// ── Hero Map State ──────────────────────────────────────────────────
let heroMap = null;
let heroRouteLayer = null;
let landingInitDone = false;

// ── Hardcoded route: Delhi → Jaipur → Mumbai ────────────────────────
// A rough highway-following polyline (no OSRM call — avoids rate limits)
const HERO_ROUTE_COORDS = [
    [28.6139, 77.2090],   // Delhi
    [28.19, 76.60],
    [27.50, 76.15],
    [26.9124, 75.7873],   // Jaipur
    [26.30, 75.15],
    [25.43, 74.63],
    [24.58, 74.00],
    [23.80, 73.50],
    [23.02, 72.57],       // near Ahmedabad
    [22.30, 72.80],
    [21.17, 72.83],       // Surat area
    [20.40, 73.00],
    [19.85, 73.20],
    [19.50, 73.10],
    [19.22, 72.98],
    [19.0760, 72.8777]    // Mumbai
];

const HERO_CITIES = [
    { name: 'Delhi',  lat: 28.6139, lng: 77.2090, color: '#c97700' },  // amber — petrol
    { name: 'Jaipur', lat: 26.9124, lng: 75.7873, color: '#2563eb' },  // blue  — diesel
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777, color: '#059669' }   // green — CNG
];

// Distance for this route (approx, used in counter animation)
const HERO_DISTANCE_KM = 1157;

// ── Reduced-motion check (same pattern as utils.js:68) ──────────────
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Init Landing Sequence ───────────────────────────────────────────
// Called from unlockApplication() in auth.js
window.initLandingSequence = function () {
    if (landingInitDone) return;
    landingInitDone = true;

    const mapContainer = document.getElementById('hero-map-container');
    if (!mapContainer) return;

    // Create the hero's own Leaflet instance
    heroMap = L.map('hero-map-container', {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        boxZoom: false,
        keyboard: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18
    }).addTo(heroMap);

    // Fit map to the route bounds
    const bounds = L.latLngBounds(HERO_ROUTE_COORDS);
    heroMap.fitBounds(bounds, { padding: [30, 30] });

    // Run the sequence
    if (reduceMotion) {
        renderHeroStatic();
    } else {
        runHeroAnimation();
    }

    // Set up scroll reveals
    setupScrollReveals();
};

// ── Static render (reduced motion) ──────────────────────────────────
function renderHeroStatic() {
    // Show tiles immediately
    const tilePane = document.querySelector('#hero-map-container .leaflet-tile-pane');
    if (tilePane) tilePane.style.opacity = '1';

    // Draw route
    heroRouteLayer = L.polyline(HERO_ROUTE_COORDS, {
        color: '#2563eb',
        weight: 5,
        opacity: 0.9
    }).addTo(heroMap);

    // Place city dots
    HERO_CITIES.forEach(function (city) {
        var dot = L.circleMarker([city.lat, city.lng], {
            radius: 7,
            fillColor: city.color,
            fillOpacity: 1,
            color: '#fff',
            weight: 2,
            className: 'hero-city-dot'
        }).addTo(heroMap);
        dot.bindTooltip(city.name, {
            permanent: false,
            direction: 'top',
            offset: [0, -10],
            className: 'route-polyline-tooltip'
        });
    });

    // Set final counter values immediately
    setCounterValue('hero-counter-petrol', '₹6.31');
    setCounterValue('hero-counter-diesel', '₹4.38');
    setCounterValue('hero-counter-cng', '₹3.00');
    setCounterValue('hero-counter-distance', HERO_DISTANCE_KM.toLocaleString('en-IN'));

    // Set headline values
    const h1Petrol = document.getElementById('hero-h1-petrol');
    const h1Cng = document.getElementById('hero-h1-cng');
    if (h1Petrol) h1Petrol.textContent = '₹6.31';
    if (h1Cng) h1Cng.textContent = '₹3.00';

    // Reveal all proof figures immediately
    revealAllProofFigures();
}

// ── Animated sequence ───────────────────────────────────────────────
function runHeroAnimation() {
    var tilePane = document.querySelector('#hero-map-container .leaflet-tile-pane');
    if (tilePane) {
        tilePane.style.opacity = '0';
        tilePane.style.transition = 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)';
    }

    // 0–200 ms: Tiles fade up
    setTimeout(function () {
        if (tilePane) tilePane.style.opacity = '1';
    }, 0);

    // 200–470 ms: City dots scale in, 90ms apart
    HERO_CITIES.forEach(function (city, idx) {
        setTimeout(function () {
            var dot = L.circleMarker([city.lat, city.lng], {
                radius: 7,
                fillColor: city.color,
                fillOpacity: 1,
                color: '#fff',
                weight: 2,
                className: 'hero-city-dot'
            }).addTo(heroMap);
            dot.bindTooltip(city.name, {
                permanent: false,
                direction: 'top',
                offset: [0, -10],
                className: 'route-polyline-tooltip'
            });

            // Scale-in animation via transform on the dot's element
            var el = dot.getElement();
            if (el) {
                el.style.transform = 'scale(0.6)';
                el.style.transition = 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)';
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        el.style.transform = 'scale(1)';
                    });
                });
            }
        }, 200 + idx * 90);
    });

    // 470–1400 ms: Route draws via stroke-dashoffset
    setTimeout(function () {
        heroRouteLayer = L.polyline(HERO_ROUTE_COORDS, {
            color: '#2563eb',
            weight: 5,
            opacity: 0.9
        }).addTo(heroMap);

        // Animate using stroke-dashoffset on the SVG path
        var svgPath = null;
        // Leaflet renders polylines as SVG paths
        heroMap.eachLayer(function (layer) {
            if (layer === heroRouteLayer && layer.getElement) {
                svgPath = layer.getElement();
            }
        });

        if (!svgPath) {
            // Fallback: find the path in the overlay pane
            var overlayPane = document.querySelector('#hero-map-container .leaflet-overlay-pane svg path');
            if (overlayPane) svgPath = overlayPane;
        }

        if (svgPath) {
            var pathLength = svgPath.getTotalLength();
            svgPath.style.strokeDasharray = pathLength;
            svgPath.style.strokeDashoffset = pathLength;
            svgPath.style.transition = 'stroke-dashoffset 930ms cubic-bezier(0.4, 0, 0.2, 1)';

            requestAnimationFrame(function () {
                svgPath.style.strokeDashoffset = '0';
            });
        }
    }, 470);

    // 900–1600 ms: Counter count-ups
    setTimeout(function () {
        countUp('hero-counter-petrol', 0, 6.31, 700, '₹', '');
        countUp('hero-counter-diesel', 0, 4.38, 700, '₹', '');
        countUp('hero-counter-cng', 0, 3.00, 700, '₹', '');
        countUp('hero-counter-distance', 0, HERO_DISTANCE_KM, 700, '', '');

        // Headline figures also count up
        countUp('hero-h1-petrol', 0, 6.31, 500, '₹', '');
        countUp('hero-h1-cng', 0, 3.00, 500, '₹', '');
    }, 900);
}

// ── Count-up utility ────────────────────────────────────────────────
// Uses easeOutCubic: 1 - Math.pow(1 - t, 3)
function countUp(elementId, start, end, duration, prefix, suffix) {
    var el = document.getElementById(elementId);
    if (!el) return;

    if (reduceMotion) {
        el.textContent = prefix + formatCounterValue(end) + suffix;
        return;
    }

    var startTime = null;
    var isInteger = Number.isInteger(end);

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var t = Math.min((timestamp - startTime) / duration, 1);
        // Ease-out cubic
        var eased = 1 - Math.pow(1 - t, 3);
        var current = start + (end - start) * eased;

        el.textContent = prefix + formatCounterValue(current, isInteger) + suffix;

        if (t < 1) {
            requestAnimationFrame(step);
        } else {
            el.textContent = prefix + formatCounterValue(end, isInteger) + suffix;
        }
    }

    requestAnimationFrame(step);
}

function formatCounterValue(value, isInteger) {
    if (isInteger || value >= 100) {
        return Math.round(value).toLocaleString('en-IN');
    }
    return value.toFixed(2);
}

function setCounterValue(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
}

// ── Scroll Reveals ──────────────────────────────────────────────────
// One IntersectionObserver, threshold 0.4, unobserve after firing.
function setupScrollReveals() {
    if (reduceMotion) {
        // Show everything immediately
        document.querySelectorAll('.landing-reveal').forEach(function (el) {
            el.classList.add('revealed');
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
        document.querySelectorAll('.rw-reveal').forEach(function (el) {
            el.classList.add('rw-visible');
        });
        document.querySelectorAll('.how-step').forEach(function (el) {
            el.classList.add('revealed');
        });
        revealAllProofFigures();
        return;
    }

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;

            var target = entry.target;
            observer.unobserve(target);

            // Band 2: proof figures count up staggered
            if (target.id === 'landing-proof') {
                var figures = target.querySelectorAll('.proof-figure');
                figures.forEach(function (fig, idx) {
                    setTimeout(function () {
                        var endVal = parseFloat(fig.getAttribute('data-value'));
                        var prefix = fig.getAttribute('data-prefix') || '';
                        var suffix = fig.getAttribute('data-suffix') || '';
                        var isInt = fig.getAttribute('data-integer') === 'true';
                        if (isInt) {
                            countUp(fig.id, 0, endVal, 600, prefix, suffix);
                        } else {
                            countUp(fig.id, 0, endVal, 600, prefix, suffix);
                        }
                    }, idx * 60);
                });
            }

            // Band 3: how-it-works panels with icons + connector lines
            if (target.id === 'landing-how') {
                var steps = target.querySelectorAll('.how-step');
                steps.forEach(function (step, idx) {
                    setTimeout(function () {
                        step.style.opacity = '0';
                        step.style.transform = 'translateY(12px)';
                        step.style.transition = 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                        requestAnimationFrame(function () {
                            requestAnimationFrame(function () {
                                step.style.opacity = '1';
                                step.style.transform = 'translateY(0)';
                                step.classList.add('revealed');
                            });
                        });
                    }, idx * 150);
                });
            }

            // Band 4: annual saving count up + comparison bar
            if (target.id === 'landing-receipt') {
                target.classList.add('revealed');
                countUp('receipt-annual-save', 0, 38131, 800, '₹', '');

                // Fill the comparison bars (uses .anim-progress-fill pattern)
                setTimeout(function () {
                    var petrolBar = document.getElementById('receipt-bar-petrol');
                    var cngBar = document.getElementById('receipt-bar-cng');
                    if (petrolBar) petrolBar.style.width = '100%';
                    if (cngBar) cngBar.style.width = '47.5%'; // 3.00/6.31 ≈ 47.5%
                }, 200);
            }
        });
    }, { threshold: 0.4 });

    // Observe the bands that get reveals
    ['landing-proof', 'landing-how', 'landing-receipt'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) observer.observe(el);
    });

    // Global scroll reveal for .rw-reveal elements (contact cards, etc.)
    var rwRevealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            rwRevealObserver.unobserve(entry.target);
            var delay = parseFloat(entry.target.getAttribute('data-delay') || '0');
            setTimeout(function () {
                entry.target.classList.add('rw-visible');
            }, delay * 1000);
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.rw-reveal').forEach(function (el) {
        rwRevealObserver.observe(el);
    });
}

function revealAllProofFigures() {
    var figures = document.querySelectorAll('#landing-proof .proof-figure');
    figures.forEach(function (fig) {
        var val = fig.getAttribute('data-value');
        var prefix = fig.getAttribute('data-prefix') || '';
        var suffix = fig.getAttribute('data-suffix') || '';
        var isInt = fig.getAttribute('data-integer') === 'true';
        if (isInt) {
            fig.textContent = prefix + parseInt(val).toLocaleString('en-IN') + suffix;
        } else {
            fig.textContent = prefix + val + suffix;
        }
    });
}
