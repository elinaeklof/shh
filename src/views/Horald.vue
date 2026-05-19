<template>
  <main class="game-shell" @mousemove="onMouseMove">
    <section class="hud glass">
      <div>
        <p class="eyebrow">Du är lägerledaren</p>
        <h1>Avslöja lögnaren</h1>
      </div>
      <div class="score-card">
        <span>Runda {{ round }}</span>
        <strong>{{ phaseLabel }}</strong>
      </div>
      <button class="reset" @click="newGame">Ny utredning</button>
    </section>

    <section class="scene" :style="sceneTilt">
      <div class="sky">
        <div class="sun"></div>
        <div class="cloud c1"></div>
        <div class="cloud c2"></div>
      </div>

      <div class="leader-card glass">
        <strong>Lägerledaren</strong>
        <span>Samla vittnesmål. Hitta motsägelsen.</span>
      </div>

      <div class="boat-wrap">
        <div class="mast"></div>
        <div class="sail sail-left"></div>
        <div class="sail sail-right"></div>
        <div class="rope r1"></div>
        <div class="rope r2"></div>
        <div class="deck"></div>
        <div class="hull"></div>
        <div class="bow"></div>
        <div class="rail"></div>

        <button
          v-for="kid in kids"
          :key="kid.id"
          class="kid"
          :class="[{ selected: selectedKid?.id === kid.id, accused: accusedId === kid.id, questioned: kid.questioned }, kid.avatar]"
          :style="kid.position"
          @click="questionKid(kid)"
        >
          <span class="head">
            <span class="hair"></span>
            <span class="eyes"></span>
            <span class="mouth"></span>
          </span>
          <span class="body"></span>
          <span class="name-tag">{{ kid.name }}</span>
        </button>
      </div>

      <div class="water">
        <div class="wave w1"></div>
        <div class="wave w2"></div>
        <div class="wave w3"></div>
      </div>
    </section>

    <section class="panel glass">
      <div v-if="phase === 'intro'" class="story">
        <h2>Läget på båten</h2>
        <p>
          Du är lägerledaren på en seglingsutflykt. Barnet Horald har skapat kaos ombord genom att gömma viktiga saker och manipulera de andra barnen för att få all uppmärksamhet. Nu är kompassen borta och ingen vet vem som talar sanning.
        </p>
        <p>
          Ditt mål är att själv lista ut vem som ljuger. Barnen har fått varsin version av vad som hände. Fyra barn försöker hjälpa dig. Ett barn försöker manipulera hela gruppen och få de andra att börja misstänka varandra.
        </p>
        <button class="primary" @click="phase = 'talk'">Starta utredningen</button>
      </div>

      <div v-else-if="phase === 'talk'" class="talk-layout">
        <aside class="suspects">
          <button
            v-for="kid in kids"
            :key="kid.id"
            :class="{ active: selectedKid?.id === kid.id, done: kid.questioned }"
            @click="questionKid(kid)"
          >
            {{ kid.name }}
            <small>{{ kid.questioned ? 'förhörd' : 'oförhörd' }}</small>
          </button>
        </aside>

        <article class="dialogue" v-if="selectedKid">
          <p class="eyebrow">Förhör med {{ selectedKid.name }}</p>
          <h2>{{ selectedKid.name }} svarar</h2>
          <div class="speech">
            “{{ selectedKid.statement }}”
          </div>
          <div class="clue">
            <strong>Som lägerledare märker du:</strong> {{ selectedKid.behaviour }}
          </div>
          <button class="danger" @click="accuse(selectedKid.id)">Jag tror att {{ selectedKid.name }} ljuger</button>
        </article>

        <article class="dialogue empty" v-else>
          <h2>Välj vem du vill förhöra</h2>
          <p>Klicka på ett barn. Spelet avslöjar inte svaret förrän du anklagar någon.</p>
        </article>
      </div>

      <div v-else class="result">
        <h2>{{ won ? 'Rätt, lägerledaren löste fallet!' : 'Fel anklagelse!' }}</h2>
        <p>
          Den som ljög var <strong>{{ liar?.name }}</strong>. {{ liar?.name }} försökte dölja att {{ liar?.secret }}
        </p>
        <p class="explanation">
          Avgörande motsägelse: <strong>{{ liar?.tell }}</strong>
        </p>
        <div class="truth-grid">
          <div v-for="kid in kids" :key="kid.id" class="truth-card" :class="{ liar: kid.isLiar }">
            <strong>{{ kid.name }}</strong>
            <span>{{ kid.isLiar ? 'Ljög för dig' : 'Talade sanning' }}</span>
          </div>
        </div>
        <button class="primary" @click="newGame">Ny utredning</button>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue'

const templates = [
  {
    id: 99,
    name: 'Horald',
    avatar: 'leo',
    truth: 'Jag försökte bara få alla att lyssna på mig. Jag tog inte kompassen.',
    lie: 'Jag har inte rört någons saker idag och jag har bara suttit tyst.',
    behaviourTruth: 'Horald pratar snabbt och försöker hela tiden byta ämne.',
    behaviourLie: 'Han gömmer händerna bakom ryggen och försöker avbryta alla andra.',
    secret: 'han gömde kompassen och flera barns saker för att få uppmärksamhet.',
    tell: 'Horald säger att han varit tyst hela dagen, men alla andra beskriver hur han försökte styra samtalen.',
    position: { left: '50%', top: '43%' }
  },
  {
    id: 1,
    name: 'Mira',
    avatar: 'mira',
    truth: 'Jag såg kompassen vid masten när vågen slog över relingen. Någon med röda kläder stod där.',
    lie: 'Jag var aldrig nära masten, jag satt vid fören hela tiden och såg ingenting.',
    behaviourTruth: 'Hon pekar lugnt mot masten och minns exakt vilken våg som slog in.',
    behaviourLie: 'Hon tittar snabbt mot masten fast hon säger att hon inte var där.',
    secret: 'hon gömde kompassen bakom seglet.',
    tell: 'Mira säger att hon inte var nära masten, men hennes skor har repmärken från mastfästet.',
    position: { left: '29%', top: '57%' }
  },
  {
    id: 2,
    name: 'Leo',
    avatar: 'leo',
    truth: 'Jag hörde någon springa över däck precis innan kompassen försvann. Stegen kom från styrbord.',
    lie: 'Jag sov när allt hände, så jag hörde ingenting alls.',
    behaviourTruth: 'Han knackar takten av stegen han hörde mot relingen.',
    behaviourLie: 'Han säger att han sov men har fortfarande kikaren riktad mot masten.',
    secret: 'han bytte plats på kompassen och kikaren.',
    tell: 'Leo påstår att han sov, men han kan ändå beskriva exakt var alla stod.',
    position: { left: '43%', top: '49%' }
  },
  {
    id: 3,
    name: 'Sam',
    avatar: 'sam',
    truth: 'Någon hade blöta skor, för jag såg små pölar ända fram till masten.',
    lie: 'Däcket var helt torrt när kompassen försvann.',
    behaviourTruth: 'Sam visar pölarna med foten och låter säker på detaljerna.',
    behaviourLie: 'Sam står mitt i en pöl men låtsas inte märka det.',
    secret: 'han tappade kompassen i en vattenhink.',
    tell: 'Sam säger att däcket var torrt, trots att flera andra nämner blöta spår.',
    position: { left: '56%', top: '60%' }
  },
  {
    id: 4,
    name: 'Nora',
    avatar: 'nora',
    truth: 'Jag såg att styrbordslådan var öppen efter lunch, och den brukar alltid vara stängd.',
    lie: 'Styrbordslådan har varit stängd hela dagen.',
    behaviourTruth: 'Hon beskriver lådans rostiga gångjärn utan att tveka.',
    behaviourLie: 'Hon ställer sig framför styrbordslådan som om hon vill blockera den.',
    secret: 'hon lade kompassen i styrbordslådan.',
    tell: 'Nora blockerar lådan samtidigt som hon säger att den aldrig öppnats.',
    position: { left: '68%', top: '54%' }
  },
  {
    id: 5,
    name: 'Tage',
    avatar: 'tage',
    truth: 'Jag såg en röd tråd fastna i kompassens rem. Den satt kvar vid relingen.',
    lie: 'Ingen hade något rött på sig idag, så den röda tråden kan inte vara viktig.',
    behaviourTruth: 'Han visar en röd tråd som sitter på relingen.',
    behaviourLie: 'Han gömmer sin röda mössa bakom ryggen.',
    secret: 'han råkade fastna med mössan i kompassremmen.',
    tell: 'Tage säger att ingen hade rött, men han gömmer sin röda mössa.',
    position: { left: '78%', top: '64%' }
  }
]

const phase = ref('intro')
const round = ref(1)
const kids = ref([])
const selectedKid = ref(null)
const accusedId = ref(null)
const mouse = ref({ x: 0, y: 0 })

const liar = computed(() => kids.value.find(kid => kid.isLiar))
const won = computed(() => accusedId.value === liar.value?.id)
const phaseLabel = computed(() => {
  if (phase.value === 'intro') return 'Briefing'
  if (phase.value === 'talk') return 'Utredning'
  return 'Facit'
})
const sceneTilt = computed(() => ({
  transform: `rotateX(${mouse.value.y * -5}deg) rotateY(${mouse.value.x * 7}deg)`
}))

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5)
}

function newGame() {
  const liarId = 99
  const order = shuffle(templates)
  kids.value = shuffle(order).map(kid => ({
    ...kid,
    questioned: false,
    isLiar: kid.id === liarId,
    statement: kid.id === liarId ? kid.lie : kid.truth,
    behaviour: kid.id === liarId ? kid.behaviourLie : kid.behaviourTruth
  }))
  phase.value = 'intro'
  selectedKid.value = null
  accusedId.value = null
  round.value += 1
}

function questionKid(kid) {
  if (phase.value === 'intro') phase.value = 'talk'
  if (phase.value === 'result') return
  selectedKid.value = kid
  kid.questioned = true
}

function accuse(id) {
  accusedId.value = id
  phase.value = 'result'
}

function onMouseMove(event) {
  const x = event.clientX / window.innerWidth - 0.5
  const y = event.clientY / window.innerHeight - 0.5
  mouse.value = { x, y }
}

newGame()
round.value = 1
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.game-shell {
  min-height: 100vh;
  overflow: hidden;
  color: #17324d;
  background:
    radial-gradient(circle at 20% 10%, rgba(255, 245, 181, 0.9), transparent 24rem),
    linear-gradient(180deg, #77d8ff 0%, #c8f3ff 46%, #1686be 47%, #065f91 100%);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  padding: 1.25rem;
  perspective: 1100px;
}

.glass {
  background: rgba(255, 255, 255, 0.58);
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 24px 70px rgba(8, 48, 83, 0.22);
  backdrop-filter: blur(18px);
}

.hud {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-radius: 28px;
  padding: 1rem 1.25rem;
}

.eyebrow {
  margin: 0 0 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.72rem;
  font-weight: 900;
  color: #0f6e96;
}

h1, h2, p {
  margin-top: 0;
}

h1 {
  margin-bottom: 0;
  font-size: clamp(1.8rem, 4vw, 4rem);
  line-height: 0.9;
}

.score-card {
  display: grid;
  gap: 0.15rem;
  text-align: center;
  padding: 0.7rem 1rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.55);
}

.score-card span {
  font-size: 0.8rem;
  opacity: 0.75;
}

.leader-card {
  position: absolute;
  left: 50%;
  top: 13%;
  z-index: 6;
  display: grid;
  gap: 0.25rem;
  width: min(320px, 84vw);
  transform: translateX(-50%) translateZ(210px);
  border-radius: 24px;
  padding: 0.9rem 1rem;
  text-align: center;
}

.leader-card span {
  font-size: 0.85rem;
  opacity: 0.75;
}

button {
  border: 0;
  cursor: pointer;
  font: inherit;
}

.reset, .primary, .danger {
  border-radius: 999px;
  padding: 0.8rem 1.1rem;
  font-weight: 900;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.reset, .primary {
  color: white;
  background: linear-gradient(135deg, #0f6e96, #0bb6d8);
  box-shadow: 0 12px 24px rgba(10, 110, 150, 0.28);
}

.danger {
  color: white;
  background: linear-gradient(135deg, #ff5364, #9c1738);
  box-shadow: 0 12px 24px rgba(156, 23, 56, 0.28);
}

.reset:hover, .primary:hover, .danger:hover {
  transform: translateY(-2px) scale(1.02);
}

.scene {
  position: relative;
  height: 58vh;
  min-height: 430px;
  transform-style: preserve-3d;
  transition: transform 0.12s linear;
}

.sky, .water, .boat-wrap {
  position: absolute;
  inset: 0;
}

.sun {
  position: absolute;
  left: 7%;
  top: 14%;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: radial-gradient(circle, #fff8a8 0%, #ffd15c 65%, rgba(255, 209, 92, 0) 70%);
  filter: drop-shadow(0 0 40px rgba(255, 220, 95, 0.8));
}

.cloud {
  position: absolute;
  width: 180px;
  height: 56px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  filter: blur(0.2px);
  animation: floatCloud 18s infinite linear;
}

.cloud:before, .cloud:after {
  content: '';
  position: absolute;
  border-radius: 50%;
  background: inherit;
}

.cloud:before { width: 76px; height: 76px; left: 28px; top: -32px; }
.cloud:after { width: 96px; height: 96px; right: 26px; top: -46px; }
.c1 { left: 24%; top: 18%; }
.c2 { right: 8%; top: 24%; transform: scale(0.75); animation-duration: 23s; }

.boat-wrap {
  top: 12%;
  transform: translateZ(80px) rotateX(4deg);
  transform-style: preserve-3d;
  animation: bob 4s ease-in-out infinite;
}

.mast {
  position: absolute;
  left: 50%;
  top: 9%;
  width: 16px;
  height: 330px;
  border-radius: 999px;
  background: linear-gradient(90deg, #6b3c1d, #c47a35, #5d2f18);
  box-shadow: 15px 20px 30px rgba(42, 20, 8, 0.22);
  transform: translateX(-50%) translateZ(70px);
}

.sail {
  position: absolute;
  top: 12%;
  width: 210px;
  height: 245px;
  filter: drop-shadow(0 18px 22px rgba(18, 52, 75, 0.22));
  transform: translateZ(55px);
}

.sail-left {
  left: calc(50% - 215px);
  clip-path: polygon(100% 0, 100% 100%, 0 88%);
  background: linear-gradient(135deg, #ffffff, #ccecff);
}

.sail-right {
  left: 50%;
  clip-path: polygon(0 0, 100% 100%, 0 88%);
  background: linear-gradient(135deg, #fff7de, #ffb86b);
}

.rope {
  position: absolute;
  top: 11%;
  height: 330px;
  width: 3px;
  background: rgba(73, 52, 37, 0.7);
  transform-origin: top;
}

.r1 { left: 39%; transform: rotate(-31deg) translateZ(82px); }
.r2 { left: 61%; transform: rotate(31deg) translateZ(82px); }

.deck {
  position: absolute;
  left: 24%;
  right: 10%;
  bottom: 19%;
  height: 110px;
  border-radius: 50% 42% 28% 26%;
  background:
    repeating-linear-gradient(90deg, rgba(78, 42, 20, 0.18) 0 3px, transparent 3px 42px),
    linear-gradient(180deg, #d99443, #a75828);
  box-shadow: inset 0 18px 25px rgba(255,255,255,0.2), 0 28px 40px rgba(18, 52, 75, 0.28);
  transform: rotateX(64deg) translateZ(30px);
}

.hull {
  position: absolute;
  left: 20%;
  right: 7%;
  bottom: 12%;
  height: 115px;
  border-radius: 12% 18% 55% 65%;
  clip-path: polygon(0 6%, 92% 0, 100% 22%, 77% 82%, 25% 100%, 5% 58%);
  background: linear-gradient(180deg, #9f3f2f, #4b1d22);
  box-shadow: inset 0 -24px 34px rgba(0,0,0,0.26), 0 26px 34px rgba(3, 38, 65, 0.28);
  transform: translateZ(20px);
}

.bow {
  position: absolute;
  right: 3.5%;
  bottom: 20%;
  width: 110px;
  height: 70px;
  clip-path: polygon(0 10%, 100% 42%, 0 100%);
  background: linear-gradient(90deg, #7e2f2b, #3c1720);
  transform: translateZ(42px);
}

.rail {
  position: absolute;
  left: 25%;
  right: 12%;
  bottom: 30%;
  height: 14px;
  border-radius: 999px;
  background: linear-gradient(90deg, #713719, #e3a55c, #713719);
  transform: translateZ(100px);
}

.kid {
  position: absolute;
  width: 74px;
  height: 132px;
  background: transparent;
  transform: translateZ(155px);
  transition: transform 0.22s ease, filter 0.22s ease;
  filter: drop-shadow(0 15px 12px rgba(22, 45, 65, 0.3));
}

.kid:hover, .kid.selected {
  transform: translateZ(190px) translateY(-10px) scale(1.08);
  filter: drop-shadow(0 22px 18px rgba(22, 45, 65, 0.38));
}

.kid.accused .head {
  box-shadow: 0 0 0 5px rgba(255, 83, 100, 0.48);
}

.kid.questioned .name-tag {
  background: rgba(207, 255, 226, 0.92);
}

.head {
  position: absolute;
  left: 12px;
  top: 0;
  width: 50px;
  height: 54px;
  border-radius: 50% 50% 45% 45%;
  background: #ffd3a3;
  overflow: hidden;
}

.hair {
  position: absolute;
  inset: -9px -4px 31px;
  border-radius: 45%;
  background: #4d2d22;
}

.eyes, .eyes:after {
  position: absolute;
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #17324d;
  top: 28px;
  left: 15px;
}

.eyes:after { left: 17px; top: 0; }

.mouth {
  position: absolute;
  left: 21px;
  bottom: 11px;
  width: 12px;
  height: 6px;
  border-bottom: 3px solid #9c4b4b;
  border-radius: 50%;
}

.body {
  position: absolute;
  left: 8px;
  top: 49px;
  width: 58px;
  height: 72px;
  border-radius: 22px 22px 14px 14px;
  background: var(--shirt, #44a8ff);
  box-shadow: inset 0 -18px rgba(0,0,0,0.12);
}

.name-tag {
  position: absolute;
  left: 50%;
  bottom: -13px;
  transform: translateX(-50%);
  padding: 0.22rem 0.5rem;
  border-radius: 999px;
  color: #17324d;
  background: rgba(255,255,255,0.8);
  font-size: 0.72rem;
  font-weight: 900;
  white-space: nowrap;
}

.mira { --shirt: linear-gradient(180deg, #f7649d, #a52065); }
.leo { --shirt: linear-gradient(180deg, #48b4ff, #1264ba); }

.kid.selected {
  z-index: 40;
}

.kid.questioned:not(.selected) {
  opacity: 0.88;
}

.kid.accused {
  animation: shake 0.5s ease;
}
.sam { --shirt: linear-gradient(180deg, #55d47d, #187a42); }
.nora { --shirt: linear-gradient(180deg, #b77cff, #6531ad); }
.tage { --shirt: linear-gradient(180deg, #ffcc4a, #e27622); }

.water {
  top: auto;
  height: 43%;
  bottom: -2%;
  transform: translateZ(0);
  overflow: hidden;
}

.wave {
  position: absolute;
  left: -10%;
  width: 120%;
  height: 90px;
  border-radius: 50%;
  opacity: 0.5;
  background: repeating-radial-gradient(ellipse at center, rgba(255,255,255,0.9) 0 3px, transparent 4px 34px);
  animation: wave 7s linear infinite;
}

.w1 { bottom: 44%; }
.w2 { bottom: 25%; animation-duration: 9s; opacity: 0.35; }
.w3 { bottom: 7%; animation-duration: 11s; opacity: 0.28; }

.panel {
  position: relative;
  z-index: 10;
  max-width: 1050px;
  margin: -1rem auto 0;
  border-radius: 32px;
  padding: 1.25rem;
}

.story, .result {
  max-width: 760px;
  margin: 0 auto;
  text-align: center;
}

.story p, .result p {
  line-height: 1.6;
  font-size: 1.05rem;
}

.talk-layout {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: 1rem;
}

.suspects {
  display: grid;
  gap: 0.6rem;
}

.suspects button {
  display: grid;
  gap: 0.2rem;
  padding: 0.85rem;
  border-radius: 18px;
  color: #17324d;
  background: rgba(255,255,255,0.7);
  font-weight: 900;
  text-align: left;
}

.suspects small {
  font-size: 0.68rem;
  opacity: 0.65;
}

.suspects button.done:not(.active) {
  background: rgba(207, 255, 226, 0.82);
}

.suspects button.active {
  color: white;
  background: linear-gradient(135deg, #17324d, #0f6e96);
}

.dialogue {
  min-height: 210px;
  border-radius: 24px;
  padding: 1.25rem;
  background: rgba(255,255,255,0.64);
}

.speech {
  position: relative;
  margin: 1rem 0;
  padding: 1.15rem;
  border-radius: 22px 22px 22px 4px;
  color: #18324d;
  background: white;
  box-shadow: 0 14px 30px rgba(7, 46, 78, 0.12);
  font-size: 1.18rem;
  font-weight: 800;
  line-height: 1.45;
}

.clue {
  margin-bottom: 1rem;
  padding: 0.9rem;
  border-radius: 18px;
  background: rgba(15, 110, 150, 0.1);
}

.explanation {
  display: inline-block;
  padding: 0.8rem 1rem;
  border-radius: 18px;
  background: rgba(255,255,255,0.72);
}

.truth-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.7rem;
  margin: 1rem 0;
}

.truth-card {
  display: grid;
  gap: 0.3rem;
  padding: 0.8rem;
  border-radius: 18px;
  background: rgba(255,255,255,0.75);
}

.truth-card.liar {
  color: white;
  background: linear-gradient(135deg, #ff5364, #9c1738);
}

@keyframes bob {
  0%, 100% { transform: translateZ(80px) rotateX(4deg) translateY(0) rotateZ(-0.5deg); }
  50% { transform: translateZ(80px) rotateX(4deg) translateY(12px) rotateZ(0.8deg); }
}

@keyframes wave {
  from { transform: translateX(0); }
  to { transform: translateX(8%); }
}

@keyframes shake {
  0%, 100% { transform: translateZ(190px) translateX(0); }
  25% { transform: translateZ(190px) translateX(-4px); }
  75% { transform: translateZ(190px) translateX(4px); }
}

@keyframes floatCloud {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(28px); }
}

@media (max-width: 760px) {
  .hud {
    align-items: flex-start;
    flex-direction: column;
  }

  .scene {
    height: 52vh;
    min-height: 390px;
  }

  .boat-wrap {
    transform: translateZ(40px) scale(0.82);
    transform-origin: center bottom;
  }

  .talk-layout {
    grid-template-columns: 1fr;
  }

  .suspects {
    grid-template-columns: repeat(5, 1fr);
  }

  .suspects button {
    text-align: center;
    padding: 0.65rem 0.4rem;
    font-size: 0.8rem;
  }

  .truth-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
