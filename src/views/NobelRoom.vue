<template>
  <div class="nobel-room" :class="{ solved: roomSolved }">
    <div class="gold-dust"></div>
    <div class="room-container">

      <!-- INTRO OVERLAY -->
      <transition name="fade" mode="out-in">
  <div v-if="phase === 'intro'" key="intro" class="overlay intro-overlay">
    <div class="intro-card">
      <div class="crown-icon">👑</div>

      <h1 class="intro-title">RUM I: NOBELMIDDAGEN</h1>

      <p class="intro-subtitle">18 december, Stockholms Stadshus</p>

      <div class="divider-gold"></div>

      <p class="intro-text">
        Du är inlåst i den stora bankettsalen. Middagen har börjat — men din stol är tom.
        Lös gåtorna, hitta den hemliga bokstaven, och lämna salen med äran i behåll.
      </p>

      <div class="hint-box">
        <span class="hint-icon">🔍</span>
        Tre gåtor · En hemlig bokstav · ~10 minuter
      </div>

      <button class="btn-start" @click="phase = 'room'">
      </button>
    </div>
  </div>
</transition>

      <!-- MAIN ROOM -->
      <transition name="fade" mode="out-in"></transition>
        <div v-if="phase === 'room'" class="main-room">

          <!-- Header -->
          <div class="room-header">
            <div class="header-left">
              <span class="room-label">NOBELMIDDAGEN</span>
            </div>
            <div class="progress-track">
              <div
                v-for="i in 3"
                :key="i"
                class="progress-dot"
                :class="{ completed: solvedPuzzles.includes(i), active: activePuzzle === i }"
                @click="activePuzzle = i"
              >
                <span v-if="solvedPuzzles.includes(i)">✓</span>
                <span v-else>{{ i }}</span>
              </div>
            </div>
            <div class="header-right">
              <span class="letter-display" v-if="solvedPuzzles.length > 0">
                Ledtrådar: <span v-for="l in collectedLetters" :key="l" class="letter-badge">{{ l }}</span>
              </span>
            </div>
          </div>

          <!-- SCENE -->
          <div class="banquet-scene">
            <div class="table-cloth">
              <div class="candelabra">🕯️🕯️🕯️</div>
              <div class="table-items">
                <div
                  class="item-hotspot"
                  v-for="item in tableItems"
                  :key="item.id"
                  :style="item.style"
                  :class="{ active: activePuzzle === item.puzzleId, solved: solvedPuzzles.includes(item.puzzleId) }"
                  @click="activePuzzle = item.puzzleId"
                  :title="item.label"
                >
                  <div class="item-icon">{{ item.icon }}</div>
                  <div class="item-label">{{ item.label }}</div>
                  <div v-if="solvedPuzzles.includes(item.puzzleId)" class="solved-badge">✓</div>
                </div>
              </div>
              <div class="table-plate">🍽️ &nbsp; 🥂 &nbsp; 🍴</div>
            </div>
          </div>

          <!-- PUZZLE PANELS -->
          <transition name="fade" mode="out-in">
            <div :key="activePuzzle">
            <!-- PUZZLE 1: Menu Card Cipher -->
            <div v-if="activePuzzle === 1 && !solvedPuzzles.includes(1)" key="p1" class="puzzle-panel">
              <div class="puzzle-header">
                <span class="puzzle-num">GÅTA I</span>
                <h2>Menyn av Alfred Nobel</h2>
              </div>
              <div class="menu-card">
                <div class="menu-title">NOBELBANKETT · MCMXCIX</div>
                <div class="menu-content">
                  <p class="menu-item">I. <span class="cipher-text">Hummer Bisque med Safran</span></p>
                  <p class="menu-item">II. <span class="cipher-text">Kyckling Confit à la Royale</span></p>
                  <p class="menu-item">III. <span class="cipher-text">Sorbet Citron Nobel</span></p>
                  <p class="menu-item">IV. <span class="cipher-text">Boeuf Bourguignon Grand Cru</span></p>
                </div>
                <div class="menu-footer">
                  <em>Ta den 3:e bokstaven i varje rätts <strong>första ord</strong> — i ordning.</em>
                </div>
              </div>
              <div class="answer-hint">
                <span class="hint-chip">H_mmer → M?</span>
                <span class="hint-chip">K_ckling → ?</span>
                <span class="hint-chip">S_rbet → ?</span>
                <span class="hint-chip">B_euf → ?</span>
              </div>
              <div class="input-group">
                <label>Vad bildas? (4 bokstäver)</label>
                <input
                  v-model="answers[1]"
                  type="text"
                  maxlength="4"
                  placeholder="____"
                  class="puzzle-input"
                  @keyup.enter="checkAnswer(1)"
                />
                <button class="btn-check" @click="checkAnswer(1)">KONTROLLERA</button>
              </div>
              <transition name="fade">
                <div v-if="feedback[1]" :class="['feedback', feedback[1].correct ? 'correct' : 'wrong']">
                  {{ feedback[1].msg }}
                </div>
              </transition>
            </div>

            <!-- PUZZLE 2: Seating riddle -->
            <div v-if="activePuzzle === 2 && !solvedPuzzles.includes(2)" key="p2" class="puzzle-panel">
              <div class="puzzle-header">
                <span class="puzzle-num">GÅTA II</span>
                <h2>Bordsplaceringen</h2>
              </div>
              <div class="seating-chart">
                <div class="table-visual">
                  <div class="seat-row top-row">
                    <div v-for="s in topSeats" :key="s.id" class="seat-item" :class="{ highlight: s.highlight }">
                      <div class="seat-name">{{ s.name }}</div>
                      <div class="seat-title">{{ s.title }}</div>
                    </div>
                  </div>
                  <div class="table-bar">🏆 KUNGLIGA BORDET 🏆</div>
                  <div class="seat-row bottom-row">
                    <div v-for="s in bottomSeats" :key="s.id" class="seat-item" :class="{ highlight: s.highlight }">
                      <div class="seat-name">{{ s.name }}</div>
                      <div class="seat-title">{{ s.title }}</div>
                    </div>
                  </div>
                </div>
                <div class="riddle-text">
                  <p>
                    <strong>Gåtan:</strong> Nobelpristagaren i Fysik sitter tre platser till höger om Kungen.
                    Kungen sitter på plats nummer <strong>2</strong> räknat från vänster i övre raden.
                    Var sitter Fysikpristagaren?
                  </p>
                  <p class="riddle-sub">Plats nummer (1–5, övre raden)</p>
                </div>
              </div>
              <div class="input-group">
                <label>Ange platsnummer:</label>
                <input
                  v-model="answers[2]"
                  type="number"
                  min="1" max="5"
                  placeholder="?"
                  class="puzzle-input small"
                  @keyup.enter="checkAnswer(2)"
                />
                <button class="btn-check" @click="checkAnswer(2)">KONTROLLERA</button>
              </div>
              <transition name="fade">
                <div v-if="feedback[2]" :class="['feedback', feedback[2].correct ? 'correct' : 'wrong']">
                  {{ feedback[2].msg }}
                </div>
              </transition>
            </div>

            <!-- PUZZLE 3: Wine Label Code -->
            <div v-if="activePuzzle === 3 && !solvedPuzzles.includes(3)" key="p3" class="puzzle-panel">
              <div class="puzzle-header">
                <span class="puzzle-num">GÅTA III</span>
                <h2>Vinet med det hemliga märket</h2>
              </div>
              <div class="wine-label">
                <div class="wine-bottle-visual">🍷</div>
                <div class="label-content">
                  <div class="wine-name">CHÂTEAU NOBEL</div>
                  <div class="wine-year">Anno MDCCCLXXXIX</div>
                  <div class="wine-code">
                    <div class="code-row">
                      <span class="code-cell" v-for="(c, i) in wineCode" :key="i" :class="{ golden: c.golden }">
                        {{ c.val }}
                      </span>
                    </div>
                  </div>
                  <div class="wine-clue">
                    <em>Summera de <span class="highlight-gold">guldmarkerade</span> siffrorna.<br>
                    Bokstaven i alfabetet med det positionen är ditt svar.</em>
                  </div>
                </div>
              </div>
              <div class="input-group">
                <label>Bokstav (A=1, B=2, ...):</label>
                <input
                  v-model="answers[3]"
                  type="text"
                  maxlength="1"
                  placeholder="?"
                  class="puzzle-input small"
                  @keyup.enter="checkAnswer(3)"
                />
                <button class="btn-check" @click="checkAnswer(3)">KONTROLLERA</button>
              </div>
              <div class="alphabet-guide">
                <span v-for="(l, i) in alphabet" :key="l" class="alpha-item">
                  <span class="alpha-num">{{ i+1 }}</span>
                  <span class="alpha-letter">{{ l }}</span>
                </span>
              </div>
              <transition name="fade">
                <div v-if="feedback[3]" :class="['feedback', feedback[3].correct ? 'correct' : 'wrong']">
                  {{ feedback[3].msg }}
                </div>
              </transition>
            </div>

            <!-- SOLVED STATE for puzzle -->
            <div v-if="solvedPuzzles.includes(activePuzzle)" key="solved" class="puzzle-panel solved-panel">
              <div class="solved-animation">
                <div class="solved-star">⭐</div>
                <h2>Gåta {{ activePuzzle }} löst!</h2>
                <p>Du samlade bokstaven: <span class="big-letter">{{ collectedLetters[solvedPuzzles.indexOf(activePuzzle)] }}</span></p>
                <div v-if="solvedPuzzles.length < 3" class="next-hint">
                  <button class="btn-next" @click="activePuzzle = nextUnsolved">Nästa gåta →</button>
                </div>
                <div v-else class="all-done">
                  <button class="btn-finish" @click="phase = 'finale'">🏆 AVSLÖJA HEMLIGHETEN</button>
                </div>
              </div>
            </div>
            </div>
          </transition>
        </div>

      <!-- FINALE OVERLAY -->
      <transition name="fade">
        <div v-if="phase === 'finale'" class="overlay finale-overlay">
          <div class="finale-card">
            <div class="fireworks">🎆🎇✨</div>
            <h1 class="finale-title">BRAVO!</h1>
            <p class="finale-sub">Du löste alla tre gåtor i Nobelsalen.</p>
            <div class="collected-letters">
              <span v-for="l in collectedLetters" :key="l" class="final-letter">{{ l }}</span>
            </div>
            <div class="divider-gold"></div>
            <div class="secret-reveal">
              <p>Formad ur bokstäverna avslöjar sig din hemliga kod:</p>
              <div class="secret-letter">
                🔑 <span class="letter-big">{{ secretLetter }}</span>
              </div>
              <p class="escape-hint">Bär med dig denna bokstav vidare i escape-rumsäventyret!</p>
            </div>
          </div>
        </div>
      </transition>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

function beginGame() {
  router.push('/level-20')
}

const router = useRouter()

const phase = ref('intro')
const activePuzzle = ref(1)
const solvedPuzzles = ref([])
const answers = ref({ 1: '', 2: '', 3: '' })
const feedback = ref({ 1: null, 2: null, 3: null })
const collectedLetters = ref([])
const secretLetter = 'N'

const tableItems = [
  { id: 1, puzzleId: 1, icon: '📜', label: 'Menyn', style: 'left:18%;top:20%' },
  { id: 2, puzzleId: 2, icon: '🪑', label: 'Bordsplan', style: 'left:50%;top:15%' },
  { id: 3, puzzleId: 3, icon: '🍷', label: 'Vinet', style: 'left:78%;top:22%' },
]

const topSeats = [
  { id: 1, name: 'Lars A.', title: 'Kemi' },
  { id: 2, name: 'Kung C.G.', title: 'H.M. Kungen', highlight: true },
  { id: 3, name: 'Marie C.', title: 'Gäst' },
  { id: 4, name: 'Dr. Sven', title: 'Fred' },
  { id: 5, name: 'Prof. E.', title: 'Fysik', highlight: true },
]

const bottomSeats = [
  { id: 6, name: 'Anna K.', title: 'Litteratur' },
  { id: 7, name: 'Dr. Hans', title: 'Medicin' },
  { id: 8, name: 'Prinsessan', title: 'H.K.H.' },
  { id: 9, name: 'Erik L.', title: 'Ekonomi' },
  { id: 10, name: 'Ingrid S.', title: 'Gäst' },
]

const wineCode = [
  { val: 3, golden: false },
  { val: 7, golden: true },
  { val: 2, golden: false },
  { val: 5, golden: true },
  { val: 9, golden: false },
  { val: 2, golden: true },
  { val: 0, golden: false },
]

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

const nextUnsolved = computed(() => {
  for (let i = 1; i <= 3; i++) {
    if (!solvedPuzzles.value.includes(i)) return i
  }
  return 1
})

const correctAnswers = { 1: 'MCRE', 2: '5', 3: 'N' }
const letterReward = { 1: 'M', 2: 'E', 3: 'N' }

function checkAnswer(puzzleId) {
  const raw = (answers.value[puzzleId] || '').toString().trim().toUpperCase()
  if (raw === correctAnswers[puzzleId]) {
    feedback.value[puzzleId] = { correct: true, msg: '✨ Rätt! Utmärkt!' }
    if (!solvedPuzzles.value.includes(puzzleId)) {
      solvedPuzzles.value.push(puzzleId)
      collectedLetters.value.push(letterReward[puzzleId])
    }
  } else {
    feedback.value[puzzleId] = { correct: false, msg: '❌ Fel svar. Försök igen.' }
    setTimeout(() => { feedback.value[puzzleId] = null }, 2000)
  }
}

function goNext() {
  router.push('/level-21')
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

.nobel-room {
  min-height: 100vh;
  background: #0d0a06;
  font-family: 'Cormorant Garamond', serif;
  color: #e8d5a3;
  position: relative;
  overflow: hidden;
}

/* Gold dust particle effect */
.gold-dust {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 50%, rgba(212, 175, 55, 0.05) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 20%, rgba(255, 215, 0, 0.04) 0%, transparent 50%),
    radial-gradient(ellipse at 60% 80%, rgba(184, 148, 43, 0.06) 0%, transparent 40%);
  pointer-events: none;
}

.room-container { position: relative; z-index: 1; }

/* OVERLAY */
.overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  background: rgba(5, 4, 2, 0.92);
  backdrop-filter: blur(8px);
}

.intro-card, .finale-card {
  max-width: 560px;
  width: 90%;
  background: linear-gradient(135deg, #1a1408 0%, #0d0a06 50%, #1a1408 100%);
  border: 1px solid rgba(212, 175, 55, 0.4);
  padding: 48px 40px;
  text-align: center;
  position: relative;
  box-shadow:
    0 0 60px rgba(212, 175, 55, 0.15),
    inset 0 1px 0 rgba(212, 175, 55, 0.2);
}

.intro-card::before, .finale-card::before {
  content: '';
  position: absolute;
  inset: 8px;
  border: 1px solid rgba(212, 175, 55, 0.15);
  pointer-events: none;
}

.crown-icon { font-size: 3rem; margin-bottom: 16px; }
.intro-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.8rem;
  font-weight: 900;
  color: #d4af37;
  letter-spacing: 3px;
  margin-bottom: 4px;
}

.intro-subtitle {
  font-size: 0.9rem;
  color: #8a7040;
  letter-spacing: 2px;
  margin-bottom: 24px;
}

.divider-gold {
  height: 1px;
  background: linear-gradient(90deg, transparent, #d4af37, transparent);
  margin: 24px 0;
}

.intro-text {
  font-size: 1.05rem;
  line-height: 1.8;
  color: #c8b87a;
  margin-bottom: 24px;
}

.hint-box {
  background: rgba(212, 175, 55, 0.08);
  border: 1px solid rgba(212, 175, 55, 0.2);
  padding: 12px 20px;
  font-size: 0.85rem;
  letter-spacing: 1px;
  color: #d4af37;
  margin-bottom: 32px;
}

.btn-start {
  background: linear-gradient(135deg, #d4af37, #b8942b);
  color: #0d0a06;
  border: none;
  padding: 14px 40px;
  font-family: 'Playfair Display', serif;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-start:hover {
  background: linear-gradient(135deg, #e8c548, #d4af37);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(212, 175, 55, 0.4);
}

/* MAIN ROOM */
.main-room {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.room-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
  background: rgba(0,0,0,0.4);
}

.room-label {
  font-size: 0.7rem;
  letter-spacing: 4px;
  color: #8a7040;
  font-family: 'Playfair Display', serif;
}

.progress-track {
  display: flex;
  gap: 12px;
}

.progress-dot {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(212, 175, 55, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s;
  color: #5a4820;
}

.progress-dot.completed {
  background: #d4af37;
  color: #0d0a06;
  border-color: #d4af37;
}

.progress-dot.active {
  border-color: #d4af37;
  color: #d4af37;
  box-shadow: 0 0 12px rgba(212, 175, 55, 0.3);
}

.letter-display { font-size: 0.85rem; color: #8a7040; }
.letter-badge {
  display: inline-block;
  background: rgba(212, 175, 55, 0.15);
  border: 1px solid rgba(212, 175, 55, 0.3);
  padding: 2px 8px;
  margin: 0 3px;
  color: #d4af37;
  font-weight: 700;
}

/* BANQUET SCENE */
.banquet-scene {
  padding: 32px;
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #0a0704 0%, #120e07 100%);
  border-bottom: 1px solid rgba(212, 175, 55, 0.1);
}

.table-cloth {
  width: 100%;
  max-width: 800px;
  background: linear-gradient(135deg, #1a0f00 0%, #2a1a04 50%, #1a0f00 100%);
  border: 2px solid rgba(212, 175, 55, 0.3);
  padding: 24px 32px;
  position: relative;
  box-shadow:
    0 20px 60px rgba(0,0,0,0.5),
    inset 0 1px 0 rgba(255,255,255,0.05);
}

.candelabra {
  text-align: center;
  font-size: 1.6rem;
  margin-bottom: 16px;
  text-shadow: 0 0 20px rgba(255, 200, 50, 0.6);
  animation: flicker 2s ease-in-out infinite alternate;
}

@keyframes flicker {
  0% { opacity: 1; }
  50% { opacity: 0.85; text-shadow: 0 0 30px rgba(255, 200, 50, 0.9); }
  100% { opacity: 1; }
}

.table-items {
  position: relative;
  height: 100px;
}

.item-hotspot {
  position: absolute;
  transform: translateX(-50%);
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  padding: 8px;
}

.item-hotspot:hover { transform: translateX(-50%) translateY(-4px); }

.item-hotspot.active .item-icon {
  text-shadow: 0 0 20px rgba(212, 175, 55, 0.8);
  transform: scale(1.2);
}

.item-icon {
  font-size: 2rem;
  display: block;
  transition: all 0.3s;
}

.item-label {
  font-size: 0.65rem;
  letter-spacing: 2px;
  color: #8a7040;
  margin-top: 4px;
  text-transform: uppercase;
}

.solved-badge {
  position: absolute;
  top: 0; right: 0;
  background: #d4af37;
  color: #0d0a06;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 700;
}

.table-plate {
  text-align: center;
  font-size: 1.4rem;
  margin-top: 8px;
  color: rgba(212, 175, 55, 0.5);
}

/* PUZZLE PANEL */
.puzzle-panel {
  flex: 1;
  padding: 32px;
  max-width: 700px;
  width: 100%;
  margin: 0 auto;
}

.puzzle-header {
  margin-bottom: 24px;
}

.puzzle-num {
  font-size: 0.65rem;
  letter-spacing: 4px;
  color: #8a7040;
}

.puzzle-header h2 {
  font-family: 'Playfair Display', serif;
  font-size: 1.8rem;
  color: #e8d5a3;
  margin-top: 4px;
}

/* Menu card */
.menu-card {
  background: #faf8f0;
  color: #2a1a04;
  padding: 32px;
  position: relative;
  margin-bottom: 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}

.menu-card::before {
  content: '';
  position: absolute;
  inset: 6px;
  border: 1px solid rgba(100, 70, 20, 0.3);
  pointer-events: none;
}

.menu-title {
  font-family: 'Playfair Display', serif;
  text-align: center;
  font-size: 1rem;
  letter-spacing: 3px;
  color: #6b4a18;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(100, 70, 20, 0.3);
  padding-bottom: 12px;
}

.menu-item {
  margin: 10px 0;
  font-size: 1.05rem;
  line-height: 1.6;
}

.cipher-text { font-style: italic; }

.menu-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(100, 70, 20, 0.2);
  font-size: 0.85rem;
  color: #5a3a10;
  text-align: center;
}

.answer-hint {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.hint-chip {
  background: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.2);
  padding: 4px 12px;
  font-size: 0.8rem;
  color: #c8a830;
}

/* Seating */
.seating-chart { margin-bottom: 24px; }

.table-visual {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(212, 175, 55, 0.2);
  padding: 20px;
  margin-bottom: 16px;
}

.seat-row {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin: 12px 0;
}

.seat-item {
  text-align: center;
  padding: 8px 12px;
  border: 1px solid rgba(212, 175, 55, 0.15);
  min-width: 80px;
  font-size: 0.75rem;
  transition: all 0.3s;
}

.seat-item.highlight {
  border-color: rgba(212, 175, 55, 0.5);
  background: rgba(212, 175, 55, 0.08);
}

.seat-name { font-weight: 600; color: #e8d5a3; margin-bottom: 2px; }
.seat-title { color: #8a7040; font-size: 0.7rem; letter-spacing: 1px; }

.table-bar {
  background: linear-gradient(90deg, transparent, rgba(212,175,55,0.2), transparent);
  text-align: center;
  padding: 12px;
  font-size: 0.75rem;
  letter-spacing: 3px;
  color: #d4af37;
  border-top: 1px solid rgba(212,175,55,0.2);
  border-bottom: 1px solid rgba(212,175,55,0.2);
}

.riddle-text {
  background: rgba(212, 175, 55, 0.05);
  border-left: 3px solid #d4af37;
  padding: 16px 20px;
  font-size: 0.95rem;
  line-height: 1.7;
}

.riddle-sub { color: #8a7040; font-size: 0.85rem; margin-top: 8px; }

/* Wine */
.wine-label {
  display: flex;
  gap: 24px;
  align-items: center;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(212, 175, 55, 0.2);
  padding: 24px;
  margin-bottom: 20px;
}

.wine-bottle-visual { font-size: 4rem; flex-shrink: 0; }

.label-content { flex: 1; }

.wine-name {
  font-family: 'Playfair Display', serif;
  font-size: 1.4rem;
  color: #d4af37;
  margin-bottom: 4px;
}

.wine-year { font-size: 0.8rem; letter-spacing: 2px; color: #8a7040; margin-bottom: 16px; }

.code-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.code-cell {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(212, 175, 55, 0.2);
  font-family: 'Playfair Display', serif;
  font-size: 1.1rem;
  font-weight: 700;
}

.code-cell.golden {
  background: rgba(212, 175, 55, 0.25);
  border-color: #d4af37;
  color: #f5d060;
  box-shadow: 0 0 12px rgba(212, 175, 55, 0.3);
}

.wine-clue { font-size: 0.85rem; line-height: 1.6; color: #c8b87a; }
.highlight-gold { color: #d4af37; font-weight: 600; }

/* Alphabet guide */
.alphabet-guide {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 16px 0;
}

.alpha-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 28px;
}

.alpha-num { font-size: 0.5rem; color: #5a4820; }
.alpha-letter { font-size: 0.75rem; color: #c8b87a; font-weight: 600; }

/* Input group */
.input-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 16px;
}

.input-group label {
  font-size: 0.8rem;
  letter-spacing: 1px;
  color: #8a7040;
}

.puzzle-input {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(212, 175, 55, 0.3);
  color: #e8d5a3;
  padding: 10px 16px;
  font-family: 'Playfair Display', serif;
  font-size: 1.1rem;
  width: 140px;
  text-align: center;
  letter-spacing: 4px;
  text-transform: uppercase;
  outline: none;
  transition: border-color 0.3s;
}

.puzzle-input:focus { border-color: #d4af37; box-shadow: 0 0 12px rgba(212, 175, 55, 0.2); }
.puzzle-input.small { width: 80px; }

.btn-check {
  background: transparent;
  border: 1px solid rgba(212, 175, 55, 0.4);
  color: #d4af37;
  padding: 10px 24px;
  font-size: 0.75rem;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-check:hover {
  background: rgba(212, 175, 55, 0.1);
  border-color: #d4af37;
}

.feedback {
  margin-top: 12px;
  padding: 10px 16px;
  font-size: 0.9rem;
  animation: fadeIn 0.3s ease;
}

.feedback.correct {
  background: rgba(50, 180, 100, 0.1);
  border: 1px solid rgba(50, 180, 100, 0.3);
  color: #5de096;
}

.feedback.wrong {
  background: rgba(220, 60, 60, 0.1);
  border: 1px solid rgba(220, 60, 60, 0.3);
  color: #e07070;
}

/* Solved panel */
.solved-panel {
  display: flex;
  align-items: center;
  justify-content: center;
}

.solved-animation {
  text-align: center;
  padding: 40px;
}

.solved-star {
  font-size: 3rem;
  animation: spin 1s ease;
}

@keyframes spin {
  0% { transform: scale(0) rotate(-180deg); }
  100% { transform: scale(1) rotate(0); }
}

.solved-animation h2 {
  font-family: 'Playfair Display', serif;
  font-size: 2rem;
  color: #d4af37;
  margin: 16px 0 8px;
}

.big-letter {
  font-size: 3rem;
  color: #d4af37;
  font-family: 'Playfair Display', serif;
  font-weight: 900;
}

.btn-next, .btn-finish {
  margin-top: 24px;
  background: linear-gradient(135deg, #d4af37, #b8942b);
  color: #0d0a06;
  border: none;
  padding: 14px 36px;
  font-family: 'Playfair Display', serif;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-next:hover, .btn-finish:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(212, 175, 55, 0.4);
}

/* Finale */
.fireworks { font-size: 2.5rem; margin-bottom: 16px; }

.finale-title {
  font-family: 'Playfair Display', serif;
  font-size: 3rem;
  color: #d4af37;
  letter-spacing: 6px;
  margin-bottom: 8px;
}

.finale-sub { color: #c8b87a; margin-bottom: 24px; }

.collected-letters {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 8px;
}

.final-letter {
  width: 52px;
  height: 52px;
  border: 2px solid #d4af37;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Playfair Display', serif;
  font-size: 1.8rem;
  font-weight: 700;
  color: #d4af37;
}

.secret-reveal {
  background: rgba(212, 175, 55, 0.05);
  border: 1px solid rgba(212, 175, 55, 0.2);
  padding: 24px;
  text-align: center;
}

.letter-big {
  font-family: 'Playfair Display', serif;
  font-size: 4rem;
  color: #d4af37;
  font-weight: 900;
  letter-spacing: 0;
}

.secret-letter {
  font-size: 2rem;
  margin: 12px 0;
}

.escape-hint { font-size: 0.85rem; color: #8a7040; margin-top: 12px; letter-spacing: 1px; }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-enter-active { transition: all 0.5s ease; }
.slide-up-enter-from { opacity: 0; transform: translateY(30px); }

.panel-slide-enter-active, .panel-slide-leave-active { transition: all 0.3s ease; }
.panel-slide-enter-from { opacity: 0; transform: translateX(20px); }
.panel-slide-leave-to { opacity: 0; transform: translateX(-20px); }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>
