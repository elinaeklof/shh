<template>
  <div class="ramlosa-page">
    <div class="bg-stars"></div>
    <div class="bg-scan"></div>

    <div class="ramlosa-operation">
      <div class="scene">
          <div class="scroll-zone" ref="scrollZone">
      
            <!-- JUMPSCARE -->
            <div v-if="jumpscare" class="jumpscare-overlay">
              <div class="jumpscare-text">{{ jumpscareText }}</div>
              <div class="jumpscare-sub">{{ jumpscareSubText }}</div>
            </div>
      
            <!-- INTRO -->
            <transition name="fade" mode="out-in">
            <div v-if="scene === 'intro'" key="intro">
              <div class="card">
                <div class="act-label">HEMLIGT UPPDRAG — INKOMMANDE MEDDELANDE</div>
                <h1 class="title">DEN HEMLIGA<br>OPERATIONEN</h1>
                <h2 class="subtitle">Ramlösa Protokollet</h2>
                <div class="clue-paper">
                  <p>"Grattis på födelsedagen.<br><br>
                  Ramlösan är gömd.<br>
                  Firandets champagne förvaras i familjens valv,<br>
                  skyddad av fyra prövningar.<br><br>
                  Bara den värdiga får öppna kvällens firande.<br>
                  Börjar du?"</p>
                  <div class="clue-author">— Familjen 🔒</div>
                </div>
                <div class="narrator-box">
                  Du stirrar på lappen. Det doftar äventyr. Eller också är det kanelbullen på bordet.
                </div>
                <div class="btn-row">
                  <button class="btn primary" @click="goScene('act1_clue')">
                    JA — JEG ÄR VÄRDIG
                  </button>
                </div>
              </div>
            </div>
      
            <!-- ACT 1: FIRST CLUE -->
            <div v-else-if="scene === 'act1_clue'" key="act1_clue">
              <div class="card">
                <div class="progress-track">
                  <div class="progress-dot active"></div>
                  <div class="progress-dot"></div>
                  <div class="progress-dot"></div>
                  <div class="progress-dot"></div>
                </div>
                <div class="act-label">Del 1 — Första Ledtråden</div>
                <h2 class="subtitle">Kökets Mysterium</h2>
                <div class="narrator-box">
                  Du hittar en lapp på köksbänken. Den är skriven för hand i blå bläck.
                  Under den liegt ett gammalt foto av en kylskåpsdörr.
                </div>
                <div class="clue-paper">
                  <p>"Där bubblor aldrig dör —<br>
                  och kylan bevarar det heliga —<br>
                  finns en kod som väntar dig.<br><br>
                  Tänk på platsen som aldrig sover."</p>
                </div>
                <div class="body-text">
                  Du måste förstå vad ledtråden syftar på. Välj rätt plats:
                </div>
                <div class="photo-grid">
                  <div class="photo-card"
                    v-for="opt in act1Options" :key="opt.id"
                    :class="{ selected: act1Selected === opt.id, wrong: act1Wrong === opt.id }"
                    @click="checkAct1(opt)">
                    <div class="photo-emoji">{{ opt.emoji }}</div>
                    <div class="photo-name">{{ opt.name }}</div>
                    <div class="photo-sub">{{ opt.sub }}</div>
                  </div>
                </div>
                <div class="hint-box" :class="{ visible: showHint1 }">
                  LEDTRÅD: "Bubblor som aldrig dör" — kolsyrat vatten håller sig...
                </div>
                <div class="btn-row">
                  <button class="btn" @click="showHint1 = true">💡 LEDTRÅD</button>
                </div>
              </div>
            </div>
      
            <!-- ACT 1: CODE -->
            <div v-else-if="scene === 'act1_code'" key="act1_code">
              <div class="card">
                <div class="progress-track">
                  <div class="progress-dot done"></div>
                  <div class="progress-dot active"></div>
                  <div class="progress-dot"></div>
                  <div class="progress-dot"></div>
                </div>
                <div class="act-label">Del 1 — Koden</div>
                <div class="narrator-box">
                  Du öppnar kylskåpet. Inuti, under ett paket smör, finns en lapp.<br>
                  På baksidan: ett krypterat meddelande och siffror.
                </div>
                <div class="cipher-display">
                  ③—⑦—①—⑤
                </div>
                <div class="clue-paper">
                  <p>"Koden är enkel: räkna familjemedlemmarna,<br>
                  plus årtalet du fyller år — ta de två sista siffrorna —<br>
                  sedan antalet ben på bordet i matsalen."</p>
                </div>
                <div class="body-text" style="text-align:center; margin-top: 16px;">
                  Det finns <em>4 familjemedlemmar</em>, du fyller <em>år 20<strong style="color:var(--gold2)">{{ birthYear }}</strong></em>,
                  och matsalsbordet har <em>4 ben</em>.
                </div>
                <div style="text-align:center; margin-top: 8px; font-family: 'Share Tech Mono'; font-size: 11px; color: var(--silver); opacity: 0.6; letter-spacing: 2px;">
                  4 + {{ birthYear }} + 4 = ?
                </div>
                <div class="input-wrap" style="justify-content:center; margin-top:20px;">
                  <input class="code-input" :class="{ shake: code1Shake, success: code1Done }"
                    v-model="code1" maxlength="4" placeholder="____"
                    @keyup.enter="checkCode1" type="text" autocomplete="off">
                  <button class="btn primary" @click="checkCode1">OK</button>
                </div>
                <div class="hint-box" :class="{ visible: showHint1b }">
                  Svar: {{ code1Answer }} (4 + {{ birthYear }} + 4, skriv de sista 4 siffrorna)
                </div>
                <div class="btn-row">
                  <button class="btn" @click="showHint1b = true">💡 LEDTRÅD</button>
                </div>
              </div>
            </div>
      
            <!-- ACT 2: FAMILY PUZZLE -->
            <div v-else-if="scene === 'act2_intro'" key="act2_intro">
              <div class="card">
                <div class="progress-track">
                  <div class="progress-dot done"></div>
                  <div class="progress-dot done"></div>
                  <div class="progress-dot active"></div>
                  <div class="progress-dot"></div>
                </div>
                <div class="act-label">Del 2 — Familjepussel</div>
                <h2 class="subtitle">Minnenas Arkiv</h2>
                <div class="narrator-box">
                  En röst spelar upp från telefonen. Det är en inspelning — överdramatisk, som om James Bond-musiken spelades i bakgrunden. Det är definitivt din pappa.
                </div>
                <div class="clue-paper">
                  <p>"Du har klarat del ett. Imponerande.<br>
                  Nu väntar familjens arkiv.<br>
                  Tre minnen. Tre sanningar. Tre nycklar.<br>
                  Familjens historia är koden."</p>
                  <div class="clue-author">— Mysterisk röst (100% inte pappa)</div>
                </div>
                <div class="riddle-track">
                  <div class="rtick" :class="{ done: riddlesDone >= 1 }"></div>
                  <div class="rtick" :class="{ done: riddlesDone >= 2 }"></div>
                  <div class="rtick" :class="{ done: riddlesDone >= 3 }"></div>
                </div>
                <div class="btn-row">
                  <button class="btn primary" @click="goScene('act2_r1')">ÖPPNA ARKIVET</button>
                </div>
              </div>
            </div>
      
            <!-- ACT 2: RIDDLE 1 -->
            <div v-else-if="scene === 'act2_r1'" key="act2_r1">
              <div class="card">
                <div class="riddle-track">
                  <div class="rtick active"></div>
                  <div class="rtick"></div>
                  <div class="rtick"></div>
                </div>
                <div class="act-label">Minne 1 — Midsommar 2021</div>
                <div class="clue-paper" style="margin-bottom:16px;">
                  <p>"Vem åt <strong>ALLA chips</strong> på midsommar 2021 och sedan nekade det<br>
                  trots att hela familjen såg det hända?"</p>
                </div>
                <div class="photo-grid">
                  <div class="photo-card" v-for="m in familyMembers" :key="m.id"
                    :class="{ selected: r1Selected === m.id, wrong: r1Wrong === m.id }"
                    @click="checkR1(m)">
                    <div class="photo-emoji">{{ m.emoji }}</div>
                    <div class="photo-name">{{ m.role }}</div>
                    <div class="photo-sub">{{ m.trait }}</div>
                  </div>
                </div>
                <div class="hint-box" :class="{ visible: showHint2 }">
                  Välj den person i familjen som är mest KÄND för att äta andras mat.
                </div>
                <div class="btn-row">
                  <button class="btn" @click="showHint2 = true">💡 LEDTRÅD</button>
                </div>
              </div>
            </div>
      
            <!-- ACT 2: RIDDLE 2 -->
            <div v-else-if="scene === 'act2_r2'" key="act2_r2">
              <div class="card">
                <div class="riddle-track">
                  <div class="rtick done"></div>
                  <div class="rtick active"></div>
                  <div class="rtick"></div>
                </div>
                <div class="act-label">Minne 2 — Familjefotot</div>
                <div class="narrator-box">
                  Du hittar ett gammalt familjefoto. På baksidan: siffror. Datumet för det första familjemiddagen i det nuvarande hemmet.
                </div>
                <div class="clue-paper">
                  <p>"Vilket år flyttade familjen in i nuvarande hem?<br>
                  Skriv de sista <strong>2 siffrorna</strong> av det året."</p>
                </div>
                <div class="input-wrap" style="justify-content:center; margin-top:20px;">
                  <input class="code-input" :class="{ shake: code2Shake, success: code2Done }"
                    v-model="code2" maxlength="2" placeholder="__"
                    @keyup.enter="checkCode2" type="text" autocomplete="off"
                    style="width:120px; font-size:28px;">
                  <button class="btn primary" @click="checkCode2">OK</button>
                </div>
                <div class="body-text" style="text-align:center; font-size:13px; opacity:0.6; margin-top:8px;">
                  (Redigera spelet för att ange rätt år — just nu: <em>{{ moveYear }}</em>)
                </div>
                <div class="hint-box" :class="{ visible: showHint3 }">
                  Svaret är: {{ moveYear.toString().slice(-2) }}
                </div>
                <div class="btn-row">
                  <button class="btn" @click="showHint3 = true">💡 LEDTRÅD</button>
                </div>
              </div>
            </div>
      
            <!-- ACT 2: RIDDLE 3 -->
            <div v-else-if="scene === 'act2_r3'" key="act2_r3">
              <div class="card">
                <div class="riddle-track">
                  <div class="rtick done"></div>
                  <div class="rtick done"></div>
                  <div class="rtick active"></div>
                </div>
                <div class="act-label">Minne 3 — Den Hemliga Rätten</div>
                <div class="clue-paper">
                  <p>"Familjens favoritmåltid — den som ALLTID beställs när ni äter ute — vad heter den?"</p>
                </div>
                <div class="photo-grid">
                  <div class="photo-card" v-for="f in foodOptions" :key="f.id"
                    :class="{ selected: r3Selected === f.id, wrong: r3Wrong === f.id }"
                    @click="checkR3(f)">
                    <div class="photo-emoji">{{ f.emoji }}</div>
                    <div class="photo-sub" style="font-size:14px;">{{ f.name }}</div>
                  </div>
                </div>
                <div class="narrator-box">
                  Bara den som verkligen är en del av familjen vet svaret.
                </div>
              </div>
            </div>
      
            <!-- ACT 2: CIPHER -->
            <div v-else-if="scene === 'act2_cipher'" key="act2_cipher">
              <div class="card">
                <div class="act-label">Dekryptera Meddelandet</div>
                <div class="narrator-box">
                  Tre minnen avslöjar en hemlig koordinat. Du hittar ett krypterat meddelande på baksidan av ett gammalt kvitto.
                </div>
                <div class="cipher-display" style="line-height:2.5;">
                  R — A — M — L — Ö — S — A<br>
                  7 — 1 — 13 — 12 — 15 — 19 — 1
                </div>
                <div class="clue-paper">
                  <p>"Summan av bokstäverna 1, 3 och 7 i RAMLÖSA<br>
                  (A=1, B=2... Z=26, Å=27, Ä=28, Ö=29)<br>
                  ger dig koden till den förbjudna dörren."</p>
                </div>
                <div style="text-align:center; font-family:'Share Tech Mono'; font-size:11px; color:var(--silver); opacity:0.5; letter-spacing:2px; margin:12px 0;">
                  R(18) + M(13) + A(1) = ?
                </div>
                <div class="input-wrap" style="justify-content:center; margin-top:16px;">
                  <input class="code-input" :class="{ shake: code3Shake, success: code3Done }"
                    v-model="code3" maxlength="2" placeholder="__"
                    @keyup.enter="checkCode3" type="text" autocomplete="off"
                    style="width:120px; font-size:28px;">
                  <button class="btn primary" @click="checkCode3">OK</button>
                </div>
                <div class="hint-box" :class="{ visible: showHint4 }">
                  R=18, M=13, A=1 → 18+13+1 = 32
                </div>
                <div class="btn-row">
                  <button class="btn" @click="showHint4 = true">💡 LEDTRÅD</button>
                </div>
              </div>
            </div>
      
            <!-- ACT 3: INTRO -->
            <div v-else-if="scene === 'act3_intro'" key="act3_intro">
              <div class="card">
                <div class="progress-track">
                  <div class="progress-dot done"></div>
                  <div class="progress-dot done"></div>
                  <div class="progress-dot done"></div>
                  <div class="progress-dot active"></div>
                </div>
                <div class="act-label">Del 3 — Den Förbjudna Dörren</div>
                <h2 class="subtitle" style="color:var(--red)">VARNING: VAKTEN</h2>
                <div class="narrator-box" style="border-color:var(--red);">
                  🚨 VARNING. Vakten patrullerar korridoren.
                  Han är extremt skarp. Han hör ALLT. Han är beväpnad med syrliga kommentarer och förmågan att spoila filmer.
                </div>
                <div class="clue-paper">
                  <p>"Bakom den sista dörren finns valvet.<br>
                  Men vakten sover... nästan.<br>
                  Du måste hitta tre symboler, aktivera UV-lampan,<br>
                  och lösa det slutliga låset."</p>
                  <div class="clue-author">— Sista meddelandet innan tystnaden</div>
                </div>
                <div class="btn-row">
                  <button class="btn danger" @click="goScene('act3_sneak')">
                    SMYG FÖRBI VAKTEN
                  </button>
                </div>
              </div>
            </div>
      
            <!-- ACT 3: SNEAK -->
            <div v-else-if="scene === 'act3_sneak'" key="act3_sneak">
              <div class="card">
                <div class="act-label">Operativ Fas — Snyga Rörelsen</div>
                <div class="narrator-box">
                  Du tar tre steg in i korridoren. Fötterna mot golvet. Hjärtat bankar.
                </div>
                <div class="body-text" style="text-align:center;">
                  <em>TRYCK PRECIS I RÄTT ÖGONBLICK:</em><br>
                  Vakten tittar bort — men bara en sekund.
                </div>
                <div style="text-align:center; margin:24px 0;">
                  <div style="font-size:60px; animation: sneakBob 1s ease-in-out infinite; display:inline-block;">🕵️</div>
                </div>
                <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin:16px 0;">
                  <button class="btn primary" @click="sneakSuccess()" style="font-size:20px; padding: 16px 32px;">
                    🤫 SMYG NU!
                  </button>
                </div>
                <div class="narrator-box" style="font-size:13px; margin-top:8px;">
                  Alternativt: gör en perfekt Missionaär-Impossible-roll över golvet.
                </div>
              </div>
            </div>
      
            <!-- ACT 3: SYMBOLS -->
            <div v-else-if="scene === 'act3_symbols'" key="act3_symbols">
              <div class="card">
                <div class="act-label">Låsmekanismen — Tre Symboler</div>
                <div class="narrator-box">
                  Valvets lås kräver tre symboler i rätt ordning. Symbolerna finns gömda runt i huset — men det är ett digitalt valv, och vi väljer dem HÄR.
                </div>
                <div class="clue-paper">
                  <p>"Välj symbolerna i denna ordning:<br>
                  Familjen — Vattnet — Firandet"</p>
                </div>
                <div class="body-text" style="text-align:center; font-size:13px;">
                  Markerade symboler: <em>{{ symbolsSelected.length }}/3</em>
                </div>
                <div class="symbol-row">
                  <div v-for="sym in symbols" :key="sym.id"
                    class="symbol-btn"
                    :class="{ selected: symbolsSelected.includes(sym.id) }"
                    @click="selectSymbol(sym)">
                    {{ sym.emoji }}
                    <span class="sym-label">{{ sym.name }}</span>
                  </div>
                </div>
                <div v-if="symbolError" style="color:var(--red); text-align:center; font-family:'Share Tech Mono'; font-size:11px; letter-spacing:2px; margin-top:8px;">
                  FEL KOMBINATION — FÖRSÖK IGEN
                </div>
                <div class="hint-box" :class="{ visible: showHint5 }">
                  Familj = 👨‍👩‍👧‍👦, Vatten = 💧, Firande = 🎉
                </div>
                <div class="btn-row">
                  <button class="btn" @click="showHint5 = true">💡 LEDTRÅD</button>
                </div>
              </div>
            </div>
      
            <!-- ACT 3: UV -->
            <div v-else-if="scene === 'act3_uv'" key="act3_uv">
              <div class="card">
                <div class="act-label">UV-Lampan — Det Osynliga Meddelandet</div>
                <div class="narrator-box">
                  Du hittar en UV-lampa i lådan märkt "Diverse 2019". Den lyser med ett spöklikt lila sken.
                  Rikta den mot väggen brevid valvet...
                </div>
                <div class="uv-panel" :class="{ activated: uvActivated }" @click="activateUV">
                  <div class="uv-hidden">RAMLÖSA</div>
                  <div
                  :style="{
                    fontSize: '36px',
                    margin: '8px 0',
                    opacity: uvActivated ? 1 : 0.1,
                    transition: 'opacity 1s'
                  }"
                >
                >
                  💧✨🔓
                </div>
                  <div class="uv-instruction">
                    {{ uvActivated ? 'MEDDELANDET UPPENBARAR SIG' : '[ KLICKA FÖR ATT AKTIVERA UV-LAMPA ]' }}
                  </div>
                </div>
                <div v-if="uvActivated" class="narrator-box" style="border-color:#8844ff; color:#cc99ff; margin-top:16px;">
                  Under det osynliga bläcket framträder orden:
                  <em style="color:#dd99ff; display:block; margin-top:8px; font-size:18px; letter-spacing:2px;">
                    "DU ÄR VÄRDIG. VALVET ÖPPNAS."
                  </em>
                </div>
                <div class="btn-row" v-if="uvActivated">
                  <button class="btn primary" @click="goScene('act4_final')">
                    ÖPPNA VALVET →
                  </button>
                </div>
              </div>
            </div>
      
            <!-- ACT 4: FINAL -->
            <div v-else-if="scene === 'act4_final'" key="act4_final">
              <div class="card">
                <div class="progress-track">
                  <div class="progress-dot done"></div>
                  <div class="progress-dot done"></div>
                  <div class="progress-dot done"></div>
                  <div class="progress-dot done"></div>
                </div>
                <div class="act-label">OPERATION SLUTFÖRD — DEN STORA FINALEN</div>
      
                <div style="text-align:center;">
                  <span class="final-bottle">💧</span>
                </div>
      
                <div class="pssscht">PSSSSCHT!</div>
      
                <div class="confetti-bar">
                  <span>🎉</span><span>🥂</span><span>✨</span><span>🎈</span>
                  <span>💙</span><span>⭐</span><span>🎊</span><span>🎁</span>
                </div>
      
                <div class="clue-paper" style="text-align:center; margin:20px 0;">
                  <p style="font-size:20px; font-family:'Cinzel'; font-weight:700;">
                    "Ramlösan är frigjord.<br>
                    Bubblorna stiger.<br><br>
                    Födelsedagen kan nu<br>
                    officiellt börja."
                  </p>
                  <div class="clue-author" style="font-size:15px; margin-top:16px;">— Familjen 💙</div>
                </div>
      
                <div class="narrator-box" style="text-align:center; font-size:16px; line-height:2;">
                  Du klarade alla fyra prövningar.<br>
                  Kylskåpet. Familjeminnen. Vakten. UV-lampan.<br>
                  <em>Nu — hämta Ramlösan och fira.</em>
                </div>
      
                <div class="btn-row">
                  <button class="btn gold" @click="goScene('intro')">
                    🔄 SPELA IGEN
                  </button>
                </div>
              </div>
            </div>
      
            </transition>
          </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';

// ── CUSTOMIZE THESE ──────────────────────────────
const birthYear = ref(25);          // Sista 2 siffrorna av födelseår
const moveYear  = ref(2018);        // Året familjen flyttade in
const chipsPersonCorrect = 'sibling'; // 'dad', 'mom', 'sibling', 'grandma'
const favFoodCorrect = 'pizza';       // se foodOptions nedan
// ─────────────────────────────────────────────────

const scene    = ref('intro');
const jumpscare = ref(false);
const jumpscareText = ref('');
const jumpscareSubText = ref('');
const scrollZone = ref(null);

// Act 1
const act1Selected = ref(null);
const act1Wrong    = ref(null);
const showHint1    = ref(false);
const code1        = ref('');
const code1Shake   = ref(false);
const code1Done    = ref(false);
const showHint1b   = ref(false);
const code1Answer  = computed(() => {
  const sum = 4 + (2000 + birthYear.value) + 4;
  return sum.toString().slice(-4);
});

// Act 2
const r1Selected   = ref(null);
const r1Wrong      = ref(null);
const showHint2    = ref(false);
const code2        = ref('');
const code2Shake   = ref(false);
const code2Done    = ref(false);
const showHint3    = ref(false);
const r3Selected   = ref(null);
const r3Wrong      = ref(null);
const code3        = ref('');
const code3Shake   = ref(false);
const code3Done    = ref(false);
const showHint4    = ref(false);
const riddlesDone  = ref(0);

// Act 3
const symbolsSelected = ref([]);
const symbolError     = ref(false);
const uvActivated     = ref(false);
const showHint5       = ref(false);

const act1Options = [
  { id: 'soda', emoji: '🫙', name: 'SODASTREAMERN', sub: 'Kolsyrar vatten' },
  { id: 'fridge', emoji: '🧊', name: 'KYLSKÅPET', sub: 'Bevarar med kyla' },
  { id: 'sink', emoji: '🚰', name: 'DISKSTÄLLET', sub: 'Vatten flödar' },
  { id: 'freezer', emoji: '❄️', name: 'FRYSEN', sub: 'Djupkylt' },
];

const familyMembers = [
  { id: 'dad',     emoji: '👨', role: 'PAPPA',   trait: '"Det var bara ett chip"' },
  { id: 'mom',     emoji: '👩', role: 'MAMMA',   trait: 'Köper alltid extra' },
  { id: 'sibling', emoji: '🧒', role: 'SYSKON',  trait: 'Skyller alltid på hunden' },
  { id: 'grandma', emoji: '👵', role: 'FARMOR',  trait: 'Sitter oskyldig' },
];

const foodOptions = [
  { id: 'pizza',   emoji: '🍕', name: 'Margherita pizza' },
  { id: 'pasta',   emoji: '🍝', name: 'Carbonara' },
  { id: 'sushi',   emoji: '🍣', name: 'Laxrulle' },
  { id: 'burger',  emoji: '🍔', name: 'Klassisk burgare' },
];

const symbols = [
  { id: 'family',  emoji: '👨‍👩‍👧‍👦',       name: 'FAMILJ' },
  { id: 'water',   emoji: '💧',       name: 'VATTEN' },
  { id: 'party',   emoji: '🎉',       name: 'FIRANDE' },
  { id: 'star',    emoji: '⭐',       name: 'STJÄRNA' },
  { id: 'key',     emoji: '🔑',       name: 'NYCKEL' },
  { id: 'lock',    emoji: '🔒',       name: 'LÅS' },
];

const correctSymbols = ['family', 'water', 'party'];

function goScene(s) {
  scene.value = s;
  nextTick(() => {
    if (scrollZone.value) scrollZone.value.scrollTop = 0;
  });
}

function doJumpscare(text, sub, duration = 1000) {
  jumpscareText.value = text;
  jumpscareSubText.value = sub;
  jumpscare.value = true;
  setTimeout(() => { jumpscare.value = false; }, duration);
}

function checkAct1(opt) {
  if (opt.id === 'fridge') {
    act1Selected.value = opt.id;
    setTimeout(() => goScene('act1_code'), 600);
  } else {
    act1Wrong.value = opt.id;
    setTimeout(() => { act1Wrong.value = null; }, 700);
    if (opt.id === 'freezer') {
      setTimeout(() => doJumpscare('❄️ KYLT!', 'Det var frysen — men inte HÄR!', 900), 300);
    }
  }
}

function checkCode1() {
  if (code1.value === code1Answer.value) {
    code1Done.value = true;
    setTimeout(() => goScene('act2_intro'), 800);
  } else {
    code1Shake.value = true;
    setTimeout(() => { code1Shake.value = false; }, 500);
  }
}

function checkR1(m) {
  if (m.id === chipsPersonCorrect) {
    r1Selected.value = m.id;
    riddlesDone.value = 1;
    setTimeout(() => goScene('act2_r2'), 700);
  } else {
    r1Wrong.value = m.id;
    setTimeout(() => doJumpscare('😤 FEL!', m.role + ' nekade till det!', 800), 200);
    setTimeout(() => { r1Wrong.value = null; }, 800);
  }
}

function checkCode2() {
  const correct = moveYear.value.toString().slice(-2);
  if (code2.value === correct) {
    code2Done.value = true;
    riddlesDone.value = 2;
    setTimeout(() => goScene('act2_r3'), 800);
  } else {
    code2Shake.value = true;
    setTimeout(() => { code2Shake.value = false; }, 500);
  }
}

function checkR3(f) {
  if (f.id === favFoodCorrect) {
    r3Selected.value = f.id;
    riddlesDone.value = 3;
    setTimeout(() => goScene('act2_cipher'), 700);
  } else {
    r3Wrong.value = f.id;
    setTimeout(() => doJumpscare('🚫 NEJ!', 'Ni ÄLSKAR inte ' + f.name + '!', 800), 200);
    setTimeout(() => { r3Wrong.value = null; }, 800);
  }
}

function checkCode3() {
  if (code3.value === '32') {
    code3Done.value = true;
    setTimeout(() => goScene('act3_intro'), 800);
  } else {
    code3Shake.value = true;
    setTimeout(() => { code3Shake.value = false; }, 500);
  }
}

function sneakSuccess() {
  doJumpscare('👀 VAKTEN VAKNAR!', 'Eller... nej. Han fortsätter sova. Du klarar det!', 1400);
  setTimeout(() => goScene('act3_symbols'), 1600);
}

function selectSymbol(sym) {
  if (symbolsSelected.value.includes(sym.id)) {
    symbolsSelected.value = symbolsSelected.value.filter(s => s !== sym.id);
    return;
  }
  symbolsSelected.value.push(sym.id);

  if (symbolsSelected.value.length === 3) {
    const ok = correctSymbols.every((s, i) => symbolsSelected.value[i] === s);
    if (ok) {
      setTimeout(() => goScene('act3_uv'), 600);
    } else {
      symbolError.value = true;
      setTimeout(() => {
        symbolsSelected.value = [];
        symbolError.value = false;
      }, 900);
    }
  }
}

function activateUV() {
  uvActivated.value = true;
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;1,300;1,400&family=Share+Tech+Mono&display=swap');

:root {
  --navy:   #0b1221;
  --blue:   #1a3a6e;
  --mid:    #2a5298;
  --silver: #c8d8ee;
  --pale:   #e8f0fa;
  --gold:   #c9a84c;
  --gold2:  #f0d060;
  --red:    #c0392b;
  --green:  #27ae60;
  --dark:   #060c18;
  --glass:  rgba(200,216,238,0.07);
  --border: rgba(200,216,238,0.18);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.ramlosa-page {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: var(--dark);
  overflow: hidden;
  font-family: 'Crimson Pro', Georgia, serif;
  color: var(--pale);
}

/* ── BACKGROUNDS ─────────────────────────────────────────── */
.bg-stars {
  position: fixed; inset: 0; z-index: 0;
  background:
    radial-gradient(ellipse 80% 50% at 50% -10%, rgba(26,58,110,0.5) 0%, transparent 70%),
    radial-gradient(ellipse 40% 60% at 80% 80%, rgba(11,18,33,0.8) 0%, transparent 60%),
    var(--dark);
}
.bg-stars::before {
  content: '';
  position: absolute; inset: 0;
  background-image:
    radial-gradient(circle, rgba(200,216,238,0.7) 1px, transparent 1px),
    radial-gradient(circle, rgba(200,216,238,0.4) 1px, transparent 1px);
  background-size: 120px 120px, 60px 60px;
  background-position: 0 0, 30px 30px;
  opacity: 0.25;
  animation: twinkle 6s ease-in-out infinite alternate;
}
@keyframes twinkle { from { opacity: 0.15; } to { opacity: 0.35; } }

.bg-scan {
  position: fixed; inset: 0; z-index: 1; pointer-events: none;
  background: repeating-linear-gradient(
    0deg, transparent, transparent 3px,
    rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px
  );
}

/* ── LAYOUT ──────────────────────────────────────────────── */
.ramlosa-operation {
  position: relative; z-index: 2;
  width: 100vw; height: 100vh;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  overflow: hidden;
}

.scene {
  width: 100%; max-width: 680px;
  padding: 0 16px;
  display: flex; flex-direction: column;
  align-items: center;
}

/* ── CARD ────────────────────────────────────────────────── */
.card {
  width: 100%;
  background: linear-gradient(160deg, rgba(20,35,65,0.92), rgba(10,18,38,0.97));
  border: 1px solid var(--border);
  border-radius: 2px;
  box-shadow:
    0 0 0 1px rgba(200,216,238,0.04),
    0 30px 80px rgba(0,0,0,0.7),
    inset 0 1px 0 rgba(200,216,238,0.08);
  padding: 40px 44px 36px;
  position: relative;
  overflow: hidden;
}
.card::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
  opacity: 0.6;
}

/* ── TYPOGRAPHY ──────────────────────────────────────────── */
.act-label {
  font-family: 'Share Tech Mono', monospace;
  font-size: 9px; letter-spacing: 4px;
  color: var(--gold); opacity: 0.8;
  text-transform: uppercase; margin-bottom: 12px;
  display: flex; align-items: center; gap: 10px;
}
.act-label::before, .act-label::after {
  content: ''; flex: 1; height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold));
  opacity: 0.4;
}
.act-label::after { background: linear-gradient(270deg, transparent, var(--gold)); }

h1.title {
  font-family: 'Cinzel', serif;
  font-size: clamp(28px, 5vw, 42px);
  font-weight: 900; letter-spacing: 3px;
  color: var(--pale);
  text-shadow: 0 0 40px rgba(200,216,238,0.3);
  line-height: 1.1;
  margin-bottom: 8px;
}
h2.subtitle {
  font-family: 'Cinzel', serif;
  font-size: clamp(16px, 3vw, 22px);
  font-weight: 400; letter-spacing: 2px;
  color: var(--silver); opacity: 0.85;
  margin-bottom: 24px;
}
.body-text {
  font-size: 16px; line-height: 1.75;
  color: var(--pale); opacity: 0.85;
  margin-bottom: 20px;
}
.italics { font-style: italic; }
em { color: var(--gold2); font-style: normal; }

/* ── CLUE PAPER ──────────────────────────────────────────── */
.clue-paper {
  background: linear-gradient(160deg, #f5ead0, #ede0b8);
  border: 1px solid #c8a860;
  border-radius: 2px;
  padding: 20px 24px;
  margin: 20px 0;
  position: relative;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4), inset 0 0 30px rgba(180,140,60,0.1);
}
.clue-paper::before {
  content: '';
  position: absolute; inset: 6px;
  border: 1px dashed rgba(180,140,60,0.3);
  pointer-events: none;
}
.clue-paper p {
  color: #2a1a06;
  font-family: 'Crimson Pro', serif;
  font-size: 17px; line-height: 1.6;
  font-style: italic;
}
.clue-paper .clue-author {
  font-size: 13px; margin-top: 12px;
  opacity: 0.6; text-align: right;
  font-style: normal; letter-spacing: 1px;
}

/* ── BUTTONS ─────────────────────────────────────────────── */
.btn {
  display: inline-flex; align-items: center; gap: 10px;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--silver);
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px; letter-spacing: 3px;
  text-transform: uppercase;
  padding: 13px 28px;
  cursor: pointer;
  transition: all 0.25s;
  border-radius: 1px;
  margin: 6px;
}
.btn:hover {
  border-color: var(--silver);
  background: rgba(200,216,238,0.07);
  color: var(--pale);
  box-shadow: 0 0 20px rgba(200,216,238,0.08);
}
.btn.primary {
  background: linear-gradient(135deg, var(--blue), var(--mid));
  border-color: var(--mid);
  color: var(--pale);
}
.btn.primary:hover {
  background: linear-gradient(135deg, var(--mid), #3060b0);
  box-shadow: 0 0 30px rgba(42,82,152,0.4);
}
.btn.gold {
  background: linear-gradient(135deg, #8a6020, var(--gold));
  border-color: var(--gold);
  color: #0a0800;
}
.btn.gold:hover { box-shadow: 0 0 30px rgba(201,168,76,0.4); }
.btn.danger { border-color: var(--red); color: #e88; }
.btn.danger:hover { background: rgba(192,57,43,0.15); box-shadow: 0 0 20px rgba(192,57,43,0.2); }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-row { display: flex; flex-wrap: wrap; justify-content: center; margin-top: 16px; }
@keyframes sneakBob {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-8px) scale(1.05);
  }
}
/* ── INPUT ───────────────────────────────────────────────── */
.input-wrap {
  display: flex; gap: 10px; align-items: center;
  margin: 16px 0;
}
.code-input {
  background: rgba(0,0,0,0.4);
  border: 1px solid var(--border);
  border-radius: 1px;
  color: var(--gold2);
  font-family: 'Share Tech Mono', monospace;
  font-size: 20px; letter-spacing: 8px;
  text-align: center;
  padding: 12px 20px;
  width: 180px;
  outline: none;
  transition: border-color 0.2s;
}
.code-input:focus { border-color: var(--gold); }
.code-input.shake { animation: shake 0.4s; }
.code-input.success {
  border-color: var(--green);
  color: var(--green);
  box-shadow: 0 0 20px rgba(39,174,96,0.3);
}

@keyframes shake {
  0%,100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-5px); }
  80% { transform: translateX(5px); }
}

/* ── PROGRESS ────────────────────────────────────────────── */
.progress-track {
  display: flex; gap: 6px;
  margin-bottom: 28px;
  justify-content: center;
}
.progress-dot {
  width: 8px; height: 8px; border-radius: 50%;
  border: 1px solid var(--border);
  background: transparent;
  transition: all 0.4s;
}
.progress-dot.done { background: var(--gold); border-color: var(--gold); }
.progress-dot.active {
  background: var(--silver); border-color: var(--silver);
  box-shadow: 0 0 8px var(--silver);
  animation: pulse-dot 1.5s infinite;
}
@keyframes pulse-dot {
  0%,100% { box-shadow: 0 0 8px var(--silver); }
  50% { box-shadow: 0 0 18px var(--silver); }
}

/* ── PHOTO GRID ──────────────────────────────────────────── */
.photo-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 12px; margin: 16px 0;
}
.photo-card {
  background: rgba(0,0,0,0.3);
  border: 1px solid var(--border);
  border-radius: 1px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}
.photo-card:hover { border-color: var(--gold); background: rgba(201,168,76,0.06); }
.photo-card.selected {
  border-color: var(--gold2);
  background: rgba(201,168,76,0.12);
  box-shadow: 0 0 20px rgba(201,168,76,0.15);
}
.photo-card.wrong { border-color: var(--red); animation: shake 0.4s; }
.photo-emoji { font-size: 40px; margin-bottom: 8px; }
.photo-name {
  font-family: 'Share Tech Mono', monospace;
  font-size: 9px; letter-spacing: 2px;
  color: var(--silver); opacity: 0.7;
}
.photo-sub { font-size: 13px; color: var(--pale); margin-top: 4px; opacity: 0.8; }

/* ── CIPHER ──────────────────────────────────────────────── */
.cipher-display {
  background: rgba(0,0,0,0.5);
  border: 1px solid var(--border);
  border-radius: 2px;
  padding: 20px;
  margin: 16px 0;
  font-family: 'Share Tech Mono', monospace;
  font-size: clamp(14px, 2.5vw, 18px);
  letter-spacing: 4px;
  color: var(--gold);
  text-align: center;
  line-height: 2;
  text-shadow: 0 0 10px rgba(201,168,76,0.4);
}

/* ── UV EFFECT ───────────────────────────────────────────── */
.uv-panel {
  background: #0a0020;
  border: 2px solid #4400aa;
  border-radius: 2px;
  padding: 24px;
  margin: 16px 0;
  position: relative;
  overflow: hidden;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}
.uv-panel.activated {
  box-shadow: 0 0 40px rgba(160,0,255,0.5), inset 0 0 60px rgba(100,0,200,0.3);
}
.uv-panel::before {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(80,0,160,0.2), transparent);
}
.uv-hidden {
  color: transparent;
  text-shadow: none;
  transition: all 0.8s;
  font-family: 'Cinzel', serif;
  font-size: 28px; letter-spacing: 4px;
  font-weight: 900;
  position: relative; z-index: 1;
}
.uv-panel.activated .uv-hidden {
  color: #cc88ff;
  text-shadow: 0 0 20px #aa44ff, 0 0 40px #8800ff;
  animation: uvGlow 2s infinite alternate;
}
@keyframes uvGlow {
  from { text-shadow: 0 0 20px #aa44ff, 0 0 40px #8800ff; }
  to   { text-shadow: 0 0 30px #dd99ff, 0 0 60px #aa00ff, 0 0 80px #6600cc; }
}
.uv-instruction {
  font-family: 'Share Tech Mono', monospace;
  font-size: 10px; letter-spacing: 2px;
  color: #6633aa; margin-top: 10px;
  position: relative; z-index: 1;
}

/* ── LOCK SYMBOLS ────────────────────────────────────────── */
.symbol-row {
  display: flex; gap: 16px; justify-content: center;
  margin: 20px 0;
}
.symbol-btn {
  width: 70px; height: 70px;
  background: rgba(0,0,0,0.4);
  border: 1px solid var(--border);
  border-radius: 2px;
  font-size: 30px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
  flex-direction: column;
  gap: 4px;
}
.symbol-btn:hover { border-color: var(--gold); transform: scale(1.05); }
.symbol-btn.selected {
  border-color: var(--gold2);
  background: rgba(201,168,76,0.15);
  box-shadow: 0 0 20px rgba(201,168,76,0.2);
}
.symbol-btn .sym-label {
  font-family: 'Share Tech Mono', monospace;
  font-size: 7px; letter-spacing: 1px;
  color: var(--silver); opacity: 0.5;
}

/* ── JUMPSCARE ───────────────────────────────────────────── */
.jumpscare-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: var(--red);
  display: flex; align-items: center; justify-content: center;
  flex-direction: column;
  animation: jumpIn 0.05s ease-out;
}
@keyframes jumpIn { from { opacity: 0; } to { opacity: 1; } }
.jumpscare-text {
  font-family: 'Cinzel', serif;
  font-size: 60px; font-weight: 900;
  color: white; letter-spacing: 4px;
  text-shadow: 0 0 40px rgba(255,255,255,0.5);
  text-align: center;
}
.jumpscare-sub {
  font-size: 18px; color: rgba(255,255,255,0.8);
  margin-top: 12px; letter-spacing: 2px;
}

/* ── FINAL ───────────────────────────────────────────────── */
.final-bottle {
  font-size: 100px;
  animation: bottleFloat 2s ease-in-out infinite;
  filter: drop-shadow(0 0 30px rgba(68,136,255,0.6));
  display: block; text-align: center; margin: 20px 0;
}
@keyframes bottleFloat {
  0%,100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-16px) rotate(2deg); }
}
.confetti-bar {
  display: flex; justify-content: center; gap: 8px;
  flex-wrap: wrap; margin: 12px 0;
}
.confetti-bar span { animation: confettiFall 1s ease-in-out infinite; font-size: 22px; }
.confetti-bar span:nth-child(2n) { animation-delay: 0.2s; }
.confetti-bar span:nth-child(3n) { animation-delay: 0.4s; }
@keyframes confettiFall {
  0%,100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-8px) rotate(15deg); }
}

.pssscht {
  font-family: 'Cinzel', serif;
  font-size: clamp(36px, 7vw, 64px);
  font-weight: 900; letter-spacing: 4px;
  color: var(--gold2);
  text-shadow: 0 0 40px rgba(240,208,96,0.6), 0 0 80px rgba(240,208,96,0.3);
  text-align: center;
  animation: glow-pulse 2s ease-in-out infinite;
}
@keyframes glow-pulse {
  0%,100% { text-shadow: 0 0 40px rgba(240,208,96,0.6); }
  50% { text-shadow: 0 0 60px rgba(240,208,96,0.9), 0 0 100px rgba(240,208,96,0.4); }
}

/* ── TRANSITIONS ─────────────────────────────────────────── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.5s, transform 0.5s; }
.fade-enter-from { opacity: 0; transform: translateY(20px); }
.fade-leave-to   { opacity: 0; transform: translateY(-20px); }

/* ── TIMER ───────────────────────────────────────────────── */
.timer-row {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px;
}
.timer {
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px; letter-spacing: 2px;
  color: var(--gold); opacity: 0.7;
}

/* ── NARRATOR ────────────────────────────────────────────── */
.narrator-box {
  background: rgba(0,0,0,0.5);
  border-left: 2px solid var(--gold);
  padding: 14px 18px;
  margin: 16px 0;
  font-style: italic;
  font-size: 15px; line-height: 1.65;
  color: var(--silver); opacity: 0.9;
}

/* ── HINT ────────────────────────────────────────────────── */
.hint-box {
  background: rgba(39,174,96,0.08);
  border: 1px solid rgba(39,174,96,0.3);
  border-radius: 1px;
  padding: 12px 16px;
  margin: 12px 0;
  font-size: 13px; color: #6dffa8;
  font-family: 'Share Tech Mono', monospace;
  letter-spacing: 1px;
  display: none;
}
.hint-box.visible { display: block; }

/* ── STATUS ──────────────────────────────────────────────── */
.status-badge {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 9px; letter-spacing: 2px;
  color: var(--green); border: 1px solid rgba(39,174,96,0.4);
  padding: 4px 10px; border-radius: 1px;
  background: rgba(39,174,96,0.08);
}

/* ── RIDDLE COUNTER ──────────────────────────────────────── */
.riddle-track {
  display: flex; gap: 6px; margin: 12px 0;
}
.rtick {
  width: 20px; height: 4px; border-radius: 2px;
  background: var(--border);
  transition: background 0.3s;
}
.rtick.done { background: var(--green); }

/* ── SCROLLABLE ──────────────────────────────────────────── */
.scroll-zone {
  max-height: 80vh;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
  width: 100%;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}
</style>
