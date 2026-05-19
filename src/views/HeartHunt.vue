<script setup>
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'

const router = useRouter()
const showButton = ref(false)

function beginGame() {
  router.push('/level-32')
}

const photos = ref([
  // LÄGG IN CA 20 BILDER HÄR
  // heartX och heartY styr var hjärtat sitter på bilden i procent
  { id: 'p1', src: '/images/elina1.jpg', alt: 'Elina 1', found: false, heartX: 72, heartY: 24 },
  { id: 'p2', src: '/images/elina2.jpg', alt: 'Elina 2', found: false, heartX: 18, heartY: 62 },
  { id: 'p3', src: '/images/elina3.jpg', alt: 'Elina 3', found: false, heartX: 54, heartY: 76 },
  { id: 'p4', src: '/images/elina4.jpg', alt: 'Elina 4', found: false, heartX: 84, heartY: 48 },
])

const foundCount = computed(() => photos.value.filter(photo => photo.found).length)
const complete = computed(() => foundCount.value === photos.value.length)

function findHeart(photo) {
  photo.found = true
}
</script>

<template>
  <main class="heart-room">
    <section class="card">
      <p class="kicker">heart hunt</p>
      <h1>Hitta hjärtana</h1>

      <p class="intro">
        Det finns ett dolt hjärta på varje bild. Klicka på alla.
      </p>

      <p class="counter">
        {{ foundCount }} / {{ photos.length }} hearts found
      </p>

      <div class="grid">
        <div
          v-for="photo in photos"
          :key="photo.id"
          class="photo-card"
        >
          <img :src="photo.src" :alt="photo.alt" />

          <button
            v-if="!photo.found"
            class="heart"
            :style="{ left: photo.heartX + '%', top: photo.heartY + '%' }"
            @click="findHeart(photo)"
          >
            ♥
          </button>

          <div v-if="photo.found" class="found">
            found
          </div>
        </div>
      </div>

      <div v-if="complete" class="reward">
        Alla hjärtan hittade · Bokstav: H
      </div>
    </section>
  </main>
</template>

<style scoped>
.heart-room {
  min-height: 100vh;
  background: #05070d;
  color: white;
  font-family: monospace;
  padding: 28px;
}

.card {
  width: min(96vw, 1100px);
  margin: auto;
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

.intro,
.counter {
  color: rgba(255,255,255,.65);
}

.grid {
  margin-top: 28px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 14px;
}

.photo-card {
  position: relative;
  border-radius: 22px;
  overflow: hidden;
  background: #222;
}

.photo-card img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  display: block;
}

.heart {
  position: absolute;
  transform: translate(-50%, -50%);
  border: 0;
  background: transparent;
  color: #ff6f91;
  font-size: 1.6rem;
  cursor: pointer;
  opacity: .45;
}

.heart:hover {
  opacity: 1;
}

.found {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0,0,0,.55);
  text-transform: uppercase;
  letter-spacing: .18em;
}

.reward {
  margin-top: 24px;
  padding: 18px;
  border-radius: 18px;
  background: rgba(255,111,145,.12);
}
</style>