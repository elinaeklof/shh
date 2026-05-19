<script setup>
import { ref } from 'vue'

const answer = ref('')
const result = ref('')

function checkAnswer() {
  result.value =
    answer.value.trim().toUpperCase() === '7-E-NORTH'
      ? 'Override accepted. Fragment unlocked.'
      : 'Du läser fortfarande för mycket brus.'
}
</script>

<template>
  <main class="room">
    <section class="card">
      <p class="kicker">02 / code excavation</p>
      <h1>Loading screen</h1>

      <p>Scannen fastnar på 99%. Lösningen finns gömd i loggarna.</p>

      <div class="loading-bar">
        <div class="loading-fill"></div>
      </div>

      <pre class="terminal">
BOOT_SEQUENCE_INIT
MEMORY_RELAY_OK
SIGNAL_HANDSHAKE_OK
CRC_NODE_14_FAIL
ATTEMPT_REBUILD
TEMP_KEY_FRAGMENT = 7
ATTEMPT_REBUILD
PHASE_VECTOR = NORTH
ATTEMPT_REBUILD
EMERGENCY_BYPASS = DISABLED
NOTE: only failed lines matter
ATTEMPT_REBUILD
ATTEMPT_REBUILD
SECONDARY_FRAGMENT = E
ATTEMPT_REBUILD
ATTEMPT_REBUILD
FINAL_INPUT_FORMAT = number-letter-direction
      </pre>

      <input v-model="answer" placeholder="lösning" />
      <button @click="checkAnswer">Inject override</button>

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
  border: 1px solid rgba(160,225,255,0.16);
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

p {
  color: rgba(220,245,255,0.62);
}

.loading-bar {
  height: 16px;
  border-radius: 999px;
  background: rgba(255,255,255,0.08);
  overflow: hidden;
  margin: 30px 0;
}

.loading-fill {
  height: 100%;
  background: linear-gradient(90deg, rgba(122,235,255,0.35), white);
  animation: fakeLoad 5s ease-out forwards;
}

@keyframes fakeLoad {
  from { width: 0%; }
  to { width: 99%; }
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
  margin-top: 18px;
  padding: 14px;
  border-radius: 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(160,225,255,0.16);
  color: white;
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