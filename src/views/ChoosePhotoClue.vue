<script setup>
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'


const router = useRouter()
const showButton = ref(false)

function beginGame() {
  router.push('/level-30')
}

const photos = [
  // LÄGG IN DINA BILDER HÄR
  // id måste matcha correctPhotoId i rounds längre ner
  { id: 'photo1', src: '/images/elina1.jpg', alt: 'Elina 1' },
  { id: 'photo2', src: '/images/elina2.jpg', alt: 'Elina 2' },
  { id: 'photo3', src: '/images/elina3.jpg', alt: 'Elina 3' },
  { id: 'photo4', src: '/images/elina4.jpg', alt: 'Elina 4' },
]

const rounds = [
  // ÄNDRA TEXTERNA OCH RÄTT BILD HÄR
  {
    clue: 'Bilden från när vi skrattade mest.',
    correctPhotoId: 'photo1',
  },
  {
    clue: 'Min mest kaotiska selfie.',
    correctPhotoId: 'photo2',
  },
  {
    clue: 'Bilden där jag ser gulligast men farligast ut.',
    correctPhotoId: 'photo3',
  },
]

const roundIndex = ref(0)
const feedback = ref('')
const solved = ref(false)

const currentRound = computed(() => rounds[roundIndex.value])

function choosePhoto(photoId) {
  if (solved.value) return

  if (photoId === currentRound.value.correctPhotoId) {
    feedback.value = 'Rätt bild.'

    if (roundIndex.value === rounds.length - 1) {
      solved.value = true
      feedback.value = 'Alla bilder rätt. Room complete!'
    } else {
      roundIndex.value++
    }
  } else {
    feedback.value = 'Fel bild. Försök igen.'
  }
}
</script>

<template>
  <main class="photo-room">
    <section class="card">
      <p class="kicker">photo clue</p>
      <h1>Välj rätt bild</h1>

      <p v-if="!solved" class="clue">
        {{ currentRound.clue }}
      </p>

      <div class="grid">
        <button
          v-for="photo in photos"
          :key="photo.id"
          class="photo-button"
          @click="choosePhoto(photo.id)"
        >
          <img :src="photo.src" :alt="photo.alt" />
        </button>
      </div>

      <p class="feedback">{{ feedback }}</p>

      <div v-if="solved" class="reward">
        Bokstav: E
      </div>
    </section>
  </main>
</template>

<style scoped>
.photo-room {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #05070d;
  color: white;
  font-family: monospace;
  padding: 28px;
}

.card {
  width: min(96vw, 1000px);
  padding: 34px;
  border-radius: 34px;
  background: rgba(8,14,22,.9);
}

.kicker {
  letter-spacing: .22em;
  text-transform: uppercase;
  color: rgba(255,255,255,.45);
}

h1 {
  font-family: Georgia, serif;
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 400;
  margin: 0 0 24px;
}

.clue {
  font-size: 1.3rem;
  color: rgba(255,255,255,.75);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 14px;
  margin-top: 28px;
}

.photo-button {
  border: 0;
  padding: 0;
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  background: #222;
}

.photo-button img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  display: block;
}

.feedback {
  min-height: 24px;
  color: #ffdca8;
}

.reward {
  padding: 18px;
  border-radius: 18px;
  background: rgba(122,235,255,.1);
}
</style>