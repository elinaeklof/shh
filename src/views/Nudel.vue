<script setup>
import { useRouter } from 'vue-router'
import { ref, onMounted, onBeforeUnmount } from 'vue'

const router = useRouter()
const showButton = ref(false)

function beginGame() {
  router.push('/level-')
}
onMounted(() => {
  setTimeout(() => {
    showButton.value = true
  }, 5200)
})

import Matter from 'matter-js'


const canvasRef = ref(null)
const score = ref(0)
const missed = ref(0)
const timeLeft = ref(45)
const gameOver = ref(false)

let engine
let render
let runner
let world
let timer
let spawnTimer
let noodleInterval
let mouse
let chopstick1
let chopstick2
let bowl
let width
let height

function startGame() {
  score.value = 0
  missed.value = 0
  timeLeft.value = 45
  gameOver.value = false

  const canvas = canvasRef.value
  width = window.innerWidth
  height = window.innerHeight

  const {
    Engine,
    Render,
    Runner,
    Bodies,
    Body,
    World,
    Composites,
    Events,
    Mouse
  } = Matter

  engine = Engine.create()
  world = engine.world

  render = Render.create({
    canvas,
    engine,
    options: {
      width,
      height,
      wireframes: false,
      background: '#efe8dc'
    }
  })

  runner = Runner.create()
  Runner.run(runner, engine)
  Render.run(render)

  const ground = Bodies.rectangle(width / 2, height + 80, width, 80, {
    isStatic: true,
    label: 'ground',
    render: { visible: false }
  })

  bowl = Bodies.rectangle(width * 0.28, height - 90, 260, 34, {
    isStatic: true,
    label: 'bowl',
    render: {
      fillStyle: '#25212b'
    }
  })

  const bowlLeft = Bodies.rectangle(width * 0.28 - 135, height - 130, 20, 90, {
    isStatic: true,
    label: 'bowl-wall',
    angle: -0.35,
    render: { fillStyle: '#25212b' }
  })

  const bowlRight = Bodies.rectangle(width * 0.28 + 135, height - 130, 20, 90, {
    isStatic: true,
    label: 'bowl-wall',
    angle: 0.35,
    render: { fillStyle: '#25212b' }
  })

  let chopstickLength = Math.min(width / 2, 520)

  chopstick1 = Bodies.rectangle(
    width / 2 + chopstickLength / 2,
    height / 3,
    chopstickLength,
    8,
    {
      friction: 0,
      isStatic: true,
      label: 'chopstick',
      angle: -Math.PI * 0.07,
      render: { fillStyle: '#d94d42' }
    }
  )

  chopstick2 = Bodies.rectangle(
    width / 2 + chopstickLength / 2,
    height / 3 + 34,
    chopstickLength,
    8,
    {
      friction: 0,
      isStatic: true,
      label: 'chopstick',
      angle: -Math.PI * 0.055,
      render: { fillStyle: '#d94d42' }
    }
  )

  World.add(world, [ground, bowl, bowlLeft, bowlRight, chopstick1, chopstick2])

  mouse = Mouse.create(render.canvas)

  function makeNoodle() {
    const x = width / 2 + Math.random() * 320 - 160
    const color = Math.random() > 0.5 ? '#edd683' : '#f2d998'

    const noodle = Composites.softBody(
      x,
      -280,
      1,
      24,
      5,
      5,
      false,
      4,
      {
        friction: 0.05,
        frictionAir: 0.08,
        label: 'noodle',
        render: { visible: false }
      },
      {
        stiffness: 0.055,
        render: {
          strokeStyle: color,
          lineWidth: 7
        }
      }
    )

    noodle.bodies.forEach(part => {
      part.label = 'noodle'
    })

    return noodle
  }

  Events.on(engine, 'afterUpdate', () => {
    if (!mouse.position.x) return

    const limit = width / 2
    const targetX = Math.max(mouse.position.x, limit)

    Body.translate(chopstick1, {
      x: (targetX - chopstick1.position.x) * 0.13,
      y: (mouse.position.y - chopstick1.position.y + 18) * 0.13
    })

    Body.translate(chopstick2, {
      x: (targetX - chopstick2.position.x) * 0.13,
      y: (mouse.position.y - chopstick2.position.y + 48) * 0.13
    })
  })

  Events.on(engine, 'collisionStart', event => {
    event.pairs.forEach(pair => {
      const labels = [pair.bodyA.label, pair.bodyB.label]

      if (labels.includes('noodle') && labels.includes('bowl')) {
        score.value++
      }

      if (labels.includes('noodle') && labels.includes('ground')) {
        missed.value++
      }
    })
  })

  window.addEventListener('mousedown', closeChopsticks)
  window.addEventListener('mouseup', openChopsticks)

  spawnTimer = setInterval(() => {
    if (!gameOver.value) {
      World.add(world, makeNoodle())
    }
  }, 850)

  noodleInterval = setInterval(() => {
    if (timeLeft.value <= 0) {
      endGame()
      return
    }

    timeLeft.value--
  }, 1000)
}

function closeChopsticks() {
  if (!chopstick1 || !chopstick2) return

  Matter.Body.setAngle(chopstick1, -Math.PI * 0.085)
  Matter.Body.setAngle(chopstick2, -Math.PI * 0.045)
}

function openChopsticks() {
  if (!chopstick1 || !chopstick2) return

  Matter.Body.setAngle(chopstick1, -Math.PI * 0.07)
  Matter.Body.setAngle(chopstick2, -Math.PI * 0.055)
}

function endGame() {
  gameOver.value = true
  clearInterval(spawnTimer)
  clearInterval(noodleInterval)
}

function cleanup() {
  clearInterval(timer)
  clearInterval(spawnTimer)
  clearInterval(noodleInterval)

  window.removeEventListener('mousedown', closeChopsticks)
  window.removeEventListener('mouseup', openChopsticks)

  if (render) {
    Matter.Render.stop(render)
    render.canvas.remove()
    render.textures = {}
  }

  if (runner) {
    Matter.Runner.stop(runner)
  }

  if (engine) {
    Matter.World.clear(engine.world)
    Matter.Engine.clear(engine)
  }
}

onMounted(() => {
  startGame()
})

onBeforeUnmount(() => {
  cleanup()
})
</script>

<template>
  <main class="noodle-room">
    <canvas ref="canvasRef" id="interactive"></canvas>

    <section class="hud">
      <div>
        <strong>{{ score }}</strong>
        <span>caught</span>
      </div>

      <div>
        <strong>{{ missed }}</strong>
        <span>missed</span>
      </div>

      <div>
        <strong>{{ timeLeft }}</strong>
        <span>seconds</span>
      </div>
    </section>

    <section class="instructions">
      Move mouse = move chopsticks<br />
      Hold click = pinch noodles<br />
      Drop noodles into the bowl
    </section>

    <section v-if="gameOver" class="game-over">
      <div class="game-card">
        <p>NOODLE RUSH COMPLETE</p>
        <h1>{{ score }}</h1>
        <span>noodles caught</span>

        <button @click="cleanup(); startGame()">
          Play again
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.noodle-room {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #efe8dc;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.hud {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  gap: 14px;
}

.hud div {
  min-width: 110px;
  padding: 14px 18px;
  border-radius: 18px;
  background: rgba(255,255,255,0.75);
  color: #211d1b;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.12);
}

.hud strong {
  display: block;
  font-size: 2rem;
  line-height: 1;
}

.hud span {
  display: block;
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.65rem;
  opacity: 0.55;
}

.instructions {
  position: fixed;
  left: 24px;
  bottom: 24px;
  z-index: 10;
  padding: 18px 20px;
  border-radius: 20px;
  background: rgba(255,255,255,0.76);
  color: #211d1b;
  line-height: 1.7;
  box-shadow: 0 20px 60px rgba(0,0,0,0.12);
}

.game-over {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  background: rgba(20, 15, 12, 0.58);
  backdrop-filter: blur(14px);
}

.game-card {
  width: min(92vw, 420px);
  padding: 42px;
  border-radius: 32px;
  background: #fffaf0;
  color: #211d1b;
  text-align: center;
  box-shadow: 0 40px 120px rgba(0,0,0,0.3);
}

.game-card p {
  margin-bottom: 14px;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.72rem;
  opacity: 0.55;
}

.game-card h1 {
  font-size: 6rem;
  line-height: 1;
}

.game-card span {
  display: block;
  margin-top: 8px;
  opacity: 0.6;
}

button {
  margin-top: 28px;
  padding: 14px 24px;
  border: 0;
  border-radius: 999px;
  background: #d94d42;
  color: white;
  font: inherit;
  cursor: pointer;
}
</style>