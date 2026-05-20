<template>
 <div id="app" @mousemove="moveCursor" @click="handleSceneClick">
<!-- Custom cursor -->
 <div class="cursor" :class="{ hover: hovering }" :style="{ left: cursor.x+'px', top: cursor.y+'px' }"></div>


 <!-- Scanlines + vignette -->
 <div class="scanlines"></div>
 <div class="vignette"></div>


 <!-- INTRO -->
 <div class="intro-screen" v-if="phase === 'intro'">
   <div class="intro-time">02:11</div>
   <div class="intro-logo">
     <div class="logo-7">7</div>
     <div class="logo-eleven">ELEVEN</div>
   </div>
   <div class="logo-stripe"></div>
   <div class="intro-subtitle">convenience store — stockholm</div>
   <div class="intro-msg">
     Han sträcker sig efter plånboken vid kassan.<br>
     Fingertopparna söker det välbekanta kortet.<br>
     <span>Det är borta.</span><br><br>
     Dörren låses. Automatiskt.
   </div>
   <div class="voice-msg">"ONLY THE TRUE VIP MEMBER CAN LEAVE THE STORE..."</div>
   <button class="start-btn" @click="phase='store'">ENTER STORE</button>
 </div>


 <!-- STORE SCENE -->
 <template v-if="phase==='store' || phase==='win'">
   <!-- HUD -->
   <div class="hud">
     <div class="hud-time">02:11</div>
     <div class="hud-title">7-ELEVEN VIP ESCAPE</div>
     <div class="hud-progress">
       PUSSEL&nbsp;
       <div class="prog-dot" :class="{done: progress.coffee}"></div>
       <div class="prog-dot" :class="{done: progress.receipt}"></div>
       <div class="prog-dot" :class="{done: progress.register}"></div>
     </div>
   </div>


   <!-- 3D STORE -->
   <div class="store-scene">
     <!-- Background / walls -->
     <div class="back-wall"></div>
     <div class="ceiling-light"></div>
     <div class="ceiling-light-glow"></div>


     <!-- Neon sign -->
     <div class="neon-sign">
       <span class="ns-7">7</span>
       <span class="ns-stripe"></span>
       <span class="ns-e">ELEVEN</span>
     </div>


     <!-- Floor -->
     <div class="floor"></div>
     <div class="floor-glow"></div>


     <!-- Product shelves (decorative back wall) -->
     <div class="product-shelves">
       <div class="ps-shelf" v-for="s in 4" :key="s">
         <div class="ps-product" v-for="p in 8" :key="p"
              :style="{background: `hsl(${(s*40+p*15)%360},40%,${15+s*3}%)`, height:(20+s*3)+'px', opacity:0.7}">
           <div class="ps-product-label"></div>
         </div>
       </div>
     </div>


     <!-- ENTRANCE (locked) -->
     <div class="entrance zone" @mouseenter="hovering=true" @mouseleave="hovering=false" @click.stop="showNotif('DÖRREN ÄR LÅST — Lös pusslen för att öppna', 'error')">
       <div class="entrance-frame">
         <div class="entrance-glass"></div>
         <div class="entrance-bars"></div>
         <div class="entrance-locked">LOCKED<br>&#x25A0;&#x25A0;&#x25A0;</div>
       </div>
       <div class="zone-label">INGÅNGSDÖRR</div>
     </div>


     <!-- BACK DOOR (staff room) -->
     <div class="back-door zone" @mouseenter="hovering=true" @mouseleave="hovering=false"
          @click.stop="progress.coffee ? openModal('staffroom') : showNotif('LÅST — Kaffepussel krävs', 'error')">
       <div class="door-frame"></div>
       <div class="door-knob"></div>
       <div class="door-sign">PERSONAL</div>
       <div class="door-locked-icon">🔒</div>
       <div class="zone-label">PERSONALRUM</div>
     </div>


     <!-- COFFEE MACHINE -->
     <div class="zone coffee-machine" @mouseenter="hovering=true" @mouseleave="hovering=false" @click.stop="openModal('coffee')">
       <div class="cm-body">
         <div class="cm-screen">
           <span class="cm-symbol">★</span>
           <span class="cm-symbol">▲</span>
           <span class="cm-symbol">◆</span>
           <span class="cm-symbol">●</span>
         </div>
         <div style="position:absolute;top:75px;left:10px;right:10px;height:30px;background:#111;border-radius:3px;border:1px solid rgba(255,255,255,0.04);">
           <div style="position:absolute;inset:5px;background:linear-gradient(90deg,var(--se-red),var(--se-orange));opacity:0.4;border-radius:2px;"></div>
         </div>
         <div style="position:absolute;bottom:25px;left:15px;right:15px;height:35px;background:#0d0d18;border-radius:4px;border:1px solid rgba(255,255,255,0.04);">
         </div>
         <div class="cm-brand">FRESHBREW 3000</div>
         <div class="cm-nozzle"></div>
       </div>
       <div class="zone-label">KAFFEMASKIN</div>
     </div>


     <!-- MUG SHELF -->
     <div class="zone mug-shelf" @mouseenter="hovering=true" @mouseleave="hovering=false" @click.stop="openModal('mugs')">
       <div class="mug-shelf-board"></div>
       <div class="mug-row">
         <div class="mug-3d" v-for="mug in mugs" :key="mug.letter">
           <div class="mug-body" :style="{background:mug.color, color:mug.textColor, borderColor:mug.textColor+'44'}">
             {{ mug.display }}
             <div class="mug-handle" :style="{borderColor:mug.textColor}"></div>
           </div>
         </div>
       </div>
       <div class="zone-label">MUGGHYLLAN</div>
     </div>


     <!-- RECEIPTS on counter -->
     <div class="zone receipt-zone" @mouseenter="hovering=true" @mouseleave="hovering=false" @click.stop="openModal('receipt')">
       <div class="receipt-paper">
         <div class="receipt-top">7-ELEVEN</div>
         <div class="receipt-line"></div>
         <div class="receipt-line color-hint" style="background:#e8212a55;"></div>
         <div class="receipt-line color-hint" style="background:#007a3355;"></div>
         <div class="receipt-line color-hint" style="background:#f7941d55;"></div>
         <div class="receipt-line color-hint" style="background:#00d4ff55;"></div>
         <div class="receipt-line"></div>
         <div class="receipt-line" style="width:60%;"></div>
       </div>
       <div class="zone-label">KVITTO</div>
     </div>


     <!-- CASH REGISTER -->
     <div class="zone cash-register" @mouseenter="hovering=true" @mouseleave="hovering=false"
          @click.stop="progress.receipt ? openModal('register') : showNotif('LÅST — Hitta färgsekvensen först', 'error')">
       <div class="cr-body">
         <div class="cr-screen">
           {{ progress.register ? 'ÖPPET' : (progress.receipt ? '_ _ _ _' : 'LOCKED') }}
         </div>
         <div class="cr-slot"></div>
         <div class="cr-keypad">
           <div class="cr-key" v-for="k in 12" :key="k"></div>
         </div>
       </div>
       <div class="zone-label">KASSAN</div>
     </div>


     <!-- VIP COMPARTMENT (only shows after register solved) -->
     <div v-if="progress.register" class="zone" style="right:8%;bottom:18%;width:140px;height:50px;"
          @mouseenter="hovering=true" @mouseleave="hovering=false" @click.stop="openModal('vip')">
       <div style="width:100%;height:100%;background:linear-gradient(135deg,#1a0a00,#100800);border:1px solid rgba(255,107,0,0.4);border-radius:2px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(255,107,0,0.3);">
         <span style="font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--neon-orange);letter-spacing:2px;">HEMLIGT FACK</span>
       </div>
       <div class="zone-label">HEMLIGT FACK</div>
     </div>
   </div>


   <!-- INVENTORY -->
   <div class="inventory">
     <div class="inv-slot" v-for="slot in inventorySlots" :key="slot.id" :class="{'has-item': slot.item}">
       <template v-if="slot.item">
         <div>
           <div class="inv-item-icon">{{ slot.item.icon }}</div>
           <div class="inv-item-name">{{ slot.item.name }}</div>
         </div>
       </template>
       <template v-else>
         <span>TOM</span>
       </template>
     </div>
   </div>


   <!-- NOTIFICATION -->
   <transition name="fade">
     <div v-if="notif.show" class="notif" :class="notif.type">{{ notif.msg }}</div>
   </transition>
 </template>


 <!-- ===== MODALS ===== -->


 <!-- COFFEE MACHINE MODAL -->
 <div class="modal-overlay" v-if="modal==='coffee'" @click.self="modal=null">
   <div class="modal-panel">
     <button class="modal-close" @click="modal=null">✕</button>
     <div class="modal-title" style="color:var(--neon-green)">KAFFEMASKIN</div>
     <div class="modal-subtitle">FreshBrew 3000 — Systemfel</div>
     <div class="symbol-display">
       <span class="sym">★</span><span class="sym">▲</span><span class="sym">◆</span><span class="sym">●</span>
     </div>
     <div class="clue-box">
       Maskinen blinkar 4 symboler i loop.<br>
       <span>★ = S &nbsp; ▲ = T &nbsp; ◆ = O &nbsp; ● = P</span><br>
       Kolla muggarnas botten för resten av koden.<br>
       Kombinationen låser upp personalrummet.
     </div>
     <div v-if="!progress.coffee">
       <div class="input-row">
         <input class="puzzle-input" v-model="coffeeAnswer" placeholder="?????" maxlength="5" @keyup.enter="checkCoffee"/>
         <button class="puzzle-btn green" @click="checkCoffee">OK</button>
       </div>
       <div class="feedback" :class="coffeeFeedback.type">{{ coffeeFeedback.msg }}</div>
     </div>
     <div v-else style="color:var(--neon-green);font-family:'Share Tech Mono',monospace;font-size:13px;letter-spacing:3px;padding:10px;border:1px solid rgba(57,255,20,0.3);text-align:center;">
       ✓ LÖST — PERSONALRUMMET ÄR UPPLÅST
     </div>
   </div>
 </div>


 <!-- MUG SHELF MODAL -->
 <div class="modal-overlay" v-if="modal==='mugs'" @click.self="modal=null">
   <div class="modal-panel orange">
     <button class="modal-close" @click="modal=null">✕</button>
     <div class="modal-title" style="color:var(--neon-orange)">MUGGHYLLAN</div>
     <div class="modal-subtitle">Bokstäver gömda under muggar</div>
     <div class="clue-box">
       <span class="orange">Maskinsymbolerna = positioner.</span><br>
       Var symbol pekar på en mugg.<br>
       Bokstaven under muggen = del av koden.<br>
       Hovra för att titta under.
     </div>
     <div class="mug-grid">
       <div class="mug-detail" v-for="mug in mugs" :key="mug.letter">
         <div class="mug-d-body" :style="{background:mug.color,color:mug.textColor}">
           {{ mug.display }}
           <div class="mug-d-handle" :style="{borderColor:mug.textColor}"></div>
         </div>
         <div class="mug-d-under mug-under-hidden">{{ mug.under }}</div>
       </div>
     </div>
     <div class="clue-box" style="font-size:11px;">
       ★→<span>S</span> &nbsp; ▲→<span>T</span> &nbsp; ◆→<span>O</span> &nbsp; ●→<span>P</span><br>
       Mugg-bokstäver: <span>{{ mugs.map(m=>m.under).join(' ') }}</span><br>
       <span class="orange">Sortera efter maskinens symbolordning → svar = STAFF + ?</span>
     </div>
   </div>
 </div>


 <!-- RECEIPT MODAL (color puzzle) -->
 <div class="modal-overlay" v-if="modal==='receipt'" @click.self="modal=null">
   <div class="modal-panel orange">
     <button class="modal-close" @click="modal=null">✕</button>
     <div class="modal-title" style="color:var(--neon-orange)">KVITTOT</div>
     <div class="modal-subtitle">Färgsekvens från kassan</div>
     <div class="receipt-view">
       <div class="rv-header">7-ELEVEN STOCKHOLM<br>02:09 — REF#4471</div>
       <div class="rv-item"><span>Kaffe Stor</span><span>29kr</span></div>
       <div class="rv-item"><span>Korv m bröd</span><span>35kr</span></div>
       <div class="rv-item"><span>Energidryck</span><span>22kr</span></div>
       <div class="rv-item"><span>Godis 100g</span><span>18kr</span></div>
       <div style="margin-top:8px;border-top:1px solid rgba(0,0,0,0.2);padding-top:6px;">
         <div class="rv-item"><strong>TOTALT</strong><strong>104kr</strong></div>
       </div>
       <div class="rv-note rv-highlight">
         KOD: RÖD → GRÖN → ORANGE → BLÅ<br>
         <span style="font-size:9px;color:#666;">*för serviceavdelning*</span>
       </div>
     </div>
     <div style="margin-top:15px;">
       <div v-if="!progress.receipt">
         <div style="font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--dim);letter-spacing:2px;margin-bottom:12px;">VÄLJ SEKVENS (4 FÄRGER):</div>
         <div class="color-seq">
           <div v-for="c in colorOptions" :key="c.code" class="color-btn-big" :class="[c.code, {selected: colorSeq.includes(c.code) && colorSeq[colorSeq.indexOf(c.code)]===c.code}]"
                :style="{background:c.bg,boxShadow:colorSeq.includes(c.code)?`0 0 20px ${c.bg}`:''}"
                @click.stop="addColor(c.code)"></div>
         </div>
         <div class="seq-display">
           <div v-for="(col,i) in 4" :key="i" class="seq-dot" :class="{filled:colorSeq[i]}"
                :style="{background: colorSeq[i] ? colorOptions.find(c=>c.code===colorSeq[i])?.bg : 'transparent'}"></div>
         </div>
         <div class="input-row">
           <button class="puzzle-btn orange" @click="colorSeq=[]">RENSA</button>
           <button class="puzzle-btn orange" @click="checkColor">BEKRÄFTA</button>
         </div>
         <div class="feedback" :class="colorFeedback.type">{{ colorFeedback.msg }}</div>
       </div>
       <div v-else style="color:var(--neon-green);font-family:'Share Tech Mono',monospace;font-size:13px;letter-spacing:3px;padding:10px;border:1px solid rgba(57,255,20,0.3);text-align:center;">
         ✓ LÖST — KASSAKOD TILLGÄNGLIG
       </div>
     </div>
   </div>
 </div>


 <!-- STAFF ROOM MODAL -->
 <div class="modal-overlay" v-if="modal==='staffroom'" @click.self="modal=null">
   <div class="modal-panel blue">
     <button class="modal-close" @click="modal=null">✕</button>
     <div class="modal-title" style="color:var(--neon-blue)">PERSONALRUMMET</div>
     <div class="modal-subtitle">Upplåst av kaffekoden</div>
     <div class="notebook">
       <div class="notebook-title">SKIFTLEDARENS ANTECKNINGAR</div>
       <div class="notebook-line">Kassakod format: <span class="notebook-highlight">RGOB</span></div>
       <div class="notebook-line">R = Röd &nbsp; G = Grön &nbsp; O = Orange &nbsp; B = Blå</div>
       <div class="notebook-line">Kassa öppnas med <span class="notebook-highlight">4-siffrig kod</span></div>
       <div class="notebook-line">Sekvens finns på <span class="notebook-highlight">kvittot vid entrén</span></div>
       <div class="notebook-line" style="margin-top:10px;">VIP-kortet förvarades i <span class="notebook-highlight">kassans hemliga fack</span></div>
       <div class="notebook-line">Facket kräver korrekt färgsekvens.</div>
     </div>
     <div style="margin-top:15px;" v-if="!inventory.find(i=>i?.id==='notebook')">
       <button class="puzzle-btn blue" @click="pickupItem({id:'notebook',name:'Anteckn.',icon:'📓'}); modal=null">TA MED ANTECKNINGSBOKEN</button>
     </div>
   </div>
 </div>


 <!-- CASH REGISTER MODAL -->
 <div class="modal-overlay" v-if="modal==='register'" @click.self="modal=null">
   <div class="modal-panel blue">
     <button class="modal-close" @click="modal=null">✕</button>
     <div class="modal-title" style="color:var(--neon-blue)">KASSAN</div>
     <div class="modal-subtitle">Färgkod krävs</div>
     <div class="clue-box">
       <span class="blue">Ange 4-bokstavskoden från kvittot.</span><br>
       R = Röd, G = Grön, O = Orange, B = Blå<br>
       Kika på anteckningsboken i personalrummet.
     </div>
     <div v-if="!progress.register">
       <div class="input-row">
         <input class="puzzle-input blue" v-model="registerCode" placeholder="RGOB" maxlength="4" @keyup.enter="checkRegister" style="text-transform:uppercase;"/>
         <button class="puzzle-btn blue" @click="checkRegister">ÖPPNA</button>
       </div>
       <div class="feedback" :class="registerFeedback.type">{{ registerFeedback.msg }}</div>
     </div>
     <div v-else style="color:var(--neon-green);font-family:'Share Tech Mono',monospace;font-size:13px;letter-spacing:3px;padding:10px;border:1px solid rgba(57,255,20,0.3);text-align:center;">
       ✓ KASSAFACKET ÄR ÖPPET
     </div>
   </div>
 </div>


 <!-- VIP COMPARTMENT MODAL -->
 <div class="modal-overlay" v-if="modal==='vip'" @click.self="modal=null">
   <div class="modal-panel red">
     <button class="modal-close" @click="modal=null">✕</button>
     <div class="modal-title" style="color:var(--neon-orange)">HEMLIGT FACK</div>
     <div class="modal-subtitle">Kassafacket — Konfidentiellt</div>
     <div class="secret-comp">
       <div class="vip-card-burnt">
         <div class="vip-logo-burnt">7</div>
         <div class="vip-text">
           VIP MEMBER<br>
           VALID 2024–∞
         </div>
         <div class="vip-number">**** **** 7711</div>
       </div>
       <div class="clue-box" style="margin-top:0;">
         Ett halvbränt VIP-kvitto.<br>
         <span>Kortnumret är läsbart: ★★★★ ★★★★ 7711</span><br>
         Det riktiga kortet måste finnas... här inne.
       </div>
     </div>
     <div style="margin-top:15px;text-align:center;">
       <button class="puzzle-btn" style="color:var(--neon-orange);border-color:var(--neon-orange);" @click="foundVIP">
         TA VIP-KORTET
       </button>
     </div>
   </div>
 </div>


 <!-- WIN SCREEN -->
 <div class="win-screen" v-if="phase==='win'">
   <div class="win-title">FREEDOM</div>
   <div class="win-card">
     <div class="win-card-logo">7</div>
     <div class="win-card-vip">VIP</div>
     <div class="win-card-number">★★★★ ★★★★ 7711</div>
     <div class="win-card-stripe"></div>
   </div>
   <div class="win-msg">
     VIP-kortet återfunnet.<br>
     Dörren låses upp. 02:14.<br>
     Han går ut i natten. Kaffet är fortfarande varmt.
   </div>
   <button class="play-again" @click="resetGame">SPELA IGEN</button>
 </div>
 </div>
</template>


<script setup>
import { ref, reactive, computed, onBeforeUnmount, onMounted } from 'vue';
const phase = ref('intro');
const modal = ref(null);
const hovering = ref(false);
const cursor = reactive({ x: 0, y: 0 });

// Progress
const progress = reactive({ coffee: false, receipt: false, register: false, vip: false });


// Inventory (4 slots)
const inventory = ref([null, null, null, null]);
const inventorySlots = computed(() => inventory.value.map((item, id) => ({ id, item })));


// Notification
const notif = reactive({ show: false, msg: '', type: 'info' });
let notifTimer = null;


function showNotif(msg, type = 'info') {
 notif.msg = msg; notif.type = type; notif.show = true;
 if (notifTimer) clearTimeout(notifTimer);
 notifTimer = setTimeout(() => { notif.show = false; }, 2800);
}


function pickupItem(item) {
 if (inventory.value.find(i => i?.id === item.id)) return;
 const slot = inventory.value.findIndex(i => !i);
 if (slot !== -1) {
   inventory.value[slot] = item;
   showNotif('Hittade: ' + item.name, 'success');
 }
}


function openModal(name) { modal.value = name; }


// === COFFEE PUZZLE ===
// Symbols ★▲◆● map to S,T,O,P → positions tell us which mug
// Mugs: R(ed)=S, Y(ellow)=T, G(reen)=A, B(lue)=F, W(hite)=F
// Answer: STAFF (S from ★, T from ▲, A from mug under ◆, F from ●, F bonus)
// Simplified: answer is STAFF
const coffeeAnswer = ref('');
const coffeeFeedback = reactive({ msg: '', type: '' });


function checkCoffee() {
 if (coffeeAnswer.value.toUpperCase() === 'STAFF') {
   progress.coffee = true;
   coffeeFeedback.msg = '✓ KORREKT — PERSONALRUMMET UPPLÅST';
   coffeeFeedback.type = 'success';
   showNotif('Dörren till personalrummet är upplåst!', 'success');
 } else {
   coffeeFeedback.msg = '✗ FEL KOD — Kolla muggarnas botten';
   coffeeFeedback.type = 'error';
 }
}


// Mugs data
const mugs = ref([
 { display: '', color: '#8B0000', textColor: '#ffaaaa', under: 'S', letter: 'S' },
 { display: '', color: '#b8860b', textColor: '#ffe680', under: 'T', letter: 'T' },
 { display: '', color: '#005a20', textColor: '#80ff9f', under: 'A', letter: 'A' },
 { display: '', color: '#003580', textColor: '#80aaff', under: 'F', letter: 'F' },
 { display: '', color: '#4a0060', textColor: '#dd80ff', under: 'F', letter: 'F' },
]);


// === COLOR PUZZLE ===
const colorOptions = [
 { code: 'R', bg: '#e8212a', label: 'RÖD' },
 { code: 'G', bg: '#007a33', label: 'GRÖN' },
 { code: 'O', bg: '#f7941d', label: 'ORANGE' },
 { code: 'B', bg: '#00d4ff', label: 'BLÅ' },
];
const colorSeq = ref([]);
const colorFeedback = reactive({ msg: '', type: '' });


function addColor(code) {
 if (colorSeq.value.length < 4) colorSeq.value.push(code);
}


function checkColor() {
 const ans = colorSeq.value.join('');
 if (ans === 'RGOB') {
   progress.receipt = true;
   colorFeedback.msg = '✓ KORREKT — KASSAKOD: RGOB';
   colorFeedback.type = 'success';
   showNotif('Kassan kan nu öppnas!', 'success');
 } else {
   colorFeedback.msg = '✗ FEL SEKVENS — Läs kvittot noggrant';
   colorFeedback.type = 'error';
   colorSeq.value = [];
 }
}


// === REGISTER PUZZLE ===
const registerCode = ref('');
const registerFeedback = reactive({ msg: '', type: '' });


function checkRegister() {
 if (registerCode.value.toUpperCase() === 'RGOB') {
   progress.register = true;
   registerFeedback.msg = '✓ KASSAFACKET ÄR ÖPPET';
   registerFeedback.type = 'success';
   showNotif('Hemligt fack synligt under kassan!', 'success');
   modal.value = null;
 } else {
   registerFeedback.msg = '✗ FEL KOD';
   registerFeedback.type = 'error';
 }
}


// === VIP CARD ===
function foundVIP() {
 progress.vip = true;
 pickupItem({ id: 'vip', name: 'VIP-KORT', icon: '💳' });
 modal.value = null;
 setTimeout(() => { phase.value = 'win'; }, 800);
}


// Mouse
function moveCursor(e) { cursor.x = e.clientX; cursor.y = e.clientY; }
function handleSceneClick() {}


function resetGame() {
 phase.value = 'intro';
 progress.coffee = false; progress.receipt = false; progress.register = false; progress.vip = false;
 inventory.value = [null, null, null, null];
 modal.value = null;
 coffeeAnswer.value = ''; coffeeFeedback.msg = ''; coffeeFeedback.type = '';
 colorSeq.value = []; colorFeedback.msg = ''; colorFeedback.type = '';
 registerCode.value = ''; registerFeedback.msg = ''; registerFeedback.type = '';
}

function onNokiaGameCanvasClick() {
  if (phoneOpen.value) return
  if (!gameCanvas.value) return

  // lås ENDAST om detta canvas inte redan har lock
  if (document.pointerLockElement !== gameCanvas.value) {
    gameCanvas.value.requestPointerLock()
  }
}

function releasePointerLockForThisGame() {
  // släpp ENDAST om detta spel äger pointer lock
  if (document.pointerLockElement === gameCanvas.value) {
    document.exitPointerLock()
  }
}

// när spelet stängs
onBeforeUnmount(() => {
  releasePointerLockForThisGame()
})

// när spelaren avslutar spelet
function endGame() {
  releasePointerLockForThisGame()

  // resten av cleanup här
}

onMounted(() => {
  document.documentElement.classList.add('seven-eleven-game')
  document.body.classList.add('seven-eleven-game')
})

onBeforeUnmount(() => {
  document.documentElement.classList.remove('seven-eleven-game')
  document.body.classList.remove('seven-eleven-game')
})


</script>


<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap');


*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}


#app {
 --neon-green: #39ff14;
 --neon-red: #ff2442;
 --neon-orange: #ff6b00;
 --neon-blue: #00d4ff;
 --neon-purple: #b400ff;
 --se-red: #e8212a;
 --se-green: #007a33;
 --se-orange: #f7941d;
 --dark: #0a0a0f;
 --darker: #050508;
 --panel: rgba(10,10,20,0.92);
 --text: #e8e0d0;
 --dim: rgba(232,224,208,0.5);
 --floor: #1a1a22;
 --wall: #12121a;
 --ceiling: #0d0d14;
}


:global(html.seven-eleven-game), :global(body.seven-eleven-game) { width:100%;height:100%;overflow:hidden;background:var(--dark);cursor:none; }


#app { width:100vw;height:100vh;position:relative;overflow:hidden;font-family:'Rajdhani',sans-serif; }


/* Custom cursor */
.cursor {
 position:fixed;width:20px;height:20px;border:2px solid var(--neon-green);border-radius:50%;
 pointer-events:none;z-index:9999;transform:translate(-50%,-50%);
 transition:width .15s,height .15s,border-color .15s;mix-blend-mode:screen;
}
.cursor::after {
 content:'';position:absolute;top:50%;left:50%;width:4px;height:4px;
 background:var(--neon-green);border-radius:50%;transform:translate(-50%,-50%);
}
.cursor.hover { width:36px;height:36px;border-color:var(--neon-orange); }


/* ===== INTRO SCREEN ===== */
.intro-screen {
 position:absolute;inset:0;z-index:100;
 background:var(--darker);
 display:flex;flex-direction:column;align-items:center;justify-content:center;
 gap:0;
}


.intro-time {
 font-family:'Share Tech Mono',monospace;font-size:96px;color:var(--neon-green);
 text-shadow:0 0 20px var(--neon-green),0 0 60px rgba(57,255,20,0.4);
 animation:time-flicker 4s infinite;letter-spacing:8px;
}
@keyframes time-flicker {
 0%,92%,100%{opacity:1;} 93%{opacity:0.3;} 95%{opacity:1;} 97%{opacity:0.2;} 98%{opacity:1;}
}


.intro-logo {
 margin:20px 0;display:flex;gap:0;align-items:center;
}
.logo-7 {
 font-family:'Bebas Neue',sans-serif;font-size:110px;line-height:1;
 color:var(--se-red);text-shadow:0 0 30px rgba(232,33,42,0.8),0 0 80px rgba(232,33,42,0.3);
 -webkit-text-stroke:2px #ff4455;
}
.logo-eleven {
 font-family:'Bebas Neue',sans-serif;font-size:70px;line-height:1;
 color:white;text-shadow:0 0 20px rgba(255,255,255,0.5);padding-top:20px;letter-spacing:3px;
}
.logo-stripe {
 width:200px;height:6px;margin:0 auto;
 background:linear-gradient(90deg,var(--se-red),var(--se-orange),var(--se-green));
 box-shadow:0 0 20px rgba(247,148,29,0.6);
}


.intro-subtitle {
 font-family:'Share Tech Mono',monospace;font-size:14px;color:var(--dim);
 letter-spacing:4px;text-transform:uppercase;margin:12px 0 30px;
}


.intro-msg {
 max-width:460px;text-align:center;font-size:17px;color:var(--text);line-height:1.7;
 margin-bottom:30px;padding:20px 30px;
 border:1px solid rgba(57,255,20,0.2);background:rgba(57,255,20,0.03);border-radius:2px;
}
.intro-msg span { color:var(--neon-green);font-weight:700; }


.voice-msg {
 font-family:'Share Tech Mono',monospace;font-size:13px;
 color:var(--neon-orange);letter-spacing:2px;padding:15px 25px;
 border:1px solid var(--neon-orange);margin-bottom:35px;
 animation:pulse-border 2s infinite;text-align:center;
}
@keyframes pulse-border {
 0%,100%{box-shadow:0 0 5px rgba(255,107,0,0.3);}
 50%{box-shadow:0 0 20px rgba(255,107,0,0.7),inset 0 0 15px rgba(255,107,0,0.1);}
}


.start-btn {
 padding:14px 50px;background:transparent;border:2px solid var(--neon-green);
 color:var(--neon-green);font-family:'Bebas Neue',sans-serif;font-size:28px;
 letter-spacing:6px;cursor:pointer;transition:all .2s;
 text-shadow:0 0 10px var(--neon-green);box-shadow:0 0 20px rgba(57,255,20,0.2);
}
.start-btn:hover {
 background:rgba(57,255,20,0.1);box-shadow:0 0 40px rgba(57,255,20,0.5),inset 0 0 20px rgba(57,255,20,0.05);
 transform:scale(1.03);
}


/* ===== 3D STORE SCENE ===== */
.store-scene {
 position:absolute;inset:0;perspective:700px;perspective-origin:50% 45%;
 overflow:hidden;
}


.scene-3d {
 width:100%;height:100%;position:relative;transform-style:preserve-3d;
}


/* Floor */
.floor {
 position:absolute;bottom:0;left:-30%;width:160%;height:50%;
 background:
   repeating-linear-gradient(90deg,rgba(255,255,255,0.03) 0,rgba(255,255,255,0.03) 1px,transparent 1px,transparent 60px),
   repeating-linear-gradient(0deg,rgba(255,255,255,0.03) 0,rgba(255,255,255,0.03) 1px,transparent 1px,transparent 60px),
   linear-gradient(180deg,#111118 0%,#0d0d14 100%);
 transform:rotateX(70deg);transform-origin:top center;
 box-shadow:inset 0 -100px 200px rgba(0,0,0,0.9);
}
.floor-glow {
 position:absolute;bottom:8%;left:50%;transform:translateX(-50%);
 width:80%;height:3px;background:linear-gradient(90deg,transparent,rgba(57,255,20,0.15),transparent);
 filter:blur(8px);
}


/* Ceiling */
.ceiling {
 position:absolute;top:0;left:-30%;width:160%;height:30%;
 background:linear-gradient(180deg,#050508 0%,#0a0a10 100%);
 transform:rotateX(-60deg);transform-origin:bottom center;
}


/* Back wall */
.back-wall {
 position:absolute;top:0;left:0;right:0;bottom:0;
 background:linear-gradient(180deg,#0c0c16 0%,#0f0f1a 60%,#0a0a12 100%);
 z-index:0;
}


/* Shelving units - 3D boxes */
.shelf-unit {
 position:absolute;bottom:35%;transform-style:preserve-3d;
}


/* Neon sign on wall */
.neon-sign {
 position:absolute;top:8%;left:50%;transform:translateX(-50%);
 font-family:'Bebas Neue',sans-serif;font-size:52px;letter-spacing:8px;
 display:flex;gap:4px;align-items:center;white-space:nowrap;z-index:10;
}
.ns-7 { color:var(--se-red);text-shadow:0 0 15px var(--se-red),0 0 40px rgba(232,33,42,0.6); animation:neon-flicker1 5s infinite; }
.ns-e { color:white;text-shadow:0 0 15px white,0 0 30px rgba(255,255,255,0.4); }
.ns-stripe {
 display:inline-block;width:60px;height:8px;margin:0 8px;
 background:linear-gradient(90deg,var(--se-red),var(--se-orange),var(--se-green));
 box-shadow:0 0 15px rgba(247,148,29,0.8);border-radius:4px;
 animation:stripe-pulse 3s infinite;
}
@keyframes neon-flicker1 {
 0%,88%,92%,100%{opacity:1;} 90%{opacity:0.1;} 91%{opacity:0.9;}
}
@keyframes stripe-pulse {
 0%,100%{opacity:1;} 50%{opacity:0.5;}
}


/* Ceiling light strips */
.ceiling-light {
 position:absolute;top:18%;width:100%;height:2px;
 background:linear-gradient(90deg,transparent 5%,rgba(200,220,255,0.4) 20%,rgba(200,220,255,0.6) 50%,rgba(200,220,255,0.4) 80%,transparent 95%);
 filter:blur(2px);
 animation:light-flicker 6s infinite;
}
@keyframes light-flicker {
 0%,94%,100%{opacity:0.8;} 95%{opacity:0.1;} 96.5%{opacity:0.7;} 97.5%{opacity:0.15;} 98.5%{opacity:0.8;}
}
.ceiling-light-glow {
 position:absolute;top:16%;width:100%;height:30px;
 background:linear-gradient(180deg,transparent,rgba(180,200,255,0.04),transparent);
 animation:light-flicker 6s infinite;
}


/* Product shelves visual */
.shelf-row {
 position:absolute;left:0;right:0;height:60px;
 display:flex;align-items:center;
 border-bottom:2px solid rgba(255,255,255,0.06);
 padding:0 10px;gap:8px;
}


/* The interactive hotspot zones */
.zone {
 position:absolute;cursor:none;transition:all .3s;z-index:20;
}
.zone::after {
 content:'';position:absolute;inset:-6px;border:1px solid transparent;border-radius:2px;
 transition:all .3s;pointer-events:none;
}
.zone:hover::after {
 border-color:var(--neon-orange);
 box-shadow:0 0 20px rgba(255,107,0,0.3),inset 0 0 15px rgba(255,107,0,0.05);
}
.zone-label {
 position:absolute;bottom:calc(100% + 10px);left:50%;transform:translateX(-50%);
 font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--neon-orange);
 letter-spacing:2px;white-space:nowrap;opacity:0;transition:opacity .3s;
 text-shadow:0 0 8px var(--neon-orange);pointer-events:none;
}
.zone:hover .zone-label { opacity:1; }


/* === COFFEE MACHINE ZONE === */
.coffee-machine {
 left:8%;bottom:35%;width:130px;height:160px;
}
.cm-body {
 width:100%;height:100%;
 background:linear-gradient(145deg,#1a1a2a,#0d0d16,#111120);
 border:1px solid rgba(255,255,255,0.08);border-radius:4px 4px 0 0;
 position:relative;overflow:hidden;
 box-shadow:0 0 30px rgba(0,0,0,0.9),inset 2px 0 6px rgba(255,255,255,0.04);
}
.cm-screen {
 position:absolute;top:12px;left:10px;right:10px;height:55px;
 background:#000;border:1px solid rgba(57,255,20,0.3);
 display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;padding:5px;
}
.cm-symbol {
 font-family:'Share Tech Mono',monospace;font-size:18px;color:var(--neon-green);
 text-shadow:0 0 8px var(--neon-green);
 animation:symbol-blink 1.2s infinite;
}
.cm-symbol:nth-child(2){animation-delay:.3s;}
.cm-symbol:nth-child(3){animation-delay:.6s;}
.cm-symbol:nth-child(4){animation-delay:.9s;}
@keyframes symbol-blink {
 0%,100%{opacity:1;} 50%{opacity:0.2;}
}
.cm-brand {
 position:absolute;bottom:8px;left:50%;transform:translateX(-50%);
 font-family:'Share Tech Mono',monospace;font-size:8px;color:rgba(255,255,255,0.2);letter-spacing:2px;
}
.cm-nozzle {
 position:absolute;bottom:-12px;left:50%;transform:translateX(-50%);
 width:20px;height:14px;background:#0d0d16;border:1px solid rgba(255,255,255,0.05);border-radius:0 0 4px 4px;
}


/* === MUG SHELF === */
.mug-shelf {
 left:8%;bottom:20%;width:170px;height:80px;
}
.mug-shelf-board {
 position:absolute;bottom:0;left:0;right:0;height:8px;
 background:linear-gradient(180deg,#2a2a3a,#1a1a26);
 border-bottom:2px solid rgba(255,107,0,0.2);
}
.mug-row {
 position:absolute;bottom:8px;left:5px;right:5px;
 display:flex;gap:8px;align-items:flex-end;
}
.mug-3d {
 width:32px;height:36px;position:relative;cursor:pointer;transition:transform .2s;
}
.mug-3d:hover { transform:translateY(-4px) scale(1.05); }
.mug-body {
 width:28px;height:32px;border-radius:3px 3px 5px 5px;
 position:relative;display:flex;align-items:center;justify-content:center;
 font-family:'Share Tech Mono',monospace;font-size:11px;font-weight:700;
 text-shadow:0 0 6px currentColor;border-bottom:2px solid rgba(0,0,0,0.5);
}
.mug-handle {
 position:absolute;right:-8px;top:8px;width:10px;height:14px;
 border:3px solid;border-left:none;border-radius:0 4px 4px 0;opacity:0.7;
}
.mug-letter {
 position:absolute;bottom:-16px;left:50%;transform:translateX(-50%);
 font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--dim);letter-spacing:1px;
}


/* === RECEIPT ZONE === */
.receipt-zone {
 right:12%;bottom:32%;width:80px;height:110px;
}
.receipt-paper {
 width:65px;height:100px;background:linear-gradient(180deg,#f0e8d0,#e8ddc0);
 border-radius:0 0 3px 3px;position:relative;padding:6px;
 box-shadow:2px 4px 15px rgba(0,0,0,0.8),-2px 0 6px rgba(0,0,0,0.4);
 transform:rotate(-3deg);
}
.receipt-line {
 height:5px;background:rgba(0,0,0,0.15);border-radius:2px;margin-bottom:4px;
}
.receipt-line.color-hint {
 height:7px;border-radius:2px;margin-bottom:3px;
}
.receipt-top {
 font-family:'Share Tech Mono',monospace;font-size:5px;color:rgba(0,0,0,0.5);
 text-align:center;margin-bottom:6px;letter-spacing:1px;
}


/* === CASH REGISTER === */
.cash-register {
 right:8%;bottom:33%;width:140px;height:120px;
}
.cr-body {
 width:100%;height:100%;background:linear-gradient(145deg,#1e1e2e,#111120);
 border:1px solid rgba(255,255,255,0.06);border-radius:4px;
 position:relative;box-shadow:0 0 40px rgba(0,0,0,0.9);
}
.cr-screen {
 position:absolute;top:10px;left:8px;right:8px;height:40px;
 background:#000;border:1px solid rgba(0,212,255,0.3);
 display:flex;align-items:center;justify-content:center;
 font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--neon-blue);
 letter-spacing:2px;text-shadow:0 0 8px var(--neon-blue);
}
.cr-keypad {
 position:absolute;bottom:12px;left:8px;right:8px;
 display:grid;grid-template-columns:repeat(4,1fr);gap:4px;
}
.cr-key {
 height:14px;background:rgba(255,255,255,0.05);border-radius:2px;
 border:1px solid rgba(255,255,255,0.04);
}
.cr-slot {
 position:absolute;top:58px;left:8px;right:8px;height:6px;
 background:#000;border-radius:1px;border:1px solid rgba(255,255,255,0.06);
}


/* === BACK DOOR === */
.back-door {
 position:absolute;top:20%;right:18%;width:70px;height:55%;
 background:linear-gradient(180deg,#0d0d18,#0a0a14);
 border:1px solid rgba(255,255,255,0.06);
 box-shadow:inset 0 0 30px rgba(0,0,0,0.9);cursor:none;z-index:10;
}
.door-frame {
 position:absolute;inset:-3px;border:3px solid rgba(255,255,255,0.05);pointer-events:none;
}
.door-knob {
 position:absolute;top:50%;left:12px;transform:translateY(-50%);
 width:10px;height:10px;background:#2a2a3a;border-radius:50%;border:1px solid rgba(255,255,255,0.1);
}
.door-sign {
 position:absolute;top:15px;left:50%;transform:translateX(-50%);
 font-family:'Share Tech Mono',monospace;font-size:7px;letter-spacing:2px;
 color:rgba(255,255,255,0.15);text-transform:uppercase;white-space:nowrap;
}
.door-locked-icon {
 position:absolute;top:35%;left:50%;transform:translate(-50%,-50%);
 font-size:20px;filter:grayscale(1) brightness(0.3);
}


/* === ENTRANCE DOOR === */
.entrance {
 position:absolute;top:15%;left:15%;width:80px;height:65%;
 z-index:10;
}
.entrance-frame {
 width:100%;height:100%;
 border:3px solid rgba(255,255,255,0.04);
 background:linear-gradient(180deg,rgba(20,20,40,0.8),rgba(10,10,20,0.95));
 position:relative;overflow:hidden;
}
.entrance-glass {
 position:absolute;inset:5px;
 background:linear-gradient(135deg,rgba(50,80,120,0.15),rgba(20,30,60,0.1));
 border:1px solid rgba(100,150,200,0.06);
}
.entrance-bars {
 position:absolute;inset:5px;
 background:repeating-linear-gradient(0deg,transparent,transparent 20px,rgba(255,255,255,0.02) 20px,rgba(255,255,255,0.02) 21px);
}
.entrance-locked {
 position:absolute;bottom:20px;left:50%;transform:translateX(-50%);
 font-family:'Share Tech Mono',monospace;font-size:7px;color:var(--neon-red);
 letter-spacing:2px;text-align:center;animation:pulse-red 1.5s infinite;
}
@keyframes pulse-red {
 0%,100%{opacity:1;text-shadow:0 0 5px var(--neon-red);}
 50%{opacity:0.4;text-shadow:none;}
}


/* === PRODUCT SHELVES (back wall) === */
.product-shelves {
 position:absolute;top:20%;left:25%;right:35%;bottom:35%;
 display:flex;flex-direction:column;gap:0;z-index:5;
}
.ps-shelf {
 flex:1;display:flex;align-items:center;gap:6px;padding:0 10px;
 border-bottom:1px solid rgba(255,255,255,0.04);
}
.ps-product {
 width:20px;height:28px;border-radius:2px;position:relative;
}
.ps-product-label {
 position:absolute;bottom:2px;left:0;right:0;
 height:3px;background:rgba(255,255,255,0.2);border-radius:1px;
}


/* === MODALS / PUZZLE PANELS === */
.modal-overlay {
 position:fixed;inset:0;z-index:500;
 background:rgba(0,0,0,0.88);backdrop-filter:blur(4px);
 display:flex;align-items:center;justify-content:center;
}
.modal-panel {
 background:var(--panel);border:1px solid rgba(57,255,20,0.2);
 border-radius:2px;padding:30px 35px;min-width:360px;max-width:500px;
 position:relative;box-shadow:0 0 80px rgba(0,0,0,0.9),0 0 30px rgba(57,255,20,0.05);
}
.modal-panel.orange { border-color:rgba(255,107,0,0.3);box-shadow:0 0 80px rgba(0,0,0,0.9),0 0 30px rgba(255,107,0,0.1); }
.modal-panel.blue { border-color:rgba(0,212,255,0.3);box-shadow:0 0 80px rgba(0,0,0,0.9),0 0 30px rgba(0,212,255,0.1); }
.modal-panel.red { border-color:rgba(255,36,66,0.4);box-shadow:0 0 80px rgba(0,0,0,0.9),0 0 40px rgba(255,36,66,0.15); }


.modal-title {
 font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:4px;margin-bottom:6px;
}
.modal-subtitle {
 font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--dim);
 letter-spacing:2px;margin-bottom:22px;text-transform:uppercase;
}
.modal-close {
 position:absolute;top:12px;right:15px;background:none;border:none;
 color:var(--dim);font-size:18px;cursor:pointer;opacity:0.5;transition:opacity .2s;
 font-family:'Share Tech Mono',monospace;
}
.modal-close:hover { opacity:1;color:var(--neon-red); }


/* Puzzle: Coffee machine symbols */
.symbol-display {
 display:flex;gap:12px;justify-content:center;padding:15px;
 background:#000;border:1px solid rgba(57,255,20,0.2);margin-bottom:20px;
 border-radius:2px;
}
.sym {
 font-family:'Share Tech Mono',monospace;font-size:32px;color:var(--neon-green);
 text-shadow:0 0 15px var(--neon-green);animation:symbol-blink 1.5s infinite;
}
.sym:nth-child(2){animation-delay:.4s;}
.sym:nth-child(3){animation-delay:.8s;}
.sym:nth-child(4){animation-delay:1.2s;}


.clue-box {
 background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.06);
 padding:12px 15px;margin-bottom:15px;border-radius:2px;
 font-family:'Share Tech Mono',monospace;font-size:12px;color:var(--dim);line-height:1.8;
}
.clue-box span { color:var(--neon-green);font-weight:700; }
.clue-box .orange { color:var(--neon-orange); }
.clue-box .blue { color:var(--neon-blue); }


.input-row {
 display:flex;gap:8px;align-items:center;margin-bottom:12px;
}
.puzzle-input {
 background:#000;border:1px solid rgba(57,255,20,0.3);color:var(--neon-green);
 font-family:'Share Tech Mono',monospace;font-size:18px;letter-spacing:4px;
 padding:10px 15px;flex:1;outline:none;text-transform:uppercase;
 text-shadow:0 0 8px var(--neon-green);
}
.puzzle-input::placeholder { color:rgba(57,255,20,0.2); }
.puzzle-input.orange { border-color:rgba(255,107,0,0.3);color:var(--neon-orange);text-shadow:0 0 8px var(--neon-orange); }
.puzzle-input.blue { border-color:rgba(0,212,255,0.3);color:var(--neon-blue);text-shadow:0 0 8px var(--neon-blue); }


.puzzle-btn {
 padding:10px 20px;background:transparent;border:1px solid currentColor;
 font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:3px;cursor:pointer;
 transition:all .2s;
}
.puzzle-btn.green { color:var(--neon-green);border-color:var(--neon-green); }
.puzzle-btn.green:hover { background:rgba(57,255,20,0.1);box-shadow:0 0 20px rgba(57,255,20,0.3); }
.puzzle-btn.orange { color:var(--neon-orange);border-color:var(--neon-orange); }
.puzzle-btn.orange:hover { background:rgba(255,107,0,0.1);box-shadow:0 0 20px rgba(255,107,0,0.3); }
.puzzle-btn.blue { color:var(--neon-blue);border-color:var(--neon-blue); }
.puzzle-btn.blue:hover { background:rgba(0,212,255,0.1);box-shadow:0 0 20px rgba(0,212,255,0.3); }


.feedback {
 font-family:'Share Tech Mono',monospace;font-size:12px;letter-spacing:2px;
 margin-top:8px;height:16px;transition:all .3s;
}
.feedback.error { color:var(--neon-red);text-shadow:0 0 8px var(--neon-red); }
.feedback.success { color:var(--neon-green);text-shadow:0 0 8px var(--neon-green); }


/* Color sequence puzzle */
.color-seq {
 display:flex;gap:10px;justify-content:center;margin-bottom:20px;
}
.color-btn-big {
 width:60px;height:60px;border-radius:4px;border:2px solid rgba(255,255,255,0.1);
 cursor:pointer;transition:all .2s;position:relative;
}
.color-btn-big:hover { transform:scale(1.1);border-color:rgba(255,255,255,0.3); }
.color-btn-big.selected {
 border-color:white;box-shadow:0 0 20px currentColor;transform:scale(1.05);
}
.color-btn-big.R { background:var(--neon-red);color:var(--neon-red); }
.color-btn-big.G { background:var(--neon-green);color:var(--neon-green); }
.color-btn-big.B { background:var(--neon-blue);color:var(--neon-blue); }
.color-btn-big.O { background:var(--neon-orange);color:var(--neon-orange); }


.seq-display {
 display:flex;gap:6px;justify-content:center;margin-bottom:15px;flex-wrap:wrap;
}
.seq-dot {
 width:28px;height:28px;border-radius:50%;border:2px solid rgba(255,255,255,0.1);
 transition:all .2s;
}
.seq-dot.filled { border-color:rgba(255,255,255,0.4); }


/* Receipt view */
.receipt-view {
 background:linear-gradient(180deg,#f0e8d0,#e8ddc0);color:#1a1a1a;
 padding:20px 15px;border-radius:2px;font-family:'Share Tech Mono',monospace;
 font-size:11px;line-height:1.9;box-shadow:3px 3px 20px rgba(0,0,0,0.5);
}
.rv-header { text-align:center;font-size:13px;font-weight:700;margin-bottom:10px;letter-spacing:2px; }
.rv-item { display:flex;justify-content:space-between;border-bottom:1px dashed rgba(0,0,0,0.1);padding-bottom:2px; }
.rv-highlight { color:var(--se-red);font-weight:700;font-size:13px;letter-spacing:1px; }
.rv-note { margin-top:10px;padding:8px;background:rgba(0,0,0,0.06);border-left:3px solid var(--se-red);font-size:10px;color:#444; }


/* Secret compartment */
.secret-comp {
 background:#0a0a0f;border:1px solid rgba(255,107,0,0.2);padding:20px;border-radius:2px;
}
.vip-card-burnt {
 width:100%;height:80px;
 background:linear-gradient(135deg,#1a0a00,#2a1000,#0d0d00);
 border:1px solid rgba(255,107,0,0.3);border-radius:4px;
 position:relative;overflow:hidden;display:flex;align-items:center;padding:10px 15px;
 box-shadow:0 0 30px rgba(255,107,0,0.2),inset 0 0 20px rgba(0,0,0,0.8);
 margin-bottom:15px;
}
.vip-card-burnt::before {
 content:'';position:absolute;top:0;right:0;width:60%;height:100%;
 background:linear-gradient(135deg,transparent 30%,rgba(60,20,0,0.6),rgba(20,10,0,0.9));
 pointer-events:none;
}
.vip-logo-burnt {
 font-family:'Bebas Neue',sans-serif;font-size:28px;color:rgba(232,33,42,0.6);
 letter-spacing:3px;text-shadow:0 0 10px rgba(232,33,42,0.3);
}
.vip-text {
 margin-left:15px;font-family:'Share Tech Mono',monospace;font-size:10px;
 color:rgba(255,200,100,0.5);letter-spacing:2px;line-height:1.8;
}
.vip-number {
 position:absolute;bottom:8px;right:12px;font-family:'Share Tech Mono',monospace;
 font-size:11px;color:rgba(255,107,0,0.5);letter-spacing:3px;
}


/* Mug puzzle view */
.mug-grid {
 display:flex;gap:15px;justify-content:center;margin:20px 0;
}
.mug-detail {
 text-align:center;cursor:pointer;transition:transform .2s;
}
.mug-detail:hover { transform:translateY(-5px); }
.mug-d-body {
 width:50px;height:60px;border-radius:4px 4px 8px 8px;
 display:flex;align-items:center;justify-content:center;
 font-family:'Share Tech Mono',monospace;font-size:22px;font-weight:700;
 border-bottom:3px solid rgba(0,0,0,0.4);position:relative;
}
.mug-d-handle {
 position:absolute;right:-12px;top:15px;width:14px;height:20px;
 border:4px solid;border-left:none;border-radius:0 6px 6px 0;opacity:0.7;
}
.mug-d-under {
 margin-top:8px;font-family:'Share Tech Mono',monospace;font-size:10px;
 color:var(--neon-orange);letter-spacing:1px;
}
.mug-under-hidden { filter:blur(6px);transition:filter .3s; }
.mug-under-hidden:hover { filter:blur(0); }


/* Notebook clue */
.notebook {
 background:#f5f0e0;color:#1a1a1a;padding:20px;border-radius:2px;
 font-family:'Share Tech Mono',monospace;font-size:11px;line-height:2;
 border-left:4px solid var(--se-red);box-shadow:3px 3px 15px rgba(0,0,0,0.5);
}
.notebook-title { font-size:14px;font-weight:700;margin-bottom:12px;letter-spacing:2px;color:#333; }
.notebook-line { border-bottom:1px solid rgba(0,0,0,0.1);padding-bottom:2px;margin-bottom:6px; }
.notebook-highlight { color:var(--se-red);font-weight:700; }


/* Inventory bar */
.inventory {
 position:fixed;bottom:20px;left:50%;transform:translateX(-50%);
 display:flex;gap:8px;z-index:200;
 background:rgba(5,5,10,0.9);border:1px solid rgba(255,255,255,0.06);
 padding:8px 12px;border-radius:3px;
}
.inv-slot {
 width:48px;height:48px;border:1px solid rgba(255,255,255,0.06);border-radius:2px;
 background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;
 font-size:10px;color:var(--dim);font-family:'Share Tech Mono',monospace;letter-spacing:1px;
 text-align:center;transition:all .3s;
}
.inv-slot.has-item {
 border-color:rgba(57,255,20,0.3);background:rgba(57,255,20,0.05);
 box-shadow:0 0 10px rgba(57,255,20,0.1);
}
.inv-item-icon { font-size:22px; }
.inv-item-name {
 font-family:'Share Tech Mono',monospace;font-size:7px;letter-spacing:1px;
 color:var(--neon-green);margin-top:2px;line-height:1.2;text-align:center;
}


/* HUD */
.hud {
 position:fixed;top:0;left:0;right:0;z-index:200;
 display:flex;justify-content:space-between;align-items:center;
 padding:12px 20px;background:rgba(5,5,10,0.8);
 border-bottom:1px solid rgba(255,255,255,0.04);pointer-events:none;
}
.hud-time {
 font-family:'Share Tech Mono',monospace;font-size:22px;color:var(--neon-green);
 text-shadow:0 0 10px var(--neon-green);letter-spacing:4px;
 animation:time-flicker 8s infinite;
}
.hud-title {
 font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:6px;color:rgba(255,255,255,0.3);
}
.hud-progress {
 display:flex;gap:8px;align-items:center;
 font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--dim);letter-spacing:2px;
}
.prog-dot {
 width:8px;height:8px;border-radius:50%;border:1px solid rgba(57,255,20,0.3);
 transition:all .4s;
}
.prog-dot.done { background:var(--neon-green);border-color:var(--neon-green);box-shadow:0 0 8px var(--neon-green); }


/* Notification */
.notif {
 position:fixed;top:70px;left:50%;transform:translateX(-50%);z-index:300;
 font-family:'Share Tech Mono',monospace;font-size:13px;letter-spacing:2px;
 padding:12px 25px;border-radius:2px;
 animation:notif-in .4s cubic-bezier(.34,1.56,.64,1) forwards;
}
.notif.success { background:rgba(0,30,0,0.9);border:1px solid var(--neon-green);color:var(--neon-green);box-shadow:0 0 30px rgba(57,255,20,0.2); }
.notif.info { background:rgba(0,10,30,0.9);border:1px solid var(--neon-orange);color:var(--neon-orange);box-shadow:0 0 30px rgba(255,107,0,0.2); }
.notif.error { background:rgba(30,0,0,0.9);border:1px solid var(--neon-red);color:var(--neon-red);box-shadow:0 0 30px rgba(255,36,66,0.2); }
@keyframes notif-in {
 from{opacity:0;transform:translateX(-50%) translateY(-15px) scale(.9);}
 to{opacity:1;transform:translateX(-50%) translateY(0) scale(1);}
}


/* Win screen */
.win-screen {
 position:fixed;inset:0;z-index:600;
 background:radial-gradient(ellipse at center,rgba(20,40,10,0.98) 0%,rgba(0,0,0,0.99) 100%);
 display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;
}
.win-title {
 font-family:'Bebas Neue',sans-serif;font-size:80px;letter-spacing:8px;
 color:var(--neon-green);text-shadow:0 0 40px var(--neon-green),0 0 100px rgba(57,255,20,0.4);
 animation:win-pulse 2s infinite;
}
@keyframes win-pulse {
 0%,100%{text-shadow:0 0 40px var(--neon-green),0 0 100px rgba(57,255,20,0.4);}
 50%{text-shadow:0 0 80px var(--neon-green),0 0 200px rgba(57,255,20,0.6);}
}
.win-card {
 width:300px;height:170px;
 background:linear-gradient(135deg,var(--se-green) 0%,#004d1f 30%,#003d18 60%,#005a22 100%);
 border-radius:10px;position:relative;overflow:hidden;
 box-shadow:0 0 60px rgba(0,122,51,0.6),0 0 120px rgba(57,255,20,0.3);
 animation:card-float 3s ease-in-out infinite;
}
@keyframes card-float {
 0%,100%{transform:translateY(0) rotateY(-5deg);}
 50%{transform:translateY(-12px) rotateY(5deg);}
}
.win-card::before {
 content:'';position:absolute;inset:0;
 background:repeating-linear-gradient(45deg,transparent,transparent 10px,rgba(255,255,255,0.02) 10px,rgba(255,255,255,0.02) 11px);
}
.win-card-logo {
 position:absolute;top:20px;left:20px;
 font-family:'Bebas Neue',sans-serif;font-size:48px;color:white;letter-spacing:2px;
 text-shadow:0 2px 8px rgba(0,0,0,0.5);
}
.win-card-stripe {
 position:absolute;bottom:0;left:0;right:0;height:40px;
 background:linear-gradient(90deg,var(--se-red),var(--se-orange),var(--se-green));
}
.win-card-vip {
 position:absolute;top:25px;right:20px;
 font-family:'Bebas Neue',sans-serif;font-size:22px;color:rgba(255,255,255,0.9);
 letter-spacing:4px;text-shadow:0 0 10px rgba(255,255,255,0.3);
}
.win-card-number {
 position:absolute;bottom:55px;left:20px;right:20px;
 font-family:'Share Tech Mono',monospace;font-size:14px;color:rgba(255,255,255,0.7);
 letter-spacing:4px;
}
.win-msg {
 font-family:'Share Tech Mono',monospace;font-size:13px;color:var(--dim);
 letter-spacing:2px;text-align:center;max-width:400px;line-height:1.8;
}
.play-again {
 padding:12px 40px;background:transparent;border:2px solid var(--neon-green);
 color:var(--neon-green);font-family:'Bebas Neue',sans-serif;font-size:24px;
 letter-spacing:5px;cursor:pointer;transition:all .2s;
 text-shadow:0 0 8px var(--neon-green);
}
.play-again:hover { background:rgba(57,255,20,0.1);box-shadow:0 0 30px rgba(57,255,20,0.4); }


/* Scan lines overlay */
.scanlines {
 position:fixed;inset:0;z-index:400;pointer-events:none;
 background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px);
}
.vignette {
 position:fixed;inset:0;z-index:399;pointer-events:none;
 background:radial-gradient(ellipse at center,transparent 50%,rgba(0,0,0,0.7) 100%);
}
</style>


