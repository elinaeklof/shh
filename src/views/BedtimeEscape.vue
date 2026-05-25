<template>
  <div id="app" @mousemove="moveCursor">
    <div class="cursor" :class="{ hover: hovering }" :style="{ left: cursor.x + 'px', top: cursor.y + 'px' }"></div>
    <div class="scanlines"></div>
    <div class="vignette"></div>

    <!-- INTRO -->
    <div class="intro-screen" v-if="phase === 'intro'">
      <div class="stars-bg">
        <div class="star" v-for="n in 60" :key="n" :style="starStyle(n)"></div>
      </div>
      <div class="intro-content">
        <div class="intro-badge">BEDTIME ESCAPE ROOM</div>
        <div class="intro-title">Operation<br><span>Good Night</span></div>
        <div class="intro-desc">
          Richard needs to sleep. Elina has other plans.<br>
          Keep everyone happy. Survive the night.
        </div>
        <div class="intro-stats">
          <div class="intro-stat">
            <div class="intro-stat-icon"><i class="ti ti-moon"></i></div>
            <div>Get Richard to<br><strong>100% sleepy</strong></div>
          </div>
          <div class="intro-stat">
            <div class="intro-stat-icon"><i class="ti ti-heart"></i></div>
            <div>Keep Elina<br><strong>above 20% happy</strong></div>
          </div>
          <div class="intro-stat">
            <div class="intro-stat-icon"><i class="ti ti-clock"></i></div>
            <div>Handle all<br><strong>random events</strong></div>
          </div>
        </div>
        <button class="start-btn" @click="startGame" @mouseenter="hovering=true" @mouseleave="hovering=false">
          Begin the Night
        </button>
      </div>
    </div>

    <!-- GAME -->
    <div class="game-screen" v-if="phase === 'game' || phase === 'gameover' || phase === 'win'">
      <div class="stars-bg">
        <div class="star" v-for="n in 60" :key="n" :style="starStyle(n)"></div>
      </div>

      <!-- HUD -->
      <div class="hud">
        <div class="hud-meters">
          <div class="meter-group">
            <div class="meter-label">
              <i class="ti ti-moon" aria-hidden="true"></i> Richard's sleep
            </div>
            <div class="meter-track">
              <div class="meter-fill sleep" :style="{ width: richardSleep + '%' }"></div>
            </div>
            <div class="meter-val">{{ Math.round(richardSleep) }}%</div>
          </div>
          <div class="meter-group">
            <div class="meter-label">
              <i class="ti ti-heart" aria-hidden="true"></i> Elina's happiness
              <span class="mood-badge" :class="elinaMood">{{ elinaMoodLabel }}</span>
            </div>
            <div class="meter-track">
              <div class="meter-fill happiness" :class="{ low: elinaHappiness < 30 }" :style="{ width: elinaHappiness + '%' }"></div>
            </div>
            <div class="meter-val">{{ Math.round(elinaHappiness) }}%</div>
          </div>
        </div>
        <div class="hud-time">
          <i class="ti ti-clock" aria-hidden="true"></i>
          {{ formattedTime }}
        </div>
      </div>

      <!-- BEDROOM -->
      <div class="bedroom">
        <!-- CEILING / ROOM -->
        <div class="room-ceiling"></div>
        <div class="room-walls"></div>

        <!-- Window with moon -->
        <div class="window zone" @mouseenter="hovering=true" @mouseleave="hovering=false" @click="openModal('window')">
          <div class="window-glass">
            <div class="moon" :class="{ bright: richardSleep > 50 }"></div>
            <div class="window-star ws1"></div>
            <div class="window-star ws2"></div>
            <div class="window-star ws3"></div>
          </div>
          <div class="window-sill"></div>
          <div class="zone-tip">Look outside</div>
        </div>

        <!-- Bookshelf -->
        <div class="bookshelf zone" @mouseenter="hovering=true" @mouseleave="hovering=false" @click="openModal('books')">
          <div class="shelf-board top"></div>
          <div class="books-row">
            <div class="book" v-for="b in books" :key="b.color" :style="{ background: b.color, height: b.h + 'px' }"></div>
          </div>
          <div class="shelf-board bottom"></div>
          <div class="zone-tip">Bookshelf</div>
        </div>

        <!-- BED with Richard and Elina -->
        <div class="bed-area">
          <!-- Bed frame -->
          <div class="bed-frame">
            <div class="headboard"></div>
            <div class="bed-surface">
              <!-- Richard -->
              <div class="person richard" :class="{ awake: richardSleep < 80, asleep: richardSleep >= 80 }">
                <div class="person-body richard-body">
                  <div class="person-head">
                    <div class="person-eyes">
                      <div class="eye" :class="{ closed: richardSleep >= 80 }"></div>
                      <div class="eye" :class="{ closed: richardSleep >= 80 }"></div>
                    </div>
                    <div class="person-mouth richard-mouth"></div>
                  </div>
                  <div class="zz-container" v-if="richardSleep >= 60">
                    <span class="zz z1">z</span>
                    <span class="zz z2">z</span>
                    <span class="zz z3">Z</span>
                  </div>
                </div>
              </div>

              <!-- Elina -->
              <div class="person elina" :class="elinaMood">
                <div class="person-body elina-body">
                  <div class="person-head">
                    <div class="person-eyes">
                      <div class="eye elina-eye" :class="{ wide: elinaMood === 'energized' }"></div>
                      <div class="eye elina-eye" :class="{ wide: elinaMood === 'energized' }"></div>
                    </div>
                    <div class="person-mouth elina-mouth" :class="elinaMood"></div>
                  </div>
                  <div class="phone-glow" v-if="elinaActivity === 'tiktok'"></div>
                </div>
                <div class="elina-thought" v-if="elinaThought">
                  {{ elinaThought }}
                </div>
              </div>

              <div class="pillow left-pillow"></div>
              <div class="pillow right-pillow"></div>
              <div class="blanket"></div>
            </div>
            <div class="footboard"></div>
          </div>
        </div>

        <!-- Bedside table LEFT (Richard) -->
        <div class="bedside-table left zone" @mouseenter="hovering=true" @mouseleave="hovering=false" @click="openModal('lamp')">
          <div class="table-top">
            <div class="lamp" :class="{ on: lampOn }">
              <div class="lamp-shade"></div>
              <div class="lamp-pole"></div>
              <div class="lamp-base"></div>
              <div class="lamp-glow" v-if="lampOn"></div>
            </div>
            <div class="water-glass">
              <div class="water-level" :style="{ height: waterLevel + '%' }"></div>
            </div>
          </div>
          <div class="table-body"></div>
          <div class="zone-tip">Richard's table</div>
        </div>

        <!-- Bedside table RIGHT (Elina) -->
        <div class="bedside-table right zone" @mouseenter="hovering=true" @mouseleave="hovering=false" @click="openModal('elina-table')">
          <div class="table-top">
            <div class="charging-phone">
              <div class="phone-screen" :class="{ lit: elinaActivity === 'tiktok' }"></div>
              <div class="phone-cable"></div>
            </div>
            <div class="snack-bowl">
              <div class="snack-dot" v-for="s in 4" :key="s"></div>
            </div>
          </div>
          <div class="table-body"></div>
          <div class="zone-tip">Elina's table</div>
        </div>

        <!-- Floor rug -->
        <div class="floor-rug"></div>
        <div class="floor"></div>
      </div>

      <!-- ACTION TRAY -->
      <div class="action-tray">
        <div class="tray-label">Your moves</div>
        <div class="action-buttons">
          <button class="action-btn" :class="{ used: actionCooldowns.shush > 0 }"
            @mouseenter="hovering=true" @mouseleave="hovering=false"
            @click="doAction('shush')" :disabled="actionCooldowns.shush > 0">
            <i class="ti ti-finger" aria-hidden="true"></i>
            <span>Shush</span>
            <div class="cooldown-bar" v-if="actionCooldowns.shush > 0" :style="{ width: (actionCooldowns.shush / 4) * 100 + '%' }"></div>
          </button>
          <button class="action-btn" :class="{ used: actionCooldowns.cuddle > 0 }"
            @mouseenter="hovering=true" @mouseleave="hovering=false"
            @click="doAction('cuddle')" :disabled="actionCooldowns.cuddle > 0">
            <i class="ti ti-heart" aria-hidden="true"></i>
            <span>Cuddle</span>
            <div class="cooldown-bar" v-if="actionCooldowns.cuddle > 0" :style="{ width: (actionCooldowns.cuddle / 6) * 100 + '%' }"></div>
          </button>
          <button class="action-btn" :class="{ used: actionCooldowns.boring > 0 }"
            @mouseenter="hovering=true" @mouseleave="hovering=false"
            @click="doAction('boring')" :disabled="actionCooldowns.boring > 0">
            <i class="ti ti-zzz" aria-hidden="true"></i>
            <span>Talk boring</span>
            <div class="cooldown-bar" v-if="actionCooldowns.boring > 0" :style="{ width: (actionCooldowns.boring / 8) * 100 + '%' }"></div>
          </button>
          <button class="action-btn" :class="{ used: actionCooldowns.distract > 0 }"
            @mouseenter="hovering=true" @mouseleave="hovering=false"
            @click="doAction('distract')" :disabled="actionCooldowns.distract > 0">
            <i class="ti ti-puzzle" aria-hidden="true"></i>
            <span>Distract</span>
            <div class="cooldown-bar" v-if="actionCooldowns.distract > 0" :style="{ width: (actionCooldowns.distract / 5) * 100 + '%' }"></div>
          </button>
          <button class="action-btn" :class="{ used: actionCooldowns.backrub > 0 }"
            @mouseenter="hovering=true" @mouseleave="hovering=false"
            @click="doAction('backrub')" :disabled="actionCooldowns.backrub > 0">
            <i class="ti ti-hand-stop" aria-hidden="true"></i>
            <span>Back rub</span>
            <div class="cooldown-bar" v-if="actionCooldowns.backrub > 0" :style="{ width: (actionCooldowns.backrub / 7) * 100 + '%' }"></div>
          </button>
          <button class="action-btn" :class="{ used: actionCooldowns.safe > 0 }"
            @mouseenter="hovering=true" @mouseleave="hovering=false"
            @click="doAction('safe')" :disabled="actionCooldowns.safe > 0">
            <i class="ti ti-message-circle" aria-hidden="true"></i>
            <span>Safe reply</span>
            <div class="cooldown-bar" v-if="actionCooldowns.safe > 0" :style="{ width: (actionCooldowns.safe / 3) * 100 + '%' }"></div>
          </button>
        </div>
      </div>

      <!-- EVENT LOG -->
      <div class="event-log">
        <div class="log-entry" v-for="(entry, i) in eventLog.slice(-5)" :key="i" :class="entry.type">
          {{ entry.msg }}
        </div>
      </div>

      <!-- NOTIFICATIONS -->
      <transition name="slide-up">
        <div v-if="activeEvent" class="event-popup" :class="activeEvent.severity">
          <div class="event-popup-icon"><i :class="'ti ' + activeEvent.icon" aria-hidden="true"></i></div>
          <div class="event-popup-body">
            <div class="event-popup-who">{{ activeEvent.who }}</div>
            <div class="event-popup-text">"{{ activeEvent.text }}"</div>
          </div>
          <button class="event-dismiss" @click="dismissEvent" @mouseenter="hovering=true" @mouseleave="hovering=false">
            <i class="ti ti-x" aria-hidden="true"></i>
          </button>
        </div>
      </transition>

      <!-- NOTIFICATION TOAST -->
      <transition name="fade">
        <div v-if="toast.show" class="toast" :class="toast.type">{{ toast.msg }}</div>
      </transition>
    </div>

    <!-- MODALS -->
    <div class="modal-overlay" v-if="modal" @click.self="modal = null">
      <div class="modal-panel">
        <button class="modal-close" @click="modal = null" @mouseenter="hovering=true" @mouseleave="hovering=false">
          <i class="ti ti-x" aria-hidden="true"></i>
        </button>

        <!-- WINDOW modal -->
        <template v-if="modal === 'window'">
          <div class="modal-title">The Window</div>
          <div class="modal-body">
            <p>The moon is high. The street is quiet. A cat crosses somewhere below.</p>
            <p>Opening the curtains more might make the room darker and more sleep-conducive. Or you could check the weather to distract Elina.</p>
          </div>
          <div class="modal-actions">
            <button class="modal-btn" @click="doModalAction('curtains')" @mouseenter="hovering=true" @mouseleave="hovering=false">
              <i class="ti ti-moon" aria-hidden="true"></i> Close curtains (Richard +12)
            </button>
            <button class="modal-btn" @click="doModalAction('weather')" @mouseenter="hovering=true" @mouseleave="hovering=false">
              <i class="ti ti-cloud" aria-hidden="true"></i> Check the weather (Elina distracted)
            </button>
          </div>
        </template>

        <!-- BOOKS modal -->
        <template v-if="modal === 'books'">
          <div class="modal-title">The Bookshelf</div>
          <div class="modal-body">
            <p>A shelf full of options. You could read Elina something to tire her out, or use a boring title to send Richard deeper into sleep.</p>
          </div>
          <div class="modal-actions">
            <button class="modal-btn" @click="doModalAction('read-elina')" @mouseenter="hovering=true" @mouseleave="hovering=false">
              <i class="ti ti-book" aria-hidden="true"></i> Read to Elina (Elina +10, Richard -5)
            </button>
            <button class="modal-btn" @click="doModalAction('read-boring')" @mouseenter="hovering=true" @mouseleave="hovering=false">
              <i class="ti ti-zzz" aria-hidden="true"></i> Read boring econ textbook (Richard +15)
            </button>
          </div>
        </template>

        <!-- LAMP modal -->
        <template v-if="modal === 'lamp'">
          <div class="modal-title">Richard's Bedside Table</div>
          <div class="modal-body">
            <p>The lamp {{ lampOn ? 'is on. Dimming it would help Richard sleep.' : 'is off. The room is dark — good for sleep.' }}</p>
            <p>The water glass is {{ waterLevel > 50 ? 'full.' : 'getting low. Offering water could be a nice distraction for Elina.' }}</p>
          </div>
          <div class="modal-actions">
            <button class="modal-btn" @click="doModalAction('toggle-lamp')" @mouseenter="hovering=true" @mouseleave="hovering=false">
              <i class="ti ti-bulb" aria-hidden="true"></i> {{ lampOn ? 'Turn off lamp (Richard +8)' : 'Turn on lamp (Richard -5)' }}
            </button>
            <button class="modal-btn" @click="doModalAction('water')" :disabled="waterLevel < 20" @mouseenter="hovering=true" @mouseleave="hovering=false">
              <i class="ti ti-droplet" aria-hidden="true"></i> Offer water to Elina (Elina +8)
            </button>
          </div>
        </template>

        <!-- ELINA TABLE modal -->
        <template v-if="modal === 'elina-table'">
          <div class="modal-title">Elina's Bedside Table</div>
          <div class="modal-body">
            <p>Her phone sits there, a glowing temptation. The snack bowl is a trap — one chip leads to a whole bag and a TikTok spiral.</p>
          </div>
          <div class="modal-actions">
            <button class="modal-btn danger" @click="doModalAction('hide-phone')" @mouseenter="hovering=true" @mouseleave="hovering=false">
              <i class="ti ti-device-mobile-off" aria-hidden="true"></i> Hide the phone (Risky: Elina -20 or +5)
            </button>
            <button class="modal-btn" @click="doModalAction('remove-snacks')" @mouseenter="hovering=true" @mouseleave="hovering=false">
              <i class="ti ti-salad" aria-hidden="true"></i> Remove snacks quietly (Richard +5)
            </button>
          </div>
        </template>
      </div>
    </div>

    <!-- WIN SCREEN -->
    <div class="end-screen win" v-if="phase === 'win'">
      <div class="stars-bg"><div class="star" v-for="n in 80" :key="n" :style="starStyle(n)"></div></div>
      <div class="end-content">
        <div class="end-moon"></div>
        <div class="end-title">Good Night!</div>
        <div class="end-subtitle">Richard is asleep. Elina is happy. You survived.</div>
        <div class="end-stats">
          <div class="end-stat">Time: <strong>{{ formattedTime }}</strong></div>
          <div class="end-stat">Events handled: <strong>{{ eventsHandled }}</strong></div>
          <div class="end-stat">Elina happiness: <strong>{{ Math.round(elinaHappiness) }}%</strong></div>
        </div>
        <button class="start-btn" @click="resetGame" @mouseenter="hovering=true" @mouseleave="hovering=false">Play Again</button>
      </div>
    </div>

    <!-- GAME OVER SCREEN -->
    <div class="end-screen gameover" v-if="phase === 'gameover'">
      <div class="stars-bg"><div class="star" v-for="n in 80" :key="n" :style="starStyle(n)"></div></div>
      <div class="end-content">
        <div class="end-title danger">{{ gameoverReason === 'elina' ? 'Elina Stormed Off' : 'Richard Gave Up' }}</div>
        <div class="end-subtitle">{{ gameoverReason === 'elina' ? 'Elina\'s happiness hit zero. She\'s making pancakes at 2am.' : 'Richard decided to just stay up. Congratulations.' }}</div>
        <div class="end-stats">
          <div class="end-stat">You lasted: <strong>{{ formattedTime }}</strong></div>
          <div class="end-stat">Events handled: <strong>{{ eventsHandled }}</strong></div>
        </div>
        <button class="start-btn" @click="resetGame" @mouseenter="hovering=true" @mouseleave="hovering=false">Try Again</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onBeforeUnmount, onMounted } from 'vue';

const phase = ref('intro');
const modal = ref(null);
const hovering = ref(false);
const cursor = reactive({ x: -100, y: -100 });

const richardSleep = ref(0);
const elinaHappiness = ref(75);
const lampOn = ref(true);
const waterLevel = ref(80);
const elinaActivity = ref('idle');
const elinaThought = ref('');
const eventsHandled = ref(0);
const gameoverReason = ref('');

const actionCooldowns = reactive({
  shush: 0, cuddle: 0, boring: 0, distract: 0, backrub: 0, safe: 0
});

const eventLog = ref([]);
const activeEvent = ref(null);
const toast = reactive({ show: false, msg: '', type: 'info' });
let toastTimer = null;

const gameTime = ref(0);
let gameInterval = null;
let eventInterval = null;
let thoughtInterval = null;
let cooldownInterval = null;

const formattedTime = computed(() => {
  const m = Math.floor(gameTime.value / 60).toString().padStart(2, '0');
  const s = (gameTime.value % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
});

const elinaMood = computed(() => {
  if (elinaHappiness.value >= 70) return 'happy';
  if (elinaHappiness.value >= 40) return 'neutral';
  if (elinaHappiness.value >= 20) return 'restless';
  return 'energized';
});

const elinaMoodLabel = computed(() => {
  if (elinaHappiness.value >= 70) return 'Content';
  if (elinaHappiness.value >= 40) return 'Restless';
  if (elinaHappiness.value >= 20) return 'Hyper';
  return 'CHAOS';
});

const books = [
  { color: '#8B5E3C', h: 52 }, { color: '#5C7A5B', h: 44 }, { color: '#7C6A8E', h: 60 },
  { color: '#C17B5B', h: 38 }, { color: '#4A6A7C', h: 56 }, { color: '#8E7A4A', h: 48 },
  { color: '#6E4A5B', h: 42 }, { color: '#5B7C6A', h: 50 }
];

const randomEvents = [
  { text: "Did you hear that?", who: "Elina", icon: "ti-ear", severity: "mild", happyDelta: -5, sleepDelta: -8 },
  { text: "Do you still think I'm cute?", who: "Elina", icon: "ti-heart", severity: "mild", happyDelta: 0, sleepDelta: -6 },
  { text: "I can't sleep.", who: "Elina", icon: "ti-moon-off", severity: "moderate", happyDelta: -8, sleepDelta: -10 },
  { text: "What if sharks had legs though?", who: "Elina", icon: "ti-fish", severity: "mild", happyDelta: 5, sleepDelta: -12 },
  { text: "Wait, look at this cute picture of Doris!", who: "Elina", icon: "ti-camera", severity: "mild", happyDelta: 10, sleepDelta: -15 },
  { text: "Are you awake?", who: "Richard", icon: "ti-question-mark", severity: "mild", happyDelta: 0, sleepDelta: -5 },
  { text: "I have an amazing idea for a business.", who: "Elina", icon: "ti-bulb", severity: "moderate", happyDelta: 8, sleepDelta: -18 },
  { text: "We should get a cat.", who: "Elina", icon: "ti-cat", severity: "mild", happyDelta: 12, sleepDelta: -8 },
  { text: "I'm going to show you one TikTok, just one.", who: "Elina", icon: "ti-brand-tiktok", severity: "high", happyDelta: 15, sleepDelta: -20 },
  { text: "Can we go on a trip somewhere?", who: "Elina", icon: "ti-plane", severity: "mild", happyDelta: 5, sleepDelta: -6 },
  { text: "I need a snack.", who: "Elina", icon: "ti-cookie", severity: "moderate", happyDelta: -5, sleepDelta: -10 },
  { text: "I love you so much.", who: "Elina", icon: "ti-heart-filled", severity: "mild", happyDelta: 15, sleepDelta: -4 },
  { text: "Do you think we'll still be together when we're old?", who: "Elina", icon: "ti-users", severity: "moderate", happyDelta: 5, sleepDelta: -12 },
  { text: "I want to rearrange the bedroom.", who: "Elina", icon: "ti-armchair", severity: "high", happyDelta: -3, sleepDelta: -16 },
  { text: "My leg is itchy.", who: "Elina", icon: "ti-asterisk", severity: "mild", happyDelta: -3, sleepDelta: -3 },
];

const elinaThoughts = [
  "maybe we need a bigger duvet...",
  "that sound again...",
  "I should text Sara back...",
  "wait is that a spider?",
  "I'm kind of hungry...",
  "one more TikTok...",
  "what was that dream about...",
  "we should repaint this room...",
  "do we have oat milk?",
  "I should learn to code...",
];

function starStyle(n) {
  const x = (n * 137.5) % 100;
  const y = (n * 97.3) % 100;
  const size = (n % 3) + 1;
  const delay = (n * 0.3) % 4;
  const dur = 2 + (n % 3);
  return {
    left: x + '%', top: y + '%',
    width: size + 'px', height: size + 'px',
    animationDelay: delay + 's',
    animationDuration: dur + 's'
  };
}

function showToast(msg, type = 'info') {
  toast.msg = msg; toast.type = type; toast.show = true;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.show = false; }, 2500);
}

function logEvent(msg, type = 'info') {
  eventLog.value.push({ msg, type });
  if (eventLog.value.length > 20) eventLog.value.shift();
}

function moveCursor(e) { cursor.x = e.clientX; cursor.y = e.clientY; }

function startGame() {
  phase.value = 'game';
  richardSleep.value = 10;
  elinaHappiness.value = 75;
  lampOn.value = true;
  waterLevel.value = 80;
  elinaActivity.value = 'idle';
  gameTime.value = 0;
  eventsHandled.value = 0;
  eventLog.value = [];
  activeEvent.value = null;
  Object.keys(actionCooldowns).forEach(k => actionCooldowns[k] = 0);

  gameInterval = setInterval(() => {
    if (phase.value !== 'game') return;
    gameTime.value++;

    // Passive drift
    const sleepRate = lampOn.value ? 0.3 : 0.5;
    const elinaDrain = elinaMood.value === 'energized' ? 0.4 : elinaMood.value === 'restless' ? 0.2 : 0.1;
    richardSleep.value = Math.min(100, richardSleep.value + sleepRate);
    elinaHappiness.value = Math.max(0, elinaHappiness.value - elinaDrain);

    // Cooldowns
    Object.keys(actionCooldowns).forEach(k => {
      if (actionCooldowns[k] > 0) actionCooldowns[k] = Math.max(0, actionCooldowns[k] - 1/10);
    });

    // Check win/lose
    if (richardSleep.value >= 100) {
      phase.value = 'win';
      clearIntervals();
      return;
    }
    if (elinaHappiness.value <= 0) {
      phase.value = 'gameover';
      gameoverReason.value = 'elina';
      clearIntervals();
      return;
    }
    if (richardSleep.value < 0) {
      phase.value = 'gameover';
      gameoverReason.value = 'richard';
      clearIntervals();
    }
  }, 100);

  eventInterval = setInterval(() => {
    if (phase.value !== 'game' || activeEvent.value) return;
    const chance = elinaMood.value === 'energized' ? 0.7 : elinaMood.value === 'restless' ? 0.45 : 0.25;
    if (Math.random() < chance) {
      const ev = randomEvents[Math.floor(Math.random() * randomEvents.length)];
      activeEvent.value = ev;
      richardSleep.value = Math.max(0, richardSleep.value + ev.sleepDelta);
      elinaHappiness.value = Math.max(0, Math.min(100, elinaHappiness.value + ev.happyDelta));
      if (ev.text.includes('TikTok')) elinaActivity.value = 'tiktok';
      logEvent(`${ev.who}: "${ev.text}"`, ev.severity === 'high' ? 'danger' : 'warning');
    }
  }, 3500);

  thoughtInterval = setInterval(() => {
    if (phase.value !== 'game') return;
    if (Math.random() < 0.6) {
      elinaThought.value = elinaThoughts[Math.floor(Math.random() * elinaThoughts.length)];
      setTimeout(() => { elinaThought.value = ''; }, 2800);
    }
  }, 4000);
}

function dismissEvent() {
  activeEvent.value = null;
  elinaActivity.value = 'idle';
}

function doAction(action) {
  if (actionCooldowns[action] > 0) return;

  const effects = {
    shush: { happy: -5, sleep: 8, cooldown: 4, msg: "Shh... Richard sleeps +8. Elina annoyed.", toast: "Ssshhhh..." },
    cuddle: { happy: 15, sleep: -5, cooldown: 6, msg: "Cuddle! Elina loves it. Richard stirred.", toast: "Warm and cozy." },
    boring: { happy: -8, sleep: 12, cooldown: 8, msg: "You talked about mortgage rates for 3 minutes.", toast: "The fixed-rate mortgage..." },
    distract: { happy: 8, sleep: -3, cooldown: 5, msg: "You asked about her day. She's spiraling happily.", toast: "Tell me more about Doris." },
    backrub: { happy: 12, sleep: 5, cooldown: 7, msg: "Back rub! Both relax a little.", toast: "Relaxing..." },
    safe: { happy: 6, sleep: 2, cooldown: 3, msg: "Safe reply: 'Yes, totally.' Event defused.", toast: "Yes, obviously." },
  };

  const e = effects[action];
  elinaHappiness.value = Math.min(100, Math.max(0, elinaHappiness.value + e.happy));
  richardSleep.value = Math.min(100, Math.max(0, richardSleep.value + e.sleep));
  actionCooldowns[action] = e.cooldown;
  if (activeEvent.value) { eventsHandled.value++; activeEvent.value = null; elinaActivity.value = 'idle'; }
  showToast(e.toast, e.happy > 0 ? 'success' : 'info');
  logEvent(e.msg, 'info');
}

function openModal(name) { modal.value = name; }

function doModalAction(action) {
  const acts = {
    curtains: () => { richardSleep.value = Math.min(100, richardSleep.value + 12); showToast("Curtains closed. Darker now."); logEvent("Closed the curtains. Richard sleeps better."); },
    weather: () => { elinaHappiness.value = Math.min(100, elinaHappiness.value + 10); elinaThought.value = "checking weather..."; showToast("Elina distracted by weather app."); logEvent("Weather app distraction: Elina +10."); },
    'read-elina': () => { elinaHappiness.value = Math.min(100, elinaHappiness.value + 10); richardSleep.value = Math.max(0, richardSleep.value - 5); showToast("Reading time! Richard slightly annoyed."); logEvent("Read to Elina. Elina +10, Richard -5."); },
    'read-boring': () => { richardSleep.value = Math.min(100, richardSleep.value + 15); showToast("'...and that's how quantitative easing works.'"); logEvent("Economics textbook worked. Richard +15."); },
    'toggle-lamp': () => {
      lampOn.value = !lampOn.value;
      if (!lampOn.value) { richardSleep.value = Math.min(100, richardSleep.value + 8); showToast("Lamp off. Better sleeping conditions."); logEvent("Turned lamp off. Richard +8."); }
      else { richardSleep.value = Math.max(0, richardSleep.value - 5); showToast("Lamp on. Richard squints."); logEvent("Turned lamp on. Richard -5."); }
    },
    water: () => { elinaHappiness.value = Math.min(100, elinaHappiness.value + 8); waterLevel.value = Math.max(0, waterLevel.value - 20); showToast("Water offered. Elina appreciates it."); logEvent("Offered water. Elina +8."); },
    'hide-phone': () => {
      if (Math.random() > 0.5) { elinaHappiness.value = Math.min(100, elinaHappiness.value + 5); showToast("She didn't notice. Smart."); logEvent("Hidden phone undetected. Elina +5."); }
      else { elinaHappiness.value = Math.max(0, elinaHappiness.value - 20); showToast("She noticed. She's not happy."); logEvent("Caught hiding phone. Elina -20!"); }
    },
    'remove-snacks': () => { richardSleep.value = Math.min(100, richardSleep.value + 5); showToast("Snacks removed quietly."); logEvent("Removed snacks. Fewer temptations. Richard +5."); },
  };
  if (acts[action]) acts[action]();
  modal.value = null;
}

function clearIntervals() {
  clearInterval(gameInterval);
  clearInterval(eventInterval);
  clearInterval(thoughtInterval);
}

function resetGame() {
  clearIntervals();
  phase.value = 'intro';
  gameTime.value = 0;
}

onBeforeUnmount(() => { clearIntervals(); });
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

#app {
  --night: #0b0c1a;
  --night2: #10122a;
  --night3: #181a35;
  --moon: #f0e8c8;
  --moon2: #d4c990;
  --lavender: #8b7fc0;
  --lavender2: #b4aadd;
  --rose: #d47a9e;
  --sage: #6a9e7f;
  --amber: #d4954a;
  --text: #e8e4f0;
  --text2: rgba(232,228,240,0.6);
  --sleep-color: #7fc0d4;
  --happy-color: #d47a9e;
  font-family: 'DM Sans', sans-serif;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--night);
  color: var(--text);
  cursor: none;
  position: relative;
}

/* ── CURSOR ── */
.cursor {
  position: fixed; width: 18px; height: 18px;
  border: 1.5px solid var(--lavender2); border-radius: 50%;
  pointer-events: none; z-index: 9999;
  transform: translate(-50%, -50%);
  transition: width .12s, height .12s, border-color .12s;
}
.cursor::after {
  content: ''; position: absolute; top: 50%; left: 50%;
  width: 3px; height: 3px; background: var(--lavender2);
  border-radius: 50%; transform: translate(-50%, -50%);
}
.cursor.hover { width: 30px; height: 30px; border-color: var(--rose); }

/* ── SCANLINES ── */
.scanlines {
  position: fixed; inset: 0; z-index: 800; pointer-events: none;
  background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px);
}
.vignette {
  position: fixed; inset: 0; z-index: 799; pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.6) 100%);
}

/* ── STARS ── */
.stars-bg { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.star {
  position: absolute; border-radius: 50%; background: var(--moon);
  animation: twinkle 3s ease-in-out infinite;
}
@keyframes twinkle {
  0%, 100% { opacity: 0.8; } 50% { opacity: 0.15; }
}

/* ── INTRO ── */
.intro-screen {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 100;
}
.intro-content {
  display: flex; flex-direction: column; align-items: center; gap: 28px;
  text-align: center; max-width: 520px; position: relative; z-index: 2;
}
.intro-badge {
  font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 3px;
  color: var(--lavender2); border: 1px solid rgba(180,170,221,0.3);
  padding: 6px 18px; border-radius: 20px;
}
.intro-title {
  font-family: 'DM Serif Display', serif; font-size: 64px; line-height: 1.1;
  color: var(--moon);
}
.intro-title span { color: var(--rose); font-style: italic; }
.intro-desc { font-size: 16px; color: var(--text2); line-height: 1.7; }
.intro-stats {
  display: flex; gap: 24px; width: 100%;
}
.intro-stat {
  flex: 1; padding: 16px; border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px; background: rgba(255,255,255,0.03);
  display: flex; gap: 12px; align-items: center; font-size: 13px; color: var(--text2); line-height: 1.5;
}
.intro-stat-icon { font-size: 22px; color: var(--lavender2); flex-shrink: 0; }
.intro-stat strong { color: var(--moon); }
.start-btn {
  padding: 14px 44px; background: transparent;
  border: 1.5px solid var(--lavender2); border-radius: 40px;
  color: var(--lavender2); font-family: 'DM Sans', sans-serif;
  font-size: 16px; font-weight: 500; cursor: pointer; transition: all .2s;
  letter-spacing: 0.5px;
}
.start-btn:hover { background: rgba(180,170,221,0.12); border-color: var(--moon); color: var(--moon); }

/* ── GAME SCREEN ── */
.game-screen { position: absolute; inset: 0; display: flex; flex-direction: column; }

/* ── HUD ── */
.hud {
  position: fixed; top: 0; left: 0; right: 0; z-index: 200;
  padding: 14px 24px; display: flex; justify-content: space-between; align-items: center;
  background: rgba(11,12,26,0.85); border-bottom: 1px solid rgba(255,255,255,0.06);
}
.hud-meters { display: flex; gap: 32px; flex: 1; }
.meter-group { display: flex; align-items: center; gap: 10px; }
.meter-label {
  font-family: 'DM Mono', monospace; font-size: 11px; color: var(--text2);
  letter-spacing: 1px; white-space: nowrap; display: flex; align-items: center; gap: 6px; min-width: 140px;
}
.mood-badge {
  font-size: 9px; padding: 2px 8px; border-radius: 10px; letter-spacing: 1px; font-weight: 500;
}
.mood-badge.happy { background: rgba(212,122,158,0.2); color: var(--rose); }
.mood-badge.neutral { background: rgba(139,127,192,0.2); color: var(--lavender2); }
.mood-badge.restless { background: rgba(212,149,74,0.25); color: var(--amber); }
.mood-badge.energized { background: rgba(212,60,60,0.25); color: #ff7070; animation: badge-pulse 1s infinite; }
@keyframes badge-pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
.meter-track {
  width: 160px; height: 6px; background: rgba(255,255,255,0.08);
  border-radius: 3px; overflow: hidden;
}
.meter-fill {
  height: 100%; border-radius: 3px; transition: width .4s ease;
}
.meter-fill.sleep { background: var(--sleep-color); }
.meter-fill.happiness { background: var(--happy-color); }
.meter-fill.happiness.low { background: #ff7070; animation: low-pulse .8s infinite; }
@keyframes low-pulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }
.meter-val { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--text2); min-width: 36px; }
.hud-time { font-family: 'DM Mono', monospace; font-size: 20px; color: var(--moon); letter-spacing: 2px; }

/* ── BEDROOM ── */
.bedroom {
  position: absolute; inset: 0; top: 60px;
}
.room-ceiling {
  position: absolute; top: 0; left: 0; right: 0; height: 30%;
  background: linear-gradient(180deg, #0d0e20 0%, #12142e 100%);
}
.room-walls {
  position: absolute; bottom: 0; left: 0; right: 0; top: 25%;
  background: #12142e;
}

/* ── WINDOW ── */
.window {
  position: absolute; top: 4%; left: 6%; width: 100px; height: 130px;
  border: 3px solid rgba(255,255,255,0.12); border-radius: 4px 4px 0 0;
}
.window-glass {
  width: 100%; height: 110px;
  background: linear-gradient(180deg, #0a1525 0%, #0d1e3a 100%);
  position: relative; overflow: hidden;
  border-bottom: 3px solid rgba(255,255,255,0.08);
}
.window-glass::before {
  content: ''; position: absolute; top: 0; left: 50%; bottom: 0;
  width: 1.5px; background: rgba(255,255,255,0.08);
}
.window-glass::after {
  content: ''; position: absolute; left: 0; right: 0; top: 45%;
  height: 1.5px; background: rgba(255,255,255,0.08);
}
.moon {
  position: absolute; top: 10px; right: 14px;
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--moon2);
  box-shadow: 0 0 10px rgba(240,232,200,0.4);
  transition: all 1s;
}
.moon.bright { background: var(--moon); box-shadow: 0 0 20px rgba(240,232,200,0.7); }
.window-star { position: absolute; width: 2px; height: 2px; border-radius: 50%; background: white; animation: twinkle 2s infinite; }
.ws1 { top: 30%; left: 20%; }
.ws2 { top: 60%; left: 35%; animation-delay: .7s; }
.ws3 { top: 20%; left: 60%; animation-delay: 1.3s; }
.window-sill {
  position: absolute; bottom: 0; left: -4px; right: -4px; height: 10px;
  background: rgba(255,255,255,0.08); border-radius: 2px;
}

/* ── BOOKSHELF ── */
.bookshelf {
  position: absolute; top: 4%; right: 6%; width: 140px; height: 80px;
}
.shelf-board {
  height: 6px; background: rgba(255,255,255,0.1); border-radius: 2px; width: 100%;
}
.shelf-board.top { margin-bottom: 4px; }
.shelf-board.bottom { margin-top: 4px; }
.books-row { display: flex; gap: 3px; align-items: flex-end; padding: 0 4px; height: 60px; }
.book { width: 14px; min-height: 30px; border-radius: 1px 1px 0 0; opacity: 0.7; flex-shrink: 0; }

/* ── BED AREA ── */
.bed-area {
  position: absolute; bottom: 18%; left: 50%; transform: translateX(-50%);
  width: 65%; min-width: 440px;
}
.bed-frame {
  width: 100%; position: relative;
}
.headboard {
  height: 50px; background: linear-gradient(180deg, #3a2a1a, #2a1e12);
  border: 1px solid rgba(255,255,255,0.07); border-radius: 6px 6px 0 0;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
}
.footboard {
  height: 30px; background: linear-gradient(180deg, #2a1e12, #3a2a1a);
  border: 1px solid rgba(255,255,255,0.07); border-radius: 0 0 6px 6px;
}
.bed-surface {
  background: #1e1a2e; height: 130px; position: relative;
  border-left: 1px solid rgba(255,255,255,0.05);
  border-right: 1px solid rgba(255,255,255,0.05);
  overflow: hidden;
}
.blanket {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, #2a2040 0%, #22183a 100%);
  border-top: 3px solid #3a2e55;
}
.pillow {
  position: absolute; top: 12px;
  width: 120px; height: 40px;
  background: linear-gradient(135deg, #e8e0f0, #d0c8e0);
  border-radius: 8px; z-index: 5;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
}
.left-pillow { left: 8%; }
.right-pillow { right: 8%; }

/* ── PERSONS ── */
.person {
  position: absolute; top: 0; bottom: 0; width: 44%;
  display: flex; align-items: flex-end; justify-content: center;
  z-index: 10; padding-bottom: 6px;
}
.richard { left: 0; }
.elina { right: 0; }
.person-body {
  width: 60px; height: 80px; border-radius: 30px 30px 10px 10px;
  position: relative; display: flex; align-items: flex-start; justify-content: center;
}
.richard-body { background: linear-gradient(180deg, #4a3a5e, #2e2244); }
.elina-body { background: linear-gradient(180deg, #5e3a4a, #44222e); }
.person-head {
  width: 38px; height: 38px; border-radius: 50%;
  background: #d4a882; position: absolute; top: -18px;
  border: 2px solid rgba(255,255,255,0.08);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
}
.person-eyes { display: flex; gap: 8px; }
.eye {
  width: 5px; height: 6px; border-radius: 50%;
  background: #2a1a0e; transition: height .4s;
}
.eye.closed { height: 1px; border-radius: 2px; background: #5a3a2e; }
.eye.wide { width: 7px; height: 8px; }
.elina-eye { background: #1a1040; }
.person-mouth { width: 12px; height: 5px; border-radius: 0 0 8px 8px; border-bottom: 2px solid #5a3a2e; }
.elina-mouth.happy { border-bottom-color: #c06080; }
.elina-mouth.neutral { border-bottom-color: #8a5070; }
.elina-mouth.restless { border-bottom-color: #d47a40; border-bottom-width: 2px; border-radius: 4px; }
.elina-mouth.energized { border-bottom: none; border: 2px solid #ff7070; border-radius: 50%; width: 10px; height: 10px; }

/* ── ZZZs ── */
.zz-container {
  position: absolute; top: -40px; right: -15px;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
}
.zz {
  font-family: 'DM Serif Display', serif; color: var(--sleep-color);
  opacity: 0.8; animation: float-z 2s ease-in-out infinite;
}
.z1 { font-size: 11px; animation-delay: 0s; }
.z2 { font-size: 14px; animation-delay: .4s; }
.z3 { font-size: 17px; animation-delay: .8s; }
@keyframes float-z {
  0% { transform: translateY(0) translateX(0); opacity: 0.8; }
  100% { transform: translateY(-18px) translateX(6px); opacity: 0; }
}

/* ── ELINA THOUGHT ── */
.elina-thought {
  position: absolute; top: -50px; right: 0; left: -20px;
  background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
  border-radius: 10px 10px 0 10px; padding: 6px 10px;
  font-size: 10px; font-family: 'DM Mono', monospace; color: var(--text2);
  white-space: nowrap; animation: thought-in .3s ease-out;
}
@keyframes thought-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

/* ── PHONE GLOW ── */
.phone-glow {
  position: absolute; inset: 0; border-radius: 30px 30px 10px 10px;
  background: rgba(200,220,255,0.15); animation: phone-glow .5s infinite alternate;
}
@keyframes phone-glow { to { background: rgba(200,220,255,0.28); } }

/* ── BEDSIDE TABLES ── */
.bedside-table {
  position: absolute; bottom: 18%; width: 80px;
}
.bedside-table.left { left: calc(17.5% - 50px); }
.bedside-table.right { right: calc(17.5% - 50px); }
.table-top {
  height: 55px; background: linear-gradient(180deg, #2a1e14, #221610);
  border: 1px solid rgba(255,255,255,0.06); border-radius: 4px 4px 0 0;
  display: flex; align-items: center; justify-content: space-around; padding: 0 8px;
}
.table-body {
  height: 35px; background: linear-gradient(180deg, #1e1410, #18100c);
  border: 1px solid rgba(255,255,255,0.04); border-top: none;
  border-radius: 0 0 4px 4px;
}

/* ── LAMP ── */
.lamp { position: relative; width: 28px; height: 44px; display: flex; flex-direction: column; align-items: center; }
.lamp-shade {
  width: 28px; height: 18px;
  background: linear-gradient(180deg, #8a6a20, #6a5010);
  clip-path: polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%);
  transition: all .4s;
}
.lamp.on .lamp-shade { background: linear-gradient(180deg, #d4a840, #b88a20); }
.lamp-pole { width: 2px; height: 16px; background: rgba(255,255,255,0.15); }
.lamp-base { width: 18px; height: 5px; background: rgba(255,255,255,0.1); border-radius: 2px; }
.lamp-glow {
  position: absolute; top: 8px; left: 50%; transform: translateX(-50%);
  width: 50px; height: 40px;
  background: radial-gradient(ellipse, rgba(212,168,64,0.3), transparent 70%);
  pointer-events: none;
}

/* ── WATER GLASS ── */
.water-glass {
  width: 20px; height: 30px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 2px; overflow: hidden; display: flex; align-items: flex-end;
}
.water-level { width: 100%; background: rgba(100,180,220,0.35); transition: height .5s; }

/* ── PHONE ── */
.charging-phone { position: relative; }
.phone-screen {
  width: 18px; height: 28px; background: #0a0a14;
  border: 1px solid rgba(255,255,255,0.1); border-radius: 3px; transition: all .3s;
}
.phone-screen.lit { background: #1a2050; box-shadow: 0 0 10px rgba(100,150,255,0.4); }
.phone-cable {
  width: 2px; height: 10px; background: rgba(255,255,255,0.1);
  margin: 0 auto; border-radius: 1px;
}

/* ── SNACKS ── */
.snack-bowl {
  width: 28px; height: 14px; background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 0 0 8px 8px;
  display: flex; gap: 3px; align-items: center; justify-content: center; padding: 2px;
}
.snack-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--amber); opacity: 0.6; }

/* ── FLOOR ── */
.floor {
  position: absolute; bottom: 0; left: 0; right: 0; height: 18%;
  background: linear-gradient(180deg, #1a1428 0%, #14101e 100%);
  border-top: 1px solid rgba(255,255,255,0.05);
}
.floor-rug {
  position: absolute; bottom: 18%; left: 50%; transform: translateX(-50%);
  width: 50%; height: 4px; background: rgba(139,127,192,0.2); border-radius: 2px;
}

/* ── ZONES ── */
.zone { cursor: none; transition: all .25s; }
.zone::after {
  content: ''; position: absolute; inset: -6px;
  border: 1px solid transparent; border-radius: 6px; transition: all .25s; pointer-events: none;
}
.zone:hover::after { border-color: rgba(180,170,221,0.5); box-shadow: 0 0 14px rgba(139,127,192,0.2); }
.zone-tip {
  position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%);
  font-family: 'DM Mono', monospace; font-size: 10px; color: var(--lavender2);
  letter-spacing: 1.5px; white-space: nowrap; opacity: 0; transition: opacity .25s;
  pointer-events: none;
}
.zone:hover .zone-tip { opacity: 1; }

/* ── ACTION TRAY ── */
.action-tray {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 200;
  padding: 14px 24px 18px;
  background: rgba(11,12,26,0.9); border-top: 1px solid rgba(255,255,255,0.06);
}
.tray-label {
  font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 2px;
  color: var(--text2); margin-bottom: 10px;
}
.action-buttons { display: flex; gap: 10px; }
.action-btn {
  flex: 1; padding: 10px 8px; background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
  color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 12px;
  cursor: pointer; transition: all .2s; display: flex; flex-direction: column;
  align-items: center; gap: 5px; position: relative; overflow: hidden;
}
.action-btn i { font-size: 18px; color: var(--lavender2); }
.action-btn:hover:not(:disabled) { background: rgba(139,127,192,0.12); border-color: rgba(180,170,221,0.3); }
.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.action-btn.used { opacity: 0.4; }
.cooldown-bar {
  position: absolute; bottom: 0; left: 0; height: 2px;
  background: var(--lavender2); transition: width .1s linear;
}

/* ── EVENT LOG ── */
.event-log {
  position: fixed; left: 18px; bottom: 110px; z-index: 190;
  display: flex; flex-direction: column; gap: 4px; max-width: 260px;
  pointer-events: none;
}
.log-entry {
  font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.5px;
  color: var(--text2); opacity: 0.6; transition: opacity .3s;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.log-entry.danger { color: #ff7070; opacity: 0.8; }
.log-entry.warning { color: var(--amber); opacity: 0.8; }

/* ── EVENT POPUP ── */
.event-popup {
  position: fixed; right: 24px; top: 80px; z-index: 400;
  background: rgba(20,18,40,0.95); border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px; padding: 16px 18px;
  display: flex; align-items: center; gap: 14px; max-width: 320px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.6);
}
.event-popup.mild { border-color: rgba(139,127,192,0.4); }
.event-popup.moderate { border-color: rgba(212,149,74,0.5); }
.event-popup.high { border-color: rgba(212,80,80,0.6); animation: popup-shake .3s ease-out; }
@keyframes popup-shake {
  0%,100%{transform:translateX(0);} 25%{transform:translateX(-5px);} 75%{transform:translateX(5px);}
}
.event-popup-icon { font-size: 24px; color: var(--lavender2); flex-shrink: 0; }
.event-popup.moderate .event-popup-icon { color: var(--amber); }
.event-popup.high .event-popup-icon { color: #ff7070; }
.event-popup-body { flex: 1; }
.event-popup-who { font-size: 11px; font-family: 'DM Mono', monospace; color: var(--text2); letter-spacing: 1px; margin-bottom: 4px; }
.event-popup-text { font-size: 14px; color: var(--text); line-height: 1.4; font-style: italic; }
.event-dismiss {
  width: 28px; height: 28px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.1);
  background: transparent; color: var(--text2); cursor: pointer;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  transition: all .2s;
}
.event-dismiss:hover { background: rgba(255,255,255,0.08); color: var(--text); }

/* ── TOAST ── */
.toast {
  position: fixed; bottom: 110px; right: 24px; z-index: 500;
  font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 1px;
  padding: 10px 18px; border-radius: 8px;
  background: rgba(20,18,40,0.95); border: 1px solid rgba(255,255,255,0.12);
  color: var(--text);
}
.toast.success { border-color: rgba(106,158,127,0.5); color: #8ecaaa; }
.toast.danger { border-color: rgba(212,80,80,0.5); color: #ff9090; }

/* ── MODALS ── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 600;
  background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
}
.modal-panel {
  background: rgba(16,18,42,0.98); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px; padding: 32px 36px; min-width: 360px; max-width: 480px;
  position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.8);
}
.modal-title {
  font-family: 'DM Serif Display', serif; font-size: 24px; color: var(--moon);
  margin-bottom: 16px;
}
.modal-body { color: var(--text2); font-size: 14px; line-height: 1.7; margin-bottom: 20px; }
.modal-body p { margin-bottom: 10px; }
.modal-close {
  position: absolute; top: 14px; right: 16px; background: none; border: none;
  color: var(--text2); font-size: 18px; cursor: pointer; opacity: 0.5; transition: opacity .2s;
}
.modal-close:hover { opacity: 1; }
.modal-actions { display: flex; flex-direction: column; gap: 10px; }
.modal-btn {
  padding: 11px 18px; background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;
  color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 13px;
  cursor: pointer; text-align: left; transition: all .2s;
  display: flex; align-items: center; gap: 10px;
}
.modal-btn:hover:not(:disabled) { background: rgba(139,127,192,0.12); border-color: rgba(180,170,221,0.3); }
.modal-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.modal-btn.danger { border-color: rgba(212,80,80,0.3); }
.modal-btn.danger:hover { background: rgba(212,80,80,0.08); }

/* ── END SCREENS ── */
.end-screen {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 700;
}
.end-screen.win { background: rgba(11,12,26,0.96); }
.end-screen.gameover { background: rgba(11,12,26,0.96); }
.end-content {
  display: flex; flex-direction: column; align-items: center; gap: 20px;
  text-align: center; position: relative; z-index: 2;
}
.end-moon {
  width: 80px; height: 80px; border-radius: 50%; background: var(--moon);
  box-shadow: 0 0 40px rgba(240,232,200,0.6); margin-bottom: 8px;
  animation: end-float 3s ease-in-out infinite;
}
@keyframes end-float { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-12px);} }
.end-title {
  font-family: 'DM Serif Display', serif; font-size: 56px; color: var(--moon); line-height: 1;
}
.end-title.danger { color: #ff7070; }
.end-subtitle { font-size: 16px; color: var(--text2); max-width: 380px; line-height: 1.6; }
.end-stats { display: flex; gap: 28px; font-size: 13px; color: var(--text2); }
.end-stat strong { color: var(--text); }

/* ── TRANSITIONS ── */
.slide-up-enter-active { transition: all .3s cubic-bezier(.34,1.56,.64,1); }
.slide-up-leave-active { transition: all .2s ease; }
.slide-up-enter-from { opacity: 0; transform: translateY(-20px) scale(.95); }
.slide-up-leave-to { opacity: 0; transform: translateY(-10px); }
.fade-enter-active, .fade-leave-active { transition: opacity .3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
