<template>
  <div class="align-room" tabindex="0" @keydown="handleKey" ref="rootEl">
    <div class="grid-bg"></div>

    <!-- INTRO -->
    <transition name="fade">
      <div v-if="phase === 'intro'" class="overlay">
        <div class="intro-card">
          <div class="lab-badge">ANTEN LABORATORIET · KTH</div>
          <div class="antenna-glyph">◈</div>
          <h1 class="intro-title">FASGRUPPANTENN · KALIBRERING</h1>
          <p class="intro-sub">ELEKTROMAGNETISK SIMULERING · SESSION #4417</p>
          <div class="divider-cyan"></div>
          <p class="intro-text">
            Din fasgruppantenn har förlorat kalibreringen efter ett åsknedslag.
            Strålningen är diffus och pekar åt fel håll. Tre kalibreringssteg
            måste genomföras innan systemet kan återgå till drift.
            Analysera mönstren — välj rätt parametrar.
          </p>
          <div class="spec-grid">
            <div class="spec"><span class="sv">16×1</span><span class="sl">ELEMENT</span></div>
            <div class="spec"><span class="sv">λ/2</span><span class="sl">AVSTÅND</span></div>
            <div class="spec"><span class="sv">2.4 GHz</span><span class="sl">FREKVENS</span></div>
            <div class="spec"><span class="sv">3 STEG</span><span class="sl">KALIBRERING</span></div>
          </div>
          <button class="btn-start" @click="startRoom">STARTA KALIBRERING →</button>
        </div>
      </div>
    </transition>

    <!-- GAME -->
    <transition name="fade">
      <div v-if="phase === 'game'" class="game-layout">

        <!-- Top bar -->
        <div class="top-bar">
          <div class="tb-left">
            <span class="sys-label">ANTENNSYSTEM</span>
            <span class="sys-status" :class="{ active: systemOnline }">{{ systemOnline ? '● ONLINE' : '● DEGRADERAT' }}</span>
          </div>
          <div class="step-track">
            <div v-for="i in 3" :key="i" class="step-node" :class="{ done: solved.includes(i), active: activeStep === i }">
              <span>{{ solved.includes(i) ? '✓' : i }}</span>
            </div>
          </div>
          <div class="tb-right">
            <span class="gain-label">ANTENNVINST</span>
            <span class="gain-val">{{ currentGain.toFixed(1) }} dBi</span>
          </div>
        </div>

        <!-- Main content -->
        <div class="main-content">

          <!-- Left: Array visualizer -->
          <div class="array-panel">
            <div class="array-title">FASGRUPPDIAGRAM · REALTID</div>
            <canvas ref="arrayCanvas" class="array-canvas" width="260" height="420"></canvas>
            <div class="phase-legend">
              <div v-for="(el, i) in elements" :key="i" class="phase-cell" :style="{ background: phaseColor(el.phase) }" :title="`Element ${i+1}: ${el.phase.toFixed(0)}°`"></div>
            </div>
            <div class="legend-label">FASSKIFT PER ELEMENT (0°→360°)</div>
          </div>

          <!-- Center: Puzzle -->
          <div class="center-col">

            <!-- STEP 1: Beam direction -->
            <div v-if="activeStep === 1 && !solved.includes(1)" class="step-card">
              <div class="step-badge">STEG 1 · STRÅLRIKTNING</div>
              <h2 class="step-title">Välj korrekt fasskifte för θ = 30°</h2>
              <p class="step-body">
                Antennen ska styras mot θ = 30° från boresight.
                Det progressiva fasskiftet Δφ = kd·sin(θ) där k = 2π/λ och d = λ/2.
                Studera strålningsdiagrammen — vilket alternativ pekar mot rätt vinkel?
              </p>

              <div class="pattern-comparison">
                <div
                  v-for="opt in beamOptions"
                  :key="opt.id"
                  class="pattern-opt"
                  :class="{ selected: selectedBeam === opt.id }"
                  @click="selectedBeam = opt.id; previewBeam(opt)"
                >
                  <canvas :ref="el => { if(el) beamCanvases[opt.id] = el }" class="small-pattern" width="120" height="120"></canvas>
                  <div class="opt-label">Δφ = {{ opt.dphi }}°</div>
                  <div class="opt-angle">θ ≈ {{ opt.theta }}°</div>
                </div>
              </div>

              <button class="btn-verify" :disabled="!selectedBeam" @click="checkStep1">VERIFIERA</button>
              <div v-if="fb[1]" :class="['fb', fb[1].ok ? 'fb-ok' : 'fb-err']">{{ fb[1].msg }}</div>
            </div>

            <!-- STEP 2: Null steering -->
            <!-- STEP 2: Adaptive null steering -->
            <div v-if="activeStep === 2 && !solved.includes(2)" class="step-card">
              <div class="step-badge">STEG 2 · ADAPTIV NULLSTYRNING</div>
              <h2 class="step-title">Optimera beamformern under störning</h2>

              <p class="step-body">
                Två starka störkällor är aktiva. Du måste skapa nuller mot båda samtidigt som
                huvudloben behålls mot målet. Lösningen måste uppfylla:
                <br><br>
                Mål: <strong>+10°</strong><br>
                Jammer 1: <strong>−42°</strong><br>
                Jammer 2: <strong>+18°</strong><br>
                Max sidolob: <strong>−25 dB</strong>
              </p>

              <div class="interference-display">
                <canvas ref="nullCanvas" class="null-canvas" width="300" height="300"></canvas>

                <div class="signal-bars">
                  <div class="sig-row">
                    <span class="dir-label">Mål</span>
                    <div class="sig-bar-track">
                      <div class="sig-bar-fill" :style="{ width: targetGain + '%', background: '#00ff80' }"></div>
                    </div>
                    <span class="sig-val">{{ targetGain.toFixed(0) }}%</span>
                  </div>

                  <div class="sig-row">
                    <span class="dir-label">J−42</span>
                    <div class="sig-bar-track">
                      <div class="sig-bar-fill" :style="{ width: jammerLeak1 + '%', background: '#ff3030' }"></div>
                    </div>
                    <span class="sig-val">{{ jammerLeak1.toFixed(0) }}%</span>
                  </div>

                  <div class="sig-row">
                    <span class="dir-label">J+18</span>
                    <div class="sig-bar-track">
                      <div class="sig-bar-fill" :style="{ width: jammerLeak2 + '%', background: '#ff3030' }"></div>
                    </div>
                    <span class="sig-val">{{ jammerLeak2.toFixed(0) }}%</span>
                  </div>

                  <div class="sig-row">
                    <span class="dir-label">SLL</span>
                    <div class="sig-bar-track">
                      <div class="sig-bar-fill" :style="{ width: Math.min(100, Math.abs(sidelobeLevel) * 2), background: sidelobeLevel <= -25 ? '#00ff80' : '#ff9040' }"></div>
                    </div>
                    <span class="sig-val">{{ sidelobeLevel.toFixed(1) }} dB</span>
                  </div>
                </div>
              </div>

              <div class="null-options">
                <div
                  v-for="opt in adaptiveOptions"
                  :key="opt.id"
                  class="null-btn"
                  :class="{ selected: selectedNull === opt.id }"
                  @click="selectedNull = opt.id; previewAdaptive(opt)"
                >
                  <span class="null-angle">{{ opt.name }}</span>
                  <span class="null-desc">{{ opt.desc }}</span>
                </div>
              </div>

              <button class="btn-verify" :disabled="!selectedNull" @click="checkStep2">VERIFIERA</button>
              <div v-if="fb[2]" :class="['fb', fb[2].ok ? 'fb-ok' : 'fb-err']">{{ fb[2].msg }}</div>
            </div>

            <!-- STEP 3: Sidelobe suppression -->
            <div v-if="activeStep === 3 && !solved.includes(3)" class="step-card">
              <div class="step-badge">STEG 3 · SIDOLOB-SUPPRESSION</div>
              <h2 class="step-title">Välj amplitudviktning</h2>
              <p class="step-body">
                Sidoloberna är för höga — de avslöjar antennen för passiva sensorer.
                Studera de fyra viktningsfönstren och dess sidolob-nivåer i dB.
                Välj det fönster som ger <strong>lägst sidolob</strong> utan att bredda huvudloben mer än 20%.
              </p>

              <div class="window-grid">
                <div
                  v-for="win in windows"
                  :key="win.id"
                  class="window-card"
                  :class="{ selected: selectedWindow === win.id }"
                  @click="selectedWindow = win.id; drawWindowPattern(win)"
                >
                  <canvas :ref="el => { if(el) windowCanvases[win.id] = el }" class="win-canvas" width="140" height="100"></canvas>
                  <div class="win-name">{{ win.name }}</div>
                  <div class="win-stats">
                    <span class="ws sll">SLL: {{ win.sll }} dB</span>
                    <span class="ws bw">BW: {{ win.bwFactor }}×</span>
                  </div>
                </div>
              </div>

              <button class="btn-verify" :disabled="!selectedWindow" @click="checkStep3">VERIFIERA</button>
              <div v-if="fb[3]" :class="['fb', fb[3].ok ? 'fb-ok' : 'fb-err']">{{ fb[3].msg }}</div>
            </div>

            <!-- Solved -->
            <div v-if="solved.includes(activeStep)" class="solved-panel">
              <div class="solved-check">✓</div>
              <h3>Steg {{ activeStep }} kalibrerat</h3>
              <p>{{ solvedMessages[activeStep] }}</p>
              <button v-if="solved.length < 3" class="btn-next" @click="activeStep = nextUnsolved">NÄSTA STEG →</button>
              <button v-else class="btn-next" @click="phase = 'finale'">SYSTEM ONLINE →</button>
            </div>
          </div>

          <!-- Right: Spectrum + logs -->
          <div class="right-panel">
            <div class="r-title">SPEKTRUMANALYSATOR</div>
            <canvas ref="spectrumCanvas" class="spectrum-canvas" width="220" height="160"></canvas>

            <div class="r-title" style="margin-top:16px">SYSTEMPARAMETRAR</div>
            <div class="param-list">
              <div class="param-row" v-for="p in params" :key="p.name">
                <span class="p-name">{{ p.name }}</span>
                <span class="p-val">{{ p.val }}</span>
              </div>
            </div>

            <div class="r-title" style="margin-top:16px">KALIBRERINGSLOGG</div>
            <div class="cal-log">
              <div v-for="entry in calLog" :key="entry.id" class="cal-entry" :class="'cl-'+entry.type">
                <span class="cl-time">{{ entry.time }}</span>
                {{ entry.msg }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- FINALE -->
    <transition name="fade">
      <div v-if="phase === 'finale'" class="overlay">
        <div class="finale-card">
          <div class="lab-badge green">KALIBRERING KOMPLETT</div>
          <div class="antenna-glyph green">◈</div>
          <h1 class="finale-title">SYSTEM ONLINE</h1>
          <p class="finale-sub">Fasgruppantennen är fullständigt kalibrerad och operativ.</p>
          <div class="final-specs">
            <div class="fs-row"><span>Strålriktning:</span><strong>30°</strong></div>
            <div class="fs-row"><span>Null placerad mot:</span><strong>-45°</strong></div>
            <div class="fs-row"><span>SLL:</span><strong>-42 dB (Taylor)</strong></div>
            <div class="fs-row"><span>Antennvinst:</span><strong>{{ currentGain.toFixed(1) }} dBi</strong></div>
          </div>
          <div class="divider-cyan"></div>
          <div class="secret-reveal">
            <p>Din hemliga bokstav:</p>
            <div class="secret-letter">{{ secretLetter }}</div>
          </div>
          <button class="btn-start" @click="goNext">NÄSTA UPPDRAG →</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'


function goNext() {
  router.push('/level-44')
}

const router = useRouter()
const phase = ref('intro')
const activeStep = ref(1)
const solved = ref([])
const secretLetter = 'A'
const currentGain = ref(12.4)
const systemOnline = computed(() => solved.value.length === 3)

const rootEl = ref(null)
const arrayCanvas = ref(null)
const nullCanvas = ref(null)
const spectrumCanvas = ref(null)
const beamCanvases = ref({})
const windowCanvases = ref({})

const selectedBeam = ref(null)
const selectedNull = ref(null)
const selectedWindow = ref(null)
const fb = ref({ 1: null, 2: null, 3: null })

const targetGain = ref(40)
const jammerLeak1 = ref(90)
const jammerLeak2 = ref(80)
const sidelobeLevel = ref(-13)

let animId = null
let specAnimId = null
let tick = 0

const elements = ref(Array.from({ length: 16 }, (_, i) => ({ phase: i * 0 })))

const calLog = ref([])
let logId = 0

const solvedMessages = {
  1: 'Progressivt fasskifte Δφ = 90° → θ = 30°. Antennvinst +4.2 dBi.',
  2: 'Null placerad mot -45°. Störkällan undertryckt med 38 dB.',
  3: 'Taylor-viktning vald. SLL = -42 dB. Sidoloberna under acceptansnivån.',
}

const params = computed(() => [
  { name: 'Element', val: '16' },
  { name: 'Frekvens', val: '2.4 GHz' },
  { name: 'λ/2 avstånd', val: '62.5 mm' },
  { name: 'Vinst', val: currentGain.value.toFixed(1) + ' dBi' },
  { name: 'HPBW', val: solved.value.includes(3) ? '6.2°' : '~12°' },
  { name: 'SLL', val: solved.value.includes(3) ? '-42 dB' : '-13 dB' },
])

// Beam options: Δφ and resulting angle
const beamOptions = [
  { id: 1, dphi: 45, theta: 14, correct: false },
  { id: 2, dphi: 90, theta: 30, correct: true },
  { id: 3, dphi: 120, theta: 42, correct: false },
  { id: 4, dphi: 0, theta: 0, correct: false },
]

const directions = [
  { label: '−60°', strength: 12 },
  { label: '−45°', strength: 94 },
  { label: '−30°', strength: 8 },
  { label: '  0°', strength: 22 },
  { label: '+30°', strength: 15 },
  { label: '+45°', strength: 11 },
]

const adaptiveOptions = [
  {
    id: 1,
    name: 'Delay-and-sum',
    desc: 'Max gain mot mål, inga constraints',
    target: 100,
    j1: 72,
    j2: 66,
    sll: -13,
    correct: false
  },
  {
    id: 2,
    name: 'Enkel null',
    desc: 'Null mot −42°, missar +18°',
    target: 91,
    j1: 4,
    j2: 58,
    sll: -18,
    correct: false
  },
  {
    id: 3,
    name: 'LCMV',
    desc: 'Mål bevaras, två nuller, SLL < −25 dB',
    target: 88,
    j1: 2,
    j2: 3,
    sll: -28,
    correct: true
  },
  {
    id: 4,
    name: 'Aggressiv MVDR',
    desc: 'Djupa nuller men huvudloben kollapsar',
    target: 42,
    j1: 1,
    j2: 1,
    sll: -32,
    correct: false
  }
]

const windows = [
  { id: 1, name: 'Rektangulär', sll: -13, bwFactor: 1.0, correct: false,
    weights: Array(16).fill(1) },
  { id: 2, name: 'Hanning', sll: -31, bwFactor: 1.5, correct: false,
    weights: Array.from({length:16},(_,i)=>0.5-0.5*Math.cos(2*Math.PI*i/15)) },
  { id: 3, name: 'Taylor', sll: -42, bwFactor: 1.35, correct: true,
    weights: Array.from({length:16},(_,i)=>{const x=(i-7.5)/8;return 0.35875-0.48829*Math.cos(2*Math.PI*x)+0.14128*Math.cos(4*Math.PI*x)-0.01168*Math.cos(6*Math.PI*x)}) },
  { id: 4, name: 'Chebyshev', sll: -50, bwFactor: 1.8, correct: false,
    weights: Array.from({length:16},(_,i)=>Math.cos(16*Math.acos(0.9*Math.cos(Math.PI*i/16))||0)) },
]

const nextUnsolved = computed(() => {
  for (let i = 1; i <= 3; i++) if (!solved.value.includes(i)) return i
  return 1
})

function addLog(msg, type = 'info') {
  const now = new Date()
  const t = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`
  calLog.value.unshift({ id: logId++, msg, time: t, type })
  if (calLog.value.length > 8) calLog.value.pop()
}

function phaseColor(deg) {
  const h = ((deg % 360) + 360) % 360
  return `hsl(${h * 360 / 360}, 100%, 50%)`
}

function previewAdaptive(opt) {
  targetGain.value = opt.target
  jammerLeak1.value = opt.j1
  jammerLeak2.value = opt.j2
  sidelobeLevel.value = opt.sll

  drawAdaptiveNullCanvas(opt)
}

// Array factor pattern calculation
function calcAF(dphi, weights, nullAngle) {
  const N = 16
  const d = 0.5
  return Array.from({ length: 181 }, (_, i) => {
    const theta = ((i - 90) * Math.PI) / 180
    let re = 0, im = 0
    for (let n = 0; n < N; n++) {
      const w = weights ? weights[n] : 1
      const psi = 2 * Math.PI * d * Math.sin(theta) + (dphi * Math.PI) / 180
      re += w * Math.cos(n * psi)
      im += w * Math.sin(n * psi)
    }
    let mag = Math.sqrt(re*re + im*im)
    // Apply null
    if (nullAngle !== undefined) {
      const nullRad = (nullAngle * Math.PI) / 180
      const dist = Math.abs(Math.sin(theta) - Math.sin(nullRad))
      if (dist < 0.08) mag *= dist / 0.08
    }
    return mag
  })
}

function drawAdaptiveNullCanvas(opt) {
  const canvas = nullCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const W = 300, H = 300, cx = 150, cy = 150, maxR = 120

  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#020a10'
  ctx.fillRect(0, 0, W, H)

  ctx.strokeStyle = 'rgba(0,200,255,0.08)'
  ctx.lineWidth = 1
  for (let r = 1; r <= 3; r++) {
    ctx.beginPath()
    ctx.arc(cx, cy, maxR * r / 3, 0, Math.PI * 2)
    ctx.stroke()
  }

  const targetAngle = 10
  const jammerA = -42
  const jammerB = 18

  function responseAt(thetaDeg) {
    const targetBoost = opt.target / 100
    const j1Leak = opt.j1 / 100
    const j2Leak = opt.j2 / 100

    const main = targetBoost * Math.exp(-Math.pow((thetaDeg - targetAngle) / 10, 2))
    const jam1 = j1Leak * Math.exp(-Math.pow((thetaDeg - jammerA) / 6, 2))
    const jam2 = j2Leak * Math.exp(-Math.pow((thetaDeg - jammerB) / 6, 2))
    const sidelobe = Math.pow(10, opt.sll / 20) * (0.6 + 0.4 * Math.sin(thetaDeg * 0.4) ** 2)

    return Math.max(main, jam1, jam2, sidelobe)
  }

  ctx.beginPath()
  for (let i = 0; i <= 180; i++) {
    const thetaDeg = i - 90
    const theta = thetaDeg * Math.PI / 180
    const r = responseAt(thetaDeg) * maxR
    const x = cx + r * Math.sin(theta)
    const y = cy - r * Math.cos(theta)
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }

  ctx.strokeStyle = solved.value.includes(2) ? '#00ff80' : '#00d4ff'
  ctx.lineWidth = 1.8
  ctx.stroke()

  drawAngleMarker(ctx, cx, cy, maxR, targetAngle, '#00ff80', 'MÅL +10°')
  drawAngleMarker(ctx, cx, cy, maxR, jammerA, '#ff3030', 'JAM −42°')
  drawAngleMarker(ctx, cx, cy, maxR, jammerB, '#ff3030', 'JAM +18°')
}

function drawAngleMarker(ctx, cx, cy, r, deg, color, label) {
  const a = deg * Math.PI / 180

  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx + r * Math.sin(a), cy - r * Math.cos(a))
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.setLineDash([4, 3])
  ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = color
  ctx.font = '9px monospace'
  ctx.fillText(label, cx + r * Math.sin(a) + 4, cy - r * Math.cos(a) - 4)
}

function drawSmallPattern(canvas, af, color = '#00d4ff') {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = 120, H = 120
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#020a10'
  ctx.fillRect(0, 0, W, H)

  const cx = W / 2, cy = H / 2, maxR = 50
  const maxAF = Math.max(...af)

  // Polar grid
  ctx.strokeStyle = 'rgba(0,200,255,0.1)'
  ctx.lineWidth = 0.5
  for (let r = 1; r <= 3; r++) {
    ctx.beginPath(); ctx.arc(cx, cy, maxR * r / 3, 0, Math.PI * 2); ctx.stroke()
  }

  // Pattern
  ctx.beginPath()
  af.forEach((v, i) => {
    const angle = ((i - 90) * Math.PI) / 180
    const r = (v / maxAF) * maxR
    const x = cx + r * Math.sin(angle)
    const y = cy - r * Math.cos(angle)
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  })
  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.fillStyle = color.replace(')', ',0.07)').replace('rgb', 'rgba').replace('#', 'rgba(').replace('ff', '255,')
  try { ctx.fill() } catch(e) {}
}

function previewBeam(opt) {
  const af = calcAF(opt.dphi, null, undefined)
  // Update main array visualization
  elements.value = elements.value.map((_, i) => ({ phase: i * opt.dphi }))
  drawArrayCanvas(af)
}

function drawArrayCanvas(af) {
  const canvas = arrayCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = 260, H = 420
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#020a10'
  ctx.fillRect(0, 0, W, H)

  const cx = W / 2, cy = H / 2, maxR = 160
  const maxAF = Math.max(...af, 1)

  // Rings
  ctx.strokeStyle = 'rgba(0,200,255,0.08)'
  ctx.lineWidth = 1
  for (let r = 1; r <= 4; r++) {
    ctx.beginPath(); ctx.arc(cx, cy, maxR * r / 4, 0, Math.PI * 2); ctx.stroke()
  }
  // Axes
  ctx.beginPath(); ctx.moveTo(cx, cy - maxR - 10); ctx.lineTo(cx, cy + maxR + 10); ctx.strokeStyle = 'rgba(0,200,255,0.15)'; ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx - maxR - 10, cy); ctx.lineTo(cx + maxR + 10, cy); ctx.stroke()

  // Labels
  ctx.fillStyle = 'rgba(0,200,255,0.4)'
  ctx.font = '9px monospace'
  ctx.fillText('0°', cx + 2, cy - maxR - 12)
  ctx.fillText('±90°', cx + maxR + 4, cy + 4)
  ctx.fillText('180°', cx - 16, cy + maxR + 14)

  // Pattern
  ctx.beginPath()
  af.forEach((v, i) => {
    const angle = ((i - 90) * Math.PI) / 180
    const r = (v / maxAF) * maxR
    const x = cx + r * Math.sin(angle)
    const y = cy - r * Math.cos(angle)
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  })
  ctx.closePath()
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR)
  grad.addColorStop(0, 'rgba(0,200,255,0.15)')
  grad.addColorStop(1, 'rgba(0,100,200,0.03)')
  ctx.fillStyle = grad
  ctx.fill()
  ctx.strokeStyle = '#00d4ff'
  ctx.lineWidth = 1.5
  ctx.stroke()
}

function drawNullCanvas() {
  const canvas = nullCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = 300, H = 300, cx = 150, cy = 150, maxR = 120
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#020a10'
  ctx.fillRect(0, 0, W, H)

  const af = calcAF(90, null, -45)
  const maxAF = Math.max(...af, 1)

  // Grid
  ctx.strokeStyle = 'rgba(0,200,255,0.08)'
  ctx.lineWidth = 1
  for (let r = 1; r <= 3; r++) {
    ctx.beginPath(); ctx.arc(cx, cy, maxR * r / 3, 0, Math.PI * 2); ctx.stroke()
  }

  // Pattern - show received signal (inverse of null)
  ctx.beginPath()
  af.forEach((v, i) => {
    const angle = ((i - 90) * Math.PI) / 180
    const r = (v / maxAF) * maxR
    const x = cx + r * Math.sin(angle)
    const y = cy - r * Math.cos(angle)
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  })
  ctx.strokeStyle = '#00d4ff'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.fillStyle = 'rgba(0,180,255,0.05)'
  ctx.fill()

  // Highlight the jammer direction (strong signal = -45°)
  const jamRad = (-45 * Math.PI) / 180
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx + maxR * Math.sin(jamRad), cy - maxR * Math.cos(jamRad))
  ctx.strokeStyle = 'rgba(255,50,50,0.7)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([4, 3])
  ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = '#ff5050'
  ctx.font = '9px monospace'
  ctx.fillText('STÖRSIGNAL', cx + maxR * Math.sin(jamRad) + 4, cy - maxR * Math.cos(jamRad) - 4)

  // Degree labels
  ctx.fillStyle = 'rgba(0,200,255,0.3)'
  ctx.font = '8px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('0°', cx, cy - maxR - 6)
  ctx.fillText('−90°', cx - maxR - 16, cy + 4)
  ctx.fillText('+90°', cx + maxR + 4, cy + 4)
  ctx.textAlign = 'left'
}

function drawWindowPattern(win) {
  const canvas = windowCanvases.value[win.id]
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = 140, H = 100
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#020a10'
  ctx.fillRect(0, 0, W, H)

  // Draw AF in dB
  const af = calcAF(90, win.weights, undefined)
  const maxAF = Math.max(...af, 0.001)
  const afdB = af.map(v => 20 * Math.log10(v / maxAF + 0.0001))

  ctx.beginPath()
  afdB.forEach((v, i) => {
    const x = (i / 180) * W
    const y = H - ((v + 60) / 60) * H
    i === 0 ? ctx.moveTo(x, Math.min(H, y)) : ctx.lineTo(x, Math.min(H, y))
  })
  ctx.strokeStyle = solved.value.includes(3) ? '#00ff80' : '#00d4ff'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // SLL line
  ctx.beginPath()
  ctx.moveTo(0, H - ((win.sll + 60) / 60) * H)
  ctx.lineTo(W, H - ((win.sll + 60) / 60) * H)
  ctx.strokeStyle = 'rgba(255,100,0,0.3)'
  ctx.lineWidth = 0.8
  ctx.setLineDash([3, 2])
  ctx.stroke()
  ctx.setLineDash([])

  // 0dB line
  ctx.beginPath()
  ctx.moveTo(0, H - (60/60)*H)
  ctx.lineTo(W, H - (60/60)*H)
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'
  ctx.lineWidth = 0.5
  ctx.stroke()
}

function drawSpectrum() {
  const canvas = spectrumCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = 220, H = 160
  ctx.fillStyle = 'rgba(2,10,16,0.3)'
  ctx.fillRect(0, 0, W, H)

  tick++

  // Animated spectrum
  ctx.beginPath()
  for (let x = 0; x < W; x++) {
    const f = (x / W) * 4 + 1  // 1-5 GHz
    const mainPeak = Math.exp(-Math.pow((f - 2.4) / 0.15, 2)) * (H - 20)
    const noise = (Math.random() * 6) + (Math.sin(x * 0.3 + tick * 0.1) * 4)
    const y = H - mainPeak - noise - 10
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.strokeStyle = '#00d4ff'
  ctx.lineWidth = 1
  ctx.stroke()

  // Freq marker
  ctx.beginPath()
  ctx.moveTo(W * (1.4 / 4), 0)
  ctx.lineTo(W * (1.4 / 4), H)
  ctx.strokeStyle = 'rgba(255,255,0,0.4)'
  ctx.lineWidth = 0.8
  ctx.stroke()

  ctx.fillStyle = 'rgba(0,200,255,0.4)'
  ctx.font = '8px monospace'
  ctx.fillText('1GHz', 0, H - 2)
  ctx.fillText('3GHz', W/2 - 10, H - 2)
  ctx.fillText('5GHz', W - 28, H - 2)
  ctx.fillText('2.4', W * (1.4/4) - 8, 10)
}

function startRoom() {
  phase.value = 'game'
  nextTick(() => {
    rootEl.value?.focus()
    const af = calcAF(0, null, undefined)
    drawArrayCanvas(af)
    previewAdaptive(adaptiveOptions[0])
    // Draw all beam canvases
    beamOptions.forEach(opt => {
      nextTick(() => {
        const af = calcAF(opt.dphi, null, undefined)
        drawSmallPattern(beamCanvases.value[opt.id], af, '#00d4ff')
      })
    })
    // Draw window canvases
    windows.forEach(win => {
      nextTick(() => drawWindowPattern(win))
    })

    specAnimId = setInterval(drawSpectrum, 80)
    addLog('Kalibreringssession startad.', 'info')
    addLog('Fasfel detekterat i alla element.', 'warn')
    addLog('Väntar på operatörsinput.', 'info')
  })
}

function checkStep1() {
  const opt = beamOptions.find(o => o.id === selectedBeam.value)
  if (opt?.correct) {
    fb.value[1] = { ok: true, msg: '✓ Rätt! Δφ = 90° ger θ = arcsin(λΔφ/2πd) = arcsin(0.5) = 30°.' }
    solved.value.push(1)
    currentGain.value += 4.2
    elements.value = elements.value.map((_, i) => ({ phase: i * 90 }))
    addLog('Strålriktning kalibrerad: 30°.', 'ok')
  } else {
    fb.value[1] = { ok: false, msg: '✗ Fel fasskifte. Kontrollera formelns resultat för θ = 30°.' }
    addLog('Fel fasskifte. Försök igen.', 'warn')
    setTimeout(() => fb.value[1] = null, 3000)
  }
}

function checkStep2() {
  const opt = adaptiveOptions.find(o => o.id === selectedNull.value)

  if (opt?.correct) {
    fb.value[2] = {
      ok: true,
      msg: '✓ Korrekt! LCMV bevarar gain mot +10° och skapar constraints/nuller mot −42° och +18° med SLL under −25 dB.'
    }

    solved.value.push(2)
    currentGain.value += 1.5
    addLog('LCMV-beamformer applicerad. Två jammers undertryckta.', 'ok')
  } else if (opt?.target < 60) {
    fb.value[2] = {
      ok: false,
      msg: '✗ För aggressiv lösning. Jamrarna undertrycks, men huvudloben mot målet kollapsar.'
    }
    addLog('Beamformer förlorade mål-gain.', 'warn')
    setTimeout(() => fb.value[2] = null, 3500)
  } else if (opt?.j1 > 10 || opt?.j2 > 10) {
    fb.value[2] = {
      ok: false,
      msg: '✗ Otillräcklig jammerundertryckning. Båda störkällorna måste nollas samtidigt.'
    }
    addLog('Otillräcklig nullstyrning.', 'warn')
    setTimeout(() => fb.value[2] = null, 3500)
  } else {
    fb.value[2] = {
      ok: false,
      msg: '✗ Sidolobkravet är inte uppfyllt. Max SLL måste vara under −25 dB.'
    }
    addLog('Sidolobskrav ej uppfyllt.', 'warn')
    setTimeout(() => fb.value[2] = null, 3500)
  }
}

function checkStep3() {
  const win = windows.find(w => w.id === selectedWindow.value)
  if (win?.correct) {
    fb.value[3] = { ok: true, msg: '✓ Taylor-fönstret: SLL = −42 dB med BW-faktor 1.35× — optimal kompromiss.' }
    solved.value.push(3)
    currentGain.value += 2.1
    addLog('Taylor-viktning applicerad. SLL = −42 dB.', 'ok')
  } else if (win?.sll <= -50) {
    fb.value[3] = { ok: false, msg: '✗ Chebyshev ger lägst SLL men ökar bandbredden 1.8× — för bred huvudlob.' }
    setTimeout(() => fb.value[3] = null, 3500)
  } else {
    fb.value[3] = { ok: false, msg: '✗ Kontrollera sidolob-nivån (SLL) och bandbreddsfaktorn (BW).' }
    setTimeout(() => fb.value[3] = null, 3000)
  }
}

function handleKey(e) {
  if (e.key === 'Tab') { e.preventDefault() }
}

onBeforeUnmount(() => {
  if (animId) cancelAnimationFrame(animId)
  if (specAnimId) clearInterval(specAnimId)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Exo+2:wght@400;600;700;800&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

.align-room {
  min-height: 100vh;
  background: #020a10;
  font-family: 'Exo 2', sans-serif;
  color: #a0d8f0;
  position: relative;
  overflow: hidden;
  outline: none;
}

.grid-bg {
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(0,180,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,180,255,0.03) 1px, transparent 1px);
  background-size: 32px 32px;
  pointer-events: none;
}

/* OVERLAY */
.overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  background: rgba(2, 10, 16, 0.95);
  backdrop-filter: blur(8px);
}

.intro-card, .finale-card {
  max-width: 600px;
  width: 92%;
  background: linear-gradient(160deg, #050f1c 0%, #020a16 100%);
  border: 1px solid rgba(0, 180, 255, 0.25);
  padding: 44px 40px;
  text-align: center;
  position: relative;
  box-shadow: 0 0 60px rgba(0,150,255,0.08), inset 0 1px 0 rgba(0,200,255,0.08);
}

.intro-card::after, .finale-card::after {
  content: '';
  position: absolute;
  inset: 6px;
  border: 1px solid rgba(0,180,255,0.06);
  pointer-events: none;
}

.lab-badge {
  font-family: 'DM Mono', monospace;
  font-size: 0.65rem;
  letter-spacing: 4px;
  color: #0080c0;
  margin-bottom: 20px;
  display: block;
}
.lab-badge.green { color: #00c080; }

.antenna-glyph {
  font-size: 4rem;
  color: #00d4ff;
  display: block;
  margin-bottom: 16px;
  text-shadow: 0 0 20px rgba(0,200,255,0.5);
  animation: glyphPulse 3s ease-in-out infinite;
}
.antenna-glyph.green { color: #00c080; text-shadow: 0 0 20px rgba(0,200,120,0.5); animation: none; }

@keyframes glyphPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
}

.intro-title {
  font-family: 'Exo 2', sans-serif;
  font-size: 1.5rem;
  font-weight: 800;
  color: #e0f4ff;
  letter-spacing: 2px;
  margin-bottom: 4px;
}

.intro-sub {
  font-size: 0.65rem;
  letter-spacing: 3px;
  color: #1a5070;
  margin-bottom: 20px;
  font-family: 'DM Mono', monospace;
}

.divider-cyan {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0,200,255,0.4), transparent);
  margin: 20px 0;
}

.intro-text {
  font-size: 0.95rem;
  line-height: 1.8;
  color: #60a8c8;
  margin-bottom: 24px;
}

.spec-grid {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 32px;
}
.spec { display: flex; flex-direction: column; align-items: center; }
.sv { font-family: 'DM Mono', monospace; font-size: 1rem; color: #00d4ff; }
.sl { font-size: 0.55rem; letter-spacing: 2px; color: #1a5070; margin-top: 2px; }

.btn-start {
  background: transparent;
  border: 1px solid rgba(0,200,255,0.4);
  color: #00d4ff;
  padding: 12px 36px;
  font-family: 'Exo 2', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 3px;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-start:hover { background: rgba(0,200,255,0.08); box-shadow: 0 0 24px rgba(0,200,255,0.2); }

/* GAME LAYOUT */
.game-layout {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 24px;
  background: rgba(0, 5, 12, 0.9);
  border-bottom: 1px solid rgba(0,200,255,0.12);
  flex-shrink: 0;
}

.sys-label { font-size: 0.6rem; letter-spacing: 3px; color: #1a5070; font-family: 'DM Mono', monospace; margin-right: 8px; }
.sys-status { font-family: 'DM Mono', monospace; font-size: 0.75rem; color: #ff6030; }
.sys-status.active { color: #00d4ff; }

.step-track { display: flex; gap: 8px; }
.step-node {
  width: 32px; height: 32px;
  border: 1px solid rgba(0,200,255,0.2);
  display: flex; align-items: center; justify-content: center;
  font-family: 'DM Mono', monospace; font-size: 0.8rem; color: #1a4060;
  transition: all 0.3s; cursor: pointer;
}
.step-node.done { background: rgba(0,200,255,0.15); color: #00d4ff; border-color: rgba(0,200,255,0.5); }
.step-node.active { border-color: rgba(0,200,255,0.6); color: #00d4ff; box-shadow: 0 0 10px rgba(0,200,255,0.2); }

.gain-label { font-size: 0.6rem; letter-spacing: 2px; color: #1a5070; font-family: 'DM Mono', monospace; margin-right: 6px; }
.gain-val { font-family: 'DM Mono', monospace; font-size: 1rem; color: #00d4ff; }

.main-content {
  flex: 1;
  display: grid;
  grid-template-columns: 280px 1fr 240px;
  overflow: hidden;
}

/* ARRAY PANEL */
.array-panel {
  background: rgba(0, 5, 12, 0.95);
  border-right: 1px solid rgba(0,200,255,0.1);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}

.array-title {
  font-family: 'DM Mono', monospace;
  font-size: 0.55rem;
  letter-spacing: 3px;
  color: #1a5070;
  border-bottom: 1px solid rgba(0,200,255,0.08);
  padding-bottom: 6px;
}

.array-canvas { border: 1px solid rgba(0,200,255,0.12); }

.phase-legend {
  display: flex;
  gap: 1px;
  height: 8px;
  margin-top: 4px;
}
.phase-cell { flex: 1; border-radius: 1px; }
.legend-label { font-family: 'DM Mono', monospace; font-size: 0.5rem; color: #1a4050; letter-spacing: 1px; }

/* CENTER COLUMN */
.center-col {
  padding: 20px;
  overflow-y: auto;
}

.step-card {
  background: rgba(0,8,18,0.8);
  border: 1px solid rgba(0,200,255,0.12);
  padding: 24px;
}

.step-badge {
  font-family: 'DM Mono', monospace;
  font-size: 0.6rem;
  letter-spacing: 3px;
  color: #1a5070;
  margin-bottom: 8px;
}

.step-title {
  font-size: 1rem;
  font-weight: 700;
  color: #e0f4ff;
  letter-spacing: 1px;
  margin-bottom: 12px;
}

.step-body {
  font-size: 0.88rem;
  line-height: 1.7;
  color: #4080a0;
  margin-bottom: 20px;
}

.step-body strong { color: #00d4ff; }

/* Beam options */
.pattern-comparison {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.pattern-opt {
  border: 1px solid rgba(0,200,255,0.12);
  padding: 6px;
  cursor: pointer;
  text-align: center;
  transition: all 0.25s;
  background: rgba(0,5,12,0.5);
}
.pattern-opt:hover { border-color: rgba(0,200,255,0.35); }
.pattern-opt.selected { border-color: #00d4ff; background: rgba(0,200,255,0.06); box-shadow: 0 0 12px rgba(0,200,255,0.1); }
.small-pattern { border: none; display: block; }
.opt-label { font-family: 'DM Mono', monospace; font-size: 0.7rem; color: #4080a0; margin-top: 4px; }
.opt-angle { font-family: 'DM Mono', monospace; font-size: 0.75rem; color: #00d4ff; }

/* Null display */
.interference-display {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 16px;
  margin-bottom: 16px;
  align-items: start;
}
.null-canvas { border: 1px solid rgba(0,200,255,0.12); }
.signal-bars { display: flex; flex-direction: column; gap: 8px; padding-top: 8px; }
.sig-row { display: flex; align-items: center; gap: 8px; }
.dir-label { font-family: 'DM Mono', monospace; font-size: 0.7rem; color: #4080a0; min-width: 36px; }
.sig-bar-track { flex: 1; height: 10px; background: rgba(0,200,255,0.05); border: 1px solid rgba(0,200,255,0.1); overflow: hidden; }
.sig-bar-fill { height: 100%; transition: width 0.5s; }
.sig-val { font-family: 'DM Mono', monospace; font-size: 0.65rem; color: #4080a0; min-width: 30px; }

.null-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-bottom: 16px;
}
.null-btn {
  border: 1px solid rgba(0,200,255,0.12);
  padding: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  display: flex; flex-direction: column; gap: 2px;
}
.null-btn:hover { border-color: rgba(0,200,255,0.35); }
.null-btn.selected { border-color: #00d4ff; background: rgba(0,200,255,0.06); }
.null-angle { font-family: 'DM Mono', monospace; font-size: 0.85rem; color: #00d4ff; }
.null-desc { font-size: 0.65rem; color: #2a6080; }

/* Window grid */
.window-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}
.window-card {
  border: 1px solid rgba(0,200,255,0.12);
  padding: 8px;
  cursor: pointer;
  transition: all 0.25s;
  background: rgba(0,5,12,0.5);
}
.window-card:hover { border-color: rgba(0,200,255,0.35); }
.window-card.selected { border-color: #00d4ff; background: rgba(0,200,255,0.06); box-shadow: 0 0 12px rgba(0,200,255,0.1); }
.win-canvas { display: block; width: 100%; }
.win-name { font-size: 0.8rem; font-weight: 600; color: #c0e4f8; margin-top: 6px; }
.win-stats { display: flex; gap: 12px; margin-top: 2px; }
.ws { font-family: 'DM Mono', monospace; font-size: 0.7rem; }
.sll { color: #ff9060; }
.bw { color: #60c0e0; }

.btn-verify {
  background: transparent;
  border: 1px solid rgba(0,200,255,0.3);
  color: #00d4ff;
  padding: 10px 24px;
  font-family: 'Exo 2', sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-verify:hover:not(:disabled) { background: rgba(0,200,255,0.08); box-shadow: 0 0 16px rgba(0,200,255,0.2); }
.btn-verify:disabled { opacity: 0.3; cursor: not-allowed; }

.fb { margin-top: 12px; padding: 10px 14px; font-family: 'DM Mono', monospace; font-size: 0.78rem; line-height: 1.5; }
.fb-ok { background: rgba(0,200,120,0.08); border: 1px solid rgba(0,200,120,0.25); color: #00c890; }
.fb-err { background: rgba(255,80,50,0.08); border: 1px solid rgba(255,80,50,0.25); color: #ff7060; }

/* Solved panel */
.solved-panel {
  text-align: center;
  padding: 40px;
  border: 1px solid rgba(0,200,255,0.15);
  background: rgba(0,200,255,0.02);
}
.solved-check { font-size: 3rem; color: #00d4ff; margin-bottom: 12px; animation: popIn 0.4s ease; }
@keyframes popIn { 0% { transform: scale(0); } 70% { transform: scale(1.2); } 100% { transform: scale(1); } }
.solved-panel h3 { font-size: 1.2rem; color: #e0f4ff; margin-bottom: 8px; }
.solved-panel p { font-size: 0.8rem; color: #2a6080; font-family: 'DM Mono', monospace; margin-bottom: 20px; line-height: 1.6; }

.btn-next {
  background: rgba(0,200,255,0.08);
  border: 1px solid rgba(0,200,255,0.35);
  color: #00d4ff;
  padding: 10px 28px;
  font-family: 'Exo 2', sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-next:hover { background: rgba(0,200,255,0.15); box-shadow: 0 0 20px rgba(0,200,255,0.2); }

/* RIGHT PANEL */
.right-panel {
  background: rgba(0, 5, 12, 0.95);
  border-left: 1px solid rgba(0,200,255,0.1);
  padding: 16px;
  overflow-y: auto;
}

.r-title {
  font-family: 'DM Mono', monospace;
  font-size: 0.55rem;
  letter-spacing: 3px;
  color: #1a5070;
  border-bottom: 1px solid rgba(0,200,255,0.08);
  padding-bottom: 6px;
  margin-bottom: 8px;
}

.spectrum-canvas { border: 1px solid rgba(0,200,255,0.12); }

.param-list { display: flex; flex-direction: column; gap: 4px; }
.param-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid rgba(0,200,255,0.05); }
.p-name { font-family: 'DM Mono', monospace; font-size: 0.7rem; color: #1a5070; }
.p-val { font-family: 'DM Mono', monospace; font-size: 0.75rem; color: #00d4ff; }

.cal-log { display: flex; flex-direction: column; gap: 4px; }
.cal-entry { font-family: 'DM Mono', monospace; font-size: 0.65rem; line-height: 1.5; padding: 3px 0; border-bottom: 1px solid rgba(0,200,255,0.04); }
.cl-time { color: #0a2030; margin-right: 6px; }
.cl-info { color: #2a7090; }
.cl-ok { color: #00c890; }
.cl-warn { color: #ff9040; }

/* FINALE */
.finale-title { font-size: 2.2rem; font-weight: 800; color: #e0f4ff; letter-spacing: 4px; margin-bottom: 8px; }
.finale-sub { color: #4080a0; margin-bottom: 16px; }
.final-specs { margin: 16px 0; display: flex; flex-direction: column; gap: 6px; }
.fs-row { display: flex; justify-content: space-between; padding: 6px 16px; border-bottom: 1px solid rgba(0,200,255,0.08); font-size: 0.85rem; }
.fs-row span { color: #2a6080; }
.fs-row strong { color: #00d4ff; font-family: 'DM Mono', monospace; }
.secret-reveal { padding: 20px; margin: 16px 0 24px; background: rgba(0,200,255,0.04); border: 1px solid rgba(0,200,255,0.15); }
.secret-reveal p { font-size: 0.75rem; color: #2a6080; font-family: 'DM Mono', monospace; margin-bottom: 8px; }
.secret-letter { font-size: 4rem; font-weight: 800; color: #00d4ff; text-shadow: 0 0 30px rgba(0,200,255,0.5); }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
