<script setup>
import { useRouter } from 'vue-router'
import { ref, computed, reactive } from 'vue'

const router = useRouter()
const showButton = ref(false)

function beginGame() {
  router.push('/level-25')
}


// ---------- Spelstate ----------
// Hemligt ord + kategorier av nyckelord -> kryptiska svarsord
// Hemligt ord: LIGHTHOUSE (fyr). Svårt att gissa, mängder av indirekta ledtrådar.
const SECRET = 'lighthouse'

// För varje "tema" har gubben en bank av enstaka, kryptiska ord
const clueBank = {
  location:   ['edge', 'shore', 'cliff', 'coast', 'rocks', 'horizon'],
  function:   ['warn', 'guide', 'watch', 'shine', 'beacon'],
  appearance: ['tall', 'narrow', 'striped', 'white', 'lonely'],
  feeling:    ['solitude', 'patience', 'fog', 'silence', 'wait'],
  material:   ['stone', 'iron', 'salt', 'glass'],
  time:       ['night', 'storm', 'ancient', 'always'],
  living:     ['nobody', 'keeper', 'gulls'],
  yes:        ['perhaps', 'closer', 'warmer', 'maybe'],
  no:         ['no', 'cold', 'farther', 'wrong'],
  unknown:    ['hmm', 'unclear', 'rephrase', 'speak.up'],
}

// Nyckelord i frågor -> tema
// Ordningen spelar roll (första träffen vinner)
const triggers = [
  { theme: 'location',   words: ['where', 'place', 'located', 'country', 'city', 'inside', 'outside'] },
  { theme: 'function',   words: ['do', 'used', 'purpose', 'job', 'work', 'function', 'help'] },
  { theme: 'appearance', words: ['look', 'color', 'colour', 'shape', 'size', 'big', 'small', 'tall', 'wide'] },
  { theme: 'feeling',    words: ['feel', 'emotion', 'mood', 'lonely', 'happy', 'sad'] },
  { theme: 'material',   words: ['made', 'material', 'metal', 'wood', 'plastic', 'stone'] },
  { theme: 'time',       words: ['when', 'old', 'new', 'modern', 'ancient', 'night', 'day'] },
  { theme: 'living',     words: ['alive', 'animal', 'person', 'human', 'people', 'living', 'creature'] },
  { theme: 'yes',        words: ['is it a', 'is this a', 'can it', 'does it'] }, // generella ja/nej
]

const messages = reactive([
  { from: 'hobo', text: 'food.' },
])
const input = ref('')
const food = ref(10)          // antal frågor du har råd med
const guesses = ref(3)        // antal gissningar
const won = ref(false)
const lost = ref(false)
const askedThemes = reactive({}) // tema -> antal gånger frågat

const status = computed(() => {
  if (won.value) return 'You guessed it. He nods, slowly.'
  if (lost.value) return `He turns away. The word was "${SECRET}".`
  return 'Ask him something. He answers in single words.'
})

function pickClue(theme) {
  const bank = clueBank[theme] || clueBank.unknown
  const used = askedThemes[theme] || 0
  askedThemes[theme] = used + 1
  // rotera så samma fråga inte ger samma ord
  return bank[used % bank.length]
}

function detectTheme(q) {
  const lower = ' ' + q.toLowerCase() + ' '
  for (const t of triggers) {
    for (const w of t.words) {
      if (lower.includes(' ' + w + ' ') || lower.includes(w)) return t.theme
    }
  }
  // negation/affirmation hint
  if (/^(is|are|do|does|can|did|was|were)\b/i.test(q.trim())) {
    // slumpa ja/nej för att vara svår
    return Math.random() < 0.45 ? 'yes' : 'no'
  }
  return 'unknown'
}

function ask() {
  const q = input.value.trim()
  if (!q || won.value || lost.value) return
  messages.push({ from: 'you', text: q })
  input.value = ''

  // Gissning?
  if (/^(is it |the answer is |i guess |my guess is )/i.test(q) || q.split(/\s+/).length === 1) {
    return tryGuess(q)
  }

  food.value -= 1
  const theme = detectTheme(q)
  const word = pickClue(theme)
  setTimeout(() => {
    messages.push({ from: 'hobo', text: word + '.' })
    scrollChat()
    if (food.value <= 0) endLose()
  }, 500)
  scrollChat()
}

function tryGuess(raw) {
  // extrahera sista ordet
  const parts = raw.toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/)
  const candidate = parts[parts.length - 1]
  if (candidate === SECRET) {
    setTimeout(() => {
      messages.push({ from: 'hobo', text: 'yes.' })
      won.value = true
      showButton.value = true
      scrollChat()
    }, 400)
    return
  }
  guesses.value -= 1
  setTimeout(() => {
    messages.push({ from: 'hobo', text: guesses.value > 0 ? 'no.' : 'gone.' })
    if (guesses.value <= 0) endLose()
    scrollChat()
  }, 400)
}

function endLose() {
  if (won.value) return
  lost.value = true
  showButton.value = true
}

function reset() {
  messages.splice(0, messages.length, { from: 'hobo', text: 'food.' })
  food.value = 10
  guesses.value = 3
  won.value = false
  lost.value = false
  Object.keys(askedThemes).forEach(k => delete askedThemes[k])
  showButton.value = false
}


function scrollChat() {
  setTimeout(() => {
    const el = document.querySelector('.chat-log')
    if (el) el.scrollTop = el.scrollHeight
  }, 30)
}
</script>

<template>
  <div class="bl_wrapper">
    <div class="stage">
      <!-- VENSTER: SVG hobo (oförändrad, bara förkortad här för läsbarhet) -->
      <svg id="svg_tramp" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
        <!-- (Identisk grafik som i originalet — endast skylttexten är ändrad nedan) -->
        <path d="M470 421.2c16.1-.4 32.2-.6 47.8 4.6 17 5.6 24 15.4 24.2 33.2 1.5 4.5-.6 8.1-2.8 11.7-6.4 10.6-16.8 15.9-27.8 20.1-19.6 7.5-40.2 10.4-60.9 12.8-2 .2-4 .2-5.7-1.3-.8-1.5-.1-2.9.4-4.3 2.9-7.5 3.5-15.1.9-22.9-.6-1.8-1.6-3.8-.1-5.7 5.8-2.5 12-2.2 18-3.3 10.6-1.9 21.3-3.7 31.6-7.3 1.8-.6 3.8-1 5.5-2.5-4.2-1.2-8.3-1.3-12.4-1.5-24.7-.9-49.1 1.9-73.5 6.1-2 .3-3.9.7-5.9.4-11.8-2.4-23.3-5.7-32.8-13.6-3.4-2.8-6.8-5.4-9.3-9-2.6-3.8-6.1-5.3-10.7-5-3.8.2-7.7.4-11.5-.3-1.4-.3-4.9 0-2.4-3.4 2.3-1.3 4.9-1 7.3-1h54c2.7 0 5.3.1 7.9-.8 4.8-3.1 9.7-5.6 15.7-3.8.9.3 2-.2 2.9-.7 7.2-4.2 13.6-2.4 19.7 2.3.6.4 1.2.5 1.9.6 1 .1 2 .3 2.9.7 3.7 1.5 6.8 2.1 6.8-3.6 0-1.4 1.2-2.2 2.8-2.2 2-.1 3.8.4 5.5-.3z" fill="#535353"/>
        <path d="M342.1 430.8c4.1 2.6 8.7 1.4 13 1.1 6.6-.5 10.6 2.1 14.9 7.1 9.3 11.1 21.9 17.4 36.2 20 .9.2 1.9.5 2.8.8-.9 1.5-2.4 1.9-3.8 1.9-15.6 0-31.4 1.8-46.8-.8-25.7-4.3-51.4-6.8-77.4-5.9-1.5 0-3 .1-4.5.4-1.1.2-2.2.3-3.8 1.2 7.2 3.2 14.2 4.9 21.3 6.5 9.6 2.2 19.3 3.2 29 4.8 1.6.3 3.3.4 4.8 1.2 1.6 1 2.1 2.6 1.6 4.3-2.3 8.7-2.3 17.3.9 25.8.6 1.7.2 3.3-1.8 4-4.2 1.3-8.3.1-12.3-.4-17.9-2.2-35.5-5.4-52.5-11.5-7.8-2.8-14.9-6.5-21.3-11.7-4.9-4-8.4-8.9-10.3-15-.6-1.9-1.3-3.8 0-5.7.7-19.7 9.6-30.2 29.5-35 16.1-3.9 32.3-3.3 48.6-2.7.3.2.7.4.7.7.4 7.8 6.2 7.4 11.6 7.6 4 .1 7.9.2 11.9-.1 1.9-.3 3.9-.5 5.8-.7 1.2-.2 2.6 0 1.9 2.1z" fill="#414040"/>
        <path class="st2" d="M443.5 134.3c1.9 5.7 3.2 14.6 4.7 15.7 7.7 5.6 6.7 14-2.1 18.3-1.4 1.9-3.3 2.7-5.6 2.7-27.1-.1-54.2.5-81.3-.2-8.9.6-17.8.2-26.7.3-2 0-3.9-.5-5.4-2-.4-.3-.7-.6-1.1-.9 1.9-2.4 4.6-1.4 6.9-1.5 6.4-.3 12.8-.3 19.1.3 2.4 0 2.9-6.8 2.6-4.9-.2 1.8-.1 3.8-2.4 4.4-2.4-.5-3.4-2.4-4.3-4.4-.6-1.9 1.4-10.6 3.6-11.9 3.7-2.2 4.6-5.4 5.4-9.4 4.1-21.1 16.2-36 35.8-44.9 2.4-1.1 4.9-.7 7.2-1.6 19.4 4.3 32.6 16.1 41 33.8.7 1.2 2.5 6.1 2.6 6.2z"/>
        <path d="M405 306.1c4.6.2 9-1.4 13.4-2.5.1 2.6-2.4 1.9-3.1 3.8 3.9 1.8 6.5-2.1 7.4-3.5 2.9-4.8 6.8-7.8 12.2-7.2 2.5.3 3.6-1.6 3.4-3.3-.9-6.5 3.7-11 5.5-16.5 13.5 5.7 26.9 11.6 38.3 21.1 14.4 12.1 26.6 25.8 30.1 45.1 3.1 17-2.3 31.5-14.3 43.6-1.5-1.2-1.6-2.9-1.6-4.5-.1-9.6-4.6-16.1-13.7-19.3-.9-.3-1.9-.7-2.6-1.5-.7-.8-.8-1.9-.4-2.8 3.9-10.9-2-18.7-8.2-26.4-2.1-2.6-4.7-4.7-6.9-7.1-1.1-1.1-2.2-2.2-3.6-3.1-2.4-3.3-3.7.3-5.4.9-12.1 0-23.9-2.7-35.8-3.7-2.6-.2-5.3-.2-7.8-1-5.8-.4-11.6.6-17.4 1.1-8.3.7-16.6 1.3-24.9 2.1-1.7.2-3.3 0-4.7-1.2-1.4-6.7 4.1-13.8 10.8-13.9 9.8 0 19.5.7 29.3-.2z" fill="#597a8c"/>
        <path class="st4" d="M405 306.1c-4.5 1.8-9.2.5-13.7.8-2.6.2-5.3 0-8 0-11.8 0-13.9 1.4-18.3 12.8-1.9 2.7-5 2.7-7.7 2.9-12.3.7-24.5 2.1-36.8 2.8-1.3.1-2.7 0-3.9-.7-1.6-.8-1-2.6-1.7-3.9-2 .7-3.3 2.2-5 3.3-1.4.9-2.4 2.1-3.6 3.2-2.7 2.7-5.1 5.7-7.4 8.8-5.1 6.7-8 13.8-5.3 22.3.3 1 .2 2-.3 2.9-1 1.4-2.6 1.9-4.1 2.7-8 3.9-11.6 10.4-11.4 19.2 0 1.7.8 3.7-1 5.1-16.1-14.1-21.2-36.6-12.3-56.7 9.5-21.5 26.5-35.7 46.9-46.3 4.5-2.4 9.4-4.2 14.1-6.3 1.4-.7 3.3-.7 3.9-2.7 1.7 6.2 4.7 11.7 9.4 16.1 3.1 2.9 2.6 4.8-1.6 6 .5.5 1.1 1.1 1.2 1.1 5.5-4 9.9 0 13.2 3 4.9 4.5 10.2 3.5 15.6 3.5 12.5.1 25.2.1 37.8.1z"/>
        <path d="M461.9 321.2c1.3.5.3 25.1.6 29.9-.4 2.4-1.7 4.5-.3 7.2 1.5 2.8-.9 3.8-3.1 4.5-4.6 1.5-8.4 4-11.2 8-9.2 13.1-4.9 29.2 9.6 36 1.9.9 4.1 1.5 5.4 3.5 1.6 3.2-1.1 6.3 0 9.5.1.4.1.8.2 1.1-.1.7-.4 1.3-.5 1.9-.5 5.5-.6 5.6-6.1 3.9-2-.6-3.1.4-4.5 1.1-4.3.6-6.3-3.8-10.5-4.5-3.6-.6-6.1 0-8.8 1.4-2.9 1.5-5.6 2.3-8.8.9-4.2-1.9-6.6 2.1-9.7 3.5-2.2 0-2-1.8-1.4-2.7 3.1-4.8 2-9.8 1.4-14.8-.1-.8-5.2-30.1-6.3-35.3-.3-.8-1.6-8.4-2-11.5-1.1-7.4 3-42 4-46 .3-1.1 32.2 1.5 47.1 3.2 1.3-1.8 3.2-.8 4.9-.8z" fill="#c6b4af"/>
        <path class="st7" d="M359 169.1c26.9-.1 53.7-.1 80.6-.2 2.1 0 4.3.2 6.4-.6 0 5.5.1 10.9-.1 16.4-.1 3.1.8 4.4 4.2 4.4 6.4.1 10.9 4.7 10.9 10.4 0 6.5-3.9 10.4-11.1 10.5-3.1 0-4.3 1.1-4.1 4-.5-.1-69.3-1.7-71.1-.6-5.3 0-10.6.6-15.8-.3v.1c-2.9-3.6 1.1-34.9-.9-37.7-.9-2.4-.8-4.5 1-6.4z"/>
        <path d="M630.7 446c-.4 10.1-1.3 21.2-1.7 31.2-.2 4.2-.1 5.2-5 4.9-7.3-.5-14.6-.2-21.9-.3-.8-.1-1.5-1.5-2.1-.7-2.4 3.2-5.3 1.6-8.1 1-1.3 0-2.7-.1-4-.1-6.7 0-7.1 2.6-7.8-9.1-.7-11.2-1.5-20.3-2.1-31.8" fill="#308894"/>
        <path d="M327 213.5c-.5-3.9-1.7-3.5-4.1-3.5-7.2 0-11.6-4.4-11.3-10.9.2-6.2 4.9-10.5 11.8-10 3.3.2 3.9-.8 3.8-3.7-.2-5.5-.1-11-.1-16.5 10.7 0 21.3.1 32 .1v6.6c-.7 1.3-2.2 1.5-3.3 2-5.4 2.3-5.7 2.7-7.1 9 3.7 1.3 6.5-4.4 10.4-1.6 0 1.5-.3 3 1.2 4-2.9 4.2-2.5 8.5-.2 12.8-2.2 3.5-.5 7.5-1.1 11.2-8.8 1.1-20.3.6-29.1.4" fill="#e0a88c"/>
        <symbol id="eyes">
          <path d="M415.1 195.3c.1 3.9-2.5 6.7-6.4 6.8-3.9.1-6.7-2.5-6.8-6.3-.1-3.9 2.5-6.7 6.3-6.8 3.9-.1 6.8 2.5 6.9 6.3z" fill="#672f12"/>
          <circle cx="408.3" cy="195.4" r="3.8"/>
          <ellipse cx="407.9" cy="193.9" rx="1.1" ry="1" fill="#fff"/>
        </symbol>
        <use xlink:href="#eyes"/>
        <use xlink:href="#eyes" transform="translate(-47, 0)"/>

        <!-- Skylten med ny text -->
        <path class="st61" d="M631.3 430.7l-4.2 70.3-45.2-.9-5.1-68.6c-.3-3.7-8-7 6.4-6.9l42.5.3c16.6 0 5.8 2.5 5.6 5.8zM576.8 431.4h54.5"/>
        <text x="605" y="455" text-anchor="middle" class="sign_text">will</text>
        <text x="605" y="468" text-anchor="middle" class="sign_text">do</text>
        <text x="605" y="481" text-anchor="middle" class="sign_text">anything</text>
        <text x="605" y="494" text-anchor="middle" class="sign_text">for food</text>
      </svg>

      <!-- HÖGER: Chat-spelet -->
      <aside class="panel">
        <header class="panel-head">
          <h2>The Hobo's Riddle</h2>
          <div class="meta">
            <span>Food left: <strong>{{ food }}</strong></span>
            <span>Guesses: <strong>{{ guesses }}</strong></span>
          </div>
          <p class="hint">{{ status }}</p>
        </header>

        <div class="chat-log">
          <div v-for="(m, i) in messages" :key="i" class="msg" :class="m.from">
            <span class="who">{{ m.from === 'hobo' ? 'Hobo' : 'You' }}</span>
            <span class="bubble">{{ m.text }}</span>
          </div>
        </div>

        <form class="composer" @submit.prevent="ask">
          <input
            v-model="input"
            :disabled="won || lost"
            placeholder="Ask a question, or type your guess..."
            autocomplete="off"
          />
          <button type="submit" :disabled="won || lost || !input.trim()">Ask</button>
        </form>

        <div class="actions">
          <button class="ghost" @click="reset">Restart</button>
          <button v-if="showButton" class="primary" @click="beginGame">Continue</button>
        </div>

        <p class="rules">
          He only answers with single words. He lies when he is annoyed.
          Each question costs one food. You have three guesses — type a single
          word to guess, or start with "is it ...".
        </p>
      </aside>
    </div>

    <a class="btn_home" href="/">Go HOME</a>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600;700;800&display=swap');

* {
  box-sizing: border-box;
}

body {
  min-height: 100vh;
  margin: 0;
  background-color: #fff;
  overflow: auto;
}

.bl_wrapper {
  min-height: 100vh;
  width: 100%;
  margin: 0;
  padding: 32px;
  background:
    radial-gradient(circle at 18% 18%, rgba(255, 190, 116, 0.24), transparent 34%),
    radial-gradient(circle at 80% 12%, rgba(85, 62, 42, 0.16), transparent 30%),
    linear-gradient(135deg, #f6ead9 0%, #e1c5a3 48%, #b9845d 100%);
  color: #2d2017;
  overflow: hidden;
  position: relative;
}

.bl_wrapper::before {
  content: '';
  position: fixed;
  inset: 18px;
  border: 1px solid rgba(82, 52, 31, 0.13);
  border-radius: 38px;
  pointer-events: none;
}

.stage {
  height: calc(100vh - 92px);
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(380px, 460px);
  gap: 28px;
  align-items: stretch;
  max-width: 1440px;
  margin: 0 auto;
}

#svg_tramp {
  display: block;
  width: 100%;
  height: 100%;
  padding: 20px;
  border-radius: 36px;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.45), rgba(255,255,255,0.08)),
    rgba(255, 247, 232, 0.36);
  border: 1px solid rgba(82, 52, 31, 0.14);
  box-shadow:
    0 34px 90px rgba(73, 43, 21, 0.18),
    inset 0 1px 0 rgba(255,255,255,0.55);
  backdrop-filter: blur(16px);
}

.sign_text {
  font-size: 9px;
  font-family: "Permanent Marker", "Courier New", cursive;
  fill: #2e3192;
  font-weight: 700;
}

.panel {
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr auto auto auto;
  gap: 14px;
  padding: 24px;
  border-radius: 36px;
  background:
    radial-gradient(circle at 50% 0%, rgba(255,255,255,0.52), transparent 38%),
    rgba(47, 32, 22, 0.92);
  border: 1px solid rgba(255, 235, 205, 0.2);
  box-shadow:
    0 34px 90px rgba(73, 43, 21, 0.32),
    inset 0 1px 0 rgba(255,255,255,0.12);
  color: #f8ead7;
  font-family: Inter, system-ui, sans-serif;
}

.panel-head {
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 235, 205, 0.12);
}

.panel-head h2 {
  margin: 0 0 12px;
  font-family: "DM Serif Display", Georgia, serif;
  font-size: clamp(2rem, 4vw, 3.4rem);
  font-weight: 400;
  line-height: 0.95;
  letter-spacing: -0.04em;
  color: #fff6e8;
}

.meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.meta span {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 247, 232, 0.08);
  border: 1px solid rgba(255, 235, 205, 0.1);
  color: rgba(255, 241, 220, 0.68);
  font-size: 0.78rem;
}

.meta strong {
  color: #ffd18a;
}

.hint {
  margin: 14px 0 0;
  color: rgba(255, 241, 220, 0.62);
  line-height: 1.5;
  font-size: 0.9rem;
}

.chat-log {
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
  border-radius: 24px;
  background:
    linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
    rgba(0, 0, 0, 0.18);
  background-size: 100% 34px;
  border: 1px solid rgba(255, 235, 205, 0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-log::-webkit-scrollbar {
  width: 8px;
}

.chat-log::-webkit-scrollbar-thumb {
  background: rgba(255, 209, 138, 0.35);
  border-radius: 999px;
}

.msg {
  display: flex;
  flex-direction: column;
  gap: 5px;
  max-width: 82%;
}

.msg.you {
  align-self: flex-end;
  align-items: flex-end;
}

.msg.hobo {
  align-self: flex-start;
}

.who {
  font-size: 0.62rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255, 241, 220, 0.38);
}

.bubble {
  width: fit-content;
  padding: 11px 14px;
  border-radius: 18px;
  line-height: 1.45;
  font-size: 0.94rem;
  box-shadow: 0 14px 30px rgba(0,0,0,0.16);
}

.msg.hobo .bubble {
  background: #f4d7a8;
  color: #2d2017;
  border-top-left-radius: 5px;
  font-family: "Courier New", monospace;
  letter-spacing: 0.04em;
}

.msg.you .bubble {
  background: rgba(255,255,255,0.11);
  color: #fff2df;
  border: 1px solid rgba(255, 235, 205, 0.1);
  border-top-right-radius: 5px;
}

.composer {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}

.composer input {
  width: 100%;
  min-width: 0;
  padding: 15px 16px;
  border-radius: 999px;
  border: 1px solid rgba(255, 235, 205, 0.14);
  background: rgba(255, 247, 232, 0.08);
  color: #fff6e8;
  outline: none;
  font: inherit;
}

.composer input::placeholder {
  color: rgba(255, 241, 220, 0.35);
}

.composer input:focus {
  border-color: rgba(255, 209, 138, 0.58);
  box-shadow: 0 0 0 4px rgba(255, 209, 138, 0.08);
}

.composer button,
.actions button {
  border: 0;
  border-radius: 999px;
  padding: 13px 18px;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
  transition: 0.18s ease;
}

.composer button {
  background: #ffd18a;
  color: #2d2017;
}

.composer button:hover,
.actions .primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 30px rgba(255, 209, 138, 0.18);
}

.composer button:disabled {
  opacity: 0.42;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.actions {
  display: flex;
  gap: 10px;
}

.actions .ghost {
  background: rgba(255,255,255,0.06);
  color: rgba(255, 241, 220, 0.78);
  border: 1px solid rgba(255, 235, 205, 0.12);
}

.actions .primary {
  background: #8da66a;
  color: white;
}

.rules {
  margin: 0;
  padding: 14px 16px;
  border-radius: 20px;
  background: rgba(255, 247, 232, 0.06);
  border: 1px solid rgba(255, 235, 205, 0.09);
  color: rgba(255, 241, 220, 0.5);
  font-size: 0.74rem;
  line-height: 1.55;
}

.btn_home {
  position: fixed;
  left: 32px;
  bottom: 28px;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 118px;
  padding: 12px 16px;
  border-radius: 999px;
  background: rgba(47, 32, 22, 0.72);
  border: 1px solid rgba(255, 235, 205, 0.18);
  color: #fff1dc;
  font-family: Inter, sans-serif;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  backdrop-filter: blur(14px);
}

.btn_home:hover {
  background: #2f2016;
}

@media (max-width: 980px) {
  .bl_wrapper {
    overflow: auto;
    padding: 22px;
  }

  .stage {
    height: auto;
    grid-template-columns: 1fr;
  }

  #svg_tramp {
    height: 48vh;
    min-height: 360px;
  }

  .panel {
    min-height: 620px;
  }

  .btn_home {
    position: static;
    margin: 20px auto 0;
  }
}

@media (max-width: 560px) {
  .bl_wrapper {
    padding: 14px;
  }

  .panel {
    padding: 18px;
    border-radius: 28px;
  }

  .composer {
    grid-template-columns: 1fr;
  }

  .actions {
    flex-direction: column;
  }
}
</style>