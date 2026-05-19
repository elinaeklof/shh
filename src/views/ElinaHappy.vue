<template>
  <main class="game" @mousemove="moveWorld">
    <div class="background-grid"></div>
    <div class="vignette"></div>

    <section class="topbar glass">
      <div>
        <h1>Gör Elina glas</h1>
        <p class="subtitle">Lista ut orden. Överlev Elinas humör.</p>
      </div>

      <div class="status-panel">
        <div class="status">
          <span>Elinas humör</span>
          <strong>{{ moodLabel }}</strong>
          <div class="bar">
            <i :style="{ width: moodMeter + '%' }"></i>
          </div>
        </div>

        <div class="status">
          <span>Portal</span>
          <strong>{{ unlockedWords.length }}/4</strong>
          <div class="bar purple">
            <i :style="{ width: unlockedWords.length * 25 + '%' }"></i>
          </div>
        </div>
      </div>
    </section>

    <section class="world" :style="worldTransform">
      <div class="light one"></div>
      <div class="light two"></div>

      <section class="elina-room glass" :class="mood">
        <div class="dialog-box">
          <p class="speaker">ELINA</p>
          <h2>{{ currentPuzzle.question }}</h2>
          <p class="dialog-hint">{{ currentPuzzle.hint }}</p>
        </div>

        <div class="elina-character">
          <div class="hair"></div>
          <div class="head">
            <div class="eye left"></div>
            <div class="eye right"></div>
            <div class="mouth"></div>
            <div class="blush left"></div>
            <div class="blush right"></div>
          </div>
          <div class="body">ELINA</div>
        </div>

        <div class="emotion-text">{{ elinaReaction }}</div>
      </section>

      <section class="portal-room">
        <div class="portal" :class="{ active: completed }">
          <div class="ring ring1"></div>
          <div class="ring ring2"></div>
          <div class="ring ring3"></div>

          <div class="portal-core">
            <span v-if="!completed">{{ unlockedWords.length }}</span>
            <span v-else>✨</span>
          </div>
        </div>

        <div class="glyphs">
          <span v-for="(word, i) in unlockedWords" :key="word" :style="glyphStyle(i)">
            {{ word }}
          </span>
        </div>
      </section>
    </section>

    <section class="terminal glass">
      <div class="terminal-header">
        <div class="dots">
          <i></i><i></i><i></i>
        </div>
        <span>RICHARD_TERMINAL.exe</span>
      </div>

      <div class="history">
        <div
          v-for="(line, index) in history"
          :key="index"
          class="line"
          :class="line.type"
        >
          {{ line.text }}
        </div>
      </div>

      <div class="input-row">
        <span>&gt;</span>
        <input
          v-model="answer"
          type="text"
          placeholder="Skriv ett ord..."
          @keyup.enter="submitAnswer"
        />

        <button @click="submitAnswer">Skicka</button>
      </div>
    </section>

    <div v-if="shake" class="screen-shake"></div>

    <div v-if="completed" class="ending">
      <div class="ending-card glass">
        <h2>PORTALEN ÖPPNAS</h2>
        <p>
          Som grattis får du ett freecard! <br> säg ordet "pecan" och Elina får inte säga ett ord till på natten. 
        </p>

        <div class="final-words">
          <span v-for="word in unlockedWords" :key="word">{{ word }}</span>
        </div>

        <button @click="restart">Spela igen</button>
      </div>
    </div>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue'

const answer = ref('')
const currentIndex = ref(0)
const shake = ref(false)
const moodMeter = ref(78)
const mood = ref('neutral')
const completed = ref(false)
const unlockedWords = ref([])
const worldTransform = ref({ transform: 'rotateX(8deg) rotateY(-8deg)' })

const history = ref([
  {
    text: 'SYSTEM: Ett ord känns gömt i rummet.',
    type: 'system'
  }
])

const puzzles = [
  {
    answer: 'pannpuss',
    question: '"Richard..."   Elina tittar bedjande på dig',
    hint: 'Hon kollar upp på dig'
  },
  {
    answer: '"Något som alltid får Elina att ge ifrån sig ett "åhh"',
    question: '',
    hint: 'tänk hihi'
  },
  {
    answer: 'Richard',
    question: 'Något som alltid får Elina på gott humör',
    hint: 'Elina verkar redan veta svaret.'
  },
  {
    answer: 'kaffe',
    question: 'Vad driver denna verklighet framåt?',
    hint: ''
  }
]

const currentPuzzle = computed(() => puzzles[currentIndex.value] || puzzles[puzzles.length - 1])

const moodLabel = computed(() => {
  if (moodMeter.value >= 80) return 'Glad 😍'
  if (moodMeter.value >= 55) return 'Orolig 😐'
  if (moodMeter.value >= 30) return 'Sur 😡'
  return 'Kaos 👹'
})

const elinaReaction = computed(() => {
  if (completed.value) return 'Du lyckades, Richard.'
  if (moodMeter.value >= 80) return 'Okej... du kanske faktiskt förstår mig.'
  if (moodMeter.value >= 55) return 'Tänk hårdare'
  if (moodMeter.value >= 30) return 'Fel igen. Det börjar bli irriterat'
  return 'Richard. Svara rätt innan portalen vaknar.'
})

function submitAnswer() {
  if (!answer.value.trim()) return

  const normalized = answer.value.toLowerCase().trim()
  const expected = currentPuzzle.value.answer

  history.value.push({
    text: '> ' + answer.value,
    type: 'player'
  })

  if (normalized === expected) {
    unlockedWords.value.push(expected)

    history.value.push({
      text: 'ELINA: Korrekt.',
      type: 'success'
    })

    moodMeter.value = Math.min(100, moodMeter.value + 12)
    mood.value = 'happy'

    currentIndex.value++

    if (currentIndex.value >= puzzles.length) {
      completed.value = true
      history.value.push({
        text: 'SYSTEM: PORTAL UPPLÅST',
        type: 'portal'
      })
    }
  } else {
    history.value.push({
      text: 'ELINA: Nej. Något känns fel.',
      type: 'error'
    })

    moodMeter.value = Math.max(0, moodMeter.value - 18)

    shake.value = true
    mood.value = 'angry'

    setTimeout(() => {
      shake.value = false
      mood.value = 'neutral'
    }, 500)
  }

  answer.value = ''
}

function restart() {
  answer.value = ''
  currentIndex.value = 0
  shake.value = false
  moodMeter.value = 78
  mood.value = 'neutral'
  completed.value = false
  unlockedWords.value = []

  history.value = [
    {
      text: 'SYSTEM: Ett ord känns gömt i rummet.',
      type: 'system'
    }
  ]
}

function moveWorld(event) {
  const x = (event.clientX / window.innerWidth - 0.5) * 18
  const y = (event.clientY / window.innerHeight - 0.5) * -12

  worldTransform.value = {
    transform: `rotateX(${8 + y}deg) rotateY(${x}deg)`
  }
}

function glyphStyle(i) {
  return {
    left: `${18 + i * 18}%`,
    animationDelay: `${i * .4}s`
  }
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.game {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  padding: 24px;
  perspective: 1400px;
  color: white;
  font-family: Inter, sans-serif;
  background:
    radial-gradient(circle at top left, rgba(168,85,247,.35), transparent 24%),
    radial-gradient(circle at bottom right, rgba(59,130,246,.25), transparent 28%),
    linear-gradient(135deg, #050816, #120b2e 55%, #050510);
}

.background-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
  background-size: 50px 50px;
  transform: perspective(800px) rotateX(80deg) scale(2);
  opacity: .3;
}

.vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, transparent 40%, rgba(0,0,0,.6));
  pointer-events: none;
}

.glass {
  border: 1px solid rgba(255,255,255,.14);
  background: rgba(255,255,255,.08);
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 60px rgba(0,0,0,.4);
}

.topbar {
  position: relative;
  z-index: 3;
  border-radius: 30px;
  padding: 24px;
  display: flex;
  justify-content: space-between;
  gap: 30px;
}

.tiny {
  margin: 0;
  font-size: 12px;
  letter-spacing: .3em;
  opacity: .6;
}

h1 {
  margin: 6px 0;
  font-size: clamp(42px, 7vw, 84px);
  line-height: .9;
}

.subtitle {
  opacity: .8;
}

.status-panel {
  min-width: 300px;
  display: grid;
  gap: 18px;
}

.status span {
  opacity: .8;
}

.status strong {
  display: block;
  margin: 6px 0;
}

.bar {
  height: 12px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(0,0,0,.3);
}

.bar i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #fb7185, #facc15);
  transition: width .4s ease;
}

.bar.purple i {
  background: linear-gradient(90deg, #a855f7, #22d3ee);
}

.world {
  position: relative;
  height: 560px;
  margin-top: 30px;
  transform-style: preserve-3d;
  transition: transform .15s linear;
}

.light {
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  filter: blur(70px);
}

.light.one {
  left: 10%;
  top: 20px;
  background: rgba(168,85,247,.35);
}

.light.two {
  right: 10%;
  bottom: 20px;
  background: rgba(59,130,246,.3);
}

.elina-room {
  position: absolute;
  left: 0;
  top: 0;
  width: 420px;
  padding: 24px;
  border-radius: 30px;
  transform: translateZ(80px) rotateY(10deg);
}

.dialog-box {
  padding: 18px;
  border-radius: 24px;
  background: rgba(255,255,255,.12);
}

.speaker {
  margin: 0 0 8px;
  opacity: .6;
  letter-spacing: .2em;
  font-size: 12px;
}

.dialog-box h2 {
  margin: 0 0 12px;
  font-size: 28px;
}

.dialog-hint {
  opacity: .72;
}

.elina-character {
  position: relative;
  width: 220px;
  height: 280px;
  margin: 20px auto;
}

.hair {
  position: absolute;
  inset: 0 22px auto;
  height: 170px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b1d11, #7c2d12);
}

.head {
  position: absolute;
  inset: 42px 44px auto;
  height: 140px;
  border-radius: 46%;
  background: linear-gradient(#ffd7b5, #f9a8d4);
}

.eye {
  position: absolute;
  top: 56px;
  width: 16px;
  height: 18px;
  border-radius: 50%;
  background: #111;
}

.eye.left { left: 32px; }
.eye.right { right: 32px; }

.mouth {
  position: absolute;
  left: 50%;
  bottom: 28px;
  width: 44px;
  height: 18px;
  transform: translateX(-50%);
  border-bottom: 5px solid #6b1d1d;
  border-radius: 0 0 50px 50px;
}

.blush {
  position: absolute;
  top: 78px;
  width: 18px;
  height: 10px;
  border-radius: 999px;
  background: rgba(255,0,80,.25);
}

.blush.left { left: 14px; }
.blush.right { right: 14px; }

.body {
  position: absolute;
  left: 30px;
  right: 30px;
  bottom: 0;
  height: 100px;
  border-radius: 40px 40px 18px 18px;
  background: linear-gradient(135deg, #ec4899, #7c3aed);
  display: grid;
  place-items: center;
  font-weight: 900;
  letter-spacing: .18em;
}

.angry .mouth {
  border-radius: 50px 50px 0 0;
  border-bottom: 0;
  border-top: 5px solid #7f1d1d;
}

.happy .elina-character {
  animation: float 1s ease-in-out infinite alternate;
}

@keyframes float {
  to {
    transform: translateY(-10px);
  }
}

.portal-room {
  position: absolute;
  right: 0;
  top: 20px;
  width: 500px;
  height: 500px;
  display: grid;
  place-items: center;
  transform: translateZ(100px) rotateY(-12deg);
}

.portal {
  position: relative;
  width: 320px;
  height: 320px;
}

.ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 6px solid rgba(255,255,255,.25);
  animation: spin 12s linear infinite;
}

.ring2 {
  transform: rotateX(70deg);
}

.ring3 {
  transform: rotateY(70deg);
  animation-direction: reverse;
}

.portal-core {
  position: absolute;
  inset: 50%;
  width: 140px;
  height: 140px;
  translate: -50% -50%;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 64px;
  font-weight: 1000;
  background: radial-gradient(circle, #fef3c7, #8b5cf6);
  box-shadow: 0 0 60px rgba(168,85,247,.6);
}

.portal.active .portal-core {
  animation: pulse .5s ease infinite alternate;
}

.glyphs span {
  position: absolute;
  bottom: 40px;
  padding: 10px 16px;
  border-radius: 999px;
  background: rgba(255,255,255,.1);
  animation: glyph 2s ease-in-out infinite;
}

@keyframes spin {
  to {
    rotate: 360deg;
  }
}

@keyframes pulse {
  to {
    transform: scale(1.08);
  }
}

@keyframes glyph {
  50% {
    transform: translateY(-8px);
  }
}

.terminal {
  position: relative;
  z-index: 3;
  margin-top: 24px;
  border-radius: 30px;
  padding: 18px;
}

.terminal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  opacity: .7;
}

.dots {
  display: flex;
  gap: 6px;
}

.dots i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: white;
}

.history {
  min-height: 140px;
  max-height: 240px;
  overflow: auto;
  padding: 12px;
  border-radius: 18px;
  background: rgba(0,0,0,.25);
  font-family: monospace;
}

.line {
  margin-bottom: 10px;
}

.line.system { color: #c084fc; }
.line.success { color: #86efac; }
.line.error { color: #f87171; }
.line.portal { color: #67e8f9; }

.input-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}

.input-row input {
  flex: 1;
  border: 1px solid rgba(255,255,255,.16);
  border-radius: 999px;
  background: rgba(255,255,255,.08);
  padding: 16px 20px;
  color: white;
  outline: none;
}

.input-row button,
.ending button {
  border: 0;
  border-radius: 999px;
  padding: 14px 22px;
  font-weight: 900;
  color: white;
  cursor: pointer;
  background: linear-gradient(135deg, #ec4899, #7c3aed);
}

.screen-shake {
  position: fixed;
  inset: 0;
  pointer-events: none;
  animation: shake .35s linear;
}

@keyframes shake {
  0% { transform: translate(0); }
  25% { transform: translate(-8px, 4px); }
  50% { transform: translate(8px, -4px); }
  75% { transform: translate(-6px, -2px); }
  100% { transform: translate(0); }
}

.ending {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0,0,0,.7);
  z-index: 999;
}

.ending-card {
  width: min(90vw, 600px);
  padding: 40px;
  border-radius: 34px;
  text-align: center;
}

.final-words {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin: 26px 0;
}

.final-words span {
  padding: 10px 16px;
  border-radius: 999px;
  background: rgba(255,255,255,.1);
}

@media (max-width: 950px) {
  .topbar {
    flex-direction: column;
  }

  .world {
    height: auto;
    display: grid;
    gap: 24px;
  }

  .elina-room,
  .portal-room {
    position: relative;
    width: 100%;
    right: auto;
    left: auto;
    top: auto;
    transform: none;
  }
}
</style>
