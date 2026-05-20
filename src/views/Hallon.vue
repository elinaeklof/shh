<template>
  <div id="hallon-shooter-game">
    <div v-if="!gameStarted" class="start-screen">
      <h1>Avsugning</h1>
      <p>
        Jag har sett det själv att du kan dina avsugningar men klarar du att skjuta ner fiskmåsar med gelehallon?
      </p>

      <div class="instructions">
        <p><b>WASD</b> = Kolla runt</p>
        <p><b>Mus</b> = titta runt</p>
        <p><b>Klick</b> = spotta gelehallon</p>
        <p>Träffa alla fiskmåsar för att vinna.</p>
        <p><b>esc</b> = avsluta gamemode</p>
      </div>

      <button @click="startGame">STARTA</button>
    </div>

    <div class="sky"></div>
    <div class="ocean"></div>

    <div class="hud">
      <div class="title">Avsugning</div>
      <div class="objective">
        Träffa alla fiskmåsar med spottade gelehallon!
      </div>

      <div class="stats">
        <div>Poäng: {{ score }}</div>
        <div>Måsar kvar: {{ gulls.length }}</div>
        <div>Ammo: ∞</div>
      </div>
    </div>

    <div v-if="won" class="win-screen">
      <h1>🏆 Du vann!</h1>
      <p>Skärgården är räddad från de galna fiskmåsarna.</p>
      <button @click="restart">Spela igen</button>
    </div>

    <div class="crosshair"></div>

    <div v-if="gameStarted && !won" class="mobile-controls">
      <div class="move-pad">
        <button @touchstart.prevent="keys.w = true" @touchend.prevent="keys.w = false">▲</button>
        <div>
          <button @touchstart.prevent="keys.a = true" @touchend.prevent="keys.a = false">◀</button>
          <button @touchstart.prevent="keys.s = true" @touchend.prevent="keys.s = false">▼</button>
          <button @touchstart.prevent="keys.d = true" @touchend.prevent="keys.d = false">▶</button>
        </div>
      </div>

      <button class="shoot-button" @touchstart.prevent="spitCandy">SKJUT</button>
    </div>

    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue"
import * as THREE from "three"

const canvas = ref(null)
const gameStarted = ref(false)
const score = ref(0)
const won = ref(false)
const gulls = ref([])

const keys = {}

let scene
let camera
let renderer
let projectiles = []
let pitch = 0
let yaw = 0
let lastTouchX = 0
let lastTouchY = 0
let hallonGameEl = null
let hallonAnimationId = null
let ocean = null

function startGame() {
  gameStarted.value = true
}

function createIsland(x, z, scale = 1) {
  const geo = new THREE.CylinderGeometry(5 * scale, 9 * scale, 3 * scale, 8)

  const mat = new THREE.MeshStandardMaterial({
    color: 0x6d8b4f,
    flatShading: true,
  })

  const island = new THREE.Mesh(geo, mat)
  island.position.set(x, 0, z)
  scene.add(island)

  for (let i = 0; i < 5; i++) {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.3, 2),
      new THREE.MeshStandardMaterial({ color: 0x6b3e26 })
    )

    const top = new THREE.Mesh(
      new THREE.ConeGeometry(1.2, 3, 8),
      new THREE.MeshStandardMaterial({ color: 0x245c2b })
    )

    trunk.position.set(
      x + (Math.random() - 0.5) * 5,
      2,
      z + (Math.random() - 0.5) * 5
    )

    top.position.set(trunk.position.x, 4, trunk.position.z)

    scene.add(trunk)
    scene.add(top)
  }
}

function createBoat(x, z) {
  const boat = new THREE.Group()

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(4, 1, 2),
    new THREE.MeshStandardMaterial({ color: 0x7a3b14 })
  )

  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 4),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  )

  mast.position.y = 2

  boat.add(body)
  boat.add(mast)

  boat.position.set(x, 0.5, z)
  scene.add(boat)
}

function createGull() {
  const gull = new THREE.Mesh(
    new THREE.SphereGeometry(1, 16, 16),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x222222,
    })
  )

  gull.position.set(
    (Math.random() - 0.5) * 60,
    6 + Math.random() * 6,
    -20 - Math.random() * 60
  )

  gull.userData = {
    speed: 0.02 + Math.random() * 0.03,
    offset: Math.random() * Math.PI * 2,
  }

  scene.add(gull)
  gulls.value.push(gull)
}

function spitCandy() {
  if (!camera || !scene) return

  const candy = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 12, 12),
    new THREE.MeshStandardMaterial({
      color: 0xff3366,
      emissive: 0xaa1133,
    })
  )

  const direction = new THREE.Vector3()
  camera.getWorldDirection(direction)

  candy.position.copy(camera.position)
  scene.add(candy)

  projectiles.push({
    mesh: candy,
    velocity: direction.multiplyScalar(2.5),
  })
}

function killGull(gull) {
  const flash = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 12, 12),
    new THREE.MeshBasicMaterial({
      color: 0xff2255,
      transparent: true,
      opacity: 0.8,
    })
  )

  flash.position.copy(gull.position)
  scene.add(flash)

  setTimeout(() => {
    scene?.remove(flash)
  }, 120)

  gull.visible = false
  scene.remove(gull)

  const index = gulls.value.indexOf(gull)
  if (index !== -1) {
    gulls.value.splice(index, 1)
  }

  score.value += 100

  if (gulls.value.length === 0) {
    won.value = true
    if (document.pointerLockElement) {
      document.exitPointerLock()
    }
  }
}

function restart() {
  location.reload()
}

function handleHallonPointerLockClick() {
  if (!gameStarted.value) return
  if (!hallonGameEl) return

  if (document.pointerLockElement !== hallonGameEl) {
    hallonGameEl.requestPointerLock()
    return
  }

  spitCandy()
}

function handleHallonMouseMove(e) {
  if (document.pointerLockElement !== hallonGameEl) return
  if (!camera) return

  yaw -= e.movementX * 0.002
  pitch -= e.movementY * 0.002

  pitch = Math.max(-1.4, Math.min(1.4, pitch))

  camera.rotation.order = "YXZ"
  camera.rotation.y = yaw
  camera.rotation.x = pitch
}

function handleHallonKeyDown(e) {
  keys[e.key.toLowerCase()] = true

  if (e.key === "Escape" && document.pointerLockElement) {
    document.exitPointerLock()
  }
}

function handleHallonKeyUp(e) {
  keys[e.key.toLowerCase()] = false
}

function handleHallonTouchStart(e) {
  const touch = e.touches[0]
  lastTouchX = touch.clientX
  lastTouchY = touch.clientY
}

function handleHallonTouchMove(e) {
  if (!gameStarted.value) return
  if (!camera) return

  const touch = e.touches[0]

  const deltaX = touch.clientX - lastTouchX
  const deltaY = touch.clientY - lastTouchY

  lastTouchX = touch.clientX
  lastTouchY = touch.clientY

  yaw -= deltaX * 0.005
  pitch -= deltaY * 0.005

  pitch = Math.max(-1.4, Math.min(1.4, pitch))

  camera.rotation.order = "YXZ"
  camera.rotation.y = yaw
  camera.rotation.x = pitch
}

function handleHallonResize() {
  if (!camera || !renderer) return

  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

function animateHallonGame() {
  hallonAnimationId = requestAnimationFrame(animateHallonGame)

  if (!camera || !renderer || !scene) return

  const moveSpeed = 0.15

  const forward = new THREE.Vector3()
  camera.getWorldDirection(forward)
  forward.y = 0
  forward.normalize()

  const right = new THREE.Vector3()
    .crossVectors(forward, new THREE.Vector3(0, 1, 0))
    .normalize()

  if (keys["w"]) camera.position.add(forward.clone().multiplyScalar(moveSpeed))
  if (keys["s"]) camera.position.add(forward.clone().multiplyScalar(-moveSpeed))
  if (keys["a"]) camera.position.add(right.clone().multiplyScalar(moveSpeed))
  if (keys["d"]) camera.position.add(right.clone().multiplyScalar(-moveSpeed))

  if (ocean) {
    ocean.position.y = Math.sin(Date.now() * 0.001) * 0.2
  }

  projectiles = projectiles.filter((p) => {
    p.mesh.position.add(p.velocity)

    let hit = false

    for (let i = gulls.value.length - 1; i >= 0; i--) {
      if (p.mesh.position.distanceTo(gulls.value[i].position) < 1) {
        killGull(gulls.value[i])
        hit = true
        break
      }
    }

    if (hit || p.mesh.position.length() > 300) {
      p.mesh.visible = false
      scene.remove(p.mesh)
      return false
    }

    return true
  })

  gulls.value.forEach((gull, i) => {
    gull.position.x += Math.sin(Date.now() * 0.001 + gull.userData.offset) * gull.userData.speed
    gull.position.y += Math.sin(Date.now() * 0.003 + i) * 0.01
    gull.rotation.y += 0.02
  })

  renderer.render(scene, camera)
}

onMounted(() => {
  hallonGameEl = document.getElementById("hallon-shooter-game")

  scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0xaadfff, 20, 150)

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )

  renderer = new THREE.WebGLRenderer({
    canvas: canvas.value,
    antialias: true,
  })

  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true

  const sun = new THREE.DirectionalLight(0xfff2c1, 2)
  sun.position.set(20, 40, 20)
  scene.add(sun)

  const ambient = new THREE.AmbientLight(0x88bbff, 0.8)
  scene.add(ambient)

  ocean = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 500, 50, 50),
    new THREE.MeshStandardMaterial({
      color: 0x2e8bc0,
      transparent: true,
      opacity: 0.95,
    })
  )

  ocean.rotation.x = -Math.PI / 2
  scene.add(ocean)

  createIsland(0, -20, 1.4)
  createIsland(-20, -40, 1)
  createIsland(25, -50, 1.2)
  createIsland(10, -80, 1.5)

  createBoat(-10, -15)
  createBoat(20, -35)

  for (let i = 0; i < 8; i++) {
    createGull()
  }

  camera.position.set(0, 3, 10)

  hallonGameEl?.addEventListener("click", handleHallonPointerLockClick)
  document.addEventListener("mousemove", handleHallonMouseMove)
  window.addEventListener("keydown", handleHallonKeyDown)
  window.addEventListener("keyup", handleHallonKeyUp)
  window.addEventListener("touchstart", handleHallonTouchStart)
  window.addEventListener("touchmove", handleHallonTouchMove, { passive: false })
  window.addEventListener("resize", handleHallonResize)

  animateHallonGame()
})

onBeforeUnmount(() => {
  hallonGameEl?.removeEventListener("click", handleHallonPointerLockClick)
  document.removeEventListener("mousemove", handleHallonMouseMove)
  window.removeEventListener("keydown", handleHallonKeyDown)
  window.removeEventListener("keyup", handleHallonKeyUp)
  window.removeEventListener("touchstart", handleHallonTouchStart)
  window.removeEventListener("touchmove", handleHallonTouchMove)
  window.removeEventListener("resize", handleHallonResize)

  if (hallonAnimationId) {
    cancelAnimationFrame(hallonAnimationId)
  }

  if (document.pointerLockElement) {
    document.exitPointerLock()
  }

  projectiles.forEach((p) => {
    scene?.remove(p.mesh)
  })

  projectiles = []
  gulls.value = []

  if (renderer) {
    renderer.dispose()
  }

  scene = null
  camera = null
  renderer = null
  ocean = null
  hallonGameEl = null
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.start-screen {
  position: absolute;
  inset: 0;
  z-index: 200;
  cursor: default;
  background:
    radial-gradient(circle at 50% 20%, rgba(80, 160, 255, 0.22), transparent 32%),
    radial-gradient(circle at 80% 80%, rgba(255, 80, 130, 0.12), transparent 28%),
    linear-gradient(180deg, #03101f 0%, #071b33 45%, #020814 100%);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 26px;
  text-align: center;
  padding: 40px;
}

.start-screen::before {
  content: "";
  position: absolute;
  inset: 40px;
  border: 1px solid rgba(170, 210, 255, 0.18);
  border-radius: 32px;
  pointer-events: none;
  box-shadow:
    0 0 80px rgba(60, 130, 255, 0.18),
    inset 0 0 80px rgba(255, 255, 255, 0.03);
}

.start-screen h1 {
  font-size: 72px;
  color: #eaf4ff;
  letter-spacing: 2px;
  text-shadow:
    0 0 20px rgba(100, 180, 255, 0.8),
    0 8px 35px rgba(0, 0, 0, 0.7);
}

.start-screen p {
  max-width: 680px;
  font-size: 22px;
  line-height: 1.6;
  color: rgba(235, 245, 255, 0.88);
}

.instructions {
  background: rgba(4, 18, 38, 0.72);
  border: 1px solid rgba(170, 210, 255, 0.22);
  border-radius: 28px;
  padding: 26px 38px;
  box-shadow:
    0 25px 80px rgba(0, 0, 0, 0.45),
    inset 0 0 40px rgba(255, 255, 255, 0.035);
  backdrop-filter: blur(14px);
}

.instructions p {
  font-size: 20px;
  margin: 9px 0;
  color: rgba(240, 248, 255, 0.9);
}

.start-screen button {
  padding: 18px 54px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 999px;
  background: linear-gradient(135deg, #ffffff, #8cc7ff);
  color: #061426;
  font-size: 28px;
  font-weight: 900;
  cursor: pointer;
  box-shadow:
    0 18px 55px rgba(80, 160, 255, 0.35),
    inset 0 2px 0 rgba(255,255,255,0.9);
  transition: 0.2s;
}

.start-screen button:hover {
  transform: translateY(-3px) scale(1.04);
  box-shadow:
    0 24px 70px rgba(80, 160, 255, 0.5),
    inset 0 2px 0 rgba(255,255,255,1);
}

#hallon-shooter-game {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
  font-family: "Arial", sans-serif;
  background: linear-gradient(#87ceeb, #d7f2ff);
  cursor: default;
}

canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.hud {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 20;
  color: white;
  padding: 24px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
  pointer-events: none;
}

.title {
  font-size: 42px;
  font-weight: 900;
  margin-bottom: 10px;
  color: rgba(100, 180, 255, 0.8);
}

.objective {
  font-size: 18px;
  margin-bottom: 20px;
}

.stats {
  display: flex;
  gap: 24px;
  font-size: 20px;
  margin-bottom: 12px;
}

.crosshair {
  position: absolute;
  width: 20px;
  height: 20px;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 50;
  pointer-events: none;
}

.crosshair::before,
.crosshair::after {
  content: "";
  position: absolute;
  background: white;
  border-radius: 10px;
}

.crosshair::before {
  width: 20px;
  height: 3px;
  top: 8px;
  left: 0;
}

.crosshair::after {
  width: 3px;
  height: 20px;
  left: 8px;
  top: 0;
}

.win-screen {
  position: absolute;
  inset: 0;
  z-index: 100;
  background: rgba(0, 20, 40, 0.85);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  backdrop-filter: blur(12px);
}

.win-screen h1 {
  font-size: 80px;
  margin-bottom: 20px;
  color: #ffd54f;
}

.win-screen p {
  font-size: 24px;
  margin-bottom: 30px;
}

.win-screen button {
  padding: 18px 32px;
  border: none;
  border-radius: 20px;
  background: linear-gradient(45deg, #ff4f7a, #ff9f43);
  color: white;
  font-size: 20px;
  cursor: pointer;
  transition: 0.2s;
}

.win-screen button:hover {
  transform: scale(1.05);
}

.mobile-controls {
  display: none;
}

@media (max-width: 768px) {
  .mobile-controls {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 24px;
    z-index: 120;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding: 0 22px;
    pointer-events: none;
  }

  .move-pad,
  .shoot-button {
    pointer-events: auto;
  }

  .move-pad {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .move-pad div {
    display: flex;
    gap: 8px;
  }

  .move-pad button {
    width: 58px;
    height: 58px;
    border-radius: 18px;
    font-size: 24px;
    font-weight: 900;
  }

  .shoot-button {
    width: 92px;
    height: 92px;
    border-radius: 50%;
    font-size: 17px;
    font-weight: 900;
  }

  .move-pad button,
  .shoot-button {
    border: 1px solid rgba(255,255,255,0.35);
    background: rgba(5, 20, 40, 0.6);
    color: white;
    backdrop-filter: blur(12px);
    touch-action: none;
    user-select: none;
  }

  .start-screen {
    padding: 18px;
    gap: 16px;
  }

  .start-screen::before {
    inset: 16px;
    border-radius: 24px;
  }

  .start-screen h1 {
    font-size: 40px;
    line-height: 1;
  }

  .start-screen > p {
    font-size: 15px;
    max-width: 330px;
  }

  .instructions {
    width: auto;
    max-width: 330px;
    padding: 16px 18px;
    border-radius: 22px;
    display: grid;
    gap: 8px;
  }

  .instructions p {
    font-size: 14px;
    line-height: 1.25;
    margin: 0;
    padding: 9px 12px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.07);
  }

  .hud {
    padding: 14px;
  }

  .title {
    font-size: 26px;
    margin-bottom: 6px;
  }

  .objective {
    font-size: 14px;
    margin-bottom: 10px;
    max-width: 220px;
  }

  .stats {
    flex-direction: column;
    gap: 6px;
    font-size: 15px;
  }

  .crosshair {
    width: 16px;
    height: 16px;
  }

  .crosshair::before {
    width: 16px;
    height: 2px;
    top: 7px;
  }

  .crosshair::after {
    width: 2px;
    height: 16px;
    left: 7px;
  }

  .win-screen h1 {
    font-size: 42px;
    text-align: center;
  }

  .win-screen p {
    font-size: 18px;
    text-align: center;
    padding: 0 20px;
  }

  .win-screen button {
    width: 80%;
    max-width: 280px;
    font-size: 18px;
    padding: 14px;
  }

  #hallon-shooter-game {
    touch-action: none;
  }
}
</style>