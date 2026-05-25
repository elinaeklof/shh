<template>
  <div class="game-root" ref="gameRoot">

    <!-- START SCREEN -->
    <transition name="fade">
    <div v-if="screen==='start'" class="overlay-screen start-screen">
      <div class="title-eyebrow">EN SANN HISTORIA</div>
      <h1 class="title-main">ELINA &amp; RICHARD</h1>
      <div class="title-sub">Operationen: V-husets Källare</div>
      <div class="start-desc">
        En kväll. Två personer. Fem hinder.<br>
        Ta er från E-husets toalett till V-husets källare<br>
        utan att bli <em>sedda</em>.
      </div>
      <button class="btn-start" @click="startGame">BÖRJA SMYGA</button>
      <div class="controls-hint">
        WASD / Pilar = Gå &nbsp;·&nbsp; SHIFT = Smyg &nbsp;·&nbsp; E = Interagera &nbsp;·&nbsp; Mus = Sikta
      </div>
    </div>
    </transition>

    <!-- GAME CANVAS -->
    <canvas ref="gameCanvas"></canvas>
    <canvas ref="particleRef" class="particle-canvas"></canvas>

    <!-- HUD -->
    <transition name="fade">
    <div v-if="screen==='game'" class="hud">
      <!-- Top bar -->
      <div class="hud-top">
        <div class="hud-act">
          <span class="hud-act-num">{{ actLabel }}</span>
          <span class="hud-act-name">{{ actName }}</span>
        </div>
        <div class="hud-stealth">
          <span class="hud-stealth-label">STEALTH</span>
          <div class="stealth-bar">
            <div class="stealth-fill" :style="{width: stealth+'%', background: stealthColor}"></div>
          </div>
        </div>
      </div>

      <!-- Alert flash -->
      <div class="alert-border" :class="{active: alerting}"></div>

      <!-- Crosshair -->
      <div class="crosshair"></div>

      <!-- Interact -->
      <div class="interact-hint" :class="{show: interactLabel}">
        <span class="interact-key">E</span> {{ interactLabel }}
      </div>

      <!-- Sneak indicator -->
      <div class="sneak-indicator" :class="{sneaking: sneaking}">
        <span>{{ sneaking ? '🤫 SMY​G' : '🚶 GÅR' }}</span>
      </div>

      <!-- Messages -->
      <div class="msg-feed">
        <transition-group name="msg">
          <div v-for="m in msgs" :key="m.id" class="msg-item" :class="m.type">
            {{ m.text }}
          </div>
        </transition-group>
      </div>

      <!-- NPC dialogue -->
      <div class="dialogue-box" :class="{show: dialogue}">
        <div class="dialogue-text">{{ dialogue }}</div>
      </div>
    </div>
    </transition>

    <!-- ACT INTRO CARD -->
    <transition name="act-slide">
    <div v-if="showActCard" class="act-card">
      <div class="act-card-num">{{ actLabel }}</div>
      <div class="act-card-title">{{ actName }}</div>
      <div class="act-card-sub">{{ actSubtitle }}</div>
    </div>
    </transition>

    <!-- WIN SCREEN -->
    <transition name="fade">
    <div v-if="screen==='win'" class="overlay-screen win-screen">
      <div class="win-emoji">🚽</div>
      <h1 class="win-title">FRAMME!</h1>
      <div class="win-sub">V-husets källartoalett — tyst, trygg, er.</div>
      <div class="win-stats">
        <div class="stat"><span>{{ caughtCount }}</span> gånger nästan påkomna</div>
        <div class="stat"><span>{{ timeStr }}</span> total tid</div>
      </div>
      <button class="btn-start" @click="reloadPage">SPELA IGEN</button>
    </div>
    </transition>

    <!-- CAUGHT SCREEN -->
    <transition name="fade">
    <div v-if="screen==='caught'" class="overlay-screen caught-screen">
      <div class="caught-icon">👀</div>
      <h1 class="caught-title">PÅKOMMEN!</h1>
      <div class="caught-reason">{{ caughtReason }}</div>
      <button class="btn-start" style="margin-top:24px" @click="respawn">FÖRSÖK IGEN</button>
    </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'

// ── Vue state ──────────────────────────────────────────────
const gameRoot     = ref(null)
const gameCanvas   = ref(null)
const particleRef  = ref(null)
const screen       = ref('start')
const stealth      = ref(100)
const sneaking     = ref(false)
const alerting     = ref(false)
const interactLabel= ref('')
const dialogue     = ref('')
const showActCard  = ref(false)
const actLabel     = ref('DEL 1')
const actName      = ref('E-husets Toalett')
const actSubtitle  = ref('')
const msgs         = ref([])
const caughtCount  = ref(0)
const caughtReason = ref('')
const timeStr      = ref('0:00')

let msgId = 0

const stealthColor = computed(() => {
  const s = stealth.value
  if (s > 60) return '#00e676'
  if (s > 30) return '#ffb300'
  return '#f44336'
})

// ── Engine ─────────────────────────────────────────────────
let scene, camera, renderer, clock
let gameActive = false, rafId = null
let pCanvas, pCtx, particles2d = []
let keys = {}, mouseLocked = false
let canvasEl = null
let player = { pos: new THREE.Vector3(0,1.6,0), yaw:0, pitch:0 }
let npcs = [], guards = [], cameras3d = []
let interactables = [], nearestIA = null
let roomObjects = []
let currentAct = 0
let stealthVal = 100
let gameTimeSec = 0
let caught = false
let caughtCount_ = 0
let dialogueTimer = 0

// Act definitions
const ACTS = [
  { label:'DEL 1', name:'E-husets Toalett',     sub:'Knackningarna tilltar. Ni måste ut.' },
  { label:'DEL 2', name:'Korridoren',            sub:'Timing är allt. Smyg förbi.' },
  { label:'DEL 3', name:'K-huset',               sub:'Kameror. Grupprumsdörrar. Kännare.' },
  { label:'DEL 4', name:'Tunnelgången',           sub:'Tyst. Kallt. Bara framåt.' },
  { label:'DEL 5', name:'V-husets Källare',       sub:'Ingen är här. Ni är framme.' },
]

// ── LIFECYCLE ──────────────────────────────────────────────
onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
})
onBeforeUnmount(() => {
  gameActive = false
  if (rafId) cancelAnimationFrame(rafId)
  document.exitPointerLock?.()
  renderer?.dispose?.()
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('resize', onResize)
  document.removeEventListener('pointerlockchange', onPointerLockChange)
  canvasEl?.removeEventListener('click', onElinaRichardCanvasClick)
})

function onKeyDown(e) {
  keys[e.code] = true
  if (e.code==='Escape') document.exitPointerLock?.()
  if (e.code==='KeyE' && nearestIA && gameActive && !caught) nearestIA.cb()
}
function onKeyUp(e) {
  keys[e.code] = false
}
function onElinaRichardCanvasClick() {
  if (!gameActive || caught || !canvasEl) return
  if (document.pointerLockElement !== canvasEl) canvasEl.requestPointerLock()
}
function onPointerLockChange() {
  mouseLocked = document.pointerLockElement === canvasEl
}
function onMouseMove(e) {
  if (!mouseLocked||!gameActive||caught) return
  player.yaw   -= e.movementX * 0.0022
  player.pitch -= e.movementY * 0.0022
  player.pitch  = Math.max(-0.5, Math.min(0.5, player.pitch))
}

function startGame() {
  screen.value = 'game'
  setTimeout(() => {
    initThree()
    loadAct(0)
    gameActive = true
    animate()
  }, 80)
}

function reloadPage() { window.location.reload() }

// ── THREE INIT ─────────────────────────────────────────────
function initThree() {
  const canvas = gameCanvas.value
  canvasEl = canvas
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.9

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(72, innerWidth/innerHeight, 0.05, 120)
  clock = new THREE.Clock()

  pCanvas = particleRef.value
  pCtx    = pCanvas.getContext('2d')
  pCanvas.width  = innerWidth
  pCanvas.height = innerHeight

  window.addEventListener('resize', onResize)
  canvas.addEventListener('click', onElinaRichardCanvasClick)
  document.addEventListener('pointerlockchange', onPointerLockChange)
  window.addEventListener('mousemove', onMouseMove)
}

function onResize() {
  if (!renderer) return
  renderer.setSize(innerWidth, innerHeight)
  camera.aspect = innerWidth/innerHeight
  camera.updateProjectionMatrix()
  pCanvas.width=innerWidth; pCanvas.height=innerHeight
}

// ── MATERIALS ──────────────────────────────────────────────
function makeTex(colors, gridSize=64, gridLines=true) {
  const c = document.createElement('canvas'); c.width=c.height=gridSize
  const x = c.getContext('2d')
  x.fillStyle=colors[0]; x.fillRect(0,0,gridSize,gridSize)
  // noise
  for(let i=0;i<40;i++){
    x.fillStyle=colors[1]||colors[0]
    x.fillRect(Math.random()*gridSize|0,Math.random()*gridSize|0,(2+Math.random()*8)|0,(2+Math.random()*8)|0)
  }
  if(gridLines && colors[2]){
    x.strokeStyle=colors[2]; x.lineWidth=0.5
    for(let i=0;i<gridSize;i+=gridSize/4){
      x.beginPath();x.moveTo(i,0);x.lineTo(i,gridSize);x.stroke()
      x.beginPath();x.moveTo(0,i);x.lineTo(gridSize,i);x.stroke()
    }
  }
  const t=new THREE.CanvasTexture(c)
  t.wrapS=t.wrapT=THREE.RepeatWrapping
  t.magFilter=THREE.NearestFilter
  return t
}

const MAT = {
  tile:       () => new THREE.MeshLambertMaterial({ map: makeTex(['#d0ccc8','#bbb9b5','#aaa8a5'],128,true) }),
  wall:       () => new THREE.MeshLambertMaterial({ map: makeTex(['#e8e5e0','#d5d2cd','#cccccc'],128,true) }),
  wallGray:   () => new THREE.MeshLambertMaterial({ map: makeTex(['#9e9e9e','#888','#777'],128,true) }),
  ceiling:    () => new THREE.MeshLambertMaterial({ color:0xf5f5f5 }),
  concrete:   () => new THREE.MeshLambertMaterial({ map: makeTex(['#6b6b6b','#5a5a5a','#444'],128,true) }),
  dark:       () => new THREE.MeshLambertMaterial({ map: makeTex(['#1a1a1a','#222','#111'],64,false) }),
  wood:       () => new THREE.MeshLambertMaterial({ map: makeTex(['#8B6914','#7a5e12','#6b5010'],64,true) }),
  sofa:       () => new THREE.MeshLambertMaterial({ color:0x4a6741 }),
  sofaDark:   () => new THREE.MeshLambertMaterial({ color:0x2d3e2a }),
  metal:      () => new THREE.MeshLambertMaterial({ color:0x8a8a8a }),
  emission:   (c) => new THREE.MeshBasicMaterial({ color:c }),
  glass:      () => new THREE.MeshLambertMaterial({ color:0x88aacc, transparent:true, opacity:0.3 }),
  door:       () => new THREE.MeshLambertMaterial({ map: makeTex(['#5c4a2a','#4a3a1a','#3a2a0a'],64,true) }),
  npc1:       () => new THREE.MeshLambertMaterial({ color:0xe07060 }),
  npc2:       () => new THREE.MeshLambertMaterial({ color:0x6070e0 }),
  npc3:       () => new THREE.MeshLambertMaterial({ color:0x60c070 }),
  npcHead:    () => new THREE.MeshLambertMaterial({ color:0xffcc99 }),
}

// ── OBJECT HELPERS ─────────────────────────────────────────
function box(mat, x,y,z, w=1,h=1,d=1, rx=0,ry=0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat)
  m.position.set(x,y,z); m.rotation.x=rx; m.rotation.y=ry
  m.castShadow=m.receiveShadow=true
  scene.add(m); roomObjects.push(m); return m
}
function addLight(color,intensity,x,y,z,distance=10,castShadow=false) {
  const l = new THREE.PointLight(color,intensity,distance)
  l.position.set(x,y,z); l.castShadow=castShadow
  if(castShadow){l.shadow.mapSize.set(512,512);l.shadow.radius=3}
  scene.add(l); roomObjects.push(l); return l
}
function addSpot(color,intensity,x,y,z,tx,ty,tz,angle=0.4) {
  const l = new THREE.SpotLight(color,intensity,20,angle,0.4)
  l.position.set(x,y,z); l.target.position.set(tx,ty,tz)
  l.castShadow=true; l.shadow.mapSize.set(512,512)
  scene.add(l); scene.add(l.target); roomObjects.push(l); roomObjects.push(l.target); return l
}
function addAmbient(color,intensity) {
  const l = new THREE.AmbientLight(color,intensity); scene.add(l); roomObjects.push(l); return l
}
function addFog(color,density) { scene.fog=new THREE.FogExp2(color,density); scene.background=new THREE.Color(color) }
function ia(x,y,z,r,label,cb) { interactables.push({pos:new THREE.Vector3(x,y,z),r,label,cb}) }

function makeNPC(x,z,bodyMat,patrol=null) {
  const g = new THREE.Group()
  // Body
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.28,1.1,10), bodyMat)
  body.position.y=0.65; g.add(body)
  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2,10,8), MAT.npcHead())
  head.position.y=1.45; g.add(head)
  g.position.set(x,0,z)
  scene.add(g); roomObjects.push(g)
  const npc = { mesh:g, patrol, patrolIdx:0, patrolT:0, state:'idle', alertLevel:0, baseX:x, baseZ:z, speed:0.015 }
  npcs.push(npc); return npc
}

function makeCameraUnit(x,y,z, ry=0) {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.15,0.12,0.25), MAT.metal())
  g.add(body)
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.06,0.1,8), MAT.emission(0xff2222))
  lens.rotation.x=Math.PI/2; lens.position.z=0.15; g.add(lens)
  g.position.set(x,y,z); g.rotation.y=ry
  scene.add(g); roomObjects.push(g)

  // Vision cone
  const coneGeo = new THREE.ConeGeometry(2,5,12,1,true)
  const coneMat = new THREE.MeshBasicMaterial({color:0xff0000,transparent:true,opacity:0.06,side:THREE.DoubleSide})
  const cone = new THREE.Mesh(coneGeo,coneMat)
  cone.rotation.x=Math.PI/2; cone.position.z=2.5; g.add(cone)

  const cam3d = { mesh:g, cone, sweepAngle:ry, sweepRange:0.7, sweepDir:1, sweepSpeed:0.4, lens }
  cameras3d.push(cam3d); return cam3d
}

// ── CLEAR ──────────────────────────────────────────────────
function clearScene() {
  roomObjects.forEach(o=>scene.remove(o))
  roomObjects=[]; npcs=[]; guards=[]; cameras3d=[]; interactables=[]
  scene.fog=null; scene.background=new THREE.Color(0x111111)
}

// ══════════════════════════════════════════════════════════
// ACT 1 — E-HUSETS TOALETT
// ══════════════════════════════════════════════════════════
function buildAct1() {
  clearScene()
  addFog(0xf0ece8, 0.03)
  addAmbient(0xfff5e0, 0.8)

  // Bathroom: 6x8 tiled room
  const W=6, D=8
  // Floor
  for(let x=0;x<W;x++) for(let z=0;z<D;z++) box(MAT.tile(), x-W/2+0.5,0,z-D/2+0.5, 1,0.1,1)
  // Ceiling
  box(MAT.ceiling(), 0,3.05,0, W,0.1,D)
  // Walls
  box(MAT.wall(), 0,1.5,-D/2, W,3,0.15)     // front
  box(MAT.wall(), 0,1.5, D/2, W,3,0.15)     // back
  box(MAT.wall(),-W/2,1.5,0,  0.15,3,D)     // left
  box(MAT.wall(), W/2,1.5,0,  0.15,3,D)     // right

  // Fluorescent lights
  box(MAT.emission(0xffffff), 0,2.95,0, 3,0.05,0.3)
  addLight(0xfff8e0, 2, 0,2.5,0, 12, true)
  addLight(0xfff8e0, 1, -1.5,2.5,-2, 8)

  // Toilet stalls (3)
  for(let i=0;i<3;i++){
    const sx=-1.5+i*1.5, sz=-2
    box(MAT.wallGray(), sx,0.9,sz-1.2, 0.1,1.8,2.4)  // side wall
    box(MAT.door(), sx+0.8,0.9,sz,   0.1,1.8,0.05)   // door (closed)
  }

  // Sinks
  for(let i=0;i<2;i++){
    box(MAT.metal(), -1.5+i*3, 0.9, D/2-0.4, 0.6,0.06,0.4)
    box(MAT.wallGray(),-1.5+i*3,0.5,D/2-0.2, 0.55,1,0.1)
  }

  // Mirror
  box(MAT.glass(), 0,1.6,D/2-0.05, 2,1,0.02)
  addLight(0x88bbff,0.3,0,1.8,D/2-0.3, 3)

  // Elina & Richard indicator (glowing spot on floor)
  const playerIndicator = box(MAT.emission(0x00e676), 0,0.06,1, 1,0.01,0.6)
  box(MAT.emission(0x00e676), 0,0.06,1, 0.9,0.01,0.5)

  // Knocking sound visual (door shake effect)
  const exitDoor = box(MAT.door(), W/2-0.08, 1.1, 1, 0.15,2.2,0.9)
  addLight(0xff4444, 0, W/2,1.5,1, 3) // red when knocking

  // Exit trigger
  ia(W/2-0.5, 1.5, 1, 1.5, 'E - Smyg ut (vänta på rätt ögonblick)', () => {
    showMsg('Du öppnar dörren försiktigt...', 'info')
    setTimeout(()=>loadAct(1), 1200)
  })

  // Clue sign
  ia(0,1.6,-D/2+0.3, 2, 'E - Spegeln talar', () => {
    showDialogue('Elina: "Vänta — de knackar fortfarande. Vi måste tajma det rätt."')
  })

  player.pos.set(0,1.6,1); player.yaw=Math.PI

  // Knocking NPC
  const knockNpc = makeNPC(W/2+0.5, 1, MAT.npc1())
  knockNpc.state='idle'

  setTimeout(()=>{ showMsg('👥 Folk knackar på dörren!', 'warn'); addLight(0xff4444,1.5,W/2,1.5,1,3) },1500)
  setTimeout(()=>{ showMsg('Richard: "Vi måste ut härifrån..."', 'info') },3500)
}

// ══════════════════════════════════════════════════════════
// ACT 2 — KORRIDOREN
// ══════════════════════════════════════════════════════════
function buildAct2() {
  clearScene()
  addFog(0x1a1a2e, 0.025)
  addAmbient(0x2a2a4a, 0.5)

  const L=40, W=5
  // Long corridor
  for(let z=0;z<L;z++){
    box(MAT.tile(), 0,-0.05,z, W,0.1,1)
    if(z%2===0) box(MAT.ceiling(), 0,3.1,z, W,0.1,1)
  }
  for(let z=0;z<L;z++){
    box(MAT.wall(),-W/2,1.5,z, 0.1,3,1)
    box(MAT.wall(), W/2,1.5,z, 0.1,3,1)
  }
  // End wall
  box(MAT.wall(), 0,1.5,L+0.05, W,3,0.1)

  // Fluorescent strips every 4m
  for(let z=2;z<L;z+=4){
    box(MAT.emission(0xe0f0ff), 0,3.0,z, 2,0.05,0.25)
    addLight(0xc0e0ff,1.5,0,2.8,z,8)
  }

  // Sofas to hide behind
  const sofaZ = [8,18,30]
  sofaZ.forEach(sz=>{
    box(MAT.sofa(), -1.5,0.45,sz, 2.5,0.9,0.9)  // seat
    box(MAT.sofaDark(),-1.5,0.95,sz-0.4, 2.5,0.5,0.15) // back
    ia(-1.5,0.9,sz, 1.8, 'E - Göm er bakom soffan', ()=>{
      showMsg('🛋️ Ni gömmer er!', 'good'); stealthVal = Math.min(100,stealthVal+15); stealth.value=stealthVal
    })
  })

  // NPC patrol groups
  makeNPC(-0.5,12, MAT.npc1(), [{x:-0.5,z:8},{x:-0.5,z:20},{x:-0.5,z:8}])
  makeNPC(0.5,13, MAT.npc2(), [{x:0.5,z:9},{x:0.5,z:22},{x:0.5,z:9}])
  makeNPC(1,25, MAT.npc3(), [{x:1,z:22},{x:1,z:38},{x:1,z:22}])
  makeNPC(-1,26, MAT.npc1(), [{x:-1,z:23},{x:-1,z:36},{x:-1,z:23}])

  // Exit door
  box(MAT.door(), 0,1.5,L-0.2, W-0.5,3,0.1)
  addLight(0x00e676,1,0,2,L-1,4)
  ia(0,1.5,L-1,2,'E - Ta er till K-huset',()=>{
    showMsg('➡️ K-huset...', 'info')
    setTimeout(()=>loadAct(2),1000)
  })

  // Notice board texture
  box(MAT.wood(), -W/2+0.12,2,5, 0.1,1,2)

  player.pos.set(0,1.6,1); player.yaw=0
  stealthVal=100; stealth.value=100

  setTimeout(()=>showMsg('Korridor: tom? Kolla på minimappen!','info'),1000)
}

// ══════════════════════════════════════════════════════════
// ACT 3 — K-HUSET
// ══════════════════════════════════════════════════════════
function buildAct3() {
  clearScene()
  addFog(0x111118, 0.018)
  addAmbient(0x151520, 0.6)

  // Open-plan floor — multiple rooms
  // Main hall
  const HW=12, HL=20
  for(let x=-HW/2;x<HW/2;x++) for(let z=0;z<HL;z++) box(MAT.tile(), x+0.5,0,z+0.5, 1,0.1,1)
  box(MAT.ceiling(), 0,3.1,HL/2, HW,0.1,HL)
  box(MAT.wall(),-HW/2,1.5,HL/2, 0.1,3,HL)
  box(MAT.wall(), HW/2,1.5,HL/2, 0.1,3,HL)
  box(MAT.wall(), 0,1.5,0, HW,3,0.1)
  box(MAT.wall(), 0,1.5,HL, HW,3,0.1)

  // Overhead fluorescents — flickery
  for(let z=3;z<HL;z+=4){
    box(MAT.emission(0xd0eaff), 0,3.0,z, 3,0.05,0.2)
    const l=addLight(0xc8deff,1.2,0,2.8,z,12)
    roomObjects.push(l)
  }

  // Grupprumsdörrar (side rooms)
  for(let z=2;z<=HL-2;z+=5){
    box(MAT.wall(), HW/2,1.5,z, 0.1,3,4)  // room divider
    box(MAT.door(), HW/2+0.05,1.1,z+2, 0.15,2.2,0.9) // door
    ia(HW/2-0.5,1.5,z+2,1.5,'E - Grupprum (göm er)', ()=>{
      showMsg('📚 Ni smiter in i grupprummet!','good'); stealthVal=Math.min(100,stealthVal+20); stealth.value=stealthVal
    })
  }

  // Study tables with students
  const tablePositions=[[0,6],[3,10],[-2,14],[2,18]]
  tablePositions.forEach(([tx,tz])=>{
    box(MAT.wood(), tx,0.4,tz, 1.8,0.05,0.9)
    // chairs
    box(MAT.sofaDark(), tx-0.4,0.2,tz+0.7, 0.5,0.4,0.5)
    box(MAT.sofaDark(), tx+0.4,0.2,tz+0.7, 0.5,0.4,0.5)
    makeNPC(tx-0.3,tz, MAT.npc2())
    makeNPC(tx+0.3,tz, MAT.npc3())
  })

  // Security cameras
  makeCameraUnit(HW/2-0.1,2.6,5, -Math.PI/2-0.3)
  makeCameraUnit(-HW/2+0.1,2.6,12, Math.PI/2+0.3)
  makeCameraUnit(0,2.8,HL-2, Math.PI)

  // Elevator
  box(MAT.metal(), HW/2-0.8,1.5,HL-1, 1.6,3,2)
  box(MAT.emission(0x44aaff),HW/2-0.8,0.8,HL-0.1, 0.6,0.3,0.05)
  addLight(0x44aaff,1.2,HW/2-0.8,1.5,HL-1,4)
  ia(HW/2-0.8,1.5,HL-1.5,2,'E - Hiss till tunnelgången',()=>{
    showMsg('🛗 Hissen tar er nerät...','info')
    setTimeout(()=>loadAct(3),1400)
  })

  // Richard being recognized easter egg
  ia(-2,1.5,8,2,'E - En bekant?',()=>{
    showDialogue('"Hallå Richard! Vad gör du här??"')
    stealthVal=Math.max(0,stealthVal-30); stealth.value=stealthVal; alerting.value=true
    setTimeout(()=>alerting.value=false,2000)
    showMsg('😱 Någon känner igen Richard!','warn')
  })

  player.pos.set(0,1.6,2); player.yaw=0
  stealthVal=100; stealth.value=100

  setTimeout(()=>showMsg('K-huset: håll ögonen öppna.','info'),800)
}

// ══════════════════════════════════════════════════════════
// ACT 4 — TUNNELGÅNGEN
// ══════════════════════════════════════════════════════════
function buildAct4() {
  clearScene()
  // Night section — very dark
  addFog(0x080808, 0.04)
  addAmbient(0x050508, 0.3)
  scene.background = new THREE.Color(0x080808)

  const L=50, W=3.5
  // Tunnel
  for(let z=0;z<L;z++){
    box(MAT.concrete(), 0,-0.05,z, W,0.1,1)
    box(MAT.dark(), 0,3.1,z, W,0.1,1)
    box(MAT.dark(),-W/2,1.5,z, 0.1,3,1)
    box(MAT.dark(), W/2,1.5,z, 0.1,3,1)
  }
  // End cap
  box(MAT.concrete(), 0,1.5,L+0.05, W,3,0.1)

  // Flickering fluorescent strips, sparse
  const flickers=[]
  for(let z=5;z<L;z+=8){
    box(MAT.emission(0xddeeff), 0,3.05,z, 1,0.04,0.15)
    const l=addLight(0xc0d8f8,0.8,0,2.9,z,8)
    flickers.push({light:l,baseInt:0.8,z,flickerT:Math.random()*10})
  }

  // Ventilation grates
  for(let z=4;z<L;z+=7){
    box(MAT.metal(),-W/2+0.1,2,z, 0.15,0.5,0.5)
    addLight(0x001133,0.2,-W/2+0.3,2,z,2)
  }

  // Pipes on ceiling
  for(let z=0;z<L;z+=2){
    box(MAT.metal(),0.8,3.0,z, 0.12,0.12,2)
    box(MAT.metal(),-0.6,2.95,z, 0.1,0.1,2)
  }

  // Occasional lamps on wall
  for(let z=3;z<L;z+=12){
    box(MAT.emission(0x8899ff),  W/2-0.1,1.8,z, 0.1,0.3,0.1)
    addLight(0x5566cc,0.6,W/2-0.3,1.8,z,5)
  }

  // Shadow figure (lone person far ahead — not NPC, just ambiance)
  const shadow = box(MAT.dark(), 0,0.9,40, 0.3,1.8,0.3)
  const shadowHead = box(MAT.dark(), 0,1.9,40, 0.25,0.25,0.25)

  // Exit door — green glow
  box(MAT.door(), 0,1.5,L-0.2, W-0.3,3,0.1)
  addLight(0x00ff88,1.5,0,1.5,L-1,6)
  ia(0,1.5,L-1.5,2,'E - V-husets källare',()=>{
    showMsg('🚪 Nästan framme...','good')
    setTimeout(()=>loadAct(4),1200)
  })

  player.pos.set(0,1.6,1); player.yaw=0
  stealthVal=100; stealth.value=100

  setTimeout(()=>showMsg('...','info'),1500)
  setTimeout(()=>showMsg('Bara framåt.','info'),3500)
}

// ══════════════════════════════════════════════════════════
// ACT 5 — V-HUSETS KÄLLARE
// ══════════════════════════════════════════════════════════
function buildAct5() {
  clearScene()
  // Quiet, safe, dim warm light
  addFog(0x100c08, 0.02)
  addAmbient(0x2a1a0a, 0.4)
  scene.background = new THREE.Color(0x0a0806)

  const W=8, D=10
  // Room
  for(let x=0;x<W;x++) for(let z=0;z<D;z++) box(MAT.concrete(), x-W/2+0.5,-0.05,z+0.5, 1,0.1,1)
  box(MAT.dark(), 0,3.1,D/2, W,0.1,D)
  box(MAT.dark(),-W/2,1.5,D/2, 0.1,3,D)
  box(MAT.dark(), W/2,1.5,D/2, 0.1,3,D)
  box(MAT.dark(), 0,1.5,0, W,3,0.1)
  box(MAT.dark(), 0,1.5,D, W,3,0.1)

  // Single lamp
  box(MAT.emission(0xffa040), 0,2.95,D/2, 0.3,0.05,0.12)
  addLight(0xff8020,1,0,2.7,D/2,10,true)
  addLight(0xff6010,0.4,-2,1,D/2-2,6)

  // The toilet stall
  box(MAT.dark(),-W/2+1.5,1.5,D-0.5, 0.1,3,2.4)
  box(MAT.dark(),-W/2+3,1.5,D-1.2, 2.4,3,0.1)
  box(MAT.door(),-W/2+3,1.1,D-0.8, 0.1,2.2,1.0)
  box(MAT.emission(0x448844),-W/2+2,2,D-0.05, 0.4,0.4,0.05) // occupied sign (green = free!)
  addLight(0x00ff88,0.5,-W/2+2,1.5,D-0.5,3)

  // Pipes, old stuff
  box(MAT.metal(), W/2-0.5,1,D/2, 0.3,2,0.3)
  box(MAT.metal(), W/2-0.5,0.5,D/2-1, 0.15,0.15,2)
  box(MAT.metal(),-0.5,2.6,D/2, 0.1,0.1,D)

  // Old chair
  box(MAT.sofaDark(), 2,0.2,3, 0.8,0.4,0.8)
  box(MAT.sofaDark(), 2,0.65,2.65, 0.8,0.7,0.1)

  // Arrive trigger
  ia(0,1.5,D-2,3,'E - Äntligen framme 🚽',()=>{
    winGame()
  })

  player.pos.set(0,1.6,2); player.yaw=0
  stealthVal=100; stealth.value=100

  setTimeout(()=>showMsg('...tyst.','info'),1000)
  setTimeout(()=>showMsg('Ingen är här.','info'),2500)
  setTimeout(()=>showMsg('Elina: "Vi klarade det." 💙','good'),4000)
}

// ── LOAD ACT ───────────────────────────────────────────────
function loadAct(idx) {
  currentAct=idx
  actLabel.value=ACTS[idx].label
  actName.value =ACTS[idx].name
  actSubtitle.value=ACTS[idx].sub

  // Show card
  showActCard.value=true
  setTimeout(()=>showActCard.value=false,2800)

  const builders=[buildAct1,buildAct2,buildAct3,buildAct4,buildAct5]
  setTimeout(()=>builders[idx](), 300)
}

// ── MESSAGES ───────────────────────────────────────────────
function showMsg(text,type='info') {
  const id=++msgId
  msgs.value.push({id,text,type})
  setTimeout(()=>{ msgs.value=msgs.value.filter(m=>m.id!==id) },3500)
}
function showDialogue(text) {
  dialogue.value=text
  dialogueTimer=4
}

// ── WIN / CAUGHT ───────────────────────────────────────────
function winGame() {
  gameActive=false
  document.exitPointerLock?.()
  screen.value='win'
  caughtCount.value=caughtCount_
  // Format time
  const m=Math.floor(gameTimeSec/60), s=Math.floor(gameTimeSec%60)
  timeStr.value=`${m}:${s.toString().padStart(2,'0')}`
}

function doCatch(reason) {
  if (caught) return
  caught=true; caughtCount_++
  caughtReason.value=reason
  stealthVal=0; stealth.value=0; alerting.value=true
  gameActive=false
  document.exitPointerLock?.()
  setTimeout(()=>{ screen.value='caught' },1000)
}

function respawn() {
  caught=false; alerting.value=false; screen.value='game'
  stealthVal=80; stealth.value=80
  gameActive=true
  loadAct(currentAct)
  setTimeout(()=>gameCanvas.value?.requestPointerLock(),200)
}

// ── PARTICLES ──────────────────────────────────────────────
function spawnPart(x,y,col) {
  const r=(col>>16)&255,g=(col>>8)&255,b=col&255
  for(let i=0;i<12;i++)
    particles2d.push({x,y,vx:(Math.random()-.5)*5,vy:-Math.random()*4-1,life:1,r,g,b,s:2+Math.random()*4})
}
function updateParts(dt) {
  pCtx.clearRect(0,0,pCanvas.width,pCanvas.height)
  particles2d=particles2d.filter(p=>{
    p.x+=p.vx;p.y+=p.vy;p.vy+=0.12;p.life-=dt*1.2
    if(p.life<=0)return false
    pCtx.beginPath();pCtx.arc(p.x,p.y,p.s*p.life,0,Math.PI*2)
    pCtx.fillStyle=`rgba(${p.r},${p.g},${p.b},${p.life})`;pCtx.fill()
    return true
  })
}

// ── NPC UPDATE ─────────────────────────────────────────────
function updateNPCs(dt) {
  npcs.forEach(npc=>{
    if (!npc.patrol||npc.patrol.length<2) return
    const target=npc.patrol[npc.patrolIdx]
    const tx=target.x, tz=target.z
    const dx=tx-npc.mesh.position.x, dz=tz-npc.mesh.position.z
    const dist=Math.sqrt(dx*dx+dz*dz)
    if(dist<0.2) { npc.patrolIdx=(npc.patrolIdx+1)%npc.patrol.length; return }
    const speed=npc.speed*(sneaking.value?1:1)
    npc.mesh.position.x+=dx/dist*speed
    npc.mesh.position.z+=dz/dist*speed
    npc.mesh.rotation.y=Math.atan2(dx,dz)

    // Check if NPC sees player
    const pd=player.pos.distanceTo(npc.mesh.position)
    if(pd<3&&!sneaking.value){
      npc.alertLevel=Math.min(100,npc.alertLevel+dt*40)
    } else if(pd<4.5&&sneaking.value){
      npc.alertLevel=Math.min(100,npc.alertLevel+dt*8)
    } else {
      npc.alertLevel=Math.max(0,npc.alertLevel-dt*15)
    }
    if(npc.alertLevel>90&&!caught) doCatch('En student såg er!')
  })
}

// ── CAMERA SWEEP ───────────────────────────────────────────
function updateCameras(dt) {
  cameras3d.forEach(cam=>{
    cam.sweepAngle+=cam.sweepDir*cam.sweepSpeed*dt
    if(cam.sweepAngle>cam.sweepRange/2||cam.sweepAngle<-cam.sweepRange/2) cam.sweepDir*=-1
    cam.mesh.rotation.y=cam.sweepAngle

    // Lens color
    const cone=cam.cone
    // Project camera forward
    const fwd=new THREE.Vector3(0,0,1).applyQuaternion(cam.mesh.quaternion)
    const toPlayer=new THREE.Vector3().subVectors(player.pos,cam.mesh.getWorldPosition(new THREE.Vector3()))
    toPlayer.y=0; const dist=toPlayer.length()
    if(dist<6){
      toPlayer.normalize()
      const ang=fwd.angleTo(toPlayer)
      if(ang<0.35){
        cam.lens.material.color.set(0xff2222)
        if(!sneaking.value){
          stealthVal=Math.max(0,stealthVal-dt*25); stealth.value=stealthVal
          if(stealthVal<10&&!caught) doCatch('Kameran fångade er!')
        } else {
          stealthVal=Math.max(0,stealthVal-dt*8); stealth.value=stealthVal
        }
      } else {
        cam.lens.material.color.set(0x00ff44)
      }
    } else {
      cam.lens.material.color.set(0x00ff44)
    }
  })
}

// ── STEALTH RECOVERY ───────────────────────────────────────
function updateStealth(dt) {
  if(sneaking.value&&stealthVal<100){
    stealthVal=Math.min(100,stealthVal+dt*5)
    stealth.value=stealthVal
  }
  alerting.value = stealthVal<30
}

// ── LIGHT FLICKER ──────────────────────────────────────────
let flickerAcc=0
function updateFlicker(dt) {
  flickerAcc+=dt
  if(flickerAcc>0.08){
    flickerAcc=0
    if(currentAct===3||currentAct===4){
      scene.children.forEach(c=>{
        if(c.isPointLight&&Math.random()<0.05){
          c.intensity*=(0.4+Math.random()*0.8)
        }
      })
    }
  }
}

// ── GAME LOOP ──────────────────────────────────────────────
function animate() {
  rafId=requestAnimationFrame(animate)
  if(!clock) return
  const dt=Math.min(clock.getDelta(),0.05)
  if(!gameActive||caught) { if(renderer) renderer.render(scene,camera); return }

  gameTimeSec+=dt

  // Sneak
  sneaking.value = keys['ShiftLeft']||keys['ShiftRight']
  const spd = sneaking.value ? 0.04 : 0.07

  // Move
  if(mouseLocked){
    const fwd=new THREE.Vector3(-Math.sin(player.yaw),0,-Math.cos(player.yaw))
    const rgt=new THREE.Vector3( Math.cos(player.yaw),0,-Math.sin(player.yaw))
    const mv=new THREE.Vector3()
    if(keys['KeyW']||keys['ArrowUp'])    mv.add(fwd)
    if(keys['KeyS']||keys['ArrowDown'])  mv.sub(fwd)
    if(keys['KeyA']||keys['ArrowLeft'])  mv.sub(rgt)
    if(keys['KeyD']||keys['ArrowRight']) mv.add(rgt)
    if(mv.length()>0){ mv.normalize().multiplyScalar(spd); player.pos.add(mv) }
    // Clamp
    player.pos.x=Math.max(-8,Math.min(8,player.pos.x))
    player.pos.z=Math.max(-2,Math.min(55,player.pos.z))

    camera.position.copy(player.pos)
    // Bob when walking
    const bob = mv.length()>0 ? Math.sin(Date.now()*0.008)*0.03 : 0
    camera.position.y+=bob
    camera.rotation.order='YXZ'
    camera.rotation.y=player.yaw
    camera.rotation.x=player.pitch
  }

  // Nearest interactable
  let best=null,bestD=Infinity
  interactables.forEach(ia=>{
    const d=player.pos.distanceTo(ia.pos)
    if(d<ia.r&&d<bestD){bestD=d;best=ia}
  })
  nearestIA=best; interactLabel.value=best?best.label:''

  updateNPCs(dt)
  updateCameras(dt)
  updateStealth(dt)
  updateFlicker(dt)
  updateParts(dt)

  if(dialogueTimer>0){ dialogueTimer-=dt; if(dialogueTimer<=0) dialogue.value='' }

  renderer.render(scene,camera)
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Syne+Mono&display=swap');

.game-root {
  position: fixed; inset: 0;
  background: #000;
  font-family: 'Syne', sans-serif;
  overflow: hidden; user-select: none;
}

canvas {
  display: block; position: fixed; inset: 0;
  width: 100%; height: 100%;
}
.particle-canvas { pointer-events: none; z-index: 15; }

/* ── START SCREEN ── */
.overlay-screen {
  position: fixed; inset: 0; z-index: 200;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 18px; text-align: center; padding: 24px;
}
.start-screen {
  background: radial-gradient(ellipse 70% 60% at 50% 40%, #0d0a14, #000);
}
.title-eyebrow {
  font-family: 'Syne Mono', monospace; font-size: 10px;
  letter-spacing: 6px; color: #554466; text-transform: uppercase;
  margin-bottom: 4px;
}
.title-main {
  font-size: clamp(40px,8vw,90px); font-weight: 800;
  letter-spacing: -2px; line-height: 1;
  background: linear-gradient(135deg, #fff 30%, #aa88ff 80%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.title-sub {
  font-size: clamp(12px,2vw,18px); color: #6655aa;
  letter-spacing: 4px; text-transform: uppercase;
  font-weight: 600; margin-top: -6px;
}
.start-desc {
  font-size: 16px; color: #888; line-height: 1.8;
  max-width: 440px; margin-top: 8px;
}
.start-desc em { color: #ff6688; font-style: normal; font-weight: 700; }
.btn-start {
  background: transparent; border: 1px solid #6655aa;
  color: #cc99ff; font-family: 'Syne Mono', monospace;
  font-size: 13px; letter-spacing: 4px; padding: 14px 40px;
  cursor: pointer; transition: all .2s; text-transform: uppercase;
  margin-top: 8px;
}
.btn-start:hover {
  background: #6655aa22; border-color: #cc99ff;
  box-shadow: 0 0 30px #6655aa44; color: #fff;
}
.controls-hint {
  font-family: 'Syne Mono', monospace; font-size: 10px;
  color: #333; letter-spacing: 2px; margin-top: 8px;
}

/* ── HUD ── */
.hud { position: fixed; inset: 0; z-index: 20; pointer-events: none; }

.hud-top {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 20px 24px;
}
.hud-act {
  background: rgba(0,0,0,0.7); border: 1px solid #333;
  padding: 10px 16px; backdrop-filter: blur(8px);
}
.hud-act-num {
  display: block; font-family: 'Syne Mono', monospace; font-size: 9px;
  letter-spacing: 3px; color: #664488; text-transform: uppercase;
}
.hud-act-name {
  display: block; font-size: 14px; font-weight: 700; color: #e0d4f4;
  letter-spacing: 1px; margin-top: 3px;
}
.hud-stealth {
  background: rgba(0,0,0,0.7); border: 1px solid #333;
  padding: 10px 16px; backdrop-filter: blur(8px); min-width: 160px;
}
.hud-stealth-label {
  display: block; font-family: 'Syne Mono', monospace; font-size: 9px;
  letter-spacing: 3px; color: #444; text-transform: uppercase; margin-bottom: 6px;
}
.stealth-bar {
  height: 4px; background: #222; border-radius: 2px; overflow: hidden;
}
.stealth-fill {
  height: 100%; transition: width .3s, background .4s; border-radius: 2px;
}

.alert-border {
  position: fixed; inset: 0; border: 4px solid transparent;
  pointer-events: none; transition: all .2s;
}
.alert-border.active {
  border-color: #ff2244;
  animation: alertPulse .35s infinite alternate;
  background: rgba(255,34,68,0.04);
}
@keyframes alertPulse {
  from { border-color: #ff2244; }
  to   { border-color: transparent; }
}

.crosshair {
  position: fixed; top: 50%; left: 50%;
  transform: translate(-50%,-50%); width: 16px; height: 16px;
  pointer-events: none;
}
.crosshair::before,.crosshair::after {
  content: ''; position: absolute; background: rgba(255,255,255,0.7);
}
.crosshair::before { width: 1.5px; height: 100%; left: 50%; transform: translateX(-50%); }
.crosshair::after  { height: 1.5px; width: 100%; top: 50%; transform: translateY(-50%); }

.interact-hint {
  position: fixed; bottom: 120px; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,0.8); border: 1px solid #333;
  padding: 8px 20px; font-size: 13px; letter-spacing: 1px; color: #ccc;
  opacity: 0; transition: opacity .2s; white-space: nowrap;
  backdrop-filter: blur(8px);
}
.interact-hint.show { opacity: 1; }
.interact-key {
  display: inline-block; background: #333; border: 1px solid #666;
  padding: 2px 7px; font-family: 'Syne Mono',monospace; font-size: 11px;
  color: #fff; border-radius: 2px; margin-right: 6px;
}

.sneak-indicator {
  position: fixed; bottom: 80px; right: 24px;
  background: rgba(0,0,0,0.7); border: 1px solid #222;
  padding: 8px 14px; font-size: 13px; color: #555;
  transition: all .3s; letter-spacing: 2px;
}
.sneak-indicator.sneaking {
  border-color: #446644; color: #88ff88;
  box-shadow: 0 0 12px rgba(68,200,68,0.2);
}

/* ── MESSAGES ── */
.msg-feed {
  position: fixed; top: 80px; left: 24px;
  display: flex; flex-direction: column; gap: 6px;
  pointer-events: none; z-index: 25;
}
.msg-item {
  background: rgba(0,0,0,0.85); border-left: 2px solid #444;
  padding: 7px 14px; font-size: 13px; color: #ccc; max-width: 320px;
  letter-spacing: 0.5px; backdrop-filter: blur(4px);
}
.msg-item.warn  { border-color: #ff4444; color: #ffaaaa; }
.msg-item.good  { border-color: #00e676; color: #aaffe0; }
.msg-enter-active { transition: all .3s; }
.msg-leave-active { transition: all .4s; }
.msg-enter-from { opacity:0; transform:translateX(-16px); }
.msg-leave-to   { opacity:0; transform:translateX(-16px); }

/* ── DIALOGUE ── */
.dialogue-box {
  position: fixed; bottom: 160px; left: 50%; transform: translateX(-50%);
  background: rgba(5,3,12,0.92); border: 1px solid #4a3a66;
  padding: 16px 24px; max-width: 520px; min-width: 200px;
  font-size: 15px; color: #ddd; text-align: center;
  opacity: 0; transition: opacity .3s; pointer-events: none;
  backdrop-filter: blur(10px);
}
.dialogue-box.show { opacity: 1; }

/* ── ACT CARD ── */
.act-card {
  position: fixed; top: 50%; left: 50%;
  transform: translate(-50%,-50%);
  text-align: center; z-index: 100; pointer-events: none;
}
.act-card-num {
  font-family: 'Syne Mono', monospace; font-size: 11px;
  letter-spacing: 6px; color: #6655aa; text-transform: uppercase; margin-bottom: 6px;
}
.act-card-title {
  font-size: clamp(28px,5vw,52px); font-weight: 800;
  color: #fff; letter-spacing: -1px;
  text-shadow: 0 0 60px rgba(150,100,255,0.5);
}
.act-card-sub {
  font-size: 14px; color: #666; letter-spacing: 2px;
  margin-top: 10px; font-weight: 400;
}

/* ── WIN ── */
.win-screen {
  background: radial-gradient(ellipse 60% 50% at 50% 50%, #0a1a0a, #000);
}
.win-emoji { font-size: 80px; margin-bottom: 8px; }
.win-title {
  font-size: clamp(40px,7vw,80px); font-weight: 800;
  background: linear-gradient(135deg, #88ffbb, #00e676);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  letter-spacing: -2px;
}
.win-sub { font-size: 16px; color: #558855; letter-spacing: 2px; }
.win-stats { display: flex; gap: 40px; margin: 16px 0; }
.stat { font-size: 14px; color: #446644; letter-spacing: 1px; }
.stat span { display: block; font-size: 32px; font-weight: 800; color: #66ff99; }

/* ── CAUGHT ── */
.caught-screen {
  background: radial-gradient(ellipse 60% 50% at 50% 50%, #1a0008, #000);
}
.caught-icon { font-size: 80px; }
.caught-title {
  font-size: clamp(36px,6vw,70px); font-weight: 800; color: #ff2244;
  letter-spacing: -1px; text-shadow: 0 0 40px rgba(255,34,68,0.4);
}
.caught-reason { font-size: 16px; color: #884455; letter-spacing: 2px; }

/* ── TRANSITIONS ── */
.fade-enter-active,.fade-leave-active { transition: opacity .5s; }
.fade-enter-from,.fade-leave-to { opacity: 0; }

.act-slide-enter-active { transition: all .6s cubic-bezier(0.22,1,0.36,1); }
.act-slide-leave-active { transition: all .5s ease-in; }
.act-slide-enter-from { opacity:0; transform:translate(-50%,-40%); }
.act-slide-leave-to   { opacity:0; transform:translate(-50%,-60%); }


/* ── POLISHED ROUNDED UI OVERRIDES ── */
.overlay-screen {
  background-size: 140% 140%;
}

.start-screen::before,
.win-screen::before,
.caught-screen::before {
  content: '';
  position: absolute;
  inset: 28px;
  border-radius: 42px;
  border: 1px solid rgba(190, 160, 255, 0.12);
  pointer-events: none;
  box-shadow: inset 0 0 80px rgba(255, 255, 255, 0.025), 0 0 70px rgba(100, 80, 180, 0.12);
}

.start-desc,
.controls-hint,
.hud-act,
.hud-stealth,
.msg-item,
.dialogue-box,
.interact-hint,
.sneak-indicator,
.act-card {
  border-radius: 22px;
}

.start-desc {
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(16px);
}

.btn-start {
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(102, 85, 170, 0.22), rgba(204, 153, 255, 0.08));
  box-shadow: 0 18px 60px rgba(102, 85, 170, 0.18);
}

.btn-start:hover {
  box-shadow: 0 22px 80px rgba(204, 153, 255, 0.26);
}

.hud-act,
.hud-stealth,
.msg-item,
.dialogue-box,
.interact-hint,
.sneak-indicator {
  border-color: rgba(180, 150, 255, 0.16);
  background: rgba(4, 3, 10, 0.72);
  box-shadow: 0 20px 70px rgba(0, 0, 0, 0.32);
}

.stealth-bar,
.stealth-fill {
  border-radius: 999px;
}

.act-card {
  padding: 28px 38px;
  background: rgba(0, 0, 0, 0.48);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(18px);
  box-shadow: 0 30px 120px rgba(0, 0, 0, 0.55);
}

.crosshair::before,
.crosshair::after {
  border-radius: 999px;
}

@media (max-width: 720px) {
  .hud-top {
    padding: 14px;
    gap: 10px;
  }

  .hud-act,
  .hud-stealth {
    padding: 9px 12px;
    border-radius: 18px;
  }

  .controls-hint {
    max-width: 340px;
    line-height: 1.8;
  }
}

</style>
