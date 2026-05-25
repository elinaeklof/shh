<script setup>
import { useRouter } from 'vue-router'
import { ref, onMounted, onBeforeUnmount } from 'vue'

const router = useRouter()

const showButton = ref(false)
const buttonLocked = ref(false)

const attempts = ref(0)
const result = ref('')

const left = ref(42)
const top = ref(45)

const unlockedLetter = ref('')

const hintLevel = ref(-1)

const hints = [
  'Knappen kanske inte bara lyssnar på musen...',
  'Två tangenter kan vara starkare än en.',
  'En tangent ändrar bokstäver till stora. Den andra skickar iväg saker.',
  'Håll den ena nere och tryck på den andra.'
]

function showHint() {
  if (hintLevel.value < hints.length - 1) {
    hintLevel.value++
  }
}

// Nästa level
function beginGame() {
  router.push('/level-10')
}

// SECRET COMBO
function handleKeydown(event) {
  if (event.shiftKey && event.key === 'Enter') {
    buttonLocked.value = true

    result.value =

    // Flytta till mitten
    left.value = 40
    top.value = 45
  }
}

// Flytta knapp
function moveButton() {
  // Om knappen är låst → flytta inte
  if (buttonLocked.value) return

  attempts.value++

  left.value = Math.random() * 75 + 5
  top.value = Math.random() * 75 + 5

  if (attempts.value >= 10) {
    result.value =
      'tangentbordet kanske hjälper...'
  }
}

// När man klickar knappen
function caughtButton() {
  // Bara möjligt om den är låst
  if (!buttonLocked.value) {
    result.value = 'Den flydde igen.'
    return
  }

  unlockedLetter.value = 'E'

  result.value =
    'Du fångade knappen. Bokstav upplåst: E'

  showButton.value = true
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <main class="room">
    <section class="card">
      <p class="kicker"></p>

      <h1 class="titlemousefollower">Försök klicka på knappen.</h1>

      <p>
      </p>

      <div class="runner-area">
        <button
          class="runner-button"
          :class="{ locked: buttonLocked }"
          :style="{
            left: left + '%',
            top: top + '%'
          }"
          @mouseenter="moveButton"
          @click="caughtButton"
        >
          click me
        </button>
      </div>

      <p class="result">
        {{ result }}
      </p>

      <button class="hint-button" @click="showHint">
        Ledtråd
        </button>

        <p v-if="hintLevel >= 0" class="hint">
        {{ hints[hintLevel] }}
        </p>

      <p
        v-if="unlockedLetter"
        class="letter"
      >
        Bokstav upplåst: {{ unlockedLetter }}
      </p>

      <button
        v-if="showButton"
        class="next-button"
        @click="beginGame"
      >
        Nästa level →
      </button>
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

.runner-area {
  height: 380px;
  position: relative;
  border-radius: 28px;
  background: rgba(255,255,255,0.035);
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.1);
}

.titlemousefollower {
    font-family: 'Courier New', Courier, monospace;
    font-size: 60px; 
}

.runner-button {
  position: absolute;
  transition: 0.18s ease;
}

.runner-button.locked {
  background: #80ed99;
  color: black;
  transform: scale(1.1);
}

button {
  border-radius: 999px;
  padding: 12px 18px;
  border: none;
  font-weight: bold;
}

.result {
  margin-top: 20px;
  color: rgba(255,238,210,0.78);
}

.letter {
  margin-top: 18px;
  font-size: 32px;
  color: #ffb3d9;
  font-weight: bold;
}

.next-button {
  margin-top: 20px;
}

.hint-button {
  margin-top: 14px;
  background: #bde0fe;
  color: #05070d;
}

.hint {
  margin-top: 12px;
  color: rgba(255, 255, 255, 0.65);
  font-style: italic;
}
</style>