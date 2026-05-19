<script setup>
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'

const router = useRouter()
const showButton = ref(false)

function beginGame() {
  router.push('/level-35')
}

const secret = 'CINNAMONBUN'
const wrongLimit = 7

const guessed = ref([])
const wrong = ref([])
const feedback = ref('')

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

const displayWord = computed(() => {
  return secret
    .split('')
    .map(letter => guessed.value.includes(letter) ? letter : '_')
    .join(' ')
})

const won = computed(() => {
  return secret.split('').every(letter => guessed.value.includes(letter))
})

const lost = computed(() => {
  return wrong.value.length >= wrongLimit
})

function guess(letter) {
  if (won.value || lost.value) return
  if (guessed.value.includes(letter) || wrong.value.includes(letter)) return

  if (secret.includes(letter)) {
    guessed.value.push(letter)
    feedback.value = 'Rätt bokstav.'
  } else {
    wrong.value.push(letter)
    feedback.value = 'Fel bokstav.'
  }
}

function resetGame() {
  guessed.value = []
  wrong.value = []
  feedback.value = ''
}
</script>

<template>
  <main class="hangman-room">
    <section class="card">
      <p class="kicker">hangman room</p>
      <h1>Guess the Treat</h1>

      <p class="intro">
        Gissa matordet innan figuren blir komplett.
      </p>

      <div class="game">
        <div class="drawing">
          <div class="gallows"></div>

          <div v-if="wrong.length > 0" class="rope"></div>
          <div v-if="wrong.length > 1" class="head"></div>
          <div v-if="wrong.length > 2" class="body"></div>
          <div v-if="wrong.length > 3" class="arm left"></div>
          <div v-if="wrong.length > 4" class="arm right"></div>
          <div v-if="wrong.length > 5" class="leg left"></div>
          <div v-if="wrong.length > 6" class="leg right"></div>
        </div>

        <div class="info">
          <div class="word">
            {{ displayWord }}
          </div>

          <p class="mistakes">
            Fel: {{ wrong.length }} / {{ wrongLimit }}
          </p>

          <p class="wrong">
            Wrong letters: {{ wrong.join(', ') || '—' }}
          </p>

          <div class="alphabet">
            <button
              v-for="letter in alphabet"
              :key="letter"
              :disabled="guessed.includes(letter) || wrong.includes(letter) || won || lost"
              @click="guess(letter)"
            >
              {{ letter }}
            </button>
          </div>

          <p class="feedback">{{ feedback }}</p>

          <div v-if="won" class="reward">
            ROOM COMPLETE · BOKSTAV: H
          </div>

          <div v-if="lost" class="lost">
            GAME OVER · Ordet var CINNAMONBUN
          </div>

          <button class="reset" @click="resetGame">
            Reset
          </button>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.hangman-room {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 28px;
  background:
    radial-gradient(circle at top, rgba(122,235,255,0.12), transparent 32%),
    #05070d;
  color: white;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.card {
  width: min(96vw, 1000px);
  padding: 36px;
  border-radius: 34px;
  background: rgba(8, 14, 22, 0.9);
  border: 1px solid rgba(160,225,255,0.16);
  box-shadow: 0 40px 140px rgba(0,0,0,0.65);
}

.kicker {
  margin: 0 0 10px;
  color: rgba(220,245,255,0.46);
  text-transform: uppercase;
  letter-spacing: 0.24em;
  font-size: 0.72rem;
}

h1 {
  margin: 0;
  font-family: Georgia, serif;
  font-weight: 400;
  font-size: clamp(3rem, 8vw, 6rem);
  letter-spacing: -0.07em;
}

.intro {
  color: rgba(220,245,255,0.62);
}

.game {
  margin-top: 28px;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 32px;
}

.drawing {
  position: relative;
  height: 330px;
  border-radius: 26px;
  background: rgba(255,255,255,0.045);
  border: 1px solid rgba(255,255,255,0.1);
}

.gallows::before {
  content: '';
  position: absolute;
  left: 70px;
  bottom: 40px;
  width: 150px;
  height: 4px;
  background: white;
}

.gallows::after {
  content: '';
  position: absolute;
  left: 105px;
  top: 45px;
  width: 4px;
  height: 245px;
  background: white;
}

.gallows {
  position: absolute;
  inset: 0;
}

.rope {
  position: absolute;
  left: 105px;
  top: 45px;
  width: 110px;
  height: 4px;
  background: white;
}

.rope::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  width: 4px;
  height: 42px;
  background: white;
}

.head {
  position: absolute;
  left: 190px;
  top: 86px;
  width: 46px;
  height: 46px;
  border: 4px solid white;
  border-radius: 999px;
}

.body {
  position: absolute;
  left: 211px;
  top: 132px;
  width: 4px;
  height: 78px;
  background: white;
}

.arm,
.leg {
  position: absolute;
  width: 4px;
  height: 62px;
  background: white;
  transform-origin: top;
}

.arm.left {
  left: 211px;
  top: 150px;
  transform: rotate(42deg);
}

.arm.right {
  left: 211px;
  top: 150px;
  transform: rotate(-42deg);
}

.leg.left {
  left: 211px;
  top: 208px;
  transform: rotate(34deg);
}

.leg.right {
  left: 211px;
  top: 208px;
  transform: rotate(-34deg);
}

.word {
  padding: 22px;
  border-radius: 22px;
  background: rgba(122,235,255,0.08);
  font-size: clamp(1.6rem, 4vw, 3rem);
  letter-spacing: 0.18em;
  text-align: center;
}

.mistakes,
.wrong,
.feedback {
  color: rgba(220,245,255,0.65);
}

.alphabet {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 8px;
}

button {
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(160,225,255,0.18);
  background: rgba(122,235,255,0.08);
  color: white;
  font: inherit;
  cursor: pointer;
}

button:disabled {
  opacity: 0.28;
  cursor: not-allowed;
}

.reward,
.lost {
  margin-top: 16px;
  padding: 18px;
  border-radius: 18px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.reward {
  background: rgba(122,235,255,0.1);
  border-left: 2px solid rgba(122,235,255,0.55);
}

.lost {
  background: rgba(255,80,80,0.12);
  border-left: 2px solid rgba(255,80,80,0.6);
}

.reset {
  margin-top: 16px;
}

@media (max-width: 800px) {
  .game {
    grid-template-columns: 1fr;
  }

  .alphabet {
    grid-template-columns: repeat(6, 1fr);
  }
}
</style>