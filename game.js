import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const MAP_W = 12, MAP_H = 10, MAP_SIZE = MAP_W * MAP_H;
const PREFIX = ["Neo","Iron","Crystal","Shadow","Lumina","Storm","Verdant","Obsidian","Star","Ember","Mist","Thunder","Sapphire","Gilded","Frost","Sunken","Aether","Black","Horizon","Pulse","Neon","Titan","Echo","Radiant","Silver","Copper","Azure","Crimson","Amber","Void"];
const SUFFIX = ["haven","prime","bay","forge","reach","gate","fall","hold","wood","mesa","coast","spire","reef","ridge","vale","canyon","isles","district","peak","port","grove","keep","marsh","dunes","plaza","core","nexus","heights","station","city"];
const cityName = i => `${PREFIX[i % PREFIX.length]} ${SUFFIX[Math.floor(i / PREFIX.length) % SUFFIX.length]} ${i + 1}`;

const BUILDINGS = {
  house:     { name: "Housing",     cost: 200,  desc: "+pop",           h: 1.2, c: 0x7dd3fc },
  apartment: { name: "Apartments",  cost: 900,  desc: "+lots of pop",   h: 3.2, c: 0x38bdf8 },
  factory:   { name: "Factory",     cost: 800,  desc: "+ind -happy",    h: 1.6, c: 0xf97316 },
  techpark:  { name: "Tech park",   cost: 2200, desc: "+ind +happy",    h: 2.4, c: 0x22d3ee },
  park:      { name: "Park",        cost: 400,  desc: "+happiness",     h: 0.35,c: 0x4ade80 },
  hospital:  { name: "Hospital",    cost: 1500, desc: "+happy +growth", h: 2.0, c: 0xfca5a5 },
  mall:      { name: "Mall",        cost: 1800, desc: "+money",         h: 1.4, c: 0xfbbf24 },
  airport:   { name: "Airport",     cost: 6000, desc: "+all income",    h: 0.8, c: 0xe2e8f0 },
  landmark:  { name: "Landmark",    cost: 2500, desc: "+prestige",      h: 5.0, c: 0xc084fc },
  lab:       { name: "Lab",         cost: 4000, desc: "+prestige $",    h: 2.8, c: 0xa78bfa },
};
const EVENTS = [
  { t: "Boom town!", msg: "Tourism +$4,000", money: 4000, kind: "good" },
  { t: "Strike", msg: "Happiness -8", happy: -8, kind: "bad" },
  { t: "Festival", msg: "Happiness +12", happy: 12, kind: "good" },
  { t: "Recession", msg: "Lose 8% cash", moneyPct: -0.08, kind: "bad" },
  { t: "Immigration", msg: "+80 pop", pop: 80, kind: "good" },
  { t: "Storm", msg: "Repairs $1,200", money: -1200, kind: "bad" },
  { t: "Tech grant", msg: "+1 prestige", prestige: 1, kind: "good" },
  { t: "Scandal", msg: "Happiness -15", happy: -15, kind: "bad" },
];

function emptyBuildings() {
  return Object.fromEntries(Object.keys(BUILDINGS).map(k => [k, 0]));
}
function makeCity(id, name, cell) {
  return {
    id, name, cell, pop: 40, happy: 58, industry: 6,
    buildings: Object.assign(emptyBuildings(), { house: 2, park: 1, factory: 1 }),
  };
}

let state = { money: 2500, prestige: 0, airports: 0, cities: [], current: 0, mapOwner: Array(MAP_SIZE).fill(-1) };

const canvas = document.getElementById("c");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07101c);
scene.fog = new THREE.Fog(0x07101c, 40, 90);

const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
camera.position.set(18, 22, 24);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2.15;
controls.target.set(0, 0, 0);

scene.add(new THREE.AmbientLight(0x6b7c99, 0.55));
const sun = new THREE.DirectionalLight(0xfff1d6, 1.35);
sun.position.set(20, 30, 12);
sun.castShadow = true;
scene.add(sun);
const rim = new THREE.DirectionalLight(0x38bdf8, 0.35);
rim.position.set(-15, 8, -10);
scene.add(rim);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(MAP_W * 2.2 + 8, MAP_H * 2.2 + 8),
  new THREE.MeshStandardMaterial({ color: 0x0b1728, roughness: 0.9 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const gridHelper = new THREE.GridHelper(MAP_W * 2.2, MAP_W, 0x1e3a5f, 0x132337);
gridHelper.position.y = 0.02;
scene.add(gridHelper);

function cellToWorld(cell) {
  const x = (cell % MAP_W) - MAP_W / 2 + 0.5;
  const z = Math.floor(cell / MAP_W) - MAP_H / 2 + 0.5;
  return new THREE.Vector3(x * 2.2, 0, z * 2.2);
}

const plotMeshes = [];
const cityGroups = [];
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const plotGeo = new THREE.BoxGeometry(1.9, 0.12, 1.9);

for (let i = 0; i < MAP_SIZE; i++) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x152238, roughness: 0.7 });
  const mesh = new THREE.Mesh(plotGeo, mat);
  const p = cellToWorld(i);
  mesh.position.set(p.x, 0.06, p.z);
  mesh.receiveShadow = true;
  mesh.userData.cell = i;
  scene.add(mesh);
  plotMeshes.push(mesh);
  const g = new THREE.Group();
  g.position.copy(p);
  scene.add(g);
  cityGroups.push(g);
}

const selectRing = new THREE.Mesh(
  new THREE.TorusGeometry(1.15, 0.06, 8, 32),
  new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
);
selectRing.rotation.x = -Math.PI / 2;
selectRing.position.y = 0.2;
scene.add(selectRing);

function rebuildCityVisual(city) {
  const g = cityGroups[city.cell];
  while (g.children.length) {
    const ch = g.children.pop();
    ch.geometry?.dispose();
    ch.material?.dispose();
  }
  let slot = 0;
  const keys = Object.keys(BUILDINGS);
  keys.forEach(k => {
    const n = city.buildings[k];
    const def = BUILDINGS[k];
    for (let i = 0; i < n; i++) {
      const h = def.h * (0.85 + (i % 3) * 0.12);
      const geo = new THREE.BoxGeometry(0.42, h, 0.42);
      const mat = new THREE.MeshStandardMaterial({
        color: def.c, roughness: 0.45, metalness: k === "landmark" ? 0.5 : 0.15,
        emissive: def.c, emissiveIntensity: 0.08,
      });
      const m = new THREE.Mesh(geo, mat);
      const col = slot % 4, row = Math.floor(slot / 4);
      m.position.set(-0.65 + col * 0.44, h / 2, -0.65 + row * 0.44);
      m.castShadow = true;
      g.add(m);
      slot++;
    }
  });
}

function refreshPlots() {
  for (let i = 0; i < MAP_SIZE; i++) {
    const owner = state.mapOwner[i];
    plotMeshes[i].material.color.setHex(owner >= 0 ? 0x164e63 : 0x152238);
  }
  const cur = state.cities[state.current];
  if (cur) {
    const p = cellToWorld(cur.cell);
    selectRing.position.x = p.x;
    selectRing.position.z = p.z;
    selectRing.visible = true;
  }
}

function cityIncome(c) {
  const mall = c.buildings.mall * 18;
  const tech = c.buildings.techpark * 12;
  const air = state.airports * 6;
  const lab = c.buildings.lab * 10;
  const base = c.pop * 0.7 + c.industry * 5 + mall + tech + air + lab;
  return base * (c.happy / 100) * (1 + state.prestige * 0.12);
}

function tick() {
  state.cities.forEach(c => {
    state.money += cityIncome(c) / 8;
    c.pop += 0.25 * c.buildings.house + 1.2 * c.buildings.apartment + 0.4 * c.buildings.hospital;
    c.happy += c.buildings.park * 0.35 + c.buildings.hospital * 0.25 + c.buildings.techpark * 0.15 - c.buildings.factory * 0.22;
    c.happy = Math.max(5, Math.min(100, c.happy));
    c.industry = 5 + c.buildings.factory * 8 + c.buildings.techpark * 14;
  });
  if (Math.random() < 0.04) fireEvent();
  document.getElementById("prestigeBtn").disabled = state.money < 15000 + state.prestige * 8000;
  updateUI();
}

function fireEvent() {
  const e = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  const c = state.cities[state.current];
  if (e.money) state.money = Math.max(0, state.money + e.money);
  if (e.moneyPct) state.money *= 1 + e.moneyPct;
  if (e.happy) c.happy = Math.max(5, Math.min(100, c.happy + e.happy));
  if (e.pop) c.pop += e.pop;
  if (e.prestige) state.prestige += e.prestige;
  const ban = document.getElementById("eventBanner");
  ban.className = "event-banner " + e.kind;
  ban.textContent = e.t + " — " + e.msg;
  setTimeout(() => ban.classList.add("hidden"), 5000);
}

function updateUI() {
  document.getElementById("money").textContent = "$" + Math.floor(state.money).toLocaleString();
  const pop = state.cities.reduce((s, c) => s + c.pop, 0);
  document.getElementById("pop").textContent = Math.floor(pop).toLocaleString();
  const cur = state.cities[state.current];
  document.getElementById("happy").textContent = Math.round(cur.happy) + "%";
  document.getElementById("industry").textContent = state.cities.reduce((s, c) => s + c.industry, 0);
  document.getElementById("prestige").textContent = state.prestige;
  document.getElementById("cityCount").textContent = state.cities.length + "/120";
  document.getElementById("cityList").innerHTML = state.cities.map((c, i) =>
    `<div class="city-card ${i === state.current ? "active" : ""}" data-i="${i}">
      ${c.name}<br><small>${Math.floor(c.pop)} pop · ${Math.round(c.happy)}%</small>
    </div>`).join("");
  document.getElementById("currentCityName").textContent = cur.name;
  document.getElementById("cityFlavor").textContent = `~$${Math.floor(cityIncome(cur))}/s · plot ${cur.cell}`;
  document.getElementById("buildings").innerHTML = Object.entries(cur.buildings)
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `<div class="building">${BUILDINGS[k].name} ×${n}</div>`).join("");
  document.getElementById("buildButtons").innerHTML = Object.entries(BUILDINGS).map(([k, b]) =>
    `<button data-build="${k}">${b.name}<br>$${b.cost.toLocaleString()} · ${b.desc}</button>`).join("");
  document.getElementById("newCityBtn").textContent =
    `Found nearest empty — $${(8000 + state.cities.length * 400).toLocaleString()}`;
  refreshPlots();
}

function foundAt(cell) {
  if (state.mapOwner[cell] >= 0) {
    state.current = state.mapOwner[cell];
    updateUI();
    return;
  }
  const cost = 8000 + state.cities.length * 400;
  if (state.money < cost || state.cities.length >= MAP_SIZE) return;
  state.money -= cost;
  const id = state.cities.length;
  const c = makeCity(id, cityName(id), cell);
  state.cities.push(c);
  state.mapOwner[cell] = id;
  state.current = id;
  rebuildCityVisual(c);
  updateUI();
}

function initNew() {
  const cell = 54;
  const c = makeCity(0, "Capital", cell);
  state.cities = [c];
  state.mapOwner = Array(MAP_SIZE).fill(-1);
  state.mapOwner[cell] = 0;
  state.current = 0;
  cityGroups.forEach(g => { while (g.children.length) g.remove(g.children[0]); });
  rebuildCityVisual(c);
}

document.getElementById("cityList").addEventListener("click", e => {
  const card = e.target.closest(".city-card");
  if (!card) return;
  state.current = +card.dataset.i;
  updateUI();
});
document.getElementById("buildButtons").addEventListener("click", e => {
  const btn = e.target.closest("[data-build]");
  if (!btn) return;
  const type = btn.dataset.build;
  const cost = BUILDINGS[type].cost;
  if (state.money < cost) return;
  state.money -= cost;
  const c = state.cities[state.current];
  c.buildings[type]++;
  if (type === "house") c.pop += 12;
  if (type === "apartment") c.pop += 45;
  if (type === "factory") { c.industry += 8; c.happy -= 3; }
  if (type === "park") c.happy += 7;
  if (type === "landmark" || type === "lab") state.prestige += 1;
  if (type === "airport") state.airports++;
  rebuildCityVisual(c);
  updateUI();
});
document.getElementById("newCityBtn").onclick = () => {
  const empty = state.mapOwner.findIndex(o => o < 0);
  if (empty >= 0) foundAt(empty);
};
document.getElementById("saveBtn").onclick = () => {
  localStorage.setItem("megacity3d", JSON.stringify(state));
  alert("Saved.");
};
document.getElementById("loadBtn").onclick = () => {
  const s = localStorage.getItem("megacity3d");
  if (!s) return;
  state = JSON.parse(s);
  cityGroups.forEach(g => { while (g.children.length) g.remove(g.children[0]); });
  state.cities.forEach(rebuildCityVisual);
  updateUI();
};
document.getElementById("prestigeBtn").onclick = () => {
  const need = 15000 + state.prestige * 8000;
  if (state.money < need) return;
  state.money -= need;
  state.prestige++;
  state.cities.forEach(c => { c.happy = Math.min(100, c.happy + 10); });
  updateUI();
};

canvas.addEventListener("pointerdown", e => {
  const r = canvas.getBoundingClientRect();
  pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(plotMeshes);
  if (hits[0]) foundAt(hits[0].object.userData.cell);
});

function resize() {
  const w = innerWidth, h = innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}
addEventListener("resize", resize);
resize();

const saved = localStorage.getItem("megacity3d");
if (saved) {
  state = JSON.parse(saved);
  state.cities.forEach(rebuildCityVisual);
} else initNew();

setInterval(tick, 1000);
updateUI();

(function loop() {
  requestAnimationFrame(loop);
  controls.update();
  selectRing.rotation.z += 0.01;
  renderer.render(scene, camera);
})();
