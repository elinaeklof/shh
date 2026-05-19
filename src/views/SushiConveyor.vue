<script setup>
import { useRouter } from 'vue-router'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const router = useRouter()
const showButton = ref(false)

function beginGame() {
  router.push('/level-17')
}
const score = ref(0)
const mistakes = ref(0)
const timeLeft = ref(35)
const running = ref(false)
const solved = ref(false)
const feedback = ref('')
const sushiItems = ref([])

let timer = null
let spawner = null
let id = 0

const targetOrder = ['🍣', '🍤', '🥒', '🍣', '🥑']
const collected = ref([])

const nextTarget = computed(() => targetOrder[collected.value.length])

function startGame() {
  score.value = 0
  mistakes.value = 0
  timeLeft.value = 35
  collected.value = []
  sushiItems.value = []
  feedback.value = ''
  solved.value = false
  running.value = true

  clearInterval(timer)
  clearInterval(spawner)

  timer = setInterval(() => {
    timeLeft.value--

    if (timeLeft.value <= 0) {
      lose()
    }
  }, 1000)

  spawner = setInterval(spawnSushi, 700)
}

function spawnSushi() {
  const choices = ['🍣', '🍤', '🥒', '🥑', '🍙', '🐟', '🌶️']
  const emoji = choices[Math.floor(Math.random() * choices.length)]

  const item = {
    id: id++,
    emoji,
    x: -10,
    y: Math.random() * 55 + 20,
    speed: Math.random() * 0.6 + 0.55,
  }

  sushiItems.value.push(item)

  setTimeout(() => {
    sushiItems.value = sushiItems.value.filter((s) => s.id !== item.id)
  }, 9000)
}

function tick() {
  if (!running.value) return

  sushiItems.value = sushiItems.value.map((s) => ({
    ...s,
    x: s.x + s.speed,
  }))
}

function clickSushi(item) {
  if (!running.value) return

  sushiItems.value = sushiItems.value.filter((s) => s.id !== item.id)

  if (item.emoji === nextTarget.value) {
    collected.value.push(item.emoji)
    score.value++
    feedback.value = 'Rätt sushi.'

    if (collected.value.length === targetOrder.length) {
      win()
    }
  } else {
    mistakes.value++
    feedback.value = 'Fel sushi. Köket gråter.'

    if (mistakes.value >= 3) {
      lose()
    }
  }
}

function win() {
  running.value = false
  solved.value = true
  clearInterval(timer)
  clearInterval(spawner)
  feedback.value = 'Order complete.'
}

function lose() {
  running.value = false
  clearInterval(timer)
  clearInterval(spawner)
  feedback.value = 'Order failed.'
}

let animation = null

function loop() {
  tick()
  animation = requestAnimationFrame(loop)
}

onMounted(() => {
  animation = requestAnimationFrame(loop)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animation)
  clearInterval(timer)
  clearInterval(spawner)
})
</script>

<template>
  <main class="room">
    <section class="header">
      <div>
        <p class="kicker">sushi conveyor</p>
        <h1>Sushi Conveyor</h1>
      </div>

      <div class="stats">
        <span>Tid: {{ timeLeft }}</span>
        <span>Fel: {{ mistakes }} / 3</span>
      </div>
    </section>

    <section class="order">
      <p>Order:</p>
      <div class="order-row">
        <span
          v-for="(item, index) in targetOrder"
          :key="index"
          :class="{ done: collected[index] }"
        >
          {{ item }}
        </span>
      </div>
      <p class="next">Nästa: {{ nextTarget || 'klar' }}</p>
    </section>

    <section class="belt">
      <button
        v-if="!running && !solved"
        class="start"
        @click="startGame"
      >
        Starta
      </button>

      <button
        v-for="item in sushiItems"
        :key="item.id"
        class="sushi"
        :style="{
          left: item.x + '%',
          top: item.y + '%'
        }"
        @click="clickSushi(item)"
      >
        {{ item.emoji }}
      </button>

      <div v-if="solved" class="complete">
        <p>ROOM COMPLETE</p>
        <h2>KEY FRAGMENT: S</h2>
        <button @click="startGame">Spela igen</button>
      </div>
    </section>

    <p class="feedback">{{ feedback }}</p>
  </main>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.room {
  min-height: 100vh;
  padding: 28px;
  background:
    radial-gradient(circle at top, rgba(255,100,120,0.14), transparent 34%),
    #05070d;
  color: white;
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
}

.kicker {
  margin: 0;
  color: rgba(255,255,255,0.45);
  text-transform: uppercase;
  letter-spacing: 0.22em;
  font-size: 0.72rem;
}

h1 {
  margin: 8px 0 20px;
  font-family: Georgia, serif;
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 400;
}

.stats {
  display: flex;
  gap: 10px;
}

.stats span {
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(255,255,255,0.07);
}

.order {
  padding: 18px;
  border-radius: 24px;
  background: rgba(255,255,255,0.05);
  margin-bottom: 18px;
}

.order p {
  margin: 0 0 8px;
  color: rgba(255,255,255,0.55);
}

.order-row {
  display: flex;
  gap: 12px;
  font-size: 2rem;
}

.order-row span {
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  background: rgba(0,0,0,0.25);
  opacity: 0.35;
}

.order-row span.done {
  opacity: 1;
  background: rgba(122,235,255,0.13);
}

.next {
  margin-top: 10px !important;
}

.belt {
  position: relative;
  height: 58vh;
  border-radius: 34px;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(255,255,255,0.08) 0 3px, transparent 3px 70px),
    linear-gradient(#242b34, #111827);
  border: 1px solid rgba(255,255,255,0.1);
}

.belt::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 45%;
  height: 80px;
  transform: translateY(-50%);
  background:
    repeating-linear-gradient(
      90deg,
      #303846 0 50px,
      #252d38 50px 100px
    );
  border-top: 4px solid #111;
  border-bottom: 4px solid #111;
}

.sushi {
  position: absolute;
  z-index: 3;
  width: 72px;
  height: 72px;
  transform: translate(-50%, -50%);
  border-radius: 999px;
  border: 0;
  background: white;
  font-size: 2.2rem;
  cursor: pointer;
  box-shadow: 0 16px 35px rgba(0,0,0,0.4);
}

.start {
  position: absolute;
  z-index: 5;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  padding: 16px 30px;
  border-radius: 999px;
  border: 0;
  background: white;
  color: #111;
  font: inherit;
  cursor: pointer;
}

.complete {
  position: absolute;
  inset: 0;
  z-index: 8;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 14px;
  background: rgba(0,0,0,0.75);
  backdrop-filter: blur(12px);
}

.complete h2 {
  font-family: Georgia, serif;
  font-size: clamp(2.8rem, 8vw, 6rem);
  margin: 0;
}

.complete button {
  padding: 14px 24px;
  border-radius: 999px;
  border: 0;
  cursor: pointer;
}

.feedback {
  min-height: 24px;
  color: #ffdca8;
}

@media (max-width: 700px) {
  .header {
    flex-direction: column;
  }
}
</style>