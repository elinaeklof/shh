<script setup>
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'

const router = useRouter()
const showButton = ref(false)

function beginGame() {
  router.push('/level-23')
}

const helpCount = ref(0)
const clueUnlocked = ref(false)
const panelCollapsed = ref(false)
const infoOpen = ref(false)
const feedback = ref('')
const hintEntries = ref([])

const hints = [
  'Kolla i vänstra hörnet.',
  'Nej, lite längre upp.',
  'Fortfarande inget? Märkligt.',
  'Det kanske inte finns något där.',
  'Okej då. Här kommer bokstaven.'
]

function requestHelp() {
  if (helpCount.value >= 5) {
    feedback.value = 'Inga fler ledtrådar. Puss-skulden är redan maxad.'
    return
  }

  hintEntries.value.push({
    number: helpCount.value + 1,
    text: hints[helpCount.value]
  })

  helpCount.value++

  if (helpCount.value === 5) {
    clueUnlocked.value = true
    feedback.value = 'Bokstaven är upplåst.'
  }
}

function togglePanel() {
  panelCollapsed.value = !panelCollapsed.value
}
</script>

<template>
  <main class="lose-room">
    <div class="lose-box">
      <span>YOU LOSE</span>
    </div>

    <button
      class="info-button floating-info"
      type="button"
      aria-label="Visa regler"
      @click="infoOpen = true"
    >
      i
    </button>

    <section
      class="bottom-panel"
      :class="{ collapsed: panelCollapsed }"
    >
      <div class="panel-header">
        <div class="mission-header">
          <div class="mission-dot"></div>
          ledtrådspanel
        </div>

        <button
          class="panel-toggle"
          type="button"
          @click="togglePanel"
        >
          {{ panelCollapsed ? '+' : '—' }}
        </button>
      </div>

      <div class="panel-content">
        <div class="hint-system">
          <button type="button" @click="requestHelp">
            Request clue
          </button>

          <span>
            {{ helpCount }} / 5 clues ·
            {{ helpCount }} puss{{ helpCount === 1 ? '' : 'ar' }} skyldig
          </span>
        </div>

        <div class="hintbook">
          <div
            v-for="hint in hintEntries"
            :key="hint.number"
            class="hint-entry"
          >
            <strong>CLUE {{ String(hint.number).padStart(2, '0') }}</strong><br />
            {{ hint.text }}
          </div>
        </div>

        <p
          v-if="feedback"
          class="feedback"
        >
          {{ feedback }}
        </p>

        <div
          v-if="clueUnlocked"
          class="letter-box"
        >
          Bokstav: I
        </div>
      </div>
    </section>

    <div
      class="info-modal"
      :class="{ visible: infoOpen }"
      @click.self="infoOpen = false"
    >
      <div class="info-card">
        <div class="info-card-header">
          <h2>Regler</h2>

          <button
            class="close-info"
            type="button"
            aria-label="Stäng"
            @click="infoOpen = false"
          >
            ×
          </button>
        </div>

        <p>
          You are on your own.
          PS. Varje ledtråd kostar en puss till Elina.
        </p>
      </div>
    </div>
  </main>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.lose-room {
  min-height: 100vh;
  background: #05070d;
  display: grid;
  place-items: center;
  color: white;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.lose-box {
  width: min(80vw, 760px);
  height: 340px;
  position: relative;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 34px;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03)),
    #4f5561;
  box-shadow:
    0 40px 120px rgba(0,0,0,0.55),
    inset 0 1px 0 rgba(255,255,255,0.18),
    inset 0 -40px 80px rgba(0,0,0,0.18);
}

.lose-box span {
  display: none;
  position: relative;
  z-index: 2;
  font-family: Georgia, serif;
  font-size: clamp(3.6rem, 9vw, 7rem);
  font-weight: 400;
  line-height: 0.9;
  letter-spacing: -0.08em;
  color: rgba(255,255,255,0.96);
  text-shadow: 0 20px 60px rgba(0,0,0,0.55);
}

.lose-box:hover {
  background:
    radial-gradient(circle at 50% 0%, rgba(255,255,255,0.16), transparent 42%),
    linear-gradient(180deg, #c41919, #7d0000);
}

.lose-box:hover span {
  display: block;
}

.floating-info {
  pointer-events: auto;
  position: fixed;
  top: 28px;
  right: 28px;
  z-index: 20;
}

.info-button {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  padding: 0;
  font-family: Georgia, serif;
  font-size: 1rem;
  letter-spacing: 0;
  text-transform: none;
}

.bottom-panel {
  position: fixed;
  left: 50%;
  bottom: 28px;
  transform: translateX(-50%);
  z-index: 18;
  pointer-events: auto;
  width: min(100%, 980px);
  display: grid;
  gap: 14px;
  padding: 22px;
  border: 1px solid rgba(160, 225, 255, 0.16);
  border-radius: 28px;
  background: rgba(3, 7, 12, 0.72);
  backdrop-filter: blur(28px);
  box-shadow:
    0 30px 100px rgba(0,0,0,0.5),
    inset 0 1px 0 rgba(255,255,255,0.08);
  overflow: hidden;
}

.bottom-panel.collapsed {
  width: auto;
  min-width: 0;
  padding: 14px;
  gap: 0;
  border-radius: 999px;
  left: auto;
  right: 28px;
  bottom: 28px;
  transform: none;
  background: rgba(3, 7, 12, 0.5);
  backdrop-filter: blur(20px);
}

.bottom-panel.collapsed .panel-content {
  display: none;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.panel-toggle {
  width: 44px;
  height: 44px;
  padding: 0;
  display: grid;
  place-items: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.mission-header {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(220,245,255,0.72);
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 0.72rem;
}

.mission-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #7aebff;
  box-shadow: 0 0 18px rgba(122,235,255,0.8);
}

.panel-content {
  display: grid;
  gap: 14px;
}

.hint-system {
  display: flex;
  align-items: center;
  gap: 12px;
  border-top: 1px solid rgba(255,255,255,0.08);
  padding-top: 14px;
}

.hint-system span {
  color: rgba(220,245,255,0.48);
  font-size: 0.76rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hintbook {
  display: grid;
  gap: 8px;
  max-height: 130px;
  overflow: auto;
  padding-right: 4px;
}

.hint-entry {
  border-left: 2px solid rgba(255,196,118,0.34);
  padding: 9px 11px;
  background: rgba(255,196,118,0.045);
  color: rgba(255,238,210,0.68);
  font-size: 0.78rem;
  line-height: 1.5;
}

.hint-entry strong {
  color: rgba(255,255,255,0.92);
  font-weight: 500;
}

.feedback {
  margin: 0;
  color: rgba(220, 245, 255, 0.58);
  font-size: 0.84rem;
}

.letter-box {
  border-left: 2px solid rgba(122,235,255,0.45);
  padding: 12px 14px;
  background: rgba(122,235,255,0.06);
  color: white;
  font-size: 1rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

button {
  border: 1px solid rgba(160, 225, 255, 0.18);
  border-radius: 999px;
  background: rgba(122, 235, 255, 0.08);
  color: rgba(235, 250, 255, 0.92);
  padding: 12px 18px;
  font: inherit;
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
}

.info-modal {
  position: fixed;
  inset: 0;
  z-index: 35;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(0,0,0,0.58);
  backdrop-filter: blur(16px);
  opacity: 0;
  pointer-events: none;
}

.info-modal.visible {
  opacity: 1;
  pointer-events: auto;
}

.info-card {
  width: min(92vw, 620px);
  padding: 34px;
  border: 1px solid rgba(160,225,255,0.18);
  border-radius: 30px;
  background:
    radial-gradient(circle at 50% 0%, rgba(122,235,255,0.12), transparent 42%),
    rgba(8, 14, 22, 0.9);
  box-shadow:
    0 50px 160px rgba(0,0,0,0.78),
    0 0 100px rgba(122,235,255,0.12);
}

.info-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
}

.info-card h2 {
  margin: 0;
  font-family: Georgia, serif;
  font-weight: 400;
  font-size: clamp(2rem, 5vw, 3.2rem);
  line-height: 0.95;
  letter-spacing: -0.07em;
}

.info-card p {
  margin: 0;
  color: rgba(220,245,255,0.66);
  line-height: 1.8;
  font-size: 0.95rem;
}

.close-info {
  width: 38px;
  height: 38px;
  padding: 0;
  display: grid;
  place-items: center;
  font-size: 1rem;
}
</style>