<script setup>

import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const showButton = ref(false)

function beginGame() {
  router.push('/level-3')
}
const bgCanvas = ref(null)
const answer = ref('')
const infoOpen = ref(false)
const rewardVisible = ref(false)
const panelCollapsed = ref(false)

const scans = ref(0)
const hints = ref(0)
const feedback = ref('')
const feedbackType = ref('')
const logEntries = ref([])
const hintEntries = ref([])

let animationId = null
let animationCanvas = null

const advancedHints = [
  'Leta inte efter störst avvikelse. Störst avvikelse kan vara legitim kompensation.',
  'Behandla checksum som en konsekvens av mätmodellen, inte som ett separat facit.',
  'Dela upp paketen i två familjer: nära carrier/phase och utanför carrier/phase.',
  'En nod upprepar samma checksum trots att dess mätvärden tillhör fel familj.',
  'Frågan är inte vilken signal som är fulast, utan vilken som är inkonsekvent med sin egen modell.'
]

const packets = [
  { node: 'A7', freq: 10.004, phase: +0.08, checksum: '7FA2', snr: 41.8 },
  { node: 'C9', freq: 9.986, phase: -0.31, checksum: '7FA2', snr: 39.4 },
  { node: 'B7', freq: 10.011, phase: +0.21, checksum: '7FA2', snr: 43.1 },
  { node: 'D2', freq: 9.997, phase: -0.04, checksum: '7FA2', snr: 40.7 },
  { node: 'E4', freq: 10.006, phase: +0.12, checksum: '7FB8', snr: 42.2 },

  { node: 'A7', freq: 10.008, phase: +0.11, checksum: '7FA2', snr: 41.2 },
  { node: 'C9', freq: 9.981, phase: -0.38, checksum: '7FA9', snr: 38.8 },
  { node: 'B7', freq: 10.009, phase: +0.18, checksum: '7FA2', snr: 43.4 },
  { node: 'D2', freq: 10.002, phase: +0.02, checksum: '7FA2', snr: 40.1 },
  { node: 'E4', freq: 10.003, phase: +0.09, checksum: '7FB8', snr: 42.9 },

  { node: 'A7', freq: 10.012, phase: +0.28, checksum: '7FA2', snr: 40.9 },
  { node: 'C9', freq: 9.979, phase: -0.44, checksum: '7FA9', snr: 38.1 },
  { node: 'B7', freq: 10.014, phase: +0.33, checksum: '7FA2', snr: 42.7 },
  { node: 'D2', freq: 9.991, phase: -0.16, checksum: '7FA2', snr: 40.5 },
  { node: 'E4', freq: 10.007, phase: +0.13, checksum: '7FB8', snr: 42.4 },

  { node: 'A7', freq: 9.985, phase: -0.36, checksum: '7FA9', snr: 39.6 },
  { node: 'B7', freq: 10.017, phase: +0.39, checksum: '7FA9', snr: 41.9 },
  { node: 'E4', freq: 10.002, phase: +0.05, checksum: '7FB8', snr: 43.0 }
]

function checksumFamily(freq, phase) {
  const freqDelta = Math.abs(freq - 10.0)
  const phaseDelta = Math.abs(phase)

  if (freqDelta <= 0.015 && phaseDelta <= 0.35) {
    return '7FA2'
  }

  return '7FA9'
}

function togglePanel() {
  panelCollapsed.value = !panelCollapsed.value
}

function requestHint() {
  if (hints.value >= advancedHints.length) {
    feedback.value = 'Inga fler ledtrådar tillgängliga. Puss-skulden är redan maxad.'
    feedbackType.value = 'error'
    return
  }

  hintEntries.value.push({
    number: hints.value + 1,
    text: advancedHints[hints.value]
  })

  hints.value++
}

function runScan() {
  if (scans.value >= packets.length) return

  const selected = packets[scans.value]
  const freqOffset = (selected.freq - 10.0).toFixed(3)

  logEntries.value.unshift({
    number: scans.value + 1,
    node: selected.node,
    carrier: selected.freq.toFixed(3),
    freqOffset,
    phase: `${selected.phase >= 0 ? '+' : ''}${selected.phase.toFixed(2)}`,
    snr: selected.snr.toFixed(1),
    checksum: selected.checksum
  })

  scans.value++
}

function validateAnswer() {
  const value = answer.value.trim().toUpperCase()

  if (scans.value < packets.length) {
    feedback.value = 'Alla 18 paket krävs innan slutsatsen kan verifieras.'
    feedbackType.value = 'error'
    return
  }

  const suspicious = packets.reduce((acc, packet) => {
    const expected = checksumFamily(packet.freq, packet.phase)

    if (packet.checksum !== expected) {
      acc[packet.node] = (acc[packet.node] || 0) + 1
    }

    return acc
  }, {})

  const resolvedNode = Object.entries(suspicious).sort((a, b) => b[1] - a[1])[0][0]

  if (value === resolvedNode) {
    feedback.value = 'Instabil nod identifierad.'
    feedbackType.value = 'success'
    rewardVisible.value = true
  } else {
    feedback.value = 'Fel nod. Fortsätt analysera signalerna.'
    feedbackType.value = 'error'
  }
}

function initCanvas() {
  class Dots {
    constructor(width, height, spacing) {
      this.spacing = spacing
      this.dots = []
      this.alphaStep = 1 / 10
      this.cols = Math.floor(width / spacing)
      this.rows = Math.floor(height / spacing)

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      canvas.width = width
      canvas.height = height
      this.canvas = canvas
      this.ctx = ctx

      this.draw()
    }

    draw() {
      const ctx = this.ctx
      const spacing = this.spacing

      ctx.fillStyle = 'rgba(24, 129, 141, .1)'
      this.dots = Array.apply(null, Array(this.cols)).map((n, x) => {
        return Array.apply(null, Array(this.rows)).map((p, y) => {
          const dot = {
            opacity: 0.1,
            x: x * spacing,
            y: y * spacing
          }

          ctx.fillRect(dot.x, dot.y, 1, 1)
          return dot
        })
      })
    }

    ghost() {
      const ghostDots = document.createElement('canvas')
      ghostDots.width = this.canvas.width
      ghostDots.height = this.canvas.height

      const dotsCtx = ghostDots.getContext('2d')
      dotsCtx.fillStyle = 'rgb(24, 129, 141)'

      this.dots.forEach((col) => {
        col.forEach((dot) => {
          dotsCtx.fillRect(dot.x, dot.y, 1, 1)
        })
      })

      return ghostDots
    }
  }

  class Col {
    constructor(rows) {
      this.rows = Array.apply(null, Array(rows)).map(() => 0)
      this.free = rows
    }
  }

  class Circuit {
    constructor(start, size) {
      this.start = start
      this.cellSize = size
      this.path = []
      this.end = null
      this.things = []
      this.length = 0
      this.coords = []
    }
  }

  class Thing {
    constructor(circuit, velocity, done = 0) {
      this.circuit = circuit
      this.velocity = velocity
      this.done = done
      this.x = 0
      this.y = 0
      this.dots = []
    }

    update() {
      const circuit = this.circuit
      const size = circuit.cellSize
      const length = circuit.length
      const start = circuit.start
      const end = circuit.end
      const path = circuit.path

      let x = 0
      let y = 0

      this.done += this.velocity

      if (this.done <= 0) {
        this.done = 0
        this.velocity = -this.velocity
      } else if (this.done >= length) {
        this.done = length
        this.velocity = -this.velocity
      }

      if (this.done <= size / 2) {
        x = start[0] * size + size / 2 + this.done * path[0][0]
        y = start[1] * size + size / 2 + this.done * path[0][1]
      } else if (this.done > length - size / 2) {
        x = end[0] * size + size / 2 - (length - this.done) * path[path.length - 1][0]
        y = end[1] * size + size / 2 - (length - this.done) * path[path.length - 1][1]
      } else {
        const index = ~~(this.done / size)
        const done = this.done - index * size
        const dir = [path[index][0], path[index][1]]
        const point = circuit.coords[index]

        x = point[0] * size + size / 2 + done * dir[0]
        y = point[1] * size + size / 2 + done * dir[1]
      }

      this.x = ~~x
      this.y = ~~y
    }

    distFromSister() {
      const circuit = this.circuit
      let dist = Infinity
      let tmp = null

      circuit.things.forEach((thing) => {
        if (thing !== this) {
          tmp = Math.abs(thing.done - this.done)
          if (tmp < dist) dist = tmp
        }
      })

      return dist
    }
  }

  class Things {
    constructor(width, height) {
      this.width = width
      this.height = height
      this.canvas = document.createElement('canvas')
      this.canvas.width = width
      this.canvas.height = height
      this.ctx = this.canvas.getContext('2d')
      this.collection = []
    }

    create(circuit, velocity, done = 0) {
      const thing = new Thing(circuit, velocity, done)
      this.collection.push(thing)
      return thing
    }

    draw() {
      const ctx = this.ctx
      const radius = this.lightRadius
      const space = radius / 6

      let radial = null
      let diffX = null
      let diffY = null

      ctx.clearRect(0, 0, this.width, this.height)

      this.collection.forEach((thing) => {
        thing.update()
        radial = this.ghostRadial
        diffX = diffY = radius

        if (thing.distFromSister() <= space) {
          radial = this.ghostSuperRadial
          diffX = radial.width / 2
          diffY = radial.height / 2
        }

        ctx.drawImage(radial, thing.x - diffX, thing.y - diffY, radial.width, radial.height)
      })

      ctx.save()
      ctx.globalCompositeOperation = 'destination-in'
      ctx.drawImage(this.dotsGhost, 0, 0)
      ctx.restore()

      ctx.save()
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = '#afe3e9'
      this.collection.forEach((thing) => {
        ctx.beginPath()
        ctx.arc(thing.x, thing.y, radius / 6, 0, 2 * Math.PI, false)
        ctx.fill()
      })
      ctx.restore()
    }

    setDotsGhost(canvas) {
      this.dotsGhost = canvas
    }

    setLight(lightRadius) {
      this.lightRadius = lightRadius

      this.ghostRadial = document.createElement('canvas')
      this.ghostRadial.width = lightRadius * 2
      this.ghostRadial.height = lightRadius * 2

      const radialCtx = this.ghostRadial.getContext('2d')
      let gradient = radialCtx.createRadialGradient(
        lightRadius,
        lightRadius,
        lightRadius,
        lightRadius,
        lightRadius,
        0
      )

      gradient.addColorStop(0, 'rgba(255, 156, 44, 0)')
      gradient.addColorStop(1, 'rgba(255, 156, 44, .8)')

      radialCtx.fillStyle = gradient
      radialCtx.fillRect(0, 0, lightRadius * 2, lightRadius * 2)

      this.ghostSuperRadial = document.createElement('canvas')
      const radWidth = (this.ghostSuperRadial.width = lightRadius * 15)
      const radHeight = (this.ghostSuperRadial.height = lightRadius * 20)
      const superRadialCtx = this.ghostSuperRadial.getContext('2d')

      gradient = superRadialCtx.createRadialGradient(
        radWidth / 2,
        radHeight / 2,
        radWidth / 2,
        radWidth / 2,
        radHeight / 2,
        0
      )

      gradient.addColorStop(0, 'rgba(37, 203, 223, 0)')
      gradient.addColorStop(1, 'rgba(37, 203, 223, .6)')

      superRadialCtx.fillStyle = gradient
      superRadialCtx.beginPath()
      superRadialCtx.moveTo(radWidth / 2 + lightRadius / 6, radHeight / 2 - lightRadius / 3)
      superRadialCtx.lineTo(radWidth, 0)
      superRadialCtx.lineTo(radWidth / 2 + lightRadius / 3, radHeight / 2 - lightRadius / 6)
      superRadialCtx.lineTo((3 * radWidth) / 4, radHeight / 2)
      superRadialCtx.lineTo(radWidth / 2 + lightRadius / 3, radHeight / 2 + lightRadius / 6)
      superRadialCtx.lineTo(radWidth, radHeight)
      superRadialCtx.lineTo(radWidth / 2 + lightRadius / 6, radHeight / 2 + lightRadius / 3)
      superRadialCtx.lineTo(radWidth / 2, (3 * radHeight) / 4)
      superRadialCtx.lineTo(radWidth / 2 - lightRadius / 6, radHeight / 2 + lightRadius / 3)
      superRadialCtx.lineTo(0, radHeight)
      superRadialCtx.lineTo(radWidth / 2 - lightRadius / 3, radHeight / 2 + lightRadius / 6)
      superRadialCtx.lineTo(radWidth / 4, radHeight / 2)
      superRadialCtx.lineTo(radWidth / 2 - lightRadius / 3, radHeight / 2 - lightRadius / 6)
      superRadialCtx.lineTo(0, 0)
      superRadialCtx.lineTo(radWidth / 2 - lightRadius / 6, radHeight / 2 - lightRadius / 3)
      superRadialCtx.lineTo(radWidth / 2, radHeight / 4)
      superRadialCtx.lineTo(radWidth / 2 + lightRadius / 6, radHeight / 2 - lightRadius / 3)
      superRadialCtx.fill()
    }
  }

  let things = null

  class Circuits {
    constructor(width, height, size, minLength, maxLength) {
      this.size = size
      this.width = width
      this.height = height
      this.cols = ~~(width / size)
      this.rows = ~~(height / size)
      this.scene = Array.apply(null, Array(this.cols)).map(() => new Col(this.rows))
      this.collection = []
      this.minLength = minLength
      this.maxLength = maxLength
      this.populate()
      this.draw()
    }

    draw() {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const size = this.size

      canvas.width = this.width
      canvas.height = this.height

      ctx.strokeStyle = 'rgba(24, 68, 200, .3)'
      ctx.lineWidth = Math.round(size / 5)

      this.collection.forEach((circuit) => {
        const point = [circuit.start[0], circuit.start[1]]
        const path = circuit.path

        ctx.beginPath()
        ctx.moveTo(
          point[0] * size + size / 2 + path[0][0] * size / 8,
          point[1] * size + size / 2 + path[0][1] * size / 8
        )

        path.forEach((dir, index) => {
          point[0] += dir[0]
          point[1] += dir[1]

          if (index === path.length - 1) {
            ctx.lineTo(
              point[0] * size + size / 2 - dir[0] * size / 4,
              point[1] * size + size / 2 - dir[1] * size / 4
            )
          } else {
            ctx.lineTo(point[0] * size + size / 2, point[1] * size + size / 2)
          }
        })

        ctx.stroke()
      })

      ctx.lineWidth = ~~(this.size / 5)
      ctx.strokeStyle = 'rgba(24, 68, 200, .3)'

      this.collection.forEach((circuit) => {
        ctx.beginPath()
        ctx.arc(circuit.start[0] * size + size / 2, circuit.start[1] * size + size / 2, size / 4, 0, 2 * Math.PI, false)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(circuit.end[0] * size + size / 2, circuit.end[1] * size + size / 2, size / 4, 0, 2 * Math.PI, false)
        ctx.stroke()
      })

      this.canvas = canvas
    }

    populate() {
      let start = null
      let n = 1000
      let length = 0
      let dir = null

      while ((start = this.getStart()) && n--) {
        length = this.minLength + ~~(Math.random() * (this.maxLength - this.minLength))
        dir = this.getDir(start)
        this.setUsed(start[0], start[1])

        if (dir[0] !== 0 || dir[1] !== 0) {
          const circuit = new Circuit(start, this.size)
          let moving = true
          const path = [start[0], start[1]]
          length--

          while (moving && length) {
            circuit.path.push(dir)
            circuit.coords.push([path[0], path[1]])
            path[0] += dir[0]
            path[1] += dir[1]
            this.setUsed(path[0], path[1])
            dir = this.getDir(path, dir)
            if (dir[0] === 0 && dir[1] === 0) moving = false
            length--
          }

          if (circuit.path.length >= this.minLength) {
            circuit.end = path
            circuit.coords.push([path[0], path[1]])

            let speed = Math.random() * 0.5 + 0.5
            circuit.things.push(things.create(circuit, speed * 3))

            if (circuit.path.length > this.maxLength / 6) {
              speed = Math.random() * 0.5 + 0.5
              circuit.things.push(things.create(circuit, -speed, circuit.path.length * this.size))
            }

            if (circuit.path.length > this.maxLength / 1.5) {
              speed = Math.random() * 0.5 + 0.5 * (Math.random() >= 0.5 ? -1 : 1)
              circuit.things.push(things.create(circuit, speed, Math.random() * circuit.path.length * this.size))
            }

            circuit.length = circuit.path.length * this.size
            this.collection.push(circuit)
          }
        }
      }
    }

    getStart() {
      const free = []
      let result = false

      this.scene.forEach((col, index) => {
        if (col.free) free.push(index)
      })

      if (free.length) {
        const col = this.pickOne(free)
        free.length = 0

        this.scene[col].rows.forEach((row, index) => {
          if (row === 0) free.push(index)
        })

        const row = this.pickOne(free)
        result = [col, row]
      }

      return result
    }

    pickOne(array) {
      return array[~~(Math.random() * array.length)]
    }

    setUsed(x, y) {
      this.scene[x].rows[y] = 1
      this.scene[x].free--
    }

    isAvailable(x, y) {
      return typeof this.scene[x] !== 'undefined' &&
        typeof this.scene[x].rows[y] !== 'undefined' &&
        this.scene[x].rows[y] === 0
    }

    getDir(fromPoint, oldDir = null) {
      const possibleX = []
      const possibleY = []
      const result = [0, 0]

      if (oldDir && Math.random() <= 0.5) {
        if (this.isAvailable(fromPoint[0] + oldDir[0], fromPoint[1] + oldDir[1])) {
          return oldDir
        }
      }

      if (this.isAvailable(fromPoint[0] - 1, fromPoint[1])) possibleX.push(-1)
      if (this.isAvailable(fromPoint[0] + 1, fromPoint[1])) possibleX.push(1)
      if (this.isAvailable(fromPoint[0], fromPoint[1] - 1)) possibleY.push(-1)
      if (this.isAvailable(fromPoint[0], fromPoint[1] + 1)) possibleY.push(1)

      if (possibleX.length && Math.random() < 0.5) {
        result[0] = this.pickOne(possibleX)
      } else if (possibleY.length) {
        result[1] = this.pickOne(possibleY)
      }

      return result
    }
  }

  class Background {
    constructor(width, height, dots, circuits) {
      this.width = width
      this.height = height
      this.dots = dots
      this.circuits = circuits
    }

    getBackground() {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      canvas.width = this.width
      canvas.height = this.height
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, this.width, this.height)
      ctx.drawImage(this.dots.canvas, 0, 0)
      ctx.drawImage(this.circuits.canvas, 0, 0)

      return canvas
    }
  }

  const canvasEl = bgCanvas.value
  const width = (canvasEl.width = window.innerWidth)
  const height = (canvasEl.height = window.innerHeight)
  const bgCtx = canvasEl.getContext('2d')

  const dots = new Dots(width, height, 2)

  things = new Things(width, height)
  things.setDotsGhost(dots.ghost())
  things.setLight(dots.spacing * 4)

  const maxLength = 52
  const minLength = 6
  const cellSize = 20
  const circuits = new Circuits(width, height, cellSize, minLength, maxLength)

  const background = new Background(width, height, dots, circuits)
  const staticBG = background.getBackground()
  bgCtx.drawImage(staticBG, 0, 0)

  animationCanvas = document.createElement('canvas')
const ctx = animationCanvas.getContext('2d')

animationCanvas.width = width
animationCanvas.height = height
animationCanvas.className = 'animation-canvas'

animationCanvas.style.position = 'absolute'
animationCanvas.style.top = '0'
animationCanvas.style.left = '0'
animationCanvas.style.width = `${width}px`
animationCanvas.style.height = `${height}px`
animationCanvas.style.zIndex = '2'
animationCanvas.style.pointerEvents = 'none'

canvasEl.style.position = 'absolute'
canvasEl.style.top = '0'
canvasEl.style.left = '0'
canvasEl.style.width = `${width}px`
canvasEl.style.height = `${height}px`
canvasEl.style.zIndex = '1'

canvasEl.parentElement.appendChild(animationCanvas)

function loop() {
  ctx.clearRect(0, 0, width, height)

  things.draw()

  ctx.drawImage(things.canvas, 0, 0)

  animationId = requestAnimationFrame(loop)
}

loop()
}

onMounted(() => {
  initCanvas()
})

onBeforeUnmount(() => {
  if (animationId) cancelAnimationFrame(animationId)
  if (animationCanvas) animationCanvas.remove()
})
</script>

<template>
  <main class="signal-room">
    <canvas ref="bgCanvas"></canvas>

    <div class="room-ui">
      <button
        class="info-button floating-info"
        type="button"
        aria-label="Visa gåta"
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
            anomaly diagnostics
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
          <p class="puzzle-text">
            <strong>Diagnostik aktiv.</strong>
            En radar-array skickar 18 mätpaket. Ingen enskild rad avslöjar felet.
            Identifiera noden vars checksum inte kan förklaras av frekvens- och fasmodellen.
          </p>

          <div class="diagnostics">
            <button type="button" @click="runScan">Run diagnostic scan</button>
            <span>{{ scans }} / 18 packets</span>
          </div>

          <div class="hint-system">
            <button type="button" @click="requestHint">Request clue</button>
            <span>{{ hints }} / 5 clues · {{ hints }} puss{{ hints === 1 ? '' : 'ar' }} skyldig</span>
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

          <div class="logbook">
            <div
              v-for="entry in logEntries"
              :key="entry.number"
              class="log-entry"
            >
              <strong>PACKET {{ String(entry.number).padStart(2, '0') }}</strong><br />
              NODE: {{ entry.node }}<br />
              CARRIER: {{ entry.carrier }} GHz<br />
              ΔF: {{ entry.freqOffset }} GHz<br />
              PHASE: {{ entry.phase }} rad<br />
              SNR: {{ entry.snr }} dB<br />
              CHECKSUM: {{ entry.checksum }}<br />
              MODEL: hidden
            </div>
          </div>

          <div class="command-row">
            <div class="prompt">scope@r25:~$</div>
            <input
              v-model="answer"
              type="text"
              placeholder="ENTER NODE ID"
              @keydown.enter="validateAnswer"
            />
            <button type="button" @click="validateAnswer">Submit</button>
          </div>

          <div
            class="feedback"
            :class="feedbackType"
          >
            {{ feedback }}
          </div>
        </div>
      </section>

      <div class="center-markers">
        <div class="node-marker n-a3">A7</div>
        <div class="node-marker n-c9">C9</div>
        <div class="node-marker n-e4">E4</div>
        <div class="node-marker n-b7">B7</div>
        <div class="node-marker n-d2">D2</div>
      </div>
    </div>

    <div
      class="info-modal"
      :class="{ visible: infoOpen }"
      @click.self="infoOpen = false"
    >
      <div class="info-card">
        <div class="info-card-header">
          <h2>Gåta</h2>
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
          Ett av radarnätverkets fem noder bryter mot resonansmodellen.
          Systemet innehåller brus och falska avvikelser.
          För att identifiera rätt nod måste du:<br /><br />
          — analysera frekvensdrift<br />
          — jämföra fasförskjutning<br />
          — verifiera checksum-konsensus<br />
          — förstå vilka anomalier som är verkliga och vilka som är kompensationsartefakter<br /><br />
          Tips: stabila noder delar checksum-familj när frekvensavvikelsen är under ±0.015 GHz
          och fasen ligger inom ±0.35 rad. En nod ser nästan stabil ut men bryter checksum-konsensus.
        </p>
      </div>
    </div>

    <div
      class="reward"
      :class="{ visible: rewardVisible }"
    >
      <div class="reward-card">
        <p>anomaly isolated / key fragment recovered</p>
        <div class="fragment">S</div>
      </div>
    </div>
  </main>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.signal-room {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #020307;
  color: white;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

canvas {
  position: absolute;
  top: 0;
  left: 0;
}

.signal-room::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  background:
    radial-gradient(circle at 50% 20%, rgba(60, 150, 255, 0.12), transparent 32%),
    radial-gradient(circle at center, transparent 42%, rgba(0,0,0,0.72)),
    linear-gradient(rgba(255,255,255,0.025) 50%, rgba(0,0,0,0.12) 50%);
  background-size: 100% 100%, 100% 100%, 100% 4px;
  mix-blend-mode: screen;
}

.room-ui {
  position: fixed;
  inset: 0;
  z-index: 10;
  pointer-events: none;
  display: block;
  padding: 28px;
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
  transition: 0.35s ease;
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
  box-shadow: 0 50px 160px rgba(0,0,0,0.78), 0 0 100px rgba(122,235,255,0.12);
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

.center-markers {
  position: fixed;
  inset: 0;
  z-index: 12;
  pointer-events: none;
}

.node-marker {
  position: absolute;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(160, 225, 255, 0.2);
  color: rgba(220, 245, 255, 0.64);
  background: rgba(5, 14, 22, 0.58);
  backdrop-filter: blur(14px);
  box-shadow: 0 0 34px rgba(60, 180, 255, 0.1);
  font-size: 0.68rem;
  letter-spacing: 0.08em;
}

.n-a3 { left: 16%; top: 23%; }
.n-c9 { left: 72%; top: 28%; }
.n-e4 { left: 38%; top: 48%; }
.n-b7 { left: 58%; top: 64%; }
.n-d2 { left: 24%; top: 72%; }

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
  box-shadow: 0 30px 100px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08);
  transition: 0.45s ease;
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

.puzzle-text {
  margin: 0;
  color: rgba(220, 245, 255, 0.58);
  line-height: 1.7;
  font-size: 0.88rem;
}

.puzzle-text strong {
  color: rgba(255,255,255,0.9);
  font-weight: 500;
}

.diagnostics,
.hint-system {
  display: flex;
  align-items: center;
  gap: 12px;
  border-top: 1px solid rgba(255,255,255,0.08);
  padding-top: 14px;
}

.diagnostics span,
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

.logbook {
  display: grid;
  gap: 8px;
  max-height: 168px;
  overflow: auto;
  padding-right: 4px;
}

.log-entry {
  border-left: 2px solid rgba(122,235,255,0.28);
  padding: 9px 11px;
  background: rgba(122,235,255,0.045);
  color: rgba(220,245,255,0.66);
  font-size: 0.78rem;
  line-height: 1.45;
}

.log-entry strong {
  color: rgba(255,255,255,0.92);
  font-weight: 500;
}

.command-row {
  display: flex;
  gap: 10px;
  align-items: center;
  border-top: 1px solid rgba(255,255,255,0.08);
  padding-top: 14px;
}

.prompt {
  color: rgba(122, 235, 255, 0.8);
  white-space: nowrap;
}

input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: white;
  font: inherit;
  text-transform: uppercase;
  caret-color: #7aebff;
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
  transition: 0.25s ease;
}

button:hover {
  transform: translateY(-2px);
  background: rgba(122, 235, 255, 0.15);
  box-shadow: 0 0 32px rgba(122,235,255,0.14);
}

.feedback {
  min-height: 22px;
  color: rgba(220, 245, 255, 0.58);
  font-size: 0.84rem;
}

.feedback.error {
  color: #ff8585;
}

.feedback.success {
  color: white;
  text-shadow: 0 0 20px rgba(122,235,255,0.9);
}

.reward {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(0,0,0,0.86);
  opacity: 0;
  pointer-events: none;
  transition: 0.8s ease;
}

.reward.visible {
  opacity: 1;
  pointer-events: auto;
}

.reward-card {
  text-align: center;
  width: min(92vw, 520px);
  padding: 56px 42px;
  border: 1px solid rgba(160,225,255,0.18);
  border-radius: 34px;
  background:
    radial-gradient(circle at 50% 0%, rgba(122,235,255,0.12), transparent 42%),
    rgba(8, 14, 22, 0.88);
  box-shadow: 0 50px 160px rgba(0,0,0,0.78), 0 0 100px rgba(122,235,255,0.12);
  backdrop-filter: blur(28px);
}

.reward-card p {
  margin: 0 0 24px;
  color: rgba(220,245,255,0.5);
  text-transform: uppercase;
  letter-spacing: 0.28em;
  font-size: 0.74rem;
}

.fragment {
  display: inline-grid;
  place-items: center;
  width: 122px;
  height: 122px;
  border: 1px solid rgba(255,255,255,0.22);
  border-radius: 28px;
  font-size: 4.4rem;
  font-family: Georgia, serif;
  text-shadow: 0 0 36px rgba(122,235,255,0.9);
  box-shadow: inset 0 0 48px rgba(122,235,255,0.08);
}

@media (max-width: 760px) {
  .room-ui {
    padding: 16px;
  }

  .bottom-panel {
    border-radius: 22px;
    padding: 18px;
  }

  .command-row,
  .diagnostics,
  .hint-system {
    flex-wrap: wrap;
  }

  button {
    width: 100%;
  }

  .node-marker {
    width: 38px;
    height: 38px;
  }
}
</style>
