<template>
  <div class="block-escape-game" ref="gameRoot">

    <!-- START SCREEN -->
    <div id="start-screen" v-if="showStartScreen">
      <div class="pixel-title">⛏️ BLOCK ESCAPE ⛏️<br>Gruvans Hemlighet</div>
      <div class="pixel-sub">Du vaknar i mörkret.<br>Gruvan kallar.</div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center">
        <button class="pixel-btn gold" @click="startGame(false)">▶ SPELA (Timer)</button>
        <button class="pixel-btn" @click="startGame(true)">🧘 LUGNT LÄGE</button>
      </div>
      <div style="font-family:'VT323';font-size:16px;color:#555;text-align:center;max-width:340px;line-height:1.6">
        WASD / Pilar = Gå &nbsp;|&nbsp; Mus = Sikta<br>
        E = Interagera &nbsp;|&nbsp; ESC = Stäng
      </div>
    </div>

    <!-- GAME CANVAS -->
    <canvas ref="gameCanvas" id="game-canvas"></canvas>
    <canvas ref="particleCanvasRef" id="particles"></canvas>
    <div class="bg-scan"></div>

    <div id="crosshair"></div>
    <div class="lava-glow"></div>

    <div id="hud-top" v-if="!showStartScreen">
      <div id="room-name">{{ currentRoomName }}</div>
      <div id="timer-display" :class="{ safe: relaxMode }">
        {{ relaxMode ? '∞' : timerDisplay }}
      </div>
    </div>

    <div id="minimap" v-if="!showStartScreen">
      <canvas ref="mmCanvasRef" id="mm-canvas" width="110" height="95"></canvas>
      <div id="minimap-label">KARTA</div>
    </div>

    <div id="room-progress" v-if="!showStartScreen">
      <div
        v-for="(name, i) in roomNames"
        :key="i"
        class="rpip"
        :class="{ done: i < currentRoom, current: i === currentRoom }"
        :title="name"
      ></div>
    </div>

    <div id="hotbar" v-if="!showStartScreen">
      <div
        v-for="(item, i) in hotbarItems"
        :key="item.id"
        class="hotbar-slot"
        :class="{ active: i === 0 }"
        :id="'slot-' + item.id"
      >
        {{ item.emoji }}
        <div class="slot-label">{{ item.label }}</div>
      </div>
    </div>

    <div id="interact-prompt" :class="{ show: !!nearestLabel }">
      {{ nearestLabel }}
    </div>

    <div id="msg-log">
      <div v-for="msg in messages" :key="msg.id" class="msg-item">{{ msg.text }}</div>
    </div>

    <div class="room-transition" :class="{ active: transitioning }"></div>

    <!-- MODAL -->
    <div id="modal-overlay" :class="{ open: modalOpen }">
      <div id="modal-box">
        <button class="modal-close" @click="closeModal">✕</button>
        <div id="modal-content" v-html="modalContent"></div>
      </div>
    </div>

    <!-- END SCREEN -->
    <div id="end-screen" :class="{ show: showEndScreen }">
      <div id="end-title" v-html="endTitle"></div>
      <p id="end-msg" v-html="endMsg"></p>
      <button class="pixel-btn gold" @click="reloadGame">🔄 SPELA IGEN</button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';

// ── Vue reactive state ─────────────────────────────────────
const gameRoot         = ref(null);
const gameCanvas       = ref(null);
const particleCanvasRef= ref(null);
const mmCanvasRef      = ref(null);

const showStartScreen  = ref(true);
const showEndScreen    = ref(false);
const endTitle         = ref('');
const endMsg           = ref('');
const modalOpen        = ref(false);
const modalContent     = ref('');
const transitioning    = ref(false);
const nearestLabel     = ref('');
const relaxMode        = ref(false);
const timerDisplay     = ref('10:00');
const currentRoom      = ref(0);
const currentRoomName  = ref('GRUVANS HEMLIGHET');
const messages         = ref([]);
let   msgIdCounter     = 0;

const roomNames = ['Fackelrummet','Redstone-Labyrinten','Gruvschaktet','Kistgåtan','Spegelrummet','Bossrummet'];

const hotbarItems = [
  { id:'pickaxe', emoji:'⛏️', label:'Picka'   },
  { id:'torch',   emoji:'🔦', label:'Fackla'  },
  { id:'key',     emoji:'🗝️', label:'Nyckel'  },
  { id:'redstone',emoji:'⚡', label:'Redstone'},
];

// ── Engine state (non-reactive) ────────────────────────────
let scene, camera, renderer, clock;
let gameActive   = false;
let timerSeconds = 0;
let timerMax     = 600;
let rafId        = null;

let player = { pos: new THREE.Vector3(0,1.7,0), yaw:0, pitch:0 };
let keys   = {};
let mouseLocked  = false;

let inventory    = { torch:0, key:false, pickaxe:'wood', redstone:false };
let interactables = [];
let nearestInteractable = null;
let particleCtx, particleCanvas;
let particles2d = [];
let roomCompleted = [false,false,false,false,false,false];
let roomObjects   = [];
let tickAcc       = 0;

// ── LIFECYCLE ──────────────────────────────────────────────
onMounted(() => {
  // Event listeners that don't need Three yet
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup',   e => { keys[e.code] = false; });
});

onBeforeUnmount(() => {
  gameActive = false;
  if (rafId) cancelAnimationFrame(rafId);
  try { document.exitPointerLock?.(); } catch (_) {}
  try { renderer?.dispose?.(); }        catch (_) {}
  window.removeEventListener('keydown', onKeyDown);
});

// ── START ──────────────────────────────────────────────────
function startGame(relax) {
  relaxMode.value = relax;
  showStartScreen.value = false;

  // Wait one tick so canvas is visible in the DOM
  setTimeout(() => {
    initThree();
    loadRoom(0);
    if (!relax) { timerSeconds = timerMax; }
    gameActive = true;
    animate();
    showMsg('💬 Facklornas ljus leder vägen...');
  }, 50);
}

// ── THREE INIT ─────────────────────────────────────────────
function initThree() {
  const canvas = gameCanvas.value;

  renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050510);
  scene.fog = new THREE.FogExp2(0x050510, 0.04);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 80);
  camera.position.copy(player.pos);
  clock = new THREE.Clock();

  particleCanvas = particleCanvasRef.value;
  particleCtx    = particleCanvas.getContext('2d');
  particleCanvas.width  = window.innerWidth;
  particleCanvas.height = window.innerHeight;

  window.addEventListener('resize', onResize);
  canvas.addEventListener('click', () => canvas.requestPointerLock());
  document.addEventListener('pointerlockchange', () => {
    mouseLocked = document.pointerLockElement === canvas;
  });
  document.addEventListener('mousemove', onMouseMove);
}

function onResize() {
  if (!renderer) return;
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  if (particleCanvas) {
    particleCanvas.width  = window.innerWidth;
    particleCanvas.height = window.innerHeight;
  }
}

function onMouseMove(e) {
  if (!mouseLocked || !gameActive) return;
  player.yaw   -= e.movementX * 0.002;
  player.pitch -= e.movementY * 0.002;
  player.pitch  = Math.max(-1.2, Math.min(1.2, player.pitch));
}

function onKeyDown(e) {
  keys[e.code] = true;
  if (!gameActive) return;
  if (e.code === 'KeyE' && nearestInteractable) nearestInteractable.callback();
  if (e.code === 'Escape') {
    if (modalOpen.value) closeModal();
    else document.exitPointerLock();
  }
}

// ── BLOCK TEXTURE FACTORY ──────────────────────────────────
function makeBlockTex(c1, c2, c3) {
  const size = 64;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const cx = cv.getContext('2d');
  cx.fillStyle = c1; cx.fillRect(0,0,size,size);
  cx.fillStyle = c2;
  for (let i=0;i<20;i++) cx.fillRect(Math.random()*size|0,Math.random()*size|0,(4+Math.random()*12)|0,(4+Math.random()*12)|0);
  cx.fillStyle = c3;
  for (let i=0;i<8;i++)  cx.fillRect(Math.random()*size|0,Math.random()*size|0,(2+Math.random()*6)|0,(2+Math.random()*6)|0);
  cx.strokeStyle='rgba(0,0,0,0.2)'; cx.lineWidth=0.5;
  for (let i=0;i<size;i+=8){ cx.beginPath();cx.moveTo(i,0);cx.lineTo(i,size);cx.stroke(); }
  for (let j=0;j<size;j+=8){ cx.beginPath();cx.moveTo(0,j);cx.lineTo(size,j);cx.stroke(); }
  const tex = new THREE.CanvasTexture(cv);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
}

// Lazily created so Three is available
let TEXTURES = null;
function getTex(name) {
  if (!TEXTURES) {
    TEXTURES = {
      stone:     makeBlockTex('#777','#888','#666'),
      dirt:      makeBlockTex('#5C3A1E','#6B4423','#4a2e14'),
      wood:      makeBlockTex('#6B4E24','#7a5a2a','#5c3f1a'),
      planks:    makeBlockTex('#9a7a42','#aa8a52','#8a6a32'),
      cobble:    makeBlockTex('#666','#777','#555'),
      obsidian:  makeBlockTex('#1a0a2a','#2a1a3a','#0a0010'),
      diamond:   makeBlockTex('#00bfbf','#00e5e5','#009999'),
      gold:      makeBlockTex('#ffd700','#ffe044','#ccac00'),
      emerald:   makeBlockTex('#00aa44','#00cc55','#008833'),
      redstone:  makeBlockTex('#440000','#660000','#330000'),
      bookshelf: makeBlockTex('#8B6914','#9a7a2a','#7a5a0a'),
      mossy:     makeBlockTex('#445533','#556644','#334422'),
    };
  }
  return TEXTURES[name] ?? TEXTURES.stone;
}

// ── SCENE HELPERS ──────────────────────────────────────────
function makeBlock(type,x,y,z,sx=1,sy=1,sz=1) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(sx,sy,sz),
    new THREE.MeshLambertMaterial({ map: getTex(type) })
  );
  mesh.position.set(x,y,z);
  mesh.castShadow = mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function addObj(o)               { roomObjects.push(o); return o; }
function addMesh(t,x,y,z,sx,sy,sz){ return addObj(makeBlock(t,x,y,z,sx,sy,sz)); }

function addLight(color,intensity,x,y,z,range=6) {
  const l = new THREE.PointLight(color,intensity,range);
  l.position.set(x,y,z);
  scene.add(l);
  return l;
}

function makeGlowBlock(color,x,y,z) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.5,0.5,0.5),
    new THREE.MeshBasicMaterial({ color })
  );
  mesh.position.set(x,y,z);
  scene.add(mesh);
  addObj(mesh);
  addObj(addLight(color,1.5,x,y,z,5));
  return mesh;
}

function makeTorch(x,y,z) {
  const stick = new THREE.Mesh(
    new THREE.BoxGeometry(0.08,0.4,0.08),
    new THREE.MeshLambertMaterial({ color:0x8B4513 })
  );
  stick.position.set(x,y,z); scene.add(stick); addObj(stick);
  const flame = new THREE.Mesh(
    new THREE.BoxGeometry(0.12,0.12,0.12),
    new THREE.MeshBasicMaterial({ color:0xff8c00 })
  );
  flame.position.set(x,y+0.26,z); scene.add(flame); addObj(flame);
  addObj(addLight(0xff8c00,1.2,x,y+0.3,z,4));
}

function buildFloor(x0,z0,x1,z1,type='stone',y=0) {
  for (let x=x0;x<x1;x++) for (let z=z0;z<z1;z++) addMesh(type,x+0.5,y,z+0.5);
}
function buildWalls(x0,z0,x1,z1,h,type='stone') {
  for (let x=x0;x<=x1;x++) for (let y=0;y<h;y++) { addMesh(type,x,y+0.5,z0); addMesh(type,x,y+0.5,z1); }
  for (let z=z0+1;z<z1;z++) for (let y=0;y<h;y++) { addMesh(type,x0,y+0.5,z); addMesh(type,x1,y+0.5,z); }
}
function buildCeiling(x0,z0,x1,z1,h,type='stone') {
  for (let x=x0;x<=x1;x++) for (let z=z0;z<=z1;z++) addMesh(type,x,h+0.5,z);
}

function addInteractable(x,y,z,radius,label,callback) {
  interactables.push({ pos: new THREE.Vector3(x,y,z), radius, label, callback });
}

// ── CLEAR ROOM ─────────────────────────────────────────────
function clearRoom() {
  roomObjects.forEach(o => scene.remove(o));
  roomObjects   = [];
  interactables = [];
  scene.children
    .filter(c => c.isLight && !c.isAmbientLight)
    .forEach(l => scene.remove(l));
}

// ══════════════════════════════════════════════════════════
// ROOM 0 — FACKELRUMMET
// ══════════════════════════════════════════════════════════
function buildTorchRoom() {
  clearRoom();
  player.pos.set(4,1.7,4); player.yaw = 0;
  addObj(scene.add(new THREE.AmbientLight(0x1a0a00,0.8)) ?? new THREE.AmbientLight(0x1a0a00,0.8));
  // Simpler: just add ambient directly
  const amb = new THREE.AmbientLight(0x1a0a00,0.8); scene.add(amb); addObj(amb);
  scene.fog = new THREE.FogExp2(0x0a0500,0.045);

  buildFloor(0,0,8,8,'cobble');
  buildWalls(0,0,8,8,4,'stone');
  buildCeiling(0,0,8,8,4,'stone');

  for (let x=3;x<6;x++) makeGlowBlock(0xff4500,x,0,8.4);

  // Torch positions: NÖ=0, NV=1, SÖ=2, SV=3, MITTEN=4
  //   NV(1)          NÖ(0)
  //        MITTEN(4)
  //   SV(3)          SÖ(2)
  const torchPos = [
    [6.5,1.2,1.5], // 0 NÖ
    [1.5,1.2,1.5], // 1 NV
    [6.5,1.2,6.5], // 2 SÖ
    [1.5,1.2,6.5], // 3 SV
    [4,  1.2,4  ], // 4 MITTEN
  ];
  // Correct order: NÖ(0) → NV(1) → SÖ(2) → SV(3) → MITTEN(4)
  const correctOrder = [0,1,2,3,4];
  let torchLit  = [false,false,false,false,false];
  let litOrder  = [];

  torchPos.forEach(([x,y,z],i) => {
    const stick = new THREE.Mesh(
      new THREE.BoxGeometry(0.1,0.5,0.1),
      new THREE.MeshLambertMaterial({ color:0x8B4513 })
    );
    stick.position.set(x,y,z); scene.add(stick); addObj(stick);

    addInteractable(x,y,z,1.5,`E - Tänd fackla ${i+1}`, () => {
      if (torchLit[i]) { showMsg('🔥 Redan tänd!'); return; }
      torchLit[i] = true;
      litOrder.push(i);

      const flame = new THREE.Mesh(
        new THREE.BoxGeometry(0.15,0.15,0.15),
        new THREE.MeshBasicMaterial({ color:0xff8c00 })
      );
      flame.position.set(x,y+0.35,z); scene.add(flame); addObj(flame);
      const fl = addLight(0xff8c00,1.5,x,y+0.4,z,5); addObj(fl);

      showMsg(`🔥 Fackla ${i+1} tänd! (${litOrder.length}/5)`);

      if (litOrder.length === 5) {
        const ok = litOrder.every((v,idx) => v === correctOrder[idx]);
        if (ok) {
          setTimeout(() => { showMsg('✅ Rätt ordning! Dörren öppnas!'); completeRoom(); }, 600);
        } else {
          setTimeout(() => {
            showMsg('❌ Fel ordning! Facklorna slocknar...');
            torchLit = [false,false,false,false,false];
            litOrder  = [];
            // Remove only the dynamically added flames/lights for this room
            scene.children
              .filter(c => c.isMesh && c.material?.color?.getHex?.() === 0xff8c00)
              .forEach(m => scene.remove(m));
            scene.children
              .filter(c => c.isPointLight && c.color?.getHex?.() === 0xff8c00)
              .forEach(l => scene.remove(l));
          }, 800);
        }
      }
    });
  });

  // Clue sign
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(2,1,0.1),
    new THREE.MeshLambertMaterial({ color:0x6B4423 })
  );
  sign.position.set(4,2.5,0.6); scene.add(sign); addObj(sign);
  addInteractable(4,2.5,0.6,2,'E - Läs skylt', () => {
    openModal('📜 Skyltens Budskap',`
      <div style="font-family:'VT323';font-size:22px;color:#ffd700;line-height:2;text-align:center">
        "Tänd i väderstreckens ordning:<br>
        <span style="color:#aaffaa">NordÖst → NordVäst</span><br>
        <span style="color:#aaffaa">→ SydÖst → SydVäst</span><br>
        → Mittens hjärta sist."
      </div>
      <div style="font-size:14px;color:#888;margin-top:12px;text-align:center;font-family:'VT323'">
        Ordning: Fackla 1 → 2 → 3 → 4 → 5
      </div>
    `);
  });

  // Locked exit
  for (let y=0;y<4;y++) addMesh('obsidian',8,y+0.5,4);
  addInteractable(8,1.5,4,1.5,'🔒 Dörren är låst', () => {
    if (roomCompleted[0]) completeRoom();
    else showMsg('❌ Lös fackelgåtan först!');
  });

  for (let i=0;i<4;i++) makeGlowBlock(0x0044ff,1+Math.random()*6,0.3,1+Math.random()*6);
}

// ══════════════════════════════════════════════════════════
// ROOM 1 — REDSTONE-LABYRINTEN
// ══════════════════════════════════════════════════════════
function buildRedstoneRoom() {
  clearRoom();
  player.pos.set(4,1.7,4); player.yaw = 0;
  const amb = new THREE.AmbientLight(0x0a0000,0.6); scene.add(amb); addObj(amb);
  scene.fog = new THREE.FogExp2(0x0d0000,0.04);

  buildFloor(0,0,10,10,'obsidian');
  buildWalls(0,0,10,10,4,'redstone');
  buildCeiling(0,0,10,10,4,'obsidian');

  const GRID = 5;
  const powered    = new Set(['0,0']);
  const gridState  = Array.from({length:GRID},()=>Array(GRID).fill(false));
  const cellMeshes = {};
  const startX = 1, startZ = 1, cellSize = 1.5;

  // FIX: correct argument order — renderCell(row, col)
  function renderCell(r, c) {
    const key = `${c},${r}`;
    const mesh = cellMeshes[key];
    if (!mesh) return;
    const isSource  = key === '0,0';
    const isTarget  = key === '4,4';
    const isPowered = powered.has(key);
    mesh.material.color.set(
      isSource  ? 0x330000 :
      isTarget  ? (isPowered ? 0x003300 : 0x001100) :
      isPowered ? 0x220000 : 0x0a0a0a
    );
    mesh.material.emissive.set(
      isPowered ? (isTarget ? 0x00aa00 : 0x660000) : 0x000000
    );
    mesh.material.emissiveIntensity = isPowered ? 0.5 : 0;
  }

  function propagate() {
    const queue   = ['0,0'];
    const visited = new Set(queue);
    while (queue.length) {
      const cur = queue.shift();
      const [cc,cr] = cur.split(',').map(Number);
      [[0,1],[0,-1],[1,0],[-1,0]].forEach(([dc,dr]) => {
        const nr = cr+dr, nc = cc+dc;
        const nk = `${nc},${nr}`;
        if (!visited.has(nk) && nr>=0 && nr<GRID && nc>=0 && nc<GRID && gridState[nr][nc]) {
          visited.add(nk); powered.add(nk); queue.push(nk);
        }
      });
    }
    // Prune non-reachable
    [...powered].forEach(k => { if (!visited.has(k)) powered.delete(k); });
  }

  for (let r=0;r<GRID;r++) {
    for (let c=0;c<GRID;c++) {
      const key = `${c},${r}`;
      const x = startX + c*cellSize;
      const z = startZ + r*cellSize;
      const isSource = key === '0,0';
      const isTarget = key === '4,4';
      if (isSource) { gridState[r][c] = true; powered.add(key); }

      const mat  = new THREE.MeshLambertMaterial({ color:isSource?0x330000:isTarget?0x001100:0x0a0a0a });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(cellSize*0.85,0.15,cellSize*0.85), mat);
      mesh.position.set(x,0.05,z); scene.add(mesh); addObj(mesh);
      cellMeshes[key] = mesh;

      if (!isSource && !isTarget) {
        addInteractable(x,0.5,z,0.9,'E - Toggle ledning', () => {
          gridState[r][c] = !gridState[r][c];
          powered.clear(); powered.add('0,0');
          propagate();
          // FIX: pass (r, c) correctly
          Object.keys(cellMeshes).forEach(k => {
            const [kc, kr] = k.split(',').map(Number);
            renderCell(kr, kc);
          });
          if (powered.has('4,4')) {
            setTimeout(() => { showMsg('⚡ Strömmen flödar! Grind öppnas!'); completeRoom(); }, 500);
          }
        });
      }
    }
  }

  // Pre-seed some cells to give a partial hint
  ['2,0','4,2'].forEach(k => {
    const [kc,kr] = k.split(',').map(Number);
    gridState[kr][kc] = true;
  });
  powered.clear(); powered.add('0,0'); propagate();
  Object.keys(cellMeshes).forEach(k => {
    const [kc,kr] = k.split(',').map(Number);
    renderCell(kr, kc);
  });

  addObj(addLight(0xff4444,2,startX,1,startZ,3));
  addObj(addLight(0x44ff44,2,startX+4*cellSize,1,startZ+4*cellSize,3));

  addInteractable(5,1.5,9.5,2,'E - Info', () => {
    openModal('⚡ Redstone Gåtan',`
      <div style="font-family:'VT323';font-size:20px;color:#ff6666;line-height:1.8">
        Koppla strömmen från <span style="color:#ff4444">KÄLLA (rött, övre vänster)</span>
        till <span style="color:#44ff44">MÅL (grönt, nedre höger)</span>.<br><br>
        Klicka på celler för att aktivera/avaktivera ledningar.<br>
        Ström flödar bara horisontalt och vertikalt!
      </div>
    `);
  });

  makeGlowBlock(0xcc0000,0.4,1.5,5);
  makeGlowBlock(0xcc0000,9.6,1.5,5);
}

// ══════════════════════════════════════════════════════════
// ROOM 2 — GRUVSCHAKTET
// ══════════════════════════════════════════════════════════
function buildPickaxeRoom() {
  clearRoom();
  player.pos.set(4,1.7,4); player.yaw = Math.PI;
  const amb = new THREE.AmbientLight(0x111122,1); scene.add(amb); addObj(amb);
  scene.fog = new THREE.FogExp2(0x050508,0.035);

  buildFloor(0,0,9,9,'dirt');
  buildWalls(0,0,9,9,4,'cobble');
  buildCeiling(0,0,9,9,4,'stone');

  const blocks = [
    {type:'stone',  x:2,y:0.5,z:2, name:'Sten',      correct:false},
    {type:'dirt',   x:3,y:0.5,z:2, name:'Jord',      correct:false},
    {type:'obsidian',x:2,y:0.5,z:3,name:'Obsidian',  correct:false},
    {type:'gold',   x:5,y:0.5,z:5, name:'Guld',      correct:false},
    {type:'diamond',x:4,y:0.5,z:7, name:'Diamant',   correct:true },
    {type:'emerald',x:6,y:0.5,z:3, name:'Smaragd',   correct:false},
    {type:'cobble', x:7,y:0.5,z:6, name:'Bullersten',correct:false},
    {type:'mossy',  x:2,y:0.5,z:6, name:'Mossten',   correct:false},
  ];

  const pickaxeTypes = {
    wood:    { canMine:['stone','dirt','cobble','mossy'],                                    name:'Träpicka',    color:0x8B6914 },
    stone:   { canMine:['stone','dirt','cobble','mossy','gold','emerald'],                   name:'Stenpicka',   color:0x888888 },
    iron:    { canMine:['stone','dirt','cobble','mossy','gold','emerald','obsidian'],         name:'Järnpicka',   color:0xaaaaaa },
    diamond: { canMine:['stone','dirt','cobble','mossy','gold','emerald','obsidian','diamond'],name:'Diamantpicka',color:0x00ffff },
  };

  let currentPickaxe = 'wood';

  // Pickaxe stands at corners
  [['wood',1,1],['stone',8,1],['iron',1,8],['diamond',8,8]].forEach(([id,x,z]) => {
    const col = pickaxeTypes[id].color;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.3,0.6,0.1),
      new THREE.MeshLambertMaterial({ color:col })
    );
    mesh.position.set(x,1,z); scene.add(mesh); addObj(mesh);
    addObj(addLight(col,0.8,x,1.5,z,2));
    addInteractable(x,1,z,1.5,`E - Ta ${pickaxeTypes[id].name}`, () => {
      currentPickaxe = id;
      showMsg(`⛏️ Valt: ${pickaxeTypes[id].name}`);
    });
  });

  // Mineable blocks
  blocks.forEach(b => {
    const mesh = addMesh(b.type,b.x,b.y,b.z);
    addInteractable(b.x,b.y,b.z,1.5,`E - Mina ${b.name}`, () => {
      if (!pickaxeTypes[currentPickaxe].canMine.includes(b.type)) {
        showMsg(`❌ ${pickaxeTypes[currentPickaxe].name} kan inte mina ${b.name}!`);
        return;
      }
      scene.remove(mesh);
      if (b.correct) {
        spawnParticles2d(window.innerWidth/2,window.innerHeight/2,0x00ffff);
        showMsg('💎 DIAMANT! Du hittar en hemlig gång!');
        setTimeout(() => completeRoom(), 1200);
      } else {
        showMsg(`🪨 ${b.name} bryts, men ingenting intressant...`);
      }
    });
  });

  addInteractable(4,1.5,0.6,2,'E - Läs ledtråd', () => {
    openModal('📜 Gruvkartan',`
      <div style="font-family:'VT323';font-size:20px;color:#ffd700;line-height:2">
        "Diamant döljer sig djupast.<br>
        Bara den sannaste pickan kan kröna den.<br>
        Träet brister mot stenar.<br>
        Stenen ger upp mot guld.<br>
        Järn böjer sig för kristaller.<br>
        <span style="color:#00ffff">Diamant krossar diamant.</span>"
      </div>
    `);
  });

  [[1,1.5,5],[8,1.5,5],[4,1.5,0.8],[4,1.5,8.2]].forEach(([x,y,z]) => makeTorch(x,y,z));
  makeGlowBlock(0x00ffff,4.5,0.3,4.5);
}

// ══════════════════════════════════════════════════════════
// ROOM 3 — KISTGÅTAN
// ══════════════════════════════════════════════════════════
function buildChestRoom() {
  clearRoom();
  player.pos.set(5,1.7,5); player.yaw = -Math.PI/2;
  const amb = new THREE.AmbientLight(0x0a0820,0.9); scene.add(amb); addObj(amb);
  scene.fog = new THREE.FogExp2(0x080610,0.03);

  buildFloor(0,0,10,10,'planks');
  buildWalls(0,0,10,10,4,'bookshelf');
  buildCeiling(0,0,10,10,4,'wood');

  const chestDefs = [
    {id:'moon', emoji:'🌙',x:2,z:2, order:0},
    {id:'star', emoji:'⭐',x:8,z:2, order:1},
    {id:'wave', emoji:'🌊',x:2,z:8, order:2},
    {id:'fire', emoji:'🔥',x:8,z:8, order:3},
    {id:'skull',emoji:'💀',x:5,z:1, order:-1},
    {id:'diam', emoji:'💎',x:5,z:9, order:-1},
  ];

  let chestProgress = 0;
  const chestOpened = new Set();

  chestDefs.forEach(cd => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.8,0.6,0.6),
      new THREE.MeshLambertMaterial({ color:0x5c3a1e })
    );
    mesh.position.set(cd.x,0.35,cd.z); scene.add(mesh); addObj(mesh);

    addInteractable(cd.x,0.5,cd.z,1.5,`E - Öppna kista (${cd.emoji})`, () => {
      if (chestOpened.has(cd.id)) { showMsg('📦 Redan öppnad!'); return; }
      if (cd.order === -1) {
        showMsg(`☠️ FÄLLA! Börja om!`);
        chestProgress = 0; chestOpened.clear();
        spawnParticles2d(window.innerWidth/2,window.innerHeight/2,0xff0000);
        return;
      }
      if (cd.order !== chestProgress) {
        showMsg('❌ Fel kista! Ordningen återställs...');
        chestProgress = 0; chestOpened.clear(); return;
      }
      chestOpened.add(cd.id); chestProgress++;
      spawnParticles2d(window.innerWidth/2,window.innerHeight/2,0xffd700);
      showMsg(`✅ Kista ${chestProgress}/4 öppnad! (${cd.emoji})`);
      mesh.position.y = 0.5; mesh.scale.y = 0.3;
      if (chestProgress === 4) {
        setTimeout(() => { showMsg('🏆 Alla kistor öppnade!'); completeRoom(); }, 800);
      }
    });
    addObj(addLight(0xffaa44,0.4,cd.x,0.8,cd.z,2));
  });

  addInteractable(5,1.5,0.6,2,'E - Läs runskriften', () => {
    openModal('📜 Kistornas Gåta',`
      <div style="font-family:'VT323';font-size:22px;color:#ffd700;line-height:2.2;text-align:center">
        "Öppna i skapelsens ordning:<br>
        <span style="color:#aaaaff">🌙 Natten</span> föder <span style="color:#ffff44">⭐ Stjärnorna</span><br>
        som lyser på <span style="color:#44aaff">🌊 Havet</span><br>
        som prövas av <span style="color:#ff6644">🔥 Elden</span><br><br>
        <span style="color:#ff4444">Akta dig för fällorna!</span>"
      </div>
    `);
  });

  [[1,1.5,5],[9,1.5,5],[5,1.5,5]].forEach(([x,y,z]) => makeGlowBlock(0x6644ff,x,y,z));
  addObj(addLight(0x4433aa,1.5,3,5,5,12));
}

// ══════════════════════════════════════════════════════════
// ROOM 4 — SPEGELRUMMET
// ══════════════════════════════════════════════════════════
function buildMirrorRoom() {
  clearRoom();
  player.pos.set(5,1.7,5); player.yaw = 0;
  const amb = new THREE.AmbientLight(0x002244,1); scene.add(amb); addObj(amb);
  scene.fog = new THREE.FogExp2(0x001122,0.03);

  buildFloor(0,0,10,10,'diamond');
  buildWalls(0,0,10,10,4,'obsidian');
  buildCeiling(0,0,10,10,4,'obsidian');

  const colors = [0x00ffff,0xff00ff,0xffff00,0x00ff44];
  for (let i=0;i<8;i++) {
    const a = i/8*Math.PI*2;
    makeGlowBlock(colors[i%4],5+Math.cos(a)*4,0.3,5+Math.sin(a)*4);
  }

  // Checkerboard target
  const TARGET = [[0,1,0,1],[1,0,1,0],[0,1,0,1],[1,0,1,0]];
  const playerGrid = Array.from({length:4},()=>Array(4).fill(0));
  const cellMeshArr = [];

  for (let r=0;r<4;r++) {
    cellMeshArr[r] = [];
    for (let c=0;c<4;c++) {
      const x = 2+c*1.5, z = 2+r*1.5;
      const mat = new THREE.MeshLambertMaterial({
        color:0x001133,
        emissive:new THREE.Color(0),
        emissiveIntensity:0.5,
      });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.2,0.1,1.2), mat);
      mesh.position.set(x,0.1,z); scene.add(mesh); addObj(mesh);
      cellMeshArr[r][c] = mesh;

      addInteractable(x,0.5,z,0.9,'E - Toggle cell', () => {
        playerGrid[r][c] ^= 1;
        mesh.material.color.set(playerGrid[r][c] ? 0x00ffff : 0x001133);
        mesh.material.emissive.set(playerGrid[r][c] ? 0x00aaaa : 0x000000);
        if (playerGrid[r][c]) spawnParticles2d(window.innerWidth/2,window.innerHeight*0.7,0x00ffff);
        checkMirror();
      });
    }
  }

  function checkMirror() {
    for (let r=0;r<4;r++) for (let c=0;c<4;c++) if (playerGrid[r][c]!==TARGET[r][c]) return;
    showMsg('✨ MÖNSTRET MATCHAR! Hemlig gång öppnas!');
    spawnParticles2d(window.innerWidth/2,window.innerHeight/2,0x00ffff);
    setTimeout(() => completeRoom(), 1000);
  }

  addInteractable(5,1.5,0.5,2.5,'E - Visa målmönster', () => {
    openModal('🪟 Målmönstret',`
      <div style="text-align:center;margin-bottom:12px;font-family:'VT323';font-size:18px;color:#00ffff">
        Matcha detta mönster på golvet:
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,48px);gap:4px;margin:auto;width:fit-content">
        ${TARGET.flat().map(v=>`
          <div style="width:48px;height:48px;background:${v?'#00ffff':'#001133'};border:2px solid ${v?'#00ffff':'#003366'};box-shadow:${v?'0 0 12px #00ffff':'none'}"></div>
        `).join('')}
      </div>
      <div style="font-family:'VT323';font-size:16px;color:#888;margin-top:12px;text-align:center">
        Blå = PÅ &nbsp;|&nbsp; Mörk = AV &nbsp;(schackmönster)
      </div>
    `);
  });

  addObj(addLight(0x0044ff,2,2.5,5,5,15));
}

// ══════════════════════════════════════════════════════════
// ROOM 5 — BOSSRUMMET
// ══════════════════════════════════════════════════════════
function buildBossRoom() {
  clearRoom();
  player.pos.set(5,1.7,5); player.yaw = Math.PI;
  const amb = new THREE.AmbientLight(0x110000,0.5); scene.add(amb); addObj(amb);
  scene.fog = new THREE.FogExp2(0x0d0000,0.025);

  buildFloor(0,0,12,12,'obsidian');
  buildWalls(0,0,12,12,5,'obsidian');
  buildCeiling(0,0,12,12,5,'obsidian');

  // Portal frame
  for (let y=0;y<5;y++) { addMesh('obsidian',0,y+0.5,6); addMesh('obsidian',12,y+0.5,6); }
  for (let x=1;x<12;x++) addMesh('obsidian',x,5.5,6);
  for (let y=0;y<4;y++) {
    for (let x=1;x<12;x++) {
      const pm = new THREE.Mesh(
        new THREE.PlaneGeometry(0.95,0.95),
        new THREE.MeshBasicMaterial({color:0x440088,transparent:true,opacity:0.7,side:THREE.DoubleSide})
      );
      pm.position.set(x,y+0.5,6.01); scene.add(pm); addObj(pm);
    }
  }
  addObj(addLight(0x6600cc,3,2,3,6,8));
  addObj(addLight(0x6600cc,3,9,3,6,8));

  for (let x=1;x<12;x+=3) { makeGlowBlock(0xff4500,x,0.1,0.5); makeGlowBlock(0xff4500,x,0.1,11.5); }
  for (let z=1;z<12;z+=3) { makeGlowBlock(0xff4500,0.5,0.1,z); makeGlowBlock(0xff4500,11.5,0.1,z); }

  // Throne
  addMesh('obsidian',6,0.5,0.5); addMesh('obsidian',6,1.5,0.5);
  addMesh('gold',6,0.5,1); addMesh('gold',5,0.5,1); addMesh('gold',7,0.5,1);
  addObj(addLight(0xffd700,2,6,2,0.5,6));

  // Simon Says
  const SYMBOLS = ['🔥','💧','⚡','🌿'];
  const COLORS   = [0xff4400,0x0044ff,0xffff00,0x00aa44];
  const fullSeq  = [0,2,1,3,0,1,2,3];
  let phase=0, playerSeq=[], showing=false;

  function showSequence() {
    showing = true;
    openModal('👁️ MEMORERA SEKVENSEN',`
      <div id="boss-seq-display" style="font-family:'VT323';font-size:20px;color:#aaa;text-align:center;line-height:2">
        Memorera sekvensen och upprepa den!<br>
        <span style="color:#ff4444">Titta noga...</span>
      </div>
    `);
    const seq = fullSeq.slice(0,phase+1);
    seq.forEach((s,i) => {
      setTimeout(() => {
        const el = document.getElementById('boss-seq-display');
        if (el) el.innerHTML = `<div style="font-size:60px">${SYMBOLS[s]}</div><div style="color:#888">${i+1}/${seq.length}</div>`;
        spawnParticles2d(window.innerWidth/2,window.innerHeight/2,COLORS[s]);
      }, i*900);
    });
    setTimeout(() => { showing=false; closeModal(); showMsg('🎯 Upprepa sekvensen!'); }, seq.length*900+500);
  }

  function recordBoss(idx) {
    if (showing) return;
    playerSeq.push(idx);
    spawnParticles2d(window.innerWidth/2,window.innerHeight/2,COLORS[idx]);
    showMsg(SYMBOLS[idx]);

    if (idx !== fullSeq[playerSeq.length-1]) {
      showMsg('❌ FEL! Börjar om...');
      playerSeq = [];
      setTimeout(() => showSequence(), 1000);
      return;
    }
    if (playerSeq.length === phase+1) {
      phase++; playerSeq=[];
      if (phase >= fullSeq.length) {
        setTimeout(() => { showMsg('🏆 PORTALEN ÖPPNAS!'); winGame(); }, 800);
      } else {
        showMsg(`✅ Fas ${phase}/${fullSeq.length} klar!`);
        setTimeout(() => showSequence(), 1200);
      }
    }
  }

  // Pads
  [[3,9.5,0xff4400],[9,9.5,0x0044ff],[3,3.5,0xffff00],[9,3.5,0x00aa44]].forEach(([x,z,col],i) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.5,0.1,1.5),
      new THREE.MeshLambertMaterial({color:col,emissive:new THREE.Color(col),emissiveIntensity:0.3})
    );
    mesh.position.set(x,0.1,z); scene.add(mesh); addObj(mesh);
    addObj(addLight(col,1,x,0.5,z,3));
    addInteractable(x,0.5,z,1.5,`E - ${SYMBOLS[i]}`, () => { if(!showing) recordBoss(i); });
  });

  addInteractable(6,1.5,1,2,'E - Aktivera Boss-Gåtan', () => {
    showMsg('🎭 Boss-gåtan aktiveras!');
    setTimeout(() => showSequence(), 500);
  });

  addInteractable(6,1.5,0.5,2,'E - Läs Bossens Utmaning', () => {
    openModal('💀 Bossens Utmaning',`
      <div style="font-family:'VT323';font-size:20px;color:#ff6666;line-height:2;text-align:center">
        "Simon säger: memorera mönstret.<br>
        Upprepa utan misstag.<br>
        Klara alla åtta faser —<br>
        och portalen öppnas."<br><br>
        <span style="color:#00ff44">Tryck 'Aktivera Boss-Gåtan' för att börja.</span>
      </div>
    `);
  });
}

// ══════════════════════════════════════════════════════════
// ROOM MANAGEMENT
// ══════════════════════════════════════════════════════════
const roomBuilders = [buildTorchRoom,buildRedstoneRoom,buildPickaxeRoom,buildChestRoom,buildMirrorRoom,buildBossRoom];

function loadRoom(index) {
  currentRoom.value = index;
  currentRoomName.value = roomNames[index];
  transitioning.value = true;
  setTimeout(() => {
    roomBuilders[index]();
    transitioning.value = false;
    showMsg(`📍 ${roomNames[index]}`);
  }, 400);
}

function completeRoom() {
  roomCompleted[currentRoom.value] = true;
  spawnParticles2d(window.innerWidth/2,window.innerHeight/2,0x00ff88);
  if (currentRoom.value < 5) {
    setTimeout(() => {
      showMsg('🚪 Nästa rum låses upp...');
      setTimeout(() => loadRoom(currentRoom.value+1), 1500);
    }, 800);
  }
}

// ══════════════════════════════════════════════════════════
// UI
// ══════════════════════════════════════════════════════════
function showMsg(text) {
  const id = msgIdCounter++;
  messages.value.push({ id, text });
  setTimeout(() => {
    messages.value = messages.value.filter(m => m.id !== id);
  }, 3200);
}

function openModal(title, html) {
  modalContent.value = `<h2>${title}</h2>${html}`;
  modalOpen.value = true;
  document.exitPointerLock();
}

function closeModal() {
  modalOpen.value = false;
  if (gameActive) gameCanvas.value?.requestPointerLock();
}

function winGame() {
  gameActive = false;
  endTitle.value = '<span style="color:#ffd700;font-family:\'Press Start 2P\';font-size:24px">🏆 GRUVANS HEMLIGHET LÖST!</span>';
  endMsg.value   = 'Du klarade alla sex rum och öppnade den forntida portalen.';
  showEndScreen.value = true;
  for (let i=0;i<10;i++) {
    setTimeout(()=>spawnParticles2d(Math.random()*window.innerWidth,Math.random()*window.innerHeight,0xffd700),i*200);
  }
}

function loseGame() {
  gameActive = false;
  endTitle.value = '<span style="color:#ff4444;font-family:\'Press Start 2P\';font-size:24px">⏰ TIDEN ÄR UTE!</span>';
  endMsg.value   = 'Gruvans gåtor var för många. Men inget hindrar dig från att försöka igen...';
  showEndScreen.value = true;
}

function reloadGame() { window.location.reload(); }

// ══════════════════════════════════════════════════════════
// PARTICLES
// ══════════════════════════════════════════════════════════
function spawnParticles2d(x,y,color) {
  const r=(color>>16)&255,g=(color>>8)&255,b=color&255;
  for (let i=0;i<20;i++) {
    particles2d.push({x,y,vx:(Math.random()-.5)*6,vy:(Math.random()-.5)*6-2,life:1,r,g,b,size:3+Math.random()*5});
  }
}

function updateParticles2d(dt) {
  if (!particleCtx) return;
  particleCtx.clearRect(0,0,particleCanvas.width,particleCanvas.height);
  particles2d = particles2d.filter(p => {
    p.x+=p.vx; p.y+=p.vy; p.vy+=0.15; p.life-=dt*1.5;
    if (p.life<=0) return false;
    particleCtx.beginPath();
    particleCtx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2);
    particleCtx.fillStyle=`rgba(${p.r},${p.g},${p.b},${p.life})`;
    particleCtx.fill();
    return true;
  });
}

// ══════════════════════════════════════════════════════════
// MINIMAP
// ══════════════════════════════════════════════════════════
function drawMinimap() {
  const c = mmCanvasRef.value;
  if (!c) return;
  const ctx = c.getContext('2d');
  ctx.clearRect(0,0,c.width,c.height);
  const scaleX = c.width/14, scaleZ = c.height/14;
  ctx.fillStyle='#1a1a2e'; ctx.fillRect(0,0,c.width,c.height);
  const px = player.pos.x*scaleX, pz = player.pos.z*scaleZ;
  ctx.fillStyle='#00ff88'; ctx.beginPath(); ctx.arc(px,pz,3,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#00ff88'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(px,pz);
  ctx.lineTo(px-Math.sin(player.yaw)*10, pz-Math.cos(player.yaw)*10); ctx.stroke();
  interactables.forEach(ia => {
    ctx.fillStyle='#ffd700'; ctx.beginPath();
    ctx.arc(ia.pos.x*scaleX,ia.pos.z*scaleZ,2,0,Math.PI*2); ctx.fill();
  });
}

// ══════════════════════════════════════════════════════════
// GAME LOOP
// ══════════════════════════════════════════════════════════
function animate() {
  rafId = requestAnimationFrame(animate);
  if (!gameActive || !clock) return;

  const dt = Math.min(clock.getDelta(),0.05);
  tickAcc += dt;

  if (mouseLocked) {
    const speed = 0.08;
    const fwd   = new THREE.Vector3(-Math.sin(player.yaw),0,-Math.cos(player.yaw));
    const right = new THREE.Vector3( Math.cos(player.yaw),0,-Math.sin(player.yaw));
    const move  = new THREE.Vector3();
    if (keys['KeyW']||keys['ArrowUp'])    move.add(fwd);
    if (keys['KeyS']||keys['ArrowDown'])  move.sub(fwd);
    if (keys['KeyA']||keys['ArrowLeft'])  move.sub(right);
    if (keys['KeyD']||keys['ArrowRight']) move.add(right);
    if (move.length()>0) { move.normalize().multiplyScalar(speed); player.pos.add(move); }
    player.pos.x = Math.max(0.6,Math.min(11.4,player.pos.x));
    player.pos.z = Math.max(0.6,Math.min(11.4,player.pos.z));
    camera.position.copy(player.pos);
    camera.rotation.order='YXZ';
    camera.rotation.y=player.yaw;
    camera.rotation.x=player.pitch;
  }

  // Nearest interactable
  let best=null, bestDist=Infinity;
  interactables.forEach(ia => {
    const d = player.pos.distanceTo(ia.pos);
    if (d<ia.radius && d<bestDist) { bestDist=d; best=ia; }
  });
  nearestInteractable = best;
  nearestLabel.value  = best ? best.label : '';

  // Timer
  if (!relaxMode.value) {
    timerSeconds -= dt;
    const m = Math.floor(timerSeconds/60).toString().padStart(2,'0');
    const s = Math.floor(timerSeconds%60).toString().padStart(2,'0');
    timerDisplay.value = `${m}:${s}`;
    if (timerSeconds <= 0) loseGame();
  }

  // Flicker lights
  if (tickAcc > 0.05) {
    tickAcc = 0;
    scene.children.forEach(c => {
      if (c.isPointLight) c.intensity += ((0.8+Math.random()*0.4)-c.intensity)*0.1;
    });
  }

  updateParticles2d(dt);
  drawMinimap();
  renderer.render(scene,camera);
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323:wght@400&display=swap');

.block-escape-game {
  position: fixed; inset: 0;
  background: #000; overflow: hidden;
  font-family: 'VT323', monospace; color: #fff; user-select: none;
}

:root {
  --pixel: #4CAF50; --pixel2: #81C784;
  --gold: #ffd700;  --diamond: #00ffff;
  --ui-bg: rgba(0,0,0,0.85);
}

#game-canvas  { position: fixed; inset: 0; width: 100%; height: 100%; display: block; }
#particles    { position: fixed; inset: 0; pointer-events: none; z-index: 15; }
.bg-scan      { position: fixed; inset: 0; pointer-events: none; z-index: 1;
                background: repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.03) 3px,rgba(0,0,0,0.03) 4px); }

/* Crosshair */
#crosshair { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 20px; height: 20px; pointer-events: none; z-index: 10; }
#crosshair::before, #crosshair::after { content: ''; position: absolute; background: rgba(255,255,255,0.8); }
#crosshair::before { width: 2px; height: 100%; left: 50%; transform: translateX(-50%); }
#crosshair::after  { height: 2px; width: 100%; top: 50%; transform: translateY(-50%); }

/* HUD */
#hud-top { position: fixed; top: 0; left: 0; right: 0; padding: 12px 16px; display: flex; justify-content: space-between; z-index: 20; pointer-events: none; }
#room-name { font-family: 'Press Start 2P', monospace; font-size: 10px; color: #81C784; text-shadow: 2px 2px 0 #000; background: var(--ui-bg); border: 2px solid #4CAF50; padding: 8px 12px; }
#timer-display { font-family: 'Press Start 2P', monospace; font-size: 14px; color: #ff4444; background: var(--ui-bg); border: 2px solid #cc0000; padding: 8px 14px; }
#timer-display.safe { color: #81C784; border-color: #4CAF50; }

/* Hotbar */
#hotbar { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 4px; z-index: 20; }
.hotbar-slot { width: 52px; height: 52px; background: rgba(30,30,30,.9); border: 2px solid #555; display: flex; align-items: center; justify-content: center; flex-direction: column; font-size: 24px; position: relative; cursor: default; }
.hotbar-slot.active { border-color: #4CAF50; box-shadow: 0 0 8px #4CAF50; }
.slot-label { font-family: 'VT323'; font-size: 9px; color: #aaa; position: absolute; bottom: 2px; left: 0; right: 0; text-align: center; }

/* Interact prompt */
#interact-prompt { position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%); background: var(--ui-bg); border: 2px solid #888; padding: 8px 20px; font-size: 18px; opacity: 0; transition: opacity .2s; z-index: 20; pointer-events: none; text-align: center; }
#interact-prompt.show { opacity: 1; }

/* Messages */
#msg-log { position: fixed; top: 70px; left: 16px; z-index: 20; pointer-events: none; display: flex; flex-direction: column; gap: 4px; max-width: 300px; }
.msg-item { background: rgba(0,0,0,.8); border-left: 3px solid #4CAF50; padding: 6px 10px; font-size: 16px; color: #e0e0e0; animation: msgIn .3s ease, msgOut .5s ease 2.5s forwards; }
@keyframes msgIn  { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:none; } }
@keyframes msgOut { to   { opacity:0; transform:translateX(-20px); } }

/* Modal */
#modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.75); z-index: 100; display: none; align-items: center; justify-content: center; }
#modal-overlay.open { display: flex; }
#modal-box { background: #1a1a1a; border: 3px solid #4CAF50; padding: 28px 32px; min-width: 360px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; position: relative; }
#modal-box :deep(h2) { font-family: 'Press Start 2P'; font-size: 12px; color: #81C784; margin-bottom: 18px; letter-spacing: 2px; }
.modal-close { position: absolute; top: 10px; right: 14px; background: none; border: none; color: #fff; font-size: 22px; cursor: pointer; font-family: 'VT323'; }

/* Buttons */
.pixel-btn { font-family: 'VT323'; font-size: 20px; letter-spacing: 2px; background: #2a2a2a; border: 2px solid #4CAF50; color: #81C784; padding: 10px 22px; cursor: pointer; transition: all .15s; display: inline-block; margin: 4px; }
.pixel-btn:hover { background: #4CAF50; color: #000; }
.pixel-btn.gold { border-color: #ffd700; color: #ffd700; }
.pixel-btn.gold:hover { background: #ffd700; color: #000; }

/* Lava glow */
.lava-glow { position: fixed; bottom: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg,#ff4500,#ff8c00,#ff4500); animation: lavaFlow 2s linear infinite; opacity: .6; pointer-events: none; z-index: 19; }
@keyframes lavaFlow { 0% { background-position:0 0; } 100% { background-position:200px 0; } }

/* Transition */
.room-transition { position: fixed; inset: 0; background: #000; z-index: 90; pointer-events: none; opacity: 0; transition: opacity .4s; }
.room-transition.active { opacity: 1; }

/* Minimap */
#minimap { position: fixed; top: 70px; right: 16px; width: 110px; height: 110px; background: rgba(0,0,0,.8); border: 2px solid #555; z-index: 20; pointer-events: none; }
#minimap canvas { width: 100%; height: 100%; }
#minimap-label { font-size: 10px; color: #666; text-align: center; padding: 2px; font-family: 'VT323'; }

/* Room progress */
#room-progress { position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; z-index: 20; pointer-events: none; }
.rpip { width: 12px; height: 12px; background: #333; border: 2px solid #555; transform: rotate(45deg); transition: all .3s; }
.rpip.done    { background: #4CAF50; border-color: #81C784; }
.rpip.current { background: #ffd700; border-color: #fff; box-shadow: 0 0 8px #ffd700; }

/* Start screen */
#start-screen { position: fixed; inset: 0; z-index: 300; background: #000; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 18px; }
.pixel-title { font-family: 'Press Start 2P'; font-size: clamp(14px,3vw,26px); color: #81C784; text-shadow: 3px 3px 0 #1a5c1a, 6px 6px 0 #000; letter-spacing: 2px; text-align: center; animation: titlePulse 2s ease-in-out infinite; line-height: 1.6; }
@keyframes titlePulse { 0%,100% { text-shadow:3px 3px 0 #1a5c1a,6px 6px 0 #000; } 50% { text-shadow:3px 3px 0 #2a8c2a,6px 6px 0 #000,0 0 30px #4CAF50; } }
.pixel-sub { font-family: 'VT323'; font-size: 26px; color: #888; letter-spacing: 3px; text-align: center; }

/* End screen */
#end-screen { position: fixed; inset: 0; background: rgba(0,0,0,.92); z-index: 200; display: none; align-items: center; justify-content: center; flex-direction: column; gap: 20px; text-align: center; }
#end-screen.show { display: flex; }
#end-screen p { font-size: 22px; color: #bbb; max-width: 500px; line-height: 1.6; }
</style>