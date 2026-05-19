<template>
  <div class="nav-room" @keydown="handleKey" tabindex="0" ref="gameEl">
    <div class="ocean-bg">
      <div class="fog-layer fog-1"></div>
      <div class="fog-layer fog-2"></div>
      <div class="fog-layer fog-3"></div>
      <div class="stars-bg"></div>
    </div>

    <div class="room-container">

      <!-- INTRO OVERLAY -->
      <transition name="fade">
        <div v-if="phase === 'intro'" class="overlay">
          <div class="intro-card">
            <div class="ship-icon">⚓</div>
            <h1 class="intro-title">RUM II: NAVIGERA GENOM DIMMA</h1>
            <p class="intro-sub">Nordatlanten · 02:47</p>
            <div class="divider"></div>
            <p class="intro-text">
              Din båt är insnärjd i tjock dimma. Instrumenten är knappt läsbara.
              Tre fyrar blinkar i natten — men bara en leder till hamn.
              Tolka kompassen, läs vindriktningen och styr din väg till rätt fyr.
            </p>
            <div class="control-info">
              <div class="ctrl-item"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> eller pilknappar</div>
              <div class="ctrl-sep">·</div>
              <div class="ctrl-item">Styra båten</div>
            </div>
            <button class="btn-start" @click="startGame">SÄTT SEGEL →</button>
          </div>
        </div>
      </transition>

      <!-- GAME PHASE -->
      <transition name="fade">
        <div v-if="phase === 'game' || phase === 'clue'" class="game-view">

          <!-- HUD Top Bar -->
          <div class="hud-top">
            <div class="hud-item">
              <div class="hud-label">VIND</div>
              <div class="hud-val wind-display">
                <span class="wind-arrow" :style="{ transform: `rotate(${wind.deg}deg)` }">↑</span>
                {{ wind.label }}
              </div>
            </div>
            <div class="hud-center-title">⚓ NAVIGATIONSSYSTEM</div>
            <div class="hud-item right">
              <div class="hud-label">DJUP</div>
              <div class="hud-val">{{ depth }}m</div>
            </div>
          </div>

          <!-- Main game area -->
          <div class="game-area" ref="gameArea">

            <!-- Fog overlay -->
            <div class="map-fog" :style="{ opacity: fogOpacity }"></div>

            <!-- Ocean grid -->
            <div class="ocean-grid">
              <div
                v-for="row in gridSize"
                :key="'r'+row"
                class="grid-row"
              >
                <div
                  v-for="col in gridSize"
                  :key="'c'+col"
                  class="grid-cell"
                  :class="{
                    'visible': isVisible(row-1, col-1),
                    'wave': isWave(row-1, col-1)
                  }"
                ></div>
              </div>
            </div>

            <!-- Lighthouses -->
            <div
              v-for="lh in lighthouses"
              :key="lh.id"
              class="lighthouse"
              :style="{
                left: `${(lh.col / gridSize) * 100}%`,
                top: `${(lh.row / gridSize) * 100}%`,
              }"
              :class="{ visible: isVisible(lh.row, lh.col), pulsing: lh.pulsing }"
            >
              <div class="lh-beam" :style="{ animationDelay: lh.beamDelay }"></div>
              <div class="lh-icon">🗼</div>
              <div class="lh-blink" :class="['blink-'+lh.pattern]">
                <span v-for="b in lh.pattern" :key="b" class="blink-dot" :style="{ animationDelay: `${b * 0.4}s` }"></span>
              </div>
              <div class="lh-label" v-if="isVisible(lh.row, lh.col)">FYR {{ lh.id }}</div>
            </div>

            <!-- Boat -->
            <div
              class="boat"
              :style="{
                left: `${(boat.col / gridSize) * 100}%`,
                top: `${(boat.row / gridSize) * 100}%`,
                transform: `translate(-50%,-50%) rotate(${boat.heading}deg)`
              }"
              :class="{ moving: boat.moving, colliding: boat.colliding }"
            >
              <div class="boat-icon">🚢</div>
              <div class="boat-wake"></div>
            </div>

            <!-- Arrival zone indicator (invisible until near) -->
            <div
              v-if="showTarget"
              class="target-zone"
              :style="{
                left: `${(targetLH.col / gridSize) * 100}%`,
                top: `${(targetLH.row / gridSize) * 100}%`,
              }"
            ></div>
          </div>

          <!-- COMPASS + INSTRUMENTS row -->
          <div class="instruments-bar">

            <!-- Compass -->
            <div class="instrument-panel">
              <div class="inst-label">KOMPASS</div>
              <div class="compass-wrap">
                <div class="compass-ring">
                  <span class="compass-n">N</span>
                  <span class="compass-s">S</span>
                  <span class="compass-e">Ö</span>
                  <span class="compass-w">V</span>
                  <div class="compass-needle-wrap" :style="{ transform: `rotate(${-boat.heading}deg)` }">
                    <div class="compass-needle"></div>
                  </div>
                </div>
                <div class="compass-heading">{{ headingLabel }}</div>
              </div>
            </div>

            <!-- Lighthouse signals info -->
            <div class="instrument-panel signals-panel">
              <div class="inst-label">FYRBLINKNINGAR</div>
              <div class="signal-list">
                <div v-for="lh in lighthouses" :key="'sig'+lh.id" class="signal-row">
                  <span class="sig-id">FYR {{ lh.id }}</span>
                  <span class="sig-dots">
                    <span v-for="b in lh.pattern" :key="b" class="sig-dot" :style="{ animationDelay: `${b * 0.4}s` }"></span>
                  </span>
                  <span class="sig-bearing">{{ lhBearing(lh) }}</span>
                </div>
              </div>
              <div class="clue-box" v-if="showClueBox">
                <strong>LEDTRÅD:</strong> {{ activeClue }}
              </div>
            </div>

            <!-- Controls -->
            <div class="instrument-panel controls-panel">
              <div class="inst-label">STYRNING</div>
              <div class="dpad">
                <button class="dpad-btn up" @click="moveBoat('up')" @touchstart.prevent="moveBoat('up')">▲</button>
                <div class="dpad-middle">
                  <button class="dpad-btn left" @click="moveBoat('left')" @touchstart.prevent="moveBoat('left')">◄</button>
                  <div class="dpad-center">✛</div>
                  <button class="dpad-btn right" @click="moveBoat('right')" @touchstart.prevent="moveBoat('right')">►</button>
                </div>
                <button class="dpad-btn down" @click="moveBoat('down')" @touchstart.prevent="moveBoat('down')">▼</button>
              </div>
              <div class="speed-display">
                <span class="speed-val">{{ speed }}</span>
                <span class="speed-unit">knop</span>
              </div>
            </div>

          </div>

          <!-- Message log -->
          <div class="message-log">
            <transition-group name="msg" tag="div" class="log-inner">
              <div v-for="msg in messages" :key="msg.id" class="log-msg" :class="msg.type">
                <span class="msg-time">{{ msg.time }}</span>
                {{ msg.text }}
              </div>
            </transition-group>
          </div>

        </div>
      </transition>

      <!-- CLUE OVERLAY -->
      <transition name="fade">
        <div v-if="phase === 'clue'" class="overlay clue-overlay">
          <div class="clue-card">
            <div class="clue-icon">🗼</div>
            <h2 class="clue-heading">FYR {{ arrivedAt?.id }} — {{ arrivedAt?.name }}</h2>
            <div class="divider"></div>
            <div v-if="arrivedAt?.correct" class="correct-arrival">
              <div class="correct-star">⭐</div>
              <p class="correct-text">Rätt fyr! Du navigerade framgångsrikt genom dimman.</p>
              <div class="letter-reveal">
                Din bokstav: <span class="letter-big">{{ secretLetter }}</span>
              </div>
              <button class="btn-continue" @click="goNext">NÄSTA NIVÅ →</button>
            </div>
            <div v-else class="wrong-arrival">
              <div class="wrong-icon">⚠️</div>
              <p>{{ arrivedAt?.wrongMsg }}</p>
              <p class="retry-hint">Studera fyrarna igen och hitta rätt rutt.</p>
              <button class="btn-retry" @click="resumeGame">FÖRSÖK IGEN</button>
            </div>
          </div>
        </div>
      </transition>

      <!-- FINALE -->
      <transition name="fade">
        <div v-if="phase === 'finale'" class="overlay">
          <div class="finale-card">
            <div class="finale-icon">⚓</div>
            <h1 class="finale-title">I HAMN!</h1>
            <p class="finale-sub">Du navigerade framgångsrikt genom Nordatlantens dimma.</p>
            <div class="divider"></div>
            <div class="secret-box">
              <p>Din hemliga bokstav från detta rum är:</p>
              <div class="big-letter-box">{{ secretLetter }}</div>
              <p class="carry-on">Bär med dig denna bokstav vidare i escape-äventyret.</p>
            </div>
          </div>
        </div>
      </transition>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

function beginGame() {
  router.push('/level-19')
}

const phase = ref('intro')
const gridSize = 20
const fogOpacity = ref(0.85)
const secretLetter = 'A'

const boat = ref({ row: 17, col: 3, heading: 0, moving: false, colliding: false })
const wind = ref({ deg: 225, label: 'SV 14 kn' })
const depth = ref(42)
const speed = ref(8)
const messages = ref([])
const msgCounter = ref(0)
const arrivedAt = ref(null)
const showClueBox = ref(false)
const activeClue = ref('')
const waveTimer = ref(null)
const gameEl = ref(null)

const lighthouses = [
  { id: 1, name: 'Grå Klippa', row: 2, col: 16, pattern: 2, beamDelay: '0s', correct: false, wrongMsg: 'Fyr 1 — Grå Klippa. Denna fyr markerar ett farligt rev. Du drev iland!', pulsing: true, bearing: 'NÖ' },
  { id: 2, name: 'Havsfrun', row: 2, col: 10, pattern: 3, beamDelay: '0.5s', correct: true, pulsing: true, bearing: 'N' },
  { id: 3, name: 'Svarta Skäret', row: 10, col: 17, pattern: 1, beamDelay: '1s', correct: false, wrongMsg: 'Fyr 3 — Svarta Skäret. Korrupt navigationssignal — du leddes vilse!', pulsing: true, bearing: 'Ö' },
]

const headingLabel = computed(() => {
  const h = ((boat.value.heading % 360) + 360) % 360
  if (h < 22.5 || h >= 337.5) return 'N'
  if (h < 67.5) return 'NÖ'
  if (h < 112.5) return 'Ö'
  if (h < 157.5) return 'SÖ'
  if (h < 202.5) return 'S'
  if (h < 247.5) return 'SV'
  if (h < 292.5) return 'V'
  return 'NV'
})

const targetLH = computed(() => lighthouses.find(l => l.correct))
const showTarget = computed(() => {
  const lh = targetLH.value
  if (!lh) return false
  return isVisible(lh.row, lh.col)
})

function startGame() {
  phase.value = 'game'
  gameEl.value?.focus()
  addMessage('Dimman är tjock. Kompassen pekar mot N.', 'info')
  setTimeout(() => addMessage('Tre fyrar detekterade. Studera blinkningarna.', 'info'), 2000)
  setTimeout(() => addMessage('LEDTRÅD: Fyr med 3 blinkningar leder till hamn.', 'warning'), 5000)
  startWaveEffect()
}

function startWaveEffect() {
  waveTimer.value = setInterval(() => {
    depth.value = 38 + Math.floor(Math.random() * 12)
    speed.value = 6 + Math.floor(Math.random() * 5)
  }, 3000)
}

function handleKey(e) {
  const map = { 'w': 'up', 'W': 'up', 'ArrowUp': 'up', 's': 'down', 'S': 'down', 'ArrowDown': 'down', 'a': 'left', 'A': 'left', 'ArrowLeft': 'left', 'd': 'right', 'D': 'right', 'ArrowRight': 'right' }
  if (map[e.key]) { e.preventDefault(); moveBoat(map[e.key]) }
}

function moveBoat(dir) {
  if (phase.value !== 'game') return
  const { row, col } = boat.value
  let nr = row, nc = col, heading = boat.value.heading
  if (dir === 'up') { nr = Math.max(0, row - 1); heading = 0 }
  else if (dir === 'down') { nr = Math.min(gridSize - 1, row + 1); heading = 180 }
  else if (dir === 'left') { nc = Math.max(0, col - 1); heading = 270 }
  else if (dir === 'right') { nc = Math.min(gridSize - 1, col + 1); heading = 90 }
  boat.value = { ...boat.value, heading, moving: true, row: nr, col: nc }
  setTimeout(() => { boat.value.moving = false }, 150)
  checkLighthouseArrival()
}

function checkLighthouseArrival() {
  for (const lh of lighthouses) {
    if (Math.abs(boat.value.row - lh.row) <= 1 && Math.abs(boat.value.col - lh.col) <= 1) {
      arrivedAt.value = lh
      phase.value = 'clue'
      return
    }
  }
}

function resumeGame() {
  phase.value = 'game'
  boat.value = { row: 17, col: 3, heading: 0, moving: false, colliding: false }
  addMessage('Återgår till start. Studera signalerna noga.', 'warning')
  gameEl.value?.focus()
}

function isVisible(row, col) {
  return Math.abs(row - boat.value.row) <= 4 && Math.abs(col - boat.value.col) <= 4
}

function isWave(row, col) {
  return (row + col + Math.floor(Date.now() / 500)) % 7 === 0
}

function lhBearing(lh) { return lh.bearing }

function addMessage(text, type = 'info') {
  const now = new Date()
  const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
  messages.value.unshift({ id: msgCounter.value++, text, type, time })
  if (messages.value.length > 5) messages.value.pop()
}

function goNext() {
  router.push('/level-20')
}

onBeforeUnmount(() => {
  if (waveTimer.value) clearInterval(waveTimer.value)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

.nav-room {
  min-height: 100vh;
  background: #020b14;
  font-family: 'IBM Plex Sans', sans-serif;
  color: #7ecfea;
  position: relative;
  overflow: hidden;
  outline: none;
}

/* Ocean bg */
.ocean-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.stars-bg {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(1px 1px at 10% 15%, rgba(255,255,255,0.6) 0%, transparent 100%),
    radial-gradient(1px 1px at 30% 5%, rgba(255,255,255,0.4) 0%, transparent 100%),
    radial-gradient(1px 1px at 60% 20%, rgba(255,255,255,0.5) 0%, transparent 100%),
    radial-gradient(1px 1px at 85% 8%, rgba(255,255,255,0.3) 0%, transparent 100%),
    radial-gradient(1px 1px at 45% 12%, rgba(255,255,255,0.4) 0%, transparent 100%);
}

.fog-layer {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 50%, rgba(180, 200, 220, 0.12) 0%, transparent 70%);
  animation: fogDrift 8s ease-in-out infinite alternate;
}

.fog-1 { animation-duration: 7s; background: radial-gradient(ellipse at 20% 40%, rgba(160,190,210,0.1) 0%, transparent 60%); }
.fog-2 { animation-duration: 11s; background: radial-gradient(ellipse at 70% 60%, rgba(140,170,200,0.08) 0%, transparent 55%); animation-direction: alternate-reverse; }
.fog-3 { animation-duration: 9s; background: radial-gradient(ellipse at 50% 20%, rgba(200,210,220,0.06) 0%, transparent 50%); }

@keyframes fogDrift {
  0% { transform: translateX(-5%) translateY(-3%) scale(1); }
  100% { transform: translateX(5%) translateY(3%) scale(1.05); }
}

.room-container { position: relative; z-index: 1; height: 100vh; display: flex; flex-direction: column; }

/* OVERLAY */
.overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  background: rgba(2, 8, 16, 0.9);
  backdrop-filter: blur(6px);
}

.intro-card, .clue-card, .finale-card {
  max-width: 520px;
  width: 90%;
  background: linear-gradient(135deg, #050f1c 0%, #0a1a2e 100%);
  border: 1px solid rgba(0, 200, 255, 0.25);
  padding: 44px 40px;
  text-align: center;
  box-shadow:
    0 0 40px rgba(0, 180, 255, 0.1),
    inset 0 1px 0 rgba(0, 200, 255, 0.1);
  position: relative;
}

.intro-card::before, .clue-card::before, .finale-card::before {
  content: '';
  position: absolute;
  top: 8px; left: 8px; right: 8px; bottom: 8px;
  border: 1px solid rgba(0, 200, 255, 0.07);
  pointer-events: none;
}

.ship-icon, .clue-icon, .finale-icon { font-size: 3rem; margin-bottom: 16px; }

.intro-title {
  font-family: 'Orbitron', monospace;
  font-size: 1.3rem;
  font-weight: 900;
  color: #00d4ff;
  letter-spacing: 2px;
  margin-bottom: 4px;
  line-height: 1.3;
}

.intro-sub {
  font-size: 0.8rem;
  color: #3a7080;
  letter-spacing: 3px;
  margin-bottom: 20px;
}

.divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 200, 255, 0.4), transparent);
  margin: 20px 0;
}

.intro-text {
  font-size: 0.95rem;
  line-height: 1.8;
  color: #a0c8d8;
  margin-bottom: 24px;
}

.control-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 28px;
  font-size: 0.85rem;
  color: #5a9ab0;
}

kbd {
  background: rgba(0, 200, 255, 0.1);
  border: 1px solid rgba(0, 200, 255, 0.3);
  padding: 3px 7px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.8rem;
  color: #00d4ff;
  margin: 0 2px;
}

.ctrl-sep { color: #2a4a5a; }

.btn-start {
  background: linear-gradient(135deg, rgba(0,200,255,0.15), rgba(0,150,200,0.1));
  border: 1px solid rgba(0, 200, 255, 0.4);
  color: #00d4ff;
  padding: 14px 40px;
  font-family: 'Orbitron', monospace;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-start:hover {
  background: rgba(0, 200, 255, 0.2);
  box-shadow: 0 0 24px rgba(0, 200, 255, 0.3);
  transform: translateY(-2px);
}

/* GAME VIEW */
.game-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* HUD */
.hud-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 24px;
  background: rgba(0, 10, 20, 0.8);
  border-bottom: 1px solid rgba(0, 200, 255, 0.15);
  font-family: 'Share Tech Mono', monospace;
}

.hud-label { font-size: 0.6rem; letter-spacing: 3px; color: #2a6070; margin-bottom: 2px; }
.hud-val { font-size: 1rem; color: #00d4ff; }
.hud-center-title { font-family: 'Orbitron', monospace; font-size: 0.75rem; letter-spacing: 3px; color: #3a7080; }

.wind-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.wind-arrow {
  display: inline-block;
  font-size: 1.1rem;
  transition: transform 0.5s;
}

/* GAME AREA */
.game-area {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: radial-gradient(ellipse at 50% 60%, #021020 0%, #010810 100%);
}

.map-fog {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, transparent 25%, rgba(2, 11, 24, 0.9) 65%);
  pointer-events: none;
  z-index: 10;
  transition: opacity 0.5s;
}

/* Ocean grid */
.ocean-grid {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
}

.grid-row { display: flex; flex: 1; }

.grid-cell {
  flex: 1;
  border: 1px solid rgba(0, 80, 120, 0.08);
  transition: background 0.3s;
}

.grid-cell.visible {
  background: rgba(0, 60, 100, 0.15);
}

.grid-cell.wave {
  background: rgba(0, 100, 160, 0.2);
  animation: wavePulse 1s ease infinite;
}

@keyframes wavePulse {
  0%, 100% { background: rgba(0, 80, 140, 0.15); }
  50% { background: rgba(0, 120, 180, 0.25); }
}

/* Lighthouses */
.lighthouse {
  position: absolute;
  transform: translate(-50%, -50%);
  text-align: center;
  opacity: 0.3;
  transition: opacity 0.5s;
  z-index: 20;
}

.lighthouse.visible { opacity: 1; }

.lh-icon { font-size: 1.6rem; position: relative; z-index: 2; }
.lh-label { font-size: 0.55rem; letter-spacing: 2px; color: #00d4ff; margin-top: 2px; white-space: nowrap; }

.lh-beam {
  position: absolute;
  top: 0; left: 50%;
  width: 2px;
  height: 80px;
  background: linear-gradient(180deg, rgba(255,220,50,0.8) 0%, transparent 100%);
  transform-origin: top center;
  animation: rotate 3s linear infinite;
  opacity: 0.4;
}

@keyframes rotate { 0% { transform: translateX(-50%) rotate(0deg); } 100% { transform: translateX(-50%) rotate(360deg); } }

.lh-blink {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-top: 4px;
}

.blink-dot {
  width: 6px;
  height: 6px;
  background: #ffdc32;
  border-radius: 50%;
  animation: blink 1.2s ease-in-out infinite;
  box-shadow: 0 0 6px rgba(255, 220, 50, 0.6);
}

@keyframes blink {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 1; }
}

/* Boat */
.boat {
  position: absolute;
  font-size: 1.6rem;
  transform: translate(-50%, -50%);
  z-index: 30;
  transition: left 0.15s ease, top 0.15s ease, transform 0.2s ease;
  filter: drop-shadow(0 0 8px rgba(0, 200, 255, 0.6));
}

.boat.moving .boat-icon { animation: boatBob 0.15s ease; }

@keyframes boatBob {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

.boat-wake {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 8px;
  background: rgba(0, 200, 255, 0.2);
  border-radius: 50%;
  animation: wakeExpand 0.5s ease-out forwards;
}

@keyframes wakeExpand {
  0% { width: 8px; opacity: 0.6; }
  100% { width: 30px; opacity: 0; }
}

.target-zone {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  border: 2px solid rgba(0, 255, 150, 0.4);
  border-radius: 50%;
  animation: targetPulse 1s ease-in-out infinite;
  z-index: 15;
}

@keyframes targetPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
  50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
}

/* INSTRUMENTS BAR */
.instruments-bar {
  display: flex;
  gap: 0;
  background: rgba(0, 5, 12, 0.9);
  border-top: 1px solid rgba(0, 200, 255, 0.15);
  height: 180px;
}

.instrument-panel {
  flex: 1;
  padding: 12px 16px;
  border-right: 1px solid rgba(0, 200, 255, 0.1);
  display: flex;
  flex-direction: column;
}

.instrument-panel:last-child { border-right: none; }

.inst-label {
  font-size: 0.55rem;
  letter-spacing: 3px;
  color: #1a4a5a;
  font-family: 'Orbitron', monospace;
  margin-bottom: 10px;
}

/* Compass */
.compass-wrap { display: flex; flex-direction: column; align-items: center; }

.compass-ring {
  width: 80px;
  height: 80px;
  border: 2px solid rgba(0, 200, 255, 0.25);
  border-radius: 50%;
  position: relative;
  background: radial-gradient(circle, rgba(0,40,60,0.8) 0%, rgba(0,10,20,0.9) 100%);
  box-shadow: 0 0 16px rgba(0, 100, 160, 0.3), inset 0 0 12px rgba(0,0,0,0.5);
}

.compass-n, .compass-s, .compass-e, .compass-w {
  position: absolute;
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.65rem;
  color: #5abcd0;
}
.compass-n { top: 3px; left: 50%; transform: translateX(-50%); color: #ff4444; }
.compass-s { bottom: 3px; left: 50%; transform: translateX(-50%); }
.compass-e { right: 4px; top: 50%; transform: translateY(-50%); }
.compass-w { left: 4px; top: 50%; transform: translateY(-50%); }

.compass-needle-wrap {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.compass-needle {
  width: 3px;
  height: 32px;
  background: linear-gradient(180deg, #ff4444 0%, #ff4444 50%, #aaaaaa 50%, #aaaaaa 100%);
  border-radius: 2px;
  position: relative;
}

.compass-heading {
  font-family: 'Orbitron', monospace;
  font-size: 0.75rem;
  color: #00d4ff;
  margin-top: 6px;
  letter-spacing: 2px;
}

/* Signals */
.signals-panel { flex: 1.5; }

.signal-list { flex: 1; }

.signal-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  font-size: 0.75rem;
  font-family: 'Share Tech Mono', monospace;
}

.sig-id { color: #5abcd0; min-width: 50px; }

.sig-dots {
  display: flex;
  gap: 3px;
  align-items: center;
  flex: 1;
}

.sig-dot {
  width: 8px;
  height: 8px;
  background: rgba(255, 220, 50, 0.3);
  border-radius: 50%;
  animation: blink 1.2s ease-in-out infinite;
  box-shadow: 0 0 4px rgba(255, 220, 50, 0.2);
}

.sig-bearing { color: #3a7080; font-size: 0.7rem; min-width: 30px; text-align: right; }

.clue-box {
  background: rgba(255, 180, 0, 0.08);
  border: 1px solid rgba(255, 180, 0, 0.2);
  padding: 6px 10px;
  font-size: 0.75rem;
  color: #ffc060;
  margin-top: 4px;
  line-height: 1.4;
}

/* D-Pad */
.controls-panel { align-items: center; }

.dpad {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.dpad-middle { display: flex; gap: 2px; align-items: center; }

.dpad-btn {
  width: 36px;
  height: 36px;
  background: rgba(0, 200, 255, 0.08);
  border: 1px solid rgba(0, 200, 255, 0.25);
  color: #00d4ff;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}

.dpad-btn:hover, .dpad-btn:active {
  background: rgba(0, 200, 255, 0.2);
  box-shadow: 0 0 10px rgba(0, 200, 255, 0.3);
}

.dpad-center {
  width: 36px;
  height: 36px;
  background: rgba(0, 200, 255, 0.04);
  border: 1px solid rgba(0, 200, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1a5060;
  font-size: 0.8rem;
}

.speed-display {
  margin-top: 8px;
  font-family: 'Share Tech Mono', monospace;
  text-align: center;
}

.speed-val { font-size: 1.4rem; color: #00d4ff; }
.speed-unit { font-size: 0.65rem; color: #2a6070; margin-left: 4px; }

/* Message log */
.message-log {
  height: 60px;
  background: rgba(0, 3, 8, 0.9);
  border-top: 1px solid rgba(0, 200, 255, 0.08);
  overflow: hidden;
  padding: 0 16px;
}

.log-inner { display: flex; flex-direction: column; padding: 6px 0; }

.log-msg {
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.72rem;
  padding: 2px 0;
  display: flex;
  gap: 12px;
  transition: all 0.3s;
}

.log-msg.info { color: #4a9ab0; }
.log-msg.warning { color: #ffa040; }
.log-msg.success { color: #40d080; }
.log-msg.error { color: #e05050; }

.msg-time { color: #1a4050; min-width: 45px; }

/* Clue overlay */
.clue-overlay { background: rgba(2, 8, 16, 0.95); }

.clue-heading {
  font-family: 'Orbitron', monospace;
  font-size: 1.1rem;
  color: #00d4ff;
  margin-bottom: 4px;
}

.correct-arrival, .wrong-arrival { text-align: center; }

.correct-star { font-size: 3rem; animation: spin 0.8s ease; }

@keyframes spin {
  0% { transform: scale(0) rotate(-180deg); }
  100% { transform: scale(1) rotate(0); }
}

.correct-text { color: #a0d8e8; margin: 12px 0; font-size: 0.95rem; line-height: 1.7; }

.letter-reveal {
  font-family: 'Orbitron', monospace;
  font-size: 1rem;
  color: #5abcd0;
  margin: 16px 0;
}

.letter-big {
  font-size: 3.5rem;
  color: #00d4ff;
  font-weight: 900;
  display: block;
  margin: 8px 0;
  text-shadow: 0 0 30px rgba(0, 200, 255, 0.5);
}

.wrong-icon { font-size: 2.5rem; margin-bottom: 12px; }
.wrong-arrival p { color: #e07050; margin-bottom: 8px; line-height: 1.6; }
.retry-hint { color: #5a7080; font-size: 0.85rem; }

.btn-continue, .btn-retry {
  margin-top: 20px;
  background: transparent;
  border: 1px solid rgba(0, 200, 255, 0.4);
  color: #00d4ff;
  padding: 12px 32px;
  font-family: 'Orbitron', monospace;
  font-size: 0.8rem;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-continue:hover, .btn-retry:hover {
  background: rgba(0, 200, 255, 0.1);
  box-shadow: 0 0 20px rgba(0, 200, 255, 0.2);
}

.btn-retry { border-color: rgba(255, 120, 50, 0.4); color: #ff9050; }
.btn-retry:hover { background: rgba(255, 120, 50, 0.08); box-shadow: 0 0 20px rgba(255, 100, 50, 0.2); }

/* Finale */
.finale-title {
  font-family: 'Orbitron', monospace;
  font-size: 2.5rem;
  font-weight: 900;
  color: #00d4ff;
  letter-spacing: 6px;
  margin-bottom: 8px;
}

.finale-sub { color: #5abcd0; margin-bottom: 16px; }

.secret-box {
  background: rgba(0, 200, 255, 0.05);
  border: 1px solid rgba(0, 200, 255, 0.15);
  padding: 24px;
}

.big-letter-box {
  font-family: 'Orbitron', monospace;
  font-size: 5rem;
  font-weight: 900;
  color: #00d4ff;
  text-shadow: 0 0 40px rgba(0, 200, 255, 0.6);
  margin: 16px 0;
}

.carry-on { font-size: 0.8rem; color: #2a6070; letter-spacing: 1px; margin-top: 12px; }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.msg-enter-active, .msg-leave-active { transition: all 0.3s ease; }
.msg-enter-from { opacity: 0; transform: translateY(-10px); }
.msg-leave-to { opacity: 0; }
</style>
