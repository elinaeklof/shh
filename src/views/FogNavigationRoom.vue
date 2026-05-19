<script setup>
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'

const router = useRouter()
const showButton = ref(false)

function beginGame() {
  router.push('/level-41')
}

const heading = ref(0)
const position = ref({ x: 50, y: 78 })
const moves = ref(0)
const result = ref('')
const unlocked = ref(false)

const route = [
  { heading: 315, x: 42, y: 66 },
  { heading: 20, x: 50, y: 52 },
  { heading: 80, x: 64, y: 48 },
  { heading: 350, x: 62, y: 34 }
]

function turnLeft() {
  heading.value = (heading.value + 315) % 360
}

function turnRight() {
  heading.value = (heading.value + 45) % 360
}

function sailForward() {
  if (unlocked.value) return

  const target = route[moves.value]

  if (!target || heading.value !== target.heading) {
    result.value = 'Fel kurs. Dimman tar dig tillbaka.'
    position.value = { x: 50, y: 78 }
    heading.value = 0
    moves.value = 0
    return
  }

  position.value = { x: target.x, y: target.y }
  moves.value++

  if (moves.value === route.length) {
    unlocked.value = true
    result.value = 'Fyr identifierad. Bokstav: L'
  } else {
    result.value = 'Svag fyrsignal mottagen. Fortsätt.'
  }
}
</script>

<template>
  <main class="room">
    <section class="panel">
      <p class="kicker">sailing room / fog navigation</p>
      <h1>Navigera genom dimma</h1>

      <p>
        Sikten är nästan noll. Följ fyrarnas riktningar i rätt ordning.
        Varje fel kurs återställer rutten.
      </p>

      <div class="map">
        <div class="fog"></div>

        <div
          class="boat"
          :style="{
            left: position.x + '%',
            top: position.y + '%',
            transform: `translate(-50%, -50%) rotate(${heading}deg)`
          }"
        >
          ⛵
        </div>

        <div class="beacon b1">✦</div>
        <div class="beacon b2">✦</div>
        <div class="beacon b3">✦</div>
        <div class="beacon b4">✦</div>
      </div>

      <div class="controls">
        <button @click="turnLeft">↺ 45°</button>
        <button @click="sailForward">Sail</button>
        <button @click="turnRight">45° ↻</button>
      </div>

      <p class="readout">Heading: {{ heading }}° · Signal {{ moves }} / 4</p>
      <p class="result">{{ result }}</p>
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
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.panel {
  width: min(92vw, 920px);
  padding: 34px;
  border-radius: 32px;
  background: rgba(8, 14, 22, 0.86);
  border: 1px solid rgba(160,225,255,0.16);
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

.map {
  position: relative;
  height: 420px;
  margin: 28px 0;
  border-radius: 30px;
  overflow: hidden;
  background:
    radial-gradient(circle at center, rgba(122,235,255,0.1), transparent 40%),
    linear-gradient(180deg, #101b29, #07101b);
  border: 1px solid rgba(122,235,255,0.16);
}

.fog {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 40% 30%, rgba(255,255,255,0.16), transparent 22%),
    radial-gradient(circle at 70% 60%, rgba(255,255,255,0.12), transparent 30%),
    linear-gradient(120deg, rgba(255,255,255,0.08), transparent);
  filter: blur(18px);
}

.boat {
  position: absolute;
  z-index: 3;
  font-size: 3.3rem;
  transition: 0.55s ease;
}

.beacon {
  position: absolute;
  color: rgba(255,238,180,0.92);
  text-shadow: 0 0 22px rgba(255,238,180,0.9);
  font-size: 1.7rem;
  animation: blink 2.4s infinite;
}

.b1 { left: 42%; top: 66%; }
.b2 { left: 50%; top: 52%; animation-delay: .4s; }
.b3 { left: 64%; top: 48%; animation-delay: .8s; }
.b4 { left: 62%; top: 34%; animation-delay: 1.2s; }

.controls {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

button {
  padding: 13px 20px;
  border-radius: 999px;
  border: 1px solid rgba(160,225,255,0.18);
  background: rgba(122,235,255,0.08);
  color: white;
  cursor: pointer;
}

.readout,
.result {
  text-align: center;
}

.result {
  color: rgba(255,238,210,0.82);
}

@keyframes blink {
  50% {
    opacity: 0.25;
  }
}
</style>