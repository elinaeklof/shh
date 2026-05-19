<script setup>
import { useRouter } from 'vue-router'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const router = useRouter()
const showButton = ref(false)

function beginGame() {
  router.push('/level-28')
}

const score = ref(0)
const mistakes = ref(0)
const timeLeft = ref(30)
const solved = ref(false)
const gameRunning = ref(false)
const feedback = ref('')

let timer = null
let spawnTimer = null
let idCounter = 0

const activePhotos = ref([])

// BYT UT bildvägarna mot dina egna bilder
// correct: true = bilder han ska klicka på
// correct: false = fake / fel bilder
const photoPool = [
  { src: '/images/elina/elina1.jpg', correct: true, tag: 'ler' },
  { src: '/images/elina/elina2.jpg', correct: false, tag: 'inte ler' },
  { src: '/images/elina/elina3.jpg', correct: true, tag: 'ler' },
  { src: '/images/elina/elina4.jpg', correct: false, tag: 'kaos' },
  { src: '/images/elina/elina5.jpg', correct: true, tag: 'ler' },
  { src: '/images/elina/elina6.jpg', correct: false, tag: 'fake' },
  { src: '/images/elina/elina7.jpg', correct: true, tag: 'ler' },
  { src: '/images/elina/elina8.jpg', correct: false, tag: 'inte ler' },
  { src: '/images/elina/elina9.jpg', correct: true, tag: 'ler' },
  { src: '/images/elina/elina10.jpg', correct: false, tag: 'fake' },
]

const goal = 12

const statusText = computed(() => {
  if (solved.value) return 'ROOM COMPLETE'
  if (!gameRunning.value) return 'Tryck start'
  return 'Klicka bara på Elina-bilder där hon ler'
})

function random(min, max) {
  return Math.random() * (max - min) + min
}

function startGame() {
  score.value = 0
  mistakes.value = 0
  timeLeft.value = 30
  solved.value = false
  feedback.value = ''
  activePhotos.value = []
  gameRunning.value = true

  clearInterval(timer)
  clearInterval(spawnTimer)

  timer = setInterval(() => {
    timeLeft.value--

    if (timeLeft.value <= 0) {
      endGame(false)
    }
  }, 1000)

  spawnTimer = setInterval(spawnPhoto, 650)
}

function spawnPhoto() {
  if (!gameRunning.value) return

  const item = photoPool[Math.floor(Math.random() * photoPool.length)]

  const photo = {
    id: idCounter++,
    src: item.src,
    correct: item.correct,
    tag: item.tag,
    x: random(5, 82),
    y: random(18, 72),
    size: random(78, 130),
    rotation: random(-12, 12),
  }

  activePhotos.value.push(photo)

  setTimeout(() => {
    activePhotos.value = activePhotos.value.filter((p) => p.id !== photo.id)
  }, 1800)
}

function clickPhoto(photo) {
  if (!gameRunning.value) return

  activePhotos.value = activePhotos.value.filter((p) => p.id !== photo.id)

  if (photo.correct) {
    score.value++
    feedback.value = 'Rätt.'

    if (score.value >= goal) {
      endGame(true)
    }
  } else {
    mistakes.value++
    feedback.value = 'Fake Elina. Minuspoäng.'

    if (mistakes.value >= 3) {
      endGame(false)
    }
  }
}

function endGame(win) {
  gameRunning.value = false
  clearInterval(timer)
  clearInterval(spawnTimer)
  activePhotos.value = []

  if (win) {
    solved.value = true
    feedback.value = 'Du hittade rätt Elinas.'
  } else {
    feedback.value = 'Du förlorade. För många fake Elinas eller tiden tog slut.'
  }
}

onMounted(() => {
  clearInterval(timer)
  clearInterval(spawnTimer)
})

onBeforeUnmount(() => {
  clearInterval(timer)
  clearInterval(spawnTimer)
})
</script>

<template>
  <main class="room">
    <section class="topbar">
      <div>
        <p class="kicker">10 / avoid fake elinas</p>
        <h1>Avoid the fake Elinas</h1>
      </div>

      <div class="stats">
        <span>Tid: {{ timeLeft }}</span>
        <span>Rätt: {{ score }} / {{ goal }}</span>
        <span>Fel: {{ mistakes }} / 3</span>
      </div>
    </section>

    <section class="arena">
      <p class="instruction">
        {{ statusText }}
      </p>

      <button
        v-if="!gameRunning && !solved"
        class="start"
        @click="startGame"
      >
        Starta
      </button>

      <button
        v-if="!gameRunning && feedback && !solved"
        class="restart"
        @click="startGame"
      >
        Försök igen
      </button>

      <button
        v-for="photo in activePhotos"
        :key="photo.id"
        class="floating-photo"
        :style="{
          left: photo.x + '%',
          top: photo.y + '%',
          width: photo.size + 'px',
          transform: 'rotate(' + photo.rotation + 'deg)'
        }"
        @click="clickPhoto(photo)"
      >
        <img :src="photo.src" :alt="photo.tag" />
      </button>

      <div v-if="solved" class="complete">
        <p>ROOM COMPLETE</p>
        <h2>Bokstav: A</h2>
      </div>
    </section>

    <p class="feedback">
      {{ feedback }}
    </p>
  </main>
</template>

<style scoped>
.room {
  min-height: 100vh;
  background:
    radial-gradient(circle at top, rgba(255,120,180,0.12), transparent 35%),
    #05070d;
  color: white;
  padding: 24px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  overflow: hidden;
}

.topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
}

.kicker {
  margin: 0;
  color: rgba(255,255,255,0.45);
  text-transform: uppercase;
  letter-spacing: 0.22em;
  font-size: 0.72rem;
}

h1 {
  margin: 6px 0 0;
  font-family: Georgia, serif;
  font-size: clamp(2.6rem, 7vw, 5.6rem);
  font-weight: 400;
}

.stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stats span {
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
}

.arena {
  position: relative;
  height: 70vh;
  border-radius: 34px;
  background:
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px),
    rgba(8,14,22,0.9);
  background-size: 40px 40px;
  border: 1px solid rgba(255,255,255,0.1);
  overflow: hidden;
}

.instruction {
  position: absolute;
  top: 22px;
  left: 24px;
  z-index: 3;
  margin: 0;
  color: rgba(255,255,255,0.75);
}

.start,
.restart {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  padding: 16px 28px;
  border-radius: 999px;
  border: 0;
  background: white;
  color: #111;
  font: inherit;
  cursor: pointer;
  z-index: 5;
}

.restart {
  top: 60%;
}

.floating-photo {
  position: absolute;
  z-index: 4;
  aspect-ratio: 1;
  border: 0;
  padding: 0;
  border-radius: 22px;
  overflow: hidden;
  cursor: pointer;
  background: #111827;
  box-shadow: 0 18px 40px rgba(0,0,0,0.45);
  animation: pop 0.18s ease;
}

.floating-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.complete {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  align-content: center;
  background: rgba(0,0,0,0.72);
  backdrop-filter: blur(12px);
}

.complete p {
  color: rgba(255,255,255,0.55);
  letter-spacing: 0.24em;
}

.complete h2 {
  margin: 0;
  font-family: Georgia, serif;
  font-size: clamp(3rem, 9vw, 7rem);
}

.feedback {
  min-height: 24px;
  color: #ffdca8;
}

@keyframes pop {
  from {
    transform: scale(0.6);
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@media (max-width: 700px) {
  .topbar {
    flex-direction: column;
  }

  .arena {
    height: 65vh;
  }
}
</style>