<template>
  <div class="bat-bar-app">
    <!-- FX layers -->
      <div class="fx-scanlines"></div>
      <div class="fx-vignette"></div>

      <!-- ═══ INTRO ═══ -->
      <div class="intro" v-if="phase==='intro'">
        <svg class="intro-bat" viewBox="0 0 200 120">
          <path d="M100,95 C85,85 60,80 30,88 C10,93 0,85 5,70 C12,55 30,55 42,62 C30,52 28,38 38,32 C48,26 58,36 62,48 C68,32 80,22 100,20 C120,22 132,32 138,48 C142,36 152,26 162,32 C172,38 170,52 158,62 C170,55 188,55 195,70 C200,85 190,93 170,88 C140,80 115,85 100,95 Z" fill="#0a0a0a" stroke="#cc1122" stroke-width="2"/>
        </svg>
        <div class="intro-title">THE BAT BAR</div>
        <div class="intro-sub">RED TEAM OPERATIONS — GOTHAM CITY</div>
        <button class="intro-btn" @click="phase='game'">ENTER THE BAR</button>
      </div>

      <!-- ═══ GAME ═══ -->
      <template v-if="phase==='game' || phase==='win'">

        <!-- HUD -->
        <div class="hud">
          <div class="hud-left">
            <svg class="bat-icon-small" viewBox="0 0 200 120">
              <path d="M100,95 C85,85 60,80 30,88 C10,93 0,85 5,70 C12,55 30,55 42,62 C30,52 28,38 38,32 C48,26 58,36 62,48 C68,32 80,22 100,20 C120,22 132,32 138,48 C142,36 152,26 162,32 C172,38 170,52 158,62 C170,55 188,55 195,70 C200,85 190,93 170,88 C140,80 115,85 100,95 Z" fill="var(--black)" stroke="var(--red)" stroke-width="3"/>
            </svg>
            <div class="bar-name">THE BAT BAR</div>
          </div>
          <div class="hud-right">
            <div class="mission-counter">UPPDRAG {{ doneCount }}/{{ missions.length }}</div>
            <div class="xp-bar-wrap">
              <div class="xp-label">XP</div>
              <div class="xp-track"><div class="xp-fill" :style="{width: xp+'%'}"></div></div>
              <div class="xp-label" style="color:var(--bat-yellow)">{{ Math.round(xp) }}</div>
            </div>
          </div>
        </div>

        <!-- Mission panel -->
        <div class="mission-panel" :class="{hidden: !panelOpen}">
          <div class="panel-title">UPPDRAG</div>
          <div v-for="m in missions" :key="m.id"
               class="mission-card"
               :class="{active: activeMission===m.id, done: m.done}"
               @click="!m.done && setActive(m.id)">
            <div class="mc-title">{{ m.title }}</div>
            <div class="mc-desc">{{ m.desc }}</div>
            <div class="mc-reward">+{{ m.xp }} XP</div>
            <div class="mc-done-badge" v-if="m.done">✓ KLART</div>
          </div>
        </div>
        <div class="panel-toggle" :class="{'hidden-toggle':!panelOpen}" @click="panelOpen=!panelOpen">
          {{ panelOpen ? '◀' : '▶' }}
        </div>

        <!-- ═══ 3D BAR SCENE ═══ -->
        <div class="bar-scene">
          <!-- Back wall -->
          <div class="back-wall"></div>
          <div class="wall-stripe"></div>

          <!-- Batman emblem on wall -->
          <div class="bat-signal">
            <svg class="bat-emblem-wall" viewBox="0 0 200 120">
              <path d="M100,95 C85,85 60,80 30,88 C10,93 0,85 5,70 C12,55 30,55 42,62 C30,52 28,38 38,32 C48,26 58,36 62,48 C68,32 80,22 100,20 C120,22 132,32 138,48 C142,36 152,26 162,32 C172,38 170,52 158,62 C170,55 188,55 195,70 C200,85 190,93 170,88 C140,80 115,85 100,95 Z" fill="var(--black)" stroke="var(--red)" stroke-width="2.5"/>
            </svg>
          </div>

          <!-- Ceiling -->
          <div class="ceiling"></div>

          <!-- Bottle shelf (back wall) -->
          <div class="bottle-shelf">
            <div v-for="b in bottles" :key="b.id" class="bottle hotspot"
                 @click="openBottle(b)"
                 :style="{height: b.h+'px'}">
              <div class="hotspot-label">{{ b.name }}</div>
              <div class="bottle-neck" :style="{height:'20px', background:b.color, width:'8px', borderRadius:'3px 3px 0 0'}"></div>
              <div class="bottle-body" :style="{height:(b.h-20)+'px', background:`linear-gradient(180deg, ${b.color} 0%, ${b.colorDark} 100%)`, width:'20px'}">
                <div class="bottle-label">{{ b.short }}</div>
              </div>
            </div>
            <div class="shelf-board"></div>
          </div>

          <!-- Ambient glow -->
          <div class="ambient-red"></div>

          <!-- Beer taps -->
          <div class="tap-group">
            <div v-for="tap in taps" :key="tap.id"
                 class="tap hotspot"
                 @click="activateTap(tap)">
              <div class="hotspot-label">{{ tap.name }}</div>
              <div class="tap-pipe" :style="{background:`linear-gradient(90deg, #444, ${tap.color}, #555)`}"></div>
              <div class="tap-head" :style="{background:`linear-gradient(180deg, ${tap.color}, #555)`}"></div>
              <div class="tap-base"></div>
              <div class="tap-label">{{ tap.short }}</div>
            </div>
          </div>

          <!-- Bar counter -->
          <div class="bar-counter">
            <div class="counter-top"></div>
            <div class="counter-front">
              <!-- Embedded Batman emblem on counter front -->
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.08;">
                <svg width="70" height="42" viewBox="0 0 200 120">
                  <path d="M100,95 C85,85 60,80 30,88 C10,93 0,85 5,70 C12,55 30,55 42,62 C30,52 28,38 38,32 C48,26 58,36 62,48 C68,32 80,22 100,20 C120,22 132,32 138,48 C142,36 152,26 162,32 C172,38 170,52 158,62 C170,55 188,55 195,70 C200,85 190,93 170,88 C140,80 115,85 100,95 Z" fill="var(--red)"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- Floor -->
          <div class="floor"></div>
          <div class="floor-reflect"></div>

          <!-- MISSION HOTSPOTS on bar -->

          <!-- Safe / register (right side) -->
          <div class="hotspot" style="right:12%;bottom:28%;width:90px;height:80px;"
               @click="openMissionModal('safe')">
            <div class="hotspot-label">KASSASKÅP</div>
            <div style="width:90px;height:80px;background:linear-gradient(145deg,#1a1a2a,#0d0d14);border:1px solid rgba(204,17,34,0.2);border-radius:4px;display:flex;align-items:center;justify-content:center;box-shadow:0 5px 20px rgba(0,0,0,0.7);">
              <div style="text-align:center;">
                <div style="font-size:22px;margin-bottom:4px;">🔒</div>
                <div style="font-family:'Share Tech Mono',monospace;font-size:7px;color:rgba(204,17,34,0.6);letter-spacing:2px;">LOCKED</div>
              </div>
            </div>
          </div>

          <!-- Jukebox left side -->
          <div class="hotspot" style="left:10%;bottom:28%;width:80px;height:110px;"
               @click="openMissionModal('jukebox')">
            <div class="hotspot-label">JUKEBOX</div>
            <div style="width:80px;height:110px;background:linear-gradient(145deg,#1a0a0d,#0d0508);border:1px solid rgba(204,17,34,0.25);border-radius:6px;position:relative;overflow:hidden;box-shadow:0 5px 25px rgba(0,0,0,0.8);">
              <div style="position:absolute;top:8px;left:8px;right:8px;height:35px;background:#000;border-radius:3px;border:1px solid rgba(204,17,34,0.3);display:flex;align-items:center;justify-content:center;">
                <div style="width:28px;height:28px;border-radius:50%;background:radial-gradient(circle,#333,#111);border:2px solid rgba(204,17,34,0.3);"></div>
              </div>
              <div style="position:absolute;bottom:8px;left:8px;right:8px;display:grid;grid-template-columns:1fr 1fr;gap:3px;">
                <div v-for="i in 4" :key="i" style="height:10px;background:rgba(204,17,34,0.2);border-radius:1px;"></div>
              </div>
              <div style="position:absolute;bottom:30px;left:50%;transform:translateX(-50%);font-family:'Share Tech Mono',monospace;font-size:6px;color:rgba(204,17,34,0.5);letter-spacing:1px;white-space:nowrap;">RED TEAM FM</div>
            </div>
          </div>

          <!-- Chalkboard menu -->
          <div class="hotspot" style="right:22%;top:22%;width:110px;height:90px;"
               @click="openMissionModal('menu')">
            <div class="hotspot-label">MENY</div>
            <div style="width:110px;height:90px;background:linear-gradient(145deg,#0d1a0d,#080d08);border:2px solid rgba(255,255,255,0.06);border-radius:2px;padding:8px;box-shadow:0 5px 20px rgba(0,0,0,0.7);">
              <div style="font-family:'Share Tech Mono',monospace;font-size:7px;color:rgba(240,192,64,0.6);letter-spacing:2px;margin-bottom:5px;text-align:center;">TONIGHT'S MENU</div>
              <div v-for="i in 4" :key="i" style="height:2px;background:rgba(255,255,255,0.08);margin-bottom:5px;border-radius:1px;"></div>
              <div style="height:2px;background:rgba(204,17,34,0.3);margin-bottom:5px;border-radius:1px;"></div>
              <div v-for="i in 2" :key="i" style="height:2px;background:rgba(255,255,255,0.06);margin-bottom:5px;border-radius:1px;"></div>
            </div>
          </div>

        </div><!-- /bar-scene -->

        <!-- ═══ MODALS ═══ -->

        <!-- DRINK MIXER MISSION -->
        <div class="modal-overlay" v-if="modal==='drink'" @click.self="modal=null">
          <div class="modal">
            <button class="modal-close" @click="modal=null">✕</button>
            <div class="modal-eyebrow">UPPDRAG 01 — BARTENDER</div>
            <div class="modal-title">BLANDA RÄTT DRINK</div>
            <div class="modal-desc">Bruce Wayne beställer sin favorit. Blanda ingredienserna i exakt rätt ordning.</div>
            <div style="font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--dim);letter-spacing:2px;margin-bottom:12px;">
              RECEPT: {{ drinkPuzzle.recipe.join(' → ') }}
            </div>
            <div class="drink-slots">
              <div v-for="(slot,i) in drinkPuzzle.slots" :key="i"
                   class="drink-slot"
                   :class="{filled: slot !== null, correct: slot !== null && slot === drinkPuzzle.recipe[i], wrong: slot !== null && slot !== drinkPuzzle.recipe[i]}">
                <span v-if="slot" style="font-size:10px;color:var(--cream);text-align:center;letter-spacing:0.5px;">{{ slot }}</span>
                <span v-else style="font-size:18px;opacity:0.2">+</span>
              </div>
            </div>
            <div class="ingredient-shelf">
              <button v-for="ing in drinkPuzzle.ingredients" :key="ing"
                      class="ingredient-btn"
                      :disabled="drinkPuzzle.slots.includes(ing)"
                      @click="addIngredient(ing)">
                {{ ing }}
              </button>
            </div>
            <div style="display:flex;gap:8px;">
              <button class="puzzle-btn" style="flex:1" @click="checkDrink">SERVERA</button>
              <button class="puzzle-btn" style="flex:0 0 auto;width:auto;padding:14px 20px;background:rgba(255,255,255,0.05);" @click="drinkPuzzle.slots=drinkPuzzle.slots.map(()=>null)">TÖM</button>
            </div>
            <div class="feedback" :class="puzzleFeedback.type">{{ puzzleFeedback.msg }}</div>
          </div>
        </div>

        <!-- MEMORY CARD MISSION -->
        <div class="modal-overlay" v-if="modal==='jukebox'" @click.self="modal=null">
          <div class="modal">
            <button class="modal-close" @click="modal=null">✕</button>
            <div class="modal-eyebrow">UPPDRAG 02 — DJ</div>
            <div class="modal-title">HITTA LÅTARNA</div>
            <div class="modal-desc">Jukebox:en är krypterad. Hitta alla matchande par för att låsa upp spellistan.</div>
            <div class="card-grid" :style="{gridTemplateColumns: 'repeat(4, 1fr)', maxWidth:'320px', margin:'0 auto 16px'}">
              <div v-for="(card,i) in memCards" :key="i"
                   class="mem-card"
                   :class="{flipped: card.flipped || card.matched, matched: card.matched}"
                   @click="flipCard(i)">
                <div class="card-front">{{ card.emoji }}</div>
                <div class="card-back">
                  <svg class="card-bat" viewBox="0 0 200 120">
                    <path d="M100,95 C85,85 60,80 30,88 C10,93 0,85 5,70 C12,55 30,55 42,62 C30,52 28,38 38,32 C48,26 58,36 62,48 C68,32 80,22 100,20 C120,22 132,32 138,48 C142,36 152,26 162,32 C172,38 170,52 158,62 C170,55 188,55 195,70 C200,85 190,93 170,88 C140,80 115,85 100,95 Z" fill="var(--red)" opacity="0.4"/>
                  </svg>
                </div>
              </div>
            </div>
            <div class="feedback" :class="puzzleFeedback.type">{{ puzzleFeedback.msg }}</div>
          </div>
        </div>

        <!-- SAFE CODE MISSION -->
        <div class="modal-overlay" v-if="modal==='safe'" @click.self="modal=null">
          <div class="modal">
            <button class="modal-close" @click="modal=null">✕</button>
            <div class="modal-eyebrow">UPPDRAG 03 — INFILTRATÖR</div>
            <div class="modal-title">KNÄCK KODEN</div>
            <div class="modal-desc">Kassaskåpet innehåller Red Team-dokumenten. Ledtråd: Batmans år × antalet bukters tapp = koden.</div>
            <div style="font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--dim);margin-bottom:16px;padding:10px;background:rgba(0,0,0,0.3);border-radius:3px;letter-spacing:1px;line-height:1.8;">
              LEDTRÅD: Batman skapades <span style="color:var(--bat-yellow)">1939</span>.<br>
              Baren har <span style="color:var(--bat-yellow)">{{ taps.length }}</span> tappar.<br>
              KOD = sista 2 siffror av år + antal tappar = <span style="color:var(--red-bright)">??</span>
            </div>
            <div class="code-display">
              <div v-for="(d,i) in safeCode" :key="i" class="code-digit" :class="{active: safeInput.length===i}">
                {{ safeInput[i] || '_' }}
              </div>
            </div>
            <div class="code-keypad">
              <button v-for="n in [1,2,3,4,5,6,7,8,9,'',0,'⌫']" :key="n"
                      class="key-btn"
                      :style="n==='' ? 'visibility:hidden' : ''"
                      @click="pressKey(n)">{{ n }}</button>
            </div>
            <button class="puzzle-btn" @click="checkSafe">ÖPPNA SKÅPET</button>
            <div class="feedback" :class="puzzleFeedback.type">{{ puzzleFeedback.msg }}</div>
          </div>
        </div>

        <!-- SIMON SAYS MISSION (menu) -->
        <div class="modal-overlay" v-if="modal==='menu'" @click.self="modal=null">
          <div class="modal">
            <button class="modal-close" @click="modal=null">✕</button>
            <div class="modal-eyebrow">UPPDRAG 04 — AGENT</div>
            <div class="modal-title">SIGNALSEKVENS</div>
            <div class="modal-desc">Upprepa den hemliga sekvensen för att bekräfta din identitet som Red Team-agent.</div>
            <div style="font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--dim);letter-spacing:2px;margin-bottom:16px;text-align:center;">
              {{ simonState === 'show' ? 'MEMORERA...' : simonState === 'input' ? 'DIN TUR — ' + simonProgress + '/' + simonSeq.length : 'TRYCK START' }}
            </div>
            <div class="simon-grid">
              <div v-for="(col,i) in simonColors" :key="i"
                   class="simon-btn"
                   :class="{lit: simonLit===i}"
                   :style="{background: col.bg, borderColor: col.border}"
                   @click="simonPress(i)">
                <svg width="30" height="18" viewBox="0 0 200 120" v-if="i===0">
                  <path d="M100,95 C85,85 60,80 30,88 C10,93 0,85 5,70 C12,55 30,55 42,62 C30,52 28,38 38,32 C48,26 58,36 62,48 C68,32 80,22 100,20 C120,22 132,32 138,48 C142,36 152,26 162,32 C172,38 170,52 158,62 C170,55 188,55 195,70 C200,85 190,93 170,88 C140,80 115,85 100,95 Z" fill="rgba(0,0,0,0.4)"/>
                </svg>
              </div>
            </div>
            <button class="puzzle-btn" @click="startSimon" :disabled="simonState==='show' || simonState==='input'">
              {{ simonStarted ? 'NÄSTA RUNDA' : 'STARTA SEKVENS' }}
            </button>
            <div class="feedback" :class="puzzleFeedback.type">{{ puzzleFeedback.msg }}</div>
          </div>
        </div>

        <!-- Bottle inspect modal -->
        <div class="modal-overlay" v-if="modal==='bottle'" @click.self="modal=null">
          <div class="modal" style="max-width:360px;">
            <button class="modal-close" @click="modal=null">✕</button>
            <div class="modal-eyebrow">FLASKA</div>
            <div class="modal-title">{{ selectedBottle?.name }}</div>
            <div class="modal-desc" style="margin-bottom:10px;">{{ selectedBottle?.lore }}</div>
            <div class="selected-bottle-preview" :style="{ background: `linear-gradient(180deg, ${selectedBottle?.color}, ${selectedBottle?.colorDark})` }"></div>
            <button class="puzzle-btn" @click="modal=null">SÄTT TILLBAKA</button>
          </div>
        </div>

        <!-- Toast notification -->
        <div class="toast" v-if="toast.show">
          <div class="toast-title">{{ toast.title }}</div>
          {{ toast.body }}
        </div>

      </template><!-- /game -->

      <!-- ═══ WIN SCREEN ═══ -->
      <div class="win-screen" v-if="phase==='win'">
        <svg class="win-bat" viewBox="0 0 200 120">
          <path d="M100,95 C85,85 60,80 30,88 C10,93 0,85 5,70 C12,55 30,55 42,62 C30,52 28,38 38,32 C48,26 58,36 62,48 C68,32 80,22 100,20 C120,22 132,32 138,48 C142,36 152,26 162,32 C172,38 170,52 158,62 C170,55 188,55 195,70 C200,85 190,93 170,88 C140,80 115,85 100,95 Z" fill="var(--black)" stroke="var(--red)" stroke-width="3"/>
        </svg>
        <div class="win-title">MISSION COMPLETE</div>
        <div class="win-sub">
          RED TEAM OPERATIONS FRAMGÅNGSRIKA<br>
          GOTHAM CITY ÄR SÄKRAD — THE BAT BAR GODKÄND
        </div>
        <button class="win-btn" @click="resetGame">SPELA IGEN</button>
      </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'

const phase = ref('intro');
    const panelOpen = ref(true);
    const modal = ref(null);
    const xp = ref(0);
    const selectedBottle = ref(null);

    // ── MISSIONS ──
    const missions = reactive([
      { id:'drink',   title:'BLANDA DRINKEN',     desc:'Bruce Wayne väntar på sin favorit. Rätt ordning krävs.', xp:25, done:false },
      { id:'jukebox', title:'LÅSÖPPNA JUKEBOX',   desc:'Hitta alla matchande par i det krypterade systemet.',    xp:20, done:false },
      { id:'safe',    title:'KNÄCK KASSASKÅPET',  desc:'Red Team-dokumenten göms inuti. Lös koden.',             xp:30, done:false },
      { id:'menu',    title:'SIGNALSEKVENS',       desc:'Bekräfta agentidentitet med rätt knapp-sekvens.',        xp:25, done:false },
    ]);
    const activeMission = ref('drink');
    const doneCount = computed(() => missions.filter(m=>m.done).length);

    // ── BOTTLES ──
    const bottles = ref([
  {
    id: 1,
    name: 'Bat Bourbon',
    short: 'BB',
    h: 95,
    color: '#8B5e3c',
    colorDark: '#3d2010',
    lore: 'En rökig bourbon med karaktär.'
  },

  {
    id: 2,
    name: 'Red Rye',
    short: 'RR',
    h: 105,
    color: '#7a1520',
    colorDark: '#3a0810',
    lore: 'Distillerad av Red Team.'
  },

  {
    id: 3,
    name: 'Arkham Gin',
    short: 'AG',
    h: 88,
    color: '#2a4a6a',
    colorDark: '#0d1a28',
    lore: 'Botanisk gin från Arkham.'
  },

  {
    id: 4,
    name: 'Joker Vodka',
    short: 'JV',
    h: 98,
    color: '#6a2a7a',
    colorDark: '#2a0d30',
    lore: 'Destillerad i kaos.'
  },

  {
    id: 5,
    name: 'Penguin Port',
    short: 'PP',
    h: 80,
    color: '#1a3a1a',
    colorDark: '#080f08',
    lore: 'Importerad via Gothams docks.'
  },

  {
    id: 6,
    name: 'Two-Face Tequila',
    short: 'TT',
    h: 92,
    color: '#d4a020',
    colorDark: '#6a4e08',
    lore: 'Hälften guld, hälften silver.'
  }
])

    // ── TAPS ──
    const taps = ref([
      {id:1,name:'Bat Lager',short:'LAGER',color:'#d4a020'},
      {id:2,name:'Red IPA',short:'IPA',color:'#cc1122'},
      {id:3,name:'Dark Knight Stout',short:'STOUT',color:'#444'},
    ]);

    // ── TOAST ──
    const toast = reactive({show:false,title:'',body:''});
    let toastTimer = null;
    function showToast(title, body, dur=3000) {
      toast.title=title; toast.body=body; toast.show=true;
      if(toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(()=>toast.show=false, dur);
    }

    // ── PUZZLE FEEDBACK ──
    const puzzleFeedback = reactive({msg:'',type:''});
    function setFeedback(msg, type, dur=2500) {
      puzzleFeedback.msg=msg; puzzleFeedback.type=type;
      setTimeout(()=>{puzzleFeedback.msg='';puzzleFeedback.type='';},dur);
    }

    // ── MISSION LOGIC ──
    function setActive(id) { activeMission.value=id; }

    function openMissionModal(id) {
      const m = missions.find(m=>m.id===id);
      if(m?.done) { showToast('UPPDRAG KLART','Det här uppdraget är redan slutfört.'); return; }
      modal.value = id;
      puzzleFeedback.msg=''; puzzleFeedback.type='';
    }

    function completeMission(id) {
      const m = missions.find(m=>m.id===id);
      if(!m || m.done) return;
      m.done=true;
      xp.value = Math.min(100, xp.value + m.xp);
      modal.value=null;
      showToast('UPPDRAG SLUTFÖRT — +'+m.xp+' XP', m.title, 4000);
      setTimeout(()=>{
        if(missions.every(m=>m.done)) phase.value='win';
      }, 1200);
    }

    // ────────────────────────────────────────
    // PUZZLE 1: DRINK MIXER
    // ────────────────────────────────────────
    const drinkPuzzle = reactive({
      recipe: ['Bourbon','Kaffe','Grädde'],
      ingredients: ['Bourbon','Kaffe','Grädde','Citron','Sirap','Tonic'],
      slots: [null, null, null],
    });
    function addIngredient(ing) {
      const idx = drinkPuzzle.slots.indexOf(null);
      if(idx !== -1) drinkPuzzle.slots[idx] = ing;
    }
    function checkDrink() {
      const correct = drinkPuzzle.slots.every((s,i)=>s===drinkPuzzle.recipe[i]);
      if(drinkPuzzle.slots.includes(null)) { setFeedback('FYLL ALLA PLATSER','err'); return; }
      if(correct) { setFeedback('PERFEKT BLANDNING!','ok',1500); setTimeout(()=>completeMission('drink'),800); }
      else { setFeedback('FEL ORDNING — FÖRSÖK IGEN','err'); drinkPuzzle.slots=[null,null,null]; }
    }

    // ────────────────────────────────────────
    // PUZZLE 2: MEMORY CARDS
    // ────────────────────────────────────────
    const memEmojis = ['🦇','🥃','🔴','⚡','🎸','💀','🦇','🥃','🔴','⚡','🎸','💀'];
    function shuffleArr(a){return [...a].sort(()=>Math.random()-.5);}
    const memCards = ref(shuffleArr(memEmojis).map(e=>({emoji:e,flipped:false,matched:false})));
    let memFlipped=[]; let memLocked=false;
    function flipCard(i){
      if(memLocked||memCards.value[i].flipped||memCards.value[i].matched)return;
      memCards.value[i].flipped=true;
      memFlipped.push(i);
      if(memFlipped.length===2){
        memLocked=true;
        const [a,b]=memFlipped;
        if(memCards.value[a].emoji===memCards.value[b].emoji){
          memCards.value[a].matched=memCards.value[b].matched=true;
          memFlipped=[]; memLocked=false;
          if(memCards.value.every(c=>c.matched)){
            setFeedback('ALLA PAR HITTADE!','ok',1500);
            setTimeout(()=>completeMission('jukebox'),800);
          }
        } else {
          setTimeout(()=>{
            memCards.value[a].flipped=memCards.value[b].flipped=false;
            memFlipped=[]; memLocked=false;
          },900);
        }
      }
    }

    // ────────────────────────────────────────
    // PUZZLE 3: SAFE CODE
    // Batman 1939, taps.length=3 → 39+3=42
    // ────────────────────────────────────────
    const safeCode = ['4','2'];
    const safeInput = ref('');
    function pressKey(k){
      if(k==='⌫'){safeInput.value=safeInput.value.slice(0,-1);return;}
      if(safeInput.value.length<safeCode.length) safeInput.value+=String(k);
    }
    function checkSafe(){
      if(safeInput.value===safeCode.join('')){
        setFeedback('SKÅPET ÄR ÖPPET!','ok',1500);
        setTimeout(()=>completeMission('safe'),800);
      } else {
        setFeedback('FEL KOD','err');
        safeInput.value='';
      }
    }

    // ────────────────────────────────────────
    // PUZZLE 4: SIMON SAYS
    // ────────────────────────────────────────
    const simonColors = [
      {bg:'rgba(204,17,34,0.7)',border:'rgba(204,17,34,0.9)'},
      {bg:'rgba(20,100,20,0.7)',border:'rgba(20,180,20,0.9)'},
      {bg:'rgba(20,80,180,0.7)',border:'rgba(20,120,255,0.9)'},
      {bg:'rgba(180,150,20,0.7)',border:'rgba(240,200,40,0.9)'},
    ];
    const simonSeq = ref([]);
    const simonState = ref('idle'); // idle | show | input
    const simonLit = ref(-1);
    const simonProgress = ref(0);
    const simonStarted = ref(false);
    let simonUserSeq = [];

    function startSimon(){
      simonStarted.value=true;
      simonSeq.value.push(Math.floor(Math.random()*4));
      simonProgress.value=0;
      simonUserSeq=[];
      playSimonSequence();
    }
    function playSimonSequence(){
      simonState.value='show';
      let i=0;
      function next(){
        if(i>=simonSeq.value.length){ simonState.value='input'; return; }
        simonLit.value=simonSeq.value[i];
        setTimeout(()=>{ simonLit.value=-1; i++; setTimeout(next,300); },500);
      }
      setTimeout(next,400);
    }
    function simonPress(i){
      if(simonState.value!=='input')return;
      simonLit.value=i;
      setTimeout(()=>simonLit.value=-1,200);
      simonUserSeq.push(i);
      simonProgress.value=simonUserSeq.length;
      if(i!==simonSeq.value[simonUserSeq.length-1]){
        setFeedback('FEL SEKVENS — BÖRJA OM','err');
        simonState.value='idle';
        simonSeq.value=[];
        simonStarted.value=false;
        return;
      }
      if(simonUserSeq.length===simonSeq.value.length){
        if(simonSeq.value.length>=4){
          setFeedback('IDENTITET BEKRÄFTAD!','ok',1500);
          setTimeout(()=>completeMission('menu'),800);
        } else {
          setFeedback('KORREKT! NÄSTA RUNDA...','ok',1000);
          setTimeout(()=>{ simonState.value='idle'; startSimon(); },1200);
        }
      }
    }

    // ── BOTTLE & TAP ──
    function openBottle(b) { selectedBottle.value=b; modal.value='bottle'; }
    function activateTap(tap) {
      showToast('🍺 '+tap.name,'En kall '+tap.name.toLowerCase()+' serveras.',2000);
    }

    function resetGame(){
      phase.value='intro';
      xp.value=0;
      missions.forEach(m=>m.done=false);
      modal.value=null;
      safeInput.value='';
      drinkPuzzle.slots=[null,null,null];
      memCards.value=shuffleArr(memEmojis).map(e=>({emoji:e,flipped:false,matched:false}));
      simonSeq.value=[]; simonState.value='idle'; simonStarted.value=false;
    }
</script>

<style scoped>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

:root {
  --red: #cc1122;
  --red-bright: #ff1a2e;
  --red-dark: #7a0a14;
  --red-glow: rgba(204,17,34,0.4);
  --black: #050508;
  --near-black: #0d0d12;
  --surface: #12121a;
  --surface2: #1a1a26;
  --bat-yellow: #f0c040;
  --bat-yellow-dim: rgba(240,192,64,0.15);
  --cream: #e8e0d4;
  --dim: rgba(232,224,212,0.45);
  --glass: rgba(255,255,255,0.04);
}

html,body{width:100%;height:100%;overflow:hidden;background:var(--black);}
.bat-bar-app{width:100vw;height:100vh;position:relative;overflow:hidden;font-family:'Oswald',sans-serif;cursor:default;background:var(--black);}

/* ─────────── SCANLINES & GRAIN ─────────── */
.fx-scanlines{
  position:fixed;inset:0;z-index:900;pointer-events:none;
  background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.06) 2px,rgba(0,0,0,0.06) 4px);
}
.fx-vignette{
  position:fixed;inset:0;z-index:901;pointer-events:none;
  background:radial-gradient(ellipse at 50% 40%,transparent 40%,rgba(0,0,0,0.75) 100%);
}

/* ─────────── INTRO ─────────── */
.intro{
  position:absolute;inset:0;z-index:800;
  background:var(--black);
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:0;
}
.intro-bat{
  width:200px;height:120px;
  animation:bat-drop 1.2s cubic-bezier(.22,1,.36,1) both;
}
@keyframes bat-drop{from{opacity:0;transform:translateY(-60px) scale(0.6);}to{opacity:1;transform:none;}}

.intro-title{
  font-family:'Bebas Neue',sans-serif;
  font-size:clamp(52px,8vw,96px);
  letter-spacing:10px;
  color:var(--red-bright);
  text-shadow:0 0 40px var(--red-glow),0 0 100px rgba(204,17,34,0.2);
  animation:title-in 1s 0.5s both;
  line-height:1;margin-top:20px;
}
.intro-sub{
  font-family:'Share Tech Mono',monospace;
  font-size:13px;letter-spacing:6px;
  color:var(--dim);margin-top:8px;
  animation:title-in 1s 0.8s both;
}
@keyframes title-in{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:none;}}

.intro-btn{
  margin-top:50px;
  padding:16px 56px;
  background:var(--red);border:none;border-radius:2px;
  font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:6px;
  color:white;cursor:pointer;
  box-shadow:0 0 40px var(--red-glow),inset 0 1px 0 rgba(255,255,255,0.1);
  transition:all .2s;
  animation:title-in 1s 1.1s both;
}
.intro-btn:hover{background:var(--red-bright);box-shadow:0 0 70px rgba(255,26,46,0.6),inset 0 1px 0 rgba(255,255,255,0.15);transform:scale(1.04);}
.intro-btn:active{transform:scale(0.97);}

/* ─────────── BAR SCENE ─────────── */
.bar-scene{
  position:absolute;inset:0;
  perspective:900px;
  perspective-origin:50% 35%;
  overflow:hidden;
}

/* CEILING */
.ceiling{
  position:absolute;top:0;left:-20%;width:140%;height:28%;
  background:linear-gradient(180deg,#050508 0%,#0d0d14 100%);
  transform:rotateX(-55deg);transform-origin:bottom center;
  box-shadow:0 20px 60px rgba(0,0,0,0.8);
}

/* BACK WALL */
.back-wall{
  position:absolute;top:0;left:0;right:0;bottom:0;
  background:
    repeating-linear-gradient(90deg,transparent,transparent 80px,rgba(255,255,255,0.012) 80px,rgba(255,255,255,0.012) 82px),
    linear-gradient(180deg,#0a0a12 0%,#0d0d18 100%);
  z-index:0;
}

/* RED NEON STRIPE on back wall */
.wall-stripe{
  position:absolute;top:22%;left:0;right:0;height:3px;
  background:linear-gradient(90deg,transparent 2%,var(--red) 15%,var(--red-bright) 50%,var(--red) 85%,transparent 98%);
  box-shadow:0 0 20px var(--red-bright),0 0 60px var(--red-glow),0 8px 30px rgba(204,17,34,0.3);
  animation:stripe-flicker 6s infinite;
  z-index:2;
}
@keyframes stripe-flicker{0%,91%,100%{opacity:1;}92%{opacity:0.1;}94%{opacity:0.9;}96%{opacity:0.2;}97%{opacity:1;}}

/* BAT SIGNAL on wall */
.bat-signal{
  position:absolute;top:4%;left:50%;transform:translateX(-50%);
  z-index:3;
}
.bat-emblem-wall{
  width:140px;height:84px;
  filter:drop-shadow(0 0 18px rgba(240,192,64,0.2));
  opacity:0.18;
}

/* FLOOR */
.floor{
  position:absolute;bottom:0;left:-20%;width:140%;height:45%;
  background:
    repeating-linear-gradient(90deg,transparent,transparent 80px,rgba(255,255,255,0.02) 80px,rgba(255,255,255,0.02) 82px),
    repeating-linear-gradient(0deg,transparent,transparent 80px,rgba(255,255,255,0.02) 80px,rgba(255,255,255,0.02) 82px),
    linear-gradient(180deg,#0e0e18 0%,#080810 100%);
  transform:rotateX(60deg);transform-origin:top center;
}
.floor-reflect{
  position:absolute;bottom:2%;left:50%;transform:translateX(-50%);
  width:60%;height:4px;
  background:linear-gradient(90deg,transparent,rgba(204,17,34,0.2),transparent);
  filter:blur(8px);
}

/* ─── BAR COUNTER (3D box) ─── */
.bar-counter{
  position:absolute;
  bottom:18%;left:0;right:0;
  height:110px;
  transform-style:preserve-3d;
  z-index:20;
}
.counter-top{
  position:absolute;bottom:60px;left:5%;right:5%;
  height:28px;
  background:linear-gradient(180deg,#2a1a0a 0%,#1a1008 100%);
  transform:rotateX(25deg);transform-origin:bottom center;
  border-top:2px solid rgba(240,192,64,0.25);
  box-shadow:0 -4px 20px rgba(0,0,0,0.8),0 0 30px rgba(204,17,34,0.05);
}
.counter-front{
  position:absolute;bottom:0;left:5%;right:5%;
  height:65px;
  background:linear-gradient(180deg,#1a1008 0%,#0d0805 100%);
  border-top:1px solid rgba(240,192,64,0.15);
  box-shadow:0 10px 40px rgba(0,0,0,0.9);
}
.counter-front::after{
  content:'';position:absolute;top:0;left:0;right:0;
  height:1px;background:linear-gradient(90deg,transparent,rgba(240,192,64,0.3),transparent);
}

/* Beer taps */
.tap-group{
  position:absolute;bottom:85px;left:50%;transform:translateX(-50%);
  display:flex;gap:30px;z-index:25;
}
.tap{
  display:flex;flex-direction:column;align-items:center;cursor:pointer;
  transition:transform .2s;
}
.tap:hover{transform:translateY(-4px);}
.tap:active{transform:translateY(0);}
.tap-pipe{
  width:10px;height:50px;
  background:linear-gradient(90deg,#555,#888,#666);
  border-radius:3px;
  box-shadow:2px 0 6px rgba(0,0,0,0.5);
}
.tap-head{
  width:24px;height:16px;
  background:linear-gradient(180deg,#999,#666);
  border-radius:4px 4px 2px 2px;
  margin-top:-2px;
  cursor:pointer;
}
.tap-base{
  width:30px;height:8px;
  background:linear-gradient(180deg,#666,#333);
  border-radius:2px;
}
.tap-label{
  font-family:'Share Tech Mono',monospace;font-size:8px;
  color:var(--red-bright);letter-spacing:1px;margin-top:4px;
}

/* Bottles on shelf */
.bottle-shelf{
  position:absolute;top:25%;left:8%;right:8%;
  display:flex;gap:12px;align-items:flex-end;
  z-index:5;padding:0 20px;
}
.bottle{
  display:flex;flex-direction:column;align-items:center;
  cursor:pointer;transition:transform .2s;flex:1;max-width:28px;
}
.bottle:hover{transform:translateY(-6px) scale(1.08);}
.bottle-neck{width:7px;border-radius:3px 3px 0 0;}
.bottle-body{width:18px;border-radius:3px;position:relative;}
.bottle-label{
  position:absolute;top:30%;left:0;right:0;
  height:40%;background:rgba(255,255,255,0.12);
  font-size:4px;display:flex;align-items:center;justify-content:center;
  color:rgba(255,255,255,0.5);letter-spacing:1px;
}
.shelf-board{
  position:absolute;bottom:-4px;left:0;right:0;
  height:5px;background:linear-gradient(180deg,#3a2010,#1a1008);
  border-bottom:1px solid rgba(240,192,64,0.1);
}

/* ─── INTERACTIVE OBJECTS (hotspots) ─── */
.hotspot{
  position:absolute;z-index:30;cursor:pointer;
  transition:all .25s;
}
.hotspot::after{
  content:'';position:absolute;inset:-8px;
  border:1px solid transparent;border-radius:3px;
  transition:all .3s;pointer-events:none;
}
.hotspot:hover::after{
  border-color:var(--red-bright);
  box-shadow:0 0 25px var(--red-glow),inset 0 0 15px rgba(204,17,34,0.05);
}
.hotspot-label{
  position:absolute;bottom:calc(100% + 10px);left:50%;transform:translateX(-50%);
  font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:2px;
  color:var(--red-bright);white-space:nowrap;
  opacity:0;transition:opacity .3s;pointer-events:none;
  text-shadow:0 0 10px var(--red-bright);
}
.hotspot:hover .hotspot-label{opacity:1;}

/* ─── HUD ─── */
.hud{
  position:fixed;top:0;left:0;right:0;z-index:500;
  display:flex;justify-content:space-between;align-items:center;
  padding:14px 24px;
  background:rgba(5,5,8,0.85);
  border-bottom:1px solid rgba(204,17,34,0.2);
  backdrop-filter:blur(8px);
}
.hud-left{display:flex;align-items:center;gap:16px;}
.bat-icon-small{width:44px;height:26px;}
.bar-name{
  font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:5px;
  color:var(--red-bright);text-shadow:0 0 15px var(--red-glow);
}
.hud-right{display:flex;gap:16px;align-items:center;}
.mission-counter{
  font-family:'Share Tech Mono',monospace;font-size:11px;
  color:var(--dim);letter-spacing:2px;
}
.xp-bar-wrap{display:flex;align-items:center;gap:8px;}
.xp-label{font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--dim);letter-spacing:1px;}
.xp-track{
  width:120px;height:6px;background:rgba(255,255,255,0.06);
  border-radius:3px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);
}
.xp-fill{
  height:100%;background:linear-gradient(90deg,var(--red-dark),var(--red-bright));
  border-radius:3px;transition:width .6s cubic-bezier(.34,1.56,.64,1);
  box-shadow:0 0 8px var(--red-glow);
}

/* ─── MISSION PANEL ─── */
.mission-panel{
  position:fixed;left:0;top:70px;bottom:0;
  width:260px;z-index:400;
  background:rgba(5,5,8,0.92);
  border-right:1px solid rgba(204,17,34,0.15);
  padding:20px 16px;
  display:flex;flex-direction:column;gap:12px;
  backdrop-filter:blur(8px);
  transform:translateX(0);transition:transform .4s cubic-bezier(.22,1,.36,1);
}
.mission-panel.hidden{transform:translateX(-100%);}
.panel-title{
  font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:5px;
  color:var(--red-bright);margin-bottom:4px;
  display:flex;align-items:center;gap:10px;
}
.panel-title::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,rgba(204,17,34,0.4),transparent);}

.mission-card{
  background:rgba(204,17,34,0.05);
  border:1px solid rgba(204,17,34,0.12);
  border-radius:4px;padding:12px 14px;cursor:pointer;
  transition:all .2s;position:relative;overflow:hidden;
}
.mission-card::before{
  content:'';position:absolute;top:0;left:0;width:3px;height:100%;
  background:var(--red);transition:width .2s;
}
.mission-card:hover{
  background:rgba(204,17,34,0.12);border-color:rgba(204,17,34,0.35);
  transform:translateX(4px);
}
.mission-card:hover::before{width:5px;}
.mission-card.active{
  background:rgba(204,17,34,0.18);border-color:var(--red);
  box-shadow:0 0 20px rgba(204,17,34,0.15),inset 0 0 15px rgba(204,17,34,0.05);
}
.mission-card.done{
  opacity:0.45;border-color:rgba(255,255,255,0.06);
}
.mission-card.done::before{background:#2a7a2a;}
.mc-title{
  font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:2px;
  color:var(--cream);margin-bottom:3px;
}
.mc-desc{font-size:11px;color:var(--dim);line-height:1.5;letter-spacing:0.5px;}
.mc-reward{
  margin-top:6px;font-family:'Share Tech Mono',monospace;font-size:9px;
  color:var(--bat-yellow);letter-spacing:2px;
}
.mc-done-badge{
  position:absolute;top:8px;right:10px;
  font-family:'Share Tech Mono',monospace;font-size:9px;
  color:#4caf50;letter-spacing:2px;
}

/* ─── MODAL / PUZZLE ─── */
.modal-overlay{
  position:fixed;inset:0;z-index:600;
  background:rgba(0,0,0,0.82);backdrop-filter:blur(12px);
  display:flex;align-items:center;justify-content:center;
}
.modal{
  background:var(--surface);
  border:1px solid rgba(204,17,34,0.3);
  border-radius:4px;
  padding:36px 40px;
  width:min(92vw,520px);
  position:relative;
  box-shadow:0 0 80px rgba(0,0,0,0.9),0 0 40px rgba(204,17,34,0.08);
  animation:modal-in .35s cubic-bezier(.34,1.56,.64,1);
}
@keyframes modal-in{from{opacity:0;transform:scale(0.88) translateY(20px);}to{opacity:1;transform:none;}}

.modal-close{
  position:absolute;top:14px;right:16px;background:none;border:none;
  color:var(--dim);font-size:18px;cursor:pointer;
  font-family:'Share Tech Mono',monospace;
  opacity:0.5;transition:opacity .2s;
}
.modal-close:hover{opacity:1;color:var(--red-bright);}

.modal-eyebrow{
  font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:4px;
  color:var(--red-bright);text-transform:uppercase;margin-bottom:8px;
}
.modal-title{
  font-family:'Bebas Neue',sans-serif;font-size:36px;letter-spacing:4px;
  color:var(--cream);margin-bottom:4px;line-height:1;
}
.modal-desc{
  font-size:13px;color:var(--dim);line-height:1.7;margin-bottom:24px;
  letter-spacing:0.5px;
}

/* ─── PUZZLE STYLES ─── */
/* Drink mixer puzzle */
.drink-slots{
  display:flex;gap:10px;margin-bottom:20px;
  justify-content:center;
}
.drink-slot{
  width:55px;height:75px;
  border:2px dashed rgba(204,17,34,0.3);border-radius:4px;
  display:flex;align-items:center;justify-content:center;
  transition:all .2s;position:relative;
  background:rgba(0,0,0,0.3);
}
.drink-slot.filled{
  border-style:solid;border-color:var(--red);
  background:rgba(204,17,34,0.08);
  box-shadow:0 0 15px rgba(204,17,34,0.15);
}
.drink-slot.correct{border-color:#4caf50;background:rgba(76,175,80,0.08);}
.drink-slot.wrong{border-color:var(--red-bright);animation:shake .3s;}
@keyframes shake{0%,100%{transform:translateX(0);}25%{transform:translateX(-5px);}75%{transform:translateX(5px);}  }

.ingredient-shelf{
  display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:16px;
}
.ingredient-btn{
  padding:8px 14px;background:rgba(255,255,255,0.04);
  border:1px solid rgba(255,255,255,0.08);border-radius:3px;
  color:var(--cream);font-family:'Oswald',sans-serif;font-size:13px;
  cursor:pointer;transition:all .2s;letter-spacing:1px;
}
.ingredient-btn:hover{background:rgba(204,17,34,0.15);border-color:var(--red);}
.ingredient-btn:disabled{opacity:0.3;cursor:default;}

/* Memory card puzzle */
.card-grid{
  display:grid;gap:8px;margin-bottom:16px;
}
.mem-card{
  aspect-ratio:1;border-radius:4px;cursor:pointer;
  position:relative;transform-style:preserve-3d;
  transition:transform .4s cubic-bezier(.4,0,.2,1);
}
.mem-card.flipped{transform:rotateY(180deg);}
.mem-card.matched{opacity:0.5;pointer-events:none;}
.card-front,.card-back{
  position:absolute;inset:0;border-radius:4px;
  backface-visibility:hidden;display:flex;align-items:center;justify-content:center;
}
.card-front{
  background:linear-gradient(135deg,var(--surface2),var(--surface));
  border:1px solid rgba(204,17,34,0.2);
  font-size:28px;transform:rotateY(180deg);
}
.card-back{
  background:linear-gradient(135deg,#1a0a0d,#120810);
  border:1px solid rgba(204,17,34,0.15);
}
.card-bat{width:32px;height:20px;opacity:0.3;}

/* Code input puzzle */
.code-display{
  display:flex;gap:8px;justify-content:center;margin-bottom:20px;
}
.code-digit{
  width:48px;height:60px;
  background:#000;border:1px solid rgba(204,17,34,0.3);border-radius:3px;
  display:flex;align-items:center;justify-content:center;
  font-family:'Share Tech Mono',monospace;font-size:28px;color:var(--red-bright);
  text-shadow:0 0 10px var(--red-bright);
  transition:all .2s;
}
.code-digit.active{border-color:var(--red-bright);box-shadow:0 0 15px var(--red-glow);}
.code-keypad{
  display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:240px;margin:0 auto 16px;
}
.key-btn{
  padding:14px;background:rgba(255,255,255,0.04);
  border:1px solid rgba(255,255,255,0.06);border-radius:3px;
  color:var(--cream);font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:2px;
  cursor:pointer;transition:all .15s;
}
.key-btn:hover{background:rgba(204,17,34,0.15);border-color:var(--red);}
.key-btn:active{transform:scale(0.94);}

/* Simon says puzzle */
.simon-grid{
  display:grid;grid-template-columns:1fr 1fr;gap:8px;
  width:220px;height:220px;margin:0 auto 20px;border-radius:50%;overflow:hidden;
}
.simon-btn{
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;transition:all .15s;font-size:24px;
  border:2px solid rgba(0,0,0,0.3);
}
.simon-btn.lit{filter:brightness(1.8);transform:scale(0.97);}

/* Puzzle action button */
.puzzle-btn{
  width:100%;padding:14px;background:var(--red);border:none;border-radius:3px;
  font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:4px;
  color:white;cursor:pointer;transition:all .2s;
  box-shadow:0 4px 20px rgba(204,17,34,0.3);
}
.puzzle-btn:hover{background:var(--red-bright);box-shadow:0 6px 30px rgba(204,17,34,0.5);}
.puzzle-btn:active{transform:scale(0.97);}
.puzzle-btn:disabled{opacity:0.35;cursor:default;}

.feedback{
  font-family:'Share Tech Mono',monospace;font-size:12px;
  letter-spacing:2px;text-align:center;margin-top:10px;height:18px;
  transition:all .3s;
}
.feedback.ok{color:#4caf50;text-shadow:0 0 8px rgba(76,175,80,0.6);}
.feedback.err{color:var(--red-bright);text-shadow:0 0 8px var(--red-glow);}

/* ─── TOAST ─── */
.toast{
  position:fixed;bottom:30px;right:30px;z-index:700;
  background:var(--surface2);border:1px solid rgba(204,17,34,0.3);
  border-radius:4px;padding:14px 20px;max-width:300px;
  font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:2px;
  color:var(--cream);line-height:1.7;
  box-shadow:0 10px 40px rgba(0,0,0,0.7),0 0 20px rgba(204,17,34,0.1);
  animation:toast-in .4s cubic-bezier(.34,1.56,.64,1);
}
@keyframes toast-in{from{opacity:0;transform:translateX(30px);}to{opacity:1;transform:none;}}
.toast-title{color:var(--red-bright);font-size:13px;margin-bottom:4px;}

/* ─── WIN SCREEN ─── */
.win-screen{
  position:fixed;inset:0;z-index:800;
  background:rgba(0,0,0,0.92);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;
  animation:fade-in .8s both;
}
@keyframes fade-in{from{opacity:0;}to{opacity:1;}}
.win-bat{width:180px;height:108px;animation:win-pulse 2s infinite;}
@keyframes win-pulse{0%,100%{filter:drop-shadow(0 0 10px rgba(240,192,64,0.3));}50%{filter:drop-shadow(0 0 30px rgba(240,192,64,0.7));}}
.win-title{
  font-family:'Bebas Neue',sans-serif;font-size:80px;letter-spacing:8px;
  color:var(--red-bright);text-shadow:0 0 60px var(--red-glow),0 0 120px rgba(204,17,34,0.3);
  animation:win-pulse 2s infinite;
}
.win-sub{font-family:'Share Tech Mono',monospace;font-size:13px;color:var(--dim);letter-spacing:3px;text-align:center;}
.win-btn{
  margin-top:20px;padding:14px 50px;background:var(--red);border:none;border-radius:2px;
  font-family:'Bebas Neue',sans-serif;font-size:26px;letter-spacing:5px;
  color:white;cursor:pointer;box-shadow:0 0 40px var(--red-glow);
  transition:all .2s;
}
.win-btn:hover{background:var(--red-bright);transform:scale(1.04);}

/* Toggle panel btn */
.panel-toggle{
  position:fixed;left:260px;top:50%;transform:translateY(-50%);z-index:401;
  width:22px;height:50px;background:rgba(204,17,34,0.2);
  border:1px solid rgba(204,17,34,0.2);border-left:none;border-radius:0 4px 4px 0;
  cursor:pointer;display:flex;align-items:center;justify-content:center;
  color:var(--red-bright);font-size:12px;transition:all .3s;
}
.panel-toggle:hover{background:rgba(204,17,34,0.4);}
.panel-toggle.hidden-toggle{left:0;}

/* Ambient red light flicker on bar */
.ambient-red{
  position:absolute;bottom:15%;left:50%;transform:translateX(-50%);
  width:60%;height:8px;
  background:radial-gradient(ellipse,rgba(204,17,34,0.2) 0%,transparent 70%);
  filter:blur(20px);pointer-events:none;z-index:2;
  animation:ambient-pulse 3s ease-in-out infinite;
}
@keyframes ambient-pulse{0%,100%{opacity:0.6;}50%{opacity:1;}}

.selected-bottle-preview {
  width: 60px;
  height: 120px;
  margin: 0 auto 20px;
  border-radius: 6px 6px 3px 3px;
  box-shadow: 0 0 30px rgba(204,17,34,0.2);
}
</style>
