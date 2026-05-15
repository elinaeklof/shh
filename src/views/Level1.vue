<script setup>
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'

const router = useRouter()
const showButton = ref(false)

function beginGame() {
  router.push('/level-2')
}

onMounted(() => {
  setTimeout(() => {
    showButton.value = true
  }, 5200)
})
</script>

<template>
  <main class="start-page">
    <section class="start-card">
      <p class="eyebrow">NIVÅ 1</p>
      <h1>Första låset 🔐</h1>

      <p class="subtitle">
        Här kommer första gåtan.
      </p>
    </section>
  </main>
</template>