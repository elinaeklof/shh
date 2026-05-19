<script setup>
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'

const router = useRouter()
const showButton = ref(false)

function beginGame() {
  router.push('/level-37')
}

const rows = ref([])
const answer = ref('')
const result = ref('')

const data = [
  ['patience', 23],
  ['sushi desire', 94],
  ['radar confusion', 81],
  ['kiss debt', 100],
  ['compatibility', 97]
]

function runAI() {
  rows.value = []
  result.value = ''

  data.forEach((row, index) => {
    setTimeout(() => {
      rows.value.push(row)

      if (index === data.length - 1) {
        result.value = 'Primary issue: för få pussar registrerade.'
      }
    }, index * 350)
  })
}

setTimeout(() => {
  result.textContent =
    'Conclusion unstable. Emotional interference detected.'
}, 2200)

setTimeout(() => {
  result.textContent =
    'Recalculating with human bias removed...'
}, 4200)

setTimeout(() => {
  result.textContent =
    'Final verdict intentionally hidden.'
}, 6200)

function checkAI() {
  const value = answer.value.trim().toLowerCase()

  result.value =
    value.includes('compatible') || value.includes('kompatibel')
      ? 'Rätt. AI:n försökte dölja slutsatsen bakom statistik.'
      : 'Du analyserar fortfarande ytan istället för modellen.'
}
</script>

<template>
  <main class="room">
    <section class="card">
      <p class="kicker">11 / synthetic compatibility engine</p>
      <h1>Fake AI compatibility scan</h1>

      <p>
        AI-systemet analyserar kompatibilitet.
        Men varje steg motsäger det förra.
      </p>

      <button @click="runAI">Analyze</button>

      <div class="ai-meter">
        <div
          v-for="row in rows"
          :key="row[0]"
          class="ai-row"
        >
          <span>{{ row[0] }}</span>

          <div class="ai-track">
            <div
              class="ai-fill"
              :style="{ width: row[1] + '%' }"
            ></div>
          </div>

          <span>{{ row[1] }}%</span>
        </div>
      </div>

      <pre class="terminal">
STEP 1 → ignore highest percentage
STEP 2 → compare only unstable values
STEP 3 → remove emotional bias
STEP 4 → invert final conclusion
      </pre>

      <input
        v-model="answer"
        placeholder="vad säger systemet egentligen?"
      />

      <button @click="checkAI">Interpret</button>

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

.ai-meter {
  display: grid;
  gap: 12px;
  margin-top: 24px;
}

.ai-row {
  display: grid;
  grid-template-columns: 170px 1fr 60px;
  gap: 14px;
  align-items: center;
}

.ai-track {
  height: 10px;
  border-radius: 999px;
  background: rgba(255,255,255,0.08);
  overflow: hidden;
}

.ai-fill {
  height: 100%;
  background: rgba(122,235,255,0.75);
}

.terminal {
  margin-top: 24px;
  background: #020407;
  color: rgba(122,235,255,0.75);
  padding: 24px;
  border-radius: 24px;
  white-space: pre-wrap;
}

input {
  width: 100%;
  margin-top: 18px;
  padding: 14px;
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

