<template>
  <div class="stjarnvaktaren-app">
<!-- Star canvas (background) -->
  <canvas ref="starCanvas" class="star-canvas"></canvas>

  <!-- Aurora -->
  <div class="aurora-layer" :class="{'aurora-solved': solvedCount >= 3}">
    <div class="aurora-band ab1"></div>
    <div class="aurora-band ab2"></div>
    <div class="aurora-band ab3"></div>
  </div>

  <!-- HUD -->
  <div class="hud">
    <div class="hud-title">STJÄRNVAKTAREN</div>
    <div class="progress-dots">
      <div v-for="i in 4" :key="i" class="pdot"
           :class="{done: solvedCount >= i, active: solvedCount === i-1}"></div>
    </div>
    <div class="hud-chapter">{{ chapterLabel }}</div>
  </div>

  <!-- 3D Scene -->
  <template v-if="phase !== 'win'">

    <!-- Observatory SVG -->
    <div class="observatory" @click="clickObservatory" :title="'Observatoriet'">
      <svg class="obs-svg" viewBox="0 0 220 260" fill="none">
        <!-- Shadow -->
        <ellipse cx="110" cy="255" rx="70" ry="8" fill="rgba(0,0,0,0.4)"/>
        <!-- Main tower -->
        <rect x="55" y="130" width="110" height="120" rx="2"
              fill="url(#obsGrad)" stroke="rgba(200,220,255,0.08)" stroke-width="1"/>
        <!-- Tower left edge depth -->
        <rect x="48" y="138" width="8" height="112" rx="1"
              fill="rgba(0,0,0,0.35)"/>
        <!-- Windows -->
        <rect x="78" y="160" width="20" height="26" rx="2"
              fill="rgba(100,160,255,0.12)" stroke="rgba(200,216,240,0.12)" stroke-width="1"/>
        <rect x="122" y="160" width="20" height="26" rx="2"
              fill="rgba(100,160,255,0.12)" stroke="rgba(200,216,240,0.12)" stroke-width="1"/>
        <!-- Window glow (unlocked) -->
        <rect x="78" y="160" width="20" height="26" rx="2"
              :fill="solvedCount>=2 ? 'rgba(0,255,212,0.18)' : 'transparent'"
              style="transition:fill 1s"/>
        <!-- Door -->
        <rect x="90" y="210" width="40" height="40" rx="2"
              :fill="solvedCount>=4 ? 'rgba(212,168,64,0.4)' : 'rgba(0,0,0,0.4)'"
              :stroke="solvedCount>=4 ? 'rgba(212,168,64,0.5)' : 'rgba(200,216,240,0.08)'"
              stroke-width="1" style="transition:all 1.5s"/>
        <circle cx="126" cy="230" r="3"
                :fill="solvedCount>=4 ? 'rgba(212,168,64,0.8)' : 'rgba(200,216,240,0.15)'"
                style="transition:all 1.5s"/>
        <!-- Dome base -->
        <rect x="60" y="100" width="100" height="35" rx="3"
              fill="url(#domeBaseGrad)" stroke="rgba(200,220,255,0.06)" stroke-width="1"/>
        <!-- Dome -->
        <ellipse cx="110" cy="100" rx="60" ry="42"
                 fill="url(#domeGrad)" stroke="rgba(200,220,255,0.1)" stroke-width="1"/>
        <!-- Dome slit -->
        <path d="M110 60 L110 100" stroke="rgba(0,255,212,0.3)" stroke-width="2.5" :opacity="solvedCount>=1 ? 1 : 0.15"/>
        <!-- Dome rings -->
        <ellipse cx="110" cy="100" rx="60" ry="12" fill="none" stroke="rgba(200,220,255,0.05)" stroke-width="1"/>
        <ellipse cx="110" cy="88" rx="50" ry="8" fill="none" stroke="rgba(200,220,255,0.04)" stroke-width="1"/>
        <!-- Telescope barrel (visible through slit) -->
        <rect x="107" y="68" width="6" height="28" rx="2"
              :fill="solvedCount>=3 ? 'rgba(0,255,212,0.5)' : 'rgba(200,220,255,0.2)'"
              style="transition:fill 1s"/>
        <!-- Glow from dome when solved -->
        <ellipse cx="110" cy="100" rx="60" ry="42" fill="transparent"
                 :stroke="solvedCount>=4 ? 'rgba(212,168,64,0.4)' : 'transparent'"
                 stroke-width="3" style="transition:all 2s"
                 filter="url(#glow)"/>
        <defs>
          <linearGradient id="obsGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#0e1228"/>
            <stop offset="50%" stop-color="#141830"/>
            <stop offset="100%" stop-color="#0a0e20"/>
          </linearGradient>
          <linearGradient id="domeGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#1a2040"/>
            <stop offset="100%" stop-color="#080c1e"/>
          </linearGradient>
          <linearGradient id="domeBaseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#1e2448"/>
            <stop offset="100%" stop-color="#0e1228"/>
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
      </svg>
    </div>

    <!-- Snow ground -->
    <div class="snow-ground">
      <div class="snow-surface"></div>
    </div>

    <!-- Tree silhouettes -->
    <svg class="trees" viewBox="0 0 1400 140" preserveAspectRatio="none" style="height:120px;">
      <!-- Left cluster -->
      <g fill="rgba(5,7,18,0.95)">
        <polygon points="40,120 60,40 80,120"/>
        <polygon points="60,120 85,30 110,120"/>
        <polygon points="0,120 20,55 40,120"/>
        <polygon points="100,120 118,50 136,120"/>
        <polygon points="130,120 152,35 174,120"/>
        <polygon points="160,120 178,60 196,120"/>
        <!-- Right cluster -->
        <polygon points="1260,120 1278,50 1296,120"/>
        <polygon points="1290,120 1312,32 1334,120"/>
        <polygon points="1320,120 1340,55 1360,120"/>
        <polygon points="1350,120 1368,42 1386,120"/>
        <polygon points="1380,120 1398,58 1416,120"/>
        <!-- Middle sparse -->
        <polygon points="560,120 576,65 592,120"/>
        <polygon points="800,120 820,50 840,120"/>
        <polygon points="840,120 858,70 876,120"/>
      </g>
    </svg>

    <!-- NARRATIVE BOX -->
    <div class="narrative" v-if="narrative.visible">
      <div class="narrative-title">{{ narrative.title }}</div>
      {{ narrative.text }}
      <button class="narrative-btn" @click="dismissNarrative">{{ narrative.btnText || 'FORTSÄTT' }}</button>
    </div>

    <!-- Floating obj labels -->
    <div class="obj-label" v-if="hoverLabel" :style="{left: labelPos.x+'px', top: labelPos.y+'px'}">
      {{ hoverLabel }}
    </div>

  </template>

  <!-- ══════════════════════════════════════════
       PUZZLE MODALS
  ══════════════════════════════════════════ -->

  <!-- PUZZLE 1: CONSTELLATION (Star Connect) -->
  <div class="modal-overlay" v-if="modal==='constellation'" @click.self="modal=null">
    <div class="modal">
      <button class="modal-close" @click="modal=null">✕</button>
      <div class="modal-inner">
        <div class="modal-eyebrow">GÅTA I — STJÄRNKARTAN</div>
        <div class="modal-title">VINTERTRIANGELNS HEMLIGHET</div>
        <div class="modal-lore">Klicka på stjärnorna i rätt ordning. Du behöver inte dra med musen — varje klick lägger nästa streck automatiskt. Börja med den ljusaste, gå till den rödaste, avsluta med den kallaste.</div>

        <div class="star-field-puzzle">
          <div class="sfp-inner">
            <!-- SVG lines -->
            <svg class="star-line">
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="rgba(0,255,212,0.8)"/>
                  <stop offset="100%" stop-color="rgba(0,255,212,0.3)"/>
                </linearGradient>
              </defs>
              <line v-for="(l,i) in constellationLines" :key="i"
                    :x1="l.x1+'%'" :y1="l.y1+'%'" :x2="l.x2+'%'" :y2="l.y2+'%'"
                    stroke="url(#lineGrad)" stroke-width="1.5" opacity="0.7"
                    stroke-dasharray="4,3"/>
            </svg>
            <!-- Background stars (decorative) -->
            <div v-for="bs in bgStars" :key="'bs'+bs.id"
                 style="position:absolute;border-radius:50%;background:rgba(255,253,232,0.5);"
                 :style="{left:bs.x+'%',top:bs.y+'%',width:bs.s+'px',height:bs.s+'px',transform:'translate(-50%,-50%)'}">
            </div>
            <!-- Main interactive stars -->
            <div v-for="star in puzzleStars" :key="star.id"
                 class="star-dot"
                 :class="{selected: selectedStars.includes(star.id)}"
                 :style="{left:star.x+'%', top:star.y+'%'}"
                 @click="clickStar(star)">
              <div class="core" :style="{
                width: star.size+'px', height: star.size+'px',
                background: star.color,
                boxShadow: `0 0 ${star.size*1.5}px ${star.color}, 0 0 ${star.size*3}px ${star.colorDim}`
              }"></div>
              <div class="star-name">{{ star.name }}</div>
            </div>
            <div class="constellation-hint">{{ selectedStars.length }}/3 stjärnor valda</div>
          </div>
        </div>

        <div class="constellation-help">
          Klicka: <strong>SIRIUS</strong> → <strong>BETELGEUSE</strong> → <strong>PROCYON</strong>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="puzzle-btn" style="flex:1" @click="checkConstellation" :disabled="selectedStars.length < 3">BEKRÄFTA KONSTELLATION</button>
          <button class="puzzle-btn" style="flex:0 0 auto;width:auto;padding:14px 18px;" @click="selectedStars=[]">RENSA</button>
        </div>
        <div class="feedback" :class="fb.type">{{ fb.msg }}</div>
      </div>
    </div>
  </div>

  <!-- PUZZLE 2: RUNE SEQUENCE -->
  <div class="modal-overlay" v-if="modal==='rune'" @click.self="modal=null">
    <div class="modal">
      <button class="modal-close" @click="modal=null">✕</button>
      <div class="modal-inner">
        <div class="modal-eyebrow">GÅTA II — RUNORNAS ORDNING</div>
        <div class="modal-title">NORRSKENSRUNORNA</div>
        <div class="modal-lore">Fyra urgamla runor lyser i norrskenet. En gammal inskrift lyder: "Eld föder Vind, Vind bär Vatten, Vatten släcker Eld, Is binder allt." Välj dem i naturens kedja.</div>

        <div class="rune-order-display">
          <div v-for="(r,i) in runeOrder" :key="i" class="rod" :class="{filled: r !== null}">
            {{ r || '?' }}
          </div>
        </div>

        <div class="rune-grid">
          <div v-for="rune in runes" :key="rune.id"
               class="rune-tile"
               :class="{selected: runeOrder.includes(rune.symbol), correct: runeCorrect && runeOrder.includes(rune.symbol)}"
               @click="selectRune(rune)">
            <span style="font-size:32px;">{{ rune.symbol }}</span>
            <span style="position:absolute;bottom:3px;font-family:'Share Tech Mono',monospace;font-size:7px;letter-spacing:1px;color:inherit;opacity:0.6;">{{ rune.name }}</span>
          </div>
        </div>

        <div style="display:flex;gap:8px;">
          <button class="puzzle-btn" style="flex:1" @click="checkRunes">AKTIVERA RUNOR</button>
          <button class="puzzle-btn" style="flex:0;padding:14px 18px;" @click="runeOrder=[null,null,null,null]">↺</button>
        </div>
        <div class="feedback" :class="fb.type">{{ fb.msg }}</div>
      </div>
    </div>
  </div>

  <!-- PUZZLE 3: TELESCOPE ALIGNMENT -->
  <div class="modal-overlay" v-if="modal==='telescope'" @click.self="modal=null">
    <div class="modal">
      <button class="modal-close" @click="modal=null">✕</button>
      <div class="modal-inner">
        <div class="modal-eyebrow">GÅTA III — TELESKOPET</div>
        <div class="modal-title">RIKTA MOT POLSTJÄRNAN</div>
        <div class="modal-lore">Det uråldriga teleskopet måste riktas mot Polaris — den orörliga punkten. Den sitter alltid 23° från centrum i nordlig riktning. Justera azimut och elevation tills siktet träffar.</div>

        <div class="telescope-wrap">
          <div class="telescope-view">
            <!-- Background mini stars -->
            <div v-for="ms in telMiniStars" :key="ms.id" class="tel-star-mini"
                 :style="{left:ms.x+'%',top:ms.y+'%',opacity:ms.op}"></div>
            <!-- Target: Polaris (fixed position) -->
            <div class="tel-target-star" style="left:50%;top:23%">
              <div class="glow" style="background:radial-gradient(circle,#fff 30%,#aad4ff 70%,transparent 100%);"></div>
            </div>
            <!-- Crosshair -->
            <div class="tel-crosshair"></div>
            <!-- Aim dot (moves with dial) -->
            <div style="position:absolute;transform:translate(-50%,-50%);width:12px;height:12px;transition:all .3s;"
                 :style="{left: aimX+'%', top: aimY+'%'}">
              <div style="width:100%;height:100%;border-radius:50%;border:2px solid rgba(0,255,212,0.7);box-shadow:0 0 10px rgba(0,255,212,0.4);"></div>
            </div>
            <!-- Rings -->
            <div class="tel-circle" style="width:40%;height:40%;"></div>
            <div class="tel-circle" style="width:70%;height:70%;"></div>
          </div>

          <div class="dial-label">AZIMUT: {{ telAz }}° &nbsp;|&nbsp; ELEVATION: {{ telEl }}°</div>
          <div class="angle-display">{{ telAz }}° / {{ telEl }}°</div>

          <div class="dial-row">
            <button class="dial-btn" @click="adjustTel('az',-5)">←</button>
            <div style="display:flex;flex-direction:column;gap:8px;">
              <button class="dial-btn" @click="adjustTel('el',-5)">↑</button>
              <button class="dial-btn" @click="adjustTel('el',5)">↓</button>
            </div>
            <button class="dial-btn" @click="adjustTel('az',5)">→</button>
          </div>
        </div>

        <button class="puzzle-btn" @click="checkTelescope">LÅS POSITION</button>
        <div class="feedback" :class="fb.type">{{ fb.msg }}</div>
      </div>
    </div>
  </div>

  <!-- PUZZLE 4: ORRERY ALIGNMENT -->
  <div class="modal-overlay" v-if="modal==='orrery'" @click.self="modal=null">
    <div class="modal">
      <button class="modal-close" @click="modal=null">✕</button>
      <div class="modal-inner">
        <div class="modal-eyebrow">GÅTA IV — ORRERY</div>
        <div class="modal-title">PLANETERNAS KONJUNKTION</div>
        <div class="modal-lore">Den mekaniska orrery:n visar tre planeter. Inskriften på basen lyder: "När Is möter Eld i Vattnets tecken, öppnas porten." — Vrid ringarna tills de tre planeterna bildar en rak linje (konjunktion).</div>

        <div class="orrery-wrap">
          <div class="orrery">
            <div class="sun-core"></div>
            <!-- Orbits & planets -->
            <div v-for="p in orreryPlanets" :key="p.id">
              <div class="orbit-ring"
                   :style="{width: p.radius*2+'px', height: p.radius*2+'px',
                            marginLeft: -p.radius+'px', marginTop: -p.radius+'px'}">
              </div>
              <div class="planet"
                   :style="{
                     width: p.size+'px', height: p.size+'px',
                     background: p.color,
                     boxShadow: `0 0 ${p.size*1.5}px ${p.colorGlow}`,
                     left: (140 + p.radius * Math.cos(p.angle * Math.PI/180) - p.size/2)+'px',
                     top:  (140 + p.radius * Math.sin(p.angle * Math.PI/180) - p.size/2)+'px',
                   }">
              </div>
            </div>
          </div>

          <!-- Alignment indicator -->
          <div style="width:200px;text-align:center;">
            <div style="font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:2px;color:var(--dim);margin-bottom:6px;">KONJUNKTION</div>
            <div class="alignment-bar">
              <div class="alignment-fill"
                   :style="{width: alignmentPct+'%',
                            background: alignmentPct > 90 ? '#4caf50' : alignmentPct > 60 ? 'var(--gold)' : 'var(--aurora1)'}">
              </div>
            </div>
            <div style="font-family:'Share Tech Mono',monospace;font-size:14px;color:var(--aurora1);margin-top:6px;">{{ Math.round(alignmentPct) }}%</div>
          </div>

          <div class="orrery-controls">
            <div v-for="p in orreryPlanets" :key="'ctrl'+p.id" style="display:flex;flex-direction:column;align-items:center;gap:4px;">
              <div style="font-family:'Share Tech Mono',monospace;font-size:8px;letter-spacing:2px;color:var(--dim);">{{ p.name }}</div>
              <div style="display:flex;gap:4px;">
                <button class="orr-btn" @click="rotatePlanet(p.id,-15)">◀</button>
                <button class="orr-btn" @click="rotatePlanet(p.id,15)">▶</button>
              </div>
            </div>
          </div>
        </div>

        <button class="puzzle-btn" @click="checkOrrery" :disabled="alignmentPct < 90">AKTIVERA KONJUNKTION</button>
        <div class="feedback" :class="fb.type">{{ fb.msg }}</div>
      </div>
    </div>
  </div>

  <!-- WIN -->
  <div class="win-screen" v-if="phase==='win'">
    <div class="win-stars">✦ ✧ ✦</div>
    <div class="win-title">PORTEN ÄR ÖPPEN</div>
    <div class="win-sub">
      Du har löst himmelens fyra gåtor.<br>
      Observatoriet öppnar sina hemligheter.<br>
      <em>Stjärnvaktarens arv är nu ditt.</em>
    </div>
    <div class="win-stars" style="font-size:30px;margin-top:8px;">★ ★ ★ ★</div>
    <button class="win-btn" @click="resetGame">SPELA IGEN</button>
  </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'

// ─── PHASE & MODAL ───
    const phase = ref('intro'); // intro | game | win
    const modal = ref(null);
    const starCanvas = ref(null);
    const solvedCount = ref(0);
    const hoverLabel = ref('');
    const labelPos = reactive({x:0,y:0});

    // ─── NARRATIVE ───
    const narrative = reactive({
      visible: false, title:'', text:'', btnText:'', onDismiss: null
    });
    function showNarrative(title, text, btnText, onDismiss) {
      narrative.title=title; narrative.text=text;
      narrative.btnText=btnText||'FORTSÄTT';
      narrative.onDismiss=onDismiss||null;
      narrative.visible=true;
    }
    function dismissNarrative() {
      narrative.visible=false;
      if(narrative.onDismiss) narrative.onDismiss();
    }

    const chapterLabel = computed(()=>{
      const labels=['I — UPPVAKNANDET','II — STJÄRNKARTAN','III — RUNORNA','IV — TELESKOPET','V — ORRERY'];
      return labels[Math.min(solvedCount.value, 4)];
    });

    // ─── FEEDBACK ───
    const fb = reactive({msg:'',type:''});
    let fbTimer=null;
    function setFb(msg,type,dur=2800){
      fb.msg=msg; fb.type=type;
      if(fbTimer) clearTimeout(fbTimer);
      fbTimer=setTimeout(()=>{fb.msg='';fb.type='';},dur);
    }

    // ─── STAR CANVAS (animated background) ───
    let animFrame, canvasCtx;
    const stars=[];
    const shootingStars=[];

    function initCanvas(){
      const canvas=starCanvas.value;
      if(!canvas) return;
      canvas.width=window.innerWidth;
      canvas.height=window.innerHeight;
      canvasCtx=canvas.getContext('2d');

      // Generate stars
      for(let i=0;i<280;i++){
        stars.push({
          x:Math.random()*canvas.width,
          y:Math.random()*canvas.height*0.75,
          r:Math.random()*1.4+0.3,
          base:Math.random(),
          speed:0.003+Math.random()*0.005,
          phase:Math.random()*Math.PI*2,
          color:`hsl(${200+Math.random()*60},${40+Math.random()*40}%,${80+Math.random()*20}%)`
        });
      }

      let frame=0;
      function draw(){
        const W=canvas.width, H=canvas.height;
        // Background gradient
        const bg=canvasCtx.createLinearGradient(0,0,0,H);
        bg.addColorStop(0,'#020410');
        bg.addColorStop(0.6,'#03050f');
        bg.addColorStop(1,'#050818');
        canvasCtx.fillStyle=bg;
        canvasCtx.fillRect(0,0,W,H);

        frame++;
        // Stars
        stars.forEach(s=>{
          const twinkle=0.5+0.5*Math.sin(frame*s.speed+s.phase);
          canvasCtx.globalAlpha=0.3+twinkle*0.7;
          canvasCtx.beginPath();
          canvasCtx.arc(s.x,s.y,s.r*(0.8+twinkle*0.4),0,Math.PI*2);
          canvasCtx.fillStyle=s.color;
          canvasCtx.fill();
          // Glow
          if(s.r>1.0){
            const g=canvasCtx.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r*4);
            g.addColorStop(0,'rgba(200,220,255,0.15)');
            g.addColorStop(1,'transparent');
            canvasCtx.beginPath();
            canvasCtx.arc(s.x,s.y,s.r*4,0,Math.PI*2);
            canvasCtx.fillStyle=g;
            canvasCtx.fill();
          }
        });
        canvasCtx.globalAlpha=1;

        // Occasional shooting star
        if(frame%320===0){
          shootingStars.push({x:Math.random()*W*0.8,y:Math.random()*H*0.4,vx:3+Math.random()*4,vy:1+Math.random()*2,life:1,maxLife:60});
        }
        shootingStars.forEach((ss,i)=>{
          ss.life--;
          ss.x+=ss.vx; ss.y+=ss.vy;
          const alpha=ss.life/ss.maxLife;
          canvasCtx.globalAlpha=alpha;
          canvasCtx.beginPath();
          canvasCtx.moveTo(ss.x,ss.y);
          canvasCtx.lineTo(ss.x-ss.vx*6,ss.y-ss.vy*6);
          canvasCtx.strokeStyle='rgba(200,230,255,0.9)';
          canvasCtx.lineWidth=1.5;
          canvasCtx.stroke();
          canvasCtx.globalAlpha=1;
        });
        // Remove dead shooting stars
        for(let i=shootingStars.length-1;i>=0;i--){
          if(shootingStars[i].life<=0) shootingStars.splice(i,1);
        }

        animFrame=requestAnimationFrame(draw);
      }
      draw();
    }

    // ─── PUZZLE 1: CONSTELLATION ───
    const puzzleStars = ref([
      {id:'sirius',   name:'SIRIUS',   x:28, y:62, size:14, color:'#b8d4ff', colorDim:'rgba(184,212,255,0.3)'},
      {id:'betelgeuse',name:'BETELGEUSE',x:52,y:35, size:12, color:'#ffaa60', colorDim:'rgba(255,170,96,0.3)'},
      {id:'procyon',  name:'PROCYON',  x:72, y:58, size:11, color:'#d0e8ff', colorDim:'rgba(208,232,255,0.3)'},
      // Decoys
      {id:'rigel',    name:'RIGEL',    x:40, y:70, size:10, color:'#a0c4ff', colorDim:'rgba(160,196,255,0.2)'},
      {id:'aldebaran',name:'ALDEBARAN',x:18, y:40, size:9,  color:'#ff9966', colorDim:'rgba(255,153,102,0.2)'},
      {id:'pollux',   name:'POLLUX',   x:80, y:30, size:9,  color:'#ffd0a0', colorDim:'rgba(255,208,160,0.2)'},
      {id:'castor',   name:'CASTOR',   x:88, y:45, size:8,  color:'#e8f0ff', colorDim:'rgba(232,240,255,0.2)'},
    ]);
    const bgStars = ref(Array.from({length:40},(_,i)=>({id:i,x:Math.random()*100,y:Math.random()*100,s:Math.random()*2+1})));
    const selectedStars = ref([]);
    const constellationLines = computed(()=>{
      const lines=[];
      const sel=selectedStars.value;
      for(let i=0;i<sel.length-1;i++){
        const a=puzzleStars.value.find(s=>s.id===sel[i]);
        const b=puzzleStars.value.find(s=>s.id===sel[i+1]);
        if(a&&b) lines.push({x1:a.x,y1:a.y,x2:b.x,y2:b.y});
      }
      return lines;
    });
    // Correct order: Sirius (brightest) → Betelgeuse (reddest) → Procyon (coldest/bluest)
    const correctConstellation = ['sirius','betelgeuse','procyon'];

    function clickStar(star){
      if(selectedStars.value.includes(star.id)){
        selectedStars.value=selectedStars.value.filter(s=>s!==star.id);
      } else if(selectedStars.value.length<3){
        selectedStars.value.push(star.id);
      }
    }
    function checkConstellation(){
      const sel=selectedStars.value;
      if(sel.length<3){setFb('Välj 3 stjärnor','err');return;}
      const ok=sel[0]===correctConstellation[0]&&sel[1]===correctConstellation[1]&&sel[2]===correctConstellation[2];
      if(ok){
        setFb('✦ VINTERTRIANGELNS RUNA AKTIVERAD ✦','ok',2000);
        setTimeout(()=>completePuzzle('constellation'),1200);
      } else {
        setFb('Fel ordning — läs ledtråden igen','err');
        selectedStars.value=[];
      }
    }

    // ─── PUZZLE 2: RUNE SEQUENCE ───
    const runes = ref([
      {id:'fire', symbol:'🜂', name:'ELD'},
      {id:'wind', symbol:'🜁', name:'VIND'},
      {id:'water',symbol:'🜄', name:'VATTEN'},
      {id:'ice',  symbol:'❄',  name:'IS'},
    ]);
    const runeOrder = ref([null,null,null,null]);
    const runeCorrect = ref(false);
    // Eld→Vind→Vatten→Is
    const correctRunes = ['🜂','🜁','🜄','❄'];

    function selectRune(rune){
      if(runeOrder.value.includes(rune.symbol)) return;
      const idx=runeOrder.value.indexOf(null);
      if(idx!==-1) runeOrder.value[idx]=rune.symbol;
    }
    function checkRunes(){
      const ok=correctRunes.every((r,i)=>runeOrder.value[i]===r);
      if(ok){
        runeCorrect.value=true;
        setFb('✦ RUNORNAS KEDJA ÄR BRUTEN ✦','ok',2000);
        setTimeout(()=>completePuzzle('rune'),1200);
      } else {
        setFb('Runorna svarar inte — försök igen','err');
        runeOrder.value=[null,null,null,null];
        runeCorrect.value=false;
      }
    }

    // ─── PUZZLE 3: TELESCOPE ───
    const telAz = ref(0);  // target: 0
    const telEl = ref(0);  // target: 23
    const aimX = computed(()=> 50 + (telAz.value/180)*40);
    const aimY = computed(()=> 50 - (telEl.value/90)*40);
    const telMiniStars = ref(Array.from({length:30},(_,i)=>({id:i,x:Math.random()*100,y:Math.random()*100,op:Math.random()*0.7+0.1})));

    function adjustTel(axis, delta){
      if(axis==='az') telAz.value=Math.max(-90,Math.min(90,telAz.value+delta));
      else telEl.value=Math.max(0,Math.min(90,telEl.value+delta));
    }
    function checkTelescope(){
      // Polaris at az=0, el=23 (±5 tolerance)
      const azOk=Math.abs(telAz.value)<=5;
      const elOk=Math.abs(telEl.value-23)<=5;
      if(azOk&&elOk){
        setFb('✦ POLARIS LÅST — TELESKOPET AKTIVT ✦','ok',2000);
        setTimeout(()=>completePuzzle('telescope'),1200);
      } else {
        let hint='';
        if(!azOk) hint+=(telAz.value>0?'Vrid vänster. ':'Vrid höger. ');
        if(!elOk) hint+=(telEl.value>23?'Sänk siktet. ':'Höj siktet. ');
        setFb(hint.trim(),'err');
      }
    }

    // ─── PUZZLE 4: ORRERY ───
    const orreryPlanets = ref([
      {id:'a',name:'IS',    radius:50,  size:10, angle:270, color:'#a0d4ff', colorGlow:'rgba(160,212,255,0.6)'},
      {id:'b',name:'ELD',   radius:80,  size:12, angle:180, color:'#ff7040', colorGlow:'rgba(255,112,64,0.6)'},
      {id:'c',name:'VATTEN',radius:110, size:8,  angle:90,  color:'#40a0ff', colorGlow:'rgba(64,160,255,0.6)'},
    ]);
    // Target: all at angle=270 (conjunction downward line)
    const alignmentPct = computed(()=>{
      const angles = orreryPlanets.value.map(p=>((p.angle%360)+360)%360);
      const target=270;
      const diffs=angles.map(a=>{
        const d=Math.abs(a-target);
        return Math.min(d,360-d);
      });
      const maxDiff=30;
      const pct=diffs.map(d=>Math.max(0,1-d/maxDiff));
      return (pct.reduce((a,b)=>a+b,0)/pct.length)*100;
    });
    function rotatePlanet(id,delta){
      const p=orreryPlanets.value.find(p=>p.id===id);
      if(p) p.angle=(p.angle+delta+360)%360;
    }
    function checkOrrery(){
      if(alignmentPct.value>=90){
        setFb('✦ KONJUNKTIONEN ÄR UPPNÅDD ✦','ok',2000);
        setTimeout(()=>completePuzzle('orrery'),1200);
      } else {
        setFb('Planeterna är inte i linje ännu','err');
      }
    }

    // ─── COMPLETE PUZZLE ───
    const solved = reactive({constellation:false, rune:false, telescope:false, orrery:false});
    const puzzleOrder = ['constellation','rune','telescope','orrery'];

    function completePuzzle(name){
      if(solved[name]) return;
      solved[name]=true;
      solvedCount.value++;
      modal.value=null;

      const messages={
        constellation:{title:'STJÄRNBILDEN AKTIVERAD',text:'Norrskenet svarar — en lila puls sveper genom himlen. Observatoriets kupol börjar röra sig.'},
        rune:{title:'RUNORNAS KRAFT FRIGÖRD',text:'De urgamla symbolerna lyser upp i grön eld. En nyckelton klingar i natten. Du är på rätt väg.'},
        telescope:{title:'POLARIS LÅST',text:'Ljusstrålen från teleskopet skär igenom mörkret och träffar kupolen. Något klickar till inuti byggnaden.'},
        orrery:{title:'PORTEN ÖPPNAS',text:'En guldgul glöd tänds kring observatoriets dörr. Planeternas dans är fullbordad. Gå nu.'},
      };
      const m=messages[name];
      setTimeout(()=>{
        showNarrative(m.title, m.text, solvedCount.value===4 ? 'ÖPPNA PORTEN' : 'FORTSÄTT',
          ()=>{ if(solvedCount.value===4) setTimeout(()=>phase.value='win',600); }
        );
      },400);
    }

    // ─── OBSERVATORY CLICK ───
    function clickObservatory(){
      if(phase.value!=='game') return;
      // Open next unsolved puzzle
      const next=puzzleOrder.find(p=>!solved[p]);
      if(!next){phase.value='win';return;}
      // Reset feedback
      fb.msg='';fb.type='';
      modal.value=next;
    }

    // ─── RESET ───
    function resetGame(){
      phase.value='intro';
      solvedCount.value=0;
      Object.keys(solved).forEach(k=>solved[k]=false);
      modal.value=null;
      selectedStars.value=[];
      runeOrder.value=[null,null,null,null];
      runeCorrect.value=false;
      telAz.value=0; telEl.value=0;
      orreryPlanets.value.forEach(p=>{
        p.angle={a:270,b:180,c:90}[p.id];
      });
      narrative.visible=false;
      setTimeout(startIntro,300);
    }

    // ─── INTRO SEQUENCE ───
    function startIntro(){
      phase.value='intro';
      setTimeout(()=>{
        phase.value='game';
        setTimeout(()=>{
          showNarrative(
            'DU VAKNAR I SNÖN',
            'Kylan biter. Ovan dig dansar norrskenet i färger du aldrig sett. Symboler formar sig i ljuset — nej, det är stjärnbilder. Långt bort skymtar ett gammalt observatorium. Något ropar dig dit.',
            'BÖRJA UTFORSKA',
            ()=>{}
          );
        },600);
      },200);
    }

    function handleStjarnvaktarenResize() {
      const c = starCanvas.value;
      if (c) {
        c.width = window.innerWidth;
        c.height = window.innerHeight;
      }
    }

    onMounted(() => {
      initCanvas();
      window.addEventListener('resize', handleStjarnvaktarenResize);
      startIntro();
    });

    onUnmounted(() => {
      if (animFrame) cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', handleStjarnvaktarenResize);
    });
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Share+Tech+Mono&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
.stjarnvaktaren-app{
  --aurora1:#00ffd4;--aurora2:#7a00ff;--aurora3:#ff006e;--aurora4:#00aaff;
  --snow:#e8f0f8;--deep:#03050f;--mid:#07091a;
  --star:#fffde8;--gold:#d4a840;--rune:#a0c8ff;
  --obs:#1a1f35;
  --text:#c8d8f0;--dim:rgba(200,216,240,0.45);
}
.stjarnvaktaren-app{width:100vw;height:100vh;position:relative;overflow:hidden;font-family:'Crimson Text',serif;cursor:default;}

/* ── STAR CANVAS ── */
.star-canvas{position:absolute;inset:0;z-index:0;}

/* ── AURORA ── */
.aurora-layer{position:absolute;inset:0;z-index:1;pointer-events:none;overflow:hidden;}
.aurora-band{
  position:absolute;left:-20%;width:140%;height:35%;
  border-radius:50% 50% 0 0/80% 80% 0 0;
  filter:blur(40px);mix-blend-mode:screen;
  animation:aurora-wave linear infinite;
  transform-origin:center bottom;
}
.ab1{top:2%;background:linear-gradient(180deg,rgba(0,255,212,0.18) 0%,transparent 100%);animation-duration:18s;}
.ab2{top:5%;background:linear-gradient(180deg,rgba(122,0,255,0.12) 0%,transparent 100%);animation-duration:24s;animation-delay:-6s;}
.ab3{top:8%;background:linear-gradient(180deg,rgba(0,170,255,0.14) 0%,transparent 100%);animation-duration:20s;animation-delay:-10s;}
@keyframes aurora-wave{
  0%{transform:scaleX(1) skewX(0deg) translateY(0);}
  25%{transform:scaleX(1.05) skewX(-3deg) translateY(-8px);}
  50%{transform:scaleX(0.97) skewX(4deg) translateY(4px);}
  75%{transform:scaleX(1.03) skewX(-2deg) translateY(-4px);}
  100%{transform:scaleX(1) skewX(0deg) translateY(0);}
}
.aurora-solved .ab1{background:linear-gradient(180deg,rgba(0,255,100,0.35) 0%,transparent 100%);}
.aurora-solved .ab2{background:linear-gradient(180deg,rgba(255,200,0,0.25) 0%,transparent 100%);}
.aurora-solved .ab3{background:linear-gradient(180deg,rgba(0,255,200,0.3) 0%,transparent 100%);}

/* ── SNOW GROUND ── */
.snow-ground{
  position:absolute;bottom:0;left:0;right:0;z-index:5;
  height:22%;
  background:linear-gradient(180deg,transparent 0%,rgba(200,220,240,0.06) 20%,rgba(180,200,230,0.12) 60%,rgba(160,190,220,0.2) 100%);
}
.snow-surface{
  position:absolute;top:0;left:0;right:0;height:4px;
  background:linear-gradient(90deg,transparent,rgba(220,235,255,0.5),rgba(200,220,255,0.7),rgba(220,235,255,0.5),transparent);
  box-shadow:0 0 20px rgba(180,210,255,0.3);
}

/* ── OBSERVATORY 3D ── */
.observatory{
  position:absolute;bottom:18%;left:50%;transform:translateX(-50%);
  z-index:10;
  transform-style:preserve-3d;
  perspective:600px;
  cursor:pointer;
  transition:filter .5s;
}
.observatory:hover{filter:brightness(1.3);}
.obs-svg{width:220px;height:260px;overflow:visible;}

/* ── SCENE OVERLAY (foreground trees silhouettes) ── */
.trees{position:absolute;bottom:17%;left:0;right:0;z-index:8;pointer-events:none;}

/* ── HUD ── */
.hud{
  position:fixed;top:0;left:0;right:0;z-index:200;
  padding:16px 24px;
  display:flex;justify-content:space-between;align-items:center;
  background:linear-gradient(180deg,rgba(3,5,15,0.85) 0%,transparent 100%);
  pointer-events:none;
}
.hud-title{font-family:'Cinzel',serif;font-size:18px;letter-spacing:6px;color:var(--gold);text-shadow:0 0 20px rgba(212,168,64,0.5);}
.hud-chapter{font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:3px;color:var(--dim);}
.progress-dots{display:flex;gap:8px;pointer-events:none;}
.pdot{width:8px;height:8px;border-radius:50%;border:1px solid rgba(200,216,240,0.3);transition:all .5s;}
.pdot.done{background:var(--aurora1);border-color:var(--aurora1);box-shadow:0 0 10px var(--aurora1);}
.pdot.active{border-color:var(--gold);box-shadow:0 0 8px var(--gold);}

/* ── NARRATIVE BOX ── */
.narrative{
  position:fixed;bottom:28%;left:50%;transform:translateX(-50%);
  z-index:200;
  max-width:500px;width:90vw;
  background:rgba(3,5,15,0.88);
  border:1px solid rgba(200,216,240,0.1);
  border-radius:26px;
  padding:22px 28px;
  font-size:15px;color:var(--text);line-height:1.8;
  letter-spacing:0.5px;
  font-style:italic;
  animation:fade-up .6s both;
  backdrop-filter:blur(6px);
  box-shadow:0 24px 70px rgba(0,0,0,0.72), inset 0 0 26px rgba(160,200,255,0.035);
}
.narrative-title{font-family:'Cinzel',serif;font-style:normal;font-size:13px;letter-spacing:4px;color:var(--gold);margin-bottom:8px;font-weight:600;}
.narrative-btn{
  margin-top:14px;padding:8px 24px;background:transparent;
  border:1px solid rgba(200,216,240,0.2);border-radius:1px;
  color:var(--text);font-family:'Cinzel',serif;font-size:13px;letter-spacing:3px;
  cursor:pointer;transition:all .2s;display:block;margin-left:auto;
}
.narrative-btn:hover{border-color:var(--gold);color:var(--gold);box-shadow:0 0 20px rgba(212,168,64,0.2);}
@keyframes fade-up{from{opacity:0;transform:translateX(-50%) translateY(10px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}

/* ── PUZZLE MODAL ── */
.modal-overlay{
  position:fixed;inset:0;z-index:300;
  background:rgba(2,4,12,0.9);backdrop-filter:blur(14px);
  display:flex;align-items:center;justify-content:center;
  animation:fade-in .4s both;
}
@keyframes fade-in{from{opacity:0;}to{opacity:1;}}
.modal{
  background:linear-gradient(145deg,rgba(10,14,30,0.98),rgba(7,9,22,0.98));
  border:1px solid rgba(200,216,240,0.1);
  border-radius:3px;
  width:min(92vw,640px);
  max-height:90vh;overflow-y:auto;
  position:relative;
  box-shadow:0 0 100px rgba(0,0,0,0.9),0 0 40px rgba(0,170,255,0.05);
  animation:modal-in .4s cubic-bezier(.22,1,.36,1);
}
@keyframes modal-in{from{opacity:0;transform:scale(.9) translateY(20px);}to{opacity:1;transform:none;}}
.modal-inner{padding:36px 40px;}
.modal-close{
  position:absolute;top:14px;right:16px;background:none;border:none;
  color:var(--dim);font-size:20px;cursor:pointer;
  font-family:'Share Tech Mono',monospace;opacity:.5;transition:opacity .2s;z-index:10;
}
.modal-close:hover{opacity:1;color:var(--aurora1);}
.modal-eyebrow{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:5px;color:var(--aurora1);margin-bottom:8px;}
.modal-title{font-family:'Cinzel',serif;font-size:28px;letter-spacing:3px;color:var(--snow);margin-bottom:6px;line-height:1.1;}
.modal-lore{font-size:14px;color:var(--dim);line-height:1.8;margin-bottom:24px;font-style:italic;}

/* ── PUZZLE 1: STAR CONNECT ── */
.star-field-puzzle{
  position:relative;width:100%;
  padding-bottom:56%;
  background:radial-gradient(ellipse at 40% 40%,#05091e,#020410);
  border:1px solid rgba(200,216,240,0.06);border-radius:2px;
  margin-bottom:20px;overflow:hidden;
}
.sfp-inner{position:absolute;inset:0;}
.star-dot{
  position:absolute;transform:translate(-50%,-50%);
  cursor:pointer;transition:all .25s;
}
.star-dot .core{
  width:10px;height:10px;border-radius:50%;
  background:var(--star);
  box-shadow:0 0 8px var(--star),0 0 16px rgba(255,253,232,0.4);
  transition:all .25s;
}
.star-dot:hover .core,.star-dot.selected .core{
  width:14px;height:14px;
  box-shadow:0 0 14px var(--aurora1),0 0 30px rgba(0,255,212,0.5);
  background:var(--aurora1);
}
.star-dot .star-name{
  position:absolute;top:16px;left:50%;transform:translateX(-50%);
  font-family:'Share Tech Mono',monospace;font-size:9px;color:rgba(200,216,240,0.5);
  white-space:nowrap;letter-spacing:1px;
}
.star-line{position:absolute;pointer-events:none;top:0;left:0;width:100%;height:100%;}
.constellation-hint{
  position:absolute;bottom:8px;left:50%;transform:translateX(-50%);
  font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:2px;
  color:rgba(200,216,240,0.3);
}
.constellation-help{
  margin:-6px 0 14px;
  padding:10px 12px;
  border:1px solid rgba(0,255,212,0.14);
  border-radius:14px;
  background:rgba(0,255,212,0.045);
  color:var(--dim);
  font-family:'Share Tech Mono',monospace;
  font-size:10px;
  letter-spacing:1px;
  line-height:1.7;
  text-align:center;
}
.constellation-help strong{
  color:var(--aurora1);
  font-weight:400;
}


/* ── PUZZLE 2: MIRROR/RUNE SEQUENCE ── */
.rune-grid{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:20px;}
.rune-tile{
  width:64px;height:64px;
  background:rgba(10,14,30,0.8);
  border:1px solid rgba(160,200,255,0.15);
  border-radius:3px;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  transition:all .2s;
  font-size:28px;position:relative;
  color:rgba(160,200,255,0.4);
}
.rune-tile:hover{border-color:rgba(160,200,255,0.5);color:rgba(160,200,255,0.9);background:rgba(160,200,255,0.05);}
.rune-tile.selected{
  border-color:var(--aurora1);color:var(--aurora1);
  background:rgba(0,255,212,0.06);
  box-shadow:0 0 20px rgba(0,255,212,0.15);
}
.rune-tile.correct{border-color:#4caf50;color:#4caf50;box-shadow:0 0 15px rgba(76,175,80,0.2);}
.rune-tile.wrong{border-color:var(--aurora3);animation:shake .3s;}
@keyframes shake{0%,100%{transform:translateX(0);}25%{transform:translateX(-5px);}75%{transform:translateX(5px);}}
.rune-order-display{
  display:flex;gap:8px;justify-content:center;margin-bottom:16px;
}
.rod{
  width:36px;height:36px;border-radius:50%;
  border:1px solid rgba(200,216,240,0.15);
  display:flex;align-items:center;justify-content:center;
  font-size:16px;transition:all .3s;color:rgba(200,216,240,0.3);
}
.rod.filled{border-color:var(--aurora1);color:var(--aurora1);box-shadow:0 0 12px rgba(0,255,212,0.3);}

/* ── PUZZLE 3: TELESCOPE DIAL ── */
.telescope-wrap{display:flex;flex-direction:column;align-items:center;gap:20px;margin-bottom:20px;}
.telescope-view{
  width:220px;height:220px;border-radius:50%;
  background:radial-gradient(ellipse at center,#050918,#020410);
  border:3px solid rgba(200,216,240,0.12);
  position:relative;overflow:hidden;
  box-shadow:0 0 40px rgba(0,0,0,0.8),inset 0 0 30px rgba(0,0,0,0.5);
}
.tel-crosshair{
  position:absolute;inset:0;pointer-events:none;
}
.tel-crosshair::before,.tel-crosshair::after{
  content:'';position:absolute;background:rgba(200,216,240,0.12);
}
.tel-crosshair::before{top:50%;left:0;right:0;height:1px;transform:translateY(-50%);}
.tel-crosshair::after{left:50%;top:0;bottom:0;width:1px;transform:translateX(-50%);}
.tel-circle{
  position:absolute;top:50%;left:50%;
  border:1px solid rgba(200,216,240,0.08);border-radius:50%;
  transform:translate(-50%,-50%);
}
.tel-target-star{
  position:absolute;transform:translate(-50%,-50%);
  width:14px;height:14px;transition:all 1.2s ease;
}
.tel-target-star .glow{
  width:100%;height:100%;border-radius:50%;
  background:radial-gradient(circle,#fff 20%,var(--aurora1) 60%,transparent 100%);
  animation:star-twinkle 2s ease-in-out infinite;
}
@keyframes star-twinkle{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.6;transform:scale(.8);}}
.tel-star-mini{
  position:absolute;width:3px;height:3px;border-radius:50%;
  background:rgba(255,253,232,0.6);transform:translate(-50%,-50%);
}
.dial-row{display:flex;gap:12px;align-items:center;justify-content:center;}
.dial-btn{
  width:44px;height:44px;border-radius:50%;
  background:rgba(10,14,30,0.8);
  border:1px solid rgba(200,216,240,0.15);
  color:var(--text);font-size:18px;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  transition:all .15s;
}
.dial-btn:hover{background:rgba(0,255,212,0.08);border-color:var(--aurora1);color:var(--aurora1);}
.dial-btn:active{transform:scale(.93);}
.dial-label{font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--dim);letter-spacing:2px;text-align:center;}
.angle-display{
  font-family:'Share Tech Mono',monospace;font-size:24px;color:var(--aurora1);
  letter-spacing:4px;text-shadow:0 0 15px rgba(0,255,212,0.5);
}

/* ── PUZZLE 4: ORRERY / PLANET RINGS ── */
.orrery-wrap{
  display:flex;flex-direction:column;align-items:center;gap:20px;margin-bottom:20px;
}
.orrery{
  width:280px;height:280px;position:relative;
  border-radius:50%;
  background:radial-gradient(ellipse at center,#050918,#020410);
  border:1px solid rgba(200,216,240,0.06);
}
.orbit-ring{
  position:absolute;top:50%;left:50%;
  border:1px solid rgba(200,216,240,0.08);border-radius:50%;
  transform:translate(-50%,-50%);
  transition:transform .5s ease;
}
.planet{
  position:absolute;top:50%;left:50%;
  border-radius:50%;transform-origin:0 0;
  cursor:pointer;transition:all .2s;
}
.planet:hover{filter:brightness(1.4);}
.sun-core{
  position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  width:18px;height:18px;border-radius:50%;
  background:radial-gradient(circle,#fff8c0,#d4a840);
  box-shadow:0 0 20px rgba(212,168,64,0.8),0 0 40px rgba(212,168,64,0.3);
}
.orrery-controls{display:flex;gap:10px;align-items:center;}
.orr-btn{
  padding:8px 18px;background:rgba(10,14,30,0.8);
  border:1px solid rgba(200,216,240,0.15);border-radius:2px;
  color:var(--text);font-family:'Share Tech Mono',monospace;font-size:11px;
  letter-spacing:2px;cursor:pointer;transition:all .2s;
}
.orr-btn:hover{border-color:var(--gold);color:var(--gold);}
.orr-btn.active{border-color:var(--aurora1);color:var(--aurora1);box-shadow:0 0 10px rgba(0,255,212,0.2);}
.alignment-bar{
  width:200px;height:6px;background:rgba(255,255,255,0.05);border-radius:3px;overflow:hidden;
  border:1px solid rgba(200,216,240,0.08);
}
.alignment-fill{height:100%;border-radius:3px;transition:width .5s,background .5s;}

/* ── FINAL: RUNE INSCRIPTION ── */
.inscription-wrap{display:flex;flex-direction:column;align-items:center;gap:20px;margin-bottom:20px;}
.ancient-text{
  width:100%;padding:20px;text-align:center;
  background:rgba(0,0,0,0.3);border:1px solid rgba(160,200,255,0.1);border-radius:2px;
  font-family:'Cinzel',serif;font-size:22px;letter-spacing:12px;
  color:rgba(160,200,255,0.4);line-height:2;
}
.ancient-text .revealed{color:var(--aurora1);text-shadow:0 0 15px rgba(0,255,212,0.5);}
.answer-input{
  width:100%;padding:14px 20px;background:#000;
  border:1px solid rgba(0,255,212,0.2);border-radius:2px;
  color:var(--aurora1);font-family:'Share Tech Mono',monospace;font-size:18px;
  letter-spacing:6px;text-align:center;outline:none;
  text-shadow:0 0 10px rgba(0,255,212,0.4);
}
.answer-input::placeholder{color:rgba(0,255,212,0.15);}

/* ── COMMON PUZZLE UI ── */
.puzzle-btn{
  width:100%;padding:14px;background:transparent;
  border:1px solid rgba(200,216,240,0.2);border-radius:2px;
  color:var(--text);font-family:'Cinzel',serif;font-size:16px;letter-spacing:4px;
  cursor:pointer;transition:all .2s;
}
.puzzle-btn:hover{border-color:var(--aurora1);color:var(--aurora1);box-shadow:0 0 20px rgba(0,255,212,0.1);}
.puzzle-btn:disabled{opacity:.3;cursor:default;}
.feedback{
  font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:3px;
  text-align:center;margin-top:10px;min-height:18px;transition:all .3s;
}
.feedback.ok{color:#4caf50;text-shadow:0 0 10px rgba(76,175,80,0.5);}
.feedback.err{color:var(--aurora3);text-shadow:0 0 10px rgba(255,0,110,0.5);}

/* ── WIN SCREEN ── */
.win-screen{
  position:fixed;inset:0;z-index:500;
  background:radial-gradient(ellipse at 50% 30%,rgba(0,40,30,.97),rgba(2,4,12,.99));
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;
  animation:fade-in .8s both;
}
.win-title{
  font-family:'Cinzel',serif;font-size:clamp(40px,8vw,80px);letter-spacing:8px;
  color:var(--aurora1);text-shadow:0 0 40px var(--aurora1),0 0 100px rgba(0,255,212,0.3);
  animation:pulse-glow 3s ease-in-out infinite;text-align:center;
}
@keyframes pulse-glow{0%,100%{text-shadow:0 0 40px var(--aurora1),0 0 100px rgba(0,255,212,0.3);}50%{text-shadow:0 0 60px var(--aurora1),0 0 150px rgba(0,255,212,0.5);}}
.win-sub{font-size:15px;color:var(--dim);letter-spacing:3px;text-align:center;font-style:italic;max-width:400px;line-height:1.8;}
.win-stars{font-size:50px;letter-spacing:12px;animation:pulse-glow 3s ease-in-out infinite;}
.win-btn{
  padding:14px 50px;background:transparent;
  border:1px solid var(--aurora1);border-radius:2px;
  color:var(--aurora1);font-family:'Cinzel',serif;font-size:18px;letter-spacing:5px;
  cursor:pointer;box-shadow:0 0 30px rgba(0,255,212,0.15);
  transition:all .2s;
}
.win-btn:hover{background:rgba(0,255,212,0.08);box-shadow:0 0 50px rgba(0,255,212,0.3);}

/* ── TOOLTIP ── */
.obj-label{
  position:fixed;z-index:250;
  font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:3px;
  color:var(--aurora1);text-shadow:0 0 8px var(--aurora1);
  pointer-events:none;transform:translate(-50%,-100%) translateY(-10px);
  animation:fade-up .3s both;
}
</style>
