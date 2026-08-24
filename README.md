# RouteWise - Vehicle Route & Multi-Fuel Cost Optimizer

An algorithmic, user-friendly web application designed to optimize multi-stop vehicle routes across Indian cities and compare travel fuel expenditures across **Petrol**, **Diesel**, and **CNG** in real time.

---

## 🚀 Key Features

### 1. Interactive "From ➔ To" Journey Planner
- **4,000+ Indian Cities Database**: Instant search with autocomplete from Kaggle Indian cities GIS coordinates (`cities.csv`).
- **Quick-Add Metro Hubs**: 1-click addition of major hubs (Delhi, Mumbai, Bengaluru, Jaipur, Kolkata, Chennai, Hyderabad, Pune).
- **Interactive Leaflet.js Map**: Pin-drop waypoint visualization, route geometries, click-on-map to add stops, and reverse route capability.
- **TSP & OSRM Engine**: Calculates real road network travel distances and driving duration via Open Source Routing Machine.

### 2. Multi-Fuel Price Comparison Engine (Petrol vs Diesel vs CNG)
- **Side-by-Side Fuel Cost Breakdown**: Computes total fuel needed (Litres / kg), total cost (₹), and cost per kilometer.
- **CNG Green Savings Calculator**: Displays monetary savings and percentage discount over traditional Petrol/Diesel.
- **Interactive Trip Distance Simulator**: Slider to model trips from 10 km to 2,500 km with customizable vehicle mileage.
- **Daily Commute & Annual Savings Calculator**: Estimate annual budget savings by switching to CNG.

### 3. Live Indian Metro City Fuel Rates
- Reference rates for 15+ major cities (New Delhi, Mumbai, Bengaluru, Kolkata, Chennai, Hyderabad, Ahmedabad, Pune, Jaipur, Chandigarh, Lucknow, Surat, Bhopal, Patna, Kochi).
- 1-Click "Apply to Route" to directly load any city's fuel rate into the optimizer.

### 4. User Authentication & Guest Mode
- **Guest Mode by Default**: Direct access to all route planning, mapping, comparison, and rate features without requiring an account.
- **Sign In & Sign Up**: Account registration and session management saved securely in `localStorage`.
- **Animated Car Transition Screen**: Full-screen driving animation with road markings and status indicator upon logging in.
- **Trip Bookmarking**: Save optimized itineraries with full stop list, distance, and costs to user accounts.

### 5. About & Mission Page
- RouteWise mission overview, core value pillars, creator background, and interactive community feedback form.

---

## 🛠️ Technology Stack
- **Frontend**: HTML5, Modern CSS3 (Keyframe Animations, Variables, Responsive Grid), JavaScript (ES6+)
- **UI Frameworks**: Bootstrap 5, FontAwesome 6, Google Fonts (*Outfit* & *Inter*)
- **Mapping & GIS**: Leaflet.js, OpenStreetMap Tiles
- **Routing API**: OSRM (Open Source Routing Machine) Trip API
- **Data**: CSV-based Indian geographic dataset

---

## 💻 How to Run
Simply open `index.html` in any modern web browser or serve locally using any static web server:

```bash
# Example with Python:
python -m http.server 8000

# Example with Node.js:
npx serve .
```