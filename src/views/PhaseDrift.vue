<script setup>
import { ref } from 'vue'

const router = useRouter()
const showButton = ref(false)

function beginGame() {
  router.push('/level-27')
}

const answer = ref('')
const result = ref('')

function checkPhasePuzzle() {
  result.value =
    answer.value.trim().toUpperCase() === 'C'
      ? 'Korrekt. Checksumman matchar inte signalmodellen.'
      : 'Fel nod. Titta på relationen mellan fas och checksum.'
}
</script>

<template>
  <main class="room">
    <section class="card">
      <p class="kicker">13 / phase drift analysis</p>
      <h1>Fasdrift</h1>

      <p>
        Fyra sensornoder skickar nästan identiska signaler.
        Endast en nod bryter mot modellen.
      </p>

      <pre class="terminal">
NODE A → 10.002 GHz / +0.04 rad / checksum 7FA2
NODE B → 10.014 GHz / +0.31 rad / checksum 7FA2
NODE C → 9.991 GHz / -0.12 rad / checksum 7FA9
NODE D → 10.004 GHz / +0.06 rad / checksum 7FA2
      </pre>

      <p>
        Om frekvensavvikelsen är mindre än ±0.015 GHz och fasförskjutningen
        är mindre än ±0.35 rad ska checksumman vara 7FA2.
      </p>

      <input v-model="answer" placeholder="vilken nod är fel?" />
      <button @click="checkPhasePuzzle">Analyze</button>

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
  background: rgba(255,255,255,0.04);
  color: white;
  border: 1px solid rgba(255,255,255,0.15);
}

button {
  margin-top: 14px;
}

.result {
  color: rgba(255,238,210,0.78);
}


@keyframes pulseSync {
  0% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.8); opacity: 1; }
  100% { transform: scale(1); opacity: 0.6; }
}

@keyframes pulseBroken {
  0% { transform: scale(1); opacity: 0.5; }
  20% { transform: scale(1.6); opacity: 1; }
  45% { transform: scale(1.1); opacity: 0.7; }
  70% { transform: scale(2); opacity: 1; }
  100% { transform: scale(1); opacity: 0.5; }
}

#pulseA,
#pulseB {
  animation: pulseSync 2s infinite ease-in-out;
}

#pulseC {
  animation: pulseBroken 2.3s infinite ease-in-out;
}
</style>


