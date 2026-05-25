<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import faceSrc from '../assets/img/RichardEat.png'

const router = useRouter()
const showButton = ref(false)
const showInfo = ref(false)

function beginGame() {
  router.push('/level-2')
}

const canvasRef = ref(null)
const gameComplete = ref(false)
const clue = ref('KEY FRAGMENT: A')

let ctx
let animationId
let keys = {}
let faceImage = new Image()

const player = {
  x: 120,
  y: 120,
  size: 74,
  speed: 4.2,
  angle: 0,
}

const sushi = []
let walls = []
const mazeCols = 19
const mazeRows = 11
const tile = 72
const offset = { x: 0, y: 0 }

const maze = [
  '###################',
  '#........#........#',
  '#.###.##.#.##.###.#',
  '#.................#',
  '#.###.#.###.#.###.#',
  '#.....#.....#.....#',
  '###.#.### ###.#.###',
  '#...#....P....#...#',
  '#.#####.#.#.#####.#',
  '#.................#',
  '###################',
]

function resize() {
  const canvas = canvasRef.value
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  offset.x = (canvas.width - mazeCols * tile) / 2
  offset.y = (canvas.height - mazeRows * tile) / 2

  buildMaze()
  createSushi()
}

function buildMaze() {
  walls = []

  for (let row = 0; row < mazeRows; row++) {
    for (let col = 0; col < mazeCols; col++) {
      if (maze[row][col] === '#') {
        walls.push({
          x: offset.x + col * tile,
          y: offset.y + row * tile,
          w: tile,
          h: tile,
        })
      }

      if (maze[row][col] === 'P') {
        player.x = offset.x + col * tile + tile / 2
        player.y = offset.y + row * tile + tile / 2
      }
    }
  }
}

function createSushi() {
  sushi.length = 0

  for (let row = 0; row < mazeRows; row++) {
    for (let col = 0; col < mazeCols; col++) {
      if (maze[row][col] === '.') {
        sushi.push({
          x: offset.x + col * tile + tile / 2,
          y: offset.y + row * tile + tile / 2,
          eaten: false,
          pulse: Math.random() * Math.PI * 2,
        })
      }
    }
  }
}

function circleRectCollision(cx, cy, r, rect) {
  const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w))
  const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h))
  const dx = cx - closestX
  const dy = cy - closestY
  return dx * dx + dy * dy < r * r
}

function movePlayer() {
  let dx = 0
  let dy = 0

  if (keys.ArrowUp || keys.w) dy -= 1
  if (keys.ArrowDown || keys.s) dy += 1
  if (keys.ArrowLeft || keys.a) dx -= 1
  if (keys.ArrowRight || keys.d) dx += 1

  if (dx === 0 && dy === 0) return

  const length = Math.hypot(dx, dy)
  dx /= length
  dy /= length

  player.angle = Math.atan2(dy, dx)

  const nextX = player.x + dx * player.speed
  const nextY = player.y + dy * player.speed
  const radius = player.size * 0.42

  const hitsWall = walls.some((wall) => circleRectCollision(nextX, nextY, radius, wall))

  if (!hitsWall) {
    player.x = Math.max(radius, Math.min(window.innerWidth - radius, nextX))
    player.y = Math.max(radius, Math.min(window.innerHeight - radius, nextY))
  }
}

function eatSushi() {
  sushi.forEach((piece) => {
    if (piece.eaten) return

    const distance = Math.hypot(player.x - piece.x, player.y - piece.y)

    if (distance < player.size * 0.48) {
      piece.eaten = true
    }
  })

  if (sushi.length && sushi.every((piece) => piece.eaten)) {
    gameComplete.value = true
  }
}

function drawBackground() {
  ctx.fillStyle = '#05070d'
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)

  const gradient = ctx.createRadialGradient(
    window.innerWidth / 2,
    window.innerHeight / 2,
    0,
    window.innerWidth / 2,
    window.innerHeight / 2,
    window.innerWidth * 0.7
  )

  gradient.addColorStop(0, 'rgba(90,120,210,0.16)')
  gradient.addColorStop(1, 'rgba(0,0,0,0)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)
}

function drawWalls() {
  walls.forEach((wall) => {
    ctx.fillStyle = 'rgba(45, 95, 255, 0.18)'
    ctx.strokeStyle = 'rgba(120, 170, 255, 0.55)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.roundRect(wall.x + 4, wall.y + 4, wall.w - 8, wall.h - 8, 14)
    ctx.fill()
    ctx.stroke()
  })
}

function drawSushi(time) {
  sushi.forEach((piece) => {
    if (piece.eaten) return

    const scale = 1 + Math.sin(time * 0.005 + piece.pulse) * 0.08

    ctx.save()
    ctx.translate(piece.x, piece.y)
    ctx.scale(scale, scale)

    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.roundRect(-18, -10, 36, 20, 8)
    ctx.fill()

    ctx.fillStyle = '#ff8f6b'
    ctx.beginPath()
    ctx.roundRect(-15, -14, 30, 16, 7)
    ctx.fill()

    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    ctx.fillRect(-14, -4, 28, 5)

    ctx.restore()
  })
}

function drawPlayer() {
  ctx.save()
  ctx.translate(player.x, player.y)
  ctx.rotate(player.angle)

  ctx.shadowColor = 'rgba(255,255,255,0.28)'
  ctx.shadowBlur = 28

  ctx.beginPath()
  ctx.arc(0, 0, player.size / 2, 0, Math.PI * 2)
  ctx.clip()

  ctx.drawImage(
    faceImage,
    -player.size / 2,
    -player.size / 2,
    player.size,
    player.size
  )

  ctx.restore()
}

function drawHud() {
  const remaining = sushi.filter((piece) => !piece.eaten).length

  ctx.fillStyle = 'rgba(255,255,255,0.72)'
  ctx.font = '12px ui-monospace, monospace'
  ctx.letterSpacing = '3px'
  ctx.fillText(`SUSHI REMAINING: ${remaining}`, 32, 42)
}

function loop(time = 0) {
  movePlayer()
  eatSushi()

  drawBackground()
  drawWalls()
  drawSushi(time)
  drawPlayer()
  drawHud()

  if (!gameComplete.value) {
    animationId = requestAnimationFrame(loop)
  }
}

function handleKeyDown(event) {
  keys[event.key] = true
}

function handleKeyUp(event) {
  keys[event.key] = false
}

onMounted(() => {
  ctx = canvasRef.value.getContext('2d')
  faceImage.src = faceSrc

  resize()
  createSushi()

  faceImage.onload = () => loop()

  window.addEventListener('resize', resize)
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', resize)
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})
</script>

<template>
  <main class="sushi-room">
    <canvas ref="canvasRef"></canvas>

    <button class="info-toggle" @click="showInfo = !showInfo">
        i
    </button>

    <div class="intro-card" v-if="showInfo && !gameComplete">
      <p>Escape Room</p>
      <h1>Sushi Chase</h1>
      <span>Ät all sushi för att låsa upp ledtråden</span>
      <small>Styr med piltangenter eller WASD</small>
    </div>

    <div class="complete" v-if="gameComplete">
      <div class="complete-card">
        <p>Room complete</p>
        <h2>All sushi consumed</h2>
        <div class="clue">{{ clue }}</div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.sushi-room {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #05070d;
  color: white;
}

canvas {
  position: absolute;
  inset: 0;
}

.intro-card {
  position: fixed;
  left: 32px;
  bottom: 32px;
  z-index: 2;
  max-width: 420px;
  padding: 28px;
  border-radius: 28px;
  background: rgba(5, 7, 13, 0.66);
  border: 1px solid rgba(255,255,255,0.12);
  backdrop-filter: blur(24px);
  box-shadow: 0 40px 120px rgba(0,0,0,0.5);
}

.intro-card p,
.complete-card p {
  margin: 0 0 12px;
  color: rgba(255,255,255,0.46);
  text-transform: uppercase;
  letter-spacing: 0.28em;
  font-size: 0.72rem;
}

.intro-card h1 {
  margin: 0;
  font-family: Georgia, serif;
  font-size: clamp(3rem, 7vw, 5.5rem);
  font-weight: 400;
  line-height: 0.86;
  letter-spacing: -0.08em;
}

.intro-card span,
.intro-card small {
  display: block;
  margin-top: 18px;
  color: rgba(255,255,255,0.62);
  line-height: 1.6;
}

.intro-card small {
  color: rgba(255,255,255,0.38);
}

.complete {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  z-index: 4;
  background: rgba(0,0,0,0.72);
  backdrop-filter: blur(18px);
}

.complete-card {
  width: min(92vw, 620px);
  text-align: center;
  padding: 54px 42px;
  border-radius: 34px;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.07);
  box-shadow: 0 50px 160px rgba(0,0,0,0.66);
}

.complete-card h2 {
  margin: 0;
  font-family: Georgia, serif;
  font-size: clamp(3rem, 8vw, 5.5rem);
  font-weight: 400;
  line-height: 0.9;
  letter-spacing: -0.08em;
}

.clue {
  margin-top: 34px;
  padding: 18px 24px;
  border-radius: 999px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.16);
  color: white;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.info-toggle {
  position: fixed;
  left: 24px;
  bottom: 24px;
  z-index: 5;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(10,12,20,0.88);
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  backdrop-filter: blur(20px);
  transition: 0.2s;
}

.info-toggle:hover {
  transform: scale(1.08);
  background: rgba(255,255,255,0.08);
}
</style>
