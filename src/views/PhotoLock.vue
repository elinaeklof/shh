<script setup>
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'

const router = useRouter()
const showButton = ref(false)

function beginGame() {
  router.push('/level-34')
}

const selected = ref([])
const feedback = ref('')
const solved = ref(false)

const correctOrder = [3, 8, 14, 19]

const riddles = [
  '1. Bilden från när allt började.',
  '2. Bilden där kaoset var störst.',
  '3. Bilden som känns mest “du och jag”.',
  '4. Bilden som avslutar låset.',
]

// BYT UT bildvägarna mot dina egna bilder
const photos = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  src: `/images/elina/elina${i + 1}.jpg`,
  label: `Bild ${i + 1}`,
}))

const currentStep = computed(() => selected.value.length)
const currentRiddle = computed(() => riddles[currentStep.value])

function choosePhoto(photo) {
  if (solved.value) return

  const expected = correctOrder[selected.value.length]

  if (photo.id === expected) {
    selected.value.push(photo.id)
    feedback.value = `Rätt. Del ${selected.value.length} av 4 låst.`

    if (selected.value.length === correctOrder.length) {
      solved.value = true
      feedback.value = 'Fotolåset öppnas.'
    }
  } else {
    feedback.value = 'Fel bild. Låset nollställs.'
    selected.value = []
  }
}

function resetLock() {
  selected.value = []
  feedback.value = ''
  solved.value = false
}
</script>

<template>
  <main class="room">
    <section class="panel">
      <p class="kicker">07 / photo lock</p>
      <h1>Foto-lås</h1>

      <div v-if="!solved" class="lock-card">
        <p>Välj 4 bilder i rätt ordning.</p>
        <h2>{{ currentRiddle }}</h2>

        <div class="slots">
          <div
            v-for="n in 4"
            :key="n"
            class="slot"
            :class="{ filled: selected.length >= n }"
          >
            {{ selected[n - 1] || '?' }}
          </div>
        </div>
      </div>

      <div v-else class="lock-card complete">
        <p>ROOM COMPLETE</p>
        <h2>Kod: 914E</h2>
      </div>

      <div class="grid">
        <button
          v-for="photo in photos"
          :key="photo.id"
          class="photo"
          @click="choosePhoto(photo)"
        >
          <img :src="photo.src" :alt="photo.label" />
          <span>{{ photo.id }}</span>
        </button>
      </div>

      <p class="feedback">{{ feedback }}</p>

      <button class="reset" @click="resetLock">
        Starta om låset
      </button>
    </section>
  </main>
</template>

<style scoped>
.room {
  min-height: 100vh;
  background:
    radial-gradient(circle at top, rgba(120,80,180,0.14), transparent 35%),
    #05070d;
  color: white;
  display: grid;
  place-items: center;
  padding: 32px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.panel {
  width: min(1200px, 96vw);
  padding: 34px;
  border-radius: 34px;
  background: rgba(8, 14, 22, 0.88);
  border: 1px solid rgba(255,255,255,0.1);
}

.kicker {
  color: rgba(255,255,255,0.45);
  text-transform: uppercase;
  letter-spacing: 0.22em;
  font-size: 0.72rem;
}

h1 {
  margin: 0 0 24px;
  font-family: Georgia, serif;
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 400;
}

.lock-card {
  padding: 24px;
  border-radius: 24px;
  background: rgba(255,255,255,0.05);
  margin-bottom: 24px;
}

.lock-card p {
  margin: 0;
  color: rgba(255,255,255,0.55);
}

.lock-card h2 {
  margin: 12px 0 18px;
  font-size: clamp(1.4rem, 4vw, 2.6rem);
}

.slots {
  display: flex;
  gap: 12px;
}

.slot {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.4);
  font-size: 1.4rem;
}

.slot.filled {
  color: white;
  background: rgba(122,235,255,0.12);
}

.grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
}

.photo {
  position: relative;
  aspect-ratio: 1;
  border: 0;
  border-radius: 18px;
  overflow: hidden;
  cursor: pointer;
  background: #111827;
  padding: 0;
}

.photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo span {
  position: absolute;
  left: 8px;
  top: 8px;
  background: rgba(0,0,0,0.65);
  color: white;
  border-radius: 999px;
  padding: 4px 8px;
}

.feedback {
  min-height: 24px;
  color: #ffdca8;
}

.reset {
  margin-top: 10px;
  padding: 12px 18px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.06);
  color: white;
  cursor: pointer;
}

@media (max-width: 800px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>