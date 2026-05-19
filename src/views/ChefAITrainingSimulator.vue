<script setup>
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'

const router = useRouter()
const showButton = ref(false)

function beginGame() {
  router.push('/level-16')
}

const orders = [
  {
    prompt: 'Customer says: “I want something crispy, salty, and emotionally supportive.”',
    correct: 'fries',
    options: ['salad', 'fries', 'soup', 'ice cream'],
  },
  {
    prompt: 'Customer says: “No thoughts. Only cheese.”',
    correct: 'pizza',
    options: ['pizza', 'tea', 'toast', 'banana'],
  },
  {
    prompt: 'Customer says: “I need breakfast but dramatic.”',
    correct: 'pancakes',
    options: ['pancakes', 'rice', 'noodles', 'fish'],
  },
  {
    prompt: 'Customer says: “Tiny rolls. Big happiness.”',
    correct: 'sushi',
    options: ['burger', 'sushi', 'cake', 'beans'],
  },
]

const round = ref(0)
const score = ref(0)
const feedback = ref('')
const solved = ref(false)

const current = computed(() => orders[round.value])

function choose(option) {
  if (solved.value) return

  if (option === current.value.correct) {
    score.value++
    feedback.value = 'Chef AI approves.'

    if (round.value === orders.length - 1) {
      solved.value = true
      feedback.value = 'Training complete. Chef AI is now dangerously confident.'
    } else {
      setTimeout(() => {
        round.value++
        feedback.value = ''
      }, 700)
    }
  } else {
    feedback.value = 'Chef AI screams internally. Wrong dish.'
  }
}

function resetGame() {
  round.value = 0
  score.value = 0
  feedback.value = ''
  solved.value = false
}
</script>

<template>
  <main class="room">
    <section class="panel">
      <p class="kicker">chef ai training simulator</p>
      <h1>Chef AI Training</h1>

      <div class="screen">
        <div class="robot">🤖</div>

        <div v-if="!solved">
          <p class="terminal-line">
            TRAINING SAMPLE {{ round + 1 }} / {{ orders.length }}
          </p>

          <h2>{{ current.prompt }}</h2>

          <div class="options">
            <button
              v-for="option in current.options"
              :key="option"
              @click="choose(option)"
            >
              {{ option }}
            </button>
          </div>
        </div>

        <div v-else class="complete">
          <p>MODEL TRAINED</p>
          <h2>KEY FRAGMENT: C</h2>
          <button @click="resetGame">Train again</button>
        </div>
      </div>

      <p class="feedback">{{ feedback }}</p>
      <p class="score">Score: {{ score }} / {{ orders.length }}</p>
    </section>
  </main>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.room {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px;
  background:
    radial-gradient(circle at top, rgba(255,180,80,0.16), transparent 34%),
    #05070d;
  color: white;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.panel {
  width: min(95vw, 980px);
  padding: 36px;
  border-radius: 34px;
  background: rgba(8,14,22,0.9);
  border: 1px solid rgba(255,255,255,0.1);
}

.kicker {
  margin: 0 0 10px;
  color: rgba(255,255,255,0.45);
  text-transform: uppercase;
  letter-spacing: 0.22em;
  font-size: 0.72rem;
}

h1 {
  margin: 0 0 28px;
  font-family: Georgia, serif;
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 400;
}

.screen {
  min-height: 430px;
  padding: 30px;
  border-radius: 28px;
  background:
    linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px),
    #090d14;
  background-size: 36px 36px;
  border: 1px solid rgba(255,255,255,0.1);
}

.robot {
  font-size: 4rem;
  margin-bottom: 18px;
}

.terminal-line {
  color: rgba(122,235,255,0.7);
  letter-spacing: 0.18em;
}

h2 {
  max-width: 760px;
  font-size: clamp(1.5rem, 4vw, 3rem);
  line-height: 1.2;
}

.options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  margin-top: 28px;
}

button {
  padding: 16px 20px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.07);
  color: white;
  font: inherit;
  cursor: pointer;
}

button:hover {
  background: rgba(255,180,80,0.16);
}

.feedback {
  min-height: 24px;
  color: #ffdca8;
}

.score {
  color: rgba(255,255,255,0.5);
}

.complete h2 {
  color: #9ff5d3;
}

@media (max-width: 700px) {
  .options {
    grid-template-columns: 1fr;
  }
}
</style>