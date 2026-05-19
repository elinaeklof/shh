<script setup>
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'

const router = useRouter()
const showButton = ref(false)

function beginGame() {
  router.push('/level-31')
}

const photos = ref([
  // LÄGG IN BILDERNA HÄR I FEL/BLANDAD ORDNING
  // order är rätt tidsordning: 1 = tidigast
  { id: 'p1', src: '/images/elina1.jpg', alt: 'Minne 1', order: 3 },
  { id: 'p2', src: '/images/elina2.jpg', alt: 'Minne 2', order: 1 },
  { id: 'p3', src: '/images/elina3.jpg', alt: 'Minne 3', order: 2 },
  { id: 'p4', src: '/images/elina4.jpg', alt: 'Minne 4', order: 4 },
])

const selected = ref(null)
const feedback = ref('')
const solved = ref(false)

function selectPhoto(index) {
  if (selected.value === null) {
    selected.value = index
    return
  }

  const temp = photos.value[selected.value]
  photos.value[selected.value] = photos.value[index]
  photos.value[index] = temp

  selected.value = null
}

function checkOrder() {
  const correct = photos.value.every((photo, index) => photo.order === index + 1)

  if (correct) {
    solved.value = true
    feedback.value = 'Rätt ordning.'
  } else {
    feedback.value = 'Inte rätt tidslinje än.'
  }
}
</script>

<template>
  <main class="timeline-room">
    <section class="card">
      <p class="kicker">timeline puzzle</p>
      <h1>Tidslinjen</h1>

      <p class="intro">
        Klicka två bilder för att byta plats. Lägg dem från tidigast till senaste minne.
      </p>

      <div class="timeline">
        <button
          v-for="(photo, index) in photos"
          :key="photo.id"
          class="photo"
          :class="{ selected: selected === index }"
          @click="selectPhoto(index)"
        >
          <span>{{ index + 1 }}</span>
          <img :src="photo.src" :alt="photo.alt" />
        </button>
      </div>

      <button class="check" @click="checkOrder">
        Check timeline
      </button>

      <p class="feedback">{{ feedback }}</p>

      <div v-if="solved" class="reward">
        Bokstav: L
      </div>
    </section>
  </main>
</template>

<style scoped>
.timeline-room {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #05070d;
  color: white;
  font-family: monospace;
  padding: 28px;
}

.card {
  width: min(96vw, 1100px);
  padding: 34px;
  border-radius: 34px;
  background: rgba(8,14,22,.9);
}

.kicker {
  text-transform: uppercase;
  letter-spacing: .22em;
  color: rgba(255,255,255,.45);
}

h1 {
  font-family: Georgia, serif;
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 400;
  margin: 0;
}

.intro {
  color: rgba(255,255,255,.65);
}

.timeline {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-top: 28px;
}

.photo {
  position: relative;
  border: 2px solid transparent;
  border-radius: 22px;
  overflow: hidden;
  padding: 0;
  cursor: pointer;
  background: #222;
}

.photo.selected {
  border-color: #ffdca8;
}

.photo span {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  background: rgba(0,0,0,.6);
  padding: 8px 10px;
  border-radius: 999px;
}

.photo img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  display: block;
}

.check {
  margin-top: 22px;
  padding: 14px 22px;
  border-radius: 999px;
  border: 0;
  cursor: pointer;
}

.feedback {
  color: #ffdca8;
}

.reward {
  padding: 18px;
  border-radius: 18px;
  background: rgba(122,235,255,.1);
}
</style>