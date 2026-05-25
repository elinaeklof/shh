<template>
  <div id="root">
    <canvas ref="canvas" />

    <!-- HUD -->
    <div class="hud" v-if="phase === 'game'">
      <div class="stat-chip cash"><span>💰</span>{{ cash }} kr</div>
      <div class="stat-chip"><span>🛍️</span>{{ stock }} påsar</div>
      <div class="stat-chip heat" :class="{ danger: heat > 70 }">
        <span>🚨</span>
        <div class="heat-bar-wrap"><div class="heat-bar" :style="{ width: heat + '%' }"></div></div>
        {{ heat }}%
      </div>
    </div>

    <!-- NPC OVERLAY -->
    <div class="npc-layer" v-if="phase === 'game'">
      <div
        v-for="npc in npcs"
        :key="npc.id"
        class="npc-btn"
        :class="{
          inspected: npc.inspected,
          cooldown: npc.cd > 0,
          selected: selectedNpc && selectedNpc.id === npc.id
        }"
        :style="{ left: npc.sx + 'px', top: npc.sy + 'px' }"
        @click="selectNpc(npc)"
      >
        <div class="npc-avatar">
          <span class="npc-emoji">{{ npc.inspected ? npc.emoji : '❓' }}</span>
          <div class="npc-silhouette" v-if="!npc.inspected">
            <svg viewBox="0 0 40 60" width="28" height="42">
              <ellipse cx="20" cy="10" rx="9" ry="9" fill="rgba(180,180,220,0.25)"/>
              <path d="M8 58 Q8 28 20 26 Q32 28 32 58Z" fill="rgba(180,180,220,0.18)"/>
            </svg>
          </div>
        </div>
        <div class="npc-tag">
          {{ npc.inspected ? npc.nickname : '???' }}
        </div>
        <div class="cd-bar" v-if="npc.cd > 0">
          <div class="cd-fill" :style="{ width: ((1 - npc.cd/npc.maxCd)*100)+'%' }"></div>
        </div>
      </div>
    </div>

    <!-- INSPECT PANEL (replaces action bar when NPC is selected) -->
    <transition name="panel">
      <div class="inspect-panel" v-if="selectedNpc && phase === 'game'">
        <button class="panel-close" @click="selectedNpc = null">✕</button>

        <div class="panel-person">
          <div class="panel-avatar">{{ selectedNpc.inspected ? selectedNpc.emoji : '👤' }}</div>
          <div class="panel-info">
            <div class="panel-name">{{ selectedNpc.inspected ? selectedNpc.nickname : 'Okänd person' }}</div>
            <div class="panel-clues" v-if="selectedNpc.revealedClues.length">
              <div
                v-for="(clue, i) in selectedNpc.revealedClues"
                :key="i"
                class="clue"
                :class="clue.valence"
              >{{ clue.text }}</div>
            </div>
            <div class="panel-unknown" v-else>Inga ledtrådar ännu. Observera personen.</div>
          </div>
        </div>

        <div class="panel-actions">
          <button
            class="pact inspect-btn"
            @click="inspectNpc(selectedNpc)"
            :disabled="selectedNpc.clueIdx >= selectedNpc.clues.length || selectedNpc.cd > 0"
          >
            <span>🔍</span>
            Observera
            <em v-if="selectedNpc.clueIdx >= selectedNpc.clues.length">—inga fler ledtrådar</em>
          </button>
          <button
            class="pact sell-btn"
            @click="sellTo(selectedNpc)"
            :disabled="stock <= 0 || selectedNpc.cd > 0 || gameOver"
          >
            <span>🛍️</span>
            Erbjud påse
          </button>
        </div>

        <div class="panel-hint" v-if="selectedNpc.inspected && selectedNpc.clueIdx < 2">
          Samla fler ledtrådar för att vara säkrare.
        </div>
      </div>
    </transition>

    <!-- GLOBAL ACTIONS -->
    <div class="global-actions" v-if="phase === 'game' && !selectedNpc">
      <button class="act-btn buy" @click="buyStock" :disabled="cash < 40 || gameOver">
        <span>🏪</span> Köp påsar <em>−40 kr</em>
      </button>
      <button class="act-btn charm" @click="charm" :disabled="cash < 20 || gameOver">
        <span>☕</span> Bjud alla på kaffe <em>−20 kr</em>
      </button>
      <button class="act-btn lay-low" @click="layLow" :disabled="layLowCd > 0 || gameOver">
        <span>🕶️</span> Smyg undan{{ layLowCd > 0 ? ` (${Math.ceil(layLowCd)}s)` : '' }}
      </button>
    </div>

    <!-- TOAST -->
    <transition name="toast">
      <div class="toast" v-if="toast" :class="toastType">{{ toast }}</div>
    </transition>

    <!-- OUTCOME FLASH (after sell) -->
    <transition name="flash">
      <div class="outcome-flash" v-if="outcomeFlash" :class="outcomeFlash.type">
        <div class="of-icon">{{ outcomeFlash.icon }}</div>
        <div class="of-text">{{ outcomeFlash.text }}</div>
      </div>
    </transition>

    <!-- MENU -->
    <div class="overlay menu" v-if="phase === 'menu'">
      <div class="menu-inner">
        <div class="logo-bag">⬜</div>
        <h1>VITA PÅSEN</h1>
        <p class="tagline">På Plattan vet du aldrig vem som är vakt.</p>
        <ul class="rules">
          <li>🔍 Observera folk för att samla ledtrådar</li>
          <li>🛍️ Sälj till rätt person — vakterna bötar dig</li>
          <li>💰 Nå 500 kr för att vinna</li>
          <li>🚨 Håll misstanken under 100%</li>
        </ul>
        <button class="start-btn" @click="startGame">STARTA</button>
      </div>
    </div>

    <!-- END -->
    <div class="overlay end" v-if="phase === 'end'">
      <div class="end-inner" :class="wonGame ? 'won' : 'lost'">
        <div class="end-icon">{{ wonGame ? '👑' : '🚔' }}</div>
        <h2>{{ wonGame ? 'IMPERIUM' : 'GRIPEN' }}</h2>
        <p>{{ endReason }}</p>
        <div class="end-stats">
          <span>{{ cash }} kr</span>
          <span>{{ sellCount }} försäljningar</span>
          <span>{{ bustedCount }} bötningar</span>
        </div>
        <button class="start-btn" @click="resetGame">FÖRSÖK IGEN</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js'

// ── NPC definitions ────────────────────────────────────────────────────────────
// Each NPC has a hidden type, a neutral visual nickname, and ordered clues.
// Clues have valence: 'safe' (leans buyer), 'warn' (leans guard), 'neutral'.
// Player must read the clues and make a judgment call.

const NPC_TEMPLATES = [
  {
    id:1, nickname:'Ryggsäcksperson', emoji:'🧳', type:'buyer', price:32, heatAdd:7, maxCd:4,
    clues:[
      { text:'Verkar stressad och tittar på telefonen.', valence:'safe' },
      { text:'Bär en stor, sliten ryggsäck — troligen turist.', valence:'safe' },
      { text:'Frågar om vägen till Gamla Stan på bruten svenska.', valence:'safe' },
    ]
  },
  {
    id:2, nickname:'Gul jacka', emoji:'🧥', type:'guard', price:0, heatAdd:25, maxCd:7,
    clues:[
      { text:'Går metodiskt och skannar av omgivningen.', valence:'warn' },
      { text:'Stannar upp och pratar i örat med någon — eller headset?', valence:'warn' },
      { text:'Du ser en liten blå logga i kragen — kommunal uniform.', valence:'warn' },
    ]
  },
  {
    id:3, nickname:'Hörlurar', emoji:'🎧', type:'buyer', price:40, heatAdd:9, maxCd:4,
    clues:[
      { text:'Nickar i takt med musiken, verkar avslappnad.', valence:'safe' },
      { text:'Bär streetwear och kollar sina skor.', valence:'safe' },
      { text:'Ler och gör tummen upp åt en kompis.', valence:'safe' },
    ]
  },
  {
    id:4, nickname:'Grå kappa', emoji:'🕵️', type:'guard', price:0, heatAdd:35, maxCd:10,
    clues:[
      { text:'Hänger vid ingångarna utan att gå in.', valence:'warn' },
      { text:'Kollar folk lite för länge i ansiktet.', valence:'warn' },
      { text:'Tar fram ett litet anteckningsblock — noterar något.', valence:'warn' },
    ]
  },
  {
    id:5, nickname:'Sportväska', emoji:'🎒', type:'buyer', price:22, heatAdd:6, maxCd:3,
    clues:[
      { text:'Äter en macka och tittar ner i telefonen.', valence:'safe' },
      { text:'Har ett studentkort synligt i ytterfickan.', valence:'safe' },
      { text:'Skrattar åt något på skärmen — tydligt ointresserad av omgivningen.', valence:'safe' },
    ]
  },
  {
    id:6, nickname:'Blå munkjacka', emoji:'🧑‍💼', type:'neutral', price:0, heatAdd:5, maxCd:3,
    clues:[
      { text:'Pendlar fram och tillbaka utan att stanna.', valence:'neutral' },
      { text:'Verkar vänta på någon — kollar klockan ofta.', valence:'neutral' },
      { text:'Tackar nej med handrörelse till en gatuförsäljare.', valence:'neutral' },
    ]
  },
  {
    id:7, nickname:'Solglasögon', emoji:'😎', type:'buyer', price:55, heatAdd:11, maxCd:5,
    clues:[
      { text:'Poserar och tar selfies med Stockholm i bakgrunden.', valence:'safe' },
      { text:'Visar upp ett märkesarmband och en dyr klocka.', valence:'safe' },
      { text:'Vänder sig om och nickar igenkännande åt dig.', valence:'safe' },
    ]
  },
  {
    id:8, nickname:'Reflexväst', emoji:'🦺', type:'guard', price:0, heatAdd:28, maxCd:8,
    clues:[
      { text:'Bär något på höften — svårt att se vad.', valence:'warn' },
      { text:'Pratar med kollega och pekar mot folkmassan.', valence:'warn' },
      { text:'Reflexvästen har text du nätt och jämnt kan läsa: ORDNINGSVAKT.', valence:'warn' },
    ]
  },
]

// ── State ──────────────────────────────────────────────────────────────────────
const cash       = ref(100)
const stock      = ref(6)
const heat       = ref(0)
const gameOver   = ref(false)
const wonGame    = ref(false)
const endReason  = ref('')
const phase      = ref('menu')
const toast      = ref('')
const toastType  = ref('neutral')
const layLowCd   = ref(0)
const sellCount  = ref(0)
const bustedCount = ref(0)
const selectedNpc = ref(null)
const outcomeFlash = ref(null)

const npcs = ref([])

function makeNpcs() {
  return NPC_TEMPLATES.map(t => ({
    ...t,
    clues: [...t.clues],
    revealedClues: [],
    clueIdx: 0,
    inspected: false,
    sx: 0, sy: 0,
    cd: 0,
  }))
}

// ── Three.js ───────────────────────────────────────────────────────────────────
const canvas = ref(null)
let renderer, scene, camera, clock
let animId
let npcMeshes = []
let crowdMeshes = []
let particles
let time = 0

function initThree() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x141420)
  scene.fog = new THREE.FogExp2(0x141420, 0.02)
  clock = new THREE.Clock()

  renderer = new THREE.WebGLRenderer({ canvas: canvas.value, antialias: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.setSize(innerWidth, innerHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0

  camera = new THREE.PerspectiveCamera(54, innerWidth / innerHeight, 0.1, 200)
  camera.position.set(0, 20, 28)
  camera.lookAt(0, 0, 0)

  buildScene(); buildLights(); buildParticles(); buildNpcMeshes()
  window.addEventListener('resize', onResize)
  loop()
}

function buildScene() {
  // Ground
  const g = new THREE.Mesh(
    new THREE.PlaneGeometry(70, 70, 35, 35),
    new THREE.MeshStandardMaterial({ color: 0x222230, roughness: 0.95, metalness: 0.05 })
  )
  g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g)

  const grid = new THREE.GridHelper(70, 25, 0x33334a, 0x2a2a3a)
  grid.position.y = 0.01; grid.material.opacity = 0.4; grid.material.transparent = true
  scene.add(grid)

  // Arches
  buildArch(-14, -20); buildArch(14, -20)
  buildTSign(0, 7, -24)

  // Benches
  ;[[-7,5],[7,5],[0,10],[-3,-6],[5,-3]].forEach(([x,z]) => addBench(x,z))

  // Lamp posts
  ;[[-11,-4],[11,-4],[-4,11],[4,11],[0,-10]].forEach(([x,z]) => addLampPost(x,z))

  // Buildings
  for (let i = 0; i < 12; i++) {
    const w = 3+Math.random()*5, h = 8+Math.random()*22, d = 3+Math.random()*5
    const b = new THREE.Mesh(
      new THREE.BoxGeometry(w,h,d),
      new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.62,0.1,0.06+Math.random()*0.06), roughness:0.9 })
    )
    const side = Math.random()>0.5?1:-1
    b.position.set(side*(22+Math.random()*14), h/2, -8+Math.random()*10)
    b.castShadow = true; scene.add(b)
    // windows
    for (let r=0;r<5;r++) for(let c=0;c<3;c++) {
      if(Math.random()>0.4){
        const lit = Math.random()>0.45
        const wm = new THREE.Mesh(
          new THREE.PlaneGeometry(0.55,0.75),
          new THREE.MeshStandardMaterial({ color:lit?0xffeeaa:0x223344, emissive:lit?new THREE.Color(0xffcc44):new THREE.Color(0), emissiveIntensity:lit?0.9:0 })
        )
        wm.position.set(b.position.x-w/2+1+c*(w/3), 1.5+r*3.2, b.position.z+d/2+0.01)
        scene.add(wm)
      }
    }
  }

  addWhiteBag(0, 0.6, 0)
}

function buildArch(x, z) {
  const m = new THREE.MeshStandardMaterial({color:0x38384e,roughness:0.7,metalness:0.3})
  ;[[-3,0],[3,0]].forEach(([ox])=>{
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.7,9,0.7),m)
    p.position.set(x+ox,4.5,z); p.castShadow=true; scene.add(p)
  })
  const top = new THREE.Mesh(new THREE.BoxGeometry(7,0.55,0.7),m)
  top.position.set(x,9,z); scene.add(top)
}

function buildTSign(x,y,z){
  const c = new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.5,0.22,32),
    new THREE.MeshStandardMaterial({color:0x1144bb,emissive:0x0033aa,emissiveIntensity:0.7}))
  c.rotation.x=Math.PI/2; c.position.set(x,y,z); scene.add(c)
  const tm = new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:1.2})
  const th = new THREE.Mesh(new THREE.BoxGeometry(1.5,0.26,0.06),tm)
  th.position.set(x,y+0.3,z-0.16); scene.add(th)
  const tv = new THREE.Mesh(new THREE.BoxGeometry(0.26,1.3,0.06),tm)
  tv.position.set(x,y-0.18,z-0.16); scene.add(tv)
  const l = new THREE.PointLight(0x3366ff,2.5,10); l.position.set(x,y,z+1); scene.add(l)
}

function addBench(x,z){
  const m = new THREE.MeshStandardMaterial({color:0x3e2e22,roughness:0.9})
  const s = new THREE.Mesh(new THREE.BoxGeometry(3,0.12,0.7),m)
  s.position.set(x,0.55,z); s.castShadow=true; scene.add(s)
  const b = new THREE.Mesh(new THREE.BoxGeometry(3,0.65,0.08),m)
  b.position.set(x,0.92,z-0.31); scene.add(b)
}

function addLampPost(x,z){
  const m = new THREE.MeshStandardMaterial({color:0x2e2e40,metalness:0.8,roughness:0.2})
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.09,5.5,8),m)
  pole.position.set(x,2.75,z); pole.castShadow=true; scene.add(pole)
  const bm = new THREE.MeshStandardMaterial({color:0xffffbb,emissive:0xffff88,emissiveIntensity:2.5})
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14,8,8),bm)
  bulb.position.set(x,5.6,z); scene.add(bulb)
  const l = new THREE.PointLight(0xffeebb,2,14); l.position.set(x,5.5,z); l.castShadow=true; scene.add(l)
}

function addWhiteBag(x,y,z){
  const bm = new THREE.MeshStandardMaterial({color:0xf8f8f8,roughness:0.3,metalness:0.05})
  const bag = new THREE.Mesh(new THREE.BoxGeometry(0.55,0.65,0.22),bm)
  bag.position.set(x,y,z); bag.castShadow=true; scene.add(bag)
  bag._whiteBag = true
  const hm = new THREE.MeshStandardMaterial({color:0xdddddd,roughness:0.4})
  ;[[-0.11,0],[0.11,0]].forEach(([ox])=>{
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.09,0.016,8,12,Math.PI),hm)
    h.position.set(x+ox,y+0.43,z); h.rotation.z=Math.PI; scene.add(h)
  })
  const gl = new THREE.PointLight(0xffffff,0.7,3); gl.position.set(x,y+0.4,z); scene.add(gl)
}

function buildLights(){
  scene.add(new THREE.AmbientLight(0x181830,2))
  const sun = new THREE.DirectionalLight(0x8899cc,0.7)
  sun.position.set(-8,20,8); sun.castShadow=true
  sun.shadow.mapSize.set(2048,2048)
  sun.shadow.camera.left=-30; sun.shadow.camera.right=30
  sun.shadow.camera.top=30; sun.shadow.camera.bottom=-30
  scene.add(sun)
  const bl = new THREE.PointLight(0x2244ff,3,22); bl.position.set(0,5,-20); scene.add(bl)
  const wl = new THREE.PointLight(0xff7722,1.2,16); wl.position.set(0,5,8); scene.add(wl)
}

function buildParticles(){
  const n=350, pos=new Float32Array(n*3), spd=new Float32Array(n)
  for(let i=0;i<n;i++){
    pos[i*3]=(Math.random()-.5)*70; pos[i*3+1]=Math.random()*18; pos[i*3+2]=(Math.random()-.5)*70
    spd[i]=0.015+Math.random()*0.04
  }
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(pos,3))
  geo._spd=spd
  particles=new THREE.Points(geo,new THREE.PointsMaterial({color:0x9999bb,size:0.07,transparent:true,opacity:0.5}))
  scene.add(particles)
}

function buildNpcMeshes(){
  npcMeshes=[]
  const palettes=[0x4477ee,0xee7733,0x44aaaa,0xaa44aa,0x88aa44,0xee4444,0x44ee88,0x9977aa]
  npcs.value.forEach((npc,i)=>{
    const grp=new THREE.Group()
    const angle=(i/npcs.value.length)*Math.PI*2
    const r=4+Math.random()*6
    // body – all look the same (grey-ish) until inspected
    const bm=new THREE.MeshStandardMaterial({color:0x555566,roughness:0.65,metalness:0.1})
    const body=new THREE.Mesh(new THREE.CapsuleGeometry(0.27,0.72,4,8),bm)
    body.position.y=0.95; body.castShadow=true; grp.add(body)
    const hm=new THREE.MeshStandardMaterial({color:0xf0c090,roughness:0.5})
    const head=new THREE.Mesh(new THREE.SphereGeometry(0.21,12,12),hm)
    head.position.y=1.7; head.castShadow=true; grp.add(head)
    // question mark above head
    const qMat=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:0.6,transparent:true,opacity:0.85})
    const qMark=new THREE.Mesh(new THREE.SphereGeometry(0.12,8,8),qMat)
    qMark.position.y=2.2; grp.add(qMark)
    grp._qMark=qMark

    grp.position.set(Math.cos(angle)*r,0,Math.sin(angle)*r)
    grp._walkAngle=angle; grp._walkR=r
    grp._walkSpeed=0.003+Math.random()*0.005
    grp._bobPhase=Math.random()*Math.PI*2
    grp._npcId=npc.id
    scene.add(grp); npcMeshes.push(grp)
  })

  // crowd extras
  crowdMeshes=[]
  for(let i=0;i<30;i++){
    const g=new THREE.Group()
    const c=new THREE.Color().setHSL(Math.random(),0.2,0.25+Math.random()*0.1)
    const body=new THREE.Mesh(new THREE.CapsuleGeometry(0.2,0.6,4,6),new THREE.MeshStandardMaterial({color:c,roughness:0.7}))
    body.position.y=0.8; body.castShadow=true; g.add(body)
    const head=new THREE.Mesh(new THREE.SphereGeometry(0.17,8,8),new THREE.MeshStandardMaterial({color:0xf0c090,roughness:0.5}))
    head.position.y=1.47; g.add(head)
    const angle=Math.random()*Math.PI*2, r=2+Math.random()*10
    g.position.set(Math.cos(angle)*r,0,Math.sin(angle)*r)
    g._walkAngle=angle; g._walkR=r; g._walkSpeed=0.002+Math.random()*0.005; g._bobPhase=Math.random()*Math.PI*2
    scene.add(g); crowdMeshes.push(g)
  }
}

// ── Loop ───────────────────────────────────────────────────────────────────────
function loop(){
  animId=requestAnimationFrame(loop)
  const dt=Math.min(clock.getDelta(), 0.05)
  time+=dt

  // walk
  ;[...npcMeshes,...crowdMeshes].forEach(g=>{
    g._walkAngle+=g._walkSpeed
    g.position.x=Math.cos(g._walkAngle)*g._walkR
    g.position.z=Math.sin(g._walkAngle)*g._walkR
    g.rotation.y=-g._walkAngle+Math.PI/2
    g.position.y=Math.abs(Math.sin(time*4+g._bobPhase))*0.06
  })

  // q-mark pulse
  npcMeshes.forEach((g,i)=>{
    const npc=npcs.value[i]
    if(g._qMark){
      if(npc.inspected){
        g._qMark.material.opacity=0 // hide q when inspected
      } else {
        g._qMark.material.opacity=0.5+Math.sin(time*3+i)*0.4
        g._qMark.position.y=2.2+Math.sin(time*2+i*0.7)*0.1
      }
    }
  })

  // particles
  if(particles){
    const pos=particles.geometry.attributes.position.array
    const spd=particles.geometry._spd
    for(let i=0;i<pos.length/3;i++){ pos[i*3+1]+=spd[i]; if(pos[i*3+1]>18) pos[i*3+1]=0 }
    particles.geometry.attributes.position.needsUpdate=true
  }

  // camera sway
  camera.position.x=Math.sin(time*0.07)*1.8
  camera.lookAt(Math.sin(time*0.05)*0.5,1,0)

  // project NPC positions → screen
  if(phase.value==='game'){
    npcMeshes.forEach((m,i)=>{
      const npc=npcs.value[i]
      const v=m.position.clone(); v.y=1.9; v.project(camera)
      npc.sx=(v.x*0.5+0.5)*innerWidth-36
      npc.sy=(-v.y*0.5+0.5)*innerHeight-64
    })
  }

  // passive heat rise
  if(phase.value==='game'&&!gameOver.value&&Math.random()<0.003){
    heat.value=Math.min(100,heat.value+1); checkState()
  }

  // cooldown ticks
  if(phase.value==='game'){
    npcs.value.forEach(n=>{ if(n.cd>0) n.cd=Math.max(0,+(n.cd-dt).toFixed(2)) })
    if(layLowCd.value>0) layLowCd.value=Math.max(0,+(layLowCd.value-dt).toFixed(2))
  }

  renderer.render(scene,camera)
}

// ── Gameplay ───────────────────────────────────────────────────────────────────
function selectNpc(npc){
  if(npc.cd>0) return
  selectedNpc.value = selectedNpc.value?.id===npc.id ? null : npc
}

function inspectNpc(npc){
  if(npc.clueIdx>=npc.clues.length) return
  const clue=npc.clues[npc.clueIdx]
  npc.revealedClues.push(clue)
  npc.clueIdx++
  npc.inspected=true
  heat.value=Math.min(100,heat.value+3) // watching people raises suspicion slightly
  showToast('Du observerar personen varsamt…', 'neutral')
  checkState()
}

function sellTo(npc){
  if(gameOver.value||stock.value<=0||npc.cd>0) return
  npc.cd=npc.maxCd
  selectedNpc.value=null

  if(npc.type==='buyer'){
    const price=npc.price+Math.floor(Math.random()*25)
    cash.value+=price; stock.value--; sellCount.value++
    heat.value=Math.min(100,heat.value+npc.heatAdd)
    showOutcome('good','💸',`+${price} kr — affären gick igenom!`)
  } else if(npc.type==='guard'){
    const fine=50+Math.floor(Math.random()*30)
    cash.value=Math.max(0,cash.value-fine); bustedCount.value++
    heat.value=Math.min(100,heat.value+npc.heatAdd)
    showOutcome('bad','🚔',`Vakt! Böter på ${fine} kr!`)
  } else {
    heat.value=Math.min(100,heat.value+npc.heatAdd)
    showOutcome('neutral','😑','Inte intresserad. Misstanken stiger.')
  }
  checkState()
}

function buyStock(){
  if(gameOver.value||cash.value<40) return
  cash.value-=40; stock.value+=5; heat.value=Math.min(100,heat.value+2)
  showToast('5 nya påsar. Se till att sälja dem rätt. 🛍️','neutral')
}

function charm(){
  if(gameOver.value||cash.value<20) return
  cash.value-=20; heat.value=Math.max(0,heat.value-18)
  showToast('Kaffe till alla. Stämningen är bättre. ☕','good')
}

function layLow(){
  if(gameOver.value||layLowCd.value>0) return
  heat.value=Math.max(0,heat.value-30); layLowCd.value=22
  selectedNpc.value=null
  showToast('Du blandar dig i folkmassan. 🕶️','neutral')
}

function checkState(){
  if(heat.value>=100) endGame(false,'Misstanken nådde 100 %. Ordningsvakterna satte dit dig.')
  else if(cash.value>=500) endGame(true,'Du byggde Stockholms hemligaste florsocker-imperium.')
  else if(cash.value<=0&&stock.value<=0) endGame(false,'Konkurs. Inga pengar, inga påsar.')
}

function endGame(won,reason){
  gameOver.value=true; wonGame.value=won; endReason.value=reason
  setTimeout(()=>{ phase.value='end' },1400)
}

let _toastTimer=null
function showToast(msg,type='neutral'){
  toast.value=msg; toastType.value=type
  clearTimeout(_toastTimer)
  _toastTimer=setTimeout(()=>{ toast.value='' },3200)
}

let _flashTimer=null
function showOutcome(type,icon,text){
  outcomeFlash.value={type,icon,text}
  clearTimeout(_flashTimer)
  _flashTimer=setTimeout(()=>{ outcomeFlash.value=null },2000)
}

function startGame(){ phase.value='game' }

function resetGame(){
  cash.value=100; stock.value=6; heat.value=0
  gameOver.value=false; wonGame.value=false; endReason.value=''
  toast.value=''; layLowCd.value=0; sellCount.value=0; bustedCount.value=0
  selectedNpc.value=null; outcomeFlash.value=null
  npcs.value=makeNpcs()
  phase.value='game'
}

function onResize(){
  if(!renderer) return
  camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix()
  renderer.setSize(innerWidth,innerHeight)
}

onMounted(()=>{
  npcs.value=makeNpcs()
  initThree()
})
onUnmounted(()=>{
  cancelAnimationFrame(animId)
  window.removeEventListener('resize',onResize)
  renderer?.dispose()
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:ital,wght@0,400;0,500;1,400&display=swap');

:root {
  --bg: #0e0e1c;
  --glass: rgba(255,255,255,0.05);
  --border: rgba(255,255,255,0.1);
  --text: #dde0f0;
  --muted: rgba(180,180,220,0.55);
  --good: #44ffaa;
  --bad: #ff4455;
  --warn: #ffbb44;
}

*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }

body, #root { width:100vw; height:100vh; overflow:hidden; background:var(--bg); font-family:'DM Mono',monospace; color:var(--text); }

canvas { position:fixed; inset:0; width:100%!important; height:100%!important; }

/* ── HUD ── */
.hud {
  position:fixed; top:14px; left:50%; transform:translateX(-50%);
  display:flex; gap:10px; z-index:10; pointer-events:none;
}
.stat-chip {
  display:flex; align-items:center; gap:8px;
  background:rgba(8,8,22,0.84); border:1px solid var(--border);
  border-radius:28px; padding:7px 16px; font-size:13px;
  backdrop-filter:blur(12px); box-shadow:0 4px 22px rgba(0,0,0,0.45);
  white-space:nowrap;
}
.stat-chip.heat { border-color:rgba(255,60,60,0.3); }
.stat-chip.heat.danger { border-color:#ff2222; animation:hpulse 0.5s infinite alternate; }
@keyframes hpulse { from{box-shadow:0 0 8px rgba(255,0,0,0.3)} to{box-shadow:0 0 24px rgba(255,0,0,0.75)} }
.heat-bar-wrap { width:64px; height:5px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden; }
.heat-bar { height:100%; background:linear-gradient(90deg,#ff9900,#ff2200); border-radius:3px; transition:width .4s; }

/* ── NPC layer ── */
.npc-layer { position:fixed; inset:0; z-index:5; pointer-events:none; }

.npc-btn {
  position:absolute; width:76px;
  display:flex; flex-direction:column; align-items:center; gap:5px;
  cursor:pointer; pointer-events:all;
  transition:transform .15s; user-select:none;
}
.npc-btn:hover { transform:translateY(-5px) scale(1.1); }
.npc-btn.cooldown { opacity:0.35; pointer-events:none; }
.npc-btn.selected .npc-avatar { box-shadow:0 0 0 2px #fff, 0 0 18px rgba(255,255,255,0.5)!important; }

.npc-avatar {
  width:54px; height:54px;
  display:flex; align-items:center; justify-content:center;
  border-radius:50%; border:2px solid var(--border);
  background:rgba(20,20,40,0.75);
  backdrop-filter:blur(6px);
  box-shadow:0 4px 16px rgba(0,0,0,0.5);
  position:relative; overflow:hidden;
  transition:box-shadow .2s;
}
.npc-btn:not(.inspected) .npc-avatar { background:rgba(30,30,55,0.8); }
.npc-btn:not(.inspected):hover .npc-avatar { box-shadow:0 0 18px rgba(150,150,255,0.5); }
.npc-btn.inspected .npc-avatar { background:rgba(20,40,30,0.8); border-color:rgba(100,200,150,0.5); }
.npc-btn.inspected:hover .npc-avatar { box-shadow:0 0 18px rgba(60,200,120,0.5); }

.npc-emoji { font-size:24px; position:relative; z-index:2; }
.npc-silhouette { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; opacity:0.6; }

.npc-tag {
  font-size:10px; color:rgba(210,210,240,0.8);
  background:rgba(0,0,0,0.65); padding:2px 8px;
  border-radius:10px; backdrop-filter:blur(4px); white-space:nowrap;
}

.cd-bar { width:48px; height:3px; background:rgba(255,255,255,0.1); border-radius:2px; overflow:hidden; }
.cd-fill { height:100%; background:linear-gradient(90deg,#3366ff,#66aaff); transition:width .1s; }

/* ── Inspect panel ── */
.inspect-panel {
  position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
  width:min(480px,96vw);
  background:rgba(8,8,22,0.93); border:1px solid rgba(255,255,255,0.14);
  border-radius:20px; padding:22px 24px;
  backdrop-filter:blur(18px);
  box-shadow:0 8px 48px rgba(0,0,0,0.55);
  z-index:20;
}

.panel-close {
  position:absolute; top:14px; right:16px;
  background:transparent; border:1px solid rgba(255,255,255,0.14);
  color:var(--muted); border-radius:6px; padding:2px 8px;
  cursor:pointer; font-size:12px; transition:all .2s;
}
.panel-close:hover { color:#ff4455; border-color:#ff4455; }

.panel-person { display:flex; gap:16px; margin-bottom:18px; }

.panel-avatar {
  width:52px; height:52px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  font-size:28px; border-radius:14px;
  background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12);
}

.panel-name {
  font-size:15px; font-weight:500; margin-bottom:10px; color:#fff;
}

.panel-unknown { font-size:12px; color:var(--muted); font-style:italic; }

.panel-clues { display:flex; flex-direction:column; gap:6px; }

.clue {
  font-size:12px; padding:7px 12px; border-radius:8px; line-height:1.5;
  border-left:3px solid transparent;
}
.clue.safe    { background:rgba(40,120,70,0.2); border-color:rgba(60,200,120,0.6); color:rgba(150,240,180,0.9); }
.clue.warn    { background:rgba(180,40,30,0.2); border-color:rgba(255,80,60,0.6); color:rgba(255,160,140,0.9); }
.clue.neutral { background:rgba(80,80,120,0.2); border-color:rgba(140,140,200,0.4); color:rgba(180,180,220,0.9); }

.panel-actions { display:flex; gap:10px; }

.pact {
  flex:1; display:flex; align-items:center; justify-content:center; gap:8px;
  padding:11px 18px; border-radius:40px; border:1px solid var(--border);
  background:rgba(255,255,255,0.05); color:var(--text);
  font-family:'DM Mono',monospace; font-size:13px; cursor:pointer;
  transition:all .2s;
}
.pact em { color:var(--muted); font-style:normal; font-size:11px; }
.pact span { font-size:16px; }
.pact:hover:not(:disabled) { background:rgba(255,255,255,0.1); transform:translateY(-2px); }
.pact:disabled { opacity:.35; cursor:not-allowed; }

.inspect-btn { border-color:rgba(100,140,255,0.4); }
.inspect-btn:hover:not(:disabled) { box-shadow:0 0 18px rgba(80,120,255,0.3); }

.sell-btn { border-color:rgba(80,200,120,0.4); }
.sell-btn:hover:not(:disabled) { box-shadow:0 0 18px rgba(60,200,100,0.35); }

.panel-hint { margin-top:12px; font-size:11px; color:var(--muted); text-align:center; }

/* ── Global actions ── */
.global-actions {
  position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
  display:flex; gap:10px; flex-wrap:wrap; justify-content:center; z-index:10;
}
.act-btn {
  display:flex; align-items:center; gap:8px;
  padding:11px 22px; border:1px solid var(--border); border-radius:40px;
  background:rgba(8,8,22,0.86); color:var(--text);
  font-family:'DM Mono',monospace; font-size:13px; cursor:pointer;
  backdrop-filter:blur(12px); transition:all .2s;
  box-shadow:0 4px 20px rgba(0,0,0,0.4);
}
.act-btn em { color:var(--muted); font-style:normal; font-size:11px; }
.act-btn span { font-size:16px; }
.act-btn.buy    { border-color:rgba(80,200,120,0.35); }
.act-btn.charm  { border-color:rgba(255,180,60,0.35); }
.act-btn.lay-low { border-color:rgba(100,120,200,0.35); }
.act-btn:hover:not(:disabled) { transform:translateY(-3px); background:rgba(24,24,50,0.92); }
.act-btn:disabled { opacity:.35; cursor:not-allowed; transform:none; }

/* ── Toast ── */
.toast {
  position:fixed; top:68px; left:50%; transform:translateX(-50%);
  background:rgba(6,6,18,0.93); border:1px solid var(--border);
  border-radius:28px; padding:10px 22px; font-size:13px;
  backdrop-filter:blur(14px); z-index:25; max-width:400px; text-align:center;
  box-shadow:0 4px 24px rgba(0,0,0,0.5);
}
.toast.good   { border-color:rgba(60,220,120,0.5); color:var(--good); }
.toast.bad    { border-color:rgba(255,60,60,0.5);  color:var(--bad); }
.toast.warn   { border-color:rgba(255,180,40,0.5); color:var(--warn); }
.toast-enter-active,.toast-leave-active { transition:all .3s; }
.toast-enter-from,.toast-leave-to { opacity:0; transform:translateX(-50%) translateY(-8px); }

/* ── Outcome flash ── */
.outcome-flash {
  position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
  text-align:center; z-index:30; pointer-events:none;
  animation:flashIn .25s ease;
}
@keyframes flashIn { from{opacity:0;transform:translate(-50%,-50%) scale(0.7)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
.of-icon { font-size:64px; margin-bottom:10px; }
.of-text {
  font-size:20px; padding:12px 30px;
  border-radius:36px; backdrop-filter:blur(16px);
  font-weight:500;
}
.outcome-flash.good .of-text { background:rgba(20,80,40,0.92); border:1px solid rgba(60,220,100,0.5); color:var(--good); }
.outcome-flash.bad  .of-text { background:rgba(80,10,10,0.92);  border:1px solid rgba(255,60,40,0.5); color:var(--bad); }
.outcome-flash.neutral .of-text { background:rgba(30,30,60,0.92); border:1px solid var(--border); color:var(--muted); }
.flash-enter-active,.flash-leave-active { transition:opacity .4s; }
.flash-enter-from,.flash-leave-to { opacity:0; }

/* ── Panel transition ── */
.panel-enter-active,.panel-leave-active { transition:all .25s; }
.panel-enter-from,.panel-leave-to { opacity:0; transform:translateX(-50%) translateY(16px); }

/* ── Overlays ── */
.overlay {
  position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
  z-index:50;
  background:radial-gradient(ellipse at 50% 55%, rgba(18,18,45,0.97), rgba(4,4,14,0.99));
}
.menu-inner,.end-inner { text-align:center; animation:fadeUp .5s ease; }
@keyframes fadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }

.logo-bag { font-size:76px; margin-bottom:14px; animation:bagFloat 3s ease-in-out infinite; }
@keyframes bagFloat {
  0%,100%{transform:scale(1) rotate(-2deg);filter:drop-shadow(0 0 16px rgba(255,255,255,0.35))}
  50%{transform:scale(1.06) rotate(2deg);filter:drop-shadow(0 0 36px rgba(255,255,255,0.7))}
}

h1 {
  font-family:'Bebas Neue',sans-serif;
  font-size:clamp(52px,10vw,94px); letter-spacing:8px; color:#fff; line-height:1;
  text-shadow:0 0 40px rgba(100,150,255,0.35);
}
.tagline { font-size:14px; color:var(--muted); margin:12px 0 22px; letter-spacing:1px; }

.rules {
  list-style:none; margin-bottom:30px;
  display:flex; flex-direction:column; gap:8px;
  font-size:13px; color:rgba(180,185,220,0.7);
  text-align:left; max-width:280px; margin-left:auto; margin-right:auto;
}
.rules li { display:flex; gap:10px; align-items:flex-start; }

.start-btn {
  padding:15px 52px; background:linear-gradient(135deg,#2244cc,#5577ff);
  border:none; border-radius:50px; color:#fff;
  font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:4px;
  cursor:pointer; transition:all .2s; box-shadow:0 0 40px rgba(50,90,255,0.4);
}
.start-btn:hover { transform:translateY(-3px) scale(1.04); box-shadow:0 0 60px rgba(50,90,255,0.7); }

.end-icon { font-size:70px; margin-bottom:14px; }
h2 { font-family:'Bebas Neue',sans-serif; font-size:64px; letter-spacing:6px; line-height:1; margin-bottom:10px; }
.won h2 { color:#ffd700; text-shadow:0 0 30px rgba(255,200,0,0.5); }
.lost h2 { color:#ff4455; text-shadow:0 0 30px rgba(255,40,60,0.5); }
.end-inner p { font-size:14px; color:var(--muted); max-width:340px; margin:0 auto 20px; line-height:1.7; }
.end-stats { display:flex; gap:20px; justify-content:center; font-size:13px; color:rgba(160,160,200,0.5); margin-bottom:28px; }
</style>