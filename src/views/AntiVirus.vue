<script setup>
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'

const router = useRouter()
const showButton = ref(false)

function beginGame() {
  router.push('/level-42')
}

const answer = ref('')
const result = ref('')

function checkAnswer() {
  result.value =
    answer.value.trim().toUpperCase() === 'THREAT 02'
      ? 'Korrekt. Självreferensen avslöjade den.'
      : 'Något i logiken går inte ihop.'
}
</script>

<template>
  <main class="room">
    <section class="card">
      <p class="kicker">06 / antivirus paradox</p>
      <h1>Fake antivirus scan</h1>

      <p>Antiviruset flaggar fel filer. Exakt ett hot är verkligt.</p>

      <div class="virus-screen">
        <p>THREAT 01 → marks every infected file correctly</p>
        <p>THREAT 02 → never marks itself</p>
        <p>THREAT 03 → flags one innocent file</p>
        <p>THREAT 04 → mirrors THREAT 02</p>
      </div>

      <input v-model="answer" placeholder="THREAT 01-04" />
      <button @click="checkAnswer">Run deeper scan</button>

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

.virus-screen {
  background: #090b11;
  border-radius: 24px;
  padding: 24px;
  margin: 24px 0;
  border: 1px solid rgba(255,90,90,0.22);
}

.virus-screen p {
  color: #ff7777;
}

input {
  width: 100%;
  padding: 14px;
  background: rgba(255,255,255,0.04);
  color: white;
  border: 1px solid rgba(255,255,255,0.15);
}

button {
  margin-top: 14px;
}
</style>