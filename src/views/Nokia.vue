<template>
 <main class="game-shell" :class="{ shake: isRinging }">
   <section class="hero-panel">
     <div class="noise"></div>
     <div class="mission-card">
       <p class="eyebrow">Uppdrag: Kodnamn 3310</p>
       <h1>Telefonen i ugnen</h1>
       <p>
         Du hittar en gammal Nokia i en avstängd ugn. Den vibrerar, blinkar och
         skickar kryptiska SMS från någon som verkar veta exakt var du är.
       </p>


       <div class="stats-grid">
         <div>
           <span>Steg</span>
           <strong>{{ stepIndex + 1 }}/{{ steps.length }}</strong>
         </div>
         <div>
           <span>Stress</span>
           <strong>{{ stress }}%</strong>
         </div>
         <div>
           <span>Status</span>
           <strong>{{ completed ? 'Klar' : currentStep.tag }}</strong>
         </div>
       </div>
     </div>


     <aside class="scene-card">
       <div class="oven">
         <div class="oven-glow"></div>
         <div class="phone-in-oven" :class="{ active: phoneFound }">NOKIA</div>
         <div class="oven-handle"></div>
       </div>
       <button v-if="!phoneFound" class="primary-btn" @click="findPhone">
         Öppna ugnen
       </button>
       <button v-else class="primary-btn" @click="triggerDistraction">
         Slumpa störning
       </button>
     </aside>
   </section>


   <section class="game-grid">
     <div class="nokia-wrap">
       <div class="nokia">
         <div class="speaker"></div>
         <div class="screen">
           <div class="screen-top">
             <span>Telia</span>
             <span>{{ battery }}%</span>
           </div>


           <div v-if="!phoneFound" class="locked-screen">
             <span class="blink">✹</span>
             <p>En telefon ligger bakom glaset...</p>
           </div>


           <template v-else>
             <div class="sms-thread" ref="threadRef">
               <article
                 v-for="message in visibleMessages"
                 :key="message.id"
                 class="bubble"
                 :class="message.from"
               >
                 <span class="sender">{{ message.sender }}</span>
                 {{ message.text }}
               </article>
             </div>


             <div v-if="incomingCall" class="call-overlay">
               <p>{{ incomingCall.name }} ringer...</p>
               <div class="call-actions">
                 <button @click="answerCall">Svara</button>
                 <button @click="declineCall">Ignorera</button>
               </div>
             </div>
           </template>
         </div>


         <div class="keypad">
           <button v-for="key in keys" :key="key">{{ key }}</button>
         </div>
       </div>
     </div>


     <div class="mission-panel">
       <div class="panel-header">
         <p class="eyebrow">Aktuell ledtråd</p>
         <h2>{{ currentStep.title }}</h2>
       </div>


       <p class="clue">{{ currentStep.clue }}</p>


       <div class="interaction-box">
         <label :for="'answer-' + stepIndex">Ditt svar</label>
         <input
           :id="'answer-' + stepIndex"
           v-model="answer"
           :disabled="!phoneFound || completed"
           :placeholder="currentStep.placeholder"
           @keydown.enter="submitAnswer"
         />
         <button :disabled="!phoneFound || completed" @click="submitAnswer">
           Skicka SMS
         </button>
       </div>


       <p v-if="feedback" class="feedback" :class="feedbackType">{{ feedback }}</p>


       <div class="inventory">
         <h3>Ryggsäcken</h3>
         <div class="items">
           <span v-for="item in inventory" :key="item">{{ item }}</span>
           <em v-if="inventory.length === 0">Tom än så länge</em>
         </div>
       </div>


       <div class="progress-track">
         <div
           v-for="(step, index) in steps"
           :key="step.title"
           class="dot"
           :class="{ done: index < stepIndex || completed, current: index === stepIndex && !completed }"
         ></div>
       </div>
     </div>
   </section>


   <transition name="pop">
     <div v-if="toast" class="toast">{{ toast }}</div>
   </transition>


   <section v-if="completed" class="ending-card">
     <h2>Uppdraget löst</h2>
     <p>
       Du följde SMS-kedjan, duckade störningarna och låste upp sista platsen.
       Nokia-skärmen blinkar: “Respekt, du klarade det.”
     </p>
     <button class="primary-btn" @click="resetGame">Spela igen</button>
   </section>
 </main>
</template>


<script setup>
import { computed, nextTick, ref } from 'vue'


const keys = ['1', '2 ABC', '3 DEF', '4 GHI', '5 JKL', '6 MNO', '7 PQRS', '8 TUV', '9 WXYZ', '*', '0', '#']


const steps = [
 {
   tag: 'Start',
   title: 'Telefonen vaknar',
   clue: 'Första SMS: “Ey boss, den låg där värmen brukar bo. Vad hittade du?”',
   placeholder: 'Skriv föremålet...',
   answers: ['nokia', 'telefon', 'mobil'],
   reward: 'Nokia 3310'
 },
 {
   tag: 'Kök',
   title: 'Koden på kaklet',
   clue: 'SMS: “Kolla där morsan säger: torka efter dig. Tre blå rutor, en sprucken. Siffran sitter under sprickan.”',
   placeholder: 'Vilken siffra?',
   answers: ['7', 'sju'],
   reward: 'Kakel-kod 7'
 },
 {
   tag: 'Hall',
   title: 'Skorna pekar vägen',
   clue: 'SMS: “Gå till dojorna. Den som pekar fel är inte lost, den pekar mot nästa grej.”',
   placeholder: 'Vilket rum pekar skon mot?',
   answers: ['förråd', 'forrad', 'skrubben', 'städskåp', 'stadskap'],
   reward: 'Dammande nyckel'
 },
 {
   tag: 'Kod',
   title: 'Lås upp lådan',
   clue: 'SMS: “Lägg ihop kaklets siffra med antal bokstäver i NOKIA. Skriv summan, annars blir det knas.”',
   placeholder: 'Kodsumma...',
   answers: ['12', 'tolv'],
   reward: 'Röd lapp'
 },
 {
   tag: 'Final',
   title: 'Sista meddelandet',
   clue: 'SMS: “Röda lappen säger: där ljud blir tyst. Vad är platsen?”',
   placeholder: 'Skriv platsen...',
   answers: ['kudde', 'under kudden', 'sängen', 'sang', 'säng'],
   reward: 'Slutkoordinat'
 }
]


const distractions = [
 { name: 'Verisure', text: 'Hej, vi ser aktivitet nära ugnen. Vill du uppgradera larmet?' },
 { name: 'Elina', text: 'Hallååå, varför svarar du inte? Har du min laddare?' },
 { name: 'Okänt nummer', text: 'Broder, fel svar ger fel väg. Andas och läs igen.' },
 { name: 'Pappa', text: 'Stängde du verkligen av ugnen?' }
]


const phoneFound = ref(false)
const stepIndex = ref(0)
const answer = ref('')
const feedback = ref('')
const feedbackType = ref('')
const stress = ref(11)
const battery = ref(83)
const toast = ref('')
const incomingCall = ref(null)
const isRinging = ref(false)
const completed = ref(false)
const inventory = ref([])
const visibleMessages = ref([])
const threadRef = ref(null)
const messageId = ref(0)


const currentStep = computed(() => steps[stepIndex.value])


function normalize(value) {
 return value
   .toLowerCase()
   .trim()
   .replaceAll('å', 'a')
   .replaceAll('ä', 'a')
   .replaceAll('ö', 'o')
}


function addMessage(from, sender, text) {
 messageId.value += 1
 visibleMessages.value.push({
   id: messageId.value,
   from,
   sender,
   text
 })


 nextTick(() => {
   if (threadRef.value) {
     threadRef.value.scrollTop = threadRef.value.scrollHeight
   }
 })
}


function findPhone() {
 phoneFound.value = true
 toast.value = 'Du hittade en Nokia i ugnen.'
 addMessage('them', 'Okänd', 'Ey, du hitta luren. Svara smart nu, inga mobilspel, bara riktiga ledtrådar.')
 addMessage('them', 'Okänd', currentStep.value.clue)
 setTimeout(() => {
   toast.value = ''
 }, 2200)
}


function submitAnswer() {
 if (!answer.value.trim()) return


 const playerAnswer = answer.value
 addMessage('me', 'Du', playerAnswer)


 const normalized = normalize(playerAnswer)
 const correct = currentStep.value.answers.some((item) => normalize(item) === normalized)


 if (!correct) {
   stress.value = Math.min(100, stress.value + 13)
   battery.value = Math.max(8, battery.value - 4)
   feedbackType.value = 'bad'
   feedback.value = 'Fel spår. Läs SMS:et igen och tänk mer bokstavligt.'
   addMessage('them', 'Okänd', 'Nah, den där var sned. Läs ledtråden igen, bror.')
   maybeCall()
   answer.value = ''
   return
 }


 inventory.value.push(currentStep.value.reward)
 feedbackType.value = 'good'
 feedback.value = 'Rätt. Ett nytt SMS trillar in.'
 addMessage('them', 'Okänd', 'Ait, du är med. Nästa grej kommer nu.')
 answer.value = ''


 if (stepIndex.value === steps.length - 1) {
   completed.value = true
   addMessage('them', 'Okänd', 'Respekt. Uppdraget är stängt. Lägg tillbaka luren där ingen letar.')
   return
 }


 stepIndex.value += 1
 setTimeout(() => {
   addMessage('them', 'Okänd', currentStep.value.clue)
 }, 650)
 maybeCall()
}


function maybeCall() {
 if (Math.random() > 0.52) {
   triggerDistraction()
 }
}


function triggerDistraction() {
 if (!phoneFound.value || incomingCall.value) return


 const item = distractions[Math.floor(Math.random() * distractions.length)]
 incomingCall.value = item
 isRinging.value = true
 stress.value = Math.min(100, stress.value + 7)
}


function answerCall() {
 if (!incomingCall.value) return


 addMessage('them', incomingCall.value.name, incomingCall.value.text)
 feedbackType.value = 'bad'
 feedback.value = 'Du svarade på störningen. Stressen ökade, men ibland finns små ledtrådar där också.'
 stress.value = Math.min(100, stress.value + 9)
 incomingCall.value = null
 isRinging.value = false
}


function declineCall() {
 addMessage('me', 'Du', 'Avvisar samtal')
 feedbackType.value = 'good'
 feedback.value = 'Bra fokus. Alla samtal är inte värda att ta.'
 stress.value = Math.max(0, stress.value - 5)
 incomingCall.value = null
 isRinging.value = false
}


function resetGame() {
 phoneFound.value = false
 stepIndex.value = 0
 answer.value = ''
 feedback.value = ''
 feedbackType.value = ''
 stress.value = 11
 battery.value = 83
 toast.value = ''
 incomingCall.value = null
 isRinging.value = false
 completed.value = false
 inventory.value = []
 visibleMessages.value = []
 messageId.value = 0
}
</script>


<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');


* {
 box-sizing: border-box;
}


.game-shell {
 min-height: 100vh;
 padding: 32px;
 color: #f8fafc;
 font-family: Inter, system-ui, sans-serif;
 background:
   radial-gradient(circle at top left, rgba(34, 197, 94, 0.25), transparent 30%),
   radial-gradient(circle at bottom right, rgba(59, 130, 246, 0.25), transparent 30%),
   linear-gradient(135deg, #050816, #111827 50%, #020617);
 overflow: hidden;
}


.noise {
 position: absolute;
 inset: 0;
 opacity: 0.12;
 pointer-events: none;
 background-image: repeating-linear-gradient(0deg, transparent 0 2px, rgba(255,255,255,.08) 2px 3px);
}


.hero-panel,
.game-grid {
 position: relative;
 z-index: 1;
 display: grid;
 grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
 gap: 24px;
 max-width: 1180px;
 margin: 0 auto 24px;
}


.mission-card,
.scene-card,
.mission-panel,
.ending-card {
 border: 1px solid rgba(255, 255, 255, 0.12);
 border-radius: 28px;
 background: rgba(15, 23, 42, 0.72);
 box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
 backdrop-filter: blur(18px);
}


.mission-card {
 padding: 34px;
 position: relative;
 overflow: hidden;
}


.eyebrow {
 margin: 0 0 10px;
 color: #86efac;
 font-size: 0.78rem;
 font-weight: 900;
 letter-spacing: 0.18em;
 text-transform: uppercase;
}


h1,
h2,
h3,
p {
 margin-top: 0;
}


h1 {
 margin-bottom: 12px;
 font-size: clamp(2.4rem, 6vw, 5.8rem);
 line-height: 0.9;
 letter-spacing: -0.08em;
}


.mission-card p:not(.eyebrow) {
 max-width: 680px;
 color: #cbd5e1;
 font-size: 1.05rem;
 line-height: 1.7;
}


.stats-grid {
 display: grid;
 grid-template-columns: repeat(3, 1fr);
 gap: 12px;
 margin-top: 28px;
}


.stats-grid div {
 padding: 16px;
 border-radius: 18px;
 background: rgba(255,255,255,0.08);
}


.stats-grid span {
 display: block;
 color: #94a3b8;
 font-size: 0.75rem;
}


.stats-grid strong {
 font-size: 1.4rem;
}


.scene-card {
 display: grid;
 place-items: center;
 padding: 26px;
}


.oven {
 position: relative;
 width: 270px;
 height: 220px;
 margin-bottom: 22px;
 border: 12px solid #475569;
 border-radius: 26px;
 background: linear-gradient(#111827, #020617);
 box-shadow: inset 0 0 40px rgba(0,0,0,.8);
}


.oven-glow {
 position: absolute;
 inset: 28px;
 border-radius: 22px;
 background: radial-gradient(circle, rgba(251, 146, 60, .38), transparent 62%);
 filter: blur(3px);
}


.phone-in-oven {
 position: absolute;
 left: 86px;
 bottom: 42px;
 width: 94px;
 height: 46px;
 display: grid;
 place-items: center;
 border-radius: 14px;
 color: #0f172a;
 font-size: .7rem;
 font-weight: 900;
 background: #a7f3d0;
 transform: rotate(-12deg) scale(.92);
 opacity: .45;
 transition: .4s ease;
}


.phone-in-oven.active {
 opacity: 1;
 transform: rotate(-5deg) scale(1.12);
 box-shadow: 0 0 28px #86efac;
}


.oven-handle {
 position: absolute;
 left: 52px;
 top: 18px;
 width: 150px;
 height: 10px;
 border-radius: 99px;
 background: #94a3b8;
}


.primary-btn,
.interaction-box button,
.call-actions button {
 border: 0;
 border-radius: 16px;
 padding: 13px 18px;
 color: #04111d;
 font-weight: 900;
 background: linear-gradient(135deg, #86efac, #67e8f9);
 cursor: pointer;
 box-shadow: 0 12px 30px rgba(34, 197, 94, .25);
}


.game-grid {
 grid-template-columns: 390px minmax(0, 1fr);
 align-items: start;
}


.nokia-wrap {
 display: grid;
 place-items: center;
}


.nokia {
 width: 310px;
 min-height: 610px;
 padding: 24px 22px;
 border-radius: 48px 48px 60px 60px;
 background: linear-gradient(145deg, #1e3a8a, #172554 42%, #0f172a);
 box-shadow: inset -10px -18px 30px rgba(0,0,0,.35), 0 30px 80px rgba(0,0,0,.45);
}


.speaker {
 width: 90px;
 height: 10px;
 margin: 0 auto 18px;
 border-radius: 999px;
 background: #020617;
}


.screen {
 position: relative;
 height: 285px;
 padding: 14px;
 border: 8px solid #111827;
 border-radius: 24px;
 color: #13210f;
 background: linear-gradient(135deg, #a7f3d0, #bef264);
 box-shadow: inset 0 0 24px rgba(0,0,0,.34);
 overflow: hidden;
}


.screen-top {
 display: flex;
 justify-content: space-between;
 margin-bottom: 10px;
 font-family: monospace;
 font-weight: 900;
}


.locked-screen {
 height: 220px;
 display: grid;
 place-items: center;
 text-align: center;
 font-family: monospace;
 font-weight: 900;
}


.blink {
 font-size: 2.2rem;
 animation: blink 1s infinite;
}


.sms-thread {
 height: 226px;
 overflow: auto;
 padding-right: 4px;
}


.bubble {
 margin: 8px 0;
 padding: 9px 10px;
 border-radius: 12px;
 font-family: monospace;
 font-size: .78rem;
 line-height: 1.35;
 background: rgba(255,255,255,.5);
}


.bubble.me {
 margin-left: 34px;
 background: rgba(37, 99, 235, .22);
}


.bubble.them {
 margin-right: 28px;
}


.sender {
 display: block;
 margin-bottom: 3px;
 font-size: .66rem;
 font-weight: 900;
 opacity: .62;
}


.call-overlay {
 position: absolute;
 inset: 16px;
 display: grid;
 place-items: center;
 padding: 18px;
 border-radius: 18px;
 text-align: center;
 color: white;
 background: rgba(15, 23, 42, .92);
}


.call-actions {
 display: flex;
 gap: 10px;
}


.call-actions button:last-child {
 color: white;
 background: #ef4444;
}


.keypad {
 display: grid;
 grid-template-columns: repeat(3, 1fr);
 gap: 10px;
 margin-top: 24px;
}


.keypad button {
 min-height: 46px;
 border: 0;
 border-radius: 16px;
 color: #dbeafe;
 font-weight: 900;
 background: linear-gradient(145deg, #334155, #0f172a);
 box-shadow: inset 0 -4px 0 rgba(0,0,0,.25);
}


.mission-panel {
 padding: 28px;
}


.panel-header h2 {
 margin-bottom: 14px;
 font-size: 2rem;
 letter-spacing: -.04em;
}


.clue {
 padding: 20px;
 border-radius: 20px;
 color: #d1fae5;
 line-height: 1.6;
 background: rgba(16, 185, 129, .12);
 border: 1px solid rgba(134, 239, 172, .18);
}


.interaction-box {
 display: grid;
 grid-template-columns: 1fr auto;
 gap: 10px;
 margin-top: 18px;
}


.interaction-box label {
 grid-column: 1 / -1;
 color: #94a3b8;
 font-weight: 800;
 font-size: .8rem;
 text-transform: uppercase;
 letter-spacing: .12em;
}


.interaction-box input {
 width: 100%;
 border: 1px solid rgba(255,255,255,.14);
 border-radius: 16px;
 padding: 14px 16px;
 color: white;
 outline: none;
 background: rgba(2, 6, 23, .58);
}


.interaction-box input:focus {
 border-color: #86efac;
 box-shadow: 0 0 0 4px rgba(134, 239, 172, .1);
}


.feedback {
 margin: 18px 0;
 padding: 14px 16px;
 border-radius: 16px;
 font-weight: 800;
}


.feedback.good {
 color: #bbf7d0;
 background: rgba(34, 197, 94, .16);
}


.feedback.bad {
 color: #fecaca;
 background: rgba(239, 68, 68, .16);
}


.inventory {
 margin-top: 20px;
 padding: 18px;
 border-radius: 20px;
 background: rgba(255,255,255,.06);
}


.items {
 display: flex;
 flex-wrap: wrap;
 gap: 8px;
}


.items span,
.items em {
 padding: 8px 10px;
 border-radius: 999px;
 color: #dbeafe;
 font-size: .85rem;
 background: rgba(59, 130, 246, .22);
}


.progress-track {
 display: flex;
 gap: 10px;
 margin-top: 22px;
}


.dot {
 height: 10px;
 flex: 1;
 border-radius: 999px;
 background: rgba(255,255,255,.12);
}


.dot.done {
 background: #86efac;
}


.dot.current {
 background: #67e8f9;
 box-shadow: 0 0 22px rgba(103, 232, 249, .55);
}


.toast {
 position: fixed;
 right: 24px;
 bottom: 24px;
 z-index: 10;
 padding: 16px 18px;
 border-radius: 18px;
 color: #04111d;
 font-weight: 900;
 background: #86efac;
 box-shadow: 0 20px 60px rgba(0,0,0,.35);
}


.ending-card {
 max-width: 760px;
 margin: 20px auto 0;
 padding: 26px;
 text-align: center;
}


.shake .nokia {
 animation: shake .18s infinite;
}


.pop-enter-active,
.pop-leave-active {
 transition: .25s ease;
}


.pop-enter-from,
.pop-leave-to {
 opacity: 0;
 transform: translateY(12px) scale(.96);
}


@keyframes blink {
 50% { opacity: .2; }
}


@keyframes shake {
 0%, 100% { transform: translateX(0) rotate(0); }
 25% { transform: translateX(-2px) rotate(-1deg); }
 75% { transform: translateX(2px) rotate(1deg); }
}


@media (max-width: 900px) {
 .game-shell {
   padding: 18px;
 }


 .hero-panel,
 .game-grid {
   grid-template-columns: 1fr;
 }


 .stats-grid,
 .interaction-box {
   grid-template-columns: 1fr;
 }


 .nokia {
   width: min(310px, 100%);
 }
}
</style>
