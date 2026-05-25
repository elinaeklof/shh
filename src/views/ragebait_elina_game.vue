<template>
  <main class="game-shell" :class="{ angry: mood <= 30, danger: timer <= 5 && current.usesTimer }">
    <section v-if="!finished" class="game-card">
      <header class="top-bar">
        <div>
          <p class="eyebrow">Level {{ levelIndex + 1 }} / {{ levels.length }}</p>
          <h1>{{ current.title }}</h1>
        </div>
        <div class="stats">
          <div class="stat">
            <span>Mood</span>
            <div class="mood-track">
              <div class="mood-fill" :style="{ width: mood + '%' }"></div>
            </div>
          </div>
          <div v-if="current.usesTimer" class="timer">{{ timer }}s</div>
        </div>
      </header>

      <div class="elina-face" :class="faceClass">
        <div class="eyes">{{ face }}</div>
        <p>{{ elinaText }}</p>
      </div>

      <section class="question-zone">
        <!-- LEVEL 1 -->
        <template v-if="current.id === 'classic-trap'">
          <h2>Hade du hellre varit otrogen mot mig eller aldrig träffat mig?</h2>
          <div class="button-grid">
            <button class="bad" @click="wrong('EXCUSE ME???')">Vara otrogen</button>
            <button class="bad" @click="wrong('Aldrig träffat mig?? wow.')">Aldrig träffat dig</button>
          </div>
          <button class="hidden-heart" @click="correct('Skulle aldrig göra något av dem ❤️')">❤️</button>
        </template>

        <!-- LEVEL 2 -->
        <template v-else-if="current.id === 'k-text'">
          <div class="chat-bubble incoming">K.</div>
          <h2>Välj rätt svar innan mood meter dör.</h2>
          <div class="button-grid">
            <button @click="wrong('För torrt svar.')">Ok</button>
            <button @click="wrong('För mycket panik.')">Vad har jag gjort???</button>
            <button @click="wrong('För defensivt.')">Är du arg?</button>
            <button class="tiny-answer" @click="correct('Rätt. Mjuk + omtänksam.')">Jag kommer med snacks och kram ❤️</button>
          </div>
        </template>

        <!-- LEVEL 3 -->
        <template v-else-if="current.id === 'prettiest'">
          <h2>Vem är snyggast?</h2>
          <p v-if="hesitationWarning" class="warning">wow. tog det så lång tid?</p>
          <div class="button-grid">
            <button @click="correct('Självklart.')">Elina</button>
            <button class="bad" @click="wrong('Fel universum.')">Någon annan</button>
          </div>
        </template>

        <!-- LEVEL 4 -->
        <template v-else-if="current.id === 'romantic-typing'">
          <h2>Skriv något romantiskt.</h2>
          <p class="hint">Trick: bokstäver blir fel. Testa Backspace.</p>
          <input
            v-model="romanticInput"
            class="text-input"
            placeholder="Skriv här..."
            @keydown="romanticKeydown"
          />
          <p class="typed-preview">{{ romanticInput || '...' }}</p>
          <button v-if="romanticInput.includes('Du är min favoritperson')" @click="correct('Backspace-romantik unlocked ❤️')">
            Skicka
          </button>
        </template>

        <!-- LEVEL 5 -->
        <template v-else-if="current.id === 'heart-sender'">
          <h2>Vem skickade ‘❤️’ till dig?</h2>
          <div
            class="chat-window"
            :style="{ transform: `translate(${chatX}px, ${chatY}px)` }"
            @pointerdown="startDrag"
            @pointermove="dragChat"
            @pointerup="stopDrag"
            @pointerleave="stopDrag"
          >
            <p>Unknown: ❤️</p>
            <small>Dra mig...</small>
          </div>
          <button v-if="Math.abs(chatX) > 90 || Math.abs(chatY) > 70" class="revealed-answer" @click="correct('Only Elina ❤️')">
            Only Elina ❤️
          </button>
          <div class="button-grid">
            <button @click="wrong('Suspekt.')">Ingen</button>
            <button @click="wrong('Vet inte???')">Vet inte</button>
            <button @click="wrong('För uppenbart. Men ändå fel knapp.')">Du</button>
          </div>
        </template>

        <!-- LEVEL 6 -->
        <template v-else-if="current.id === 'not-angry'">
          <h2>Jag är inte arg.</h2>
          <p v-if="showHug" class="hint">Ny option unlocked.</p>
          <div class="button-grid">
            <button @click="wrong('Okej? OKEJ??')">Okej</button>
            <button @click="wrong('Modigt. Fel.')">Jo du är</button>
            <button @click="wrong('För tidigt för förlåt.')">Förlåt</button>
            <button v-if="showHug" class="correct" @click="correct('Give hug ❤️')">Give hug</button>
          </div>
        </template>

        <!-- LEVEL 7 -->
        <template v-else-if="current.id === 'do-not-press'">
          <h2>Tryck absolut inte på knappen.</h2>
          <button class="giant-red" @click="wrong('Du kunde inte låta bli va?')">DO NOT PRESS</button>
          <p class="hint">Ibland är rätt svar att inte göra något.</p>
        </template>

        <!-- LEVEL 8 -->
        <template v-else-if="current.id === 'fake-continue'">
          <h2>Klicka continue för att gå vidare.</h2>
          <button class="fake-continue" @click="wrong('Fake button.')">CONTINUE</button>
          <button class="level-number-secret" @click="correct('Du klickade på levelnumret istället.')">
            Level {{ levelIndex + 1 }}
          </button>
        </template>

        <!-- LEVEL 9 -->
        <template v-else-if="current.id === 'compliment-rain'">
          <h2>Fånga bara rätt komplimang.</h2>
          <div class="falling-zone">
            <button
              v-for="item in fallingItems"
              :key="item.id"
              class="falling-item"
              :class="{ good: item.good, badItem: !item.good }"
              :style="{ left: item.x + '%', top: item.y + '%' }"
              @click="item.good ? correct('Rätt komplimang fångad ❤️') : wrong('Man fångar inte den där.')"
            >
              {{ item.text }}
            </button>
          </div>
        </template>

        <!-- LEVEL 10 -->
        <template v-else-if="current.id === 'password'">
          <h2>Skriv lösenordet.</h2>
          <p class="hint">Hint: det står redan på skärmen, men inte där du tror.</p>
          <input v-model="passwordInput" class="text-input" placeholder="lösenord" />
          <button @click="passwordInput.toLowerCase().trim() === 'elina är bäst' ? correct('Access granted ❤️') : wrong('Fel lösenord.')">
            Unlock
          </button>
          <span class="invisible-password">elina är bäst</span>
        </template>

        <!-- LEVEL 11 -->
        <template v-else-if="current.id === 'mood-swing'">
          <h2>Välj rätt baserat på humör.</h2>
          <p class="big-mood">{{ rotatingMood.emoji }} {{ rotatingMood.label }}</p>
          <div class="button-grid">
            <button @click="handleMoodChoice('chocolate')">Choklad</button>
            <button @click="handleMoodChoice('blanket')">Filt</button>
            <button @click="handleMoodChoice('space')">Ge space</button>
            <button @click="handleMoodChoice('hug')">Kram</button>
          </div>
        </template>

        <!-- LEVEL 12 -->
        <template v-else-if="current.id === 'jealous-popup'">
          <h2>Din telefon plingar.</h2>
          <div class="phone">
            <p>Notification från “Random person”</p>
            <button @click="wrong('Varför öppnade du den?')">Öppna</button>
            <button @click="wrong('Ignorera är också sus.')">Ignorera</button>
          </div>
          <button class="transparent-overlay" @click="correct('Du visade Elina direkt. Smart.')">Visa Elina direkt</button>
        </template>

        <!-- LEVEL 13 -->
        <template v-else-if="current.id === 'mirror'">
          <h2>Tryck på det finaste på skärmen.</h2>
          <button class="normal-choice" @click="wrong('Fel. Det är inte knappen.')">Hjärtat</button>
          <button class="normal-choice" @click="wrong('Fel. Det är inte texten.')">Texten</button>
          <button class="mirror-button" @click="correct('Du valde Elina i speglingen ❤️')">Elinas spegling</button>
        </template>

        <!-- LEVEL 14 -->
        <template v-else-if="current.id === 'volume-chaos'">
          <h2>STAY CALM!!!</h2>
          <p class="alarm">🚨 BEEP BEEP BEEP 🚨</p>
          <label class="slider-label">
            Drama volume: {{ dramaVolume }}
            <input v-model="dramaVolume" type="range" min="0" max="100" />
          </label>
          <button v-if="Number(dramaVolume) === 0" @click="correct('Du sänkte dramat. Moget.')">Continue peacefully</button>
        </template>

        <!-- LEVEL 15 -->
        <template v-else-if="current.id === 'final-boss'">
          <h2>Final boss: “Gissa vad som är fel.”</h2>
          <div class="button-grid">
            <button @click="wrong('Det där var bara ett test.')">Är du hungrig?</button>
            <button @click="wrong('Farligt svar.')">Är du trött?</button>
            <button @click="wrong('Inte tillräckligt specifikt.')">Förlåt</button>
          </div>
          <button v-if="timer <= 5" class="correct" @click="correct('Du kom ihåg: hon ville bara ha trygghet ❤️')">
            Säg: “Jag älskar dig och jag lyssnar”
          </button>
        </template>
      </section>

      <footer class="feedback" v-if="feedback">
        {{ feedback }}
      </footer>
    </section>

    <section v-else class="game-card ending">
      <h1>Certified Boyfriend Ending ❤️</h1>
      <p>Du överlevde Elina Ragebait Quiz.</p>
      <p>Slutbetyg: emotionellt förvirrad men godkänd.</p>
      <button @click="restart">Spela igen</button>
    </section>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const levels = [
  { id: 'classic-trap', title: 'Choose Carefully', usesTimer: true, time: 15 },
  { id: 'k-text', title: 'The K Message', usesTimer: true, time: 12 },
  { id: 'prettiest', title: 'No Hesitation Allowed', usesTimer: true, time: 10 },
  { id: 'romantic-typing', title: 'Broken Romance Keyboard', usesTimer: false, time: 0 },
  { id: 'heart-sender', title: 'Jealousy Detector', usesTimer: false, time: 0 },
  { id: 'not-angry', title: 'Girlfriend Logic', usesTimer: true, time: 12 },
  { id: 'do-not-press', title: 'Impulse Control', usesTimer: true, time: 6 },
  { id: 'fake-continue', title: 'Fake UI', usesTimer: false, time: 0 },
  { id: 'compliment-rain', title: 'Catch The Compliment', usesTimer: false, time: 0 },
  { id: 'password', title: 'Invisible Password', usesTimer: false, time: 0 },
  { id: 'mood-swing', title: 'Mood Swing', usesTimer: false, time: 0 },
  { id: 'jealous-popup', title: 'Phone Notification Trap', usesTimer: false, time: 0 },
  { id: 'mirror', title: 'Mirror Test', usesTimer: false, time: 0 },
  { id: 'volume-chaos', title: 'Drama Volume', usesTimer: false, time: 0 },
  { id: 'final-boss', title: 'Final Boss', usesTimer: true, time: 14 }
]

const levelIndex = ref(0)
const current = computed(() => levels[levelIndex.value])
const finished = ref(false)
const mood = ref(100)
const timer = ref(0)
const feedback = ref('')
const elinaText = ref('Elina is watching.')
const hesitationWarning = ref(false)
const showHug = ref(false)
const romanticInput = ref('')
const passwordInput = ref('')
const dramaVolume = ref(100)
const chatX = ref(0)
const chatY = ref(0)
const dragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const chatStart = ref({ x: 0, y: 0 })
const moodIndex = ref(0)

let timerInterval
let levelTimeout
let moodInterval

const moods = [
  { emoji: '😡', label: 'arg', correct: 'chocolate' },
  { emoji: '😭', label: 'ledsen', correct: 'hug' },
  { emoji: '😴', label: 'trött', correct: 'blanket' },
  { emoji: '😐', label: 'behöver space', correct: 'space' }
]

const fallingItems = [
  { id: 1, text: 'söt', good: true, x: 14, y: 22 },
  { id: 2, text: 'cringe', good: false, x: 42, y: 35 },
  { id: 3, text: 'min favorit', good: true, x: 68, y: 18 },
  { id: 4, text: 'boring', good: false, x: 22, y: 62 },
  { id: 5, text: 'vacker', good: true, x: 78, y: 61 }
]

const rotatingMood = computed(() => moods[moodIndex.value])
const face = computed(() => {
  if (mood.value <= 25) return 'ಠ_ಠ'
  if (mood.value <= 55) return '¬_¬'
  return '♡‿♡'
})
const faceClass = computed(() => (mood.value <= 30 ? 'mad' : mood.value <= 60 ? 'suspicious' : 'happy'))

function startLevel() {
  clearAll()
  feedback.value = ''
  mood.value = 100
  timer.value = current.value.time
  elinaText.value = 'Elina is watching.'
  hesitationWarning.value = false
  showHug.value = false
  romanticInput.value = ''
  passwordInput.value = ''
  dramaVolume.value = 100
  chatX.value = 0
  chatY.value = 0

  if (current.value.usesTimer) {
    timerInterval = setInterval(() => {
      timer.value--
      if (current.value.id === 'k-text' || current.value.id === 'classic-trap' || current.value.id === 'final-boss') {
        mood.value = Math.max(0, mood.value - 7)
      }
      if (timer.value <= 0) {
        if (current.value.id === 'do-not-press') correct('Du tryckte inte. Imponerande.')
        else wrong('Tiden gick ut.')
      }
    }, 1000)
  }

  if (current.value.id === 'prettiest') {
    levelTimeout = setTimeout(() => {
      hesitationWarning.value = true
      elinaText.value = 'wow.'
      mood.value = 45
    }, 1800)
  }

  if (current.value.id === 'not-angry') {
    levelTimeout = setTimeout(() => {
      showHug.value = true
      elinaText.value = '...'
    }, 4500)
  }

  if (current.value.id === 'mood-swing') {
    moodInterval = setInterval(() => {
      moodIndex.value = (moodIndex.value + 1) % moods.length
    }, 900)
  }
}

function wrong(message) {
  feedback.value = `❌ ${message}`
  elinaText.value = message
  mood.value = Math.max(0, mood.value - 25)

  if (mood.value <= 0) {
    setTimeout(() => {
      feedback.value = 'Mood meter dog. Level restartar.'
      startLevel()
    }, 700)
  }
}

function correct(message) {
  feedback.value = `✅ ${message}`
  elinaText.value = message
  clearAll()
  setTimeout(nextLevel, 900)
}

function nextLevel() {
  if (levelIndex.value >= levels.length - 1) {
    finished.value = true
    return
  }
  levelIndex.value++
  startLevel()
}

function restart() {
  levelIndex.value = 0
  finished.value = false
  startLevel()
}

function romanticKeydown(event) {
  if (event.key === 'Backspace') {
    event.preventDefault()
    const target = 'Du är min favoritperson ❤️'
    romanticInput.value = target.slice(0, romanticInput.value.length + 1)
    return
  }

  if (event.key.length === 1) {
    event.preventDefault()
    const wrongLetters = ['x', 'q', '??', 'nej ', 'oops ']
    romanticInput.value += wrongLetters[Math.floor(Math.random() * wrongLetters.length)]
  }
}

function startDrag(event) {
  dragging.value = true
  dragStart.value = { x: event.clientX, y: event.clientY }
  chatStart.value = { x: chatX.value, y: chatY.value }
}

function dragChat(event) {
  if (!dragging.value) return
  chatX.value = chatStart.value.x + event.clientX - dragStart.value.x
  chatY.value = chatStart.value.y + event.clientY - dragStart.value.y
}

function stopDrag() {
  dragging.value = false
}

function handleMoodChoice(choice) {
  if (choice === rotatingMood.value.correct) correct('Du läste humöret rätt.')
  else wrong('Fel humör-lösning.')
}

function clearAll() {
  clearInterval(timerInterval)
  clearInterval(moodInterval)
  clearTimeout(levelTimeout)
}

watch(current, startLevel)
onMounted(startLevel)
onBeforeUnmount(clearAll)
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.game-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: radial-gradient(circle at top, #ffe0ef, #ffd1dc 34%, #2d1020 100%);
  font-family: Inter, system-ui, sans-serif;
  color: #351020;
  transition: 0.25s ease;
}

.game-shell.angry {
  background: radial-gradient(circle at top, #ffb3b3, #c71f37 45%, #25000a 100%);
}

.game-shell.danger {
  animation: dangerPulse 0.45s infinite alternate;
}

.game-card {
  position: relative;
  width: min(960px, 100%);
  min-height: 640px;
  padding: 28px;
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.28);
  overflow: hidden;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: start;
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0 0 4px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 12px;
  font-weight: 900;
  color: #d6336c;
}

h1, h2, p {
  margin-top: 0;
}

h1 {
  font-size: clamp(28px, 5vw, 48px);
  margin-bottom: 0;
}

h2 {
  font-size: clamp(24px, 4vw, 38px);
  text-align: center;
}

.stats {
  min-width: 220px;
  display: grid;
  gap: 12px;
}

.stat span {
  font-weight: 900;
  font-size: 13px;
}

.mood-track {
  height: 16px;
  border-radius: 999px;
  background: #f3a6bf;
  overflow: hidden;
  border: 2px solid #351020;
}

.mood-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff4d6d, #ffd166, #52b788);
  transition: width 0.2s;
}

.timer {
  justify-self: end;
  padding: 10px 14px;
  border-radius: 16px;
  background: #351020;
  color: white;
  font-weight: 1000;
  font-size: 24px;
}

.elina-face {
  width: min(360px, 100%);
  margin: 0 auto 24px;
  padding: 18px;
  border: 3px solid #351020;
  border-radius: 28px;
  background: #fff5f8;
  text-align: center;
}

.eyes {
  font-size: 58px;
  font-weight: 900;
}

.elina-face p {
  margin: 8px 0 0;
  font-weight: 900;
}

.elina-face.mad {
  animation: shake 0.2s infinite;
  background: #ffe3e3;
}

.question-zone {
  position: relative;
  display: grid;
  place-items: center;
  gap: 20px;
  min-height: 310px;
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(180px, 1fr));
  gap: 16px;
  width: min(620px, 100%);
}

button {
  border: 0;
  border-radius: 22px;
  padding: 18px 20px;
  background: #ff8fab;
  color: #351020;
  font-weight: 1000;
  font-size: 18px;
  cursor: pointer;
  box-shadow: 0 8px 0 #351020;
  transition: transform 0.12s, box-shadow 0.12s, opacity 0.2s;
}

button:hover {
  transform: translateY(-3px);
}

button:active {
  transform: translateY(4px);
  box-shadow: 0 2px 0 #351020;
}

button.bad {
  background: #ffccd5;
}

button.correct {
  background: #b7efc5;
}

.hidden-heart {
  position: absolute;
  right: 8px;
  bottom: 6px;
  width: 28px;
  height: 28px;
  padding: 0;
  opacity: 0.18;
  font-size: 13px;
  box-shadow: none;
  background: transparent;
}

.hidden-heart:hover {
  opacity: 1;
  transform: scale(1.4);
}

.chat-bubble,
.chat-window,
.phone {
  padding: 18px 22px;
  border-radius: 24px;
  background: #f8f9fa;
  border: 3px solid #351020;
  box-shadow: 0 8px 0 #351020;
  font-weight: 900;
}

.incoming {
  justify-self: start;
  margin-left: 12%;
  font-size: 32px;
}

.tiny-answer {
  font-size: 13px;
  opacity: 0.55;
}

.warning,
.hint {
  font-weight: 1000;
  color: #d6336c;
  text-align: center;
}

.text-input {
  width: min(620px, 100%);
  padding: 18px 20px;
  border: 3px solid #351020;
  border-radius: 22px;
  font-size: 22px;
  font-weight: 800;
}

.typed-preview {
  min-height: 30px;
  font-weight: 900;
}

.chat-window {
  cursor: grab;
  user-select: none;
  touch-action: none;
  z-index: 3;
}

.revealed-answer {
  position: absolute;
  z-index: 1;
  background: #b7efc5;
}

.giant-red {
  width: min(460px, 100%);
  min-height: 150px;
  background: #e03131;
  color: white;
  font-size: 34px;
}

.fake-continue {
  width: 320px;
  opacity: 0.95;
}

.level-number-secret {
  position: absolute;
  top: -92px;
  left: 0;
  padding: 6px 10px;
  border-radius: 12px;
  font-size: 12px;
  opacity: 0.2;
  box-shadow: none;
}

.falling-zone {
  position: relative;
  width: min(680px, 100%);
  height: 260px;
  border: 3px dashed #351020;
  border-radius: 28px;
  overflow: hidden;
  background: #fff0f5;
}

.falling-item {
  position: absolute;
  padding: 10px 14px;
  font-size: 15px;
  animation: bob 1s infinite alternate;
}

.badItem {
  background: #adb5bd;
}

.invisible-password {
  position: absolute;
  bottom: 5px;
  right: 8px;
  color: rgba(53, 16, 32, 0.06);
  font-weight: 900;
}

.big-mood {
  font-size: 42px;
  font-weight: 1000;
  text-align: center;
}

.phone {
  display: grid;
  gap: 12px;
  text-align: center;
}

.transparent-overlay {
  position: absolute;
  inset: 30% 32%;
  opacity: 0.03;
  box-shadow: none;
}

.transparent-overlay:hover {
  opacity: 0.55;
}

.mirror-button {
  transform: scaleX(-1);
  opacity: 0.35;
}

.alarm {
  font-size: 32px;
  font-weight: 1000;
  color: #e03131;
  animation: shake 0.12s infinite;
}

.slider-label {
  display: grid;
  gap: 12px;
  width: min(520px, 100%);
  font-weight: 1000;
}

input[type='range'] {
  width: 100%;
}

.feedback {
  margin-top: 22px;
  padding: 16px;
  border-radius: 20px;
  background: #351020;
  color: white;
  text-align: center;
  font-weight: 1000;
}

.ending {
  display: grid;
  place-items: center;
  text-align: center;
}

@keyframes shake {
  from { transform: translateX(-2px) rotate(-0.3deg); }
  to { transform: translateX(2px) rotate(0.3deg); }
}

@keyframes dangerPulse {
  from { filter: saturate(1); }
  to { filter: saturate(1.6) contrast(1.1); }
}

@keyframes bob {
  from { transform: translateY(-4px); }
  to { transform: translateY(4px); }
}

@media (max-width: 720px) {
  .top-bar {
    display: grid;
  }

  .button-grid {
    grid-template-columns: 1fr;
  }

  .game-card {
    padding: 20px;
    min-height: auto;
  }
}
</style>
