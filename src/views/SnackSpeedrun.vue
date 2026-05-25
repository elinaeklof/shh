<template>
  <div id="app" :class="['phase-' + phase]">
    <canvas ref="bgCanvas" class="bg-canvas"></canvas>

    <!-- INTRO -->
    <transition name="fade-screen">
      <div v-if="phase === 'intro'" class="screen intro-screen">
        <div class="kitchen-silhouette"></div>
        <div class="intro-inner">
          <div class="game-badge">NATTMAT SPEEDRUN</div>
          <h1 class="game-title">SNACK<br><em>SPEEDRUN</em></h1>
          <p class="game-desc">Kylskåpet är kaotiskt. Richard är hungrig och kritisk.<br>Elina är där. Hon hjälper inte.</p>
          <div class="rules-grid">
            <div class="rule-card">
              <span class="rule-num">01</span>
              <span>Hitta rätt ingredienser</span>
            </div>
            <div class="rule-card">
              <span class="rule-num">02</span>
              <span>Undvik utgångna saker</span>
            </div>
            <div class="rule-card">
              <span class="rule-num">03</span>
              <span>Stek, mikra, häll rätt</span>
            </div>
          </div>
          <button class="btn-start" @click="startGame">Starta natten</button>
        </div>
      </div>
    </transition>

    <!-- GAME -->
    <transition name="fade-screen">
      <div v-if="phase === 'game'" class="screen game-screen">

        <!-- 3D KITCHEN SCENE -->
        <div class="kitchen-scene" :style="kitchenPerspective">
          <!-- Back wall -->
          <div class="wall back-wall"></div>
          <div class="wall left-wall"></div>
          <div class="wall right-wall"></div>
          <div class="floor-plane"></div>

          <!-- Counter -->
          <div class="counter-3d">
            <div class="counter-top">
              <!-- Cutting board -->
              <div class="cutting-board" :class="{ active: activeZone === 'board' }" @click="clickZone('board')">
                <div class="cb-lines">
                  <span v-for="n in 5" :key="n"></span>
                </div>
                <div class="ingredient-on-board" v-if="boardIngredient">
                  <div class="ingredient-3d" :style="{ background: boardIngredient.color }">
                    <span>{{ boardIngredient.emoji }}</span>
                  </div>
                </div>
                <div class="zone-label">Skärbräda</div>
              </div>

              <!-- Pan -->
              <div class="pan-wrapper" :class="{ active: activeZone === 'pan', burning: panState === 'burning', done: panState === 'done' }" @click="clickZone('pan')">
                <div class="pan-3d">
                  <div class="pan-body">
                    <div class="pan-fill" :style="{ opacity: panState !== 'empty' ? 1 : 0 }">
                      <div class="pan-ingredient" v-if="panIngredient">{{ panIngredient.emoji }}</div>
                    </div>
                    <div class="steam" v-if="panState === 'cooking' || panState === 'burning'">
                      <span v-for="n in 3" :key="n" :style="{ animationDelay: n * 0.3 + 's' }"></span>
                    </div>
                    <div class="burn-smoke" v-if="panState === 'burning'">
                      <span v-for="n in 5" :key="n" :style="{ animationDelay: n * 0.15 + 's' }"></span>
                    </div>
                  </div>
                  <div class="pan-handle"></div>
                </div>
                <div class="heat-indicator" v-if="panState === 'cooking' || panState === 'burning'">
                  <div class="heat-bar" :style="{ width: panHeat + '%', background: panHeat > 80 ? '#ff4444' : panHeat > 50 ? '#ff9944' : '#ffcc44' }"></div>
                </div>
                <div class="zone-label">Stekpanna</div>
              </div>

              <!-- Microwave -->
              <div class="microwave-3d" :class="{ active: activeZone === 'micro', running: microRunning, done: microState === 'done', exploded: microState === 'exploded' }" @click="clickZone('micro')">
                <div class="micro-body">
                  <div class="micro-door">
                    <div class="micro-window">
                      <div class="micro-plate" :class="{ spinning: microRunning }">
                        <div class="micro-food" v-if="microIngredient">{{ microIngredient.emoji }}</div>
                      </div>
                      <div class="micro-sparks" v-if="microState === 'exploded'">
                        <span v-for="n in 6" :key="n"></span>
                      </div>
                    </div>
                  </div>
                  <div class="micro-panel">
                    <div class="micro-display">{{ microDisplay }}</div>
                    <div class="micro-buttons">
                      <div class="mbtn" v-for="n in 6" :key="n"></div>
                    </div>
                  </div>
                </div>
                <div class="micro-timer-bar" v-if="microRunning">
                  <div :style="{ width: microProgress + '%' }"></div>
                </div>
                <div class="zone-label">Mikrovågsugn</div>
              </div>
            </div>
            <div class="counter-front"></div>
          </div>

          <!-- FRIDGE (3D) -->
          <div class="fridge-3d" :class="{ open: fridgeOpen }" @click="toggleFridge">
            <div class="fridge-body">
              <div class="fridge-door" :class="{ ajar: fridgeOpen }">
                <div class="fridge-handle"></div>
                <div class="fridge-logo">❄</div>
                <div class="fridge-glow" v-if="fridgeOpen"></div>
              </div>
              <div class="fridge-interior" v-if="fridgeOpen">
                <div class="fridge-shelf" v-for="(shelf, si) in fridgeShelves" :key="si">
                  <div class="fridge-item"
                    v-for="(item, ii) in shelf" :key="ii"
                    :class="{ expired: item.expired, selected: selectedIngredient?.id === item.id, used: item.used }"
                    @click.stop="selectIngredient(item)"
                  >
                    <div class="item-3d">
                      <div class="item-face" :style="{ background: item.color }">
                        <span class="item-emoji">{{ item.emoji }}</span>
                        <span class="item-name">{{ item.name }}</span>
                      </div>
                      <div class="item-side" :style="{ background: item.color + 'cc' }"></div>
                    </div>
                    <div class="expired-tag" v-if="item.expired">UTGÅNGET</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="fridge-shadow"></div>
            <div class="zone-label">Kylskåp</div>
          </div>

          <!-- Glass / drink station -->
          <div class="drink-station" :class="{ active: activeZone === 'drink' }" @click="clickZone('drink')">
            <div class="glass-3d" :class="{ overflowing: drinkState === 'overflow' }">
              <div class="glass-body">
                <div class="drink-fill" :style="{ height: drinkLevel + '%', background: drinkColor }">
                  <div class="drink-surface"></div>
                </div>
                <div class="overflow-drips" v-if="drinkState === 'overflow'">
                  <span v-for="n in 4" :key="n"></span>
                </div>
              </div>
            </div>
            <div class="pour-bar" v-if="drinkState === 'pouring'">
              <div :style="{ width: pourProgress + '%' }"></div>
            </div>
            <div class="zone-label">Dricka</div>
          </div>

          <!-- Plate (assembly) -->
          <div class="plate-area" :class="{ complete: plateComplete, active: activeZone === 'plate' }" @click="clickZone('plate')">
            <div class="plate-shadow"></div>
            <div class="plate-3d">
              <div class="plate-food">
                <div class="plated-item" v-for="(item, i) in platedItems" :key="i" :style="platePosStyle(i)">
                  {{ item.emoji }}
                </div>
              </div>
            </div>
            <div class="zone-label">Tallrik</div>
          </div>
        </div>

        <!-- HUD -->
        <div class="hud-top">
          <div class="hud-timer" :class="{ urgent: timer < 30 }">
            <i class="hud-icon">⏱</i>
            <span>{{ formattedTimer }}</span>
          </div>
          <div class="hud-recipe" v-if="currentRecipe">
            <span class="recipe-label">Mål:</span>
            <span class="recipe-name">{{ currentRecipe.name }}</span>
            <div class="recipe-needs">
              <div class="need" v-for="need in currentRecipe.needs" :key="need.id" :class="{ got: hasIngredient(need.id) }">
                <span>{{ need.emoji }}</span>
                <span class="need-name">{{ need.name }}</span>
              </div>
            </div>
          </div>
          <div class="hud-score">
            <span class="score-label">Poäng</span>
            <span class="score-val">{{ score }}</span>
          </div>
        </div>

        <!-- RICHARD COMMENT -->
        <transition name="comment-slide">
          <div v-if="richardComment" class="richard-comment" :class="richardCommentType">
            <div class="richard-avatar">
              <div class="richard-face">
                <div class="r-eyes"><span></span><span></span></div>
                <div class="r-mouth" :class="richardCommentType"></div>
              </div>
            </div>
            <div class="comment-bubble">
              <div class="comment-who">Richard</div>
              <div class="comment-text">"{{ richardComment }}"</div>
            </div>
          </div>
        </transition>

        <!-- ELINA DISTRACTION -->
        <transition name="elina-pop">
          <div v-if="elinaEvent" class="elina-distraction" @click="dismissElina">
            <div class="elina-avatar">
              <div class="elina-face">
                <div class="e-eyes"><span></span><span></span></div>
                <div class="e-mouth"></div>
              </div>
            </div>
            <div class="elina-bubble">
              <div class="elina-who">Elina</div>
              <div class="elina-text">{{ elinaEvent.text }}</div>
              <div class="elina-penalty" v-if="elinaEvent.penalty">
                -{{ elinaEvent.penalty }}s fokus
              </div>
              <div class="elina-dismiss">klicka för att stänga</div>
            </div>
          </div>
        </transition>

        <!-- MINIGAME OVERLAY -->
        <transition name="fade-screen">
          <div v-if="minigame" class="minigame-overlay">
            <div class="minigame-panel" :class="minigame.type">

              <!-- STEK MINIGAME -->
              <template v-if="minigame.type === 'pan'">
                <div class="mg-title">Stek rätt!</div>
                <div class="mg-desc">Stoppa i den gröna zonen</div>
                <div class="mg-pan-display">
                  <div class="mg-food-icon">{{ panIngredient?.emoji }}</div>
                </div>
                <div class="timing-bar">
                  <div class="timing-zone good"></div>
                  <div class="timing-zone great"></div>
                  <div class="timing-zone good"></div>
                  <div class="timing-zone bad left"></div>
                  <div class="timing-zone bad right"></div>
                  <div class="timing-cursor" :style="{ left: timingCursor + '%' }"></div>
                </div>
                <button class="mg-btn" @click="timingHit">STEK!</button>
              </template>

              <!-- MIKRA MINIGAME -->
              <template v-if="minigame.type === 'micro'">
                <div class="mg-title">Rätt tid!</div>
                <div class="mg-desc">Välj exakt antal sekunder</div>
                <div class="mg-time-display">{{ microSeconds }}s</div>
                <div class="mg-time-dial">
                  <input type="range" min="10" max="120" step="5" v-model="microSeconds" class="time-slider" />
                  <div class="time-marks">
                    <span v-for="n in [10,30,60,90,120]" :key="n" :style="{ left: ((n-10)/110*100) + '%' }">{{ n }}</span>
                  </div>
                </div>
                <div class="mg-hint">Rätt tid: {{ minigame.correctTime }}s ± 10s</div>
                <button class="mg-btn" @click="confirmMicro">STARTA</button>
              </template>

              <!-- HÄLL MINIGAME -->
              <template v-if="minigame.type === 'drink'">
                <div class="mg-title">Häll utan spill!</div>
                <div class="mg-desc">Håll musknappen precis rätt länge</div>
                <div class="mg-glass-preview">
                  <div class="mgp-glass">
                    <div class="mgp-fill" :style="{ height: pourProgress + '%', background: drinkColor }"></div>
                    <div class="mgp-zone good-zone"></div>
                    <div class="mgp-zone danger-zone"></div>
                  </div>
                </div>
                <div class="mg-pour-hint">Stoppa i den blå zonen (65-80%)</div>
                <button class="mg-btn pour-hold"
                  @mousedown="startPour" @mouseup="stopPour"
                  @touchstart.prevent="startPour" @touchend.prevent="stopPour">
                  HÅLL FÖR ATT HÄLLA
                </button>
              </template>

            </div>
          </div>
        </transition>

        <!-- FAIL STATE OVERLAY -->
        <transition name="fail-flash">
          <div v-if="failMsg" class="fail-overlay">
            <div class="fail-text">{{ failMsg }}</div>
          </div>
        </transition>

        <!-- TOAST NOTIFICATION -->
        <transition name="toast-pop">
          <div v-if="toast.show" class="game-toast" :class="toast.type">{{ toast.msg }}</div>
        </transition>

      </div>
    </transition>

    <!-- WIN SCREEN -->
    <transition name="fade-screen">
      <div v-if="phase === 'win'" class="screen end-screen win-screen">
        <div class="end-plate">
          <div class="end-plate-disc">
            <span v-for="item in platedItems" :key="item.id" class="end-plate-food">{{ item.emoji }}</span>
          </div>
        </div>
        <div class="end-content">
          <div class="end-tag">KLART!</div>
          <h2 class="end-title">{{ currentRecipe?.name }} serveras!</h2>
          <div class="richard-verdict">
            <div class="richard-big-face">
              <div class="rb-eyes"><span></span><span></span></div>
              <div class="rb-mouth happy"></div>
            </div>
            <div class="verdict-text">"{{ winComment }}"</div>
          </div>
          <div class="end-score">Poäng: <strong>{{ score }}</strong></div>
          <button class="btn-start" @click="resetGame">Ny omgång</button>
        </div>
      </div>
    </transition>

    <!-- GAMEOVER SCREEN -->
    <transition name="fade-screen">
      <div v-if="phase === 'gameover'" class="screen end-screen over-screen">
        <div class="end-content">
          <div class="end-tag fail">MISSLYCKAT</div>
          <h2 class="end-title">{{ gameoverReason }}</h2>
          <div class="richard-verdict">
            <div class="richard-big-face">
              <div class="rb-eyes"><span></span><span></span></div>
              <div class="rb-mouth sad"></div>
            </div>
            <div class="verdict-text">"{{ failComment }}"</div>
          </div>
          <button class="btn-start" @click="resetGame">Försök igen</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'

const phase = ref('intro')
const bgCanvas = ref(null)

/* ── RECIPES ── */
const recipes = [
  {
    id: 'toast',
    name: 'Smörgåstoast med ägg',
    needs: [
      { id: 'bread', name: 'Bröd', emoji: '🍞' },
      { id: 'egg', name: 'Ägg', emoji: '🥚' },
      { id: 'butter', name: 'Smör', emoji: '🧈' },
    ],
    cookMethod: 'pan',
    drinkNeeded: true,
  },
  {
    id: 'pasta',
    name: 'Snabbpasta',
    needs: [
      { id: 'pasta', name: 'Pasta', emoji: '🍝' },
      { id: 'sauce', name: 'Sås', emoji: '🫙' },
      { id: 'cheese', name: 'Ost', emoji: '🧀' },
    ],
    cookMethod: 'micro',
    drinkNeeded: true,
  },
  {
    id: 'sandwich',
    name: 'Nattsmörgås',
    needs: [
      { id: 'bread', name: 'Bröd', emoji: '🍞' },
      { id: 'ham', name: 'Skinka', emoji: '🥩' },
      { id: 'cheese', name: 'Ost', emoji: '🧀' },
    ],
    cookMethod: null,
    drinkNeeded: true,
  },
]

const allIngredients = [
  { id: 'bread', name: 'Bröd', emoji: '🍞', color: '#d4a054', expires: false },
  { id: 'egg', name: 'Ägg', emoji: '🥚', color: '#f0e0b0', expires: false },
  { id: 'butter', name: 'Smör', emoji: '🧈', color: '#f7d060', expires: false },
  { id: 'pasta', name: 'Pasta', emoji: '🍝', color: '#e8c87a', expires: false },
  { id: 'sauce', name: 'Sås', emoji: '🫙', color: '#c04040', expires: false },
  { id: 'cheese', name: 'Ost', emoji: '🧀', color: '#f0b830', expires: false },
  { id: 'ham', name: 'Skinka', emoji: '🥩', color: '#d06070', expires: false },
  { id: 'old_milk', name: 'Gammal mjölk', emoji: '🥛', color: '#c8c0b0', expires: true },
  { id: 'old_leftovers', name: 'Gamla rester', emoji: '🍱', color: '#7a8a6a', expires: true },
  { id: 'mystery', name: 'Mystisk burk', emoji: '🧪', color: '#708090', expires: true },
  { id: 'wilted', name: 'Slokig sallad', emoji: '🥗', color: '#6a8060', expires: true },
]

const currentRecipe = ref(null)
const fridgeShelves = ref([])
const fridgeOpen = ref(false)
const selectedIngredient = ref(null)
const collectedIngredients = ref([])
const boardIngredient = ref(null)
const panIngredient = ref(null)
const panState = ref('empty') // empty cooking burning done
const panHeat = ref(0)
const microIngredient = ref(null)
const microState = ref('empty') // empty running done exploded
const microRunning = ref(false)
const microProgress = ref(0)
const microDisplay = ref('00:00')
const microSeconds = ref(30)
const drinkLevel = ref(0)
const drinkState = ref('empty') // empty pouring done overflow
const drinkColor = '#4090d0'
const pourProgress = ref(0)
const platedItems = ref([])
const plateComplete = ref(false)
const activeZone = ref(null)
const timer = ref(120)
const score = ref(0)
const phase_ = ref('game')

/* ── COMMENTS ── */
const richardComment = ref('')
const richardCommentType = ref('neutral')
const elinaEvent = ref(null)
const failMsg = ref('')
const toast = reactive({ show: false, msg: '', type: '' })
const minigame = ref(null)
const winComment = ref('')
const failComment = ref('')
const gameoverReason = ref('')

/* ── TIMING MINIGAME ── */
const timingCursor = ref(0)
let timingDir = 1
let timingInterval = null

/* ── MICRO MINIGAME ── */
let microInterval = null

/* ── DRINK MINIGAME ── */
let pourInterval = null
let pouring = ref(false)

/* ── TIMERS ── */
let gameTimer = null
let richardTimer = null
let elinaTimer = null
let heatInterval = null

const formattedTimer = computed(() => {
  const m = Math.floor(timer.value / 60).toString().padStart(2,'0')
  const s = (timer.value % 60).toString().padStart(2,'0')
  return `${m}:${s}`
})

const kitchenPerspective = computed(() => ({
  transform: `perspective(900px) rotateX(6deg) rotateY(0deg)`
}))

function hasIngredient(id) {
  return collectedIngredients.value.some(i => i.id === id)
}

function platePosStyle(i) {
  const positions = [
    { top: '30%', left: '30%' }, { top: '30%', left: '55%' },
    { top: '55%', left: '40%' }, { top: '20%', left: '42%' }
  ]
  return positions[i] || { top: '40%', left: '40%' }
}

const richardComments = {
  neutral: [
    "det där räcker inte.",
    "vi äter ju om tre timmar ändå?",
    "är det verkligen rätt recept?",
    "lugna ner dig lite.",
    "du missar något.",
  ],
  bad: [
    "nu smakar det ledsenhet.",
    "det här är katastrofalt.",
    "varför är det svart?",
    "jag ville ha mat, inte kol.",
    "är du säker på att du kan laga mat?",
  ],
  good: [
    "okej, det ser faktiskt okej ut.",
    "hm. bättre än jag trodde.",
    "fortsätt så.",
    "acceptable.",
  ]
}

const elinaEvents = [
  { text: "Titta på den här TikToken! Det är en hund som dansar!", penalty: 5 },
  { text: "Vad händer om man äter hela en citron? Ska vi testa?", penalty: 3 },
  { text: "Kan vi måla om köket imorgon? Jag tänkte turkost.", penalty: 4 },
  { text: "LYSSNA på den här låten, bara tre minuter.", penalty: 8 },
  { text: "Är du kär i mig? Svar nu.", penalty: 5 },
  { text: "Jag hittade ett recept på trelagerstårta. Vi gör det ikväll?", penalty: 6 },
  { text: "Doris skickade ett foto! Hon är SÅ söt!", penalty: 3 },
  { text: "Vad ska vi göra nästa sommar? Tänk snabbt.", penalty: 5 },
  { text: "Kan du lyssna på min ide om ett företag? Det tar tio sekunder.", penalty: 7 },
  { text: "Jag kan inte hitta min telefon. Hjälp mig ringa den.", penalty: 4 },
]

const failStates = [
  "nu smakar det ledsenhet.",
  "kylskåpet vann.",
  "Richard sa inget. Det är värre.",
  "nästa gång kanske.",
  "maten gick bort att titta på.",
]

function buildFridge() {
  const recipe = currentRecipe.value
  const needed = recipe.needs.map(n => {
    const base = allIngredients.find(a => a.id === n.id)
    return { ...base, shelf: Math.floor(Math.random() * 3), used: false }
  })
  const decoys = allIngredients
    .filter(a => a.expires || !recipe.needs.find(n => n.id === a.id))
    .sort(() => Math.random() - 0.5)
    .slice(0, 5)
    .map(a => ({ ...a, used: false }))

  const all = [...needed, ...decoys].sort(() => Math.random() - 0.5)
  const shelves = [[], [], []]
  all.forEach((item, i) => { shelves[i % 3].push({ ...item, id: item.id + '_' + i }) })
  fridgeShelves.value = shelves
}

function startGame() {
  const r = recipes[Math.floor(Math.random() * recipes.length)]
  currentRecipe.value = r
  collectedIngredients.value = []
  platedItems.value = []
  plateComplete.value = false
  panState.value = 'empty'
  panHeat.value = 0
  panIngredient.value = null
  microState.value = 'empty'
  microIngredient.value = null
  microRunning.value = false
  microProgress.value = 0
  drinkLevel.value = 0
  drinkState.value = 'empty'
  pourProgress.value = 0
  boardIngredient.value = null
  score.value = 0
  timer.value = 120
  fridgeOpen.value = false
  selectedIngredient.value = null
  richardComment.value = ''
  elinaEvent.value = null
  failMsg.value = ''
  minigame.value = null
  phase.value = 'game'
  buildFridge()
  startTimers()
  drawBg()
}

function startTimers() {
  gameTimer = setInterval(() => {
    if (phase.value !== 'game') return
    timer.value--
    if (timer.value <= 0) {
      endGame(false, 'Tiden tog slut', failStates[Math.floor(Math.random() * failStates.length)])
    }
  }, 1000)

  richardTimer = setInterval(() => {
    if (phase.value !== 'game' || minigame.value) return
    const type = Math.random() < 0.3 ? 'bad' : Math.random() < 0.6 ? 'neutral' : 'good'
    const pool = richardComments[type]
    richardComment.value = pool[Math.floor(Math.random() * pool.length)]
    richardCommentType.value = type
    setTimeout(() => { richardComment.value = '' }, 3500)
  }, 5000)

  elinaTimer = setInterval(() => {
    if (phase.value !== 'game' || elinaEvent.value || minigame.value) return
    if (Math.random() < 0.6) {
      const ev = elinaEvents[Math.floor(Math.random() * elinaEvents.length)]
      elinaEvent.value = ev
      timer.value = Math.max(5, timer.value - (ev.penalty || 0))
    }
  }, 6000)
}

function clearTimers() {
  clearInterval(gameTimer)
  clearInterval(richardTimer)
  clearInterval(elinaTimer)
  clearInterval(heatInterval)
  clearInterval(timingInterval)
  clearInterval(microInterval)
  clearInterval(pourInterval)
}

function toggleFridge() {
  fridgeOpen.value = !fridgeOpen.value
}

function selectIngredient(item) {
  if (item.used) return
  if (item.expired) {
    showFail('UTGÅNGET! ' + failStates[Math.floor(Math.random() * failStates.length)])
    score.value = Math.max(0, score.value - 10)
    item.used = true
    return
  }
  selectedIngredient.value = item
  showToast('Vald: ' + item.name, 'info')
  item.used = true
  boardIngredient.value = item
  fridgeOpen.value = false
  collectedIngredients.value.push(item)
  checkRecipeProgress()
}

function clickZone(zone) {
  activeZone.value = zone
  setTimeout(() => { activeZone.value = null }, 600)

  if (zone === 'pan') {
    if (!boardIngredient.value && !panIngredient.value) {
      showToast('Välj en ingrediens från kylskåpet först', 'warn')
      return
    }
    if (panState.value === 'empty' && boardIngredient.value) {
      panIngredient.value = boardIngredient.value
      boardIngredient.value = null
      panState.value = 'raw'
      openMinigame('pan')
    } else if (panState.value === 'done') {
      platedItems.value.push(panIngredient.value)
      panIngredient.value = null
      panState.value = 'empty'
      panHeat.value = 0
      score.value += 20
      showToast('Stekt och klart!', 'success')
      checkWin()
    } else if (panState.value === 'burning') {
      showFail(failStates[Math.floor(Math.random() * failStates.length)])
      panIngredient.value = null
      panState.value = 'empty'
      panHeat.value = 0
      score.value = Math.max(0, score.value - 15)
    }
  }

  if (zone === 'micro') {
    if (!boardIngredient.value && !microIngredient.value) {
      showToast('Välj en ingrediens från kylskåpet först', 'warn')
      return
    }
    if (microState.value === 'empty' && boardIngredient.value) {
      microIngredient.value = boardIngredient.value
      boardIngredient.value = null
      openMinigame('micro')
    } else if (microState.value === 'done') {
      platedItems.value.push(microIngredient.value)
      microIngredient.value = null
      microState.value = 'empty'
      microProgress.value = 0
      score.value += 20
      showToast('Mikrat perfekt!', 'success')
      checkWin()
    } else if (microState.value === 'exploded') {
      showFail('Smäll! ' + failStates[1])
      microIngredient.value = null
      microState.value = 'empty'
      microProgress.value = 0
      score.value = Math.max(0, score.value - 20)
    }
  }

  if (zone === 'drink') {
    if (drinkState.value === 'empty') openMinigame('drink')
    else if (drinkState.value === 'done') {
      score.value += 15
      showToast('Perfekt häll!', 'success')
      checkWin()
    } else if (drinkState.value === 'overflow') {
      showFail('Spill! ' + failStates[0])
      drinkState.value = 'empty'
      drinkLevel.value = 0
      pourProgress.value = 0
      score.value = Math.max(0, score.value - 10)
    }
  }

  if (zone === 'plate') {
    if (boardIngredient.value) {
      const item = boardIngredient.value
      if (!item.expired) {
        platedItems.value.push(item)
        boardIngredient.value = null
        score.value += 10
        showToast(item.name + ' på tallriken!', 'success')
        checkWin()
      }
    }
  }

  if (zone === 'board') {
    if (!boardIngredient.value) {
      showToast('Öppna kylskåpet och välj en ingrediens', 'info')
    }
  }
}

function checkRecipeProgress() {
  const recipe = currentRecipe.value
  if (!recipe) return
  const needed = recipe.needs.map(n => n.id)
  const collected = collectedIngredients.value.map(i => i.id.split('_')[0])
  const allGot = needed.every(id => collected.includes(id))
  if (allGot) showToast('Alla ingredienser hittade!', 'success')
}

function checkWin() {
  const recipe = currentRecipe.value
  if (!recipe) return
  const needed = recipe.needs.length
  const onPlate = platedItems.value.length
  const drinkDone = !recipe.drinkNeeded || drinkState.value === 'done'
  if (onPlate >= needed && drinkDone) {
    setTimeout(() => {
      winComment.value = [
        "okej, det är faktiskt gott.",
        "bättre än jag förväntade mig.",
        "nästan perfekt. typ.",
        "det smakar faktiskt mat.",
      ][Math.floor(Math.random() * 4)]
      endGame(true)
    }, 500)
  }
}

function endGame(won, reason = '', fail = '') {
  clearTimers()
  if (won) { phase.value = 'win' }
  else {
    gameoverReason.value = reason
    failComment.value = fail || failStates[Math.floor(Math.random() * failStates.length)]
    phase.value = 'gameover'
  }
}

function resetGame() { phase.value = 'intro'; clearTimers() }

/* ── MINIGAMES ── */
function openMinigame(type) {
  minigame.value = { type, correctTime: type === 'micro' ? (Math.floor(Math.random() * 5) + 3) * 10 : null }
  if (type === 'pan') startTimingCursor()
  if (type === 'drink') { pourProgress.value = 0; drinkLevel.value = 0 }
}

function startTimingCursor() {
  timingCursor.value = 0
  timingDir = 1
  timingInterval = setInterval(() => {
    timingCursor.value += timingDir * 1.8
    if (timingCursor.value >= 100) timingDir = -1
    if (timingCursor.value <= 0) timingDir = 1
  }, 20)
}

function timingHit() {
  clearInterval(timingInterval)
  const pos = timingCursor.value
  let result = ''
  if (pos >= 35 && pos <= 65) {
    result = 'perfect'
    score.value += 25
    panState.value = 'done'
    showToast('PERFEKT STEK!', 'success')
  } else if ((pos >= 20 && pos <= 35) || (pos >= 65 && pos <= 80)) {
    result = 'good'
    score.value += 15
    panState.value = 'done'
    showToast('Bra stek!', 'success')
  } else {
    result = 'bad'
    panState.value = 'burning'
    showFail(failStates[Math.floor(Math.random() * failStates.length)])
  }
  minigame.value = null
}

function confirmMicro() {
  const correct = minigame.value.correctTime
  const diff = Math.abs(microSeconds.value - correct)
  minigame.value = null
  microRunning.value = true
  microState.value = 'running'
  microProgress.value = 0

  const total = microSeconds.value
  let elapsed = 0
  microInterval = setInterval(() => {
    elapsed += 0.1
    microProgress.value = (elapsed / total) * 100
    const sLeft = Math.max(0, total - Math.round(elapsed))
    microDisplay.value = `00:${sLeft.toString().padStart(2,'0')}`
    if (elapsed >= total) {
      clearInterval(microInterval)
      microRunning.value = false
      if (diff <= 10) {
        microState.value = 'done'
        score.value += 20
        showToast('Perfekt tid!', 'success')
      } else if (diff <= 25) {
        microState.value = 'done'
        score.value += 8
        showToast('Godkänt...', 'info')
      } else {
        microState.value = 'exploded'
        showFail('SMÄLL! ' + failStates[1])
        score.value = Math.max(0, score.value - 15)
      }
    }
  }, 100)
}

function startPour() {
  if (pourInterval) return
  pourInterval = setInterval(() => {
    pourProgress.value = Math.min(100, pourProgress.value + 1.2)
    drinkLevel.value = pourProgress.value
    drinkState.value = 'pouring'
    if (pourProgress.value >= 100) { stopPour(); drinkState.value = 'overflow' }
  }, 50)
}

function stopPour() {
  clearInterval(pourInterval)
  pourInterval = null
  if (drinkState.value === 'pouring') {
    if (pourProgress.value >= 65 && pourProgress.value <= 80) {
      drinkState.value = 'done'
      score.value += 15
      showToast('Perfekt häll!', 'success')
      minigame.value = null
    } else if (pourProgress.value < 65) {
      showToast('För lite — försök igen', 'warn')
      pourProgress.value = 0
      drinkLevel.value = 0
      drinkState.value = 'empty'
    } else {
      drinkState.value = 'overflow'
      showFail(failStates[0])
    }
  }
}

function dismissElina() { elinaEvent.value = null }

function showToast(msg, type = 'info') {
  toast.msg = msg; toast.type = type; toast.show = true
  setTimeout(() => { toast.show = false }, 2200)
}

function showFail(msg) {
  failMsg.value = msg
  setTimeout(() => { failMsg.value = '' }, 2000)
}

/* ── BG CANVAS ── */
function drawBg() {
  const c = bgCanvas.value
  if (!c) return
  c.width = window.innerWidth
  c.height = window.innerHeight
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#0a0c14'
  ctx.fillRect(0, 0, c.width, c.height)
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * c.width
    const y = Math.random() * c.height * 0.5
    const r = Math.random() * 1.5 + 0.3
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,240,${Math.random() * 0.6 + 0.1})`
    ctx.fill()
  }
}

onMounted(() => { drawBg(); window.addEventListener('resize', drawBg) })
onBeforeUnmount(() => { clearTimers(); window.removeEventListener('resize', drawBg) })
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;700&family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@400;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

#app {
  --bg: #0a0c14;
  --bg2: #111420;
  --bg3: #181c2e;
  --surface: #1e2235;
  --surface2: #252a40;
  --border: rgba(255,255,255,0.07);
  --border2: rgba(255,255,255,0.14);
  --text: #e8eaf2;
  --text2: rgba(232,234,242,0.55);
  --accent: #7c9eff;
  --accent2: #ff7c9e;
  --green: #50d090;
  --orange: #ff9944;
  --red: #ff4466;
  --yellow: #ffd060;
  width: 100vw; height: 100vh; overflow: hidden;
  background: var(--bg); color: var(--text);
  font-family: 'Space Grotesk', sans-serif;
  position: relative;
}

.bg-canvas { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.screen { position: absolute; inset: 0; z-index: 10; }

/* ─── INTRO ─── */
.intro-screen {
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(160deg, #0a0c14 0%, #12141e 50%, #0e1018 100%);
}
.kitchen-silhouette {
  position: absolute; bottom: 0; left: 0; right: 0; height: 35%;
  background: linear-gradient(180deg, transparent, #050608);
  pointer-events: none;
}
.intro-inner {
  display: flex; flex-direction: column; align-items: center; gap: 28px;
  text-align: center; max-width: 560px; padding: 0 24px; position: relative; z-index: 2;
}
.game-badge {
  font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 4px;
  color: var(--accent); border: 1px solid rgba(124,158,255,0.3);
  padding: 6px 20px; border-radius: 20px; text-transform: uppercase;
}
.game-title {
  font-family: 'Syne', sans-serif; font-size: 74px; font-weight: 800; line-height: 0.95;
  color: var(--text); letter-spacing: -2px;
}
.game-title em { color: var(--accent2); font-style: normal; }
.game-desc { font-size: 15px; color: var(--text2); line-height: 1.7; }
.rules-grid { display: flex; gap: 12px; width: 100%; }
.rule-card {
  flex: 1; padding: 14px 12px; background: var(--surface);
  border: 1px solid var(--border2); border-radius: 10px;
  display: flex; flex-direction: column; gap: 8px; font-size: 13px;
}
.rule-num { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--accent); }
.btn-start {
  padding: 16px 48px; background: var(--accent); border: none; border-radius: 40px;
  color: #0a0c14; font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700;
  cursor: pointer; transition: all .2s; letter-spacing: 0.5px;
}
.btn-start:hover { transform: scale(1.04); filter: brightness(1.1); }

/* ─── HUD ─── */
.hud-top {
  position: fixed; top: 0; left: 0; right: 0; z-index: 300;
  display: flex; align-items: center; gap: 20px; padding: 14px 24px;
  background: rgba(10,12,20,0.88); border-bottom: 1px solid var(--border);
}
.hud-timer {
  font-family: 'JetBrains Mono', monospace; font-size: 24px; color: var(--text);
  display: flex; align-items: center; gap: 8px; min-width: 100px;
}
.hud-timer.urgent { color: var(--red); animation: tick .5s infinite; }
@keyframes tick { 0%,100%{opacity:1;} 50%{opacity:0.5;} }
.hud-recipe { flex: 1; display: flex; align-items: center; gap: 14px; }
.recipe-label { font-size: 11px; color: var(--text2); letter-spacing: 2px; font-family: 'JetBrains Mono', monospace; }
.recipe-name { font-weight: 700; font-size: 15px; }
.recipe-needs { display: flex; gap: 8px; }
.need {
  display: flex; align-items: center; gap: 5px; padding: 4px 10px;
  border: 1px solid var(--border2); border-radius: 6px; font-size: 12px;
  background: var(--surface); transition: all .3s; opacity: 0.5;
}
.need.got { border-color: var(--green); color: var(--green); opacity: 1; background: rgba(80,208,144,0.08); }
.hud-score { font-family: 'JetBrains Mono', monospace; text-align: right; }
.score-label { font-size: 10px; color: var(--text2); display: block; letter-spacing: 2px; }
.score-val { font-size: 26px; font-weight: 700; color: var(--yellow); }

/* ─── 3D KITCHEN ─── */
.game-screen { overflow: hidden; }
.kitchen-scene {
  position: absolute; inset: 0; top: 60px;
  transform-style: preserve-3d;
  display: flex; align-items: flex-end; justify-content: center;
  padding-bottom: 100px;
}
.wall {
  position: absolute;
}
.back-wall {
  inset: 0; bottom: 30%;
  background: linear-gradient(180deg, #0e1020 0%, #141828 100%);
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.floor-plane {
  position: absolute; bottom: 0; left: 0; right: 0; height: 32%;
  background: linear-gradient(180deg, #12141e 0%, #0a0c14 100%);
  border-top: 2px solid rgba(255,255,255,0.05);
}

/* ─── COUNTER ─── */
.counter-3d {
  position: absolute; bottom: 18%; left: 50%; transform: translateX(-50%);
  width: 75%; min-width: 560px;
  transform-style: preserve-3d;
}
.counter-top {
  display: flex; gap: 16px; align-items: flex-end; padding: 16px 20px;
  background: linear-gradient(180deg, #2a2c3e, #22243a);
  border: 1px solid var(--border2); border-radius: 6px 6px 0 0;
  box-shadow: 0 0 40px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06);
  position: relative;
}
.counter-front {
  height: 22px;
  background: linear-gradient(180deg, #1e2032, #16182a);
  border: 1px solid var(--border); border-top: none; border-radius: 0 0 4px 4px;
}

/* ─── ZONE COMMON ─── */
.zone-label {
  position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%);
  font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 2px;
  color: var(--accent); white-space: nowrap; opacity: 0; transition: opacity .2s;
  pointer-events: none;
}
.cutting-board:hover .zone-label,
.pan-wrapper:hover .zone-label,
.microwave-3d:hover .zone-label,
.drink-station:hover .zone-label,
.plate-area:hover .zone-label,
.fridge-3d:hover .zone-label { opacity: 1; }

/* ─── CUTTING BOARD ─── */
.cutting-board {
  width: 130px; height: 80px; background: linear-gradient(135deg, #8b6a3e, #6a5030);
  border-radius: 6px; border: 2px solid rgba(255,255,255,0.06);
  cursor: pointer; position: relative; transition: all .2s; flex-shrink: 0;
}
.cutting-board.active { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.6); }
.cutting-board:hover { transform: translateY(-2px); }
.cb-lines { position: absolute; inset: 10px; display: flex; flex-direction: column; justify-content: space-between; pointer-events: none; }
.cb-lines span { height: 1px; background: rgba(255,255,255,0.07); border-radius: 1px; }
.ingredient-on-board { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
.ingredient-3d {
  width: 50px; height: 50px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 26px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.12);
}

/* ─── PAN ─── */
.pan-wrapper {
  position: relative; width: 120px; cursor: pointer; flex-shrink: 0;
}
.pan-3d { position: relative; }
.pan-body {
  width: 110px; height: 110px; background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
  border-radius: 50%; border: 3px solid #333; position: relative;
  box-shadow: 0 0 0 1px rgba(255,255,255,0.05), inset 0 2px 4px rgba(255,255,255,0.04);
  overflow: hidden; transition: all .3s;
}
.pan-wrapper.burning .pan-body { border-color: var(--red); box-shadow: 0 0 20px rgba(255,68,102,0.5); }
.pan-wrapper.done .pan-body { border-color: var(--green); }
.pan-fill {
  position: absolute; inset: 8px; border-radius: 50%;
  background: radial-gradient(circle, #3a2820, #2a1810); transition: opacity .4s;
  display: flex; align-items: center; justify-content: center;
}
.pan-ingredient { font-size: 32px; }
.pan-handle {
  width: 50px; height: 8px; background: linear-gradient(90deg, #3a2a1a, #2a1e10);
  position: absolute; left: calc(100% - 5px); top: 50%; transform: translateY(-50%);
  border-radius: 0 4px 4px 0; border: 1px solid rgba(255,255,255,0.05);
}
.steam { position: absolute; top: -20px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; }
.steam span {
  width: 3px; height: 20px; background: linear-gradient(180deg, transparent, rgba(255,255,255,0.3));
  border-radius: 2px; animation: steam-rise 1.5s ease-out infinite;
}
@keyframes steam-rise { 0%{opacity:0;transform:translateY(0);} 50%{opacity:.6;} 100%{opacity:0;transform:translateY(-20px);} }
.burn-smoke span {
  width: 6px; height: 30px;
  background: linear-gradient(180deg, transparent, rgba(60,40,20,0.7));
  border-radius: 3px; animation: steam-rise .8s ease-out infinite;
}
.heat-indicator {
  height: 4px; background: var(--surface); border-radius: 2px; margin-top: 6px; overflow: hidden;
}
.heat-bar { height: 100%; border-radius: 2px; transition: width .3s, background .3s; }

/* ─── MICROWAVE ─── */
.microwave-3d {
  flex-shrink: 0; cursor: pointer; position: relative; transition: all .2s;
}
.microwave-3d:hover { transform: translateY(-2px); }
.microwave-3d.active { transform: translateY(-3px); }
.micro-body {
  display: flex; gap: 0;
  background: linear-gradient(135deg, #2a2c3e, #1e2030);
  border: 1px solid var(--border2); border-radius: 6px; overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.6);
}
.micro-door { width: 110px; height: 80px; background: #0d0e18; border-right: 1px solid var(--border); position: relative; }
.micro-window {
  position: absolute; inset: 8px; border-radius: 4px;
  background: radial-gradient(circle, #0a1020, #060810);
  border: 1px solid rgba(255,255,255,0.06); overflow: hidden;
  display: flex; align-items: center; justify-content: center;
}
.micro-plate {
  width: 52px; height: 52px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.06);
  display: flex; align-items: center; justify-content: center;
  transition: all .3s;
}
.micro-plate.spinning { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.micro-food { font-size: 26px; }
.micro-sparks span {
  position: absolute; width: 3px; height: 10px;
  background: var(--yellow); border-radius: 1px;
  animation: spark .2s infinite alternate;
  transform-origin: center bottom;
}
.micro-sparks span:nth-child(1){top:20%;left:30%;animation-delay:.05s;}
.micro-sparks span:nth-child(2){top:40%;left:60%;animation-delay:.1s;}
.micro-sparks span:nth-child(3){top:60%;left:25%;animation-delay:.02s;}
.micro-sparks span:nth-child(4){top:30%;left:55%;animation-delay:.08s;}
.micro-sparks span:nth-child(5){top:55%;left:50%;animation-delay:.14s;}
.micro-sparks span:nth-child(6){top:15%;left:45%;animation-delay:.06s;}
@keyframes spark { to { transform: rotate(45deg) scale(1.4); opacity: .3; } }
.micro-panel { width: 80px; padding: 8px 10px; display: flex; flex-direction: column; gap: 8px; }
.micro-display {
  font-family: 'JetBrains Mono', monospace; font-size: 14px; color: var(--green);
  background: #060810; border: 1px solid rgba(80,208,144,0.2);
  padding: 4px 6px; border-radius: 3px; text-align: center;
}
.micro-buttons { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 3px; }
.mbtn { height: 10px; background: var(--surface2); border-radius: 2px; }
.micro-timer-bar {
  height: 3px; background: var(--surface); border-radius: 2px; margin-top: 4px; overflow: hidden;
}
.micro-timer-bar div { height: 100%; background: var(--accent); border-radius: 2px; transition: width .1s; }
.microwave-3d.running .micro-body { box-shadow: 0 0 15px rgba(124,158,255,0.2); }
.microwave-3d.done .micro-body { border-color: rgba(80,208,144,0.4); box-shadow: 0 0 12px rgba(80,208,144,0.2); }
.microwave-3d.exploded .micro-body { border-color: rgba(255,68,102,0.6); box-shadow: 0 0 20px rgba(255,68,102,0.4); }

/* ─── DRINK STATION ─── */
.drink-station {
  width: 70px; cursor: pointer; position: relative; flex-shrink: 0;
  display: flex; flex-direction: column; align-items: center;
}
.glass-3d { width: 44px; }
.glass-body {
  height: 70px; width: 44px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.12);
  clip-path: polygon(8% 0%, 92% 0%, 84% 100%, 16% 100%);
  overflow: hidden; position: relative;
}
.drink-fill {
  position: absolute; bottom: 0; left: 0; right: 0;
  transition: height .15s; border-radius: 0 0 2px 2px;
}
.drink-surface { height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; }
.overflow-drips span {
  position: absolute; bottom: -10px; width: 4px; height: 12px;
  background: var(--accent); border-radius: 2px; animation: drip .6s ease-in infinite;
}
.overflow-drips span:nth-child(1){left:10%;animation-delay:.1s;}
.overflow-drips span:nth-child(2){left:30%;animation-delay:.2s;}
.overflow-drips span:nth-child(3){right:10%;animation-delay:.05s;}
.overflow-drips span:nth-child(4){right:30%;animation-delay:.3s;}
@keyframes drip { 0%{transform:translateY(0);opacity:1;} 100%{transform:translateY(12px);opacity:0;} }
.glass-3d.overflowing .glass-body { border-color: rgba(255,68,102,0.6); box-shadow: 0 0 12px rgba(255,68,102,0.3); }
.pour-bar {
  height: 3px; background: var(--surface2); border-radius: 2px; margin-top: 4px; width: 44px; overflow: hidden;
}
.pour-bar div { height: 100%; background: var(--accent); transition: width .1s; }

/* ─── PLATE ─── */
.plate-area {
  position: absolute; bottom: 22%; right: 5%;
  width: 110px; display: flex; flex-direction: column; align-items: center;
  cursor: pointer; transition: all .2s;
}
.plate-area:hover { transform: translateY(-3px); }
.plate-area.active { transform: translateY(-5px); }
.plate-shadow {
  width: 100px; height: 14px; background: rgba(0,0,0,0.5);
  border-radius: 50%; filter: blur(4px); margin-bottom: -8px;
}
.plate-3d {
  width: 100px; height: 100px; border-radius: 50%;
  background: radial-gradient(circle, #f8f4ee, #e8e0d8);
  border: 3px solid rgba(255,255,255,0.1);
  box-shadow: 0 0 0 2px rgba(0,0,0,0.2), inset 0 4px 8px rgba(0,0,0,0.1);
  display: flex; align-items: center; justify-content: center; position: relative;
  overflow: hidden;
}
.plate-area.complete .plate-3d { box-shadow: 0 0 20px rgba(80,208,144,0.4), 0 0 0 2px rgba(80,208,144,0.3); }
.plate-food { position: relative; width: 80px; height: 80px; }
.plated-item { position: absolute; font-size: 22px; transition: all .3s; }

/* ─── FRIDGE ─── */
.fridge-3d {
  position: absolute; left: 4%; bottom: 14%; height: 260px; width: 100px;
  cursor: pointer; transform-style: preserve-3d; transition: all .2s; z-index: 30;
}
.fridge-3d:hover { transform: translateX(2px); }
.fridge-body {
  width: 100%; height: 100%; background: linear-gradient(135deg, #2a2c40, #1e2038);
  border: 1px solid var(--border2); border-radius: 6px; position: relative; overflow: hidden;
}
.fridge-door {
  position: absolute; inset: 0; background: linear-gradient(135deg, #2c2e44, #1e2038);
  border-radius: 6px; transition: all .4s; transform-origin: left center;
}
.fridge-door.ajar { transform: perspective(400px) rotateY(-50deg); }
.fridge-handle {
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  width: 6px; height: 50px; background: rgba(255,255,255,0.1);
  border-radius: 3px; border: 1px solid rgba(255,255,255,0.06);
}
.fridge-logo { position: absolute; top: 20px; left: 50%; transform: translateX(-50%); font-size: 22px; opacity: 0.3; }
.fridge-glow { position: absolute; inset: 0; background: rgba(200,230,255,0.04); border-radius: 6px; }
.fridge-interior {
  position: absolute; inset: 0; background: linear-gradient(135deg, #0e1420 0%, #0a1018 100%);
  border-radius: 6px; display: flex; flex-direction: column; gap: 4px; padding: 8px;
  border: 1px solid rgba(100,160,220,0.15);
}
.fridge-shelf {
  flex: 1; display: flex; gap: 4px; align-items: flex-end;
  border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 4px;
}
.fridge-item { position: relative; cursor: pointer; transition: all .2s; }
.fridge-item:hover { transform: translateY(-2px); }
.fridge-item.selected .item-face { box-shadow: 0 0 0 2px var(--accent); }
.fridge-item.used { opacity: 0.3; pointer-events: none; }
.fridge-item.expired .item-face { filter: saturate(0.3) brightness(0.7); }
.item-3d { position: relative; }
.item-face {
  width: 26px; height: 26px; border-radius: 4px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px;
  font-size: 14px; transition: all .2s;
  border: 1px solid rgba(255,255,255,0.08);
}
.item-emoji { line-height: 1; }
.item-name { font-size: 5px; color: rgba(255,255,255,0.5); text-align: center; line-height: 1.2; }
.item-side {
  position: absolute; right: -3px; top: 2px; bottom: -2px; width: 5px;
  border-radius: 0 2px 2px 0; transform: skewY(-30deg);
}
.expired-tag {
  position: absolute; top: -8px; left: -2px; right: -2px;
  font-family: 'JetBrains Mono', monospace; font-size: 5px; color: var(--red);
  text-align: center; letter-spacing: 0.5px;
}
.fridge-shadow {
  position: absolute; bottom: -8px; left: 5px; right: 5px; height: 12px;
  background: rgba(0,0,0,0.6); border-radius: 50%; filter: blur(5px);
}

/* ─── RICHARD COMMENT ─── */
.richard-comment {
  position: fixed; bottom: 105px; left: 24px; z-index: 200;
  display: flex; align-items: flex-end; gap: 10px;
}
.richard-avatar {
  width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, #3a4060, #252840);
  border: 2px solid var(--border2); display: flex; align-items: center; justify-content: center;
}
.richard-face { width: 28px; height: 28px; position: relative; }
.r-eyes { display: flex; gap: 6px; justify-content: center; margin-bottom: 5px; }
.r-eyes span { width: 4px; height: 5px; border-radius: 50%; background: var(--text); }
.r-mouth { width: 12px; height: 5px; border-radius: 0 0 6px 6px; border-bottom: 2px solid rgba(255,255,255,0.4); margin: 0 auto; }
.r-mouth.bad { border-bottom: none; border-top: 2px solid rgba(255,68,102,0.6); border-radius: 6px 6px 0 0; }
.r-mouth.good { border-color: var(--green); }
.comment-bubble {
  background: var(--surface); border: 1px solid var(--border2); border-radius: 10px 10px 10px 0;
  padding: 10px 14px; max-width: 240px;
}
.comment-who { font-size: 10px; color: var(--text2); letter-spacing: 1.5px; font-family: 'JetBrains Mono', monospace; margin-bottom: 4px; }
.comment-text { font-size: 13px; line-height: 1.4; }
.richard-comment.bad .comment-bubble { border-color: rgba(255,68,102,0.3); }
.richard-comment.good .comment-bubble { border-color: rgba(80,208,144,0.3); }

/* ─── ELINA ─── */
.elina-distraction {
  position: fixed; top: 80px; right: 20px; z-index: 250;
  display: flex; align-items: flex-start; gap: 10px; cursor: pointer;
  animation: elina-bounce .4s cubic-bezier(.34,1.56,.64,1);
}
@keyframes elina-bounce { from{opacity:0;transform:translateY(-20px) scale(.9);} to{opacity:1;transform:none;} }
.elina-avatar {
  width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, #5a3860, #3a2444);
  border: 2px solid rgba(255,124,158,0.4); display: flex; align-items: center; justify-content: center;
}
.elina-face { width: 28px; height: 28px; position: relative; }
.e-eyes { display: flex; gap: 6px; justify-content: center; margin-bottom: 5px; }
.e-eyes span { width: 4px; height: 5px; border-radius: 50%; background: var(--accent2); }
.e-mouth { width: 14px; height: 6px; border-radius: 0 0 10px 10px; border-bottom: 2px solid var(--accent2); margin: 0 auto; }
.elina-bubble {
  background: var(--surface); border: 1px solid rgba(255,124,158,0.3);
  border-radius: 10px 10px 10px 0; padding: 10px 14px; max-width: 240px;
}
.elina-who { font-size: 10px; color: var(--accent2); letter-spacing: 1.5px; font-family: 'JetBrains Mono', monospace; margin-bottom: 4px; }
.elina-text { font-size: 13px; line-height: 1.4; margin-bottom: 6px; }
.elina-penalty { font-size: 11px; color: var(--red); font-family: 'JetBrains Mono', monospace; }
.elina-dismiss { font-size: 9px; color: var(--text2); letter-spacing: 1px; margin-top: 4px; }

/* ─── MINIGAME OVERLAY ─── */
.minigame-overlay {
  position: fixed; inset: 0; z-index: 400; background: rgba(5,6,12,0.85);
  display: flex; align-items: center; justify-content: center;
}
.minigame-panel {
  background: var(--surface); border: 1px solid var(--border2);
  border-radius: 16px; padding: 32px 40px; width: 380px; text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.8);
}
.minigame-panel.pan { border-color: rgba(255,153,68,0.3); }
.minigame-panel.micro { border-color: rgba(124,158,255,0.3); }
.minigame-panel.drink { border-color: rgba(64,144,208,0.3); }
.mg-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; margin-bottom: 6px; }
.mg-desc { font-size: 14px; color: var(--text2); margin-bottom: 24px; }
.mg-pan-display { font-size: 48px; margin-bottom: 20px; }
.mg-time-display { font-family: 'JetBrains Mono', monospace; font-size: 48px; color: var(--yellow); margin-bottom: 20px; font-weight: 700; }
.mg-hint { font-size: 12px; color: var(--text2); font-family: 'JetBrains Mono', monospace; margin-bottom: 20px; margin-top: -10px; }
.mg-btn {
  padding: 14px 40px; background: var(--accent); border: none; border-radius: 40px;
  color: #0a0c14; font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700;
  cursor: pointer; transition: all .2s; width: 100%; margin-top: 16px;
}
.mg-btn:hover { filter: brightness(1.1); transform: scale(1.02); }
.mg-btn.pour-hold { background: #4090d0; user-select: none; }
.mg-btn.pour-hold:active { transform: scale(0.98); filter: brightness(0.9); }

/* TIMING BAR */
.timing-bar {
  height: 44px; background: var(--bg3); border-radius: 22px;
  position: relative; overflow: hidden; border: 1px solid var(--border2); margin-bottom: 8px;
}
.timing-zone { position: absolute; top: 0; bottom: 0; }
.timing-zone.good { left: 20%; width: 15%; background: rgba(80,208,144,0.25); }
.timing-zone.great { left: 35%; width: 30%; background: rgba(80,208,144,0.45); }
.timing-zone.good:last-of-type { left: 65%; }
.timing-zone.bad.left { left: 0; width: 20%; background: rgba(255,68,102,0.2); }
.timing-zone.bad.right { right: 0; width: 20%; background: rgba(255,68,102,0.2); }
.timing-cursor {
  position: absolute; top: 4px; bottom: 4px; width: 4px;
  background: white; border-radius: 2px; transition: left 0.02s linear;
  box-shadow: 0 0 8px white;
}

/* TIME SLIDER */
.mg-time-dial { position: relative; margin-bottom: 8px; }
.time-slider { width: 100%; cursor: pointer; }
.time-marks {
  position: relative; height: 16px;
}
.time-marks span {
  position: absolute; transform: translateX(-50%);
  font-family: 'JetBrains Mono', monospace; font-size: 9px; color: var(--text2);
}

/* POUR PREVIEW */
.mg-glass-preview { display: flex; justify-content: center; margin-bottom: 16px; }
.mgp-glass {
  width: 70px; height: 110px; position: relative;
  background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,255,255,0.15);
  clip-path: polygon(8% 0%, 92% 0%, 84% 100%, 16% 100%);
  overflow: hidden;
}
.mgp-fill { position: absolute; bottom: 0; left: 0; right: 0; transition: height .1s; }
.mgp-zone { position: absolute; left: 0; right: 0; }
.mgp-zone.good-zone { bottom: 65%; height: 15%; background: rgba(80,208,144,0.2); border-top: 1px dashed rgba(80,208,144,0.5); }
.mgp-zone.danger-zone { bottom: 80%; top: 0; background: rgba(255,68,102,0.1); }
.mg-pour-hint { font-size: 11px; color: var(--text2); margin-bottom: 8px; }

/* ─── FAIL OVERLAY ─── */
.fail-overlay {
  position: fixed; inset: 0; z-index: 350;
  display: flex; align-items: center; justify-content: center;
  pointer-events: none;
}
.fail-text {
  font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800;
  color: var(--red); text-align: center; padding: 20px 40px;
  background: rgba(10,12,20,0.9); border: 1px solid rgba(255,68,102,0.4);
  border-radius: 12px; box-shadow: 0 0 40px rgba(255,68,102,0.2);
}

/* ─── TOAST ─── */
.game-toast {
  position: fixed; bottom: 110px; right: 24px; z-index: 300;
  padding: 10px 18px; background: var(--surface); border: 1px solid var(--border2);
  border-radius: 8px; font-family: 'JetBrains Mono', monospace; font-size: 12px; letter-spacing: .5px;
}
.game-toast.success { border-color: rgba(80,208,144,0.4); color: var(--green); }
.game-toast.warn { border-color: rgba(255,153,68,0.4); color: var(--orange); }
.game-toast.info { border-color: rgba(124,158,255,0.3); color: var(--accent); }

/* ─── END SCREENS ─── */
.end-screen {
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(160deg, #0a0c14, #12141e);
}
.end-content {
  display: flex; flex-direction: column; align-items: center; gap: 24px;
  text-align: center; max-width: 480px; padding: 0 24px;
}
.end-tag {
  font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 4px;
  color: var(--green); border: 1px solid rgba(80,208,144,0.3);
  padding: 6px 20px; border-radius: 20px;
}
.end-tag.fail { color: var(--red); border-color: rgba(255,68,102,0.3); }
.end-title { font-family: 'Syne', sans-serif; font-size: 36px; font-weight: 800; }
.end-plate { margin-bottom: -10px; }
.end-plate-disc {
  width: 120px; height: 120px; border-radius: 50%;
  background: radial-gradient(circle, #f8f4ee, #e8e0d8);
  display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 4px;
  font-size: 28px; border: 3px solid rgba(255,255,255,0.2);
  box-shadow: 0 0 30px rgba(80,208,144,0.3);
  margin: 0 auto;
}
.richard-verdict { display: flex; align-items: center; gap: 16px; }
.richard-big-face {
  width: 56px; height: 56px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, #3a4060, #252840);
  border: 2px solid var(--border2); display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 4px;
}
.rb-eyes { display: flex; gap: 8px; }
.rb-eyes span { width: 5px; height: 6px; border-radius: 50%; background: var(--text); }
.rb-mouth { width: 16px; height: 7px; border-radius: 0 0 8px 8px; border-bottom: 2px solid var(--green); }
.rb-mouth.happy { border-color: var(--green); }
.rb-mouth.sad { border-bottom: none; border-top: 2px solid var(--red); border-radius: 8px 8px 0 0; margin-top: 2px; }
.verdict-text { font-size: 16px; font-style: italic; color: var(--text2); text-align: left; line-height: 1.5; }
.end-score { font-family: 'JetBrains Mono', monospace; font-size: 14px; color: var(--text2); }
.end-score strong { color: var(--yellow); font-size: 22px; }

/* ─── TRANSITIONS ─── */
.fade-screen-enter-active, .fade-screen-leave-active { transition: opacity .4s ease; }
.fade-screen-enter-from, .fade-screen-leave-to { opacity: 0; }
.comment-slide-enter-active { transition: all .3s cubic-bezier(.34,1.56,.64,1); }
.comment-slide-leave-active { transition: all .2s ease; }
.comment-slide-enter-from { opacity: 0; transform: translateX(-20px); }
.comment-slide-leave-to { opacity: 0; transform: translateX(-10px); }
.elina-pop-enter-active { transition: all .35s cubic-bezier(.34,1.56,.64,1); }
.elina-pop-leave-active { transition: all .2s ease; }
.elina-pop-enter-from { opacity: 0; transform: translateY(-15px) scale(.9); }
.elina-pop-leave-to { opacity: 0; transform: translateY(-10px); }
.toast-pop-enter-active { transition: all .25s cubic-bezier(.34,1.56,.64,1); }
.toast-pop-leave-active { transition: all .2s ease; }
.toast-pop-enter-from, .toast-pop-leave-to { opacity: 0; transform: translateY(8px); }
.fail-flash-enter-active { transition: all .15s; }
.fail-flash-leave-active { transition: all .4s ease; }
.fail-flash-enter-from, .fail-flash-leave-to { opacity: 0; transform: scale(1.05); }
</style>
