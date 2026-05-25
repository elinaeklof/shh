<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Matter from 'matter-js'

const canvasRef = ref(null)
const score = ref(0)
const missed = ref(0)
const timeLeft = ref(45)
const gameOver = ref(false)

let engine, render, runner, world
let spawnTimer, noodleInterval
let chopstick1, chopstick2, bowl
let width, height
let heldConstraint = null
let heldBody = null
let isPinching = false

const {
  Engine, Render, Runner, Bodies, Body, World,
  Events, Mouse, Constraint, Vector
} = Matter

function startGame() {
  score.value = 0
  missed.value = 0
  timeLeft.value = 45
  gameOver.value = false
  heldConstraint = null
  heldBody = null
  isPinching = false

  const canvas = canvasRef.value
  width = window.innerWidth
  height = window.innerHeight

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

  // Ground
  const ground = Bodies.rectangle(width / 2, height + 40, width * 2, 80, {
    isStatic: true,
    label: 'ground',
    render: { visible: false }
  })

  // Bowl
  const bowlX = width * 0.28
  bowl = Bodies.rectangle(bowlX, height - 90, 260, 34, {
    isStatic: true,
    label: 'bowl',
    render: { fillStyle: '#25212b' }
  })
  const bowlLeft = Bodies.rectangle(bowlX - 135, height - 130, 20, 90, {
    isStatic: true,
    label: 'bowl-wall',
    angle: -0.35,
    render: { fillStyle: '#25212b' }
  })
  const bowlRight = Bodies.rectangle(bowlX + 135, height - 130, 20, 90, {
    isStatic: true,
    label: 'bowl-wall',
    angle: 0.35,
    render: { fillStyle: '#25212b' }
  })

  // Chopsticks
  const chopLen = Math.min(width / 2, 520)
  const cx = width / 2 + chopLen / 2
  const cy = height / 3

  chopstick1 = Bodies.rectangle(cx, cy, chopLen, 8, {
    isStatic: true,
    label: 'chopstick',
    angle: -Math.PI * 0.07,
    friction: 0.8,
    render: { fillStyle: '#d94d42' }
  })
  chopstick2 = Bodies.rectangle(cx, cy + 34, chopLen, 8, {
    isStatic: true,
    label: 'chopstick',
    angle: -Math.PI * 0.055,
    friction: 0.8,
    render: { fillStyle: '#d94d42' }
  })

  World.add(world, [ground, bowl, bowlLeft, bowlRight, chopstick1, chopstick2])

  // Mouse tracking (raw, not Matter.Mouse so we get canvas-relative coords)
  const mouse = Mouse.create(render.canvas)

  Events.on(engine, 'afterUpdate', () => {
    if (!mouse.position.x) return
    const limit = width / 2
    const targetX = Math.max(mouse.position.x, limit)
    const targetY = mouse.position.y

    Body.translate(chopstick1, {
      x: (targetX - chopstick1.position.x) * 0.13,
      y: (targetY - chopstick1.position.y + 18) * 0.13
    })
    Body.translate(chopstick2, {
      x: (targetX - chopstick2.position.x) * 0.13,
      y: (targetY - chopstick2.position.y + 48) * 0.13
    })

    // Flytta held doodle med pinnarna
    if (heldBody && heldConstraint) {
      const tipX = chopstick1.position.x - Math.cos(chopstick1.angle) * (Math.min(width/2,520)/2)
      const tipY = (chopstick1.position.y + chopstick2.position.y) / 2
      Body.setPosition(heldBody, { x: tipX, y: tipY })
      Body.setVelocity(heldBody, { x: 0, y: 0 })
    }
  })

  // Score: doodle landar i skålen
  Events.on(engine, 'collisionStart', event => {
    event.pairs.forEach(pair => {
      const { bodyA, bodyB } = pair
      const labels = [bodyA.label, bodyB.label]

      if (labels.includes('doodle') && labels.includes('bowl')) {
        const doodle = bodyA.label === 'doodle' ? bodyA : bodyB
        // Släpp constraint om den hölls
        if (heldBody === doodle) {
          releaseDoodle()
        }
        score.value++
        World.remove(world, doodle)
      }

      if (labels.includes('doodle') && labels.includes('ground')) {
        const doodle = bodyA.label === 'doodle' ? bodyA : bodyB
        if (heldBody === doodle) releaseDoodle()
        missed.value++
        World.remove(world, doodle)
      }
    })
  })

  window.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mouseup', onMouseUp)

  spawnTimer = setInterval(() => {
    if (!gameOver.value) spawnDoodle()
  }, 900)

  noodleInterval = setInterval(() => {
    if (timeLeft.value <= 0) { endGame(); return }
    timeLeft.value--
  }, 1000)
}

function getTipPosition() {
  // Spetsen av pinnarna = vänster kant (lägst x), interpolerat mellan de två
  const len = Math.min(width / 2, 520)
  const half = len / 2

  const tip1x = chopstick1.position.x - Math.cos(chopstick1.angle) * half
  const tip1y = chopstick1.position.y - Math.sin(chopstick1.angle) * half
  const tip2x = chopstick2.position.x - Math.cos(chopstick2.angle) * half
  const tip2y = chopstick2.position.y - Math.sin(chopstick2.angle) * half

  return {
    x: (tip1x + tip2x) / 2,
    y: (tip1y + tip2y) / 2,
    gap: Math.sqrt((tip1x - tip2x) ** 2 + (tip1y - tip2y) ** 2)
  }
}

function onMouseDown() {
  if (!chopstick1 || !chopstick2) return
  isPinching = true
  closeChopsticks()
  tryGrab()
}

function onMouseUp() {
  if (!chopstick1 || !chopstick2) return
  isPinching = false
  openChopsticks()
  releaseDoodle()
}

function tryGrab() {
  if (heldBody) return
  const tip = getTipPosition()

  // Hitta närmaste doodle inom räckhåll
  const bodies = Matter.Composite.allBodies(world)
  let closest = null
  let closestDist = Infinity

  for (const b of bodies) {
    if (b.label !== 'doodle') continue
    const dx = b.position.x - tip.x
    const dy = b.position.y - tip.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < b.circleRadius + tip.gap + 20 && dist < closestDist) {
      closest = b
      closestDist = dist
    }
  }

  if (closest) {
    heldBody = closest
    // Frys gravitationen för hållen doodle
    Body.setStatic(heldBody, false)
    heldBody.frictionAir = 1
    heldBody.gravityScale = 0
    heldConstraint = true // flagga, vi positionerar manuellt i afterUpdate
  }
}

function releaseDoodle() {
  if (!heldBody) return
  heldBody.frictionAir = 0.01
  heldBody.gravityScale = 1
  heldConstraint = null
  heldBody = null
}

function closeChopsticks() {
  Matter.Body.setAngle(chopstick1, -Math.PI * 0.085)
  Matter.Body.setAngle(chopstick2, -Math.PI * 0.045)
}

function openChopsticks() {
  Matter.Body.setAngle(chopstick1, -Math.PI * 0.07)
  Matter.Body.setAngle(chopstick2, -Math.PI * 0.055)
}

function spawnDoodle() {
  const x = width / 2 + Math.random() * 320 - 160
  const colors = ['#F5A623', '#E8891A', '#F7C048', '#E07B10', '#FAD36A', '#D4640E']
  const col = colors[Math.floor(Math.random() * colors.length)]
  const r = 10 + Math.random() * 8

  // Cheese doodle = avlång ellips simulerad med en cirkel + visuell render
  const doodle = Bodies.circle(x, -40, r, {
    label: 'doodle',
    restitution: 0.3,
    friction: 0.6,
    frictionAir: 0.01,
    gravityScale: 1,
    render: {
      fillStyle: col,
      strokeStyle: '#C05A08',
      lineWidth: 1.5
    }
  })

  // Lägg till lite slumpmässig sidorörelse
  Body.setVelocity(doodle, {
    x: (Math.random() - 0.5) * 3,
    y: 1
  })

  World.add(world, doodle)
}

// Anpassad render för cheese doodle-form (avlång)
function setupCustomRender() {
  Matter.Events.on(render, 'afterRender', () => {
    const ctx = render.context
    const bodies = Matter.Composite.allBodies(world)

    for (const body of bodies) {
      if (body.label !== 'doodle') continue

      const { x, y } = body.position
      const r = body.circleRadius
      const angle = body.angle

      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(angle)

      // Avlång cheese doodle-form
      ctx.beginPath()
      ctx.ellipse(0, 0, r * 2.2, r * 0.9, 0, 0, Math.PI * 2)
      ctx.fillStyle = body.render.fillStyle
      ctx.fill()
      ctx.strokeStyle = '#C05A08'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Glanseffekt
      ctx.beginPath()
      ctx.ellipse(-r * 0.3, -r * 0.3, r * 0.6, r * 0.3, Math.PI * 0.1, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.25)'
      ctx.fill()

      // Strukturlinjer
      ctx.strokeStyle = 'rgba(0,0,0,0.08)'
      ctx.lineWidth = 1
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath()
        ctx.ellipse(i * r * 0.6, 0, r * 0.12, r * 0.75, 0, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Highlight om hållen
      if (body === heldBody) {
        ctx.beginPath()
        ctx.ellipse(0, 0, r * 2.4, r * 1.1, 0, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'
        ctx.lineWidth = 2.5
        ctx.stroke()
      }

      ctx.restore()

      // Dölj standardrendering
      body.render.visible = false
    }
  })
}

function endGame() {
  gameOver.value = true
  clearInterval(spawnTimer)
  clearInterval(noodleInterval)
  releaseDoodle()
}

function restartGame() {
  cleanup()
  setTimeout(() => startGame(), 50)
}

function cleanup() {
  clearInterval(spawnTimer)
  clearInterval(noodleInterval)
  window.removeEventListener('mousedown', onMouseDown)
  window.removeEventListener('mouseup', onMouseUp)

  if (render) {
    Matter.Render.stop(render)
    render.textures = {}
  }
  if (runner) Matter.Runner.stop(runner)
  if (engine) {
    Matter.World.clear(engine.world)
    Matter.Engine.clear(engine)
  }

  render = null
  runner = null
  engine = null
  world = null
  chopstick1 = null
  chopstick2 = null
  heldBody = null
  heldConstraint = null
}

onMounted(() => {
  startGame()
  setupCustomRender()
})

onBeforeUnmount(cleanup)
</script>

<template>
  <main class="noodle-room">
    <canvas ref="canvasRef" id="interactive" />

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
      Hold click = pinch &amp; grab doodle<br />
      Drop doodles into the bowl
    </section>

    <section v-if="gameOver" class="game-over">
      <div class="game-card">
        <p>CHEESE DOODLE RUSH COMPLETE</p>
        <h1>{{ score }}</h1>
        <span>doodles caught</span>
        <button @click="restartGame">Play again</button>
      </div>
    </section>
  </main>
</template>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

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

.hud strong { display: block; font-size: 2rem; line-height: 1; }
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
  background: rgba(20,15,12,0.58);
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

.game-card h1 { font-size: 6rem; line-height: 1; }
.game-card span { display: block; margin-top: 8px; opacity: 0.6; }

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