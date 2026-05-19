<script setup>
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'

const router = useRouter()
const showButton = ref(false)

function beginGame() {
  router.push('/level-39')
}

const answer = ref('')
const result = ref('')

function checkCipher() {
  result.value =
    answer.value.trim() === '314'
      ? 'Rätt. Du tänkte i flera lager.'
      : 'Fel. Första mönstret är en fälla.'
}
</script>

<template>
  <main class="room">
    <section class="card">
      <p class="kicker">14 / layered cipher</p>
      <h1>Flerskikts-gåta</h1>

      <p>
        För smarta spelare ska lösningen aldrig vara första tanken.
        Först måste man förstå mönstret, sedan förstå att mönstret används fel.
      </p>

      <pre class="terminal">
LOG 01: SUN = 18
LOG 02: MOON = 57
LOG 03: STAR = 42
LOG 04: ELINA = ?
      </pre>

      <p>
        Steg 1: bokstävernas värde är inte alfabetisk ordning.
        Steg 2: orden räknas baklänges.
        Steg 3: siffrorna representerar tangentbordspositioner.
      </p>

      <input v-model="answer" placeholder="svara här" />
      <button @click="checkCipher">Submit</button>

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

.terminal {
  background: #020407;
  color: rgba(122,235,255,0.75);
  padding: 24px;
  border-radius: 24px;
  white-space: pre-wrap;
}

input {
  width: 100%;
  padding: 14px;
}

button {
  margin-top: 14px;
}

.result {
  color: rgba(255,238,210,0.78);
}
</style>