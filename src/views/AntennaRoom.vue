<template>
  <div class="gripen-room" @keydown.prevent tabindex="0">
    <canvas ref="bgCanvas" class="bg-canvas"></canvas>

    <!-- INTRO -->
    <transition name="fade">
      <div v-if="phase === 'intro'" class="overlay">
        <div class="intro-card">
          <div class="classified-stamp">HEMLIGSTÄMPLAT</div>
          <div class="jet-icon">✈</div>
          <h1 class="intro-title">RCS-REDUCERING · JAS 39 GRIPEN</h1>
          <p class="intro-sub">FÖRSVARETS MATERIELVERK · CLEARANCE LEVEL 5</p>
          <div class="divider-red"></div>
          <p class="intro-text">
            Gripen har detekterats av fiendens X-bandsradar. Din uppgift: konfigurera
            planets ytgeometri och RAM-material för att minimera radarkorssektionen (RCS)
            under detektionsgränsen. Fienden vet vad de letar efter — du måste tänka smartare.
          </p>
          <div class="mission-stats">
            <div class="stat"><span class="stat-val">9.3 GHz</span><span class="stat-lbl">RADAR FREQ</span></div>
            <div class="stat"><span class="stat-val">-13 dBsm</span><span class="stat-lbl">MÅL-RCS</span></div>
            <div class="stat"><span class="stat-val">3 GÅTOR</span><span class="stat-lbl">UPPDRAG</span></div>
          </div>
          <button class="btn-start" @click="phase = 'game'; startRadarSweep()">INITIERA UPPDRAG →</button>
        </div>
      </div>
    </transition>

    <!-- GAME -->
    <transition name="fade">
      <div v-if="phase === 'game'" class="game-layout">

        <!-- Left: Radar display -->
        <div class="radar-panel">
          <div class="panel-title">RADARSKÄRM · PPI-VY</div>
          <div class="radar-scope">
            <canvas ref="radarCanvas" class="radar-canvas" width="320" height="320"></canvas>
            <div class="rcs-readout" :class="{ good: currentRCS <= targetRCS }">
              <span class="rcs-lbl">RCS</span>
              <span class="rcs-val">{{ currentRCS.toFixed(1) }} dBsm</span>
              <span class="rcs-target">MÅL: {{ targetRCS }} dBsm</span>
            </div>
          </div>
          <div class="threat-bar">
            <div class="threat-label">DETEKTIONSRISK</div>
            <div class="threat-track">
              <div class="threat-fill" :style="{ width: threatPercent + '%', background: threatColor }"></div>
            </div>
            <span class="threat-pct">{{ threatPercent }}%</span>
          </div>
        </div>

        <!-- Center: Puzzle area -->
        <div class="puzzle-area">
          <div class="mission-header">
            <div class="mission-num">UPPDRAG {{ activePuzzle }}/3</div>
            <div class="progress-dots">
              <span v-for="i in 3" :key="i" class="pdot" :class="{ done: solved.includes(i), active: activePuzzle === i }">
                {{ solved.includes(i) ? '✓' : i }}
              </span>
            </div>
          </div>

          <!-- PUZZLE 1: Facet angle selection -->
          <div v-if="activePuzzle === 1 && !solved.includes(1)" class="puzzle-card">
            <h2 class="puzzle-title">YTGEOMETRI: FACETTVINKEL</h2>
            <p class="puzzle-desc">
              En slät yta reflekterar radar rakt tillbaka mot källan. Genom att vinkla
              facetterna avleds strålen. Studera RCS-polärdiagrammet nedan —
              välj den konfiguration som ger <strong>minst bakre lob</strong> mot hotindikatorn (180°).
            </p>

            <div class="polar-display">
              <canvas ref="polarCanvas" class="polar-canvas" width="280" height="280"></canvas>
            </div>

            <div class="facet-options">
              <div
                v-for="opt in facetOptions"
                :key="opt.id"
                class="facet-card"
                :class="{ selected: selectedFacet === opt.id }"
                @click="selectedFacet = opt.id; drawPolar(opt)"
              >
                <div class="facet-visual">
                  <svg viewBox="0 0 60 40" class="facet-svg">
                    <polygon :points="opt.points" fill="rgba(255,100,0,0.15)" stroke="#ff6400" stroke-width="1.5"/>
                    <line x1="30" y1="40" x2="30" y2="0" stroke="rgba(0,200,255,0.3)" stroke-width="0.5" stroke-dasharray="2,2"/>
                  </svg>
                </div>
                <div class="facet-label">{{ opt.label }}</div>
                <div class="facet-angle">{{ opt.angle }}°</div>
              </div>
            </div>

            <button class="btn-check" :disabled="!selectedFacet" @click="checkP1">VERIFIERA KONFIGURATION</button>
            <div v-if="fb1" :class="['feedback', fb1.ok ? 'ok' : 'err']">{{ fb1.msg }}</div>
          </div>

          <!-- PUZZLE 2: RAM material selection -->
          <div v-if="activePuzzle === 2 && !solved.includes(2)" class="puzzle-card">
            <h2 class="puzzle-title">RAM-MATERIAL: ABSORPTIONSKURVA</h2>
            <p class="puzzle-desc">
              Radar Absorbing Material (RAM) reducerar reflektionen. Nedan visas
              absorptionskurvor för fyra material vid X-band (8–12 GHz).
              Gripen exponeras för <strong>9.3 GHz</strong>. Vilket material ger maximal absorption vid den frekvensen?
            </p>

            <div class="ram-chart-wrap">
              <canvas ref="ramCanvas" class="ram-canvas" width="400" height="220"></canvas>
              <div class="freq-marker" :style="{ left: freqMarkerX + 'px' }">
                <div class="freq-line"></div>
                <div class="freq-label">9.3 GHz</div>
              </div>
            </div>

            <div class="ram-options">
              <div
                v-for="mat in ramMaterials"
                :key="mat.id"
                class="ram-btn"
                :class="{ selected: selectedRAM === mat.id }"
                :style="{ '--clr': mat.color }"
                @click="selectedRAM = mat.id"
              >
                <span class="ram-dot"></span>
                {{ mat.name }}
              </div>
            </div>

            <button class="btn-check" :disabled="!selectedRAM" @click="checkP2">VERIFIERA MATERIAL</button>
            <div v-if="fb2" :class="['feedback', fb2.ok ? 'ok' : 'err']">{{ fb2.msg }}</div>
          </div>

          <!-- PUZZLE 3: Aspect angle puzzle -->
          <div v-if="activePuzzle === 3 && !solved.includes(3)" class="puzzle-card">
            <h2 class="puzzle-title">ASPEKTVINKEL: HOTANALYS</h2>
            <p class="puzzle-desc">
              Radarn placerad på marken detekterar Gripen från olika vinklar.
              Den monostatiska RCS varierar dramatiskt med aspektvinkeln.
              Bilden visar RCS-signaturen runt planet. Fienden radar står i riktning <strong>270° (väst)</strong>.
              Vilken manöver minimerar detektionssignaturen?
            </p>

            <div class="aspect-visual">
              <canvas ref="aspectCanvas" class="aspect-canvas" width="360" height="260"></canvas>
            </div>

            <div class="maneuver-grid">
              <div
                v-for="man in maneuvers"
                :key="man.id"
                class="maneuver-card"
                :class="{ selected: selectedManeuver === man.id }"
                @click="selectedManeuver = man.id; highlightManeuver(man)"
              >
                <div class="man-icon">{{ man.icon }}</div>
                <div class="man-name">{{ man.name }}</div>
                <div class="man-desc">{{ man.desc }}</div>
              </div>
            </div>

            <button class="btn-check" :disabled="!selectedManeuver" @click="checkP3">VERIFIERA MANÖVER</button>
            <div v-if="fb3" :class="['feedback', fb3.ok ? 'ok' : 'err']">{{ fb3.msg }}</div>
          </div>

          <!-- Solved state -->
          <div v-if="solved.includes(activePuzzle)" class="solved-card">
            <div class="solved-icon">✓</div>
            <h3>Uppdrag {{ activePuzzle }} slutfört</h3>
            <p>RCS reducerad med {{ [8, 12, 15][activePuzzle-1] }} dBsm</p>
            <button v-if="solved.length < 3" class="btn-next" @click="activePuzzle = nextUnsolved">NÄSTA UPPDRAG →</button>
            <button v-else class="btn-next" @click="phase = 'finale'">UPPDRAG KOMPLETT →</button>
          </div>
        </div>

        <!-- Right: Intel panel -->
        <div class="intel-panel">
          <div class="panel-title">TEKNISK INTEL</div>
          <div class="intel-item">
            <div class="intel-label">PLATTFORM</div>
            <div class="intel-val">JAS 39E Gripen</div>
          </div>
          <div class="intel-item">
            <div class="intel-label">RADARTYP</div>
            <div class="intel-val">Monostatisk X-band</div>
          </div>
          <div class="intel-item">
            <div class="intel-label">POLARISATION</div>
            <div class="intel-val">VV / HH</div>
          </div>
          <div class="intel-item">
            <div class="intel-label">FREKVENSBAND</div>
            <div class="intel-val">8–12 GHz</div>
          </div>
          <div class="divider-intel"></div>
          <div class="intel-hint">
            <div class="hint-title">💡 HINT</div>
            <div class="hint-text">{{ currentHint }}</div>
          </div>
          <div class="log-entries">
            <div v-for="entry in log" :key="entry.id" class="log-entry">
              <span class="log-time">{{ entry.time }}</span>
              <span :class="'log-' + entry.type">{{ entry.msg }}</span>
            </div>
          </div>
        </div>

      </div>
    </transition>

    <!-- FINALE -->
    <transition name="fade">
      <div v-if="phase === 'finale'" class="overlay">
        <div class="finale-card">
          <div class="classified-stamp green">AVKLASSIFICERAT</div>
          <div class="finale-icon">✈</div>
          <h1 class="finale-title">UPPDRAG LYCKAT</h1>
          <p class="finale-sub">Gripen är nu osynlig för fiendens radarsystem.</p>
          <div class="rcs-summary">
            <div class="rcs-before">INITIAL RCS: <strong>+4.2 dBsm</strong></div>
            <div class="rcs-arrow">→</div>
            <div class="rcs-after">FINAL RCS: <strong>-18.5 dBsm</strong></div>
          </div>
          <div class="divider-red"></div>
          <div class="secret-box">
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

const router = useRouter()
const phase = ref('intro')
const activePuzzle = ref(1)
const solved = ref([])
const secretLetter = 'R'

const bgCanvas = ref(null)
const radarCanvas = ref(null)
const polarCanvas = ref(null)
const ramCanvas = ref(null)
const aspectCanvas = ref(null)

const selectedFacet = ref(null)
const selectedRAM = ref(null)
const selectedManeuver = ref(null)
const fb1 = ref(null)
const fb2 = ref(null)
const fb3 = ref(null)

const currentRCS = ref(4.2)
const targetRCS = -13
const log = ref([])
let logId = 0
let radarAnimId = null
let sweepAngle = 0

const threatPercent = computed(() => {
  const v = Math.min(100, Math.max(0, ((currentRCS.value - targetRCS) / 20) * 100))
  return Math.round(v)
})
const threatColor = computed(() => {
  const p = threatPercent.value
  if (p > 70) return '#ff3030'
  if (p > 40) return '#ff9900'
  return '#00ff80'
})

const nextUnsolved = computed(() => {
  for (let i = 1; i <= 3; i++) if (!solved.value.includes(i)) return i
  return 1
})

const hints = [
  'En facett vinklad vid θ deflekterar inkommande radar bort från källan med 2θ.',
  'X-band absorbenter optimeras för λ/4 tjocklek vid 9–10 GHz.',
  'Minimera planet tvärsnittsarea mot hotriktningen — edge-on ger lägst RCS.',
]
const currentHint = computed(() => hints[activePuzzle.value - 1] || hints[0])

const facetOptions = [
  { id: 1, label: 'Platt yta', angle: 0, points: '5,35 55,35 55,30 5,30', correct: false },
  { id: 2, label: 'Svagt vinklad', angle: 15, points: '5,38 55,28 55,22 5,32', correct: false },
  { id: 3, label: 'Stealth-vinkel', angle: 35, points: '5,40 55,15 55,10 5,35', correct: true },
  { id: 4, label: 'Extremt vinklad', angle: 60, points: '5,40 55,5 52,3 2,38', correct: false },
]

const ramMaterials = [
  { id: 1, name: 'Ferrit-komposit', color: '#ff6b35', peak: 7.2, correct: false },
  { id: 2, name: 'Jaumann-absorbent', color: '#00d4ff', peak: 9.3, correct: true },
  { id: 3, name: 'Kolfiberväv', color: '#a0ff60', peak: 11.5, correct: false },
  { id: 4, name: 'Resistiv film', color: '#ff60c0', peak: 6.0, correct: false },
]

const freqMarkerX = 168

const maneuvers = [
  { id: 1, name: 'Nosattack', icon: '⬆', desc: 'Presentera noskon mot radar', correct: true },
  { id: 2, name: 'Bankad kurva', icon: '↗', desc: 'Vingsida mot radar', correct: false },
  { id: 3, name: 'Broadsidepassage', icon: '➡', desc: 'Sida mot radar', correct: false },
  { id: 4, name: 'Högdragstig', icon: '↖', desc: 'Underbellyexponering', correct: false },
]

function addLog(msg, type = 'info') {
  const now = new Date()
  const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`
  log.value.unshift({ id: logId++, msg, time, type })
  if (log.value.length > 6) log.value.pop()
}

function startRadarSweep() {
  nextTick(() => {
    drawRadar()
    drawRAMChart()
    drawAspect()
    drawPolar(facetOptions[0])
  })
  addLog('System initierat. Fiendepuls detekterad.', 'warn')
  addLog('Radarfrekvens: 9.3 GHz identifierad.', 'info')
}

function drawRadar() {
  const canvas = radarCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const cx = 160, cy = 160, r = 145

  function frame() {
    ctx.fillStyle = 'rgba(0,10,5,0.15)'
    ctx.fillRect(0, 0, 320, 320)

    // Grid circles
    ctx.strokeStyle = 'rgba(0,255,80,0.15)'
    ctx.lineWidth = 1
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath()
      ctx.arc(cx, cy, r * i / 4, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Cross lines
    ctx.beginPath()
    ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy)
    ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r)
    ctx.strokeStyle = 'rgba(0,255,80,0.1)'
    ctx.stroke()

    // Sweep
    const gradient = ctx.createConicalGradient ? null : null
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(sweepAngle)
    const grad = ctx.createLinearGradient(0, 0, r, 0)
    grad.addColorStop(0, 'rgba(0,255,80,0.5)')
    grad.addColorStop(1, 'rgba(0,255,80,0)')
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.arc(0, 0, r, -0.3, 0.3)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()
    ctx.restore()

    // Gripen blip - position changes based on RCS
    const blipAlpha = Math.max(0, Math.min(1, (currentRCS.value + 20) / 25))
    const blipR = 80 + Math.sin(Date.now() / 800) * 5
    const blipA = -Math.PI / 4 + Math.sin(Date.now() / 2000) * 0.2
    ctx.beginPath()
    ctx.arc(cx + blipR * Math.cos(blipA), cy + blipR * Math.sin(blipA), 4 + blipAlpha * 4, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,${Math.floor(100 - blipAlpha * 100)},0,${blipAlpha})`
    ctx.fill()
    if (blipAlpha > 0.3) {
      ctx.beginPath()
      ctx.arc(cx + blipR * Math.cos(blipA), cy + blipR * Math.sin(blipA), 12 + blipAlpha * 8, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(255,60,0,${blipAlpha * 0.4})`
      ctx.lineWidth = 1
      ctx.stroke()
    }

    sweepAngle += 0.025
    radarAnimId = requestAnimationFrame(frame)
  }
  frame()
}

function drawPolar(opt) {
  const canvas = polarCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const cx = 140, cy = 140, maxR = 110
  ctx.clearRect(0, 0, 280, 280)

  // Grid
  ctx.strokeStyle = 'rgba(255,100,0,0.15)'
  ctx.lineWidth = 1
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath(); ctx.arc(cx, cy, maxR * i / 3, 0, Math.PI * 2); ctx.stroke()
  }
  ctx.beginPath(); ctx.moveTo(cx - maxR, cy); ctx.lineTo(cx + maxR, cy); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx, cy - maxR); ctx.lineTo(cx, cy + maxR); ctx.stroke()

  // Labels
  ctx.fillStyle = 'rgba(255,100,0,0.5)'
  ctx.font = '10px monospace'
  ctx.fillText('0°', cx + maxR + 4, cy + 4)
  ctx.fillText('180°', cx - maxR - 28, cy + 4)
  ctx.fillText('90°', cx - 8, cy - maxR - 4)

  // RCS pattern based on facet angle
  const angle = opt.angle
  ctx.beginPath()
  let first = true
  for (let deg = 0; deg < 360; deg += 2) {
    const rad = (deg * Math.PI) / 180
    // Simplified pattern: main lobe at 0°, back lobe reduced by angle
    const mainLobe = Math.pow(Math.abs(Math.cos(rad)), 0.5 + angle / 60)
    const backLobe = Math.pow(Math.abs(Math.cos(rad - Math.PI)), 2 - angle / 40) * (1 - angle / 80)
    const sideLobes = Math.abs(Math.sin(rad * 2)) * 0.3
    const rcs = Math.max(0.05, mainLobe * 0.7 + backLobe * 0.4 + sideLobes) * maxR
    const x = cx + rcs * Math.cos(rad)
    const y = cy - rcs * Math.sin(rad)
    first ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    first = false
  }

  const isSolved = solved.value.includes(1)
  ctx.closePath()
  ctx.strokeStyle = isSolved ? '#00ff80' : '#ff6400'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = isSolved ? 'rgba(0,255,80,0.08)' : 'rgba(255,100,0,0.08)'
  ctx.fill()

  // Threat direction marker
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx - maxR, cy)
  ctx.strokeStyle = 'rgba(255,0,0,0.7)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([4, 3])
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = '#ff3030'
  ctx.font = '9px monospace'
  ctx.fillText('HOT', cx - maxR - 24, cy - 4)
}

function drawRAMChart() {
  const canvas = ramCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, 400, 220)

  // Background
  ctx.fillStyle = '#020a0f'
  ctx.fillRect(0, 0, 400, 220)

  // Grid
  ctx.strokeStyle = 'rgba(0,200,255,0.08)'
  ctx.lineWidth = 1
  for (let i = 0; i <= 4; i++) {
    const y = 20 + i * 44
    ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(380, y); ctx.stroke()
  }

  // Axes labels
  ctx.fillStyle = 'rgba(0,200,255,0.4)'
  ctx.font = '9px monospace'
  ctx.fillText('8', 36, 200); ctx.fillText('9', 120, 200); ctx.fillText('10', 200, 200)
  ctx.fillText('11', 288, 200); ctx.fillText('12 GHz', 355, 200)
  ctx.fillText('-40dB', 2, 30); ctx.fillText('-20dB', 2, 76); ctx.fillText('0dB', 6, 122)

  // Draw each material curve
  ramMaterials.forEach(mat => {
    ctx.beginPath()
    let first = true
    for (let f = 8; f <= 12; f += 0.05) {
      const x = 40 + ((f - 8) / 4) * 340
      // Gaussian absorption curve around peak
      const absorption = -35 * Math.exp(-Math.pow((f - mat.peak) / 0.8, 2)) - 2
      const y = 20 + ((absorption + 40) / 40) * 176
      first ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      first = false
    }
    ctx.strokeStyle = mat.color
    ctx.lineWidth = selectedRAM.value === mat.id ? 2.5 : 1.5
    ctx.globalAlpha = selectedRAM.value === mat.id ? 1 : 0.5
    ctx.stroke()
    ctx.globalAlpha = 1
  })

  // Legend
  ramMaterials.forEach((mat, i) => {
    ctx.fillStyle = mat.color
    ctx.fillRect(45 + i * 85, 6, 12, 3)
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '8px monospace'
    ctx.fillText(mat.name.split('-')[0], 60 + i * 85, 10)
  })
}

function drawAspect() {
  const canvas = aspectCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, 360, 260)
  ctx.fillStyle = '#020a0f'
  ctx.fillRect(0, 0, 360, 260)

  const cx = 180, cy = 130, maxR = 100

  // Grid rings
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath(); ctx.arc(cx, cy, maxR * i / 3, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(0,200,100,0.1)'; ctx.lineWidth = 1; ctx.stroke()
  }

  // RCS signature - realistic Gripen silhouette RCS
  ctx.beginPath()
  let first = true
  for (let deg = 0; deg < 360; deg++) {
    const rad = (deg * Math.PI) / 180
    // Realistic fighter RCS: nose~-15dBsm, broadside~+10dBsm, tail~-5dBsm
    const noseLobe = Math.exp(-Math.pow(deg / 25, 2)) * 0.3
    const tailLobe = Math.exp(-Math.pow((deg - 180) / 30, 2)) * 0.6
    const broadside1 = Math.exp(-Math.pow((deg - 90) / 15, 2)) * 1.0
    const broadside2 = Math.exp(-Math.pow((deg - 270) / 15, 2)) * 1.0
    const base = 0.15
    const rcs = (base + noseLobe + tailLobe + broadside1 + broadside2) * maxR
    const x = cx + rcs * Math.cos(rad)
    const y = cy - rcs * Math.sin(rad)
    first ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    first = false
  }
  ctx.closePath()
  ctx.strokeStyle = '#00d4a0'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.fillStyle = 'rgba(0,180,120,0.07)'
  ctx.fill()

  // Planet silhouette center
  ctx.fillStyle = 'rgba(255,150,50,0.8)'
  ctx.font = '22px serif'
  ctx.textAlign = 'center'
  ctx.fillText('✈', cx, cy + 8)
  ctx.textAlign = 'left'

  // Threat direction (270° = väst = left)
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx - maxR - 20, cy)
  ctx.strokeStyle = 'rgba(255,0,0,0.8)'
  ctx.lineWidth = 2
  ctx.setLineDash([5, 3])
  ctx.stroke()
  ctx.setLineDash([])

  // Threat arrow
  ctx.beginPath()
  ctx.moveTo(cx - maxR - 20, cy)
  ctx.lineTo(cx - maxR - 10, cy - 6)
  ctx.lineTo(cx - maxR - 10, cy + 6)
  ctx.closePath()
  ctx.fillStyle = '#ff3030'
  ctx.fill()

  ctx.fillStyle = '#ff3030'
  ctx.font = '9px monospace'
  ctx.fillText('RADAR 270°', cx - maxR - 20, cy - 10)

  // Degree markers
  ctx.fillStyle = 'rgba(0,200,150,0.4)'
  ctx.font = '9px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('N 0°', cx, cy - maxR - 8)
  ctx.fillText('S 180°', cx, cy + maxR + 14)
  ctx.textAlign = 'left'
  ctx.fillText('Ö 90°', cx + maxR + 4, cy + 4)
}

function highlightManeuver(man) {
  drawAspect()
  const canvas = aspectCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const cx = 180, cy = 130
  // Show optimal heading arrow
  const headings = { 1: 0, 2: 45, 3: 90, 4: 315 }
  const deg = headings[man.id] || 0
  const rad = (deg - 90) * Math.PI / 180
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx + 70 * Math.cos(rad), cy + 70 * Math.sin(rad))
  ctx.strokeStyle = solved.value.includes(3) ? '#00ff80' : '#ff9900'
  ctx.lineWidth = 2.5
  ctx.stroke()
}

function checkP1() {
  const opt = facetOptions.find(f => f.id === selectedFacet.value)
  if (opt?.correct) {
    fb1.value = { ok: true, msg: '✓ Korrekt — 35° avleder X-bandsradar optimalt. RCS reducerad med 8 dBsm.' }
    solved.value.push(1)
    currentRCS.value -= 8
    addLog('Facettgeometri optimerad. RCS -8 dBsm.', 'ok')
  } else {
    fb1.value = { ok: false, msg: '✗ Fel vinkel. Studera bakloben mot 180° i polärdiagrammet.' }
    addLog('Facettkonfiguration avslagen.', 'warn')
    setTimeout(() => fb1.value = null, 3000)
  }
}

function checkP2() {
  const mat = ramMaterials.find(m => m.id === selectedRAM.value)
  if (mat?.correct) {
    fb2.value = { ok: true, msg: '✓ Jaumann-absorbent: peak absorption vid 9.3 GHz. RCS reducerad med 12 dBsm.' }
    solved.value.push(2)
    currentRCS.value -= 12
    addLog('RAM-material applicerat. RCS -12 dBsm.', 'ok')
  } else {
    fb2.value = { ok: false, msg: '✗ Fel material. Kontrollera absorptionskurvan vid 9.3 GHz.' }
    addLog('Fel RAM-material valt.', 'warn')
    setTimeout(() => fb2.value = null, 3000)
  }
}

function checkP3() {
  const man = maneuvers.find(m => m.id === selectedManeuver.value)
  if (man?.correct) {
    fb3.value = { ok: true, msg: '✓ Nosattack mot radar: presenterar minst tvärsnittsarea. RCS reducerad med 15 dBsm.' }
    solved.value.push(3)
    currentRCS.value -= 15
    addLog('Optimal aspektvinkel. RCS -15 dBsm.', 'ok')
  } else {
    fb3.value = { ok: false, msg: '✗ Fel manöver. Tänk på vilken del av planet som har minst RCS-signatur.' }
    addLog('Suboptimal manöver vald.', 'warn')
    setTimeout(() => fb3.value = null, 3000)
  }
}

function goNext() {
  router.push('/level-44')
}

onMounted(() => {
  // bg canvas - static starfield
  const canvas = bgCanvas.value
  if (canvas) {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#000a05'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    for (let i = 0; i < 200; i++) {
      ctx.beginPath()
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 1.2, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(0,255,80,${Math.random() * 0.3})`
      ctx.fill()
    }
  }
})

onBeforeUnmount(() => {
  if (radarAnimId) cancelAnimationFrame(radarAnimId)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

.gripen-room {
  min-height: 100vh;
  background: #000a05;
  font-family: 'Rajdhani', sans-serif;
  color: #00ff80;
  position: relative;
  overflow: hidden;
}

.bg-canvas {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

/* OVERLAY */
.overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  background: rgba(0, 5, 2, 0.93);
  backdrop-filter: blur(6px);
}

.intro-card, .finale-card {
  max-width: 580px;
  width: 92%;
  background: linear-gradient(135deg, #000f07 0%, #001a0d 100%);
  border: 1px solid rgba(0, 255, 80, 0.3);
  padding: 44px 40px;
  text-align: center;
  position: relative;
  box-shadow: 0 0 60px rgba(0, 255, 80, 0.08), inset 0 1px 0 rgba(0, 255, 80, 0.1);
}

.intro-card::before, .finale-card::before {
  content: '';
  position: absolute;
  inset: 6px;
  border: 1px solid rgba(0, 255, 80, 0.07);
  pointer-events: none;
}

.classified-stamp {
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 5px;
  color: #ff3030;
  border: 1px solid rgba(255,48,48,0.4);
  display: inline-block;
  padding: 3px 12px;
  margin-bottom: 20px;
  animation: stampPulse 2s ease-in-out infinite;
}

.classified-stamp.green { color: #00ff80; border-color: rgba(0,255,80,0.4); animation: none; }

@keyframes stampPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.jet-icon, .finale-icon {
  font-size: 3.5rem;
  margin-bottom: 16px;
  display: block;
  filter: drop-shadow(0 0 12px rgba(0,255,80,0.4));
}

.intro-title {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #00ff80;
  letter-spacing: 3px;
  margin-bottom: 4px;
}

.intro-sub {
  font-size: 0.7rem;
  letter-spacing: 3px;
  color: #006030;
  margin-bottom: 20px;
  font-family: 'Share Tech Mono', monospace;
}

.divider-red {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,48,48,0.5), transparent);
  margin: 20px 0;
}

.intro-text {
  font-size: 1rem;
  line-height: 1.7;
  color: #60c080;
  margin-bottom: 24px;
}

.mission-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 32px;
}

.stat { display: flex; flex-direction: column; align-items: center; }
.stat-val { font-family: 'Share Tech Mono', monospace; font-size: 1.1rem; color: #00ff80; }
.stat-lbl { font-size: 0.6rem; letter-spacing: 2px; color: #006030; margin-top: 2px; }

.btn-start {
  background: transparent;
  border: 1px solid rgba(0, 255, 80, 0.5);
  color: #00ff80;
  padding: 12px 36px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 3px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-start:hover {
  background: rgba(0, 255, 80, 0.1);
  box-shadow: 0 0 24px rgba(0, 255, 80, 0.3);
}

/* GAME LAYOUT */
.game-layout {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 280px 1fr 220px;
  height: 100vh;
  gap: 0;
}

/* RADAR PANEL */
.radar-panel {
  background: rgba(0, 10, 5, 0.95);
  border-right: 1px solid rgba(0, 255, 80, 0.15);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-title {
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.6rem;
  letter-spacing: 3px;
  color: #006030;
  border-bottom: 1px solid rgba(0, 255, 80, 0.1);
  padding-bottom: 8px;
}

.radar-scope {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.radar-canvas {
  border: 1px solid rgba(0, 255, 80, 0.2);
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(0, 255, 80, 0.1), inset 0 0 20px rgba(0,0,0,0.5);
}

.rcs-readout {
  margin-top: 12px;
  text-align: center;
  padding: 8px 16px;
  border: 1px solid rgba(255, 50, 50, 0.3);
  background: rgba(255,0,0,0.05);
  width: 100%;
  transition: all 0.5s;
}

.rcs-readout.good {
  border-color: rgba(0, 255, 80, 0.3);
  background: rgba(0, 255, 80, 0.05);
}

.rcs-lbl { font-size: 0.6rem; letter-spacing: 3px; color: #006030; display: block; }
.rcs-val { font-family: 'Share Tech Mono', monospace; font-size: 1.4rem; color: #ff3030; display: block; }
.rcs-readout.good .rcs-val { color: #00ff80; }
.rcs-target { font-size: 0.65rem; color: #004020; font-family: 'Share Tech Mono', monospace; }

.threat-bar { }
.threat-label { font-size: 0.6rem; letter-spacing: 2px; color: #006030; margin-bottom: 4px; }
.threat-track {
  height: 6px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(0,255,80,0.1);
  overflow: hidden;
}
.threat-fill { height: 100%; transition: all 0.5s; }
.threat-pct { font-family: 'Share Tech Mono', monospace; font-size: 0.75rem; }

/* PUZZLE AREA */
.puzzle-area {
  padding: 20px 24px;
  overflow-y: auto;
  border-right: 1px solid rgba(0, 255, 80, 0.1);
}

.mission-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.mission-num {
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 3px;
  color: #006030;
}

.progress-dots { display: flex; gap: 8px; }
.pdot {
  width: 32px; height: 32px;
  border: 1px solid rgba(0,255,80,0.2);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.8rem; color: #004020;
  cursor: pointer; transition: all 0.3s;
  font-family: 'Share Tech Mono', monospace;
}
.pdot.done { background: rgba(0,255,80,0.2); color: #00ff80; border-color: #00ff80; }
.pdot.active { border-color: rgba(0,255,80,0.6); color: #00ff80; }

.puzzle-card {
  background: rgba(0, 15, 8, 0.8);
  border: 1px solid rgba(0, 255, 80, 0.15);
  padding: 24px;
}

.puzzle-title {
  font-size: 1rem;
  font-weight: 700;
  color: #00ff80;
  letter-spacing: 2px;
  margin-bottom: 12px;
}

.puzzle-desc {
  font-size: 0.9rem;
  line-height: 1.7;
  color: #60a070;
  margin-bottom: 20px;
}

.puzzle-desc strong { color: #00ff80; }

/* Polar */
.polar-display { display: flex; justify-content: center; margin-bottom: 16px; }
.polar-canvas {
  border: 1px solid rgba(255, 100, 0, 0.2);
  background: #020a05;
}

/* Facet options */
.facet-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.facet-card {
  border: 1px solid rgba(0, 255, 80, 0.15);
  padding: 8px;
  cursor: pointer;
  text-align: center;
  transition: all 0.25s;
  background: rgba(0, 10, 5, 0.5);
}

.facet-card:hover { border-color: rgba(0, 255, 80, 0.4); background: rgba(0,255,80,0.05); }
.facet-card.selected { border-color: #00ff80; background: rgba(0,255,80,0.1); box-shadow: 0 0 12px rgba(0,255,80,0.15); }

.facet-svg { width: 100%; height: 40px; }
.facet-label { font-size: 0.7rem; color: #60a070; margin-top: 4px; }
.facet-angle { font-family: 'Share Tech Mono', monospace; font-size: 0.8rem; color: #00ff80; }

/* RAM chart */
.ram-chart-wrap { position: relative; margin-bottom: 16px; }
.ram-canvas { border: 1px solid rgba(0,200,255,0.15); background: #020a0f; display: block; }

.freq-marker {
  position: absolute;
  top: 0; bottom: 30px;
  pointer-events: none;
}
.freq-line { width: 1px; height: 100%; background: rgba(255,255,0,0.6); }
.freq-label {
  position: absolute;
  top: 4px;
  left: 4px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.65rem;
  color: #ffff00;
  white-space: nowrap;
}

.ram-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.ram-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid rgba(255,255,255,0.1);
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
  color: #80a090;
}

.ram-btn:hover { border-color: var(--clr); color: var(--clr); }
.ram-btn.selected { border-color: var(--clr); background: rgba(255,255,255,0.05); color: var(--clr); }
.ram-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--clr); flex-shrink: 0; }

/* Aspect */
.aspect-visual { margin-bottom: 16px; }
.aspect-canvas { border: 1px solid rgba(0,200,100,0.15); background: #020a0f; display: block; }

.maneuver-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.maneuver-card {
  border: 1px solid rgba(0, 255, 80, 0.15);
  padding: 12px;
  cursor: pointer;
  transition: all 0.25s;
  background: rgba(0, 10, 5, 0.5);
}

.maneuver-card:hover { border-color: rgba(0, 255, 80, 0.4); }
.maneuver-card.selected { border-color: #00ff80; background: rgba(0,255,80,0.08); }
.man-icon { font-size: 1.5rem; margin-bottom: 4px; }
.man-name { font-size: 0.9rem; font-weight: 600; color: #00ff80; }
.man-desc { font-size: 0.75rem; color: #406050; margin-top: 2px; }

.btn-check {
  background: transparent;
  border: 1px solid rgba(0,255,80,0.3);
  color: #00ff80;
  padding: 10px 24px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-check:hover:not(:disabled) { background: rgba(0,255,80,0.1); box-shadow: 0 0 16px rgba(0,255,80,0.2); }
.btn-check:disabled { opacity: 0.3; cursor: not-allowed; }

.feedback {
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 0.85rem;
  font-family: 'Share Tech Mono', monospace;
}
.feedback.ok { background: rgba(0,255,80,0.08); border: 1px solid rgba(0,255,80,0.25); color: #00ff80; }
.feedback.err { background: rgba(255,50,50,0.08); border: 1px solid rgba(255,50,50,0.25); color: #ff6060; }

/* Solved card */
.solved-card {
  text-align: center;
  padding: 40px;
  border: 1px solid rgba(0,255,80,0.2);
  background: rgba(0,255,80,0.03);
}

.solved-icon {
  font-size: 3rem;
  color: #00ff80;
  margin-bottom: 12px;
  animation: scalePop 0.5s ease;
}

@keyframes scalePop {
  0% { transform: scale(0); }
  70% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.solved-card h3 { font-size: 1.3rem; color: #00ff80; margin-bottom: 8px; }
.solved-card p { font-size: 0.85rem; color: #406050; font-family: 'Share Tech Mono', monospace; margin-bottom: 20px; }

.btn-next {
  background: rgba(0,255,80,0.1);
  border: 1px solid rgba(0,255,80,0.4);
  color: #00ff80;
  padding: 10px 28px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-next:hover { background: rgba(0,255,80,0.2); box-shadow: 0 0 20px rgba(0,255,80,0.25); }

/* INTEL PANEL */
.intel-panel {
  background: rgba(0, 8, 4, 0.95);
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.intel-item {
  border-bottom: 1px solid rgba(0,255,80,0.06);
  padding-bottom: 8px;
}
.intel-label { font-size: 0.55rem; letter-spacing: 2px; color: #004020; font-family: 'Share Tech Mono', monospace; }
.intel-val { font-size: 0.85rem; color: #60c080; }

.divider-intel { height: 1px; background: rgba(0,255,80,0.1); }

.hint-title { font-size: 0.65rem; letter-spacing: 2px; color: #00ff80; margin-bottom: 6px; }
.hint-text { font-size: 0.78rem; line-height: 1.6; color: #50a060; font-style: italic; }

.log-entries { margin-top: 8px; display: flex; flex-direction: column; gap: 4px; }
.log-entry { display: flex; flex-direction: column; font-family: 'Share Tech Mono', monospace; font-size: 0.65rem; padding: 4px 0; border-bottom: 1px solid rgba(0,255,80,0.05); }
.log-time { color: #003015; }
.log-info { color: #40a060; }
.log-ok { color: #00ff80; }
.log-warn { color: #ff9900; }

/* Finale */
.finale-title { font-size: 2.5rem; font-weight: 700; color: #00ff80; letter-spacing: 6px; margin-bottom: 8px; }
.finale-sub { color: #60c080; margin-bottom: 16px; }

.rcs-summary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.85rem;
}
.rcs-before { color: #ff6060; }
.rcs-arrow { color: #006030; }
.rcs-after { color: #00ff80; }

.secret-box {
  background: rgba(0,255,80,0.05);
  border: 1px solid rgba(0,255,80,0.2);
  padding: 20px;
  margin: 16px 0 24px;
}
.secret-box p { font-size: 0.8rem; color: #406050; font-family: 'Share Tech Mono', monospace; margin-bottom: 8px; }
.secret-letter { font-size: 4rem; font-weight: 700; color: #00ff80; text-shadow: 0 0 30px rgba(0,255,80,0.5); }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
