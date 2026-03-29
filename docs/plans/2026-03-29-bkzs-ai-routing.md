# BKZS & AI Satellite Routing Implementation Plan

**Goal:** Integrate a simulated local satellite data layer with AI-powered image analysis (detecting road collapses, floods, and debris) into the existing BKZS routing system to plot the safest paths for rescue teams.

**Architecture:** 
- A backend module `satellite_service` simulating AI vision requests on bounding boxes.
- A new backend endpoint `/api/satellite/scan`.
- Frontend integration for triggering "AI Scans" before calculating the final route.
- Map integration to show the detected anomalies as red polygons.

**Tech Stack:** FastAPI, Python, React, Vite, CSS.

---

### Task 1: Create Satellite Data Models and Service
Files:
- Create: `backend/models/satellite_models.py`
- Create: `backend/services/satellite_service.py`
- Test: `backend/tests/test_satellite.py`

- [ ] Step 1: Write Pydantic models `Anomaly` (lat, lon, width, type, danger_score).
- [ ] Step 2: Write `scan_area(start_box, end_box)` in `satellite_service.py` that returns mocked `[Anomaly]` data.

### Task 2: Create Satellite FastAPI Router
Files:
- Create: `backend/routers/satellite.py`
- Modify: `backend/main.py`

- [ ] Step 1: Add `@router.post("/scan")` in `satellite.py` calling `scan_area`.
- [ ] Step 2: Include `satellite.py` router inside `main.py`.

### Task 3: Integrate AI Scan into Frontend Routing
Files:
- Modify: `frontend/src/utils/routing.js`
- Modify: `frontend/src/services/api.js`

- [ ] Step 1: Add `fetchAIScan(from, to)` inside `api.js`.
- [ ] Step 2: Inside `getAllRoutes` (`routing.js`), trigger `fetchAIScan` before OpenRouteService calls.
- [ ] Step 3: Parse AI anomalies into polygon strings and pass them as `avoid_polygons` to OpenRouteService API.

### Task 4: UI Updates (Command Center)
Files:
- Modify: `frontend/src/components/Sidebar.jsx`
- Modify: `frontend/src/components/MapComponent.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] Step 1: Add high-tech UI toggle for 'BKZS AI Tarama' inside `Sidebar.jsx`.
- [ ] Step 2: Pass `anomalies` state from `App.jsx` down to `MapComponent.jsx`.
- [ ] Step 3: Draw `Rectangle` components on `MapComponent.jsx` for every parsed AI anomaly, styled with an animated red pulse.
