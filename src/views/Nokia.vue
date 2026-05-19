<script setup>
import { useRouter } from 'vue-router'
import { ref, onMounted, onBeforeUnmount } from 'vue'

const router = useRouter()
const showButton = ref(false)

function beginGame() {
  router.push('/level-29')
}
const canvasRef = ref(null)
const score = ref(0)
const level = ref('slow')
const gameText = ref('PRESS # TO START')
const clueIndex = ref(0)
const answer = ref('')
const feedback = ref('')
const solved = ref(false)
const showInstructions = ref(false)

let ctx
let interval = null

const cell = 12
const width = 288
const height = 192

let snake = []
let apple = { x: 120, y: 84 }
let direction = 'RIGHT'
let nextDirection = 'RIGHT'
let running = false

const clues = [
  'Ledtråd 1: Vi söker något som ofta räddar en dålig dag.',
  'Ledtråd 2: Det kan vara runt, fyrkantigt eller hemgjort.',
  'Ledtråd 3: Det luktar bäst när det kommer direkt från ugnen.',
  'Ledtråd 4: Italien är starkt misstänkt.',
  'Ledtråd 5: Det rimmar nästan på “pussa”.'
]

function drawText(text) {
  ctx.clearRect(0, 0, width, height)
  ctx.font = '22px monospace'
  ctx.fillStyle = '#111'
  ctx.textAlign = 'center'
  ctx.fillText(text, width / 2, height / 2)
}

function resetSnake() {
  snake = [
    { x: 60, y: 84 },
    { x: 48, y: 84 },
    { x: 36, y: 84 }
  ]

  direction = 'RIGHT'
  nextDirection = 'RIGHT'
  score.value = 0
  clueIndex.value = 0
  feedback.value = ''
  solved.value = false
  placeApple()
}

function placeApple() {
  apple = {
    x: Math.floor(Math.random() * (width / cell)) * cell,
    y: Math.floor(Math.random() * (height / cell)) * cell
  }
}

function draw() {
  ctx.clearRect(0, 0, width, height)

  ctx.fillStyle = '#111'
  snake.forEach(part => {
    ctx.fillRect(part.x, part.y, cell, cell)
  })

  ctx.fillStyle = '#111'
  ctx.fillRect(apple.x, apple.y, cell, cell)

  ctx.font = '12px monospace'
  ctx.fillText('EAT = CLUE', 58, 14)
}

function move() {
  direction = nextDirection

  const head = { ...snake[0] }

  if (direction === 'RIGHT') head.x += cell
  if (direction === 'LEFT') head.x -= cell
  if (direction === 'UP') head.y -= cell
  if (direction === 'DOWN') head.y += cell

  const hitWall =
    head.x < 0 ||
    head.x >= width ||
    head.y < 0 ||
    head.y >= height

  const hitSelf = snake.some(part => part.x === head.x && part.y === head.y)

  if (hitWall || hitSelf) {
    gameOver()
    return
  }

  snake.unshift(head)

  const ateApple = head.x === apple.x && head.y === apple.y

  if (ateApple) {
    score.value++

    if (clueIndex.value < clues.length) {
      clueIndex.value++
    }

    placeApple()
  } else {
    snake.pop()
  }

  draw()
}

function startGame() {
  if (running) return

  resetSnake()
  running = true
  gameText.value = ''

  interval = setInterval(move, currentSpeed())
}

function pauseGame() {
  if (!running) return

  running = false
  clearInterval(interval)
  drawText('PAUSED')
}

function gameOver() {
  running = false
  clearInterval(interval)
  drawText('GAME OVER')
}

function currentSpeed() {
  if (level.value === 'slow') return 180
  if (level.value === 'medium') return 110
  return 75
}

function changeSpeed() {
  if (level.value === 'slow') level.value = 'medium'
  else if (level.value === 'medium') level.value = 'fast'
  else level.value = 'slow'

  if (running) {
    clearInterval(interval)
    interval = setInterval(move, currentSpeed())
  }
}

function submitAnswer() {
  const value = answer.value.trim().toLowerCase()

  if (clueIndex.value < 5) {
    feedback.value = 'Nokian vägrar verifiera innan alla fem ledtrådar är upplåsta.'
    return
  }

  if (value === 'pizza') {
    solved.value = true
    feedback.value = 'Rätt. Nokia approved. Bokstav: N'
  } else {
    feedback.value = 'Fel. Läs ledtrådarna igen.'
  }
}

function keyHandler(event) {
  if (event.key === 'Enter') startGame()
  if (event.key === ' ') pauseGame()
  if (event.key === '1') changeSpeed()

  if (event.key === 'ArrowUp' && direction !== 'DOWN') nextDirection = 'UP'
  if (event.key === 'ArrowDown' && direction !== 'UP') nextDirection = 'DOWN'
  if (event.key === 'ArrowLeft' && direction !== 'RIGHT') nextDirection = 'LEFT'
  if (event.key === 'ArrowRight' && direction !== 'LEFT') nextDirection = 'RIGHT'
}

onMounted(() => {
  const canvas = canvasRef.value
  canvas.width = width
  canvas.height = height
  ctx = canvas.getContext('2d')
  drawText('PRESS # TO START')
  window.addEventListener('keydown', keyHandler)
})

onBeforeUnmount(() => {
  clearInterval(interval)
  window.removeEventListener('keydown', keyHandler)
})
</script>

<template>
  <main class="nokia-room">
    <p class="top-text">Press * for instructions</p>

    <section class="phone">
      <div class="screen">
        <canvas ref="canvasRef"></canvas>

        <div class="stats">
          <span>score: {{ score }}</span>
          <span>level: {{ level }}</span>
        </div>
      </div>

      <div v-if="showInstructions" class="instructions">
        <p>INSTRUCTIONS</p>
        <ul>
          <li># / Enter: start</li>
          <li>0 / Space: pause</li>
          <li>1: speed</li>
          <li>2 / ↑: up</li>
          <li>4 / ←: left</li>
          <li>6 / →: right</li>
          <li>8 / ↓: down</li>
          <li>Eat food to unlock clues.</li>
        </ul>
      </div>

      <div class="clue-box">
        <p class="small">NOKIA TRANSMISSION</p>

        <p v-if="clueIndex === 0">
          Inga ledtrådar upplåsta än.
        </p>

        <ol v-else>
          <li
            v-for="clue in clues.slice(0, clueIndex)"
            :key="clue"
          >
            {{ clue }}
          </li>
        </ol>

        <div class="answer-row">
          <input
            v-model="answer"
            placeholder="Skriv svaret"
            @keydown.enter="submitAnswer"
          />

          <button @click="submitAnswer">
            OK
          </button>
        </div>

        <p class="feedback">{{ feedback }}</p>
      </div>

      <div class="buttons">
        <button @click="changeSpeed">1</button>
        <button @click="nextDirection = 'UP'">2</button>
        <button @click="showInstructions = !showInstructions">*</button>

        <button @click="nextDirection = 'LEFT'">4</button>
        <button @click="pauseGame">0</button>
        <button @click="nextDirection = 'RIGHT'">6</button>

        <button></button>
        <button @click="nextDirection = 'DOWN'">8</button>
        <button @click="startGame">#</button>
      </div>
    </section>

    <div v-if="solved" class="reward">
      ROOM COMPLETE · BOKSTAV: N
    </div>
  </main>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.nokia-room {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #151515;
  color: white;
  font-family: monospace;
}

.top-text {
  margin: 20px 0 0;
  text-transform: uppercase;
  letter-spacing: 0.16em;
}

.phone {
  width: 420px;
  max-width: 92vw;
  padding: 44px 34px 34px;
  border-radius: 54px;
  background:
    linear-gradient(145deg, #d7d2c4, #77756d);
  border: 8px solid #333;
  box-shadow:
    inset 0 0 30px rgba(255,255,255,0.25),
    0 40px 120px rgba(0,0,0,0.65);
}

.screen {
  padding: 18px;
  border-radius: 22px;
  background: #9aa487;
  border: 5px solid #2f332d;
  color: #111;
}

canvas {
  width: 100%;
  image-rendering: pixelated;
  background: #9aa487;
  border: 2px solid rgba(0,0,0,0.4);
}

.stats {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  color: #111;
  text-transform: uppercase;
}

.instructions {
  margin-top: 18px;
  padding: 16px;
  border-radius: 18px;
  background: #9aa487;
  color: #111;
}

.instructions ul {
  margin: 8px 0 0;
  padding-left: 18px;
}

.clue-box {
  margin-top: 18px;
  padding: 18px;
  border-radius: 22px;
  background: rgba(0,0,0,0.28);
}

.small {
  margin: 0 0 10px;
  color: rgba(255,255,255,0.55);
  letter-spacing: 0.18em;
  font-size: 0.72rem;
}

ol {
  padding-left: 20px;
  line-height: 1.6;
}

.answer-row {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

input {
  flex: 1;
  min-width: 0;
  padding: 12px;
  border-radius: 999px;
  border: 0;
  outline: none;
  font: inherit;
}

button {
  border: 0;
  border-radius: 999px;
  background: #222;
  color: white;
  font: inherit;
  cursor: pointer;
}

.answer-row button {
  padding: 0 18px;
}

.buttons {
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.buttons button {
  height: 58px;
  font-size: 1.2rem;
  background: linear-gradient(#3c3c3c, #181818);
  border: 2px solid #111;
  box-shadow: inset 0 2px 4px rgba(255,255,255,0.18);
}

.feedback {
  min-height: 22px;
  color: #ffe6a7;
}

.reward {
  position: fixed;
  bottom: 28px;
  padding: 18px 26px;
  border-radius: 999px;
  background: rgba(122,235,255,0.12);
  border: 1px solid rgba(122,235,255,0.3);
  letter-spacing: 0.16em;
}
</style>