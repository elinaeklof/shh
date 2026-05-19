<script setup>
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'

const router = useRouter()
const showButton = ref(false)

function beginGame() {
  router.push('/level-31')
}
const attempts = ref(0)
const result = ref('')
const left = ref(42)
const top = ref(45)

function moveButton() {
  attempts.value++
  left.value = Math.random() * 75 + 5
  top.value = Math.random() * 75 + 5

  if (attempts.value >= 10) {
    result.value = 'Efter 10 försök: ledtråden kostar en puss.'
  }
}

function caughtButton() {
  result.value = 'Oväntat. Du fångade den.'
}
</script>

<template>
  <main class="room">
    <section class="card">
      <p class="kicker">03 / mouse follower</p>
      <h1>Knappen som flyr</h1>
      <p>Försök klicka på knappen.</p>

      <div class="runner-area">
        <button
          class="runner-button"
          :style="{ left: left + '%', top: top + '%' }"
          @mouseenter="moveButton"
          @click="caughtButton"
        >
          click me
        </button>
      </div>

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

.runner-area {
  height: 380px;
  position: relative;
  border-radius: 28px;
  background: rgba(255,255,255,0.035);
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.1);
}

.runner-button {
  position: absolute;
  transition: 0.18s ease;
}

button {
  border-radius: 999px;
  padding: 12px 18px;
}

.result {
  color: rgba(255,238,210,0.78);
}
</style>