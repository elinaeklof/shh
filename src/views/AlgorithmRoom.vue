<script setup>
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'

const router = useRouter()
const showButton = ref(false)

function beginGame() {
  router.push('/level-45')
}

const answer = ref('')
const result = ref('')

const encoded = [
  ['S', 4],
  ['I', 1],
  ['G', 3],
  ['N', 2],
  ['A', 5],
  ['L', 6]
]

function checkAlgorithm() {
  result.value =
    answer.value.trim().toUpperCase() === 'INSAGL'
      ? 'Rätt enligt algoritmen. Men ser du att outputen fortfarande är misstänkt?'
      : 'Fel. Sortera efter siffran, inte efter bokstaven.'
}
</script>

<template>
  <main class="room">
    <section class="card">
      <p class="kicker">19 / algorithmic reconstruction</p>
      <h1>Programmeringsgåta</h1>

      <p>
        Bokstäverna och siffrorna bildar ett ord, men bara om man skriver rätt algoritm.
        Sortera paren efter siffran och skriv ihop bokstäverna.
      </p>

      <pre class="terminal">
const data = [
  ['S', 4],
  ['I', 1],
  ['G', 3],
  ['N', 2],
  ['A', 5],
  ['L', 6]
]

// output = data.sort(by second value).map(first value).join('')
      </pre>

      <input v-model="answer" placeholder="output" />
      <button @click="checkAlgorithm">Run algorithm</button>

      <p class="result">{{ result }}</p>
    </section>
  </main>
</template>

<style scoped>
.room {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #05070d;
  color: white;
  font-family: monospace;
}

.card {
  width: min(92vw, 880px);
  padding: 36px;
  border-radius: 34px;
  background: rgba(8, 14, 22, 0.82);
}

.kicker {
  color: rgba(220,245,255,0.48);
  text-transform: uppercase;
  letter-spacing: 0.22em;
  font-size: 0.72rem;
}

h1 {
  font-family: Georgia, serif;
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 400;
}

.terminal {
  background: #020407;
  color: rgba(122,235,255,0.75);
  padding: 24px;
  border-radius: 24px;
  white-space: pre-wrap;
  line-height: 1.6;
}

input {
  width: 100%;
  padding: 14px;
  margin-top: 18px;
  background: rgba(255,255,255,0.04);
  color: white;
  border: 1px solid rgba(255,255,255,0.15);
}

button {
  margin-top: 14px;
  padding: 12px 18px;
  border-radius: 999px;
}

.result {
  color: rgba(255,238,210,0.78);
}
</style>