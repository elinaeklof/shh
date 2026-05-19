<template>
  <main class="game-shell">
    <div class="noise-layer"></div>
    <div class="background-orb orb-one"></div>
    <div class="background-orb orb-two"></div>
    <div class="background-orb orb-three"></div>

    <section class="game-card">
      <header class="hero">
        <div class="premium-pill">
          <span></span>
          Limited beige edition
          <span></span>
        </div>
        <p class="eyebrow">Med andra ord</p>
        <h1>Elina <em>&</em> Richard</h1>
        <p class="subtitle">
          Ett elegant ordspel där ni turas om att beskriva ord och skriver svaret i terminalen.
        </p>
      </header>

      <section v-if="!gameStarted" class="start-panel">
        <div class="player-preview">
          <article class="player-card elina">
            <div class="shine"></div>
            <div class="avatar">E</div>
            <p class="role">Player one</p>
            <h2>Elina</h2>
            <p>Ger kluriga ledtrådar med lugn, precision och stil.</p>
          </article>

          <div class="versus">
            <span>VS</span>
          </div>

          <article class="player-card richard">
            <div class="shine"></div>
            <div class="avatar">R</div>
            <p class="role">Player two</p>
            <h2>Richard</h2>
            <p>Beskriver snabbt, smart och ibland perfekt kaosigt.</p>
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
            <h2>{{ currentClue }}</h2>
          </article>

          <section class="terminal">
            <div class="terminal-top">
              <div class="lights">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <p>premium-terminal · guess-the-word</p>
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
                <span class="prompt">λ</span>
                <input
                  ref="terminalInput"
                  v-model="guess"
                  :disabled="gameOver"
                  autocomplete="off"
                  placeholder="skriv ordet här..."
                />
              </form>
            </div>
          </section>

          <div class="actions">
            <button @click="submitGuess" :disabled="gameOver || !guess.trim()">
              Gissa
            </button>
            <button class="ghost" @click="skipWord" :disabled="gameOver">
              Passa
            </button>
            <button class="ghost" @click="resetGame">
              Starta om
            </button>
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
    answer: 'banan',
    clues: {
      Elina: 'Den är gul, böjd och apor hade direkt känt igen den.',
      Richard: 'En frukt som ofta hamnar i väskan innan träning.'
    }
  },
  {
    answer: 'cykel',
    clues: {
      Elina: 'Två hjul, styre och man kommer fram utan motor.',
      Richard: 'Den kan ha korg, ringklocka och punktering när det passar som sämst.'
    }
  },
  {
    answer: 'pizza',
    clues: {
      Elina: 'Rund favoritmat med ost, tomatsås och valfri kaos-topping.',
      Richard: 'Den kommer ofta i en fyrkantig låda men är själv nästan alltid rund.'
    }
  },
  {
    answer: 'måne',
    clues: {
      Elina: 'Den syns på natten och hänger där uppe som en lampa.',
      Richard: 'Astronauter har gått där, men den är inte en planet.'
    }
  },
  {
    answer: 'gitarr',
    clues: {
      Elina: 'Ett instrument med strängar som passar vid lägereld.',
      Richard: 'Rockstjärnor håller ofta en sån när de ser coola ut.'
    }
  },
  {
    answer: 'kaffe',
    clues: {
      Elina: 'Varm dryck som gör morgonen lite mindre dramatisk.',
      Richard: 'Svart, brun eller med mjölk — men alltid misstänkt vuxet.'
    }
  },
  {
    answer: 'paraply',
    clues: {
      Elina: 'Man fäller upp det när himlen börjar droppa.',
      Richard: 'Det skyddar håret från regn men vänder sig ibland ut och in.'
    }
  },
  {
    answer: 'glass',
    clues: {
      Elina: 'Kall dessert som gör sommaren bättre.',
      Richard: 'Den kan smälta snabbare än man hinner äta den.'
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
    .replace(/[\u0300-\u036f]/g, '')
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
  color: #38291d;
  background:
    radial-gradient(circle at 18% 8%, rgba(255, 255, 255, 0.92), transparent 31%),
    radial-gradient(circle at 82% 90%, rgba(120, 78, 41, 0.24), transparent 34%),
    linear-gradient(135deg, #fbf1df 0%, #e6cfaf 48%, #cda16f 100%);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.noise-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.12;
  background-image:
    linear-gradient(rgba(70, 46, 25, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(70, 46, 25, 0.1) 1px, transparent 1px);
  background-size: 42px 42px;
  mask-image: radial-gradient(circle, black, transparent 78%);
}

.background-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(4px);
  opacity: 0.75;
  animation: float 10s ease-in-out infinite;
}

.orb-one {
  width: 390px;
  height: 390px;
  top: -130px;
  left: -90px;
  background: rgba(255, 255, 255, 0.58);
}

.orb-two {
  width: 460px;
  height: 460px;
  right: -150px;
  bottom: -160px;
  background: rgba(124, 78, 38, 0.24);
  animation-delay: -3s;
}

.orb-three {
  width: 220px;
  height: 220px;
  left: 62%;
  top: 6%;
  background: rgba(255, 238, 210, 0.52);
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
  border: 1px solid rgba(103, 70, 39, 0.2);
  border-radius: 42px;
  background:
    linear-gradient(145deg, rgba(255, 252, 244, 0.88), rgba(244, 224, 196, 0.66));
  box-shadow:
    0 38px 100px rgba(74, 45, 20, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.95),
    inset 0 -1px 0 rgba(111, 73, 39, 0.08);
  backdrop-filter: blur(24px) saturate(1.15);
}

.game-card::before {
  content: "";
  position: absolute;
  inset: 12px;
  border-radius: 34px;
  border: 1px solid rgba(255, 255, 255, 0.52);
  pointer-events: none;
}

.hero {
  position: relative;
  text-align: center;
  margin-bottom: 30px;
}

.premium-pill {
  width: fit-content;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  border: 1px solid rgba(132, 88, 47, 0.22);
  border-radius: 999px;
  color: #8a5b35;
  background: rgba(255, 248, 236, 0.68);
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.67rem;
  font-weight: 900;
}

.premium-pill span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #9d6a3d;
}

.eyebrow {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.24em;
  font-size: 0.78rem;
  font-weight: 900;
  color: #9a683c;
}

h1 {
  margin: 0;
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(3.2rem, 8.5vw, 7.4rem);
  line-height: 0.88;
  letter-spacing: -0.085em;
  color: #412c1f;
  text-shadow: 0 16px 44px rgba(72, 45, 24, 0.18);
}

h1 em {
  font-style: italic;
  color: #a36b3c;
}

.subtitle {
  max-width: 650px;
  margin: 20px auto 0;
  color: #71543b;
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
    linear-gradient(145deg, rgba(255, 251, 243, 0.94), rgba(231, 199, 158, 0.7));
  border: 1px solid rgba(97, 64, 35, 0.16);
  box-shadow:
    inset 0 1px rgba(255, 255, 255, 0.95),
    0 22px 54px rgba(82, 52, 25, 0.16);
  text-align: center;
  transition: transform 0.28s ease, box-shadow 0.28s ease;
}

.player-card:hover {
  transform: translateY(-6px);
  box-shadow:
    inset 0 1px rgba(255, 255, 255, 0.95),
    0 32px 72px rgba(82, 52, 25, 0.22);
}

.shine {
  position: absolute;
  inset: -60% auto auto -30%;
  width: 70%;
  height: 180%;
  transform: rotate(24deg);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.38), transparent);
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
  color: #fff7e8;
  background:
    linear-gradient(145deg, #6f4527, #c28a50 55%, #f2cf91);
  box-shadow:
    0 18px 32px rgba(85, 55, 28, 0.24),
    inset 0 1px rgba(255, 255, 255, 0.42);
  font-size: 2.8rem;
  font-weight: 950;
}

.role {
  margin: 0 0 6px !important;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 0.7rem;
  color: #9b6a3e !important;
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
  color: #765941;
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
    linear-gradient(145deg, #2f2117, #654127);
  color: #fff3de;
  font-weight: 950;
  box-shadow:
    0 20px 42px rgba(72, 45, 24, 0.28),
    inset 0 1px rgba(255, 255, 255, 0.24);
}

.versus span {
  display: grid;
  place-items: center;
  width: 62px;
  height: 62px;
  border-radius: 50%;
  border: 1px solid rgba(255, 241, 217, 0.26);
}

.primary-button,
.actions button {
  position: relative;
  overflow: hidden;
  border: 0;
  border-radius: 999px;
  padding: 16px 28px;
  cursor: pointer;
  color: #fff7e9;
  background:
    linear-gradient(135deg, #51331f, #a36a3b 52%, #d8a365);
  font-weight: 900;
  font-size: 1rem;
  box-shadow:
    0 18px 36px rgba(92, 56, 27, 0.28),
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
    0 24px 46px rgba(92, 56, 27, 0.34),
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
  border: 1px solid rgba(93, 64, 39, 0.16);
  background:
    linear-gradient(145deg, rgba(255, 251, 244, 0.8), rgba(236, 211, 180, 0.52));
  box-shadow:
    inset 0 1px rgba(255, 255, 255, 0.92),
    0 18px 48px rgba(88, 58, 31, 0.1);
}

.score-panel {
  padding: 24px;
}

.round-badge {
  display: inline-flex;
  padding: 9px 14px;
  border-radius: 999px;
  background: rgba(239, 224, 204, 0.82);
  border: 1px solid rgba(127, 87, 50, 0.14);
  color: #835936;
  font-weight: 900;
  font-size: 0.84rem;
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.62);
}

.current-player {
  margin: 22px 0;
  padding: 26px;
  border-radius: 30px;
  background:
    radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.9), transparent 58%),
    linear-gradient(145deg, #fff8eb, #e2bf92);
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
  background: rgba(255, 247, 235, 0.6);
}

.progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #765941;
  font-size: 0.85rem;
  font-weight: 850;
}

.progress-track {
  overflow: hidden;
  height: 9px;
  border-radius: 999px;
  background: #dec5a7;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #6a4328, #c48b50, #f0cc8d);
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
  background: rgba(243, 227, 207, 0.82);
  border: 1px solid rgba(116, 79, 44, 0.1);
}

.stats span {
  color: #745941;
  font-weight: 800;
}

.stats strong {
  font-size: 1.7rem;
  color: #4b3424;
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
    radial-gradient(circle at 18% 10%, rgba(255, 225, 177, 0.24), transparent 30%),
    linear-gradient(135deg, #2f2117, #5a3824 48%, #9b6338);
  color: #fff5e6;
  box-shadow:
    0 24px 54px rgba(74, 49, 27, 0.24),
    inset 0 1px rgba(255, 255, 255, 0.18);
}

.clue-glow {
  position: absolute;
  width: 240px;
  height: 240px;
  right: -70px;
  bottom: -90px;
  border-radius: 50%;
  background: rgba(234, 178, 103, 0.22);
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
  color: #f4d8b5;
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
  background: #19120d;
  border: 1px solid rgba(255, 246, 232, 0.13);
  box-shadow:
    0 24px 54px rgba(40, 26, 14, 0.34),
    inset 0 1px rgba(255, 255, 255, 0.1);
}

.terminal-top {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 15px 19px;
  background: linear-gradient(90deg, #271c14, #332217);
  color: #d8b98e;
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
  background: #d8b98e;
  box-shadow: 0 0 18px rgba(216, 185, 142, 0.36);
  opacity: 0.9;
}

.lights span:nth-child(2) {
  opacity: 0.6;
}

.lights span:nth-child(3) {
  opacity: 0.35;
}

.terminal-body {
  height: 260px;
  overflow-y: auto;
  padding: 20px;
  color: #f7e7cf;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 0.95rem;
  background:
    radial-gradient(circle at 10% 0%, rgba(214, 163, 97, 0.08), transparent 32%),
    #19120d;
}

.terminal-body::-webkit-scrollbar {
  width: 10px;
}

.terminal-body::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(216, 185, 142, 0.28);
}

.terminal-line {
  margin: 0 0 9px;
  white-space: pre-wrap;
}

.terminal-line.system {
  color: #cbb08c;
}

.terminal-line.input {
  color: #fff5df;
}

.terminal-line.success {
  color: #b9f2c2;
}

.terminal-line.error {
  color: #ffb7a8;
}

.terminal-line.warning {
  color: #ffe2a0;
}

.terminal-form {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
}

.prompt {
  color: #d8b98e;
  font-weight: 950;
}

.terminal input {
  flex: 1;
  border: 0;
  outline: 0;
  color: #fff8eb;
  background: transparent;
  font: inherit;
}

.terminal input::placeholder {
  color: rgba(255, 248, 235, 0.34);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
}

.actions .ghost {
  color: #573b29;
  background: rgba(234, 216, 193, 0.9);
  box-shadow:
    inset 0 1px rgba(255, 255, 255, 0.74),
    0 12px 28px rgba(92, 56, 27, 0.08);
}

.feedback,
.game-over {
  margin-top: 18px;
  padding: 17px 19px;
  border-radius: 20px;
  font-weight: 900;
  border: 1px solid rgba(255, 255, 255, 0.42);
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.62);
}

.feedback.success {
  background: #dff1d8;
  color: #345c2c;
}

.feedback.error {
  background: #f5d3c7;
  color: #7a3325;
}

.feedback.warning {
  background: #f7e7bd;
  color: #72501e;
}

.game-over {
  text-align: center;
  background:
    radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.86), transparent 58%),
    #fff3df;
  color: #4d3524;
}

.trophy {
  margin: 0 auto 8px;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  color: #fff7e8;
  background: linear-gradient(145deg, #6f4527, #d8a365);
  box-shadow: 0 12px 28px rgba(92, 56, 27, 0.2);
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