<script setup>
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'

const router = useRouter()
const showButton = ref(false)

function beginGame() {
  router.push('/level-4')
}

const grid = [
  ['P','U','N','D','A','R','R','I','C','H','A','R','D','H','P','J'],
  ['O','N','S','D','A','G','S','V','L','O','G','G','D','X','U','M'],
  ['P','U','N','C','H','P','R','A','L','I','N','P','E','C','S','P'],
  ['A','V','S','U','G','N','I','N','G','A','M','R','J','Z','S','U'],
  ['L','A','V','E','M','A','N','G','B','H','Q','R','L','I','Y','S'],
  ['D','O','O','D','L','E','S','Å','I','Z','I','A','Å','U','M','S'],
  ['Ä','L','S','K','A','R','D','I','G','G','F','J','J','U','A','Ä'],
  ['R','A','M','L','Ö','S','A','X','Ä','Ä','Ö','L','C','Ä','T','T'],
  ['B','A','T','M','A','N','K','V','M','Q','H','F','H','M','I','C'],
  ['W','H','A','L','L','A','Å','Ä','R','Å','J','A','J','A','D','W'],
  ['K','O','R','V','Ö','L','Ö','J','Ä','Y','Q','G','N','T','I','T'],
  ['N','O','B','E','L','J','N','O','F','H','J','I','Å','Z','G','B'],
  ['M','E','R','C','H','C','B','O','U','I','Q','R','U','P','W','K'],
  ['E','L','I','N','A','E','V','G','C','N','G','U','U','O','I','F'],
  ['P','Ö','B','E','L','L','N','X','S','K','U','R','G','Ö','K','D'],
  ['K','S','S','S','Å','B','W','H','I','Y','S','T','Ä','H','D','Ö']
]

const words = [
  'MAT',
  'DIG',
  'ÄLSKAR',
  'KSSS',
  'AVSUGNING',
  'MERCH',
  'DOODLES',
  'RAMLÖSA',
  'KORVÖL',
  'ONSDAGSVLOGG',
  'NOBEL',
  'LAVEMANG',
  'Ö',
  'WHALLA',
  'PUSS',
  'PUNDARRICHARD',
  'PUNCHPRALIN',
  'ELINA',
  'PÖBEL',
  'BATMAN'
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
  if (!selected.value.length) return

  const sameRow = selected.value.every(cell => cell.row === selected.value[0].row)
  const sameCol = selected.value.every(cell => cell.col === selected.value[0].col)

  if (!sameRow && !sameCol) {
    feedback.value = 'Orden kan bara läsas vågrätt eller lodrätt.'
    return
  }

  const sorted = [...selected.value].sort((a, b) => {
    if (sameRow) return a.col - b.col
    if (sameCol) return a.row - b.row
    return 0
  })

  const chosen = sorted.map(cell => cell.letter).join('')
  const match = words.find(word => word === chosen)

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
    cells: sorted
  })

  selected.value = []
  feedback.value = `Hittade: ${match}`
}
</script>

<template>
  <main class="word-room">
    <section class="word-card">

      <div class="signal-soup-wordsearch-top-area">
        <h1 class="signal-soup-wordsearch-title">
          WORD SEARCH ROOM
        </h1>

        <p class="signal-soup-wordsearch-intro">
          Hitta alla {{ words.length }} ord.
        </p>
      </div>

      <div class="word-layout">

        <div class="word-grid">
          <button
            v-for="(letter, index) in grid.flat()"
            :key="index"
            class="word-cell"
            :class="{
              selected: isSelected(Math.floor(index / 16), index % 16),
              found: isFoundLetter(Math.floor(index / 16), index % 16)
            }"
            @click="selectCell(Math.floor(index / 16), index % 16)"
          >
            {{ letter }}
          </button>
        </div>

        <aside class="signal-soup-wordsearch-side">

          <div class="signal-soup-wordsearch-top-row">

            <div class="signal-soup-wordsearch-progress">
              {{ foundCount }} / {{ words.length }} WORDS FOUND
            </div>

            <div class="signal-soup-wordsearch-buttons">
              <button @click="submitSelection">
                Submit
              </button>

              <button @click="clearSelection">
                Clear
              </button>
            </div>

          </div>

          <p class="signal-soup-wordsearch-feedback">
            {{ feedback }}
          </p>

          <div
            v-if="complete"
            class="signal-soup-wordsearch-reward"
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
  padding: 14px;

  display: grid;
  place-items: center;

  background:
    radial-gradient(circle at top, rgba(122,235,255,0.12), transparent 32%),
    #05070d;

  color: white;

  font-family:
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    monospace;
}

.word-card {
  width: min(96vw, 1180px);

  padding: 12px 18px;

  border-radius: 28px;

  background: rgba(8, 14, 22, 0.9);

  border: 1px solid rgba(160,225,255,0.16);

  box-shadow: 0 40px 140px rgba(0,0,0,0.65);
}

.signal-soup-wordsearch-top-area {
  text-align: center;
}

.signal-soup-wordsearch-title {
  margin: 0;

  font-family: Georgia, serif;
  font-weight: 400;

  font-size: clamp(1.4rem, 2.2vw, 2.2rem);

  line-height: 0.9;
  letter-spacing: -0.07em;
}

.signal-soup-wordsearch-intro {
  margin: 2px auto 0;

  max-width: 820px;

  color: rgba(220,245,255,0.72);

  line-height: 1.15;
  font-size: 0.68rem;
}

.word-layout {
  margin-top: 6px;

  display: flex;
  flex-direction: column;
  align-items: center;

  position: relative;
}

.word-grid {
  --gap: 3px;

  --cell-size: min(
    calc((100vh - 200px - (15 * var(--gap))) / 16),
    calc((96vw - 80px - (15 * var(--gap))) / 16),
    38px
  );

  display: grid;

  grid-template-columns: repeat(16, var(--cell-size));
  grid-template-rows: repeat(16, var(--cell-size));

  gap: var(--gap);

  justify-content: center;

  position: relative;
  z-index: 10;

  margin-bottom: 12px;
}

.word-cell {
  width: var(--cell-size);
  height: var(--cell-size);

  padding: 0;

  border-radius: 6px;

  border: 1px solid rgba(160,225,255,0.12);

  background: rgba(255,255,255,0.045);

  color: rgba(235,250,255,0.86);

  font: inherit;
  font-weight: 700;

  font-size: clamp(0.5rem, 0.75vw, 0.75rem);

  cursor: pointer;

  transition: 0.2s ease;

  position: relative;
  z-index: 20;
}

.word-cell:hover {
  background: rgba(122,235,255,0.12);
}

.word-cell.selected {
  background: rgba(255,196,118,0.35);

  color: white;

  outline: 2px solid rgba(255,196,118,0.7);
}

.word-cell.found {
  background: rgba(122,235,255,0.18);

  color: white;
}

.signal-soup-wordsearch-side {
  width: min(100%, 900px);

  display: flex;
  flex-direction: column;

  align-items: center;

  gap: 8px;

  position: relative;
  z-index: 1;
}

.signal-soup-wordsearch-top-row {
  width: 100%;

  display: flex;

  justify-content: space-between;
  align-items: center;

  gap: 12px;
}

.signal-soup-wordsearch-progress {
  padding: 8px 12px;

  border-radius: 18px;

  background: rgba(122,235,255,0.08);

  color: rgba(220,245,255,0.8);

  text-align: center;

  text-transform: uppercase;

  letter-spacing: 0.12em;

  font-size: 0.62rem;

  flex-shrink: 0;
}

.signal-soup-wordsearch-buttons {
  display: flex;

  gap: 10px;
}

.signal-soup-wordsearch-buttons button {
  padding: 8px 14px;

  border-radius: 999px;

  border: 1px solid rgba(160,225,255,0.18);

  background: rgba(122,235,255,0.08);

  color: white;

  font: inherit;

  cursor: pointer;

  text-transform: uppercase;

  letter-spacing: 0.12em;

  font-size: 0.62rem;

  transition: 0.2s ease;
}

.signal-soup-wordsearch-buttons button:hover {
  background: rgba(122,235,255,0.16);
}

.signal-soup-wordsearch-feedback {
  height: 18px;

  margin: 0;

  text-align: center;

  font-size: 0.68rem;

  color: rgba(255,238,210,0.88);
}

.signal-soup-wordsearch-reward {
  padding: 18px;

  border-radius: 18px;

  background: rgba(122,235,255,0.1);

  border-left: 2px solid rgba(122,235,255,0.55);

  letter-spacing: 0.14em;

  text-align: center;

  text-transform: uppercase;
}

@media (max-width: 850px) {
  .word-card {
    width: calc(100vw - 20px);

    padding: 12px;
  }

  .word-grid {
    --cell-size: min(
      calc((100vw - 50px) / 16),
      calc((100vh - 280px) / 16)
    );

    gap: 4px;
  }

  .signal-soup-wordsearch-top-row {
    flex-direction: column;
  }

  .signal-soup-wordsearch-buttons {
    width: 100%;
  }

  .signal-soup-wordsearch-buttons button {
    flex: 1;
  }
}
</style>