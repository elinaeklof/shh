** TrainLevel7.vue **
<template>
  <div id="root">
    <div id="hud">
      <div id="hud-left">
        <span id="hud-route">Vagn 4 &mdash; LÅST</span>
        <span id="hud-sep">·</span>
        <span id="hud-timer" :class="timerSec < 120 ? 'urgent' : ''">
          Centralstationen om {{ timerDisplay }}
        </span>
      </div>
      <div id="hud-right">
        <span id="clue-badge">
          <span class="clue-dot" v-for="i in 4" :key="i" :class="{ filled: i <= clueCount }"></span>
          {{ clueCount }}/4 ledtrådar
        </span>
      </div>
    </div>

    <div id="canvas-wrap">
      <canvas ref="cv" @click="handleClick" />
    </div>

    <div id="bottom-panel">
      <div id="controls-hint">
        <span>↑↓←→ / WASD rörelse</span>
        <span>E eller klicka för att prata</span>
        <span>Esc avsluta samtal</span>
      </div>

      <div id="dialog" ref="dialogEl">
        <div
          v-for="(msg, i) in messages"
          :key="i"
          :class="['dmsg', msg.type]"
          v-html="msg.html"
        />
      </div>

      <div id="input-row">
        <input
          ref="txtEl"
          v-model="inputText"
          placeholder="Skriv något..."
          maxlength="120"
          :disabled="!talkMode"
          @keydown.enter="sendLine"
          @keydown.esc="endTalk"
        />
        <button :disabled="!talkMode" @click="sendLine">Skicka</button>
      </div>

      <div id="code-row">
        <span class="code-lbl">KOD</span>
        <input v-model="codeInput" maxlength="4" placeholder="_ _ _ _" class="code-in" @keydown.enter="tryCode" />
        <button class="code-btn" @click="tryCode">Lås upp</button>
        <span class="clues-found">{{ cluesFoundText }}</span>
      </div>
    </div>

    <div v-if="overlay.show" id="overlay">
      <div class="ov-box">
        <div class="ov-title">{{ overlay.title }}</div>
        <div class="ov-sub">{{ overlay.sub }}</div>
        <button class="ov-btn" @click="restart">Spela igen</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

const router = useRouter()
const showButton = ref(false)

function beginGame() {
  router.push('/level-22')
}

const SECRET = '7341'

const WORLD_W = 3200
const WORLD_H = 360
const GANG_Y1 = 170
const GANG_Y2 = 250
const GANG_MID = 210

const cv = ref(null)
const dialogEl = ref(null)
const txtEl = ref(null)

let ctx = null
let animFrame = null
let timerIv = null
let dpr = 1

const camX = ref(0)

const player = ref({ x: 120, y: GANG_MID })
const keys = {}
const talkMode = ref(false)
const inputText = ref('')
const codeInput = ref('')
const messages = ref([])
const clues = ref({})
const overlay = ref({ show: false, title: '', sub: '' })
const timerSec = ref(540)
let activeNpc = null
let npcTurn = 0
let gameOver = false

const timerDisplay = computed(() => {
  const m = Math.floor(timerSec.value / 60)
  const s = timerSec.value % 60
  return m + ':' + (s < 10 ? '0' : '') + s
})

const clueCount = computed(() => Object.keys(clues.value).length)
const cluesFoundText = computed(() => Object.values(clues.value).join('  ·  '))

const NPCS = ref([
  {
    id: 0, name: 'Stoffe', x: 260, y: 100,
    digit: '7', clue: 'c0', clueText: 'Stoffs siffra: 7 (position 1)', spoken: false,
    look: 'En skruggig gubbe med trasig sovsäck runt sig. Luktar sprit på fem meters håll.',
    convo: {
      intro: ['Vafan vill du...', 'Sov... gå härifrån.', 'Mrmmh.'],
      topics: {
        'siffra|kod|nummer': 'Min siffra? Fråga om bandet -97.',
        'band|1997|konsert|judas|musik|sjutton': 'Judas Priest -97 på Globen. Sju låtar. Sju är mitt nummer.',
        'hej|tjena|hallå': 'Han öppnar ett öga.',
        default: ['Han muttra något ohörbart.', 'Ingen reaktion.', 'Han drar sovsäcken över huvudet.']
      }
    }
  },
  {
    id: 1, name: 'Majsan', x: 900, y: 310,
    digit: '3', clue: 'c1', clueText: 'Majsans siffra: 3 (position 2)', spoken: false,
    look: 'En gumma med fem lager kläder och en kundvagn full med plastpåsar. Ögonen är glasiga.',
    convo: {
      intro: ['Rör inte mina grejjer!', 'Va?', 'Mmm, vem?'],
      topics: {
        'siffra|kod|nummer': 'Nummer? Fråga om katten.',
        'katt|katten|hur|gammal|ålder|levde|misan': 'Misan levde trettio år. Tre-tio. Tre är min siffra.',
        'hej|tjena|hallå': 'Hon rynkar pannan djupt.',
        default: ['Hon kramar sina kassar.', 'Inget.', "'Hmm.'"]
      }
    }
  },
  {
    id: 2, name: 'Bertil', x: 1600, y: 100,
    digit: '4', clue: 'c2', clueText: 'Bertils siffra: 4 (position 3)', spoken: false,
    look: 'En äldre man med skägg ner till bröstkorgen. Stirrar på en ihopvikt tidning med tomma ögon.',
    convo: {
      intro: ['Shh.', 'Lotto... lotto...', 'Va vill du?'],
      topics: {
        'siffra|kod|nummer': 'Fyra rätt hade jag. Men fråga om vädret.',
        'väder|regn|sol|dag|grader|regnigt': 'Det regnade fyra dagar i sträck. Fyra. Tredje siffran.',
        'hej|tjena|hallå': 'Han höjer handen knappt.',
        default: ['Han mumlar siffror.', 'Tidningen prasslar.', 'Tyst.']
      }
    }
  },
  {
    id: 3, name: 'Lillen', x: 2700, y: 310,
    digit: '1', clue: 'c3', clueText: 'Lillens siffra: 1 (position 4)', spoken: false,
    look: 'En ung kille med hål i skorna och blick som flackrar åt alla håll. Nervös som ett rådjur.',
    convo: {
      intro: ['Jag e inte med på nåt.', 'Eh.', 'Va?'],
      topics: {
        'siffra|kod|nummer': 'Okej men snacka inte med polisen. Fråga om bussen igår.',
        'buss|linje|igår|miss|ettan|ett': 'Buss ettan. Missade den. Ettan. Sista siffran.',
        'hej|tjena|hallå': 'Han rycker till.',
        default: ['Han tittar bort.', 'Pillar på jackan.', 'Suckar.']
      }
    }
  }
])

function setupCanvas() {
  const wrap = cv.value.parentElement
  const W = wrap.clientWidth
  const H = wrap.clientHeight
  dpr = window.devicePixelRatio || 1

  cv.value.width = W * dpr
  cv.value.height = H * dpr
  cv.value.style.width = W + 'px'
  cv.value.style.height = H + 'px'

  ctx = cv.value.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function getViewW() {
  return cv.value ? cv.value.clientWidth : 800
}

function getViewH() {
  return cv.value ? cv.value.clientHeight : 300
}

function getScale() {
  const scaleX = getViewW() / 900
  const scaleY = getViewH() / WORLD_H
  return Math.min(scaleX, scaleY) * 0.95
}

function updateCamera() {
  const vw = getViewW()
  const scale = getScale()
  const cx = player.value.x - vw / (2 * scale)
  camX.value = Math.max(0, Math.min(WORLD_W - vw / scale, cx))
}

function drawScene() {
  if (!ctx) return

  const vw = getViewW()
  const vh = getViewH()
  const sc = getScale()

  ctx.clearRect(0, 0, vw, vh)
  ctx.save()
  ctx.scale(sc, sc)
  ctx.translate(-camX.value, 0)

  drawTrain()
  NPCS.value.forEach(n => drawNpc(n))
  drawPlayerChar()

  ctx.restore()
}

function drawTrain() {
  ctx.fillStyle = '#c8cdd2'
  ctx.fillRect(0, 0, WORLD_W, WORLD_H)

  ctx.fillStyle = '#c2c7c2'
  ctx.fillRect(10, 10, WORLD_W - 20, WORLD_H - 20)

  ctx.fillStyle = 'rgba(176,181,176,0.5)'
  for (let x = 10; x < WORLD_W - 10; x += 16) {
    for (let y = 10; y < WORLD_H - 10; y += 16) {
      ctx.beginPath()
      ctx.arc(x + 5, y + 5, 1, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  drawAisle
  drawSeats()
  drawDoors()
  drawWindows()
  drawEndWall(0, false)
  drawEndWall(WORLD_W - 60, true)

  roundRect(2, 2, WORLD_W - 4, WORLD_H - 4, 14)
  ctx.strokeStyle = '#5a6068'
  ctx.lineWidth = 2.5
  ctx.stroke()
}

function drawAisle() {
  const aisleY = 145
  const aisleH = 130

  ctx.fillStyle = '#b0b5b0'
  ctx.fillRect(30, aisleY, WORLD_W - 60, aisleH)

  ctx.save()
  ctx.setLineDash([8, 6])
  ctx.strokeStyle = '#9a9f9a'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(30, aisleY + aisleH / 2)
  ctx.lineTo(WORLD_W - 30, aisleY + aisleH / 2)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()
}

function drawSeats() {
  const groupsX = [
    70, 210,
    478, 615,
    890, 1030,
    1305, 1445,
    1713, 1850,
    2125, 2265,
    2540, 2680,
    2955, 3095
  ]

  groupsX.forEach(x => drawSeatGroup(x))
}

function drawSeatGroup(x) {
  drawSeatSVG(x, 50, 'R')
  drawSeatSVG(x, 95, 'R')
  drawSeatSVG(x + 85, 50, 'L')
  drawSeatSVG(x + 85, 95, 'L')

  // gul markering på ryggstöden närmast gången / mitten
  drawYellowSeatMark(x + 85 + 38 + 5, 100 + 16)

  drawSeatSVG(x, 255, 'R')
  drawSeatSVG(x, 300, 'R')
  drawSeatSVG(x + 85, 255, 'L')
  drawSeatSVG(x + 85, 300, 'L')

  // gul markering på ryggstöden närmast gången / mitten
  drawYellowSeatMark(x + 85 + 38 + 5, 245 + 16)
}
function drawSeatSVG(x, y, dir) {
  const backW = 16
  const seatW = 38
  const h = 40

  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  roundRect(x + 3, y + h - 4, 50, 8, 4)
  ctx.fill()

  if (dir === 'R') {
    roundRect(x, y, backW, h, 5)
    ctx.fillStyle = '#1a44aa'
    ctx.fill()
    ctx.strokeStyle = '#0d2d7a'
    ctx.lineWidth = 1
    ctx.stroke()

    roundRect(x + backW, y + 4, seatW, h - 8, 5)
    ctx.fillStyle = '#2a5bd8'
    ctx.fill()
    drawSeatPattern(x + backW, y + 4, seatW, h - 8)
    ctx.strokeStyle = '#1a44aa'
    ctx.stroke()
  } else {
    roundRect(x + seatW, y, backW, h, 5)
    ctx.fillStyle = '#1a44aa'
    ctx.fill()
    ctx.strokeStyle = '#0d2d7a'
    ctx.lineWidth = 1
    ctx.stroke()

    roundRect(x, y + 4, seatW, h - 8, 5)
    ctx.fillStyle = '#2a5bd8'
    ctx.fill()
    drawSeatPattern(x, y + 4, seatW, h - 8)
    ctx.strokeStyle = '#1a44aa'
    ctx.stroke()
  }
}

function drawYellowSeatMark(x, y) {
  roundRect(x, y, 6, 8, 2)
  ctx.fillStyle = '#e8b800'
  ctx.fill()
}
function seededNoise(n) {
  const x = Math.sin(n * 9999) * 10000
  return x - Math.floor(x)
}

function drawSeatPattern(x, y, w, h) {
  ctx.save()

  roundRect(x, y, w, h, 5)
  ctx.clip()

  const icons = ['⌒', '▱', '·', '⌜']
  const colors = ['#7fb36a', '#d98b45', '#b7c6d8', '#d05b68']

  ctx.font = '5px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let row = y + 6; row < y + h - 4; row += 8) {
    for (let col = x + 6; col < x + w - 4; col += 10) {
      const seed = col * 17 + row * 31
      const icon = icons[Math.floor(seededNoise(seed) * icons.length)]
      const color = colors[Math.floor(seededNoise(seed + 2) * colors.length)]

      ctx.save()
      ctx.translate(col, row)
      ctx.rotate((seededNoise(seed + 5) - 0.5) * 0.8)
      ctx.fillStyle = color
      ctx.fillText(icon, 0, 0)
      ctx.restore()
    }
  }

  ctx.restore()
}


function drawDoors() {
  const doors = [
    [355, 465],
    [760, 872],
    [1175, 1285],
    [1590, 1700],
    [2005, 2115],
    [2420, 2530],
    [2835, 2945]
  ]

  doors.forEach(([lx, rx]) => drawDoor(lx, rx))
}

function drawDoor(lx, rx) {
  roundRect(lx, 10, 8, WORLD_H - 20, 3)
  ctx.fillStyle = '#888780'
  ctx.fill()

  roundRect(rx, 10, 8, WORLD_H - 20, 3)
  ctx.fillStyle = '#888780'
  ctx.fill()

  roundRect(lx + 8, 10, 50, 14, 1)
  ctx.fillStyle = '#d0d7dc'
  ctx.fill()
  ctx.strokeStyle = '#9098a0'
  ctx.lineWidth = 1
  ctx.stroke()

  roundRect(lx + 60, 10, 50, 14, 1)
  ctx.fillStyle = '#d0d7dc'
  ctx.fill()
  ctx.strokeStyle = '#9098a0'
  ctx.stroke()

  roundRect(lx + 10, 13, 20, 8, 1)
  ctx.fillStyle = '#9ac8e8'
  ctx.fill()
  ctx.strokeStyle = '#8898aa'
  ctx.lineWidth = 0.5
  ctx.stroke()

  roundRect(lx + 62, 13, 20, 8, 1)
  ctx.fillStyle = '#9ac8e8'
  ctx.fill()
  ctx.strokeStyle = '#8898aa'
  ctx.stroke()

  ctx.fillStyle = '#e8b800'
  ctx.fillRect(lx + 56, 14, 4, 8)
  ctx.fillRect(lx + 56, WORLD_H - 22, 4, 8)

  roundRect(lx + 8, WORLD_H - 24, 50, 14, 1)
  ctx.fillStyle = '#d0d7dc'
  ctx.fill()
  ctx.strokeStyle = '#9098a0'
  ctx.lineWidth = 1
  ctx.stroke()

  roundRect(lx + 60, WORLD_H - 24, 50, 14, 1)
  ctx.fillStyle = '#d0d7dc'
  ctx.fill()
  ctx.strokeStyle = '#9098a0'
  ctx.stroke()

  roundRect(lx + 10, WORLD_H - 21, 20, 8, 1)
  ctx.fillStyle = '#9ac8e8'
  ctx.fill()
  ctx.strokeStyle = '#8898aa'
  ctx.lineWidth = 0.5
  ctx.stroke()

  roundRect(lx + 62, WORLD_H - 21, 20, 8, 1)
  ctx.fillStyle = '#9ac8e8'
  ctx.fill()
  ctx.strokeStyle = '#8898aa'
  ctx.stroke()

  ctx.fillStyle = '#e8b800'
  ctx.fillRect(lx + 56, WORLD_H - 22, 4, 8)
}

function drawWindows() {
  ctx.fillStyle = 'rgba(154,200,232,0.65)'

  const groupsX = [
    70, 210,
    478, 615,
    890, 1030,
    1305, 1445,
    1713, 1850,
    2125, 2265,
    2540, 2680,
    2955, 3095
  ]

  const seatGroupW = 123

  groupsX.forEach(x => {
    ctx.fillRect(x, 14, seatGroupW, 8)
    ctx.fillRect(x, 345, seatGroupW, 8)
  })
}

function drawEndWall(x, right) {
  roundRect(x, 10, 50, WORLD_H - 20, 4)
  ctx.fillStyle = '#0a0a0a'
  ctx.fill()

  ctx.save()
  ctx.translate(x + 25, WORLD_H / 2)
  ctx.rotate(right ? Math.PI / 2 : -Math.PI / 2)
  ctx.fillStyle = '#ff5500'
  ctx.font = 'bold 8px "Helvetica Neue", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(right ? 'MOT STOCKHOLM C' : 'MOT UPPSALA C', 0, 3)
  ctx.restore()
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

function drawNpc(npc) {
  const { x, y, id, spoken, name } = npc
  const near = dist(player.value, npc) < 70

  ctx.save()
  ctx.translate(x, y)

  if (near) {
    ctx.beginPath()
    ctx.arc(0, 0, 32, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(250,200,50,0.1)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(250,200,50,0.3)'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }

  ctx.beginPath()
  ctx.ellipse(0, 20, 16, 5, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.fill()

  ctx.fillStyle = NPC_COLORS[id].body
  roundRect(-14, -10, 28, 30, 5)
  ctx.fill()

  ctx.fillStyle = NPC_COLORS[id].jacket
  roundRect(-12, -10, 24, 16, 4)
  ctx.fill()

  ctx.fillStyle = NPC_COLORS[id].skin
  ctx.fillRect(-4, -22, 8, 14)

  ctx.beginPath()
  ctx.ellipse(0, -30, 13, 16, 0, 0, Math.PI * 2)
  ctx.fillStyle = NPC_COLORS[id].skin
  ctx.fill()

  ctx.beginPath()
  ctx.ellipse(0, -38, 13, 10, 0, 0, Math.PI)
  ctx.fillStyle = NPC_COLORS[id].hair
  ctx.fill()

  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.ellipse(-4, -32, 3, 2.5, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(4, -32, 3, 2.5, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = NPC_COLORS[id].eyes
  ctx.beginPath()
  ctx.arc(-4, -32, 1.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(4, -32, 1.5, 0, Math.PI * 2)
  ctx.fill()

  drawNpcProp(id)

  if (spoken) {
    ctx.fillStyle = '#3d8b37'
    ctx.beginPath()
    ctx.arc(14, -44, 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(10, -44)
    ctx.lineTo(13, -41)
    ctx.lineTo(18, -48)
    ctx.stroke()
  }

  if (near && !talkMode.value) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    roundRect(-24, -64, 48, 16, 4)
    ctx.fill()
    ctx.fillStyle = '#f0c030'
    ctx.font = 'bold 9px "Helvetica Neue", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('[E] prata', 0, -53)
  }

  ctx.font = '9px "Helvetica Neue", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillStyle = near ? '#f0c030' : (spoken ? '#5ab84a' : '#555')
  ctx.fillText(name, 0, 34)

  ctx.restore()
}

const NPC_COLORS = [
  { skin: '#c49a6c', hair: '#2a1a08', eyes: '#3a2a10', body: '#4a3820', jacket: '#3a2a14' },
  { skin: '#d4a87a', hair: '#5a4030', eyes: '#5a3a20', body: '#6a5040', jacket: '#8a6a50' },
  { skin: '#b8885a', hair: '#1a1210', eyes: '#2a2020', body: '#2a2820', jacket: '#1a1a14' },
  { skin: '#c0905c', hair: '#1a1a20', eyes: '#2030aa', body: '#1a1a2a', jacket: '#2a2a3a' }
]

function drawNpcProp(id) {
  if (id === 0) {
    ctx.fillStyle = '#3a5a3a'
    roundRect(-18, 8, 36, 14, 6)
    ctx.fill()
    ctx.fillStyle = '#4a7a4a'
    roundRect(-16, 10, 20, 10, 4)
    ctx.fill()
  } else if (id === 1) {
    ctx.fillStyle = '#c8c0a0'
    roundRect(10, -4, 16, 18, 3)
    ctx.fill()
    ctx.fillStyle = '#b8b090'
    roundRect(-24, 0, 14, 16, 3)
    ctx.fill()
  } else if (id === 2) {
    ctx.fillStyle = '#e8e0c0'
    roundRect(-20, -8, 22, 14, 2)
    ctx.fill()
    ctx.fillStyle = '#aaa898'
    for (let i = -18; i < 0; i += 4) {
      ctx.fillRect(i, -6 + (i % 8 === 0 ? 0 : 2), 8, 1)
    }
  } else {
    ctx.fillStyle = '#1a1a1a'
    roundRect(10, -6, 10, 16, 2)
    ctx.fill()
    ctx.fillStyle = '#2a4a8a'
    ctx.fillRect(11, -4, 8, 12)
  }
}

function drawPlayerChar() {
  const { x, y } = player.value

  ctx.save()
  ctx.translate(x, y)

  ctx.beginPath()
  ctx.ellipse(0, 20, 14, 4, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.fill()

  ctx.fillStyle = '#1a5fa8'
  roundRect(-13, -10, 26, 30, 5)
  ctx.fill()

  ctx.fillStyle = '#124880'
  ctx.fillRect(-4, -8, 8, 6)

  ctx.fillStyle = '#d4a06a'
  ctx.fillRect(-4, -22, 8, 14)

  ctx.beginPath()
  ctx.ellipse(0, -30, 12, 14, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#d4a06a'
  ctx.fill()

  ctx.beginPath()
  ctx.ellipse(0, -38, 12, 9, 0, 0, Math.PI)
  ctx.fillStyle = '#2a1a10'
  ctx.fill()

  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.ellipse(-3.5, -32, 2.8, 2.2, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(3.5, -32, 2.8, 2.2, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#1a3a8a'
  ctx.beginPath()
  ctx.arc(-3.5, -32, 1.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(3.5, -32, 1.4, 0, Math.PI * 2)
  ctx.fill()

  ctx.font = 'bold 9px "Helvetica Neue", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#1a5fa8'
  ctx.fillText('DU', 0, 34)

  ctx.restore()
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function getNear() {
  return NPCS.value.find(n => dist(player.value, n) < 70) || null
}

function onKeyDown(e) {
  keys[e.key] = true

  if ((e.key === 'e' || e.key === 'E') && !talkMode.value) {
    const n = getNear()
    if (n) startTalk(n)
  }

  if (e.key === 'Escape' && talkMode.value) endTalk()

  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault()
  }
}

function onKeyUp(e) {
  keys[e.key] = false
}

function handleClick(e) {
  if (talkMode.value) return

  const rect = cv.value.getBoundingClientRect()
  const sc = getScale()
  const mx = (e.clientX - rect.left) / sc + camX.value
  const my = (e.clientY - rect.top) / sc

  NPCS.value.forEach(n => {
    if (Math.hypot(mx - n.x, my - n.y) < 40) startTalk(n)
  })
}

function gameLoop() {
  if (!gameOver && !talkMode.value) {
    const spd = 5
    let dx = 0
    let dy = 0

    if (keys['ArrowLeft'] || keys['a'] || keys['A']) dx = -spd
    else if (keys['ArrowRight'] || keys['d'] || keys['D']) dx = spd

    if (keys['ArrowUp'] || keys['w'] || keys['W']) dy = -spd
    else if (keys['ArrowDown'] || keys['s'] || keys['S']) dy = spd

    player.value.x = Math.max(40, Math.min(WORLD_W - 40, player.value.x + dx))
    player.value.y = Math.max(20, Math.min(WORLD_H - 20, player.value.y + dy))

    updateCamera()
  }

  drawScene()
  animFrame = requestAnimationFrame(gameLoop)
}

function startTalk(npc) {
  activeNpc = npc
  talkMode.value = true
  npcTurn = 0
  messages.value = []

  addMsg('sys', '— Du sätter dig bredvid ' + npc.name + ' — [Esc för att gå]')
  addMsg('npc', '<b>' + npc.name + ':</b> <i>' + npc.look + '</i><br>"' + pick(npc.convo.intro) + '"')

  nextTick(() => {
    txtEl.value?.focus()
  })
}

function endTalk() {
  talkMode.value = false
  activeNpc = null
  addMsg('sys', '— Du reser dig upp —')
}

function sendLine() {
  if (!activeNpc || !talkMode.value) return

  const t = inputText.value.trim()
  if (!t) return

  inputText.value = ''
  addMsg('player', t)
  setTimeout(() => respond(activeNpc, t), 380)
}

function respond(npc, text) {
  const low = text.toLowerCase()
  const topics = npc.convo.topics
  let hit = false

  for (const [pat, resp] of Object.entries(topics)) {
    if (pat === 'default') continue

    if (pat.split('|').some(k => low.includes(k))) {
      addMsg('npc', '<b>' + npc.name + ':</b> ' + resp)

      if (resp.includes(npc.digit) && !clues.value[npc.clue]) {
        setTimeout(() => {
          clues.value = { ...clues.value, [npc.clue]: npc.clueText }
          npc.spoken = true
          addMsg('clue', '🔍 Ledtråd: ' + npc.clueText)
          drawScene()
        }, 500)
      }

      hit = true
      break
    }
  }

  if (!hit) {
    const d = topics.default
    addMsg('npc', '<b>' + npc.name + ':</b> ' + (Array.isArray(d) ? d[npcTurn % d.length] : d))
    npcTurn++
  }
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function addMsg(type, html) {
  messages.value.push({ type, html })

  nextTick(() => {
    if (dialogEl.value) {
      dialogEl.value.scrollTop = dialogEl.value.scrollHeight
    }
  })
}

function tryCode() {
  if (gameOver) return

  const v = codeInput.value.trim()

  if (v.length !== 4) {
    addMsg('bad', 'Koden är 4 siffror.')
    return
  }

  if (v === SECRET) {
    endGame(true, 'Dörren öppnas!', 'Du sätter ihop 7, 3, 4, 1 och låset klickar. Friheten väntar.')
  } else {
    addMsg('bad', 'Fel kod. Försök igen.')
    codeInput.value = ''
  }
}

function endGame(win, title, sub) {
  gameOver = true
  clearInterval(timerIv)
  overlay.value = { show: true, title: (win ? '🔓 ' : '🚨 ') + title, sub }
}

function restart() {
  gameOver = false
  talkMode.value = false
  activeNpc = null
  player.value = { x: 120, y: GANG_MID }
  clues.value = {}
  timerSec.value = 540

  NPCS.value.forEach(n => {
    n.spoken = false
  })

  overlay.value = { show: false, title: '', sub: '' }
  messages.value = []

  addMsg('sys', 'Hitta de fyra personerna och ta reda på deras siffror. 9 minuter kvar.')

  clearInterval(timerIv)
  timerIv = setInterval(tickTimer, 1000)

  updateCamera()
  drawScene()
}

function tickTimer() {
  if (gameOver) return

  timerSec.value--

  if (timerSec.value <= 0) {
    endGame(false, 'Centralstationen.', 'Polisen stiger ombord. Koden var ' + SECRET + '.')
  }
}

let resizeObs = null

onMounted(() => {
  setupCanvas()

  resizeObs = new ResizeObserver(() => {
    setupCanvas()
    updateCamera()
    drawScene()
  })

  resizeObs.observe(cv.value.parentElement)

  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('keyup', onKeyUp)

  addMsg('sys', 'Du är inlåst i vagn 4. Fyra personer vet varsin siffra. 9 minuter.')
  addMsg('sys', 'Rörelse: piltangenter / WASD. E nära en person för att prata.')

  updateCamera()
  animFrame = requestAnimationFrame(gameLoop)
  timerIv = setInterval(tickTimer, 1000)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeyDown)
  document.removeEventListener('keyup', onKeyUp)
  cancelAnimationFrame(animFrame)
  clearInterval(timerIv)
  resizeObs?.disconnect()
})
</script>

<style scoped>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

#root {
  width: 100vw;
  height: 100vh;
  background: #0e0f11;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  position: relative;
}

#hud {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #0a0b0d;
  border-bottom: 1px solid #1e2228;
  flex-shrink: 0;
  min-height: 38px;
}

#hud-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

#hud-route {
  font-size: 11px;
  font-weight: 600;
  color: #5a6470;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

#hud-sep { color: #2a2e34; font-size: 11px; }

#hud-timer {
  font-size: 12px;
  color: #4a5260;
  font-variant-numeric: tabular-nums;
}

#hud-timer.urgent { color: #c84040; }

#clue-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #4a6a30;
  background: rgba(50,80,20,0.2);
  border: 0.5px solid #2a4a10;
  padding: 3px 10px;
  border-radius: 20px;
}

.clue-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #2a3a20;
  border: 1px solid #3a5a20;
  transition: all 0.3s;
}
.clue-dot.filled {
  background: #5a9a2a;
  border-color: #7aba40;
  box-shadow: 0 0 4px rgba(90,154,42,0.5);
}

#canvas-wrap {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
}

#canvas-wrap canvas {
  display: block;
  image-rendering: auto;
}

#bottom-panel {
  flex-shrink: 0;
  height: 28vh;
  min-height: 180px;
  max-height: 260px;
  display: flex;
  flex-direction: column;
  background: #0a0b0d;
  border-top: 1px solid #1e2228;
}

#controls-hint {
  display: flex;
  gap: 16px;
  padding: 5px 14px;
  font-size: 10px;
  color: #2a3038;
  border-bottom: 1px solid #141618;
  flex-shrink: 0;
}

#dialog {
  flex: 1;
  overflow-y: auto;
  padding: 8px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  scrollbar-width: thin;
  scrollbar-color: #1e2228 transparent;
}

.dmsg {
  font-size: 12px;
  line-height: 1.5;
  padding: 5px 10px;
  border-radius: 6px;
  max-width: 88%;
}

.dmsg.npc {
  background: #14171c;
  color: #b8c4d0;
  align-self: flex-start;
  border-left: 2px solid #1a5fa8;
}
.dmsg.player {
  background: #0d1e36;
  color: #6aa8e8;
  align-self: flex-end;
}
.dmsg.sys {
  background: transparent;
  color: #2a3038;
  align-self: center;
  font-size: 10px;
}
.dmsg.clue {
  background: rgba(40,70,15,0.35);
  color: #8ac850;
  border: 0.5px solid #2a4a10;
  align-self: center;
  text-align: center;
  font-size: 11px;
  border-radius: 8px;
}
.dmsg.bad {
  background: rgba(140,30,30,0.2);
  color: #e06060;
  align-self: center;
  font-size: 11px;
}

#input-row {
  display: flex;
  gap: 6px;
  padding: 6px 12px;
  border-top: 1px solid #141618;
  flex-shrink: 0;
}

#input-row input {
  flex: 1;
  background: #12151a;
  border: 0.5px solid #22272e;
  border-radius: 6px;
  color: #c8d4e0;
  padding: 7px 10px;
  font-size: 12px;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  outline: none;
  transition: border-color 0.2s;
}
#input-row input:focus { border-color: #1a5fa8; }
#input-row input:disabled { opacity: 0.3; }

#input-row button {
  background: #0d1e36;
  border: 0.5px solid #1a3a60;
  border-radius: 6px;
  color: #4a8acc;
  padding: 7px 14px;
  font-size: 12px;
  cursor: pointer;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  transition: background 0.15s;
}
#input-row button:hover:not(:disabled) { background: #132a4a; }
#input-row button:disabled { opacity: 0.3; cursor: default; }

#code-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  border-top: 1px solid #141618;
  flex-shrink: 0;
}

.code-lbl {
  font-size: 10px;
  color: #2a3038;
  letter-spacing: 0.1em;
  font-weight: 600;
}

.code-in {
  width: 80px;
  background: #12151a;
  border: 0.5px solid #22272e;
  border-radius: 6px;
  color: #c8a020;
  padding: 5px 8px;
  font-size: 14px;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  text-align: center;
  letter-spacing: 4px;
  outline: none;
}
.code-in:focus { border-color: #c8a020; }

.code-btn {
  background: transparent;
  border: 0.5px solid #22272e;
  border-radius: 6px;
  color: #4a5260;
  padding: 5px 10px;
  font-size: 11px;
  cursor: pointer;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  transition: all 0.15s;
}
.code-btn:hover { border-color: #c8a020; color: #c8a020; }

.clues-found {
  font-size: 10px;
  color: #2a4a18;
  flex: 1;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

#overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.ov-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 40px;
  background: #0e0f11;
  border: 0.5px solid #1e2228;
  border-radius: 12px;
}

.ov-title {
  font-size: 22px;
  font-weight: 500;
  color: #c8a020;
  letter-spacing: 0.02em;
}

.ov-sub {
  font-size: 13px;
  color: #3a4250;
  text-align: center;
  max-width: 320px;
  line-height: 1.6;
}

.ov-btn {
  padding: 9px 24px;
  background: #0d1e36;
  border: 0.5px solid #1a3a60;
  border-radius: 6px;
  color: #4a8acc;
  font-size: 13px;
  cursor: pointer;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  transition: background 0.15s;
  margin-top: 4px;
}
.ov-btn:hover { background: #132a4a; }
</style>
