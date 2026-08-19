/**
 * RouteWise — fuel.js
 * Fuel comparison simulator, city rates table, commute calculator,
 * apply-city-rates action.
 * Depends on: config.js, utils.js
 */

// ── Fuel Simulator (View 2) ───────────────────────────────────────
function updateFuelSimulator() {
    const simRange = document.getElementById('calc-dist-range');
    if (!simRange) return;

    const distance   = parseFloat(simRange.value) || 500;
    const distVal    = document.getElementById('calc-dist-val');
    const distDisplay = document.getElementById('sim-distance-display');
    if (distVal)     distVal.textContent    = distance;
    if (distDisplay) distDisplay.textContent = `${distance} km Trip`;

    const petrolEff   = parseFloat(document.getElementById('sim-petrol-eff')?.value)   || 15;
    const dieselEff   = parseFloat(document.getElementById('sim-diesel-eff')?.value)   || 20;
    const cngEff      = parseFloat(document.getElementById('sim-cng-eff')?.value)      || 25;
    const petrolPrice = parseFloat(document.getElementById('sim-petrol-price')?.value) || 94.72;
    const dieselPrice = parseFloat(document.getElementById('sim-diesel-price')?.value) || 87.62;
    const cngPrice    = parseFloat(document.getElementById('sim-cng-price')?.value)    || 75.09;

    const petrolL = distance / petrolEff, petrolTotal = petrolL * petrolPrice;
    const dieselL = distance / dieselEff, dieselTotal = dieselL * dieselPrice;
    const cngKg   = distance / cngEff,   cngTotal    = cngKg   * cngPrice;

    document.getElementById('sim-petrol-cost').textContent = `₹${petrolTotal.toFixed(2)} (${petrolL.toFixed(1)} L)`;
    document.getElementById('sim-diesel-cost').textContent = `₹${dieselTotal.toFixed(2)} (${dieselL.toFixed(1)} L)`;
    document.getElementById('sim-cng-cost').textContent    = `₹${cngTotal.toFixed(2)} (${cngKg.toFixed(1)} kg)`;

    const dieselBar = document.getElementById('sim-diesel-bar');
    const cngBar    = document.getElementById('sim-cng-bar');
    if (dieselBar) dieselBar.style.width = `${Math.min(100, (dieselTotal / petrolTotal) * 100)}%`;
    if (cngBar)    cngBar.style.width    = `${Math.min(100, (cngTotal    / petrolTotal) * 100)}%`;

    const savings    = petrolTotal - cngTotal;
    const savingsPct = ((savings / petrolTotal) * 100).toFixed(1);
    document.getElementById('sim-savings-amount').textContent = `Save ₹${savings.toFixed(2)}`;
    document.getElementById('sim-savings-pct').textContent    = `${savingsPct}%`;

    updateCommuteCalculator(petrolTotal / distance, cngTotal / distance);
}

function updateCommuteCalculator(petrolPerKm, cngPerKm) {
    const dailyKm   = parseFloat(document.getElementById('commute-daily-km')?.value)   || 40;
    const daysMonth = parseFloat(document.getElementById('commute-days-month')?.value) || 24;
    const monthlyKm     = dailyKm * daysMonth;
    const monthlySave   = monthlyKm * ((petrolPerKm || 6.31) - (cngPerKm || 3.00));
    const annualSave    = monthlySave * 12;
    const mSaveEl = document.getElementById('commute-monthly-save');
    const aSaveEl = document.getElementById('commute-annual-save');
    if (mSaveEl) mSaveEl.textContent = `₹${Math.round(monthlySave).toLocaleString('en-IN')} / month`;
    if (aSaveEl) aSaveEl.textContent = `₹${Math.round(annualSave).toLocaleString('en-IN')} / year`;
}

// Wire simulator input events
document.getElementById('calc-dist-range')?.addEventListener('input', updateFuelSimulator);
['sim-petrol-eff','sim-diesel-eff','sim-cng-eff','sim-petrol-price','sim-diesel-price','sim-cng-price','commute-daily-km','commute-days-month'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateFuelSimulator);
});

// ── City Fuel Rates Table (View 3) ───────────────────────────────
function renderFuelRatesTable(filterText = '') {
    const tbody = document.getElementById('fuel-rates-tbody');
    if (!tbody) return;

    const filtered = CITY_FUEL_RATES.filter(item =>
        item.city.toLowerCase().includes(filterText.toLowerCase()) ||
        item.state.toLowerCase().includes(filterText.toLowerCase())
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No cities matched your search.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    filtered.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${row.city}</strong><br><small class="text-muted">${row.state}</small></td>
            <td><span class="badge bg-warning text-dark">₹${row.petrol.toFixed(2)}/L</span></td>
            <td><span class="badge bg-info text-white">₹${row.diesel.toFixed(2)}/L</span></td>
            <td><span class="badge bg-success text-white">₹${row.cng.toFixed(2)}/kg</span></td>
            <td><span class="badge bg-light text-muted border">${row.trend}</span></td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-primary" onclick="applyCityRates('${row.city}')">
                    <i class="fas fa-check me-1"></i> Apply to Route
                </button>
            </td>`;
        tbody.appendChild(tr);
    });
}

document.getElementById('filter-rates-input')?.addEventListener('input', (e) => renderFuelRatesTable(e.target.value));

window.applyCityRates = (cityName) => {
    const cityObj = CITY_FUEL_RATES.find(c => c.city.toLowerCase() === cityName.toLowerCase());
    if (!cityObj) return;
    let price = currentFuelType === 'petrol' ? cityObj.petrol : currentFuelType === 'diesel' ? cityObj.diesel : cityObj.cng;
    const priceInput = document.getElementById('fuel-price');
    const syncSelect = document.getElementById('city-rate-sync-select');
    if (priceInput) priceInput.value = price;
    if (syncSelect) syncSelect.value = 'custom';
    switchTab('optimizer');
    showToast(`Loaded ${cityObj.city} fuel prices (₹${price}) to Planner!`, 'success');
};

// ── Contact Form ──────────────────────────────────────────────────
document.getElementById('contact-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-contact');
    if (btn) { btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Sending...`; btn.disabled = true; }

    setTimeout(() => {
        if (btn) { btn.innerHTML = `<i class="fas fa-check me-1"></i> Message Sent!`; btn.classList.replace('btn-primary-custom', 'btn-success-custom'); }
        showToast('Thank you! Your message has been sent to the RouteWise team.', 'success');
        document.getElementById('contact-form')?.reset();
        setTimeout(() => {
            if (btn) { btn.innerHTML = `<i class="fas fa-paper-plane me-1"></i> Send Message`; btn.classList.replace('btn-success-custom', 'btn-primary-custom'); btn.disabled = false; }
        }, 3000);
    }, 1000);
});
