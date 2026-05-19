<script setup>
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'

const router = useRouter()
const showButton = ref(false)

function beginGame() {
  router.push('/level-24')
}
const paused = ref(false)
const solved = ref(false)
const feedback = ref('')

function togglePause() {
  paused.value = !paused.value

  if (paused.value) {
    feedback.value = 'Pausad. Är katterna exakt alignade?'
  } else {
    feedback.value = ''
    solved.value = false
  }
}

function confirmAlign() {
  if (!paused.value) {
    feedback.value = 'Du måste pausa först.'
    return
  }

  solved.value = true
  feedback.value = 'Alignment godkänd. Bokstav: C'
}
</script>

<template>
  <main class="cat-room">
    <section class="panel">
      <p class="kicker">visual sync / alignment</p>
      <h1>Align the Cats</h1>

      <p>
        Klicka på arenan för att pausa den rörliga katten.
        Målet är att få de två katterna att ligga exakt ovanpå varandra.
      </p>

      <div class="arena" @click="togglePause">
        <div class="cat cat-base">
          😺
        </div>

        <div
          class="cat cat-moving"
          :class="{ paused }"
        >
          😺
        </div>
      </div>

      <button type="button" @click.stop="confirmAlign">
        Confirm alignment
      </button>

      <p class="feedback">{{ feedback }}</p>

      <div v-if="solved" class="reward">
        KEY FRAGMENT: C
      </div>
    </section>
  </main>
</template>

<style scoped>
.cat-room {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #05070d;
  color: white;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.panel {
  width: min(92vw, 900px);
  padding: 36px;
  border-radius: 34px;
  background: rgba(8, 14, 22, 0.88);
  border: 1px solid rgba(160,225,255,0.16);
  text-align: center;
}

.kicker {
  color: rgba(220,245,255,0.48);
  text-transform: uppercase;
  letter-spacing: 0.22em;
  font-size: 0.72rem;
}

h1 {
  margin: 0;
  font-family: Georgia, serif;
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 400;
}

p {
  color: rgba(220,245,255,0.64);
}

.arena {
  position: relative;
  height: 380px;
  margin: 30px 0;
  border-radius: 34px;
  overflow: hidden;
  cursor: pointer;
  background:
    radial-gradient(circle at center, rgba(122,235,255,0.12), transparent 40%),
    #020407;
  border: 1px solid rgba(122,235,255,0.16);
}

.cat {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 190px;
  height: 190px;
  display: grid;
  place-items: center;
  border: 8px dashed rgba(255,255,255,0.75);
  border-radius: 999px;
  font-size: 6.5rem;
  transform: translate(-50%, -50%);
  user-select: none;
  mix-blend-mode: screen;
}

.cat-base {
  filter: hue-rotate(-90deg) saturate(260%);
  opacity: 0.85;
}

.cat-moving {
  filter: hue-rotate(90deg) saturate(260%);
  animation: moveCat 3s ease-in-out infinite;
}

.cat-moving.paused {
  animation-play-state: paused;
}

button {
  padding: 13px 20px;
  border-radius: 999px;
  border: 1px solid rgba(160,225,255,0.18);
  background: rgba(122,235,255,0.08);
  color: white;
  cursor: pointer;
}

.feedback {
  min-height: 24px;
  color: rgba(255,238,210,0.82);
}

.reward {
  margin-top: 16px;
  padding: 18px;
  border-radius: 18px;
  background: rgba(122,235,255,0.08);
  color: white;
  letter-spacing: 0.18em;
}

@keyframes moveCat {
  0% {
    transform: translate(170%, -50%);
  }

  50% {
    transform: translate(-270%, -50%);
  }

  100% {
    transform: translate(170%, -50%);
  }
}
</style>