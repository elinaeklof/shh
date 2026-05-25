<template>
  <main class="game-shell">
    <div class="noise-layer"></div>
    <div class="background-orb orb-one"></div>
    <div class="background-orb orb-two"></div>
    <div class="background-orb orb-three"></div>

    <section class="game-card">
      <header class="hero">
        <h1>Richard vs Elina</h1>
        <p class="subtitle">Med andra ord — Richard och Elina edition</p>
      </header>

      <section v-if="!gameStarted" class="start-panel">
        <div class="player-preview">
          <article class="player-card elina">
            <div class="shine"></div>
            <div class="avatar">E</div>
            <p class="role">Player one</p>
            <h2>Elina</h2>
          </article>

          <div class="versus">
            <span>VS</span>
          </div>

          <article class="player-card richard">
            <div class="shine"></div>
            <div class="avatar">R</div>
            <p class="role">Player two</p>
            <h2>Richard</h2>
          </article>
        </div>

        <button class="primary-button" @click="startGame">
          <span>Starta spelet</span>
        </button>
      </section>

      <section v-else class="game-layout">
        <aside class="score-panel">
          <div class="round-badge">Runda {{ currentIndex + 1 }}</div>

          <div class="current-player">
            <div class="large-avatar">{{ currentSpeakerInitial }}</div>
            <p>Nu beskriver</p>
            <h2>{{ currentSpeaker }}</h2>
          </div>

          <div class="progress-wrap">
            <div class="progress-label">
              <span>Progress</span>
              <strong>{{ currentIndex }}/{{ words.length }}</strong>
            </div>
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
            </div>
          </div>

          <div class="stats">
            <div>
              <span>Poäng</span>
              <strong>{{ score }}</strong>
            </div>
            <div>
              <span>Ord kvar</span>
              <strong>{{ wordsLeft }}</strong>
            </div>
            <div>
              <span>Pass</span>
              <strong>{{ skips }}</strong>
            </div>
          </div>
        </aside>

        <section class="main-panel">
          <article class="clue-card">
            <div class="clue-glow"></div>
            <div class="quote-mark">“</div>
            <p class="speaker-line">{{ currentSpeaker }} säger:</p>
            <h2>{{ currentClue || 'Ingen ledtråd här... improvisera!' }}</h2>
          </article>

          <section class="terminal">
            <div class="terminal-top">
              <div class="lights">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <p>guess-the-word-blue</p>
            </div>

            <div ref="terminalBody" class="terminal-body" @click="focusInput">
              <p
                v-for="(line, index) in terminalLines"
                :key="index"
                class="terminal-line"
                :class="line.type"
              >
                {{ line.text }}
              </p>

              <form class="terminal-form" @submit.prevent="submitGuess">
                <span class="prompt">RichardIvemark@ickPC ~ %</span>
                <input
                  ref="terminalInput"
                  v-model="guess"
                  :disabled="gameOver"
                  autocomplete="off"
                  placeholder="skriv ordet/orden här..."
                />
              </form>
            </div>
          </section>

          <div class="actions">
            <button @click="submitGuess" :disabled="gameOver || !guess.trim()">Gissa</button>
            <button class="ghost" @click="skipWord" :disabled="gameOver">Passa</button>
            <button class="ghost" @click="resetGame">Starta om</button>
          </div>

          <div v-if="feedback" class="feedback" :class="feedbackType">
            {{ feedback }}
          </div>

          <div v-if="gameOver" class="game-over">
            <div class="trophy">✦</div>
            <h2>Spelet är slut</h2>
            <p>Ni fick {{ score }} av {{ words.length }} rätt.</p>
            <button class="primary-button" @click="resetGame">Spela igen</button>
          </div>
        </section>
      </section>
    </section>
  </main>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'

const players = ['Elina', 'Richard']

const words = [
  {
    answer: 'MAT',
    clues: {
      Elina: 'Åhh vad jag gillar dig',
      Richard: 'Jag älskar mat'
    }
  },
  {
    answer: 'Nobelinbjudan',
    clues: {
      Elina: '',
      Richard: 'Jag gillar dig och så men...'
    }
  },
  {
    answer: 'flörta',
    clues: {
      Elina: 'Hur lyckas ni få i lavemang i barnens mat?',
      Richard: ''
    }
  },
  {
    answer: 'Ramlösa',
    clues: {
      Elina: '',
      Richard: 'Lyx'
    }
  },
  {
    answer: 'pundare',
    clues: {
      Elina: 'Sitter på tåget nu?',
      Richard: ''
    }
  },
  {
    answer: 'Merch',
    clues: {
      Elina: '',
      Richard: 'Åhh vilken fin tröja'
    }
  },
  {
    answer: 'sova',
    clues: {
      Elina: 'Bara en sak till',
      Richard: ''
    }
  },
  {
    answer: 'Sex',
    clues: {
      Elina: 'FÄRDIG',
      Richard: 'FÄRDIG'
    }
  }
]

const gameStarted = ref(false)
const gameOver = ref(false)
const currentIndex = ref(0)
const currentPlayerIndex = ref(0)
const score = ref(0)
const skips = ref(0)
const guess = ref('')
const feedback = ref('')
const feedbackType = ref('')
const terminalLines = ref([])
const terminalInput = ref(null)
const terminalBody = ref(null)

const currentSpeaker = computed(() => players[currentPlayerIndex.value])
const currentSpeakerInitial = computed(() => currentSpeaker.value.charAt(0))
const currentWord = computed(() => words[currentIndex.value])
const currentClue = computed(() => currentWord.value?.clues[currentSpeaker.value] ?? '')
const wordsLeft = computed(() => Math.max(words.length - currentIndex.value, 0))
const progressPercent = computed(() => Math.min((currentIndex.value / words.length) * 100, 100))

function startGame() {
  gameStarted.value = true
  terminalLines.value = [
    { type: 'system', text: '◆ Terminalen är redo.' },
    { type: 'system', text: `${currentSpeaker.value} beskriver första ordet.` }
  ]
  focusInput()
}

function normalize(text) {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

function submitGuess() {
  if (gameOver.value || !guess.value.trim()) return

  const playerGuess = guess.value.trim()
  terminalLines.value.push({ type: 'input', text: `λ ${playerGuess}` })

  if (normalize(playerGuess) === normalize(currentWord.value.answer)) {
    score.value++
    feedback.value = 'Rätt. Snyggt spelat.'
    feedbackType.value = 'success'
    terminalLines.value.push({ type: 'success', text: '✓ Korrekt svar registrerat. +1 poäng.' })
    guess.value = ''
    nextTurn()
  } else {
    feedback.value = 'Inte riktigt. Försök igen.'
    feedbackType.value = 'error'
    terminalLines.value.push({ type: 'error', text: '✕ Fel ord. Ny gissning krävs.' })
    guess.value = ''
  }

  scrollTerminal()
  focusInput()
}

function skipWord() {
  if (gameOver.value) return

  skips.value++
  feedback.value = `Pass. Ordet var “${currentWord.value.answer}”.`
  feedbackType.value = 'warning'
  terminalLines.value.push({
    type: 'warning',
    text: `! Pass. Ordet var “${currentWord.value.answer}”.`
  })

  nextTurn()
  scrollTerminal()
  focusInput()
}

function nextTurn() {
  currentIndex.value++
  currentPlayerIndex.value = currentPlayerIndex.value === 0 ? 1 : 0

  if (currentIndex.value >= words.length) {
    gameOver.value = true
    terminalLines.value.push({ type: 'system', text: '◆ Alla ord är slut.' })
    return
  }

  terminalLines.value.push({
    type: 'system',
    text: `${currentSpeaker.value} tar nästa ord.`
  })
}

function resetGame() {
  gameStarted.value = false
  gameOver.value = false
  currentIndex.value = 0
  currentPlayerIndex.value = 0
  score.value = 0
  skips.value = 0
  guess.value = ''
  feedback.value = ''
  feedbackType.value = ''
  terminalLines.value = []
}

function focusInput() {
  nextTick(() => terminalInput.value?.focus())
}

function scrollTerminal() {
  nextTick(() => {
    if (terminalBody.value) {
      terminalBody.value.scrollTop = terminalBody.value.scrollHeight
    }
  })
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.game-shell {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  display: grid;
  place-items: center;
  padding: 36px;
  color: #10233f;
  background:
    radial-gradient(circle at 18% 8%, rgba(219, 238, 255, 0.95), transparent 31%),
    radial-gradient(circle at 82% 90%, rgba(14, 116, 144, 0.28), transparent 34%),
    linear-gradient(135deg, #eff8ff 0%, #b8dcff 46%, #3b82f6 100%);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.noise-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.13;
  background-image:
    linear-gradient(rgba(15, 76, 129, 0.15) 1px, transparent 1px),
    linear-gradient(90deg, rgba(15, 76, 129, 0.12) 1px, transparent 1px);
  background-size: 42px 42px;
  mask-image: radial-gradient(circle, black, transparent 78%);
}

.background-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(4px);
  opacity: 0.78;
  animation: float 10s ease-in-out infinite;
}

.orb-one {
  width: 390px;
  height: 390px;
  top: -130px;
  left: -90px;
  background: rgba(224, 242, 254, 0.72);
}

.orb-two {
  width: 460px;
  height: 460px;
  right: -150px;
  bottom: -160px;
  background: rgba(37, 99, 235, 0.28);
  animation-delay: -3s;
}

.orb-three {
  width: 220px;
  height: 220px;
  left: 62%;
  top: 6%;
  background: rgba(125, 211, 252, 0.5);
  animation-delay: -6s;
}

@keyframes float {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(16px, -18px, 0) scale(1.04); }
}

.game-card {
  position: relative;
  width: min(1180px, 100%);
  padding: 30px;
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-radius: 42px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(219, 234, 254, 0.7));
  box-shadow:
    0 38px 100px rgba(15, 63, 120, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.95),
    inset 0 -1px 0 rgba(30, 64, 175, 0.08);
  backdrop-filter: blur(24px) saturate(1.15);
}

.game-card::before {
  content: "";
  position: absolute;
  inset: 12px;
  border-radius: 34px;
  border: 1px solid rgba(255, 255, 255, 0.58);
  pointer-events: none;
}

.hero {
  position: relative;
  text-align: center;
  margin-bottom: 30px;
}


h1 {
  margin: 0;
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(3.2rem, 8.5vw, 7.4rem);
  line-height: 0.88;
  letter-spacing: -0.085em;
  color: #0f2f5f;
  text-shadow: 0 16px 44px rgba(37, 99, 235, 0.18);
}

.subtitle {
  max-width: 650px;
  margin: 20px auto 0;
  color: #31506f;
  font-size: 1.08rem;
  line-height: 1.7;
}

.start-panel {
  position: relative;
  display: grid;
  gap: 30px;
  justify-items: center;
}

.player-preview {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: stretch;
  gap: 20px;
  width: 100%;
}

.player-card {
  position: relative;
  min-height: 270px;
  overflow: hidden;
  padding: 32px;
  border-radius: 34px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(191, 219, 254, 0.72));
  border: 1px solid rgba(59, 130, 246, 0.2);
  box-shadow:
    inset 0 1px rgba(255, 255, 255, 0.95),
    0 22px 54px rgba(37, 99, 235, 0.16);
  text-align: center;
  transition: transform 0.28s ease, box-shadow 0.28s ease;
}

.player-card:hover {
  transform: translateY(-6px);
  box-shadow:
    inset 0 1px rgba(255, 255, 255, 0.95),
    0 32px 72px rgba(37, 99, 235, 0.24);
}

.shine {
  position: absolute;
  inset: -60% auto auto -30%;
  width: 70%;
  height: 180%;
  transform: rotate(24deg);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.48), transparent);
}

.player-card .avatar,
.large-avatar {
  position: relative;
  display: grid;
  place-items: center;
  margin: 0 auto 18px;
  width: 98px;
  height: 98px;
  border-radius: 32px;
  color: #eff6ff;
  background:
    linear-gradient(145deg, #0f172a, #1d4ed8 52%, #38bdf8);
  box-shadow:
    0 18px 32px rgba(30, 64, 175, 0.25),
    inset 0 1px rgba(255, 255, 255, 0.42);
  font-size: 2.8rem;
  font-weight: 950;
}

.role {
  margin: 0 0 6px !important;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 0.7rem;
  color: #2563eb !important;
  font-weight: 900;
}

.player-card h2,
.current-player h2 {
  margin: 0;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 2.25rem;
  letter-spacing: -0.04em;
}

.player-card p,
.current-player p {
  margin: 10px 0 0;
  color: #31506f;
  line-height: 1.6;
}

.versus {
  align-self: center;
  display: grid;
  place-items: center;
  width: 82px;
  height: 82px;
  border-radius: 50%;
  background:
    linear-gradient(145deg, #0f172a, #1d4ed8);
  color: #eff6ff;
  font-weight: 950;
  box-shadow:
    0 20px 42px rgba(30, 64, 175, 0.3),
    inset 0 1px rgba(255, 255, 255, 0.24);
}

.versus span {
  display: grid;
  place-items: center;
  width: 62px;
  height: 62px;
  border-radius: 50%;
  border: 1px solid rgba(224, 242, 254, 0.32);
}

.primary-button,
.actions button {
  position: relative;
  overflow: hidden;
  border: 0;
  border-radius: 999px;
  padding: 16px 28px;
  cursor: pointer;
  color: #eff6ff;
  background:
    linear-gradient(135deg, #0f172a, #2563eb 52%, #38bdf8);
  font-weight: 900;
  font-size: 1rem;
  box-shadow:
    0 18px 36px rgba(37, 99, 235, 0.28),
    inset 0 1px rgba(255, 255, 255, 0.3);
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.primary-button::after,
.actions button::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-110%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.32), transparent);
  transition: transform 0.55s ease;
}

.primary-button:hover::after,
.actions button:hover::after {
  transform: translateX(110%);
}

.primary-button:hover,
.actions button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow:
    0 24px 46px rgba(37, 99, 235, 0.36),
    inset 0 1px rgba(255, 255, 255, 0.34);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.game-layout {
  position: relative;
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
}

.score-panel,
.main-panel {
  border-radius: 34px;
  border: 1px solid rgba(59, 130, 246, 0.18);
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.86), rgba(219, 234, 254, 0.6));
  box-shadow:
    inset 0 1px rgba(255, 255, 255, 0.92),
    0 18px 48px rgba(37, 99, 235, 0.12);
}

.score-panel {
  padding: 24px;
}

.round-badge {
  display: inline-flex;
  padding: 9px 14px;
  border-radius: 999px;
  background: rgba(219, 234, 254, 0.88);
  border: 1px solid rgba(59, 130, 246, 0.18);
  color: #1d4ed8;
  font-weight: 900;
  font-size: 0.84rem;
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.62);
}

.current-player {
  margin: 22px 0;
  padding: 26px;
  border-radius: 30px;
  background:
    radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.95), transparent 58%),
    linear-gradient(145deg, #eff6ff, #93c5fd);
  text-align: center;
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.85);
}

.large-avatar {
  width: 116px;
  height: 116px;
  border-radius: 40px;
  font-size: 3.5rem;
}

.progress-wrap {
  margin-bottom: 16px;
  padding: 14px;
  border-radius: 20px;
  background: rgba(239, 246, 255, 0.7);
}

.progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #31506f;
  font-size: 0.85rem;
  font-weight: 850;
}

.progress-track {
  overflow: hidden;
  height: 9px;
  border-radius: 999px;
  background: #bfdbfe;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #0f172a, #2563eb, #38bdf8);
  transition: width 0.35s ease;
}

.stats {
  display: grid;
  gap: 12px;
}

.stats div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 17px;
  border-radius: 20px;
  background: rgba(219, 234, 254, 0.85);
  border: 1px solid rgba(59, 130, 246, 0.12);
}

.stats span {
  color: #31506f;
  font-weight: 800;
}

.stats strong {
  font-size: 1.7rem;
  color: #0f2f5f;
}

.main-panel {
  padding: 24px;
}

.clue-card {
  position: relative;
  min-height: 190px;
  overflow: hidden;
  padding: 32px;
  border-radius: 32px;
  background:
    radial-gradient(circle at 18% 10%, rgba(125, 211, 252, 0.24), transparent 30%),
    linear-gradient(135deg, #0f172a, #1e3a8a 48%, #2563eb);
  color: #eff6ff;
  box-shadow:
    0 24px 54px rgba(30, 64, 175, 0.26),
    inset 0 1px rgba(255, 255, 255, 0.18);
}

.clue-glow {
  position: absolute;
  width: 240px;
  height: 240px;
  right: -70px;
  bottom: -90px;
  border-radius: 50%;
  background: rgba(56, 189, 248, 0.26);
  filter: blur(10px);
}

.quote-mark {
  position: absolute;
  right: 24px;
  top: -46px;
  font-size: 11rem;
  color: rgba(255, 255, 255, 0.1);
  font-family: Georgia, serif;
}

.speaker-line {
  position: relative;
  margin: 0 0 12px;
  color: #bae6fd;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.13em;
  font-size: 0.78rem;
}

.clue-card h2 {
  position: relative;
  max-width: 790px;
  margin: 0;
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(1.6rem, 3vw, 2.55rem);
  line-height: 1.12;
  letter-spacing: -0.04em;
}

.terminal {
  overflow: hidden;
  margin-top: 20px;
  border-radius: 30px;
  background: #07111f;
  border: 1px solid rgba(219, 234, 254, 0.14);
  box-shadow:
    0 24px 54px rgba(15, 23, 42, 0.36),
    inset 0 1px rgba(255, 255, 255, 0.1);
}

.terminal-top {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 15px 19px;
  background: linear-gradient(90deg, #0f172a, #102a55);
  color: #93c5fd;
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.04em;
}

.terminal-top p {
  margin: 0;
}

.lights {
  display: flex;
  gap: 7px;
}

.lights span {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 18px rgba(56, 189, 248, 0.46);
  opacity: 0.95;
}

.lights span:nth-child(2) {
  opacity: 0.65;
}

.lights span:nth-child(3) {
  opacity: 0.35;
}

.terminal-body {
  height: 260px;
  overflow-y: auto;
  padding: 20px;
  color: #dbeafe;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 0.95rem;
  background:
    radial-gradient(circle at 10% 0%, rgba(56, 189, 248, 0.1), transparent 32%),
    #07111f;
}

.terminal-body::-webkit-scrollbar {
  width: 10px;
}

.terminal-body::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(147, 197, 253, 0.28);
}

.terminal-line {
  margin: 0 0 9px;
  white-space: pre-wrap;
}

.terminal-line.system {
  color: #93c5fd;
}

.terminal-line.input {
  color: #eff6ff;
}

.terminal-line.success {
  color: #a7f3d0;
}

.terminal-line.error {
  color: #fecaca;
}

.terminal-line.warning {
  color: #fde68a;
}

.terminal-form {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
}

.prompt {
  color: #38bdf8;
  font-weight: 950;
}

.terminal input {
  flex: 1;
  border: 0;
  outline: 0;
  color: #eff6ff;
  background: transparent;
  font: inherit;
}

.terminal input::placeholder {
  color: rgba(219, 234, 254, 0.36);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
}

.actions .ghost {
  color: #0f2f5f;
  background: rgba(219, 234, 254, 0.95);
  box-shadow:
    inset 0 1px rgba(255, 255, 255, 0.74),
    0 12px 28px rgba(37, 99, 235, 0.1);
}

.feedback,
.game-over {
  margin-top: 18px;
  padding: 17px 19px;
  border-radius: 20px;
  font-weight: 900;
  border: 1px solid rgba(255, 255, 255, 0.44);
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.62);
}

.feedback.success {
  background: #dcfce7;
  color: #166534;
}

.feedback.error {
  background: #fee2e2;
  color: #991b1b;
}

.feedback.warning {
  background: #fef3c7;
  color: #92400e;
}

.game-over {
  text-align: center;
  background:
    radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.88), transparent 58%),
    #eff6ff;
  color: #0f2f5f;
}

.trophy {
  margin: 0 auto 8px;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  color: #eff6ff;
  background: linear-gradient(145deg, #0f172a, #2563eb);
  box-shadow: 0 12px 28px rgba(37, 99, 235, 0.22);
}

.game-over h2 {
  margin: 0 0 6px;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 2.2rem;
  letter-spacing: -0.05em;
}

.game-over p {
  margin: 0 0 16px;
}

@media (max-width: 900px) {
  .game-shell {
    padding: 18px;
  }

  .game-card {
    padding: 18px;
    border-radius: 30px;
  }

  .game-card::before {
    inset: 8px;
    border-radius: 24px;
  }

  .player-preview,
  .game-layout {
    grid-template-columns: 1fr;
  }

  .versus {
    margin: 0 auto;
  }

  .score-panel {
    order: 2;
  }

  .main-panel {
    order: 1;
  }
}
</style>
