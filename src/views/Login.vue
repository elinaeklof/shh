<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const name = ref('')
const password = ref('')
const error = ref('')

function login() {
  if (name.value.toLowerCase() === 'richard' && password.value === 'pöbel') {
    localStorage.setItem('isLoggedIn', 'true')
    router.push('/levels')
  } else {
    error.value = 'Fel lösenord '
  }
}
</script>

<template>
  <main class="page">
    <section class="card">
      <h1>Logga in</h1>

      <input v-model="name" placeholder="Namn" />
      <input v-model="password" placeholder="Lösenord" type="password" />

      <button @click="login">Enter vault</button>

      <p>{{ error }}</p>
    </section>
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #05070d;
  color: white;
  font-family: monospace;
}

.card {
  width: min(90vw, 420px);
  padding: 32px;
  border-radius: 28px;
  background: rgba(255,255,255,0.06);
  display: grid;
  gap: 16px;
}

input, button {
  padding: 14px 18px;
  border-radius: 999px;
  border: none;
}

button {
  font-weight: bold;
  cursor: pointer;
}
</style>