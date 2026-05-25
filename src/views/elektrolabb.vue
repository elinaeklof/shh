<template>
  <div id="game-container">
    <canvas ref="canvas"></canvas>

    <!-- HUD -->
    <div class="hud" v-if="gameState === 'playing'">
      <div class="hud-tasks">
        <div class="hud-title">UPPGIFTER</div>
        <div v-for="task in tasks" :key="task.id" class="task-item" :class="{ done: task.done }">
          <span class="task-icon">{{ task.done ? '✓' : '○' }}</span>
          {{ task.label }}
        </div>
      </div>
      <div class="hud-danger" :class="{ alert: dangerLevel > 0.6 }">
        <div class="danger-label">KEMIST RISK</div>
        <div class="danger-bar">
          <div class="danger-fill" :style="{ width: (dangerLevel * 100) + '%' }"></div>
        </div>
      </div>
      <div class="hud-stamina">
        <div class="stamina-label">ENERGI</div>
        <div class="stamina-bar">
          <div class="stamina-fill" :style="{ width: stamina + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- Controls hint -->
    <div class="controls-hint" v-if="gameState === 'playing'">
      <span>WASD/Piltangenter: Rör dig</span>
      <span>Shift: Spring</span>
      <span>E: Interagera</span>
    </div>

    <!-- Interaction prompt -->
    <div class="interact-prompt" v-if="interactPrompt && gameState === 'playing'">
      <span class="key">E</span> {{ interactPrompt }}
    </div>

    <!-- Mini-task overlay -->
    <div class="minigame-overlay" v-if="activeMinigame">
      <!-- Circuit wiring -->
      <div v-if="activeMinigame === 'circuit'" class="minigame-panel">
        <div class="mg-title">⚡ KOPPLA KRETSEN</div>
        <div class="mg-desc">Klicka noderna i rätt ordning: Batteri → Resistor → LED</div>
        <div class="circuit-nodes">
          <div
            v-for="node in circuitNodes"
            :key="node.id"
            class="circuit-node"
            :class="{ active: node.active, wrong: node.wrong }"
            @click="clickCircuitNode(node)"
          >{{ node.label }}</div>
        </div>
        <div class="mg-status">{{ circuitStatus }}</div>
        <button class="mg-close" @click="closeMinigame">✕ Avbryt</button>
      </div>

      <!-- Chemical formula -->
      <div v-if="activeMinigame === 'formula'" class="minigame-panel">
        <div class="mg-title">🧪 BALANSERA FORMELN</div>
        <div class="mg-desc">Välj rätt koefficienter för att balansera: H₂ + O₂ → H₂O</div>
        <div class="formula-picker">
          <div v-for="option in formulaOptions" :key="option.id"
            class="formula-option"
            :class="{ selected: option.selected, correct: option.correct, wrong: option.wrong }"
            @click="selectFormula(option)">
            {{ option.label }}
          </div>
        </div>
        <div class="mg-status">{{ formulaStatus }}</div>
        <button class="mg-close" @click="closeMinigame">✕ Avbryt</button>
      </div>

      <!-- Voltage tuner -->
      <div v-if="activeMinigame === 'voltage'" class="minigame-panel">
        <div class="mg-title">🔌 JUSTERA SPÄNNINGEN</div>
        <div class="mg-desc">Dra reglaget till exakt 9.0V</div>
        <div class="voltage-display">{{ voltageValue.toFixed(1) }}V</div>
        <input type="range" min="0" max="24" step="0.1" v-model="voltageSlider" class="voltage-slider" />
        <div class="voltage-target">Mål: 9.0V</div>
        <button class="mg-btn" @click="confirmVoltage">Bekräfta</button>
        <button class="mg-close" @click="closeMinigame">✕ Avbryt</button>
      </div>

      <!-- Password hack -->
      <div v-if="activeMinigame === 'hack'" class="minigame-panel">
        <div class="mg-title">💻 KNÄCK KODEN</div>
        <div class="mg-desc">Ange koden: summan av 12 + 7 × 3</div>
        <div class="hack-display">
          <input
            v-model="hackInput"
            class="hack-input"
            maxlength="4"
            placeholder="___"
            @keyup.enter="confirmHack"
          />
        </div>
        <button class="mg-btn" @click="confirmHack">Bekräfta</button>
        <div class="mg-status">{{ hackStatus }}</div>
        <button class="mg-close" @click="closeMinigame">✕ Avbryt</button>
      </div>
    </div>

    <!-- Start screen -->
    <div class="start-screen" v-if="gameState === 'start'">
      <div class="start-content">
        <div class="start-logo">⚗️</div>
        <div class="start-title">ELEKTROLABB<br><span>ESCAPE</span></div>
        <div class="start-sub">Du är instängd i labbet.<br>Kemisten patrullerar korridorerna.<br>Slutför uppgifterna och ta dig ut — utan att bli upptäckt.</div>
        <button class="start-btn" @click="startGame">STARTA EXPERIMENT</button>
      </div>
    </div>

    <!-- Win screen -->
    <div class="end-screen win" v-if="gameState === 'win'">
      <div class="end-content">
        <div class="end-icon">🏆</div>
        <div class="end-title">FRIHET!</div>
        <div class="end-sub">Du lyckades slutföra alla uppgifter och fly från labbet!</div>
        <button class="start-btn" @click="restartGame">SPELA IGEN</button>
      </div>
    </div>

    <!-- Lose screen -->
    <div class="end-screen lose" v-if="gameState === 'lose'">
      <div class="end-content">
        <div class="end-icon">☠️</div>
        <div class="end-title">UPPTÄCKT!</div>
        <div class="end-sub">Kemisten hittade dig. Experimentet misslyckades.</div>
        <button class="start-btn" @click="restartGame">FÖRSÖK IGEN</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js'

// ─── State ───────────────────────────────────────────────────────────────────
const canvas = ref(null)
const gameState = ref('start')
const dangerLevel = ref(0)
const stamina = ref(100)
const interactPrompt = ref('')
const activeMinigame = ref(null)

const tasks = ref([
  { id: 'circuit', label: 'Koppla elkretsen', done: false },
  { id: 'formula', label: 'Balansera kemiformeln', done: false },
  { id: 'voltage', label: 'Justera spänningsaggregatet', done: false },
  { id: 'hack', label: 'Knäck säkerhetskoden', done: false },
])

// Circuit minigame
const circuitOrder = ['battery', 'resistor', 'led']
const circuitSequence = ref([])
const circuitStatus = ref('Börja med batteriet...')
const circuitNodes = ref([
  { id: 'led', label: '💡 LED', active: false, wrong: false },
  { id: 'battery', label: '🔋 Batteri', active: false, wrong: false },
  { id: 'resistor', label: '⬛ Resistor', active: false, wrong: false },
])

// Formula minigame
const formulaOptions = ref([
  { id: 'a', label: '2H₂ + O₂ → 2H₂O', selected: false, correct: false, wrong: false },
  { id: 'b', label: 'H₂ + O₂ → H₂O', selected: false, correct: false, wrong: false },
  { id: 'c', label: '4H₂ + 2O₂ → 4H₂O', selected: false, correct: false, wrong: false },
])
const formulaStatus = ref('')

// Voltage minigame
const voltageSlider = ref(12)
const voltageValue = computed(() => parseFloat(voltageSlider.value))

// Hack minigame
const hackInput = ref('')
const hackStatus = ref('')

// ─── Three.js refs ────────────────────────────────────────────────────────────
let renderer, scene, camera, clock
let player, chemist
let keys = {}
let animFrame
let interactables = []
let nearbyTask = null

function startGame() {
  gameState.value = 'playing'
  initThree()
}

function restartGame() {
  // Reset all state
  tasks.value.forEach(t => t.done = false)
  dangerLevel.value = 0
  stamina.value = 100
  activeMinigame.value = null
  circuitSequence.value = []
  circuitNodes.value.forEach(n => { n.active = false; n.wrong = false })
  formulaOptions.value.forEach(o => { o.selected = false; o.correct = false; o.wrong = false })
  formulaStatus.value = ''
  voltageSlider.value = 12
  hackInput.value = ''
  hackStatus.value = ''
  nearbyTask = null
  keys = {}

  if (renderer) {
    renderer.dispose()
    renderer = null
  }
  cancelAnimationFrame(animFrame)

  gameState.value = 'playing'
  setTimeout(initThree, 50)
}

// ─── Three.js setup ───────────────────────────────────────────────────────────
function initThree() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a0f1a)
  scene.fog = new THREE.Fog(0x0a0f1a, 10, 40)

  clock = new THREE.Clock()

  renderer = new THREE.WebGLRenderer({ canvas: canvas.value, antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
  camera.position.set(0, 2.5, 0)

  buildLab()
  buildPlayer()
  buildChemist()
  buildInteractables()
  buildLights()

  window.addEventListener('keydown', onKey)
  window.addEventListener('keyup', offKey)
  window.addEventListener('resize', onResize)

  loop()
}

function buildLights() {
  // Ambient
  const ambient = new THREE.AmbientLight(0x112233, 0.8)
  scene.add(ambient)

  // Overhead fluorescent strips
  const positions = [[-6,4,0],[0,4,0],[6,4,0],[0,4,-8],[0,4,8]]
  positions.forEach(([x,y,z]) => {
    const light = new THREE.PointLight(0x88ddff, 2, 14)
    light.position.set(x,y,z)
    light.castShadow = true
    scene.add(light)

    // Light tube geometry
    const tubeGeo = new THREE.BoxGeometry(2, 0.08, 0.15)
    const tubeMat = new THREE.MeshStandardMaterial({ color: 0xccffff, emissive: 0x88ddff, emissiveIntensity: 2 })
    const tube = new THREE.Mesh(tubeGeo, tubeMat)
    tube.position.set(x, 3.9, z)
    scene.add(tube)
  })

  // Danger red accent
  const redLight = new THREE.PointLight(0xff2200, 1.5, 8)
  redLight.position.set(8, 2, -8)
  scene.add(redLight)
}

function buildLab() {
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x0d1f2d,
    roughness: 0.3,
    metalness: 0.4,
  })
  const floorGeo = new THREE.PlaneGeometry(24, 24)
  const floor = new THREE.Mesh(floorGeo, floorMat)
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)

  // Grid lines on floor
  const gridHelper = new THREE.GridHelper(24, 24, 0x1a4060, 0x0d2535)
  gridHelper.position.y = 0.01
  scene.add(gridHelper)

  // Walls
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x0e1c2a, roughness: 0.8, metalness: 0.1 })
  const wallConfigs = [
    [24, 5, 0.2, 0, 2.5, -12],
    [24, 5, 0.2, 0, 2.5, 12],
    [0.2, 5, 24, -12, 2.5, 0],
    [0.2, 5, 24, 12, 2.5, 0],
  ]
  wallConfigs.forEach(([w,h,d,x,y,z]) => {
    const g = new THREE.BoxGeometry(w,h,d)
    const m = new THREE.Mesh(g, wallMat)
    m.position.set(x,y,z)
    m.receiveShadow = true
    scene.add(m)
  })

  // Ceiling
  const ceilGeo = new THREE.PlaneGeometry(24, 24)
  const ceilMat = new THREE.MeshStandardMaterial({ color: 0x080e18, roughness: 1 })
  const ceil = new THREE.Mesh(ceilGeo, ceilMat)
  ceil.rotation.x = Math.PI / 2
  ceil.position.y = 5
  scene.add(ceil)

  // Lab benches
  addLabBench(-4, 0, -6, 5, 1.2)
  addLabBench(4, 0, -6, 5, 1.2)
  addLabBench(-6, 0, 3, 1.2, 5)
  addLabBench(6, 0, 3, 1.2, 5)

  // Equipment decorations
  addBeaker(-4, 1.25, -6, 0x00ffaa)
  addBeaker(-3.3, 1.25, -6.3, 0xff4400)
  addBeaker(4.5, 1.25, -6, 0x4444ff)
  addMonitor(5, 1.25, -5.2)
  addComputer(-5, 1.25, -5.2)

  // Exit door
  addDoor(11.8, 0, 0)
}

function addLabBench(x, y, z, w, d) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x1a3040, roughness: 0.4, metalness: 0.6 })
  const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, d), mat)
  top.position.set(x, y + 1.2, z)
  top.castShadow = true
  top.receiveShadow = true
  scene.add(top)

  // Legs
  const legMat = new THREE.MeshStandardMaterial({ color: 0x223344, metalness: 0.8 })
  const offsets = [
    [w/2-0.1, d/2-0.1],
    [w/2-0.1, -(d/2-0.1)],
    [-(w/2-0.1), d/2-0.1],
    [-(w/2-0.1), -(d/2-0.1)],
  ]
  offsets.forEach(([ox, oz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.1), legMat)
    leg.position.set(x + ox, y + 0.6, z + oz)
    scene.add(leg)
  })
}

function addBeaker(x, y, z, color) {
  const mat = new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.7, roughness: 0.1, metalness: 0.1 })
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.35, 16), mat)
  body.position.set(x, y + 0.175, z)
  body.castShadow = true
  scene.add(body)

  // Glow
  const glowMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.8, transparent: true, opacity: 0.3 })
  const glow = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.38, 16), glowMat)
  glow.position.set(x, y + 0.19, z)
  scene.add(glow)

  const light = new THREE.PointLight(color, 0.5, 2)
  light.position.set(x, y + 0.3, z)
  scene.add(light)
}

function addMonitor(x, y, z) {
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 })
  const screenMat = new THREE.MeshStandardMaterial({ color: 0x003322, emissive: 0x00ff88, emissiveIntensity: 0.4 })

  const base = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.3), baseMat)
  base.position.set(x, y, z)
  scene.add(base)

  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.05), screenMat)
  screen.position.set(x, y + 0.25, z - 0.1)
  scene.add(screen)
}

function addComputer(x, y, z) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, metalness: 0.7 })
  const screenMat = new THREE.MeshStandardMaterial({ color: 0x001133, emissive: 0x0066ff, emissiveIntensity: 0.5 })
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.15), mat)
  box.position.set(x, y + 0.17, z)
  scene.add(box)
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.3), screenMat)
  screen.position.set(x, y + 0.17, z - 0.08)
  scene.add(screen)
}

function addDoor(x, y, z) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00ff44, emissiveIntensity: 0.5, metalness: 0.8 })
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 1.5), mat)
  door.position.set(x, y + 1.5, z)
  scene.add(door)

  // Door frame
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x007744, metalness: 0.9 })
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3.2, 1.7), frameMat)
  frame.position.set(x, y + 1.6, z)
  scene.add(frame)

  const exitLight = new THREE.PointLight(0x00ff88, 2, 5)
  exitLight.position.set(x - 1, 2, z)
  scene.add(exitLight)
}

function buildPlayer() {
  const group = new THREE.Group()

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2266cc, roughness: 0.5 })
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.7, 4, 8), bodyMat)
  body.position.y = 0.95
  group.add(body)

  const headMat = new THREE.MeshStandardMaterial({ color: 0xffcc99, roughness: 0.4 })
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), headMat)
  head.position.y = 1.65
  group.add(head)

  group.position.set(0, 0, 6)
  scene.add(group)
  player = group
}

function buildChemist() {
  const group = new THREE.Group()

  const coatMat = new THREE.MeshStandardMaterial({ color: 0xeeeeff, roughness: 0.7 })
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.27, 0.75, 4, 8), coatMat)
  body.position.y = 0.95
  group.add(body)

  const headMat = new THREE.MeshStandardMaterial({ color: 0xffbb88, roughness: 0.4 })
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), headMat)
  head.position.y = 1.7
  group.add(head)

  // Goggles
  const gogMat = new THREE.MeshStandardMaterial({ color: 0x333300, emissive: 0xffdd00, emissiveIntensity: 0.5 })
  const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.1, 0.08), gogMat)
  goggles.position.set(0, 1.75, 0.2)
  group.add(goggles)

  // Danger aura
  const auraMat = new THREE.MeshStandardMaterial({ color: 0xff2200, transparent: true, opacity: 0.15, side: THREE.DoubleSide })
  const aura = new THREE.Mesh(new THREE.SphereGeometry(2, 16, 16), auraMat)
  aura.position.y = 1
  group.add(aura)
  group._aura = aura

  group.position.set(-5, 0, -3)
  group._speed = 1.8
  group._target = new THREE.Vector3(5, 0, -3)
  group._patrolPoints = [
    new THREE.Vector3(-5, 0, -3),
    new THREE.Vector3(5, 0, -3),
    new THREE.Vector3(5, 0, 5),
    new THREE.Vector3(-5, 0, 5),
  ]
  group._patrolIdx = 0

  scene.add(group)
  chemist = group
}

function buildInteractables() {
  const positions = [
    { id: 'circuit', x: -4, z: -4.5, color: 0xffaa00, label: 'Koppla elkretsen' },
    { id: 'formula', x: 4, z: -4.5, color: 0x00ccff, label: 'Balansera formeln' },
    { id: 'voltage', x: -5.5, z: 4, color: 0xff00aa, label: 'Justera spänning' },
    { id: 'hack', x: 5.5, z: 4, color: 0x44ff44, label: 'Knäck koden' },
    { id: 'exit', x: 10, z: 0, color: 0x00ff88, label: 'Ta dig ut!' },
  ]

  positions.forEach(pos => {
    const mat = new THREE.MeshStandardMaterial({
      color: pos.color, emissive: pos.color, emissiveIntensity: 0.6,
      transparent: true, opacity: 0.85, metalness: 0.5
    })
    const geo = new THREE.OctahedronGeometry(0.35, 0)
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(pos.x, 1.5, pos.z)
    mesh.castShadow = true
    mesh._taskId = pos.id
    mesh._label = pos.label
    mesh._baseY = 1.5
    mesh._originalEmissive = pos.color
    scene.add(mesh)
    interactables.push(mesh)

    // Glow ring
    const ringGeo = new THREE.TorusGeometry(0.5, 0.05, 8, 32)
    const ringMat = new THREE.MeshStandardMaterial({ color: pos.color, emissive: pos.color, emissiveIntensity: 1 })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.position.set(pos.x, 0.1, pos.z)
    ring.rotation.x = Math.PI / 2
    scene.add(ring)
  })
}

// ─── Game loop ────────────────────────────────────────────────────────────────
function loop() {
  animFrame = requestAnimationFrame(loop)
  if (gameState.value !== 'playing') return

  const dt = clock.getDelta()
  updatePlayer(dt)
  updateChemist(dt)
  updateInteractables(dt)
  checkInteraction()
  checkWinLose()
  renderer.render(scene, camera)
}

function updatePlayer(dt) {
  if (activeMinigame.value) return

  const speed = (keys['ShiftLeft'] || keys['ShiftRight']) ? 6 : 3
  const dir = new THREE.Vector3()

  if (keys['KeyW'] || keys['ArrowUp'])    dir.z -= 1
  if (keys['KeyS'] || keys['ArrowDown'])  dir.z += 1
  if (keys['KeyA'] || keys['ArrowLeft'])  dir.x -= 1
  if (keys['KeyD'] || keys['ArrowRight']) dir.x += 1

  if (dir.length() > 0) {
    dir.normalize()
    const angle = Math.atan2(dir.x, dir.z)
    player.rotation.y = angle

    // Stamina
    if (speed > 3) {
      stamina.value = Math.max(0, stamina.value - dt * 20)
      if (stamina.value === 0) {
        // slow down
      }
    } else {
      stamina.value = Math.min(100, stamina.value + dt * 8)
    }

    const actualSpeed = stamina.value < 5 ? 2 : speed
    player.position.x += dir.x * actualSpeed * dt
    player.position.z += dir.z * actualSpeed * dt

    // Clamp to lab bounds
    player.position.x = Math.max(-11, Math.min(11, player.position.x))
    player.position.z = Math.max(-11, Math.min(11, player.position.z))
  }

  // Camera follows player
  camera.position.x = player.position.x
  camera.position.z = player.position.z + 0.2
  camera.position.y = player.position.y + 2.5
  camera.lookAt(player.position.x, player.position.y + 1, player.position.z - 3)
}

function updateChemist(dt) {
  const target = chemist._patrolPoints[chemist._patrolIdx]
  const dir = new THREE.Vector3().subVectors(target, chemist.position)
  dir.y = 0

  if (dir.length() < 0.5) {
    chemist._patrolIdx = (chemist._patrolIdx + 1) % chemist._patrolPoints.length
  } else {
    dir.normalize()
    chemist.position.x += dir.x * chemist._speed * dt
    chemist.position.z += dir.z * chemist._speed * dt
    chemist.rotation.y = Math.atan2(dir.x, dir.z)
  }

  // Aura pulse
  const t = clock.getElapsedTime()
  if (chemist._aura) {
    chemist._aura.material.opacity = 0.1 + Math.sin(t * 3) * 0.07
  }

  // Danger based on distance
  const dist = chemist.position.distanceTo(player.position)
  const sight = 6
  if (dist < sight) {
    dangerLevel.value = Math.min(1, dangerLevel.value + dt * (1 - dist / sight) * 1.5)
  } else {
    dangerLevel.value = Math.max(0, dangerLevel.value - dt * 0.3)
  }

  // Speed up when player detected
  if (dangerLevel.value > 0.5) {
    chemist._speed = 3.5
  } else {
    chemist._speed = 1.8
  }
}

function updateInteractables(dt) {
  const t = clock.getElapsedTime()
  interactables.forEach(mesh => {
    mesh.position.y = mesh._baseY + Math.sin(t * 2 + mesh.position.x) * 0.1
    mesh.rotation.y += dt * 1.2

    // Pulse emissive
    const task = tasks.value.find(t => t.id === mesh._taskId)
    if (task && task.done) {
      mesh.material.emissiveIntensity = 0.1
      mesh.material.color.setHex(0x444444)
    } else {
      mesh.material.emissiveIntensity = 0.4 + Math.sin(t * 3) * 0.3
    }
  })
}

function checkInteraction() {
  interactPrompt.value = ''
  nearbyTask = null

  for (const mesh of interactables) {
    const dist = player.position.distanceTo(new THREE.Vector3(mesh.position.x, player.position.y, mesh.position.z))
    if (dist < 2) {
      const task = tasks.value.find(t => t.id === mesh._taskId)
      if (mesh._taskId === 'exit') {
        const allDone = tasks.value.every(t => t.done)
        if (allDone) {
          interactPrompt.value = 'Fly från labbet!'
          nearbyTask = mesh._taskId
        }
      } else if (!task || !task.done) {
        interactPrompt.value = mesh._label
        nearbyTask = mesh._taskId
      }
      break
    }
  }
}

function checkWinLose() {
  if (dangerLevel.value >= 1) {
    gameState.value = 'lose'
    cancelAnimationFrame(animFrame)
  }
}

// ─── Interaction ──────────────────────────────────────────────────────────────
function onKey(e) {
  keys[e.code] = true
  if (e.code === 'KeyE' && nearbyTask && gameState.value === 'playing' && !activeMinigame.value) {
    openMinigame(nearbyTask)
  }
}
function offKey(e) { keys[e.code] = false }

function openMinigame(taskId) {
  if (taskId === 'exit') {
    gameState.value = 'win'
    cancelAnimationFrame(animFrame)
    return
  }
  activeMinigame.value = taskId

  // Reset minigame state
  if (taskId === 'circuit') {
    circuitSequence.value = []
    circuitNodes.value.forEach(n => { n.active = false; n.wrong = false })
    circuitStatus.value = 'Börja med batteriet...'
  }
  if (taskId === 'formula') {
    formulaOptions.value.forEach(o => { o.selected = false; o.correct = false; o.wrong = false })
    formulaStatus.value = ''
  }
  if (taskId === 'voltage') {
    voltageSlider.value = Math.random() * 24
  }
  if (taskId === 'hack') {
    hackInput.value = ''
    hackStatus.value = ''
  }
}

function closeMinigame() {
  activeMinigame.value = null
}

function completeTask(taskId) {
  const task = tasks.value.find(t => t.id === taskId)
  if (task) task.done = true
  activeMinigame.value = null
}

// Circuit
function clickCircuitNode(node) {
  const expected = circuitOrder[circuitSequence.value.length]
  if (node.id === expected) {
    node.active = true
    circuitSequence.value.push(node.id)
    if (circuitSequence.value.length === circuitOrder.length) {
      circuitStatus.value = '✓ Kretsen kopplad!'
      setTimeout(() => completeTask('circuit'), 800)
    } else {
      circuitStatus.value = `✓ Bra! Nästa: ${circuitOrder[circuitSequence.value.length]}`
    }
  } else {
    node.wrong = true
    circuitStatus.value = '✗ Fel ordning! Börja om...'
    setTimeout(() => {
      circuitNodes.value.forEach(n => { n.active = false; n.wrong = false })
      circuitSequence.value = []
      circuitStatus.value = 'Börja med batteriet...'
    }, 1000)
  }
}

// Formula
function selectFormula(option) {
  formulaOptions.value.forEach(o => { o.selected = false; o.correct = false; o.wrong = false })
  option.selected = true
  if (option.id === 'a') {
    option.correct = true
    formulaStatus.value = '✓ Rätt! Formeln är balanserad!'
    setTimeout(() => completeTask('formula'), 800)
  } else {
    option.wrong = true
    formulaStatus.value = '✗ Fel. Försök igen!'
  }
}

// Voltage
function confirmVoltage() {
  if (Math.abs(voltageValue.value - 9.0) < 0.15) {
    completeTask('voltage')
  } else {
    voltageSlider.value = voltageValue.value + (Math.random() - 0.5) * 2
  }
}

// Hack
function confirmHack() {
  if (hackInput.value.trim() === '33') {
    hackStatus.value = '✓ Koden godkänd!'
    setTimeout(() => completeTask('hack'), 800)
  } else {
    hackStatus.value = '✗ Fel kod!'
    hackInput.value = ''
  }
}

function onResize() {
  if (!renderer) return
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

onUnmounted(() => {
  cancelAnimationFrame(animFrame)
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('keyup', offKey)
  window.removeEventListener('resize', onResize)
  if (renderer) renderer.dispose()
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  overflow: hidden;
  background: #000;
  font-family: 'Share Tech Mono', monospace;
}

#game-container {
  position: fixed; inset: 0;
  width: 100vw; height: 100vh;
}

canvas { display: block; width: 100% !important; height: 100% !important; }

/* ── HUD ── */
.hud {
  position: fixed;
  top: 20px; left: 20px;
  pointer-events: none;
  z-index: 10;
}

.hud-tasks {
  background: rgba(0,10,20,0.85);
  border: 1px solid #0088cc;
  border-radius: 6px;
  padding: 14px 18px;
  margin-bottom: 14px;
  backdrop-filter: blur(8px);
  box-shadow: 0 0 20px rgba(0,136,204,0.3);
}

.hud-title {
  font-family: 'Orbitron', monospace;
  font-size: 10px;
  letter-spacing: 3px;
  color: #0088cc;
  margin-bottom: 10px;
}

.task-item {
  font-size: 12px;
  color: #88ccee;
  margin: 5px 0;
  transition: all 0.3s;
}

.task-item.done {
  color: #00ff88;
  text-decoration: line-through;
}

.task-icon { margin-right: 8px; }

.hud-danger, .hud-stamina {
  background: rgba(0,10,20,0.85);
  border: 1px solid #cc2200;
  border-radius: 6px;
  padding: 10px 14px;
  margin-bottom: 8px;
  backdrop-filter: blur(8px);
}

.hud-stamina { border-color: #0066aa; }

.danger-label, .stamina-label {
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  letter-spacing: 2px;
  color: #cc4422;
  margin-bottom: 6px;
}

.stamina-label { color: #0099dd; }

.danger-bar, .stamina-bar {
  height: 6px;
  background: rgba(255,255,255,0.1);
  border-radius: 3px;
  overflow: hidden;
  width: 160px;
}

.danger-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff4400, #ff0000);
  border-radius: 3px;
  transition: width 0.2s;
  box-shadow: 0 0 8px #ff2200;
}

.stamina-fill {
  height: 100%;
  background: linear-gradient(90deg, #0066ff, #00ccff);
  border-radius: 3px;
  transition: width 0.3s;
  box-shadow: 0 0 8px #0099ff;
}

.hud-danger.alert {
  border-color: #ff2200;
  animation: alertPulse 0.5s infinite alternate;
}

@keyframes alertPulse {
  from { box-shadow: 0 0 10px rgba(255,34,0,0.3); }
  to   { box-shadow: 0 0 25px rgba(255,34,0,0.8); }
}

/* ── Controls hint ── */
.controls-hint {
  position: fixed;
  bottom: 20px; left: 50%;
  transform: translateX(-50%);
  display: flex; gap: 20px;
  background: rgba(0,10,20,0.7);
  border: 1px solid #1a3a50;
  padding: 8px 20px;
  border-radius: 30px;
  font-size: 11px;
  color: #446688;
  backdrop-filter: blur(6px);
  pointer-events: none;
}

/* ── Interact prompt ── */
.interact-prompt {
  position: fixed;
  bottom: 70px; left: 50%;
  transform: translateX(-50%);
  display: flex; align-items: center; gap: 10px;
  background: rgba(0,20,40,0.9);
  border: 1px solid #00ff88;
  padding: 10px 22px;
  border-radius: 30px;
  font-size: 14px;
  color: #00ff88;
  pointer-events: none;
  animation: promptFloat 2s ease-in-out infinite;
  box-shadow: 0 0 20px rgba(0,255,136,0.3);
}

.key {
  display: inline-flex; align-items: center; justify-content: center;
  width: 24px; height: 24px;
  background: #00ff88;
  color: #000;
  border-radius: 4px;
  font-weight: bold;
  font-size: 12px;
}

@keyframes promptFloat {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-4px); }
}

/* ── Minigame overlay ── */
.minigame-overlay {
  position: fixed; inset: 0;
  background: rgba(0,5,15,0.85);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.minigame-panel {
  background: rgba(5,15,30,0.97);
  border: 1px solid #0088cc;
  border-radius: 12px;
  padding: 36px 40px;
  min-width: 380px;
  max-width: 480px;
  text-align: center;
  box-shadow: 0 0 60px rgba(0,136,204,0.4), inset 0 0 30px rgba(0,40,80,0.5);
  position: relative;
}

.mg-title {
  font-family: 'Orbitron', monospace;
  font-size: 18px;
  font-weight: 700;
  color: #00ccff;
  letter-spacing: 2px;
  margin-bottom: 12px;
  text-shadow: 0 0 15px #00aaff;
}

.mg-desc {
  font-size: 13px;
  color: #7799bb;
  margin-bottom: 28px;
  line-height: 1.6;
}

.mg-status {
  font-size: 13px;
  color: #00ff88;
  margin-top: 16px;
  min-height: 20px;
}

.mg-btn {
  margin-top: 16px;
  padding: 10px 28px;
  background: linear-gradient(135deg, #0066cc, #0099ff);
  border: none;
  border-radius: 6px;
  color: #fff;
  font-family: 'Orbitron', monospace;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 0 15px rgba(0,102,204,0.4);
}
.mg-btn:hover { transform: translateY(-2px); box-shadow: 0 0 25px rgba(0,102,204,0.7); }

.mg-close {
  position: absolute; top: 12px; right: 14px;
  background: transparent;
  border: 1px solid #334;
  color: #446;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}
.mg-close:hover { color: #ff4444; border-color: #ff4444; }

/* Circuit */
.circuit-nodes {
  display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;
}

.circuit-node {
  padding: 14px 20px;
  border: 2px solid #224;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #88aacc;
  transition: all 0.2s;
  background: rgba(0,20,40,0.8);
}

.circuit-node:hover { border-color: #0099ff; color: #00ccff; background: rgba(0,50,100,0.5); }
.circuit-node.active { border-color: #00ff88; color: #00ff88; background: rgba(0,60,30,0.6); box-shadow: 0 0 15px rgba(0,255,136,0.4); }
.circuit-node.wrong { border-color: #ff4400; color: #ff4400; animation: shake 0.3s; }

@keyframes shake {
  0%,100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}

/* Formula */
.formula-picker { display: flex; flex-direction: column; gap: 10px; }

.formula-option {
  padding: 12px 20px;
  border: 2px solid #224;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #88aacc;
  transition: all 0.2s;
  background: rgba(0,20,40,0.8);
}

.formula-option:hover { border-color: #0099ff; color: #00ccff; }
.formula-option.correct { border-color: #00ff88; color: #00ff88; background: rgba(0,60,30,0.6); }
.formula-option.wrong { border-color: #ff4400; color: #ff4400; }

/* Voltage */
.voltage-display {
  font-family: 'Orbitron', monospace;
  font-size: 48px;
  font-weight: 900;
  color: #ff00aa;
  text-shadow: 0 0 20px #ff00aa;
  margin: 16px 0;
  letter-spacing: 4px;
}

.voltage-slider {
  width: 100%;
  margin: 8px 0;
  accent-color: #ff00aa;
  cursor: pointer;
}

.voltage-target {
  font-size: 12px;
  color: #664466;
  margin-bottom: 8px;
}

/* Hack */
.hack-input {
  width: 160px;
  padding: 14px;
  background: rgba(0,20,40,0.9);
  border: 2px solid #0088cc;
  border-radius: 8px;
  color: #00ff88;
  font-family: 'Orbitron', monospace;
  font-size: 28px;
  text-align: center;
  letter-spacing: 6px;
  outline: none;
  margin: 16px auto;
  display: block;
}

.hack-input:focus { border-color: #00ff88; box-shadow: 0 0 20px rgba(0,255,136,0.3); }

/* ── Start / End screens ── */
.start-screen, .end-screen {
  position: fixed; inset: 0;
  display: flex; align-items: center; justify-content: center;
  z-index: 200;
  background: radial-gradient(ellipse at center, rgba(0,20,50,0.97) 0%, rgba(0,5,15,0.99) 100%);
}

.start-content, .end-content {
  text-align: center;
  animation: fadeIn 0.6s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.start-logo, .end-icon {
  font-size: 72px;
  margin-bottom: 20px;
  filter: drop-shadow(0 0 20px rgba(0,200,255,0.5));
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%,100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

.start-title {
  font-family: 'Orbitron', monospace;
  font-size: 48px;
  font-weight: 900;
  color: #00ccff;
  letter-spacing: 6px;
  line-height: 1.1;
  text-shadow: 0 0 30px rgba(0,200,255,0.6);
  margin-bottom: 24px;
}

.start-title span {
  color: #ff00aa;
  text-shadow: 0 0 30px rgba(255,0,170,0.6);
}

.end-title {
  font-family: 'Orbitron', monospace;
  font-size: 52px;
  font-weight: 900;
  margin-bottom: 16px;
  letter-spacing: 4px;
}

.win .end-title { color: #00ff88; text-shadow: 0 0 30px rgba(0,255,136,0.6); }
.lose .end-title { color: #ff2200; text-shadow: 0 0 30px rgba(255,34,0,0.6); }

.start-sub, .end-sub {
  font-size: 15px;
  color: #4488aa;
  line-height: 1.8;
  margin-bottom: 36px;
  max-width: 400px;
}

.start-btn {
  padding: 16px 48px;
  background: linear-gradient(135deg, #0066cc, #00aaff);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-family: 'Orbitron', monospace;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 3px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 0 30px rgba(0,136,255,0.5);
}

.start-btn:hover {
  transform: translateY(-3px) scale(1.04);
  box-shadow: 0 0 50px rgba(0,136,255,0.8);
}

/* Stars background */
.start-screen::before, .end-screen::before {
  content: '';
  position: absolute; inset: 0;
  background-image:
    radial-gradient(1px 1px at 20% 30%, rgba(0,200,255,0.3) 0%, transparent 100%),
    radial-gradient(1px 1px at 70% 60%, rgba(255,0,170,0.3) 0%, transparent 100%),
    radial-gradient(1px 1px at 45% 80%, rgba(0,255,136,0.2) 0%, transparent 100%);
  pointer-events: none;
}
</style>
