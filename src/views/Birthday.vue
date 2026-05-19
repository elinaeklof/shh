<script setup>
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'

const router = useRouter()
const showButton = ref(false)

function beginGame() {
  router.push('/level-1')
}

onMounted(() => {
  setTimeout(() => {
    showButton.value = true
  }, 5200)
})
</script>

<template>
  <main class="cinema-page">
    <div class="film-grain"></div>
    <div class="spotlight"></div>

    <section class="trailer">
      <p class="line line-1">Tonight...</p>
      <p class="line line-2">one birthday & graduation</p>
      <p class="line line-3">one locked gift</p>

      <h1 class="title">
        The Gift Vault
      </h1>

      <p class="subtitle">
        Unlock sequence begins now.
      </p>

      <button
        v-if="showButton"
        @click="beginGame"
        class="cinema-button"
      >
        Begin Unlock Sequence
      </button>
    </section>
  </main>
</template>

<style scoped>
.cinema-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px;
  position: relative;
  overflow: hidden;
  background: #000;
  color: white;
}

.cinema-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at center, rgba(70,100,180,0.18), transparent 35%),
    linear-gradient(180deg, #02040a, #000000 70%);
}

.film-grain {
  position: absolute;
  inset: 0;
  opacity: 0.08;
  background-image:
    repeating-radial-gradient(circle at 30% 30%, white 0, white 1px, transparent 1px, transparent 4px);
  animation: grain 0.35s steps(2) infinite;
}

.spotlight {
  position: absolute;
  width: 780px;
  height: 780px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(120,150,255,0.16), transparent 60%);
  filter: blur(30px);
  animation: pulse 4s ease-in-out infinite;
}

.trailer {
  position: relative;
  z-index: 2;
  text-align: center;
}

.line {
  margin: 0;
  opacity: 0;
  font-size: clamp(1.8rem, 6vw, 4.8rem);
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.line-1 {
  animation: trailerLine 1.1s ease forwards;
}

.line-2 {
  animation: trailerLine 1.1s ease forwards;
  animation-delay: 1.3s;
}

.line-3 {
  animation: trailerLine 1.1s ease forwards;
  animation-delay: 2.6s;
}

.title {
  margin: 34px 0 0;
  opacity: 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(4rem, 13vw, 9rem);
  font-weight: 400;
  line-height: 0.85;
  letter-spacing: -0.08em;

  background: linear-gradient(180deg, #ffffff, #9fb3ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  animation: titleReveal 1.4s ease forwards;
  animation-delay: 3.9s;
}

.subtitle {
  margin-top: 28px;
  opacity: 0;
  color: rgba(255,255,255,0.62);
  font-size: 1rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;

  animation: fadeIn 1s ease forwards;
  animation-delay: 4.7s;
}

.cinema-button {
  margin-top: 46px;
  padding: 18px 42px;
  border-radius: 999px;
  border: 1px solid rgba(200,215,255,0.24);
  background: rgba(255,255,255,0.08);
  color: white;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  cursor: pointer;
  animation: buttonIn 0.8s ease forwards;
}

.cinema-button:hover {
  transform: translateY(-3px);
  background: rgba(120,155,255,0.18);
  box-shadow: 0 24px 70px rgba(70,110,255,0.24);
}

@keyframes trailerLine {
  0% {
    opacity: 0;
    transform: scale(1.08);
    filter: blur(8px);
  }

  20% {
    opacity: 1;
    transform: scale(1);
    filter: blur(0);
  }

  80% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: scale(0.98);
  }
}

@keyframes titleReveal {
  from {
    opacity: 0;
    transform: scale(1.18);
    filter: blur(16px);
  }

  to {
    opacity: 1;
    transform: scale(1);
    filter: blur(0);
  }
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

@keyframes buttonIn {
  from {
    opacity: 0;
    transform: translateY(16px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  50% {
    transform: scale(1.08);
    opacity: 0.75;
  }
}

@keyframes grain {
  50% {
    transform: translate(2px, -2px);
  }
}
</style>