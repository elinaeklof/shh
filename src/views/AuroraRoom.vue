<script setup>
import { useRouter } from 'vue-router'
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'

const router = useRouter()
const showButton = ref(false)

function beginGame() {
  router.push('/level-9')
}
const props = defineProps({
  letter: { type: String, default: 'N' },
  solution: { type: String, default: 'vega' },
})

const emit = defineEmits(['solved'])

const sky = ref(null)

const solved = ref(false)
const wrongShake = ref(false)
const showHint = ref(false)

const answer = ref('')
const decodedSoFar = ref('')

const auroraIntensity = ref(0.45)

const hoverInfo = ref(null)

const mouse = reactive({
  x: -1,
  y: -1,
  px: 0,
  py: 0,
})

let ctx
let raf
let startTime = 0

let bgStars = []

const constellations = {
  lyra: {
    name: 'Lyran',
    stars: [
      { x: 0.50, y: 0.48, m: 0.03, ly: 25, name: 'Vega' },
      { x: 0.53, y: 0.56, m: 3.52, ly: 960, name: 'Sheliak' },
      { x: 0.57, y: 0.57, m: 3.25, ly: 620, name: 'Sulafat' },
      { x: 0.55, y: 0.51, m: 4.34, ly: 154, name: 'Zeta Lyr' },
      { x: 0.49, y: 0.54, m: 4.30, ly: 900, name: 'Delta Lyr' },
    ],
    lines: [
      [0, 3],
      [0, 4],
      [3, 2],
      [4, 1],
      [1, 2],
    ],
  },

  cygnus: {
    name: 'Svanen',
    stars: [
      { x: 0.67, y: 0.35, m: 1.25, ly: 2615, name: 'Deneb' },
      { x: 0.70, y: 0.43, m: 2.23, ly: 1800, name: 'Sadr' },
      { x: 0.74, y: 0.50, m: 2.48, ly: 72, name: 'Gienah' },
      { x: 0.64, y: 0.50, m: 2.87, ly: 165, name: 'Delta Cyg' },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [1, 3],
    ],
  },

  aquila: {
    name: 'Örnen',
    stars: [
      { x: 0.64, y: 0.72, m: 0.77, ly: 17, name: 'Altair' },
      { x: 0.61, y: 0.69, m: 2.72, ly: 47, name: 'Tarazed' },
      { x: 0.68, y: 0.74, m: 3.71, ly: 83, name: 'Alshain' },
    ],
    lines: [
      [0, 1],
      [0, 2],
    ],
  },

  cassiopeia: {
    name: 'Cassiopeia',
    stars: [
      { x: 0.18, y: 0.18, m: 2.2, ly: 442, name: 'Segin' },
      { x: 0.23, y: 0.24, m: 2.6, ly: 99, name: 'Ruchbah' },
      { x: 0.28, y: 0.20, m: 2.1, ly: 550, name: 'Gamma Cas' },
      { x: 0.33, y: 0.26, m: 2.2, ly: 228, name: 'Schedar' },
      { x: 0.38, y: 0.22, m: 2.2, ly: 54, name: 'Caph' },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
  },
}

const morseMessage = 'BRIGHTEST IN LYRA'

const morseMap = {
  A: '.-',
  B: '-...',
  E: '.',
  G: '--.',
  H: '....',
  I: '..',
  L: '.-..',
  N: '-.',
  R: '.-.',
  S: '...',
  T: '-',
  Y: '-.--',
}

const morseSequence = morseMessage
  .split(' ')
  .map(word =>
    word
      .split('')
      .map(char => morseMap[char])
      .join(' ')
  )
  .join('   ')

let morseIndex = 0
let pulseState = {
  until: 0,
  after: 0,
  on: false,
}

function resizeCanvas() {
  const canvas = sky.value

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

function createStars() {
  bgStars = Array.from({ length: 450 }, () => ({
    x: Math.random(),
    y: Math.random(),
    size: Math.random() * 1.8 + 0.2,
    tw: Math.random() * 10,
    sp: Math.random() * 2 + 0.3,
  }))
}

function loop(now) {
  const t = (now - startTime) / 1000

  drawSky(t)
  tickMorse(now)

  raf = requestAnimationFrame(loop)
}

function drawSky(t) {
  const W = sky.value.width
  const H = sky.value.height

  const g = ctx.createLinearGradient(0, 0, 0, H)

  g.addColorStop(0, '#050816')
  g.addColorStop(0.45, '#091226')
  g.addColorStop(1, '#020306')

  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  drawBackgroundStars(t, W, H)

  drawSummerTriangle(W, H)

  for (const key in constellations) {
    drawConstellation(
      constellations[key],
      W,
      H,
      key === 'lyra' && solved.value
    )
  }
}

function drawBackgroundStars(t, W, H) {
  for (const s of bgStars) {
    const twinkle = 0.5 + 0.5 * Math.sin(t * s.sp + s.tw)

    ctx.globalAlpha = twinkle

    ctx.fillStyle = '#ffffff'

    ctx.beginPath()
    ctx.arc(
      s.x * W,
      s.y * H,
      s.size,
      0,
      Math.PI * 2
    )

    ctx.fill()
  }

  ctx.globalAlpha = 1
}

function drawSummerTriangle(W, H) {
  const vega = constellations.lyra.stars[0]
  const deneb = constellations.cygnus.stars[0]
  const altair = constellations.aquila.stars[0]

  ctx.strokeStyle = 'rgba(120,180,255,0.12)'
  ctx.lineWidth = 1

  ctx.beginPath()

  ctx.moveTo(vega.x * W, vega.y * H)
  ctx.lineTo(deneb.x * W, deneb.y * H)
  ctx.lineTo(altair.x * W, altair.y * H)

  ctx.closePath()
  ctx.stroke()
}

function drawConstellation(cn, W, H, highlight = false) {
  ctx.strokeStyle = highlight
    ? 'rgba(140,255,210,0.9)'
    : 'rgba(150,180,230,0.2)'

  ctx.lineWidth = highlight ? 1.4 : 0.7

  for (const [a, b] of cn.lines) {
    const s1 = cn.stars[a]
    const s2 = cn.stars[b]

    ctx.beginPath()

    ctx.moveTo(s1.x * W, s1.y * H)
    ctx.lineTo(s2.x * W, s2.y * H)

    ctx.stroke()
  }

  for (const star of cn.stars) {
    const r = Math.max(1.5, (6 - star.m) * 0.8)

    const glow = ctx.createRadialGradient(
      star.x * W,
      star.y * H,
      0,
      star.x * W,
      star.y * H,
      r * 8
    )

    glow.addColorStop(
      0,
      highlight
        ? 'rgba(160,255,220,0.9)'
        : 'rgba(220,235,255,0.8)'
    )

    glow.addColorStop(1, 'rgba(0,0,0,0)')

    ctx.fillStyle = glow

    ctx.beginPath()
    ctx.arc(star.x * W, star.y * H, r * 8, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#fff'

    ctx.beginPath()
    ctx.arc(star.x * W, star.y * H, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

function tickMorse(now) {
  if (solved.value) {
    auroraIntensity.value = 0.6 + Math.sin(now / 500) * 0.08
    return
  }

  const UNIT = 220

  if (now < pulseState.until) {
    auroraIntensity.value = pulseState.on ? 0.95 : 0.28
    return
  }

  if (now < pulseState.after) {
    auroraIntensity.value = 0.28
    return
  }

  const sym = morseSequence[morseIndex]

  morseIndex = (morseIndex + 1) % morseSequence.length

  if (sym === '.') {
    pulseState = {
      on: true,
      until: now + UNIT,
      after: now + UNIT * 2,
    }

    decodedSoFar.value += '·'
  }

  else if (sym === '-') {
    pulseState = {
      on: true,
      until: now + UNIT * 3,
      after: now + UNIT * 4,
    }

    decodedSoFar.value += '−'
  }

  else {
    pulseState = {
      on: false,
      until: now + UNIT * 2,
      after: now + UNIT * 2,
    }

    decodedSoFar.value += ' '
  }

  if (decodedSoFar.value.length > 70) {
    decodedSoFar.value =
      '…' + decodedSoFar.value.slice(-69)
  }
}

function onMove(e) {
  const rect = sky.value.getBoundingClientRect()

  mouse.x = (e.clientX - rect.left) / rect.width
  mouse.y = (e.clientY - rect.top) / rect.height

  mouse.px = e.clientX - rect.left
  mouse.py = e.clientY - rect.top

  updateHover()
}

function updateHover() {
  const found = pickStar(mouse.x, mouse.y)

  if (!found) {
    hoverInfo.value = null
    return
  }

  hoverInfo.value = {
    ...found,
    px: mouse.px + 18,
    py: mouse.py + 18,
  }
}

function pickStar(nx, ny) {
  let best = null
  let bestD = 0.03

  for (const key in constellations) {
    const cn = constellations[key]

    for (const star of cn.stars) {
      const d = Math.hypot(
        star.x - nx,
        star.y - ny
      )

      if (d < bestD) {
        bestD = d

        best = {
          name: star.name,
          m: star.m,
          ly: star.ly,
          constellation: cn.name,
          star,
        }
      }
    }
  }

  return best
}

function onClick() {
  const picked = pickStar(mouse.x, mouse.y)

  if (!picked) return

  if (
    picked.name.toLowerCase() ===
    props.solution.toLowerCase()
  ) {
    solve()
  }

  else {
    flashWrong()
  }
}

function checkAnswer() {
  if (
    answer.value.trim().toLowerCase() ===
    props.solution.toLowerCase()
  ) {
    solve()
  }

  else {
    flashWrong()
  }
}

function flashWrong() {
  wrongShake.value = true

  setTimeout(() => {
    wrongShake.value = false
  }, 500)
}

function solve() {
  solved.value = true
  emit('solved', props.letter)
}

onMounted(() => {
  ctx = sky.value.getContext('2d')

  resizeCanvas()
  createStars()

  startTime = performance.now()

  window.addEventListener('resize', resizeCanvas)
  sky.value.addEventListener('click', onClick)

  raf = requestAnimationFrame(loop)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)

  window.removeEventListener('resize', resizeCanvas)

  if (sky.value) {
    sky.value.removeEventListener('click', onClick)
  }
})
</script>

<template>
  <main class="starriddle" @mousemove="onMove">
    <canvas ref="sky" class="sky"></canvas>

    <div
      class="aurora"
      :style="{ opacity: auroraIntensity }"
    >
      <div class="aurora-band band-1"></div>
      <div class="aurora-band band-2"></div>
      <div class="aurora-band band-3"></div>
    </div>

    <header class="hud-top">
      <h1>Norrskenets gåta</h1>

      <p class="riddle">
        <em>
          “Tre stjärnor tecknar sommarens triangel
          högt över de gröna slöjorna.<br><br>

          Den jag söker lyser klarast av dem tre,
          och hennes namn bär samma fyra bokstäver
          som en gammal lyra.”
        </em>
      </p>

      <p class="subtitle">
        Hovra över stjärnorna. Lyssna på ljuset.
      </p>
    </header>

    <aside class="hud-side" v-if="!solved">
      <button
        class="ghost"
        @click="showHint = !showHint"
      >
        {{ showHint ? 'Dölj ledtråd' : 'Ledtråd' }}
      </button>

      <transition name="fade">
        <div v-if="showHint" class="hint">
          <p><strong>Morsefragment:</strong></p>

          <code>
            A·− B−··· E· G−−· H···· I··
          </code>

          <p class="tiny">
            Kort blink = ·<br>
            Lång blink = −
          </p>
        </div>
      </transition>
    </aside>

    <footer class="hud-bottom" v-if="!solved">
      <form @submit.prevent="checkAnswer">
        <label>Stjärnans namn:</label>

        <input
          v-model="answer"
          :class="{ wrong: wrongShake }"
          placeholder="skriv namnet..."
          autocomplete="off"
        >

        <button type="submit">
          Svara
        </button>
      </form>

      <p class="decoded" v-if="decodedSoFar">
        <span>Norrskenet:</span>
        <code>{{ decodedSoFar }}</code>
      </p>
    </footer>

    <div
      v-if="hoverInfo && !solved"
      class="tooltip"
      :style="{
        left: hoverInfo.px + 'px',
        top: hoverInfo.py + 'px'
      }"
    >
      <div class="t-name">
        {{ hoverInfo.name }}
      </div>

      <div class="t-row">
        <span>Stjärnbild</span>
        <b>{{ hoverInfo.constellation }}</b>
      </div>

      <div class="t-row">
        <span>Magnitud</span>
        <b>{{ hoverInfo.m }}</b>
      </div>

      <div class="t-row">
        <span>Avstånd</span>
        <b>{{ hoverInfo.ly }} ly</b>
      </div>
    </div>

    <transition name="reveal">
      <div
        v-if="solved"
        class="reveal-overlay"
      >
        <p class="small">
          Lyran tänds upp.
        </p>

        <p class="coords">
          α Lyr · Vega · 25 ljusår
        </p>

        <h2>Din bokstav</h2>

        <div class="letter">
          {{ props.letter }}
        </div>
      </div>
    </transition>
  </main>
</template>

<style scoped>
.starriddle {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #02040c;
  color: white;
  font-family: Inter, sans-serif;
}

.sky {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.aurora {
  position: absolute;
  inset: 0;
  pointer-events: none;
  mix-blend-mode: screen;
  filter: blur(35px);
  transition: opacity 120ms linear;
}

.aurora-band {
  position: absolute;
  width: 140%;
  height: 220px;
  left: -20%;
  border-radius: 50%;
}

.band-1 {
  top: 10%;
  background: linear-gradient(
    90deg,
    rgba(0,255,170,0),
    rgba(0,255,170,0.35),
    rgba(120,255,220,0)
  );

  animation: wave1 11s infinite ease-in-out;
}

.band-2 {
  top: 26%;
  background: linear-gradient(
    90deg,
    rgba(0,180,255,0),
    rgba(0,255,220,0.28),
    rgba(0,180,255,0)
  );

  animation: wave2 14s infinite ease-in-out;
}

.band-3 {
  top: 42%;
  background: linear-gradient(
    90deg,
    rgba(180,255,120,0),
    rgba(0,255,170,0.22),
    rgba(180,255,120,0)
  );

  animation: wave3 17s infinite ease-in-out;
}

@keyframes wave1 {
  50% {
    transform: translateX(-4%) rotate(-2deg);
  }
}

@keyframes wave2 {
  50% {
    transform: translateX(4%) rotate(2deg);
  }
}

@keyframes wave3 {
  50% {
    transform: translateX(-2%) rotate(1deg);
  }
}

.hud-top {
  position: absolute;
  top: 30px;
  left: 40px;
  z-index: 5;
  max-width: 700px;
}

.hud-top h1 {
  margin: 0;
  font-size: clamp(3rem, 7vw, 6rem);
  font-family: Georgia, serif;
  font-weight: 400;
}

.riddle {
  margin-top: 18px;
  padding: 18px 22px;
  line-height: 1.8;
  border-left: 2px solid rgba(120,255,220,0.7);
  background: rgba(8,14,30,0.45);
  border-radius: 0 14px 14px 0;
  backdrop-filter: blur(10px);
}

.subtitle {
  opacity: 0.65;
  margin-top: 14px;
}

.hud-side {
  position: absolute;
  top: 40px;
  right: 40px;
  z-index: 5;
}

.ghost {
  padding: 12px 18px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.05);
  color: white;
  cursor: pointer;
}

.hint {
  margin-top: 14px;
  width: 260px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(8,12,26,0.78);
  border: 1px solid rgba(120,180,255,0.2);
  line-height: 1.7;
}

.tiny {
  opacity: 0.65;
  font-size: 0.82rem;
}

.hud-bottom {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  width: min(700px, 92vw);
}

.hud-bottom form {
  display: flex;
  gap: 12px;
}

.hud-bottom input {
  flex: 1;
  padding: 16px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(0,0,0,0.5);
  color: white;
}

.hud-bottom button {
  padding: 16px 22px;
  border-radius: 999px;
  border: 0;
  background: rgba(120,255,220,0.16);
  color: white;
  cursor: pointer;
}

.decoded {
  margin-top: 12px;
  opacity: 0.72;
}

.tooltip {
  position: absolute;
  z-index: 10;
  pointer-events: none;
  min-width: 180px;
  padding: 12px;
  border-radius: 14px;
  background: rgba(5,8,20,0.92);
  border: 1px solid rgba(120,180,255,0.22);
  backdrop-filter: blur(14px);
}

.t-name {
  font-weight: 700;
  margin-bottom: 8px;
  color: #9ff5d3;
}

.t-row {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
}

.reveal-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(8px);
}

.letter {
  width: 180px;
  height: 180px;
  margin-top: 18px;

  display: grid;
  place-items: center;

  border-radius: 999px;

  background:
    radial-gradient(circle, rgba(120,255,220,0.25), transparent 70%);

  font-size: 6rem;
  font-family: Georgia, serif;
}

.coords {
  opacity: 0.7;
}

.small {
  opacity: 0.6;
}

.wrong {
  animation: shake 0.35s;
}

@keyframes shake {
  25% {
    transform: translateX(-5px);
  }

  50% {
    transform: translateX(5px);
  }

  75% {
    transform: translateX(-4px);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: 0.25s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>