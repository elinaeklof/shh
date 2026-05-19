<script setup>
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'

const router = useRouter()
const showButton = ref(false)

function beginGame() {
  router.push('/level-7')
}

const command = ref('')
const output = ref(`root@relay:~$ HELP
ERROR: command corrupted

Tips:
- vissa svar ändrar äldre rader
- terminalen försöker dölja ett namn
- använd inte vanliga kommandon
`)

function runCommand() {
  const value = command.value.trim().toLowerCase()
  let response = 'UNKNOWN COMMAND'

  if (value === 'mirror') {
    output.value = output.value.split('\n').reverse().join('\n')
    response = 'terminal mirrored'
  }

  if (value === 'trace') {
    response = 'hidden user detected: elina'
  }

  if (value === 'override') {
    response = 'override impossible unless system lies'
  }

  if (value === 'help') {
    response = 'why would the terminal help you?'
  }

  output.value += `\nroot@relay:~$ ${value}\n${response}`
  command.value = ''
}
</script>

<template>
  <main class="room">
    <section class="card">
      <p class="kicker">04 / ghost terminal</p>
      <h1>Fake terminal</h1>

      <p>Terminalen ljuger. Vissa kommandon ändrar tidigare loggar.</p>

      <div class="terminal">
        <pre>{{ output }}</pre>

        <div class="terminal-row">
          <span>$</span>
          <input v-model="command" @keydown.enter="runCommand" placeholder="command" />
          <button @click="runCommand">run</button>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.room {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #05070d;
  color: white;
  font-family: monospace;
}

.card {
  width: min(92vw, 880px);
  padding: 36px;
  border-radius: 34px;
  background: rgba(8, 14, 22, 0.82);
}

.terminal {
  background: #020407;
  border-radius: 24px;
  padding: 24px;
  border: 1px solid rgba(122,235,255,0.14);
}

pre {
  color: rgba(122,235,255,0.75);
  white-space: pre-wrap;
  line-height: 1.6;
}

.terminal-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

input {
  flex: 1;
  padding: 12px;
  background: rgba(255,255,255,0.04);
  color: white;
  border: 1px solid rgba(122,235,255,0.2);
}
</style>