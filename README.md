# 🏙️ Metropolis Empire 3D

A browser-based city-building tycoon with **120 unique cities**, rendered in **true 3D**
with Three.js/WebGL, plus prestige progression, disasters, and a global leaderboard.
Pure HTML/CSS/JS — no build step required.

## Play it
Open `index.html` locally, or enable GitHub Pages on this repo.

## Controls
- 🎥 **Drag** to rotate the camera, **scroll** to zoom, **right-click-drag** to pan
- 🖱️ **Click a tile** to place the selected building (or bulldoze)
- Use the on-screen zoom/reset/auto-rotate buttons for cinematic views

## Features
- 120 procedurally named cities across 12 biomes, each with unique economic bonuses
- Real 3D city rendering: pyramid-roofed houses, glass office towers, factories with
  smokestacks, water towers, stadiums, power plants, monuments, and more
- Dynamic sun arc with real-time shadows tied to in-game day cycle
- 19 building types, living simulation (growth, jobs, power, water, happiness)
- 🌪️ Disasters: fires, earthquakes, floods, tornadoes, plagues, meteor strikes
  — mitigate with Fire Stations, Hospitals, or purchasable Insurance
- ✨ Prestige system: reset your empire for permanent income bonuses & unlock discounts
- 🌐 Global online leaderboard (via Firebase — free, ~5 min setup)
- Achievements, speed controls, autosave, export/import save codes

## Enabling the online leaderboard (optional, 5 minutes)
1. https://console.firebase.google.com → **Create project** (free)
2. **Build → Firestore Database → Create database** (start in test mode)
3. **Project settings (⚙️) → General → Add app → Web app** → copy the `firebaseConfig` object
4. Paste it into `FIREBASE_CONFIG` near the top of the `<script>` in `index.html`
5. Commit & push — your leaderboard is now live!

## License
MIT — do whatever you want with it.
