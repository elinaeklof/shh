<template>
<!-- Screens -->
<div class="screen" id="start-screen">
  <div class="screen-bottle">💧</div>
  <h1>THE GREAT<br>RAMLÖSA HEIST</h1>
  <div class="subtitle">OPERATION: BIRTHDAY BUBBLES — CLASSIFIED</div>
  <div class="instructions">
    Din familj har <span>gömt födelsedag-Ramlösan</span>.<br>
    Smyg dig fram. Distrahera vakter med <span>chipshacket</span>.<br>
    Öppna rätt kyl — eller möt <span>PAPPAS VREDE</span>.
  </div>
  <button class="screen-btn primary" @click="startGame">STARTA OPERATION</button>
</div>

<div class="screen" id="win-screen">
  <div class="screen-bottle" style="font-size:100px">🏆</div>
  <h1>OPERATION<br>SLUTFÖRD!</h1>
  <div class="subtitle">DU HITTADE RAMLÖSAN — GRATTIS!</div>
  <div class="score-display" id="win-score">POÄNG: 0</div>
  <button class="screen-btn primary" @click="startGame">SPELA IGEN</button>
</div>

<div class="screen" id="lose-screen">
  <div class="screen-bottle" style="font-size:80px">😤</div>
  <h1 style="color: var(--red)">DU KLARADE<br>INTE DET</h1>
  <div class="subtitle">PAPPA VANN DEN HÄR GÅNGEN</div>
  <button class="screen-btn primary" @click="startGame">FÖRSÖK IGEN</button>
</div>

<div class="screen" id="caught-screen">
  <div class="screen-bottle" style="font-size:80px; animation: none">😱</div>
  <h1>ÅTAGEN!</h1>
  <div class="subtitle" id="caught-reason">PAPPA SÅG DIG!</div>
  <div class="instructions">
    Intensiv jakt har startats.<br>
    Tre liv kvar att slösa...
  </div>
  <button class="screen-btn primary" @click="resumeAfterCaught">FORTSÄTT</button>
</div>

<!-- Game UI -->
<div id="canvas-container"></div>

<div id="noise"></div>
<div id="alert-indicator"></div>

<div id="hud">
  <div id="top-bar">
    <div>
      <div id="mission-title">RAMLÖSA HEIST</div>
      <div id="mission-sub">OPERATION: BIRTHDAY BUBBLES</div>
    </div>
    <div id="status-panel">
      <div id="stealth-bar-wrap">
        <span id="stealth-label">STEALTH</span>
        <div id="stealth-bar"><div id="stealth-fill"></div></div>
      </div>
      <div id="lives">❤️ ❤️ ❤️</div>
    </div>
  </div>
</div>

<div id="timer">00:00</div>

<div id="minimap">
  <div id="minimap-title">MINIMAP — HUSET</div>
  <canvas id="minimap-canvas" width="140" height="120"></canvas>
</div>

<div id="controls">
  <div><span class="ctrl-key">W A S D</span> Gå</div>
  <div><span class="ctrl-key">MUS</span> Sikta</div>
  <div><span class="ctrl-key">E</span> Interagera</div>
  <div><span class="ctrl-key">F</span> Kasta chips</div>
  <div><span class="ctrl-key">SHIFT</span> Smyg</div>
</div>

<div id="message-box" role="status"></div>
<div id="interact-prompt">
  <span class="key">[ E ]</span>
  <span id="interact-text">UNDERSÖK</span>
</div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';

// ============================================================
// GAME ENGINE
// ============================================================
let scene, camera, renderer, clock;
let gameState = 'menu'; // menu, playing, caught, win, lose
let keys = {};
let mouse = { x: 0, y: 0, locked: false };

// Game data
let player, guards = [], fridges = [], chips = [], particles = [];
let ramlosaFridge = null;
let lives = 3;
let stealthLevel = 100;
let chipsCount = 3;
let score = 0;
let gameTime = 0;
let alertFlash = 0;
let interactTarget = null;
let messageTimeout = null;
let yaw = 0, pitch = 0;
let playerVelocity = new THREE.Vector3();
let isChasing = false;
let chaseTimer = 0;

// House layout (rooms)
const HOUSE = {
  width: 30, depth: 28,
  rooms: [
    { name: 'Vardagsrum', x: -8, z: -6, w: 12, d: 10, color: 0x2a2040 },
    { name: 'Kök',        x:  6, z: -6, w: 10, d: 10, color: 0x1a3020 },
    { name: 'Matsal',     x: -8, z:  6, w: 12, d:  8, color: 0x301820 },
    { name: 'Hall',       x:  4, z:  6, w:  6, d:  8, color: 0x202030 },
    { name: 'Förråd',     x: 10, z:  6, w:  6, d:  8, color: 0x181828 },
  ]
};

const FRIDGE_DATA = [
  { id: 0, x: 9,  z: -9, label: 'Kylskåp A', isRamlosa: false, rotation: 0 },
  { id: 1, x: 13, z: -5, label: 'Kylskåp B', isRamlosa: false, rotation: Math.PI/2 },
  { id: 2, x: 12, z:  8, label: 'Förrådsfrys', isRamlosa: true,  rotation: 0 },
];

const GUARD_DATA = [
  { x: 0,  z: -5, name: 'Pappa', patrol: [{x:0,z:-5},{x:5,z:-5},{x:5,z:5},{x:0,z:5}], speed: 0.025, color: 0xe67e22 },
  { x: -5, z:  5, name: 'Mamma', patrol: [{x:-5,z:5},{x:-10,z:5},{x:-10,z:-8},{x:-5,z:-8}], speed: 0.02, color: 0x9b59b6 },
  { x: 10, z:  2, name: 'Syskon', patrol: [{x:10,z:2},{x:12,z:7},{x:10,z:10},{x:7,z:7}], speed: 0.035, color: 0xe74c3c },
];

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050d1a);
  scene.fog = new THREE.FogExp2(0x050d1a, 0.045);

  camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 100);
  camera.position.set(0, 1.6, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(window.devicePixelRatio);
  document.getElementById('canvas-container').appendChild(renderer.domElement);

  clock = new THREE.Clock();
  buildHouse();
  buildLights();
  buildFridges();
  buildGuards();
  buildDecorations();
  setupControls();
  window.addEventListener('resize', onResize);
  animate();
}

function buildHouse() {
  // Floor
  const floorGeo = new THREE.PlaneGeometry(40, 40);
  const floorMat = new THREE.MeshLambertMaterial({ color: 0x1a1520 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI/2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Ceiling
  const ceilGeo = new THREE.PlaneGeometry(40, 40);
  const ceilMat = new THREE.MeshLambertMaterial({ color: 0x0d1020 });
  const ceil = new THREE.Mesh(ceilGeo, ceilMat);
  ceil.rotation.x = Math.PI/2;
  ceil.position.y = 3;
  scene.add(ceil);

  // Rooms — walls as boxes
  HOUSE.rooms.forEach(r => {
    const wallMat = new THREE.MeshLambertMaterial({ color: r.color, side: THREE.BackSide });
    const roomGeo = new THREE.BoxGeometry(r.w, 3, r.d);
    const room = new THREE.Mesh(roomGeo, wallMat);
    room.position.set(r.x, 1.5, r.z);
    room.receiveShadow = true;
    scene.add(room);
  });

  // Exterior walls
  buildWall(-15, 1.5, 0, 0.3, 3, 30, 0x0d1520); // left
  buildWall(15,  1.5, 0, 0.3, 3, 30, 0x0d1520);  // right
  buildWall(0, 1.5, -14, 30, 3, 0.3, 0x0d1520); // front
  buildWall(0, 1.5,  14, 30, 3, 0.3, 0x0d1520); // back

  // Inner walls
  buildWall(1, 1.5, 0, 0.2, 3, 14, 0x141830);    // center vertical
  buildWall(-4, 1.5, 1, 8, 3, 0.2, 0x141830);    // center horizontal
  buildWall(9.5, 1.5, 2.5, 0.2, 3, 8, 0x141830); // right room
}

function buildWall(x, y, z, w, h, d, color) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshLambertMaterial({ color });
  const wall = new THREE.Mesh(geo, mat);
  wall.position.set(x, y, z);
  wall.castShadow = true;
  wall.receiveShadow = true;
  scene.add(wall);
}

function buildLights() {
  // Ambient
  const ambient = new THREE.AmbientLight(0x0d1530, 0.6);
  scene.add(ambient);

  // Room lights
  const lightPositions = [
    { x: -4, z: -6, color: 0x3050a0 },
    { x: 9,  z: -6, color: 0x305040 },
    { x: -4, z:  6, color: 0x602040 },
    { x: 7,  z:  8, color: 0x202060 },
  ];

  lightPositions.forEach(lp => {
    const light = new THREE.PointLight(lp.color, 1.5, 8);
    light.position.set(lp.x, 2.8, lp.z);
    light.castShadow = true;
    light.shadow.mapSize.set(256, 256);
    scene.add(light);

    // Lamp geometry
    const lampGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const lampMat = new THREE.MeshBasicMaterial({ color: lp.color });
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.set(lp.x, 2.85, lp.z);
    scene.add(lamp);
  });
}

function buildFridges() {
  FRIDGE_DATA.forEach(fd => {
    const group = new THREE.Group();
    group.position.set(fd.x, 0, fd.z);
    group.rotation.y = fd.rotation;

    // Body
    const bodyGeo = new THREE.BoxGeometry(0.8, 1.7, 0.6);
    const bodyMat = new THREE.MeshLambertMaterial({
      color: fd.isRamlosa ? 0x1a3a6e : 0x2a2a3a
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.85;
    body.castShadow = true;
    group.add(body);

    // Door
    const doorGeo = new THREE.BoxGeometry(0.76, 1.65, 0.05);
    const doorMat = new THREE.MeshLambertMaterial({
      color: fd.isRamlosa ? 0x1e4a8e : 0x303050
    });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 0.85, 0.33);
    group.add(door);

    // Handle
    const handleGeo = new THREE.BoxGeometry(0.06, 0.3, 0.06);
    const handleMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0.25, 0.85, 0.37);
    group.add(handle);

    // Ramlösa glow
    if (fd.isRamlosa) {
      const glowLight = new THREE.PointLight(0x4488ff, 0.8, 2);
      glowLight.position.set(0, 1, 0.5);
      group.add(glowLight);

      // Ramlösa label
      const labelGeo = new THREE.PlaneGeometry(0.5, 0.2);
      const labelMat = new THREE.MeshBasicMaterial({ color: 0x4488ff });
      const label = new THREE.Mesh(labelGeo, labelMat);
      label.position.set(0, 1.2, 0.36);
      group.add(label);
    }

    scene.add(group);
    fridges.push({ mesh: group, data: fd, open: false, light: null });
  });
}

function buildGuards() {
  GUARD_DATA.forEach((gd, i) => {
    const group = new THREE.Group();
    group.position.set(gd.x, 0, gd.z);

    // Body
    const bodyGeo = new THREE.CylinderGeometry(0.25, 0.3, 1.2, 8);
    const bodyMat = new THREE.MeshLambertMaterial({ color: gd.color });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.7;
    body.castShadow = true;
    group.add(body);

    // Head
    const headGeo = new THREE.SphereGeometry(0.22, 12, 12);
    const headMat = new THREE.MeshLambertMaterial({ color: 0xffcc99 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.55;
    group.add(head);

    // Eyes
    [-0.08, 0.08].forEach(ex => {
      const eyeGeo = new THREE.SphereGeometry(0.04, 6, 6);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(ex, 1.58, -0.18);
      group.add(eye);
    });

    // Vision cone (spotlight-ish)
    const coneGeo = new THREE.ConeGeometry(2, 4, 12, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xffee00,
      transparent: true,
      opacity: 0.06,
      side: THREE.DoubleSide
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.rotation.x = Math.PI;
    cone.position.set(0, 1.4, -2.5);
    group.add(cone);

    // Name tag
    scene.add(group);

    guards.push({
      mesh: group,
      data: gd,
      patrolIndex: 0,
      patrolT: 0,
      state: 'patrol', // patrol, alert, chase
      alertLevel: 0,
      velocity: new THREE.Vector3(),
      cone,
      lastPlayerPos: new THREE.Vector3()
    });
  });
}

function buildDecorations() {
  // Sofa
  buildBox(-2, 0.4, -10, 3, 0.8, 1.2, 0x4a2040);
  buildBox(-2, 0.75, -10.7, 3, 0.5, 0.2, 0x4a2040);

  // Table
  buildBox(5, 0.45, -4, 1.5, 0.05, 0.8, 0x3a2010);
  buildBox(4.4, 0.2, -4.4, 0.06, 0.4, 0.06, 0x2a1508);
  buildBox(5.6, 0.2, -4.4, 0.06, 0.4, 0.06, 0x2a1508);
  buildBox(4.4, 0.2, -3.6, 0.06, 0.4, 0.06, 0x2a1508);
  buildBox(5.6, 0.2, -3.6, 0.06, 0.4, 0.06, 0x2a1508);

  // TV
  buildBox(-9, 1.2, -11, 2.5, 1.4, 0.1, 0x111111);
  buildBox(-9, 1.2, -11, 2.3, 1.2, 0.05, 0x1a2a4a);

  // Chips bag on counter
  const chipsGeo = new THREE.BoxGeometry(0.2, 0.3, 0.1);
  const chipsMat = new THREE.MeshLambertMaterial({ color: 0xdd4422 });
  const chipsObj = new THREE.Mesh(chipsGeo, chipsMat);
  chipsObj.position.set(7, 1.15, -10);
  scene.add(chipsObj);

  // Kitchen counter
  buildBox(8, 0.55, -9, 3, 0.1, 1, 0x3a3020);
  buildBox(8, 0.25, -9, 3, 0.5, 0.9, 0x2a2215);
}

function buildBox(x, y, z, w, h, d, color) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshLambertMaterial({ color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

// ============================================================
// RAMLÖSA BOTTLE in 3D
// ============================================================
function createRamlosaBottle() {
  const group = new THREE.Group();

  // Bottle body
  const pts = [];
  pts.push(new THREE.Vector2(0, 0));
  pts.push(new THREE.Vector2(0.09, 0));
  pts.push(new THREE.Vector2(0.12, 0.08));
  pts.push(new THREE.Vector2(0.14, 0.2));
  pts.push(new THREE.Vector2(0.15, 0.4));
  pts.push(new THREE.Vector2(0.155, 0.6));
  pts.push(new THREE.Vector2(0.14, 0.75));
  pts.push(new THREE.Vector2(0.13, 0.85));
  pts.push(new THREE.Vector2(0.08, 0.9));
  pts.push(new THREE.Vector2(0.05, 0.95));
  pts.push(new THREE.Vector2(0.045, 1.0));
  pts.push(new THREE.Vector2(0, 1.0));

  const bottleGeo = new THREE.LatheGeometry(pts, 20);
  const bottleMat = new THREE.MeshPhongMaterial({
    color: 0xc8e0f0,
    transparent: true,
    opacity: 0.65,
    shininess: 150,
    specular: 0xffffff,
    side: THREE.DoubleSide
  });
  const bottle = new THREE.Mesh(bottleGeo, bottleMat);
  group.add(bottle);

  // Label
  const labelGeo = new THREE.CylinderGeometry(0.155, 0.155, 0.35, 20);
  const labelMat = new THREE.MeshLambertMaterial({ color: 0xf0f5fa });
  const label = new THREE.Mesh(labelGeo, labelMat);
  label.position.y = 0.5;
  group.add(label);

  // Blue stripe on label
  const stripeGeo = new THREE.CylinderGeometry(0.157, 0.157, 0.06, 20);
  const stripeMat = new THREE.MeshLambertMaterial({ color: 0x1a3a6e });
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  stripe.position.y = 0.38;
  group.add(stripe);

  const stripe2 = stripe.clone();
  stripe2.position.y = 0.65;
  group.add(stripe2);

  // Cap
  const capGeo = new THREE.CylinderGeometry(0.052, 0.052, 0.06, 12);
  const capMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.y = 1.03;
  group.add(cap);

  // Inner glow
  const glowGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.7, 12);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.2,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.y = 0.35;
  group.add(glow);

  // Glow light
  const light = new THREE.PointLight(0x4488ff, 1.5, 1.5);
  light.position.y = 0.5;
  group.add(light);

  return group;
}

// ============================================================
// PLAYER
// ============================================================
function spawnPlayer() {
  player = {
    pos: new THREE.Vector3(-5, 1.6, 0),
    speed: 0.05,
    sneaking: false,
    chipsLeft: 3,
    nearFridge: null
  };
  camera.position.copy(player.pos);
  yaw = 0; pitch = 0;
}

// ============================================================
// CONTROLS
// ============================================================
function setupControls() {
  document.addEventListener('keydown', e => { keys[e.code] = true; handleKeyPress(e); });
  document.addEventListener('keyup', e => { keys[e.code] = false; });

  renderer.domElement.addEventListener('click', () => {
    if (gameState === 'playing') renderer.domElement.requestPointerLock();
  });

  document.addEventListener('pointerlockchange', () => {
    mouse.locked = document.pointerLockElement === renderer.domElement;
  });

  document.addEventListener('mousemove', e => {
    if (!mouse.locked || gameState !== 'playing') return;
    yaw -= e.movementX * 0.002;
    pitch -= e.movementY * 0.002;
    pitch = Math.max(-0.4, Math.min(0.4, pitch));
  });
}

function handleKeyPress(e) {
  if (gameState !== 'playing') return;
  if (e.code === 'KeyE') interact();
  if (e.code === 'KeyF') throwChips();
}

// ============================================================
// GAME LOGIC
// ============================================================
function interact() {
  if (!interactTarget) return;
  const fridge = interactTarget;
  if (fridge.data.isRamlosa) {
    winGame();
  } else {
    // Wrong fridge — alert guards
    showMessage('😱 FEL KYL! En intensiv jakt startar!');
    loseLife('Fel kyl öppnad!');
  }
}

function throwChips() {
  if (player.chipsLeft <= 0) { showMessage('Inga chips kvar!'); return; }
  player.chipsLeft--;
  updateHUD();

  // Place chip distraction at camera forward direction
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const chipsPos = player.pos.clone().add(dir.multiplyScalar(4));
  chipsPos.y = 0;

  // Chip particle
  const chipGeo = new THREE.SphereGeometry(0.15, 6, 6);
  const chipMat = new THREE.MeshLambertMaterial({ color: 0xddaa22 });
  const chipMesh = new THREE.Mesh(chipGeo, chipMat);
  chipMesh.position.copy(chipsPos).add(new THREE.Vector3(0, 0.15, 0));
  scene.add(chipMesh);

  // Particle burst
  spawnParticles(chipsPos, 0xddaa22, 12);

  chips.push({ pos: chipsPos, mesh: chipMesh, timer: 8.0 });
  showMessage('🍟 CHIPS KASTAT! Vakter distraheras!');

  // Alert nearby guards to chips
  guards.forEach(g => {
    const dist = g.mesh.position.distanceTo(chipsPos);
    if (dist < 8) {
      g.state = 'distracted';
      g.distractTarget = chipsPos.clone();
      g.distractTimer = 6.0;
    }
  });
}

function spawnParticles(pos, color, count) {
  for (let i = 0; i < count; i++) {
    const geo = new THREE.SphereGeometry(0.04, 4, 4);
    const mat = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos).add(new THREE.Vector3(0, 0.2, 0));
    scene.add(mesh);
    particles.push({
      mesh,
      vel: new THREE.Vector3(
        (Math.random()-0.5)*0.08,
        Math.random()*0.06+0.02,
        (Math.random()-0.5)*0.08
      ),
      life: 1.0
    });
  }
}

function loseLife(reason) {
  lives--;
  updateHUD();
  if (lives <= 0) {
    showLoseScreen();
    return;
  }
  // Show caught screen
  document.getElementById('caught-reason').textContent = reason;
  document.getElementById('caught-screen').style.display = 'flex';
  gameState = 'caught';
  isChasing = false;
  guards.forEach(g => { g.state = 'patrol'; g.alertLevel = 0; });
  stealthLevel = 100;
  document.exitPointerLock();
}

function resumeAfterCaught() {
  document.getElementById('caught-screen').style.display = 'none';
  gameState = 'playing';
  player.pos.set(-5, 1.6, 0);
  camera.position.copy(player.pos);
  renderer.domElement.requestPointerLock();
}

function winGame() {
  gameState = 'win';
  score = Math.floor(stealthLevel * 100 + lives * 500 + Math.max(0, 300 - gameTime) * 10);
  document.getElementById('win-score').textContent = `POÄNG: ${score}`;
  document.getElementById('win-screen').style.display = 'flex';

  // Celebration particles
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      spawnParticles(player.pos.clone(), [0x4488ff, 0xffdd00, 0xff4488][i%3], 20);
    }, i*200);
  }
  document.exitPointerLock();
}

function showLoseScreen() {
  gameState = 'lose';
  document.getElementById('lose-screen').style.display = 'flex';
  document.exitPointerLock();
}

function showMessage(text, duration = 2500) {
  const box = document.getElementById('message-box');
  box.textContent = text;
  box.classList.add('visible');
  if (messageTimeout) clearTimeout(messageTimeout);
  messageTimeout = setTimeout(() => box.classList.remove('visible'), duration);
}

// ============================================================
// UPDATE
// ============================================================
function update(dt) {
  if (gameState !== 'playing') return;

  gameTime += dt;
  updatePlayer(dt);
  updateGuards(dt);
  updateChips(dt);
  updateParticles(dt);
  updateInteraction();
  updateHUD();
  updateMinimap();
  updateTimer();
}

function updatePlayer(dt) {
  const sneaking = keys['ShiftLeft'] || keys['ShiftRight'];
  player.sneaking = sneaking;
  const speed = sneaking ? 0.025 : 0.055;

  const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const right   = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

  const move = new THREE.Vector3();
  if (keys['KeyW'] || keys['ArrowUp'])    move.add(forward);
  if (keys['KeyS'] || keys['ArrowDown'])  move.sub(forward);
  if (keys['KeyA'] || keys['ArrowLeft'])  move.sub(right);
  if (keys['KeyD'] || keys['ArrowRight']) move.add(right);

  if (move.length() > 0) {
    move.normalize().multiplyScalar(speed);
    player.pos.add(move);
  }

  // Clamp to house
  player.pos.x = Math.max(-14, Math.min(14, player.pos.x));
  player.pos.z = Math.max(-13, Math.min(13, player.pos.z));

  camera.position.copy(player.pos);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
}

function updateGuards(dt) {
  let anyChasing = false;

  guards.forEach(g => {
    const guardPos = g.mesh.position;
    const playerPos = player.pos;
    const toPlayer = new THREE.Vector3().subVectors(playerPos, guardPos);
    toPlayer.y = 0;
    const distToPlayer = toPlayer.length();

    // Vision check
    const guardDir = new THREE.Vector3(
      -Math.sin(g.mesh.rotation.y), 0, -Math.cos(g.mesh.rotation.y)
    );
    const angleToPlayer = guardDir.angleTo(toPlayer.clone().normalize());
    const inFOV = angleToPlayer < 0.65 && distToPlayer < 5.5;
    const sneakBonus = player.sneaking ? 0.3 : 1;
    const moving = (keys['KeyW']||keys['KeyS']||keys['KeyA']||keys['KeyD']);

    if (inFOV && moving) {
      g.alertLevel = Math.min(100, g.alertLevel + dt * 60 * sneakBonus);
    } else if (g.state !== 'chase') {
      g.alertLevel = Math.max(0, g.alertLevel - dt * 20);
    }

    if (g.alertLevel >= 100 && g.state !== 'chase') {
      g.state = 'chase';
      showMessage(`😤 ${g.data.name} ser dig! Spring!`);
    }

    // Distracted by chips
    if (g.state === 'distracted') {
      g.distractTimer -= dt;
      if (g.distractTimer <= 0) {
        g.state = 'patrol';
        g.alertLevel = Math.max(0, g.alertLevel - 30);
      }
      // Walk toward chips
      const toChips = new THREE.Vector3().subVectors(g.distractTarget, guardPos);
      toChips.y = 0;
      if (toChips.length() > 0.3) {
        toChips.normalize().multiplyScalar(g.data.speed * 1.5);
        guardPos.add(toChips);
        g.mesh.rotation.y = Math.atan2(-toChips.x, -toChips.z);
      }
    } else if (g.state === 'chase') {
      anyChasing = true;
      const dir = toPlayer.clone().normalize().multiplyScalar(g.data.speed * 2.5);
      guardPos.add(dir);
      g.mesh.rotation.y = Math.atan2(-dir.x, -dir.z);

      if (distToPlayer < 0.8) {
        loseLife(`${g.data.name} fångade dig!`);
        g.state = 'patrol';
        g.alertLevel = 0;
      }
    } else {
      // Patrol
      const patrol = g.data.patrol;
      const target = patrol[g.patrolIndex];
      const targetVec = new THREE.Vector3(target.x, 0, target.z);
      const toTarget = new THREE.Vector3().subVectors(targetVec, guardPos);
      toTarget.y = 0;

      if (toTarget.length() < 0.3) {
        g.patrolIndex = (g.patrolIndex + 1) % patrol.length;
      } else {
        const step = toTarget.clone().normalize().multiplyScalar(g.data.speed);
        guardPos.add(step);
        g.mesh.rotation.y = Math.atan2(-step.x, -step.z);
      }
    }

    // Cone color based on alert
    const t = g.alertLevel / 100;
    g.cone.material.color.setRGB(1, 1 - t, 0);
    g.cone.material.opacity = 0.06 + t * 0.12;
  });

  isChasing = anyChasing;
  document.getElementById('alert-indicator').className = anyChasing ? 'chasing' : '';
}

function updateChips(dt) {
  chips = chips.filter(c => {
    c.timer -= dt;
    if (c.timer <= 0) {
      scene.remove(c.mesh);
      return false;
    }
    // Bobbing
    c.mesh.rotation.y += dt * 2;
    c.mesh.position.y = 0.15 + Math.sin(Date.now()*0.003)*0.05;
    return true;
  });
}

function updateParticles(dt) {
  particles = particles.filter(p => {
    p.life -= dt * 1.5;
    p.vel.y -= dt * 0.1;
    p.mesh.position.add(p.vel);
    p.mesh.material.opacity = p.life;
    if (p.life <= 0) { scene.remove(p.mesh); return false; }
    return true;
  });
}

function updateInteraction() {
  // Check proximity to fridges
  let nearest = null;
  let nearestDist = Infinity;

  fridges.forEach(f => {
    const dist = player.pos.distanceTo(f.mesh.position);
    if (dist < 1.8 && dist < nearestDist) {
      nearest = f;
      nearestDist = dist;
    }
  });

  interactTarget = nearest;
  const prompt = document.getElementById('interact-prompt');
  const interactText = document.getElementById('interact-text');

  if (nearest) {
    prompt.classList.add('visible');
    interactText.textContent = nearest.data.isRamlosa ? 'ÖPPNA KYL (kan vara rätt!)' : 'ÖPPNA KYL';
  } else {
    prompt.classList.remove('visible');
  }

  // Stealth
  const moving = (keys['KeyW']||keys['KeyS']||keys['KeyA']||keys['KeyD']);
  if (isChasing) {
    stealthLevel = Math.max(0, stealthLevel - 0.3);
  } else if (!moving) {
    stealthLevel = Math.min(100, stealthLevel + 0.2);
  }
}

function updateHUD() {
  const fill = document.getElementById('stealth-fill');
  fill.style.width = stealthLevel + '%';
  const green = Math.floor(stealthLevel * 2.04);
  fill.style.background = `rgb(${255-green}, ${green}, 0)`;

  const livesEl = document.getElementById('lives');
  livesEl.textContent = '❤️'.repeat(lives) + '🖤'.repeat(3-lives);

  document.getElementById('interact-prompt');
}

function updateTimer() {
  const m = Math.floor(gameTime / 60).toString().padStart(2,'0');
  const s = Math.floor(gameTime % 60).toString().padStart(2,'0');
  const t = document.getElementById('timer');
  t.textContent = `${m}:${s}`;
  t.className = gameTime > 180 ? 'urgent' : '';
}

function updateMinimap() {
  const canvas = document.getElementById('minimap-canvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 140, 120);

  const scale = 4.5;
  const ox = 70, oz = 60;

  // Rooms
  ctx.fillStyle = 'rgba(40,60,100,0.6)';
  HOUSE.rooms.forEach(r => {
    ctx.fillRect(ox + (r.x - r.w/2)*scale, oz + (r.z - r.d/2)*scale, r.w*scale, r.d*scale);
  });

  // Fridges
  fridges.forEach(f => {
    ctx.fillStyle = f.data.isRamlosa ? '#4488ff' : '#444466';
    const fx = ox + f.mesh.position.x * scale;
    const fz = oz + f.mesh.position.z * scale;
    ctx.fillRect(fx-3, fz-3, 6, 6);
  });

  // Chips
  chips.forEach(c => {
    ctx.fillStyle = '#ddaa22';
    ctx.beginPath();
    ctx.arc(ox + c.pos.x*scale, oz + c.pos.z*scale, 3, 0, Math.PI*2);
    ctx.fill();
  });

  // Guards
  guards.forEach(g => {
    const col = g.state === 'chase' ? '#ff3333' : g.alertLevel > 50 ? '#ffaa00' : '#ff8844';
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(ox + g.mesh.position.x*scale, oz + g.mesh.position.z*scale, 4, 0, Math.PI*2);
    ctx.fill();

    // FOV
    ctx.fillStyle = `rgba(255,220,0,${0.05 + g.alertLevel*0.001})`;
    ctx.beginPath();
    ctx.moveTo(ox + g.mesh.position.x*scale, oz + g.mesh.position.z*scale);
    const gy = g.mesh.rotation.y;
    ctx.arc(
      ox + g.mesh.position.x*scale, oz + g.mesh.position.z*scale,
      20, gy - 0.65, gy + 0.65
    );
    ctx.closePath();
    ctx.fill();
  });

  // Player
  ctx.fillStyle = '#00ffcc';
  ctx.beginPath();
  ctx.arc(ox + player.pos.x*scale, oz + player.pos.z*scale, 5, 0, Math.PI*2);
  ctx.fill();
  // Direction arrow
  ctx.strokeStyle = '#00ffcc';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(ox + player.pos.x*scale, oz + player.pos.z*scale);
  ctx.lineTo(
    ox + player.pos.x*scale - Math.sin(yaw)*10,
    oz + player.pos.z*scale - Math.cos(yaw)*10
  );
  ctx.stroke();
}

// ============================================================
// ANIMATE
// ============================================================
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  // Animate bottles in fridges
  fridges.forEach((f, i) => {
    if (f.data.isRamlosa) {
      // Pulsing glow already done via PointLight
    }
    f.mesh.position.y = 0;
  });

  // Animate guard legs (bobbing)
  guards.forEach(g => {
    const t = Date.now() * 0.005;
    g.mesh.position.y = Math.abs(Math.sin(t * (g.state === 'chase' ? 3 : 1.5))) * 0.05;
  });

  update(dt);
  renderer.render(scene, camera);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ============================================================
// START / RESET
// ============================================================
function startGame() {
  // Hide all screens
  ['start-screen','win-screen','lose-screen','caught-screen'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });

  // Reset state
  lives = 3;
  stealthLevel = 100;
  gameTime = 0;
  score = 0;
  isChasing = false;
  chips = [];
  particles.forEach(p => scene.remove(p.mesh));
  particles = [];

  // Reset guards
  guards.forEach((g, i) => {
    g.mesh.position.set(GUARD_DATA[i].x, 0, GUARD_DATA[i].z);
    g.state = 'patrol';
    g.alertLevel = 0;
    g.patrolIndex = 0;
  });

  spawnPlayer();
  gameState = 'playing';

  showMessage('🔍 Hitta RAMLÖSAN — använd E vid kylskåp. F kastar chips för att distrahera!', 4000);

  // Request pointer lock
  setTimeout(() => renderer.domElement.requestPointerLock(), 100);
}

// Init Three.js is handled by Vue onMounted().

onMounted(() => {
  init();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
  document.exitPointerLock?.();
  if (renderer) {
    renderer.dispose();
    renderer.domElement?.remove();
  }
});

</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');

  :root {
    --navy: #0a1628;
    --blue: #1a3a6e;
    --silver: #c8d8e8;
    --white: #f0f5fa;
    --red: #e63946;
    --gold: #f4d03f;
    --green: #2ecc71;
    --dark: #050d1a;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    background: var(--dark);
    font-family: 'Space Mono', monospace;
    color: var(--white);
    overflow: hidden;
    height: 100vh;
    width: 100vw;
  }

  #canvas-container {
    position: fixed;
    inset: 0;
  }

  canvas { display: block; }

  /* HUD */
  #hud {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 10;
  }

  #top-bar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 20px 24px;
  }

  #mission-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 28px;
    letter-spacing: 4px;
    color: var(--silver);
    text-shadow: 0 0 20px rgba(200,216,232,0.5);
    line-height: 1;
  }

  #mission-sub {
    font-size: 10px;
    color: rgba(200,216,232,0.5);
    letter-spacing: 2px;
    margin-top: 4px;
  }

  #status-panel {
    text-align: right;
  }

  #stealth-bar-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    justify-content: flex-end;
    margin-bottom: 8px;
  }

  #stealth-label {
    font-size: 9px;
    letter-spacing: 2px;
    color: var(--silver);
    opacity: 0.7;
  }

  #stealth-bar {
    width: 120px;
    height: 6px;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(200,216,232,0.3);
    border-radius: 3px;
    overflow: hidden;
  }

  #stealth-fill {
    height: 100%;
    width: 100%;
    background: linear-gradient(90deg, var(--green), #a8ff78);
    border-radius: 3px;
    transition: width 0.3s, background 0.3s;
  }

  #lives {
    font-size: 18px;
    letter-spacing: 3px;
  }

  /* Minimap */
  #minimap {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 140px;
    height: 140px;
    background: rgba(5,13,26,0.85);
    border: 1px solid rgba(200,216,232,0.2);
    border-radius: 4px;
    pointer-events: none;
    z-index: 10;
    overflow: hidden;
  }

  #minimap-title {
    font-size: 7px;
    letter-spacing: 2px;
    color: rgba(200,216,232,0.4);
    padding: 4px 6px;
    border-bottom: 1px solid rgba(200,216,232,0.1);
  }

  #minimap canvas {
    display: block;
  }

  /* Message overlay */
  #message-box {
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(5,13,26,0.9);
    border: 1px solid rgba(200,216,232,0.3);
    border-left: 3px solid var(--silver);
    padding: 12px 20px;
    font-size: 11px;
    letter-spacing: 1px;
    color: var(--silver);
    max-width: 400px;
    text-align: center;
    pointer-events: none;
    z-index: 20;
    opacity: 0;
    transition: opacity 0.3s;
  }

  #message-box.visible { opacity: 1; }

  /* Alert indicator */
  #alert-indicator {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 5;
    border: 4px solid transparent;
    transition: border-color 0.2s, background 0.2s;
  }

  #alert-indicator.chasing {
    border-color: var(--red);
    animation: alertPulse 0.4s infinite alternate;
    background: rgba(230,57,70,0.05);
  }

  @keyframes alertPulse {
    from { border-color: var(--red); }
    to { border-color: transparent; }
  }

  /* Controls */
  #controls {
    position: fixed;
    bottom: 24px;
    left: 24px;
    font-size: 9px;
    letter-spacing: 1.5px;
    color: rgba(200,216,232,0.4);
    line-height: 2;
    pointer-events: none;
    z-index: 10;
  }

  .ctrl-key {
    display: inline-block;
    background: rgba(200,216,232,0.1);
    border: 1px solid rgba(200,216,232,0.2);
    padding: 1px 5px;
    border-radius: 2px;
    font-size: 8px;
    margin-right: 4px;
  }

  /* Screens */
  .screen {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 100;
    background: radial-gradient(ellipse at center, rgba(26,58,110,0.95) 0%, rgba(5,13,26,0.98) 70%);
  }

  .screen-bottle {
    font-size: 80px;
    margin-bottom: 16px;
    filter: drop-shadow(0 0 30px rgba(200,216,232,0.6));
    animation: float 3s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-12px); }
  }

  .screen h1 {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 64px;
    letter-spacing: 8px;
    color: var(--silver);
    text-shadow: 0 0 40px rgba(200,216,232,0.4);
    line-height: 1;
    text-align: center;
  }

  .screen .subtitle {
    font-size: 10px;
    letter-spacing: 4px;
    color: rgba(200,216,232,0.5);
    margin: 10px 0 40px;
    text-align: center;
  }

  .screen-btn {
    background: transparent;
    border: 1px solid rgba(200,216,232,0.5);
    color: var(--silver);
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    letter-spacing: 3px;
    padding: 14px 40px;
    cursor: pointer;
    text-transform: uppercase;
    transition: all 0.2s;
    pointer-events: all;
    margin: 6px;
  }

  .screen-btn:hover {
    background: rgba(200,216,232,0.1);
    border-color: var(--silver);
    box-shadow: 0 0 20px rgba(200,216,232,0.2);
  }

  .screen-btn.primary {
    background: var(--blue);
    border-color: var(--silver);
  }

  .instructions {
    margin: 24px 0;
    text-align: center;
    font-size: 10px;
    letter-spacing: 1.5px;
    color: rgba(200,216,232,0.5);
    line-height: 2.2;
    max-width: 380px;
  }

  .instructions span {
    color: var(--silver);
  }

  #win-screen, #lose-screen, #caught-screen { display: none; }

  #caught-screen h1 { color: var(--red); font-size: 52px; }
  #win-screen h1 { color: var(--gold); }

  .score-display {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 36px;
    color: var(--gold);
    letter-spacing: 4px;
    margin: 10px 0;
  }

  /* Interaction prompt */
  #interact-prompt {
    position: fixed;
    bottom: 180px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 10px;
    letter-spacing: 2px;
    color: var(--gold);
    pointer-events: none;
    z-index: 15;
    opacity: 0;
    transition: opacity 0.3s;
    text-align: center;
  }

  #interact-prompt.visible { opacity: 1; }
  #interact-prompt .key { font-size: 14px; display: block; margin-bottom: 4px; }

  /* Noise overlay */
  #noise {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 50;
    opacity: 0.025;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 200px;
  }

  /* Timer */
  #timer {
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    font-family: 'Bebas Neue', sans-serif;
    font-size: 22px;
    letter-spacing: 4px;
    color: rgba(200,216,232,0.3);
    pointer-events: none;
    z-index: 10;
  }

  #timer.urgent { color: var(--red); animation: blink 0.5s infinite alternate; }
  @keyframes blink { from { opacity: 1; } to { opacity: 0.3; } }
</style>
