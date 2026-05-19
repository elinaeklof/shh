<script setup>
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'

const router = useRouter()
const showButton = ref(false)

function beginGame() {
  router.push('/level-33')
}

const currentRound = ref(0)
const score = ref(0)
const feedback = ref('')
const solved = ref(false)

const rounds = [
  {
    mood: 'hungry',
    correctId: 1,
  },
  {
    mood: 'boss mode',
    correctId: 4,
  },
  {
    mood: 'cute but dangerous',
    correctId: 7,
  },
  {
    mood: 'sleepy',
    correctId: 12,
  },
]

// BYT UT bildvägarna mot dina egna bilder
const photos = [
  { id: 1, src: '/images/elina/elina1.jpg', label: 'Bild 1' },
  { id: 2, src: '/images/elina/elina2.jpg', label: 'Bild 2' },
  { id: 3, src: '/images/elina/elina3.jpg', label: 'Bild 3' },
  { id: 4, src: '/images/elina/elina4.jpg', label: 'Bild 4' },
  { id: 5, src: '/images/elina/elina5.jpg', label: 'Bild 5' },
  { id: 6, src: '/images/elina/elina6.jpg', label: 'Bild 6' },
  { id: 7, src: '/images/elina/elina7.jpg', label: 'Bild 7' },
  { id: 8, src: '/images/elina/elina8.jpg', label: 'Bild 8' },
  { id: 9, src: '/images/elina/elina9.jpg', label: 'Bild 9' },
  { id: 10, src: '/images/elina/elina10.jpg', label: 'Bild 10' },
  { id: 11, src: '/images/elina/elina11.jpg', label: 'Bild 11' },
  { id: 12, src: '/images/elina/elina12.jpg', label: 'Bild 12' },
]

const round = computed(() => rounds[currentRound.value])

function choosePhoto(photo) {
  if (solved.value) return

  if (photo.id === round.value.correctId) {
    score.value++
    feedback.value = 'Rätt mood.'

    if (currentRound.value === rounds.length - 1) {
      solved.value = true
      feedback.value = 'Alla moods lösta.'
    } else {
      setTimeout(() => {
        currentRound.value++
        feedback.value = ''
      }, 700)
    }
  } else {
    feedback.value = 'Fel mood. Titta noggrannare.'
  }
}
</script>

<template>
  <main class="room">
    <section class="panel">
      <p class="kicker">06 / which elina mood?</p>
      <h1>Which Elina mood?</h1>

      <div v-if="!solved" class="mood-card">
        <p>Välj bilden som matchar:</p>
        <h2>{{ round.mood }}</h2>
        <span>{{ currentRound + 1 }} / {{ rounds.length }}</span>
      </div>

      <div v-else class="mood-card complete">
        <p>ROOM COMPLETE</p>
        <h2>Bokstav: E</h2>
      </div>

      <div class="grid">
        <button
          v-for="photo in photos"
          :key="photo.id"
          class="photo-button"
          @click="choosePhoto(photo)"
        >
          <img :src="photo.src" :alt="photo.label" />
        </button>
      </div>

      <p class="feedback">{{ feedback }}</p>
    </section>
  </main>
</template>

<style scoped>
.room {
  min-height: 100vh;
  background: #05070d;
  color: white;
  display: grid;
  place-items: center;
  padding: 32px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.panel {
  width: min(1100px, 95vw);
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

.mood-card {
  margin-bottom: 24px;
  padding: 24px;
  border-radius: 24px;
  background: rgba(255,255,255,0.05);
}

.mood-card p {
  margin: 0;
  color: rgba(255,255,255,0.55);
}

.mood-card h2 {
  margin: 10px 0;
  font-size: clamp(2rem, 6vw, 4rem);
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.photo-button {
  border: 0;
  padding: 0;
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  background: #111827;
  aspect-ratio: 1;
}

.photo-button img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.photo-button:hover {
  outline: 3px solid rgba(122,235,255,0.6);
}

.feedback {
  min-height: 24px;
  color: #ffdca8;
}

@media (max-width: 700px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>