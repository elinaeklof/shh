<script setup>
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'

const router = useRouter()
const showButton = ref(false)

function beginGame() {
  router.push('/level-4')
}
const grid = [
  ['S','I','G','N','A','L','R','Q','P','A','N','C','A','K','E','X'],
  ['U','A','N','T','E','N','N','A','L','O','C','K','B','R','U','S'],
  ['S','H','A','D','O','W','M','A','T','R','I','S','C','O','D','E'],
  ['H','A','M','B','U','R','G','E','R','F','A','S','B','I','T','E'],
  ['I','R','A','D','A','R','N','O','K','I','A','T','E','R','M','I'],
  ['S','M','A','K','P','I','Z','Z','A','V','A','L','V','E','N','A'],
  ['U','O','S','C','A','N','N','E','R','E','S','S','C','R','O','L'],
  ['S','N','K','R','Y','P','T','O','S','A','I','L','I','N','G','Y'],
  ['H','I','C','I','P','H','E','R','D','I','M','M','A','S','U','S'],
  ['I','C','H','E','C','K','S','U','M','E','L','I','N','A','S','T'],
  ['D','A','S','U','S','H','I','V','A','U','L','T','M','O','R','S'],
  ['D','E','S','T','I','N','A','T','I','O','N','R','O','U','T','E'],
  ['E','S','C','A','P','E','F','R','E','Q','U','E','N','C','Y','K'],
  ['N','O','O','D','L','E','P','U','S','S','A','R','C','L','U','E'],
  ['B','E','A','M','F','O','R','M','I','N','G','T','I','M','E','R'],
  ['G','L','I','T','C','H','P','A','T','T','E','R','N','M','A','P']
]

const words = [
  'SIGNAL',
  'ANTENNA',
  'BRUS',
  'SHADOW',
  'MATRIS',
  'CODE',
  'HAMBURGER',
  'RADAR',
  'NOKIA',
  'PIZZA',
  'SCANNER',
  'SCROLL',
  'KRYPTO',
  'SAILING',
  'CIPHER',
  'DIMMA',
  'CHECKSUM',
  'ELINA',
  'SUSHI',
  'VAULT'
]

const selected = ref([])
const found = ref([])
const feedback = ref('')

const foundCount = computed(() => found.value.length)
const complete = computed(() => found.value.length === words.length)

function cellKey(row, col) {
  return `${row}-${col}`
}

function isSelected(row, col) {
  return selected.value.some(cell => cell.row === row && cell.col === col)
}

function isFoundLetter(row, col) {
  return found.value.some(word =>
    word.cells.some(cell => cell.row === row && cell.col === col)
  )
}

function selectCell(row, col) {
  const key = cellKey(row, col)

  if (selected.value.some(cell => cell.key === key)) {
    selected.value = selected.value.filter(cell => cell.key !== key)
    return
  }

  selected.value.push({
    row,
    col,
    key,
    letter: grid[row][col]
  })

  feedback.value = ''
}

function clearSelection() {
  selected.value = []
  feedback.value = ''
}

function submitSelection() {
  const chosen = selected.value.map(cell => cell.letter).join('')
  const reversed = selected.value.map(cell => cell.letter).reverse().join('')

  const match = words.find(word => {
    return word === chosen || word === reversed
  })

  if (!match) {
    feedback.value = 'Inte ett giltigt ord.'
    return
  }

  if (found.value.some(item => item.word === match)) {
    feedback.value = 'Det ordet är redan hittat.'
    selected.value = []
    return
  }

  found.value.push({
    word: match,
    cells: [...selected.value]
  })

  selected.value = []
  feedback.value = `Hittade: ${match}`
}
</script>

<template>
  <main class="word-room">
    <section class="card">
      <p class="kicker">word search room</p>
      <h1>Signal Soup</h1>

      <p class="intro">
        Hitta alla 20 ord. Orden kan ligga vågrätt, lodrätt, diagonalt och baklänges.
        Markera bokstäver i ordning och tryck submit.
      </p>

      <div class="layout">
        <div class="grid">
          <button
            v-for="(letter, index) in grid.flat()"
            :key="index"
            class="cell"
            :class="{
              selected: isSelected(Math.floor(index / 16), index % 16),
              found: isFoundLetter(Math.floor(index / 16), index % 16)
            }"
            @click="selectCell(Math.floor(index / 16), index % 16)"
          >
            {{ letter }}
          </button>
        </div>

        <aside class="side">
          <div class="progress">
            {{ foundCount }} / {{ words.length }} words found
          </div>

          <div class="word-list">
            <div
              v-for="word in words"
              :key="word"
              :class="{ done: found.some(item => item.word === word) }"
            >
              {{ word }}
            </div>
          </div>

          <div class="buttons">
            <button @click="submitSelection">Submit</button>
            <button @click="clearSelection">Clear</button>
          </div>

          <p class="feedback">{{ feedback }}</p>

          <div
            v-if="complete"
            class="reward"
          >
            ROOM COMPLETE · BOKSTAV: W
          </div>
        </aside>
      </div>
    </section>
  </main>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.word-room {
  min-height: 100vh;
  background:
    radial-gradient(circle at top, rgba(122,235,255,0.12), transparent 32%),
    #05070d;
  color: white;
  display: grid;
  place-items: center;
  padding: 28px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.card {
  width: min(96vw, 1180px);
  padding: 34px;
  border-radius: 34px;
  background: rgba(8, 14, 22, 0.9);
  border: 1px solid rgba(160,225,255,0.16);
  box-shadow: 0 40px 140px rgba(0,0,0,0.65);
}

.kicker {
  margin: 0 0 10px;
  color: rgba(220,245,255,0.46);
  text-transform: uppercase;
  letter-spacing: 0.24em;
  font-size: 0.72rem;
}

h1 {
  margin: 0;
  font-family: Georgia, serif;
  font-weight: 400;
  font-size: clamp(3rem, 8vw, 6rem);
  letter-spacing: -0.07em;
}

.intro {
  color: rgba(220,245,255,0.62);
  line-height: 1.7;
  max-width: 820px;
}

.layout {
  margin-top: 28px;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 26px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(16, 1fr);
  gap: 6px;
}

.cell {
  aspect-ratio: 1;
  border-radius: 10px;
  border: 1px solid rgba(160,225,255,0.12);
  background: rgba(255,255,255,0.045);
  color: rgba(235,250,255,0.86);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.cell.selected {
  background: rgba(255,196,118,0.35);
  color: white;
}

.cell.found {
  background: rgba(122,235,255,0.18);
  color: white;
}

.side {
  display: grid;
  align-content: start;
  gap: 16px;
}

.progress {
  padding: 14px;
  border-radius: 18px;
  background: rgba(122,235,255,0.08);
  color: rgba(220,245,255,0.8);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.76rem;
}

.word-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.word-list div {
  padding: 9px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,0.045);
  color: rgba(255,255,255,0.55);
  font-size: 0.78rem;
}

.word-list div.done {
  background: rgba(122,235,255,0.14);
  color: white;
  text-decoration: line-through;
}

.buttons {
  display: flex;
  gap: 10px;
}

button {
  transition: 0.2s ease;
}

.buttons button {
  flex: 1;
  padding: 13px;
  border-radius: 999px;
  border: 1px solid rgba(160,225,255,0.18);
  background: rgba(122,235,255,0.08);
  color: white;
  font: inherit;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.72rem;
}

.feedback {
  min-height: 22px;
  color: rgba(255,238,210,0.88);
}

.reward {
  padding: 18px;
  border-radius: 18px;
  background: rgba(122,235,255,0.1);
  border-left: 2px solid rgba(122,235,255,0.55);
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

@media (max-width: 850px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .cell {
    border-radius: 6px;
    font-size: 0.7rem;
  }
}
</style>