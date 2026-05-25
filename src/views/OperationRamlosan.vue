<template>
  <div id="rl-app" class="rl-root" :class="{ 'rl-alarm-active': alarmActive }">
    <canvas ref="bgCanvas" class="rl-bg-canvas"></canvas>
    <div class="rl-noise-overlay"></div>

    <!-- JUMPSCARE -->
    <transition name="rl-scare">
      <div v-if="jumpscare.active" class="rl-jumpscare">
        <div class="rl-scare-title">{{ jumpscare.title }}</div>
        <div class="rl-scare-sub">{{ jumpscare.sub }}</div>
        <div class="rl-scare-bar"><div :style="{ width: jumpscare.progress + '%' }"></div></div>
      </div>
    </transition>

    <!-- INTRO -->
    <transition name="rl-scene-fade">
      <div v-if="scene === 'intro'" class="rl-scene rl-intro-scene">
        <div class="rl-intro-grid-lines"></div>
        <div class="rl-brand-watermark">RAMLÖSAN</div>
        <div class="rl-intro-inner">
          <div class="rl-mission-header">
            <div class="rl-mission-line"></div>
            <span class="rl-mission-tag">KLASSIFICERAT UPPDRAG</span>
            <div class="rl-mission-line"></div>
          </div>
          <h1 class="rl-intro-title">OPERATION<br><em>RAMLÖSAN</em></h1>
          <div class="rl-intro-brief">
            <p>Svenska bubbelvatten-tillverkaren är under attack. En rival har infiltrerat produktionsanläggningen i Ramlösa.</p>
            <p>Du är vår enda agent. Genomsök anläggningen. Hitta koden. Rädda bubblorna.</p>
          </div>
          <div class="rl-mission-stats">
            <div class="rl-stat-item">
              <div class="rl-stat-val">3</div>
              <div class="rl-stat-label">MAX FEL</div>
            </div>
            <div class="rl-stat-item">
              <div class="rl-stat-val">4</div>
              <div class="rl-stat-label">STATIONER</div>
            </div>
            <div class="rl-stat-item">
              <div class="rl-stat-val">---</div>
              <div class="rl-stat-label">AGENT</div>
            </div>
          </div>
          <button class="rl-btn-mission" @click="goScene('facility')">
            <span class="rl-btn-text">PÅBÖRJA UPPDRAGET</span>
            <div class="rl-btn-scan"></div>
          </button>
        </div>
        <div class="rl-intro-bottle">
          <div class="rl-bottle-3d">
            <div class="rl-bottle-body">
              <div class="rl-bottle-label">
                <div class="rl-label-r">R</div>
                <div class="rl-label-waves">
                  <span v-for="n in 5" :key="n"></span>
                </div>
              </div>
              <div class="rl-bottle-bubbles">
                <div class="rl-bubble" v-for="n in 12" :key="n" :style="bubbleStyle(n)"></div>
              </div>
              <div class="rl-bottle-sheen"></div>
            </div>
            <div class="rl-bottle-cap"></div>
            <div class="rl-bottle-neck"></div>
            <div class="rl-bottle-bottom"></div>
          </div>
        </div>
      </div>
    </transition>

    <!-- FACILITY (main hub) -->
    <transition name="rl-scene-fade">
      <div v-if="scene === 'facility'" class="rl-scene rl-facility-scene">
        <div class="rl-facility-perspective">
          <!-- Ceiling grid -->
          <div class="rl-ceiling-grid"></div>
          <!-- Floor grid -->
          <div class="rl-floor-grid"></div>
          <!-- Walls -->
          <div class="rl-wall rl-wall-back"></div>
          <div class="rl-wall rl-wall-left"></div>
          <div class="rl-wall rl-wall-right"></div>

          <!-- Atmospheric pipes -->
          <div class="rl-pipe rl-pipe-h rl-top-pipe"></div>
          <div class="rl-pipe rl-pipe-h rl-mid-pipe"></div>
          <div class="rl-pipe-joint rl-j1"></div>
          <div class="rl-pipe-joint rl-j2"></div>
          <div class="rl-pipe rl-pipe-v rl-left-v-pipe"></div>
          <div class="rl-pipe rl-pipe-v rl-right-v-pipe"></div>

          <!-- Warning strips -->
          <div class="rl-warn-strip rl-top-strip"></div>
          <div class="rl-warn-strip rl-bottom-strip"></div>

          <!-- STATION 1: Archive terminal -->
          <div class="rl-station rl-station-archive" :class="{ solved: solvedStations.archive, active: hoveredStation === 'archive' }"
            @mouseenter="hoveredStation = 'archive'" @mouseleave="hoveredStation = null"
            @click="goScene('archive')">
            <div class="rl-station-3d">
              <div class="rl-station-face">
                <div class="rl-terminal-screen">
                  <div class="rl-term-scanline"></div>
                  <div class="rl-term-text">ARKIV<br>{{ solvedStations.archive ? 'KLAR' : '???' }}</div>
                </div>
                <div class="rl-terminal-keyboard"></div>
              </div>
              <div class="rl-station-side"></div>
              <div class="rl-station-top"></div>
            </div>
            <div class="rl-station-glow" :class="{ solved: solvedStations.archive }"></div>
            <div class="rl-station-label">ARKIVTERMINAL</div>
            <div class="rl-solved-badge" v-if="solvedStations.archive">KLAR</div>
          </div>

          <!-- STATION 2: Water pipe -->
          <div class="rl-station rl-station-pipe-ctrl" :class="{ solved: solvedStations.pipes, active: hoveredStation === 'pipes', locked: !solvedStations.archive }"
            @mouseenter="hoveredStation = 'pipes'" @mouseleave="hoveredStation = null"
            @click="solvedStations.archive ? goScene('pipes') : showLocked('Kräver: ARKIV')">
            <div class="rl-station-3d rl-pipe-ctrl-3d">
              <div class="rl-pipe-ctrl-face">
                <div class="rl-pressure-gauge">
                  <div class="rl-gauge-needle" :style="{ transform: `rotate(${solvedStations.pipes ? 45 : -90}deg)` }"></div>
                </div>
                <div class="rl-pipe-ctrl-valves">
                  <div class="rl-valve" v-for="n in 3" :key="n" :class="{ open: solvedStations.pipes }"></div>
                </div>
              </div>
              <div class="rl-station-side"></div>
              <div class="rl-station-top"></div>
            </div>
            <div class="rl-station-glow" :class="{ solved: solvedStations.pipes, locked: !solvedStations.archive }"></div>
            <div class="rl-station-label">RÖRSYSTEM</div>
            <div class="rl-solved-badge" v-if="solvedStations.pipes">KLAR</div>
            <div class="rl-lock-badge" v-if="!solvedStations.archive">LÅS</div>
          </div>

          <!-- STATION 3: Chemistry lab -->
          <div class="rl-station rl-station-lab" :class="{ solved: solvedStations.lab, active: hoveredStation === 'lab', locked: !solvedStations.pipes }"
            @mouseenter="hoveredStation = 'lab'" @mouseleave="hoveredStation = null"
            @click="solvedStations.pipes ? goScene('lab') : showLocked('Kräver: RÖREN')">
            <div class="rl-station-3d rl-lab-3d">
              <div class="rl-lab-face">
                <div class="rl-flask" v-for="n in 3" :key="n" :class="['rl-flask-' + n]">
                  <div class="rl-flask-liquid" :style="{ background: ['#00c4ff','#00ff9a','#ff4466'][n-1] }"></div>
                </div>
              </div>
              <div class="rl-station-side"></div>
              <div class="rl-station-top"></div>
            </div>
            <div class="rl-station-glow" :class="{ solved: solvedStations.lab, locked: !solvedStations.pipes }"></div>
            <div class="rl-station-label">LABB</div>
            <div class="rl-solved-badge" v-if="solvedStations.lab">KLAR</div>
            <div class="rl-lock-badge" v-if="!solvedStations.pipes">LÅS</div>
          </div>

          <!-- STATION 4: Final vault -->
          <div class="rl-station rl-station-vault" :class="{ solved: solvedStations.vault, active: hoveredStation === 'vault', locked: !solvedStations.lab }"
            @mouseenter="hoveredStation = 'vault'" @mouseleave="hoveredStation = null"
            @click="solvedStations.lab ? goScene('vault') : showLocked('Kräver: LABBET')">
            <div class="rl-station-3d rl-vault-3d">
              <div class="rl-vault-face">
                <div class="rl-vault-door-ring rl-outer"></div>
                <div class="rl-vault-door-ring rl-inner"></div>
                <div class="rl-vault-spokes">
                  <div class="rl-spoke" v-for="n in 8" :key="n" :style="{ transform: `rotate(${n*45}deg)` }"></div>
                </div>
                <div class="rl-vault-center" :class="{ unlocked: solvedStations.vault }"></div>
              </div>
              <div class="rl-station-side"></div>
            </div>
            <div class="rl-station-glow" :class="{ solved: solvedStations.vault, locked: !solvedStations.lab }"></div>
            <div class="rl-station-label">VALVET</div>
            <div class="rl-solved-badge" v-if="solvedStations.vault">KLAR</div>
            <div class="rl-lock-badge" v-if="!solvedStations.lab">LÅS</div>
          </div>

          <!-- Floating water particles -->
          <div class="rl-water-particle" v-for="n in 20" :key="n" :style="particleStyle(n)"></div>
        </div>

        <!-- HUD -->
        <div class="rl-facility-hud">
          <div class="rl-hud-left">
            <div class="rl-agent-id">AGENT <span>7X-HELSA</span></div>
          </div>
          <div class="rl-hud-center">
            <div class="rl-progress-nodes">
              <div class="rl-pnode" :class="{ done: solvedStations.archive }">
                <div class="rl-pnode-dot"></div>
                <span>ARKIV</span>
              </div>
              <div class="rl-pnode-line" :class="{ active: solvedStations.archive }"></div>
              <div class="rl-pnode" :class="{ done: solvedStations.pipes }">
                <div class="rl-pnode-dot"></div>
                <span>RÖR</span>
              </div>
              <div class="rl-pnode-line" :class="{ active: solvedStations.pipes }"></div>
              <div class="rl-pnode" :class="{ done: solvedStations.lab }">
                <div class="rl-pnode-dot"></div>
                <span>LABB</span>
              </div>
              <div class="rl-pnode-line" :class="{ active: solvedStations.lab }"></div>
              <div class="rl-pnode" :class="{ done: solvedStations.vault }">
                <div class="rl-pnode-dot"></div>
                <span>VALV</span>
              </div>
            </div>
          </div>
          <div class="rl-hud-right">
            <div class="rl-mistake-display">
              <span class="rl-mistake-label">FEL</span>
              <div class="rl-mistake-dots">
                <div class="rl-mdot" :class="{ used: mistakes >= 1 }"></div>
                <div class="rl-mdot" :class="{ used: mistakes >= 2 }"></div>
                <div class="rl-mdot" :class="{ used: mistakes >= 3 }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Locked toast -->
        <transition name="rl-toast-rise">
          <div v-if="lockedMsg" class="rl-locked-toast">{{ lockedMsg }}</div>
        </transition>
      </div>
    </transition>

    <!-- ARCHIVE SCENE -->
    <transition name="rl-scene-fade">
      <div v-if="scene === 'archive'" class="rl-scene rl-puzzle-scene rl-archive-puzzle">
        <div class="rl-puzzle-room">
          <div class="rl-room-ceiling"></div>
          <div class="rl-room-floor"></div>
          <div class="rl-room-wall-back"></div>

          <!-- Big terminal -->
          <div class="rl-big-terminal">
            <div class="rl-terminal-bezel">
              <div class="rl-terminal-main-screen">
                <div class="rl-screen-header">
                  <span class="rl-sh-tag">RAMLÖSAN AB</span>
                  <span class="rl-sh-tag">ARKIV v4.2</span>
                  <span class="rl-sh-tag rl-blink">ÅTKOMST BEGRÄNSAD</span>
                </div>
                <div class="rl-screen-body">
                  <div class="rl-file-list">
                    <div class="rl-file-item" v-for="f in archiveFiles" :key="f.id"
                      :class="{ selected: selectedFile === f.id }"
                      @click="selectedFile = f.id">
                      <span class="rl-file-icon">&#9632;</span>
                      <span class="rl-file-name">{{ f.name }}</span>
                      <span class="rl-file-size">{{ f.size }}</span>
                    </div>
                  </div>
                  <div class="rl-file-preview" v-if="selectedFile">
                    <div class="rl-preview-content" v-html="archiveFiles.find(f=>f.id===selectedFile)?.content"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Input panel -->
          <div class="rl-input-panel">
            <div class="rl-panel-label">ARKIV-AUTENTISERING</div>
            <div class="rl-panel-hint">Källkoden döljer sig i filerna. Hitta den dolda sekvensen.</div>
            <div class="rl-code-input-row">
              <div class="rl-digit-input" v-for="(d,i) in archiveInput" :key="i">
                <input type="text" maxlength="1" v-model="archiveInput[i]"
                  @input="onDigitInput('archive', i, $event)"
                  @keydown="onDigitKey('archive', i, $event)"
                  :ref="el => { if(el) archiveRefs[i] = el }"
                  :class="{ filled: d, error: archiveError && d }" />
              </div>
            </div>
            <div class="rl-input-feedback" :class="archiveError ? 'err' : ''">{{ archiveMsg }}</div>
            <button class="rl-btn-submit" @click="checkArchive">VERIFIERA KOD</button>
            <button class="rl-btn-back" @click="goScene('facility')">AVBRYT</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- PIPE SCENE -->
    <transition name="rl-scene-fade">
      <div v-if="scene === 'pipes'" class="rl-scene rl-puzzle-scene rl-pipe-puzzle">
        <div class="rl-puzzle-room">
          <div class="rl-room-ceiling"></div>
          <div class="rl-room-floor"></div>
          <div class="rl-room-wall-back"></div>

          <!-- Pipe system visual -->
          <div class="rl-pipe-system-3d">
            <div class="rl-main-tank">
              <div class="rl-tank-body">
                <div class="rl-tank-water" :style="{ height: tankLevel + '%' }">
                  <div class="rl-tank-surface"></div>
                </div>
                <div class="rl-tank-label">RAMLÖSAN<br>RESERVOAR</div>
                <div class="rl-tank-level-marks">
                  <span v-for="n in [100,75,50,25,0]" :key="n" :style="{ bottom: n + '%' }">{{ n }}</span>
                </div>
              </div>
            </div>
            <div class="rl-pipe-network">
              <div class="rl-pn-pipe rl-horizontal rl-top-h" :class="{ flow: pipeFlow[0] }"></div>
              <div class="rl-pn-pipe rl-vertical rl-right-v" :class="{ flow: pipeFlow[1] }"></div>
              <div class="rl-pn-pipe rl-horizontal rl-bot-h" :class="{ flow: pipeFlow[2] }"></div>
              <div class="rl-pn-pipe rl-vertical rl-left-v" :class="{ flow: pipeFlow[3] }"></div>
              <div class="rl-pn-joint" v-for="n in 4" :key="n" :class="['rl-pnj-'+n, { active: pipeFlow[n-1] }]"></div>
              <!-- Valves -->
              <div class="rl-valve-ctrl" v-for="(v, vi) in pipeValves" :key="vi"
                :class="['rl-v-'+vi, { open: v }]" @click="toggleValve(vi)">
                <div class="rl-valve-body">
                  <div class="rl-valve-handle" :class="{ open: v }"></div>
                </div>
                <div class="rl-valve-label">V{{ vi + 1 }}</div>
              </div>
            </div>
            <div class="rl-output-meter">
              <div class="rl-om-label">UTFLÖDE</div>
              <div class="rl-om-bar">
                <div class="rl-om-fill" :style="{ width: pipeOutput + '%', background: pipeOutput === 100 ? 'var(--c-water)' : pipeOutput > 60 ? 'var(--c-warn)' : 'var(--c-danger)' }"></div>
              </div>
              <div class="rl-om-val">{{ pipeOutput }}%</div>
            </div>
          </div>

          <div class="rl-input-panel">
            <div class="rl-panel-label">RÖRSYSTEM-SYNK</div>
            <div class="rl-panel-hint">Reglera ventilerna så att utflödet når 100%. Rätt konfiguration genererar en accesskod.</div>
            <div class="rl-valve-status">
              <div class="rl-vs-item" v-for="(v, vi) in pipeValves" :key="vi">
                <span class="rl-vs-label">V{{ vi + 1 }}</span>
                <span class="rl-vs-state" :class="{ open: v }">{{ v ? 'ÖPPEN' : 'STÄNGD' }}</span>
              </div>
            </div>
            <div class="rl-input-feedback" :class="pipeMsg.type">{{ pipeMsg.text }}</div>
            <button class="rl-btn-submit" @click="checkPipes">KONFIRMERA KONFIGURATION</button>
            <button class="rl-btn-back" @click="goScene('facility')">AVBRYT</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- LAB SCENE -->
    <transition name="rl-scene-fade">
      <div v-if="scene === 'lab'" class="rl-scene rl-puzzle-scene rl-lab-puzzle">
        <div class="rl-puzzle-room">
          <div class="rl-room-ceiling"></div>
          <div class="rl-room-floor"></div>
          <div class="rl-room-wall-back"></div>

          <!-- Lab bench 3D -->
          <div class="rl-lab-bench-3d">
            <div class="rl-bench-surface">
              <!-- Spectrometer -->
              <div class="rl-spectrometer">
                <div class="rl-spec-screen">
                  <div class="rl-spec-graph">
                    <div class="rl-spec-bar" v-for="(b, bi) in specBars" :key="bi"
                      :style="{ height: b.height + '%', background: b.color, left: (bi * 14 + 4) + '%' }">
                      <div class="rl-spec-bar-label">{{ b.label }}</div>
                    </div>
                    <div class="rl-spec-baseline"></div>
                  </div>
                </div>
                <div class="rl-spec-label">SPEKTROMETER</div>
              </div>
              <!-- Chemical bottles -->
              <div class="rl-chem-rack">
                <div class="rl-chem-bottle" v-for="b in chemBottles" :key="b.id"
                  :class="{ selected: selectedChem === b.id, used: usedChems.includes(b.id) }"
                  @click="selectChem(b)">
                  <div class="rl-chem-body" :style="{ background: b.color }">
                    <div class="rl-chem-liquid" :style="{ background: b.liquid }"></div>
                    <div class="rl-chem-label-wrap">{{ b.code }}</div>
                  </div>
                  <div class="rl-chem-stopper"></div>
                </div>
              </div>
              <!-- Mixing beaker -->
              <div class="rl-mixing-beaker" :class="{ correct: mixResult === 'correct', wrong: mixResult === 'wrong' }">
                <div class="rl-beaker-body">
                  <div class="rl-beaker-liquid" :style="{ height: mixLevel + '%', background: mixColor }">
                    <div class="rl-beaker-surface"></div>
                  </div>
                  <div class="rl-beaker-marks">
                    <span v-for="n in [75,50,25]" :key="n" :style="{ bottom: n + '%' }">{{ n }}</span>
                  </div>
                </div>
                <div class="rl-beaker-spout"></div>
              </div>
            </div>
            <div class="rl-bench-front"></div>
          </div>

          <div class="rl-input-panel">
            <div class="rl-panel-label">KEMISK ANALYS</div>
            <div class="rl-panel-hint">Spektrometert visar en topp vid exakt pH 6.2 — naturlig mineralkälla. Blanda rätt kemikalier i rätt ordning.</div>
            <div class="rl-mix-sequence">
              <div class="rl-seq-slot" v-for="(s, si) in mixSequence" :key="si" :class="{ filled: s }">
                <span v-if="s">{{ chemBottles.find(b=>b.id===s)?.code }}</span>
                <span v-else class="rl-seq-num">{{ si + 1 }}</span>
              </div>
              <button class="rl-seq-clear" @click="clearMix">&#x21BA;</button>
            </div>
            <div class="rl-input-feedback" :class="labMsg.type">{{ labMsg.text }}</div>
            <button class="rl-btn-submit" @click="checkLab">ANALYSERA BLANDNING</button>
            <button class="rl-btn-back" @click="goScene('facility')">AVBRYT</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- VAULT SCENE -->
    <transition name="rl-scene-fade">
      <div v-if="scene === 'vault'" class="rl-scene rl-puzzle-scene rl-vault-puzzle">
        <div class="rl-puzzle-room">
          <div class="rl-room-ceiling"></div>
          <div class="rl-room-floor"></div>
          <div class="rl-room-wall-back"></div>

          <!-- The vault door 3D -->
          <div class="rl-vault-door-3d" :class="{ unlocked: solvedStations.vault, opening: vaultOpening }">
            <div class="rl-vd-frame">
              <div class="rl-vd-door" :class="{ swing: vaultOpening }">
                <div class="rl-vd-ring rl-r1"></div>
                <div class="rl-vd-ring rl-r2"></div>
                <div class="rl-vd-ring rl-r3"></div>
                <div class="rl-vd-spokes-layer">
                  <div class="rl-vd-spoke" v-for="n in 12" :key="n" :style="{ transform: `rotate(${n*30}deg)` }"></div>
                </div>
                <div class="rl-vd-center-disc" :class="{ open: solvedStations.vault }"></div>
                <div class="rl-vd-locking-bars">
                  <div class="rl-vd-bar" v-for="n in 4" :key="n" :class="['rl-bar-'+n, { retracted: vaultOpening }]"></div>
                </div>
              </div>
            </div>
            <!-- Inside vault glow when opening -->
            <div class="rl-vault-interior" v-if="vaultOpening">
              <div class="rl-vault-light"></div>
              <div class="rl-vault-prize">
                <div class="rl-prize-bottle">R</div>
                <div class="rl-prize-text">ORIGINALRECEPET</div>
              </div>
            </div>
          </div>

          <div class="rl-input-panel">
            <div class="rl-panel-label">SÄKERHETSKOD</div>
            <div class="rl-panel-hint">Kombinera ledtrådar från alla stationer. Varje station gav ett element. Ordna dem korrekt.</div>
            <div class="rl-vault-clue-display">
              <div class="rl-vcd-item" v-for="c in collectedClues" :key="c.from">
                <div class="rl-vcd-source">{{ c.from }}</div>
                <div class="rl-vcd-value">{{ c.value }}</div>
              </div>
            </div>
            <div class="rl-code-input-row rl-vault-input">
              <div class="rl-digit-input" v-for="(d,i) in vaultInput" :key="i">
                <input type="text" maxlength="1" v-model="vaultInput[i]"
                  @input="onDigitInput('vault', i, $event)"
                  @keydown="onDigitKey('vault', i, $event)"
                  :ref="el => { if(el) vaultRefs[i] = el }"
                  :class="{ filled: d, error: vaultError && d }" />
              </div>
            </div>
            <div class="rl-input-feedback" :class="vaultMsg.type">{{ vaultMsg.text }}</div>
            <button class="rl-btn-submit rl-vault-btn" @click="checkVault">ÖPPNA VALVET</button>
            <button class="rl-btn-back" @click="goScene('facility')">AVBRYT</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- WIN SCENE -->
    <transition name="rl-scene-fade">
      <div v-if="scene === 'win'" class="rl-scene rl-win-scene">
        <div class="rl-win-particles">
          <div class="rl-wp" v-for="n in 40" :key="n" :style="winParticleStyle(n)"></div>
        </div>
        <div class="rl-win-inner">
          <div class="rl-win-stamp">UPPDRAG SLUTFÖRT</div>
          <h2 class="rl-win-title">Ramlösan<br><em>är räddad.</em></h2>
          <div class="rl-win-bottle-big">
            <div class="rl-wbb-body">
              <div class="rl-wbb-label">P</div>
              <div class="rl-wbb-bubbles">
                <div class="rl-wbb-b" v-for="n in 20" :key="n" :style="bubbleStyle(n)"></div>
              </div>
            </div>
          </div>
          <p class="rl-win-flavour">Receptet är säkrat. Bubblorna flödar fritt. Sverige andas ut. Och det viktigaste: Richard får unna sig lyx på sin 25 års dag</p>
          <button class="rl-btn-mission" @click="resetGame">NY MISSION</button>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'

/* ─── SCENE MANAGEMENT ─── */
const scene = ref('intro')
const hoveredStation = ref(null)

/* ─── MISTAKES ─── */
const mistakes = ref(0)

/* ─── SOLVED ─── */
const solvedStations = reactive({ archive: false, pipes: false, lab: false, vault: false })

/* ─── CLUES (collected from each station) ─── */
const collectedClues = ref([])

/* ─── JUMPSCARE ─── */
const jumpscare = reactive({ active: false, title: '', sub: '', progress: 0 })
const alarmActive = ref(false)
let jumpscareTimer = null

/* ─── LOCKED TOAST ─── */
const lockedMsg = ref('')
let lockedTimer = null

/* ─── BG CANVAS ─── */
const bgCanvas = ref(null)

/* ─── ARCHIVE PUZZLE ─── */
// Answer: 4-digit code — agent must find "AQUA" in file metadata, A=1,Q=17,U=21,A=1 → but we DON'T show this
// Hint is: "Fjärde kolumnens rad-index × sidhuvudets ordningsnummer"
// Real answer: 7 4 2 1
const archiveAnswer = ['7','4','2','1']
const archiveInput = ref(['','','',''])
const archiveRefs = ref([])
const archiveError = ref(false)
const archiveMsg = ref('')
const selectedFile = ref(null)
const archiveFiles = [
  {
    id: 'manifest',
    name: 'TILLVERKNING_MANIFEST.log',
    size: '14KB',
    content: `<div class="rl-af-line"><span class="rl-af-k">SESSION</span> <span class="rl-af-v">7429-A</span></div>
<div class="rl-af-line"><span class="rl-af-k">DATUM</span> <span class="rl-af-v">1984-04-07</span></div>
<div class="rl-af-line"><span class="rl-af-k">BATCH</span> <span class="rl-af-v">RL-0042</span></div>
<div class="rl-af-line"><span class="rl-af-k">OPERATÖR</span> <span class="rl-af-v">LINDQVIST</span></div>
<div class="rl-af-line rl-af-highlight"><span class="rl-af-k">SEKVENSNR</span> <span class="rl-af-v">7 — 4 — &#x25A0; — &#x25A0;</span></div>
<div class="rl-af-line"><span class="rl-af-k">STATUS</span> <span class="rl-af-v">ARKIVERAT</span></div>`
  },
  {
    id: 'formula',
    name: 'FORMEL_V7.enc',
    size: '3KB',
    content: `<div class="rl-af-enc">
<div class="rl-af-line rl-dim">// Krypterat segment — delvis återställt</div>
<div class="rl-af-line"><span class="rl-af-k">CO2-TRYCK</span> <span class="rl-af-v">6.2 bar</span></div>
<div class="rl-af-line"><span class="rl-af-k">MINERAL-ID</span> <span class="rl-af-v">Ca²⁺ Mg²⁺</span></div>
<div class="rl-af-line rl-af-redacted">&#x25A0;&#x25A0;&#x25A0; KOD &#x25A0;&#x25A0;&#x25A0; &#x25A0;&#x25A0;&#x25A0; &#x25A0;&#x25A0;&#x25A0;</div>
<div class="rl-af-line rl-af-highlight"><span class="rl-af-k">PARAMETER-&#x3B1;</span> <span class="rl-af-v">&#x25A0; &#x25A0; 2 1</span></div>
</div>`
  },
  {
    id: 'access',
    name: 'ACCESSLOGG_1984.dat',
    size: '8KB',
    content: `<div class="rl-af-line rl-dim">// Inloggningshistorik — röd flagga</div>
<div class="rl-af-line"><span class="rl-af-k">INLOGG</span> <span class="rl-af-v">ADMIN · 07:42</span></div>
<div class="rl-af-line"><span class="rl-af-k">INLOGG</span> <span class="rl-af-v">RL-AGENT · 07:44</span></div>
<div class="rl-af-line rl-err"><span class="rl-af-k">FEL-AUTH</span> <span class="rl-af-v">OKÄND · 08:01</span></div>
<div class="rl-af-line rl-err"><span class="rl-af-k">FEL-AUTH</span> <span class="rl-af-v">OKÄND · 08:03</span></div>
<div class="rl-af-line rl-af-highlight rl-dim">Notering: Manifest-session 7429-A verifierar sekvens.</div>`
  }
]

/* ─── PIPE PUZZLE ─── */
// Correct: valves 0,2,3 = open (true), valve 1 = closed
const pipeValves = ref([false, false, false, false])
const pipeAnswer = [true, false, true, true]
const pipeFlow = ref([false, false, false, false])
const tankLevel = ref(40)
const pipeMsg = reactive({ text: '', type: '' })

const pipeOutput = computed(() => {
  const openCount = pipeValves.value.filter(v => v).length
  // Pattern: V1 open, V2 closed, V3 open, V4 open = 100%
  const v = pipeValves.value
  if (v[0] && !v[1] && v[2] && v[3]) return 100
  if (v[0] && v[2] && v[3]) return 75
  if (v.filter(Boolean).length === 4) return 40  // all open = pressure too low
  if (v.filter(Boolean).length === 0) return 0
  return Math.min(90, openCount * 22 + (v[0] ? 10 : 0))
})

watch(pipeOutput, (val) => {
  pipeFlow.value = pipeValves.value.map(v => v)
  if (val === 100) tankLevel.value = Math.min(100, tankLevel.value + 5)
})

function toggleValve(i) {
  pipeValves.value[i] = !pipeValves.value[i]
  pipeMsg.text = ''
}

/* ─── LAB PUZZLE ─── */
// Correct sequence: B3, A1, C2 (by chem ID order)
const chemBottles = [
  { id: 'A1', code: 'A1', color: '#1a2840', liquid: '#00c4ff', property: 'Mineral-alkaloid' },
  { id: 'B3', code: 'B3', color: '#1a2a1a', liquid: '#00ff9a', property: 'Naturlig karbonering' },
  { id: 'C2', code: 'C2', color: '#2a1a18', liquid: '#ff9944', property: 'Källsalt' },
  { id: 'D4', code: 'D4', color: '#2a1a2a', liquid: '#ff4466', property: 'Syntetisk tillsats' },
  { id: 'E5', code: 'E5', color: '#1a1a2a', liquid: '#9944ff', property: 'Stabilisator X' },
]
const labAnswer = ['B3', 'A1', 'C2']
const mixSequence = ref([null, null, null])
const selectedChem = ref(null)
const usedChems = ref([])
const mixResult = ref(null)
const mixLevel = ref(0)
const mixColor = ref('transparent')
const labMsg = reactive({ text: '', type: '' })
const specBars = computed(() => {
  const base = [
    { label: 'pH', height: 60, color: '#4488ff' },
    { label: 'CO₂', height: 40, color: '#44ffcc' },
    { label: 'Ca', height: 55, color: '#ffcc44' },
    { label: 'Mg', height: 45, color: '#ff8844' },
    { label: 'Na', height: 30, color: '#cc44ff' },
    { label: 'HCO₃', height: 50, color: '#44ff88' },
  ]
  const filled = mixSequence.value.filter(Boolean).length
  return base.map((b, i) => ({ ...b, height: filled > i ? b.height + 20 : b.height }))
})

function selectChem(b) {
  if (usedChems.value.includes(b.id)) return
  selectedChem.value = b.id
  const slot = mixSequence.value.findIndex(s => !s)
  if (slot === -1) return
  mixSequence.value[slot] = b.id
  usedChems.value.push(b.id)
  mixLevel.value = ((slot + 1) / 3) * 80
  const colors = { A1: '#00c4ff', B3: '#00ff9a', C2: '#ff9944', D4: '#ff4466', E5: '#9944ff' }
  mixColor.value = colors[b.id] || '#888'
  labMsg.text = ''
}

function clearMix() {
  mixSequence.value = [null, null, null]
  usedChems.value = []
  mixLevel.value = 0
  mixColor.value = 'transparent'
  mixResult.value = null
  labMsg.text = ''
}

/* ─── VAULT PUZZLE ─── */
// Clues collected: archive gives "7", pipes gives "R", lab gives "43"
// Final code: 7-R-4-3 but input is 4 slots: 7, R, 4, 3 → but since input is text: "7R43"
// We'll use 5-digit: WATER → W=1 A=0 T=6 E=5 R=7 → nope, keep it solvable
// Final: clues are displayed. Vault answer = digits derived from all 3 clues combined: "7243"
const vaultAnswer = ['7','2','4','3']
const vaultInput = ref(['','','',''])
const vaultRefs = ref([])
const vaultError = ref(false)
const vaultMsg = reactive({ text: '', type: '' })
const vaultOpening = ref(false)

/* ─── DIGIT INPUT HELPERS ─── */
function onDigitInput(which, i, e) {
  const val = e.target.value.replace(/[^0-9a-zA-Z]/g,'').slice(-1).toUpperCase()
  if (which === 'archive') {
    archiveInput.value[i] = val
    archiveError.value = false
    if (val && i < 3) archiveRefs.value[i+1]?.focus()
  } else {
    vaultInput.value[i] = val
    vaultError.value = false
    if (val && i < 3) vaultRefs.value[i+1]?.focus()
  }
}
function onDigitKey(which, i, e) {
  if (e.key === 'Backspace') {
    const arr = which === 'archive' ? archiveInput.value : vaultInput.value
    const refs = which === 'archive' ? archiveRefs.value : vaultRefs.value
    if (!arr[i] && i > 0) { arr[i-1] = ''; refs[i-1]?.focus() }
  }
}

/* ─── CHECK FUNCTIONS ─── */
function checkArchive() {
  const ans = archiveInput.value.join('').toUpperCase()
  if (ans === archiveAnswer.join('')) {
    solvedStations.archive = true
    archiveMsg.value = '✓ KOD ACCEPTERAD — Ledtråd extraherad: [7___]'
    collectedClues.value.push({ from: 'ARKIV', value: '7 ■ ■ ■' })
    setTimeout(() => goScene('facility'), 1400)
  } else {
    archiveError.value = true
    archiveMsg.value = 'AUTENTISERING MISSLYCKADES'
    fail()
  }
}

function checkPipes() {
  if (pipeOutput.value === 100) {
    solvedStations.pipes = true
    pipeMsg.text = '✓ KONFIGURATION GODKÄND — Ledtråd: [■2■■]'
    pipeMsg.type = 'ok'
    collectedClues.value.push({ from: 'RÖREN', value: '■ 2 ■ ■' })
    setTimeout(() => goScene('facility'), 1400)
  } else {
    pipeMsg.text = 'UTFLÖDE OTILLRÄCKLIGT — Kontrollera ventilerna'
    pipeMsg.type = 'err'
    fail()
  }
}

function checkLab() {
  const seq = mixSequence.value
  if (seq[0] === 'B3' && seq[1] === 'A1' && seq[2] === 'C2') {
    solvedStations.lab = true
    mixResult.value = 'correct'
    labMsg.text = '✓ RÄTT BLANDNING — Ledtråd: [■■43]'
    labMsg.type = 'ok'
    collectedClues.value.push({ from: 'LABBET', value: '■ ■ 4 3' })
    setTimeout(() => goScene('facility'), 1600)
  } else {
    mixResult.value = 'wrong'
    labMsg.text = 'FEL BLANDNING — Prova en annan sekvens'
    labMsg.type = 'err'
    fail()
  }
}

function checkVault() {
  const ans = vaultInput.value.join('').toUpperCase()
  if (ans === vaultAnswer.join('')) {
    solvedStations.vault = true
    vaultMsg.text = '✓ VALVET ÖPPNAS...'
    vaultMsg.type = 'ok'
    vaultOpening.value = true
    setTimeout(() => goScene('win'), 3000)
  } else {
    vaultError.value = true
    vaultMsg.text = 'FEL KOD — ÅTKOMST NEKAD'
    vaultMsg.type = 'err'
    fail()
  }
}

/* ─── FAIL LOGIC ─── */
function fail() {
  mistakes.value++
  if (mistakes.value >= 3) {
    doJumpscare('LARM AKTIVERAT', 'För många fel. Systemet låser sig.', 2000)
  }
}

function doJumpscare(title, sub, duration) {
  alarmActive.value = true
  jumpscare.active = true
  jumpscare.title = title
  jumpscare.sub = sub
  jumpscare.progress = 0
  let elapsed = 0
  const step = 50
  jumpscareTimer = setInterval(() => {
    elapsed += step
    jumpscare.progress = (elapsed / duration) * 100
    if (elapsed >= duration) {
      clearInterval(jumpscareTimer)
      jumpscare.active = false
      alarmActive.value = false
      if (mistakes.value >= 3) {
        mistakes.value = 0
        solvedStations.archive = false
        solvedStations.pipes = false
        solvedStations.lab = false
        solvedStations.vault = false
        collectedClues.value = []
        archiveInput.value = ['','','','']
        vaultInput.value = ['','','','']
        pipeValves.value = [false,false,false,false]
        clearMix()
        goScene('intro')
      }
    }
  }, step)
}

/* ─── SCENE HELPERS ─── */
function goScene(s) { scene.value = s }

function showLocked(msg) {
  lockedMsg.value = msg
  if (lockedTimer) clearTimeout(lockedTimer)
  lockedTimer = setTimeout(() => { lockedMsg.value = '' }, 2000)
}

/* ─── STYLES ─── */
function bubbleStyle(n) {
  const x = (n * 63.7) % 80
  const size = 3 + (n % 4)
  const dur = 1.5 + (n % 4) * 0.5
  const delay = (n * 0.3) % 3
  return { left: x + '%', width: size + 'px', height: size + 'px', animationDuration: dur + 's', animationDelay: delay + 's' }
}

function particleStyle(n) {
  const x = (n * 97.3) % 100
  const y = (n * 63.1) % 100
  const size = 1 + (n % 3)
  const dur = 3 + (n % 5)
  const delay = (n * 0.4) % 5
  return { left: x + '%', top: y + '%', width: size + 'px', height: size + 'px', animationDuration: dur + 's', animationDelay: delay + 's' }
}

function winParticleStyle(n) {
  const x = (n * 73.1) % 100
  const size = 4 + (n % 6)
  const dur = 2 + (n % 4)
  const delay = (n * 0.25) % 3
  return { left: x + '%', width: size + 'px', height: size + 'px', animationDuration: dur + 's', animationDelay: delay + 's' }
}

/* ─── BG CANVAS ─── */
function drawBg() {
  const c = bgCanvas.value
  if (!c) return
  c.width = window.innerWidth
  c.height = window.innerHeight
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#070c12'
  ctx.fillRect(0, 0, c.width, c.height)
  // Grid dots
  for (let x = 0; x < c.width; x += 40) {
    for (let y = 0; y < c.height; y += 40) {
      ctx.beginPath()
      ctx.arc(x, y, 0.8, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0,196,255,0.08)'
      ctx.fill()
    }
  }
}

onMounted(() => { drawBg(); window.addEventListener('resize', drawBg) })
onBeforeUnmount(() => { clearInterval(jumpscareTimer); clearTimeout(lockedTimer); window.removeEventListener('resize', drawBg) })


function resetGame() {
  mistakes.value = 0
  Object.keys(solvedStations).forEach(k => solvedStations[k] = false)
  collectedClues.value = []
  archiveInput.value = ['','','','']
  vaultInput.value = ['','','','']
  pipeValves.value = [false,false,false,false]
  clearMix()
  vaultOpening.value = false
  archiveError.value = false
  archiveMsg.value = ''
  vaultMsg.text = ''
  vaultError.value = false
  goScene('intro')
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;600;700&family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap');

#rl-app, #rl-app *, #rl-app *::before, #rl-app *::after{box-sizing:border-box;}
#rl-app *{margin:0;padding:0;}

#rl-app.rl-root {
  --c-bg: #070c12;
  --c-bg2: #0a1118;
  --c-bg3: #0d1620;
  --c-surface: #111e2a;
  --c-surface2: #162434;
  --c-border: rgba(0,196,255,0.12);
  --c-border2: rgba(0,196,255,0.22);
  --c-water: #00c4ff;
  --c-water2: #00ffcc;
  --c-accent: #00c4ff;
  --c-danger: #ff3355;
  --c-warn: #ffaa00;
  --c-ok: #00ff9a;
  --c-text: #c8e8f0;
  --c-text2: rgba(200,232,240,0.5);
  --c-text3: rgba(200,232,240,0.25);
  width:100%; min-height:100dvh; overflow-x:hidden; overflow-y:auto;
  background:var(--c-bg);
  color:var(--c-text);
  font-family:'Rajdhani',sans-serif;
  position:relative;
}

#rl-app.rl-alarm-active { animation: alarm-flash 0.3s infinite; }
@keyframes alarm-flash { 0%,100%{background:var(--c-bg);} 50%{background:#1a0008;} }

.rl-bg-canvas { position:fixed;inset:0;pointer-events:none;z-index:0; }
.rl-noise-overlay {
  position:fixed;inset:0;pointer-events:none;z-index:1;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
  opacity:0.4;
}
.rl-scene { position:absolute;inset:0;z-index:10; }

/* ─── JUMPSCARE ─── */
.rl-jumpscare {
  position:fixed;inset:0;z-index:900;
  background:#0a0005;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;
}
.rl-scare-title {
  font-family:'Orbitron',sans-serif;font-size:52px;font-weight:900;
  color:var(--c-danger);letter-spacing:8px;
  animation:scare-pulse .2s infinite;
}
@keyframes scare-pulse{0%,100%{opacity:1;}50%{opacity:0.3;}}
.rl-scare-sub { font-family:'Share Tech Mono',monospace;font-size:16px;color:var(--c-text2);letter-spacing:3px; }
.rl-scare-bar { width:320px;height:3px;background:rgba(255,51,85,0.2);border-radius:2px;overflow:hidden;margin-top:30px; }
.rl-scare-bar div { height:100%;background:var(--c-danger);transition:width .05s linear; }

/* ─── INTRO ─── */
.rl-intro-scene {
  display:flex;align-items:center;justify-content:center;
  background:radial-gradient(ellipse at 30% 50%,#0a1a26 0%,var(--c-bg) 70%);
}
.rl-intro-grid-lines {
  position:absolute;inset:0;pointer-events:none;
  background-image:linear-gradient(rgba(0,196,255,0.03) 1px,transparent 1px),
    linear-gradient(90deg,rgba(0,196,255,0.03) 1px,transparent 1px);
  background-size:60px 60px;
}
.rl-brand-watermark {
  position:absolute;right:-40px;top:50%;transform:translateY(-50%) rotate(90deg);
  font-family:'Orbitron',sans-serif;font-size:100px;font-weight:900;
  color:rgba(0,196,255,0.03);letter-spacing:20px;pointer-events:none;white-space:nowrap;
}
.rl-intro-inner {
  display:flex;flex-direction:column;align-items:flex-start;gap:28px;
  max-width:520px;padding:0 40px;position:relative;z-index:5;
}
.rl-mission-header { display:flex;align-items:center;gap:14px;width:100%; }
.rl-mission-line { flex:1;height:1px;background:var(--c-border2); }
.rl-mission-tag { font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:3px;color:var(--c-water);white-space:nowrap; }
.rl-intro-title {
  font-family:'Orbitron',sans-serif;font-size:58px;font-weight:900;line-height:1;
  color:var(--c-text);letter-spacing:-1px;
}
.rl-intro-title em { color:var(--c-water);font-style:normal; }
.rl-intro-brief { font-size:15px;color:var(--c-text2);line-height:1.8;max-width:400px; }
.rl-intro-brief p+p { margin-top:10px; }
.rl-mission-stats { display:flex;gap:28px; }
.rl-stat-item { text-align:center; }
.rl-stat-val { font-family:'Orbitron',sans-serif;font-size:28px;font-weight:700;color:var(--c-water); }
.rl-stat-label { font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:2px;color:var(--c-text3);margin-top:2px; }
.rl-btn-mission {
  position:relative;padding:16px 44px;background:transparent;
  border:1px solid var(--c-water);color:var(--c-water);
  font-family:'Orbitron',sans-serif;font-size:13px;font-weight:700;
  letter-spacing:3px;cursor:pointer;overflow:hidden;transition:all .25s;
}
.rl-btn-mission:hover { background:rgba(0,196,255,0.08);box-shadow:0 0 30px rgba(0,196,255,0.2); }
.rl-btn-scan {
  position:absolute;top:0;left:-100%;width:60%;height:100%;
  background:linear-gradient(90deg,transparent,rgba(0,196,255,0.15),transparent);
  animation:scan 2s ease-in-out infinite;
}
@keyframes scan { to{left:140%;} }

/* ─── INTRO BOTTLE ─── */
.rl-intro-bottle {
  position:absolute;right:8%;top:50%;transform:translateY(-50%);
  perspective:600px;
}
.rl-bottle-3d {
  width:90px;height:280px;position:relative;
  transform:rotateY(-15deg) rotateX(5deg);
  transform-style:preserve-3d;
  animation:bottle-float 4s ease-in-out infinite;
}
@keyframes bottle-float{0%,100%{transform:rotateY(-15deg) rotateX(5deg) translateY(0);}50%{transform:rotateY(-15deg) rotateX(5deg) translateY(-16px);}}
.rl-bottle-cap { width:50px;height:20px;background:linear-gradient(135deg,#1a3a4a,#0d2030);border-radius:4px 4px 0 0;margin:0 auto;border:1px solid var(--c-border2); }
.rl-bottle-neck { width:38px;height:40px;background:linear-gradient(135deg,rgba(0,180,220,0.15),rgba(0,120,160,0.1));margin:0 auto;border-left:1px solid rgba(255,255,255,0.08);border-right:1px solid rgba(255,255,255,0.04); }
.rl-bottle-body {
  width:90px;height:200px;
  background:linear-gradient(135deg,rgba(0,180,220,0.18) 0%,rgba(0,80,120,0.12) 50%,rgba(0,160,200,0.15) 100%);
  border:1px solid rgba(0,196,255,0.2);border-radius:8px;
  position:relative;overflow:hidden;
}
.rl-bottle-bottom { width:90px;height:12px;background:linear-gradient(180deg,rgba(0,196,255,0.1),rgba(0,196,255,0.05));border-radius:0 0 8px 8px;border:1px solid rgba(0,196,255,0.1);border-top:none; }
.rl-bottle-label {
  position:absolute;top:20px;left:50%;transform:translateX(-50%);
  width:70px;padding:8px 6px;
  background:rgba(0,20,40,0.7);border:1px solid rgba(0,196,255,0.3);border-radius:3px;
  display:flex;flex-direction:column;align-items:center;gap:6px;
}
.rl-label-r { font-family:'Orbitron',sans-serif;font-size:26px;font-weight:900;color:var(--c-water);line-height:1; }
.rl-label-waves { display:flex;flex-direction:column;gap:3px;width:100%; }
.rl-label-waves span { height:1px;background:rgba(0,196,255,0.4);border-radius:1px; }
.rl-bottle-bubbles { position:absolute;inset:0; }
.rl-bubble {
  position:absolute;bottom:-10%;border-radius:50%;
  background:rgba(0,196,255,0.25);border:1px solid rgba(0,196,255,0.4);
  animation:rise-bubble 3s ease-in infinite;
}
@keyframes rise-bubble{0%{bottom:-5%;opacity:0.8;}100%{bottom:105%;opacity:0;}}
.rl-bottle-sheen {
  position:absolute;top:0;left:8px;width:10px;height:100%;
  background:linear-gradient(180deg,rgba(255,255,255,0.08),transparent);border-radius:4px;
}

/* ─── FACILITY SCENE ─── */
.rl-facility-scene { display:flex;align-items:center;justify-content:center;overflow:hidden; }
.rl-facility-perspective {
  width:100%;height:100%;position:relative;
  perspective:900px;perspective-origin:50% 40%;
  transform-style:preserve-3d;
}
.rl-wall { position:absolute;background:var(--c-bg3); }
.rl-wall-back { inset:0;bottom:35%;z-index:1;
  background:linear-gradient(180deg,#060a10 0%,#0a1018 100%);
  border-bottom:1px solid rgba(0,196,255,0.08);
}
.rl-wall-left { left:0;top:0;bottom:35%;width:12%;background:linear-gradient(90deg,#050810,var(--c-bg3));z-index:2; }
.rl-wall-right { right:0;top:0;bottom:35%;width:12%;background:linear-gradient(270deg,#050810,var(--c-bg3));z-index:2; }
.rl-ceiling-grid {
  position:absolute;top:0;left:0;right:0;height:35%;z-index:3;
  background-image:linear-gradient(rgba(0,196,255,0.05) 1px,transparent 1px),
    linear-gradient(90deg,rgba(0,196,255,0.05) 1px,transparent 1px);
  background-size:80px 80px;
  background:linear-gradient(180deg,#04080e,#080e18);
  border-bottom:1px solid rgba(0,196,255,0.1);
}
.rl-floor-grid {
  position:absolute;bottom:0;left:0;right:0;height:35%;z-index:0;
  background:linear-gradient(180deg,#080e18,#04080e);
  background-image:linear-gradient(rgba(0,196,255,0.04) 1px,transparent 1px),
    linear-gradient(90deg,rgba(0,196,255,0.04) 1px,transparent 1px);
  background-size:60px 60px;
  border-top:1px solid rgba(0,196,255,0.08);
}
.rl-pipe { background:linear-gradient(180deg,#1a2a3a,#0e1a26);border:1px solid rgba(0,196,255,0.1);position:absolute;z-index:4; }
.rl-pipe-h { height:14px;left:0;right:0; }
.rl-pipe-v { width:14px;top:0;bottom:35%; }
.rl-top-pipe { top:8%;box-shadow:0 0 10px rgba(0,196,255,0.05); }
.rl-mid-pipe { top:22%; }
.rl-left-v-pipe { left:14%;box-shadow:inset 0 0 8px rgba(0,196,255,0.04); }
.rl-right-v-pipe { right:14%; }
.rl-pipe-joint { position:absolute;z-index:5;width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#1e3040,#0e1a28);border:1px solid rgba(0,196,255,0.2); }
.rl-j1 { left:calc(14% - 3px);top:calc(8% - 3px); }
.rl-j2 { right:calc(14% - 3px);top:calc(8% - 3px); }
.rl-warn-strip { position:absolute;left:0;right:0;height:8px;z-index:6;background:repeating-linear-gradient(45deg,rgba(255,170,0,0.15),rgba(255,170,0,0.15) 10px,transparent 10px,transparent 20px); }
.rl-top-strip { top:0; }
.rl-bottom-strip { bottom:35%; }

/* ─── STATIONS ─── */
.rl-station {
  position:absolute;z-index:20;cursor:pointer;transition:all .25s;
}
.rl-station:hover { transform:translateY(-4px); }
.rl-station.active { transform:translateY(-6px); }
.rl-station-3d { position:relative;transform-style:preserve-3d; }
.rl-station-face,.rl-terminal-screen,.rl-pipe-ctrl-face,.rl-lab-face,.rl-vault-face {
  background:var(--c-surface);border:1px solid var(--c-border2);border-radius:4px;
  position:relative;overflow:hidden;
}
.rl-station-side {
  position:absolute;right:-8px;top:6px;bottom:-6px;width:10px;
  background:linear-gradient(90deg,var(--c-surface2),var(--c-bg2));
  border-radius:0 2px 2px 0;transform:skewY(-45deg);transform-origin:top right;
  border:1px solid rgba(0,196,255,0.08);border-left:none;
}
.rl-station-top {
  position:absolute;top:-8px;right:-8px;left:0;height:10px;
  background:linear-gradient(180deg,var(--c-surface2),var(--c-surface));
  border-radius:2px 4px 0 0;transform:skewX(-45deg);transform-origin:bottom left;
  border:1px solid rgba(0,196,255,0.08);border-bottom:none;
}
.rl-station-glow {
  position:absolute;inset:-4px;border:1px solid transparent;border-radius:6px;
  transition:all .4s;pointer-events:none;
}
.rl-station-glow.solved { border-color:rgba(0,255,154,0.3);box-shadow:0 0 20px rgba(0,255,154,0.15); }
.rl-station-glow.locked { border-color:rgba(255,51,85,0.15); }
.rl-station:hover .rl-station-glow:not(.solved) { border-color:rgba(0,196,255,0.3);box-shadow:0 0 20px rgba(0,196,255,0.1); }
.rl-station-label {
  font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:2px;
  color:var(--c-water);text-align:center;margin-top:8px;
}
.rl-solved-badge {
  position:absolute;top:-10px;right:-8px;
  font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:1px;
  background:rgba(0,255,154,0.15);border:1px solid rgba(0,255,154,0.4);
  color:var(--c-ok);padding:2px 8px;border-radius:10px;
}
.rl-lock-badge {
  position:absolute;top:-10px;right:-8px;
  font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:1px;
  background:rgba(255,51,85,0.1);border:1px solid rgba(255,51,85,0.3);
  color:var(--c-danger);padding:2px 8px;border-radius:10px;
}
.rl-station.locked { opacity:0.6; }

/* Archive station */
.rl-station-archive { left:12%;bottom:38%;width:160px; }
.rl-terminal-screen { width:150px;height:110px;padding:10px;background:#03080e;border-color:rgba(0,196,255,0.2); }
.rl-term-scanline {
  position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,196,255,0.02) 3px,rgba(0,196,255,0.02) 4px);
  pointer-events:none;
}
.rl-term-text { font-family:'Share Tech Mono',monospace;font-size:13px;color:var(--c-water);line-height:1.8; }
.rl-terminal-keyboard { width:150px;height:18px;background:var(--c-surface2);border:1px solid var(--c-border);border-top:none;border-radius:0 0 4px 4px;margin-top:1px; }

/* Pipe station */
.rl-station-pipe-ctrl { left:33%;bottom:38%;width:150px; }
.rl-pipe-ctrl-face { width:140px;height:100px;padding:12px;display:flex;align-items:center;gap:14px; }
.rl-pressure-gauge { width:50px;height:50px;border-radius:50%;background:#03080e;border:2px solid rgba(0,196,255,0.2);position:relative;display:flex;align-items:center;justify-content:center; }
.rl-gauge-needle { width:2px;height:18px;background:var(--c-water);border-radius:1px;transform-origin:bottom center;transition:transform .6s; }
.rl-pipe-ctrl-valves { display:flex;flex-direction:column;gap:6px; }
.rl-valve { width:26px;height:10px;background:rgba(255,51,85,0.3);border:1px solid rgba(255,51,85,0.4);border-radius:2px;transition:all .4s; }
.rl-valve.open { background:rgba(0,255,154,0.25);border-color:rgba(0,255,154,0.4); }

/* Lab station */
.rl-station-lab { left:54%;bottom:38%;width:140px; }
.rl-lab-face { width:130px;height:100px;padding:10px;display:flex;align-items:flex-end;justify-content:center;gap:10px; }
.rl-flask { width:28px;border-radius:0 0 8px 8px;border:1px solid rgba(0,196,255,0.2);overflow:hidden;position:relative; }
.rl-flask-1{height:60px;}.rl-flask-2{height:80px;}.rl-flask-3{height:50px;}
.rl-flask-liquid { position:absolute;bottom:0;left:0;right:0;height:60%;opacity:0.6;animation:bubble-flask 2s ease-in-out infinite; }
@keyframes bubble-flask{0%,100%{height:60%;}50%{height:65%;}}

/* Vault station */
.rl-station-vault { right:12%;bottom:38%;width:140px; }
.rl-vault-face { width:130px;height:130px;border-radius:50%;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;background:#030810; }
.rl-vault-door-ring { position:absolute;border-radius:50%;border:2px solid rgba(0,196,255,0.2); }
.rl-vault-door-ring.rl-outer { inset:6px; }
.rl-vault-door-ring.rl-inner { inset:24px; }
.rl-vault-spokes { position:absolute;inset:0; }
.rl-spoke { position:absolute;top:50%;left:50%;width:50%;height:1px;background:rgba(0,196,255,0.15);transform-origin:left center; }
.rl-vault-center { width:20px;height:20px;border-radius:50%;background:var(--c-danger);transition:all .6s;z-index:2; }
.rl-vault-center.unlocked { background:var(--c-ok);box-shadow:0 0 12px rgba(0,255,154,0.6); }

/* Water particles */
.rl-water-particle {
  position:absolute;border-radius:50%;background:rgba(0,196,255,0.2);
  animation:float-particle 6s ease-in-out infinite;pointer-events:none;z-index:5;
}
@keyframes float-particle{0%,100%{transform:translateY(0);opacity:0.3;}50%{transform:translateY(-20px);opacity:0.6;}}

/* ─── HUD ─── */
.rl-facility-hud {
  position:fixed;top:0;left:0;right:0;z-index:100;
  display:flex;align-items:center;padding:14px 24px;
  background:rgba(7,12,18,0.9);border-bottom:1px solid var(--c-border);
}
.rl-hud-left,.rl-hud-right { flex:1; }
.rl-hud-center { flex:2;display:flex;justify-content:center; }
.rl-agent-id { font-family:'Share Tech Mono',monospace;font-size:12px;color:var(--c-text2);letter-spacing:2px; }
.rl-agent-id span { color:var(--c-water); }
.rl-progress-nodes { display:flex;align-items:center;gap:0; }
.rl-pnode { display:flex;flex-direction:column;align-items:center;gap:5px; }
.rl-pnode-dot { width:10px;height:10px;border-radius:50%;background:var(--c-surface2);border:1px solid rgba(0,196,255,0.3);transition:all .4s; }
.rl-pnode.done .rl-pnode-dot { background:var(--c-ok);border-color:var(--c-ok);box-shadow:0 0 8px rgba(0,255,154,0.5); }
.rl-pnode span { font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--c-text3);letter-spacing:1px; }
.rl-pnode.done span { color:var(--c-ok); }
.rl-pnode-line { width:50px;height:1px;background:var(--c-border);transition:all .4s;flex-shrink:0;margin-bottom:14px; }
.rl-pnode-line.active { background:var(--c-ok);box-shadow:0 0 6px rgba(0,255,154,0.4); }
.rl-hud-right { display:flex;justify-content:flex-end;align-items:center; }
.rl-mistake-display { display:flex;align-items:center;gap:10px; }
.rl-mistake-label { font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--c-text3);letter-spacing:2px; }
.rl-mistake-dots { display:flex;gap:6px; }
.rl-mdot { width:10px;height:10px;border-radius:50%;background:transparent;border:1px solid rgba(255,51,85,0.3);transition:all .3s; }
.rl-mdot.used { background:var(--c-danger);border-color:var(--c-danger);box-shadow:0 0 8px rgba(255,51,85,0.5); }

/* Locked toast */
.rl-locked-toast {
  position:fixed;bottom:60px;left:50%;transform:translateX(-50%);
  font-family:'Share Tech Mono',monospace;font-size:12px;letter-spacing:2px;
  color:var(--c-danger);padding:10px 24px;
  background:rgba(255,51,85,0.1);border:1px solid rgba(255,51,85,0.3);border-radius:4px;
  z-index:200;
}

/* ─── PUZZLE ROOMS ─── */
.rl-puzzle-scene { overflow:hidden; }
.rl-puzzle-room { position:absolute;inset:0;display:flex;align-items:flex-end;padding-bottom:20px; }
.rl-room-ceiling { position:absolute;top:0;left:0;right:0;height:30%;background:linear-gradient(180deg,#04080e,#080e18);border-bottom:1px solid var(--c-border);z-index:1; }
.rl-room-floor { position:absolute;bottom:0;left:0;right:0;height:25%;background:linear-gradient(180deg,#070c14,#04080c);border-top:1px solid var(--c-border);z-index:1; }
.rl-room-wall-back { position:absolute;inset:0;background:var(--c-bg2);z-index:0;background-image:linear-gradient(rgba(0,196,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,196,255,0.02) 1px,transparent 1px);background-size:40px 40px; }

/* INPUT PANEL (shared) */
.rl-input-panel {
  position:absolute;right:4%;top:50%;transform:translateY(-50%);
  width:280px;background:var(--c-surface);border:1px solid var(--c-border2);
  border-radius:6px;padding:24px;z-index:50;
  box-shadow:0 0 40px rgba(0,0,0,0.8),0 0 1px rgba(0,196,255,0.1);
}
.rl-panel-label { font-family:'Orbitron',sans-serif;font-size:11px;font-weight:700;color:var(--c-water);letter-spacing:3px;margin-bottom:8px; }
.rl-panel-hint { font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--c-text2);line-height:1.7;margin-bottom:20px; }
.rl-code-input-row { display:flex;gap:8px;margin-bottom:12px; }
.rl-digit-input input {
  width:44px;height:52px;background:var(--c-bg);border:1px solid var(--c-border2);
  color:var(--c-water);font-family:'Orbitron',monospace;font-size:22px;font-weight:700;
  text-align:center;outline:none;border-radius:4px;transition:all .2s;
}
.rl-digit-input input.filled { border-color:rgba(0,196,255,0.5);box-shadow:0 0 10px rgba(0,196,255,0.15); }
.rl-digit-input input.error { border-color:var(--c-danger);box-shadow:0 0 10px rgba(255,51,85,0.2);animation:shake .3s; }
@keyframes shake{0%,100%{transform:translateX(0);}25%{transform:translateX(-4px);}75%{transform:translateX(4px);}}
.rl-input-feedback { font-family:'Share Tech Mono',monospace;font-size:11px;min-height:18px;margin-bottom:14px;letter-spacing:1px; }
.rl-input-feedback.rl-err { color:var(--c-danger); }
.rl-input-feedback.ok { color:var(--c-ok); }
.rl-btn-submit {
  width:100%;padding:12px;background:transparent;border:1px solid var(--c-water);
  color:var(--c-water);font-family:'Orbitron',sans-serif;font-size:11px;font-weight:700;
  letter-spacing:3px;cursor:pointer;border-radius:3px;transition:all .2s;margin-bottom:8px;
}
.rl-btn-submit:hover { background:rgba(0,196,255,0.08);box-shadow:0 0 20px rgba(0,196,255,0.1); }
.rl-btn-back {
  width:100%;padding:8px;background:transparent;border:1px solid rgba(0,196,255,0.15);
  color:var(--c-text3);font-family:'Share Tech Mono',monospace;font-size:10px;
  letter-spacing:2px;cursor:pointer;border-radius:3px;transition:all .2s;
}
.rl-btn-back:hover { border-color:var(--c-border2);color:var(--c-text2); }

/* ─── ARCHIVE PUZZLE ─── */
.rl-big-terminal {
  position:absolute;left:5%;top:18%;width:55%;z-index:40;
}
.rl-terminal-bezel {
  background:var(--c-surface);border:2px solid var(--c-border2);border-radius:8px;
  padding:16px;box-shadow:0 0 60px rgba(0,196,255,0.08);
}
.rl-terminal-main-screen {
  background:#02060a;border:1px solid rgba(0,196,255,0.15);border-radius:4px;
  height:340px;overflow:hidden;display:flex;flex-direction:column;
}
.rl-screen-header {
  display:flex;gap:16px;padding:8px 12px;border-bottom:1px solid rgba(0,196,255,0.1);
  background:#020408;
}
.rl-sh-tag { font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--c-text3);letter-spacing:1px; }
.rl-sh-tag.rl-blink { color:var(--c-danger);animation:blink-tag 1s infinite; }
@keyframes blink-tag{0%,100%{opacity:1;}50%{opacity:0;}}
.rl-screen-body { display:flex;flex:1;overflow:hidden; }
.rl-file-list { width:200px;border-right:1px solid rgba(0,196,255,0.08);padding:8px 0;overflow-y:auto; }
.rl-file-item {
  padding:7px 12px;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:8px;
  font-family:'Share Tech Mono',monospace;font-size:10px;
}
.rl-file-item:hover { background:rgba(0,196,255,0.05); }
.rl-file-item.selected { background:rgba(0,196,255,0.08);border-left:2px solid var(--c-water); }
.rl-file-icon { color:var(--c-water);font-size:8px; }
.rl-file-name { color:var(--c-text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
.rl-file-size { color:var(--c-text3); }
.rl-file-preview { flex:1;padding:12px;overflow-y:auto; }
.rl-preview-content { font-family:'Share Tech Mono',monospace;font-size:11px;line-height:1.8; }
/* archive file styles */
:deep(.rl-af-line) { display:flex;gap:16px;padding:2px 0;border-bottom:1px solid rgba(0,196,255,0.04); }
:deep(.rl-af-k) { color:var(--c-text3);min-width:90px; }
:deep(.rl-af-v) { color:var(--c-text); }
:deep(.rl-af-highlight) { background:rgba(0,196,255,0.05);border-left:2px solid rgba(0,196,255,0.3) !important;padding-left:6px !important;border-bottom-color:rgba(0,196,255,0.1) !important; }
:deep(.rl-af-redacted .rl-af-v) { color:rgba(255,51,85,0.5); }
:deep(.rl-af-enc) { color:var(--c-text2); }
:deep(.rl-dim) { opacity:0.4; }
:deep(.rl-err) { color:var(--c-danger) !important; }

/* ─── PIPE PUZZLE ─── */
.rl-pipe-system-3d {
  position:absolute;left:4%;top:15%;width:58%;z-index:40;
  display:flex;gap:20px;align-items:flex-start;
}
.rl-main-tank {
  width:80px;flex-shrink:0;
}
.rl-tank-body {
  height:280px;background:rgba(0,20,40,0.8);border:1px solid var(--c-border2);
  border-radius:4px;position:relative;overflow:hidden;
}
.rl-tank-water {
  position:absolute;bottom:0;left:0;right:0;transition:height .6s;
  background:linear-gradient(180deg,rgba(0,196,255,0.2),rgba(0,100,180,0.4));
}
.rl-tank-surface { height:3px;background:rgba(0,196,255,0.5);border-radius:1px; }
.rl-tank-label { position:absolute;top:10px;left:50%;transform:translateX(-50%);font-family:'Share Tech Mono',monospace;font-size:7px;color:var(--c-text3);letter-spacing:1px;text-align:center;white-space:nowrap; }
.rl-tank-level-marks { position:absolute;right:6px;top:0;bottom:0;display:flex;flex-direction:column-reverse; }
.rl-tank-level-marks span { font-family:'Share Tech Mono',monospace;font-size:7px;color:var(--c-text3);flex:1;display:flex;align-items:flex-start; }
.rl-pipe-network { flex:1;position:relative;height:280px; }
.rl-pn-pipe { position:absolute;background:linear-gradient(180deg,#1a2a3a,#0e1a26);border:1px solid rgba(0,196,255,0.1); }
.rl-pn-pipe.flow { animation:pipe-flow 1s linear infinite; }
@keyframes pipe-flow{0%,100%{border-color:rgba(0,196,255,0.3);}50%{border-color:rgba(0,196,255,0.6);box-shadow:inset 0 0 6px rgba(0,196,255,0.1);}}
.rl-pn-pipe.rl-horizontal { height:12px;left:0;right:0; }
.rl-pn-pipe.rl-vertical { width:12px;top:0;bottom:0; }
.rl-top-h { top:20px; }
.rl-bot-h { bottom:60px; }
.rl-right-v { right:20px; }
.rl-left-v { left:20px; }
.rl-pn-joint { position:absolute;width:18px;height:18px;border-radius:50%;background:var(--c-surface);border:1px solid rgba(0,196,255,0.2);transition:all .3s;z-index:5; }
.rl-pnj-1 { left:12px;top:12px; }
.rl-pnj-2 { right:12px;top:12px; }
.rl-pnj-3 { right:12px;bottom:52px; }
.rl-pnj-4 { left:12px;bottom:52px; }
.rl-pn-joint.active { border-color:var(--c-water);box-shadow:0 0 8px rgba(0,196,255,0.4); }
.rl-valve-ctrl {
  position:absolute;z-index:10;cursor:pointer;
  display:flex;flex-direction:column;align-items:center;gap:4px;
}
.rl-v-0{top:60px;left:0;transform:translateX(-50%);}
.rl-v-1{top:0;left:50%;transform:translate(-50%,-30%);}
.rl-v-2{top:60px;right:0;transform:translateX(50%);}
.rl-v-3{bottom:100px;left:50%;transform:translate(-50%,50%);}
.rl-valve-body {
  width:28px;height:20px;background:rgba(255,51,85,0.2);border:1px solid rgba(255,51,85,0.4);
  border-radius:3px;position:relative;transition:all .3s;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
}
.rl-valve-ctrl.open .rl-valve-body { background:rgba(0,255,154,0.15);border-color:rgba(0,255,154,0.4); }
.rl-valve-body:hover { transform:scale(1.1); }
.rl-valve-handle { width:14px;height:4px;background:rgba(255,51,85,0.7);border-radius:2px;transition:all .3s;transform:rotate(90deg); }
.rl-valve-ctrl.open .rl-valve-handle { background:rgba(0,255,154,0.7);transform:rotate(0deg); }
.rl-valve-label { font-family:'Share Tech Mono',monospace;font-size:8px;color:var(--c-text3);letter-spacing:1px; }
.rl-output-meter {
  position:absolute;bottom:0;left:0;right:0;
  display:flex;align-items:center;gap:10px;padding:0 20px;
}
.rl-om-label { font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--c-text3);letter-spacing:1px;white-space:nowrap; }
.rl-om-bar { flex:1;height:4px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden; }
.rl-om-fill { height:100%;border-radius:2px;transition:all .4s; }
.rl-om-val { font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--c-text);min-width:36px; }
.rl-valve-status { display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px; }
.rl-vs-item { display:flex;align-items:center;gap:5px; }
.rl-vs-label { font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--c-text3); }
.rl-vs-state { font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--c-danger);transition:color .3s; }
.rl-vs-state.open { color:var(--c-ok); }

/* ─── LAB PUZZLE ─── */
.rl-lab-bench-3d {
  position:absolute;left:4%;top:20%;width:58%;z-index:40;
}
.rl-bench-surface {
  background:linear-gradient(180deg,#1a2230,#141a26);border:1px solid var(--c-border2);
  border-radius:4px 4px 0 0;padding:20px;
  display:flex;gap:24px;align-items:flex-end;
  box-shadow:0 0 30px rgba(0,0,0,0.6);
}
.rl-bench-front { height:20px;background:linear-gradient(180deg,#10161e,#0a0e14);border:1px solid var(--c-border);border-top:none;border-radius:0 0 4px 4px; }
.rl-spectrometer { flex-shrink:0; }
.rl-spec-screen {
  width:180px;height:120px;background:#01030a;border:1px solid rgba(0,196,255,0.2);
  border-radius:4px;padding:10px;position:relative;overflow:hidden;
}
.rl-spec-graph { position:absolute;inset:10px;display:flex;align-items:flex-end; }
.rl-spec-bar { position:absolute;bottom:16px;width:10px;border-radius:2px 2px 0 0;transition:height .5s; }
.rl-spec-bar-label { position:absolute;bottom:-14px;left:50%;transform:translateX(-50%);font-family:'Share Tech Mono',monospace;font-size:7px;color:var(--c-text3);white-space:nowrap; }
.rl-spec-baseline { position:absolute;bottom:14px;left:0;right:0;height:1px;background:rgba(0,196,255,0.2); }
.rl-spec-label { font-family:'Share Tech Mono',monospace;font-size:8px;color:var(--c-text3);letter-spacing:1px;text-align:center;margin-top:6px; }
.rl-chem-rack { display:flex;gap:10px;align-items:flex-end; }
.rl-chem-bottle { cursor:pointer;position:relative;transition:all .2s;display:flex;flex-direction:column;align-items:center; }
.rl-chem-bottle:hover { transform:translateY(-6px); }
.rl-chem-bottle.selected { transform:translateY(-8px); }
.rl-chem-bottle.used { opacity:0.3;pointer-events:none; }
.rl-chem-body {
  width:32px;height:70px;border-radius:4px 4px 6px 6px;
  position:relative;overflow:hidden;border:1px solid rgba(255,255,255,0.08);
}
.rl-chem-liquid { position:absolute;bottom:0;left:0;right:0;height:60%;opacity:0.5;animation:chem-bubble 3s ease-in-out infinite; }
@keyframes chem-bubble{0%,100%{height:60%;}50%{height:65%;}}
.rl-chem-label-wrap { position:absolute;top:6px;left:0;right:0;text-align:center;font-family:'Share Tech Mono',monospace;font-size:9px;color:rgba(255,255,255,0.6);font-weight:700; }
.rl-chem-stopper { width:14px;height:8px;background:rgba(255,255,255,0.1);border-radius:2px 2px 0 0;border:1px solid rgba(255,255,255,0.06); }
.rl-chem-bottle.selected .rl-chem-body { border-color:var(--c-water);box-shadow:0 0 12px rgba(0,196,255,0.3); }
.rl-mixing-beaker {
  width:60px;margin-left:auto;transition:all .3s;
}
.rl-mixing-beaker.correct .rl-beaker-body { border-color:rgba(0,255,154,0.5);box-shadow:0 0 16px rgba(0,255,154,0.3); }
.rl-mixing-beaker.wrong .rl-beaker-body { border-color:rgba(255,51,85,0.5);box-shadow:0 0 16px rgba(255,51,85,0.2);animation:shake .3s; }
.rl-beaker-body {
  width:60px;height:100px;background:rgba(0,10,20,0.7);
  border:1px solid rgba(0,196,255,0.2);clip-path:polygon(10% 0%,90% 0%,80% 100%,20% 100%);
  overflow:hidden;position:relative;transition:all .4s;
}
.rl-beaker-liquid { position:absolute;bottom:0;left:0;right:0;transition:all .5s; }
.rl-beaker-surface { height:3px;background:rgba(255,255,255,0.3);border-radius:1px; }
.rl-beaker-marks { position:absolute;right:4px;top:0;bottom:0;display:flex;flex-direction:column-reverse; }
.rl-beaker-marks span { font-family:'Share Tech Mono',monospace;font-size:7px;color:var(--c-text3);flex:1;display:flex;align-items:flex-start; }
.rl-beaker-spout { width:10px;height:6px;background:rgba(0,196,255,0.1);border-radius:0 4px 4px 0;margin-left:auto;margin-right:8px; }
.rl-mix-sequence { display:flex;gap:6px;align-items:center;margin-bottom:14px; }
.rl-seq-slot {
  width:48px;height:36px;border:1px solid var(--c-border2);border-radius:3px;
  display:flex;align-items:center;justify-content:center;
  font-family:'Share Tech Mono',monospace;font-size:12px;font-weight:700;color:var(--c-water);
  background:var(--c-bg);transition:all .3s;
}
.rl-seq-slot.filled { background:rgba(0,196,255,0.08);border-color:rgba(0,196,255,0.4); }
.rl-seq-num { color:var(--c-text3);font-size:10px; }
.rl-seq-clear {
  width:30px;height:30px;background:transparent;border:1px solid rgba(255,51,85,0.3);
  color:var(--c-danger);font-size:16px;cursor:pointer;border-radius:3px;
  display:flex;align-items:center;justify-content:center;transition:all .2s;
}
.rl-seq-clear:hover { background:rgba(255,51,85,0.08); }

/* ─── VAULT SCENE ─── */
.rl-vault-door-3d {
  position:absolute;left:50%;top:50%;transform:translate(-60%, -50%);
  width:300px;height:300px;z-index:40;
}
.rl-vd-frame {
  width:300px;height:300px;background:linear-gradient(135deg,#1a2030,#0e1420);
  border:3px solid var(--c-border2);border-radius:8px;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 0 60px rgba(0,0,0,0.9);
  overflow:hidden;position:relative;
}
.rl-vd-door {
  width:260px;height:260px;border-radius:50%;
  background:linear-gradient(135deg,#182030,#0c1420);
  border:2px solid rgba(0,196,255,0.2);
  position:relative;display:flex;align-items:center;justify-content:center;
  transition:transform 1.5s cubic-bezier(.4,0,.2,1);
  transform-style:preserve-3d;
}
.rl-vd-door.swing { transform:perspective(800px) rotateY(-80deg); }
.rl-vd-ring { position:absolute;border-radius:50%; }
.rl-vd-ring.rl-r1 { inset:8px;border:2px solid rgba(0,196,255,0.15); }
.rl-vd-ring.rl-r2 { inset:30px;border:1px solid rgba(0,196,255,0.1); }
.rl-vd-ring.rl-r3 { inset:50px;border:1px solid rgba(0,196,255,0.08); }
.rl-vd-spokes-layer { position:absolute;inset:0;border-radius:50%; }
.rl-vd-spoke { position:absolute;top:50%;left:50%;width:50%;height:1px;background:rgba(0,196,255,0.08);transform-origin:left center; }
.rl-vd-center-disc { width:40px;height:40px;border-radius:50%;background:var(--c-danger);z-index:5;transition:all .6s; }
.rl-vd-center-disc.open { background:var(--c-ok);box-shadow:0 0 20px rgba(0,255,154,0.6); }
.rl-vd-locking-bars { position:absolute;inset:0;border-radius:50%;overflow:hidden; }
.rl-vd-bar { position:absolute;background:linear-gradient(90deg,#1a2030,#2a3040);border:1px solid rgba(0,196,255,0.1);transition:all .6s; }
.rl-bar-1{top:8px;left:20%;right:20%;height:8px;}
.rl-bar-2{bottom:8px;left:20%;right:20%;height:8px;}
.rl-bar-3{left:8px;top:20%;bottom:20%;width:8px;}
.rl-bar-4{right:8px;top:20%;bottom:20%;width:8px;}
.rl-vd-bar.retracted{opacity:0;transform:scale(0.5);}
.rl-vault-interior {
  position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  background:radial-gradient(circle,rgba(0,196,255,0.08),transparent 70%);
  animation:vault-light .5s ease-out;
}
@keyframes vault-light{from{opacity:0;}to{opacity:1;}}
.rl-vault-light { position:absolute;inset:0;background:radial-gradient(circle at center,rgba(0,255,154,0.06),transparent); }
.rl-vault-prize { position:absolute;right:20px;display:flex;flex-direction:column;align-items:center;gap:8px;z-index:10; }
.rl-prize-bottle { width:40px;height:80px;background:rgba(0,196,255,0.2);border:1px solid rgba(0,196,255,0.4);border-radius:4px;display:flex;align-items:center;justify-content:center;font-family:'Orbitron',sans-serif;font-size:18px;font-weight:900;color:var(--c-water); }
.rl-prize-text { font-family:'Share Tech Mono',monospace;font-size:8px;color:var(--c-ok);letter-spacing:1px;text-align:center; }
.rl-vault-clue-display { margin-bottom:16px;display:flex;flex-direction:column;gap:6px; }
.rl-vcd-item { display:flex;align-items:center;gap:10px;padding:6px 10px;background:var(--c-bg);border:1px solid var(--c-border);border-radius:3px; }
.rl-vcd-source { font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--c-text3);letter-spacing:1px;min-width:60px; }
.rl-vcd-value { font-family:'Orbitron',monospace;font-size:13px;color:var(--c-water);letter-spacing:3px; }
.rl-vault-input { justify-content:center; }
.rl-vault-btn { border-color:var(--c-ok);color:var(--c-ok); }
.rl-vault-btn:hover { background:rgba(0,255,154,0.06);box-shadow:0 0 20px rgba(0,255,154,0.1); }

/* ─── WIN SCENE ─── */
.rl-win-scene {
  display:flex;align-items:center;justify-content:center;
  background:radial-gradient(ellipse at center,#071420 0%,var(--c-bg) 70%);
}
.rl-win-particles { position:absolute;inset:0;pointer-events:none;overflow:hidden; }
.rl-wp { position:absolute;border-radius:50%;background:rgba(0,196,255,0.3);animation:wp-rise 5s ease-in infinite; }
@keyframes wp-rise{0%{transform:translateY(100vh);opacity:0.6;}100%{transform:translateY(-20vh);opacity:0;}}
.rl-win-inner { display:flex;flex-direction:column;align-items:center;gap:24px;text-align:center;position:relative;z-index:10; }
.rl-win-stamp { font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:4px;color:var(--c-ok);border:1px solid rgba(0,255,154,0.3);padding:6px 20px;border-radius:20px; }
.rl-win-title { font-family:'Orbitron',sans-serif;font-size:54px;font-weight:900;color:var(--c-text);line-height:1; }
.rl-win-title em { color:var(--c-water);font-style:normal; }
.rl-win-bottle-big { width:80px;height:200px;position:relative;animation:float-bottle 3s ease-in-out infinite; }
@keyframes float-bottle{0%,100%{transform:translateY(0);}50%{transform:translateY(-12px);}}
.rl-wbb-body { width:80px;height:200px;background:linear-gradient(135deg,rgba(0,196,255,0.15),rgba(0,80,140,0.1));border:1px solid rgba(0,196,255,0.25);border-radius:10px;overflow:hidden;position:relative;display:flex;align-items:center;justify-content:center; }
.rl-wbb-label { font-family:'Orbitron',sans-serif;font-size:36px;font-weight:900;color:var(--c-water);position:relative;z-index:2; }
.rl-wbb-bubbles { position:absolute;inset:0; }
.rl-wbb-b { position:absolute;bottom:-10%;border-radius:50%;background:rgba(0,196,255,0.2);border:1px solid rgba(0,196,255,0.3);animation:rise-bubble 3s ease-in infinite; }
.rl-win-flavour { font-size:16px;color:var(--c-text2);max-width:360px;line-height:1.7; }

/* ─── TRANSITIONS ─── */
.rl-scene-fade-enter-active,.rl-scene-fade-leave-active{transition:opacity .4s ease;}
.rl-scene-fade-enter-from,.rl-scene-fade-leave-to{opacity:0;}
.rl-scare-enter-active{transition:all .1s;}
.rl-scare-leave-active{transition:all .3s;}
.rl-scare-enter-from,.rl-scare-leave-to{opacity:0;}
.rl-toast-rise-enter-active{transition:all .3s cubic-bezier(.34,1.56,.64,1);}
.rl-toast-rise-leave-active{transition:all .2s;}
.rl-toast-rise-enter-from,.rl-toast-rise-leave-to{opacity:0;transform:translateX(-50%) translateY(10px);}
</style>
