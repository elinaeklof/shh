<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const startDate = new Date('2026-05-22')

const levels = [
  { title: 'Level 1', path: '/level-2' },
  { title: 'Level 2', path: '/level-3' },
  { title: 'Level 3', path: '/level-4' },
  { title: 'Level 4', path: '/level-5' },
  { title: 'Level 5', path: '/level-6' },
  { title: 'Level 6', path: '/level-7' },
  { title: 'Level 7', path: '/level-8' },
  { title: 'Level 8', path: '/level-9' },
  { title: 'Level 9', path: '/level-10' },
  { title: 'Level 10', path: '/level-11' },
  { title: 'Level 11', path: '/level-12' },
  { title: 'Level 12', path: '/level-13' },
  { title: 'Level 13', path: '/level-14' },
  { title: 'Level 14', path: '/level-15' },
  { title: 'Level 15', path: '/level-16' },
]

const unlockedCount = computed(() => {
  const today = new Date()
  const diffTime = today - startDate
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  return Math.min(levels.length, (diffDays + 1) * 3)
})

function openLevel(index, path) {
  if (index < unlockedCount.value) {
    router.push(path)
  }
}
</script>

<template>
  <main class="page">
    <section class="card">
      <h1>Alla rum</h1>
      <p>{{ unlockedCount }} / {{ levels.length }} upplåsta</p>

      <div class="grid">
        <button
          v-for="(level, index) in levels"
          :key="level.path"
          class="level"
          :class="{ locked: index >= unlockedCount }"
          @click="openLevel(index, level.path)"
        >
          <span>{{ level.title }}</span>
          <small>
            {{ index < unlockedCount ? 'Spela' : 'Låst 🔒' }}
          </small>
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding: 32px;
  background: #05070d;
  color: white;
  font-family: monospace;
}

.card {
  max-width: 1000px;
  margin: auto;
}

h1 {
  font-size: 56px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}

.level {
  min-height: 120px;
  border: none;
  border-radius: 24px;
  background: #80ed99;
  color: #05070d;
  font-weight: bold;
  cursor: pointer;
  display: grid;
  place-items: center;
}

.level.locked {
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.35);
  cursor: not-allowed;
}
</style>