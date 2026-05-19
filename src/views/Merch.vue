<template>
  <div class="game-shell" @keydown="onKeyDown" @keyup="onKeyUp" tabindex="0" ref="shell">
    <div class="scene">
      <div class="sky-orbit"></div>
      <div class="brand-ring ring-one">KSSS • STANFORD • SAAB •</div>
      <div class="brand-ring ring-two">MERCH ONLY • NO BASIC CLOTHES •</div>

      <div class="hud">
        <div>
          <span>Poäng</span>
          <strong>{{ score }}</strong>
        </div>
        <div>
          <span>Merch-mätare</span>
          <strong>{{ merchMeter }}%</strong>
        </div>
        <div>
          <span>Tid</span>
          <strong>{{ timeLeft }}s</strong>
        </div>
        <div>
          <span>Combo</span>
          <strong>{{ comboName }}</strong>
        </div>
      </div>

      <div class="warning" v-if="message">{{ message }}</div>

      <div class="playfield">
        <div class="runway-grid"></div>
        <div class="depth-line" v-for="n in 12" :key="n" :style="{ '--i': n }"></div>

        <div
          v-for="item in items"
          :key="item.id"
          class="falling-object"
          :class="[item.kind, item.brand, item.shape, { collected: item.hit }]"
          :style="itemStyle(item)"
        >
          <div class="object-tilt" :style="{ '--spin': item.spin + 'deg' }">
            <div v-if="item.shape === 'hoodie'" class="cloth hoodie-shape">
              <div class="hood"></div>
              <div class="sleeve left-sleeve"></div>
              <div class="sleeve right-sleeve"></div>
              <div class="body-panel">
                <b>{{ item.short }}</b>
                <span></span>
              </div>
              <div class="pocket"></div>
            </div>

            <div v-else-if="item.shape === 'polo'" class="cloth polo-shape">
              <div class="collar left-collar"></div>
              <div class="collar right-collar"></div>
              <div class="sleeve left-sleeve"></div>
              <div class="sleeve right-sleeve"></div>
              <div class="body-panel">
                <b>{{ item.short }}</b>
                <span></span>
              </div>
            </div>

            <div v-else-if="item.shape === 'cap'" class="cap-shape">
              <div class="cap-dome"><b>{{ item.short }}</b></div>
              <div class="cap-brim"></div>
            </div>

            <div v-else-if="item.shape === 'jacket'" class="cloth jacket-shape">
              <div class="sleeve left-sleeve"></div>
              <div class="sleeve right-sleeve"></div>
              <div class="zip"></div>
              <div class="body-panel">
                <b>{{ item.short }}</b>
                <span></span>
              </div>
            </div>

            <div v-else-if="item.shape === 'lanyard'" class="lanyard-shape">
              <div class="strap"></div>
              <div class="badge"><b>{{ item.short }}</b></div>
            </div>

            <div v-else-if="item.shape === 'key'" class="key-shape">
              <div class="key-head"><b>{{ item.short }}</b></div>
              <div class="key-stem"></div>
              <div class="key-teeth"></div>
            </div>

            <div v-else class="basic-shirt-shape">
              <div class="bad-sleeve left-sleeve"></div>
              <div class="bad-sleeve right-sleeve"></div>
              <div class="bad-body"><b>{{ item.short }}</b></div>
              <div class="basic-warning">NO LOGO</div>
            </div>

            <small class="object-label">
              <b>{{ item.kind === 'bad' ? 'INTE MERCH' : 'MERCH' }}</b>
              {{ item.label }}
            </small>
          </div>
        </div>

        <div class="player-shadow" :style="playerShadowStyle"></div>
        <div class="player" :style="playerStyle">
          <div class="head">😎</div>
          <div class="torso" :class="outfitClass">
            <span>{{ currentOutfit }}</span>
          </div>
          <div class="legs"></div>
          <div class="aura" v-if="shield > 0"></div>
        </div>
      </div>

      <div class="controls-card">
        <b>Styrning:</b> ← → eller A/D. Samla KSSS, Stanford och Saab. Undvik obrandade plagg.
      </div>

      <div class="overlay" v-if="state !== 'playing'">
        <div class="modal">
          <h1>MERCH MASTER</h1>
          <p class="subtitle">KSSS • Stanford • Saab Edition</p>
          <p v-if="state === 'idle'">
            Han har bara tre tillåtna klädmärken. Rädda hans identitet innan den obrandade hoodien tar över.
          </p>
          <p v-else>
            {{ endText }}<br />Slutpoäng: <b>{{ score }}</b>
          </p>
          <button @click="startGame">{{ state === 'idle' ? 'Starta merch-kaos' : 'Spela igen' }}</button>
          <div class="rules">
            <span>✅ KSSS / Stanford / Saab</span>
            <span>❌ Basic hoodie / anonym t-shirt</span>
            <span>⚡ Saab Turbo, Stanford Aura, KSSS Segelvind</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "MerchMasterGame",
  data() {
    return {
      state: "idle",
      score: 0,
      merchMeter: 100,
      timeLeft: 60,
      playerX: 50,
      velocity: 0,
      keys: {},
      items: [],
      nextId: 1,
      tick: null,
      spawnTick: null,
      clockTick: null,
      difficulty: 1,
      shield: 0,
      outfit: { ksss: false, stanford: false, saab: false },
      message: "",
      messageTimer: null,
      endText: "",
    };
  },
  computed: {
    comboName() {
      const count = Object.values(this.outfit).filter(Boolean).length;
      if (count === 3) return "ULTIMATE BRAND SYNERGY";
      if (count === 2) return "Dubbel merch";
      if (count === 1) return "På gång";
      return "Sårbar";
    },
    currentOutfit() {
      if (this.outfit.ksss && this.outfit.stanford && this.outfit.saab) return "KSSS+STANFORD+SAAB";
      if (this.outfit.ksss) return "KSSS";
      if (this.outfit.stanford) return "STANFORD";
      if (this.outfit.saab) return "SAAB";
      return "BASIC?";
    },
    outfitClass() {
      return {
        ksssFit: this.outfit.ksss,
        stanfordFit: this.outfit.stanford,
        saabFit: this.outfit.saab,
      };
    },
    playerStyle() {
      return { left: `${this.playerX}%` };
    },
    playerShadowStyle() {
      return { left: `${this.playerX}%` };
    },
  },
  mounted() {
    this.$refs.shell.focus();
  },
  beforeUnmount() {
    this.stopLoops();
  },
  methods: {
    startGame() {
      this.stopLoops();
      this.state = "playing";
      this.score = 0;
      this.merchMeter = 100;
      this.timeLeft = 60;
      this.playerX = 50;
      this.velocity = 0;
      this.items = [];
      this.difficulty = 1;
      this.shield = 0;
      this.outfit = { ksss: false, stanford: false, saab: false };
      this.message = "MERCH-KAOS STARTAR!";
      this.$nextTick(() => this.$refs.shell.focus());

      this.tick = setInterval(this.gameLoop, 16);
      this.spawnTick = setInterval(this.spawnItem, 1250);
      this.clockTick = setInterval(() => {
        this.timeLeft--;
        this.merchMeter = Math.max(0, this.merchMeter - 2);
        this.difficulty += 0.055;
        if (this.shield > 0) this.shield--;
        if (this.timeLeft <= 0) this.winGame();
        if (this.merchMeter <= 0) this.loseGame("IDENTITETEN KOLLAPSADE. En neutral hoodie vann.");
      }, 1000);
    },
    stopLoops() {
      clearInterval(this.tick);
      clearInterval(this.spawnTick);
      clearInterval(this.clockTick);
      clearTimeout(this.messageTimer);
    },
    onKeyDown(e) {
      this.keys[e.key.toLowerCase()] = true;
    },
    onKeyUp(e) {
      this.keys[e.key.toLowerCase()] = false;
    },
    gameLoop() {
      if (this.state !== "playing") return;
      const left = this.keys.arrowleft || this.keys.a;
      const right = this.keys.arrowright || this.keys.d;
      if (left) this.velocity -= 0.38;
      if (right) this.velocity += 0.38;
      this.velocity *= 0.86;
      this.playerX = Math.max(7, Math.min(93, this.playerX + this.velocity));

      this.items = this.items
        .map((item) => ({ ...item, z: item.z + item.speed * (0.28 + this.difficulty * 0.18), spin: item.spin + item.spinSpeed }))
        .filter((item) => item.z < 112);

      this.items.forEach(this.checkCollision);
    },
    spawnItem() {
      if (this.state !== "playing") return;
      const roll = Math.random();
      const goodBrands = [
        { brand: "ksss", label: "KSSS Keps", short: "KSSS", shape: "cap" },
        { brand: "ksss", label: "KSSS Piké", short: "KSSS", shape: "polo" },
        { brand: "stanford", label: "Stanford Hoodie", short: "STAN", shape: "hoodie" },
        { brand: "stanford", label: "Stanford College-tröja", short: "STAN", shape: "polo" },
        { brand: "saab", label: "Saab Jacka", short: "SAAB", shape: "jacket" },
        { brand: "saab", label: "Saab Nyckelband", short: "SAAB", shape: "lanyard" },
      ];
      const badItems = [
        { brand: "basic", label: "Basic Hoodie", short: "???", shape: "hoodie" },
        { brand: "basic", label: "No Logo T-shirt", short: "", shape: "shirt" },
        { brand: "basic", label: "Fel Merch", short: "FAKE", shape: "polo" },
        { brand: "basic", label: "Anonym Jacka", short: "NO", shape: "jacket" },
      ];
      const powerups = [
        { brand: "turbo", label: "Saab Turbo-nyckel", short: "TURBO", shape: "key" },
        { brand: "aura", label: "Stanford Aura-badge", short: "AURA", shape: "lanyard" },
        { brand: "wind", label: "KSSS Segelvind-keps", short: "WIND", shape: "cap" },
      ];
      const source = roll < 0.58 ? goodBrands : roll < 0.9 ? badItems : powerups;
      const chosen = source[Math.floor(Math.random() * source.length)];
      this.items.push({
        id: this.nextId++,
        x: 10 + Math.random() * 80,
        z: -55,
        speed: 0.08 + Math.random() * 0.06,
        spin: 0,
        spinSpeed: 0,
        kind: source === badItems ? "bad" : source === powerups ? "power" : "good",
        ...chosen,
      });
    },
    checkCollision(item) {
      if (item.hit || item.z < 82 || item.z > 101) return;
      const distance = Math.abs(item.x - this.playerX);
      if (distance > 8) return;
      item.hit = true;

      if (item.kind === "bad") {
        if (this.shield > 0) {
          this.score += 50;
          this.showMessage("Stanford Aura blockerade en modekatastrof!");
        } else {
          this.merchMeter -= 24;
          this.score = Math.max(0, this.score - 120);
          this.showMessage("MODEKRIS! Obrandat plagg träffade honom.");
        }
        return;
      }

      if (item.kind === "power") {
        this.score += 160;
        if (item.brand === "turbo") {
          this.velocity += this.playerX < 50 ? 7 : -7;
          this.showMessage("SAAB TURBO! Okontrollerbar acceleration!");
        }
        if (item.brand === "aura") {
          this.shield = 7;
          this.showMessage("STANFORD AURA! Akademisk sköld aktiverad.");
        }
        if (item.brand === "wind") {
          this.items = this.items.filter((i) => i.kind !== "bad" || i.z > 100);
          this.showMessage("KSSS SEGELVIND blåste bort basic-kläderna!");
        }
        return;
      }

      this.outfit[item.brand] = true;
      this.score += 100 + Object.values(this.outfit).filter(Boolean).length * 60;
      this.merchMeter = Math.min(100, this.merchMeter + 12);
      this.showMessage(`${item.label.toUpperCase()} SÄKRAD!`);

      if (Object.values(this.outfit).every(Boolean)) {
        this.score += 500;
        this.outfit = { ksss: false, stanford: false, saab: false };
        this.showMessage("ULTIMATE BRAND SYNERGY! +500");
      }
    },
    itemStyle(item) {
      const scale = 0.42 + item.z / 110;
      const y = item.z;
      return {
        left: `${item.x}%`,
        top: `${y * 0.82}%`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity: Math.min(1, 0.25 + item.z / 35),
      };
    },
    showMessage(text) {
      this.message = text;
      clearTimeout(this.messageTimer);
      this.messageTimer = setTimeout(() => (this.message = ""), 1150);
    },
    winGame() {
      this.endText = this.score >= 2600 ? "LEGENDARISK MERCH-DAG. Ingen basic outfit överlevde." : "Du överlevde, men garderoben är fortfarande misstänksam.";
      this.state = "ended";
      this.stopLoops();
    },
    loseGame(text) {
      this.endText = text;
      this.state = "ended";
      this.stopLoops();
    },
  },
};
</script>

<style scoped>
* { box-sizing: border-box; }
.game-shell {
  width: 100%;
  min-height: 100vh;
  outline: none;
  overflow: hidden;
  background: radial-gradient(circle at 50% 20%, #30415f, #0b1020 52%, #050713);
  color: white;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.scene {
  position: relative;
  min-height: 100vh;
  perspective: 900px;
  overflow: hidden;
}
.sky-orbit {
  position: absolute;
  width: 900px;
  height: 900px;
  border: 2px dashed rgba(255,255,255,.12);
  border-radius: 50%;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) rotateX(70deg);
  animation: orbit 18s linear infinite;
}
.brand-ring {
  position: absolute;
  left: 50%;
  top: 18%;
  width: 780px;
  text-align: center;
  margin-left: -390px;
  letter-spacing: .5rem;
  font-weight: 900;
  opacity: .16;
  transform: rotateX(62deg);
  animation: slideText 9s linear infinite;
  white-space: nowrap;
}
.ring-two { top: 76%; animation-duration: 12s; opacity: .12; }
.hud {
  position: absolute;
  z-index: 10;
  left: 24px;
  right: 24px;
  top: 18px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.hud div, .controls-card {
  background: rgba(255,255,255,.12);
  border: 1px solid rgba(255,255,255,.18);
  border-radius: 18px;
  padding: 12px 14px;
  backdrop-filter: blur(12px);
  box-shadow: 0 20px 50px rgba(0,0,0,.22);
}
.hud span { display: block; font-size: 12px; opacity: .72; }
.hud strong { font-size: clamp(16px, 2vw, 26px); }
.warning {
  position: absolute;
  z-index: 20;
  left: 50%;
  top: 104px;
  transform: translateX(-50%);
  padding: 10px 20px;
  border-radius: 999px;
  background: rgba(255,255,255,.9);
  color: #0d1121;
  font-weight: 900;
  box-shadow: 0 10px 40px rgba(255,255,255,.18);
  animation: pop .32s ease-out;
}
.playfield {
  position: absolute;
  left: 50%;
  bottom: -34%;
  width: min(760px, 94vw);
  height: 118vh;
  transform: translateX(-50%) rotateX(58deg);
  transform-origin: bottom center;
  border-radius: 38px 38px 0 0;
  background: linear-gradient(180deg, rgba(255,255,255,.13), rgba(255,255,255,.045));
  border: 1px solid rgba(255,255,255,.16);
  box-shadow: 0 -30px 120px rgba(80, 130, 255, .15), inset 0 0 80px rgba(255,255,255,.06);
  overflow: hidden;
}
.runway-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px);
  background-size: 100% 9%, 12% 100%;
  animation: gridMove .7s linear infinite;
}
.depth-line {
  position: absolute;
  left: calc(var(--i) * 8%);
  top: 0;
  width: 1px;
  height: 100%;
  background: linear-gradient(transparent, rgba(255,255,255,.18));
  transform-origin: bottom;
}
.player, .item, .player-shadow {
  position: absolute;
  transform-style: preserve-3d;
}
.player {
  bottom: 7%;
  z-index: 5;
  width: 86px;
  height: 150px;
  transform: translateX(-50%) rotateX(-58deg);
  transition: left .05s linear;
}
.head {
  width: 58px;
  height: 58px;
  margin: 0 auto -4px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 38px;
  background: linear-gradient(145deg, #ffdca8, #d88d4a);
  box-shadow: 0 10px 24px rgba(0,0,0,.3);
}
.torso {
  height: 74px;
  border-radius: 18px 18px 10px 10px;
  display: grid;
  place-items: center;
  text-align: center;
  font-size: 10px;
  font-weight: 1000;
  padding: 7px;
  background: linear-gradient(145deg, #777, #222);
  border: 3px solid rgba(255,255,255,.28);
  box-shadow: inset 0 0 24px rgba(255,255,255,.12), 0 20px 34px rgba(0,0,0,.35);
}
.ksssFit { background: linear-gradient(145deg, #0b4d8c, #77c9ff); }
.stanfordFit { background: linear-gradient(145deg, #8c1515, #ff7777); }
.saabFit { background: linear-gradient(145deg, #121a3a, #b9d7ff); }
.legs {
  width: 62px;
  height: 28px;
  margin: -2px auto 0;
  border-radius: 0 0 18px 18px;
  background: #101827;
}
.aura {
  position: absolute;
  inset: -20px;
  border-radius: 40px;
  border: 3px solid rgba(255,255,255,.75);
  box-shadow: 0 0 34px rgba(255,255,255,.58);
  animation: pulse .55s infinite alternate;
}
.player-shadow {
  bottom: 5%;
  width: 95px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0,0,0,.38);
  filter: blur(8px);
  transform: translateX(-50%);
}
.item {
  width: 96px;
  height: 96px;
  z-index: 4;
}
.falling-object {
  position: absolute;
  width: 110px;
  height: 110px;
  z-index: 4;
  transform-style: preserve-3d;
  filter: drop-shadow(0 20px 18px rgba(0,0,0,.35));
}
.object-tilt {
  position: relative;
  width: 100%;
  height: 100%;
  transform: rotateX(-58deg);
  animation: floatStraight 1.1s ease-in-out infinite alternate;
}
.object-label {
  position: absolute;
  left: 50%;
  bottom: -30px;
  transform: translateX(-50%);
  white-space: nowrap;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(5,7,19,.86);
  color: white;
  border: 1px solid rgba(255,255,255,.22);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: .02em;
  display: grid;
  gap: 1px;
  text-align: center;
}
.object-label b {
  font-size: 11px;
  letter-spacing: .08em;
}
.good .object-label,
.bad .object-label,
.power .object-label {
  background: rgba(5,7,19,.88);
  border-color: rgba(255,255,255,.24);
}
.object-label b {
  color: rgba(255,255,255,.9);
}
.cloth, .cap-shape, .lanyard-shape, .key-shape, .basic-shirt-shape {
  position: absolute;
  inset: 8px;
}
.body-panel, .bad-body {
  position: absolute;
  left: 25%;
  top: 28%;
  width: 50%;
  height: 58%;
  border-radius: 10px 10px 16px 16px;
  display: grid;
  place-items: center;
  font-size: 15px;
  font-weight: 1000;
  text-shadow: 0 2px 2px rgba(0,0,0,.3);
  box-shadow: inset 0 0 18px rgba(255,255,255,.22), 0 8px 18px rgba(0,0,0,.28);
}
.body-panel span {
  position: absolute;
  bottom: 12px;
  width: 28px;
  height: 8px;
  border-radius: 999px;
  background: rgba(255,255,255,.38);
}
.sleeve, .bad-sleeve {
  position: absolute;
  top: 36%;
  width: 28%;
  height: 22%;
  border-radius: 14px;
  transform-origin: center;
  box-shadow: inset 0 0 12px rgba(255,255,255,.15);
}
.left-sleeve { left: 8%; transform: rotate(28deg); }
.right-sleeve { right: 8%; transform: rotate(-28deg); }
.hood {
  position: absolute;
  left: 31%;
  top: 6%;
  width: 38%;
  height: 30%;
  border-radius: 50% 50% 34% 34%;
  border: 6px solid currentColor;
  background: rgba(255,255,255,.08);
}
.pocket {
  position: absolute;
  left: 34%;
  bottom: 16%;
  width: 32%;
  height: 15%;
  border-radius: 4px 4px 14px 14px;
  background: rgba(0,0,0,.18);
}
.collar {
  position: absolute;
  top: 20%;
  width: 22%;
  height: 18%;
  background: rgba(255,255,255,.2);
  clip-path: polygon(0 0, 100% 0, 50% 100%);
  z-index: 2;
}
.left-collar { left: 30%; transform: rotate(18deg); }
.right-collar { right: 30%; transform: rotate(-18deg); }
.zip {
  position: absolute;
  left: calc(50% - 2px);
  top: 28%;
  width: 4px;
  height: 58%;
  background: rgba(255,255,255,.55);
  z-index: 3;
  border-radius: 999px;
}
.cap-dome {
  position: absolute;
  left: 20%;
  top: 18%;
  width: 60%;
  height: 43%;
  border-radius: 55% 55% 18% 18%;
  display: grid;
  place-items: center;
  font-weight: 1000;
  box-shadow: inset 0 0 18px rgba(255,255,255,.2), 0 10px 22px rgba(0,0,0,.3);
}
.cap-brim {
  position: absolute;
  left: 31%;
  top: 58%;
  width: 58%;
  height: 18%;
  border-radius: 50%;
  transform: rotate(8deg);
  box-shadow: 0 8px 14px rgba(0,0,0,.28);
}
.lanyard-shape .strap {
  position: absolute;
  left: 30%;
  top: 5%;
  width: 40%;
  height: 60%;
  border: 8px solid currentColor;
  border-bottom: 0;
  border-radius: 50% 50% 0 0;
}
.badge {
  position: absolute;
  left: 24%;
  bottom: 8%;
  width: 52%;
  height: 40%;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 1000;
  box-shadow: inset 0 0 18px rgba(255,255,255,.2), 0 8px 18px rgba(0,0,0,.32);
}
.key-head {
  position: absolute;
  left: 10%;
  top: 22%;
  width: 42%;
  height: 42%;
  border-radius: 50%;
  border: 9px solid currentColor;
  display: grid;
  place-items: center;
  font-size: 9px;
  font-weight: 1000;
}
.key-stem {
  position: absolute;
  left: 48%;
  top: 42%;
  width: 38%;
  height: 12%;
  border-radius: 999px;
  background: currentColor;
}
.key-teeth {
  position: absolute;
  right: 12%;
  top: 51%;
  width: 18%;
  height: 22%;
  border-left: 10px solid currentColor;
  border-bottom: 10px solid currentColor;
}
.basic-shirt-shape .bad-body {
  background: linear-gradient(145deg, #565656, #181818);
  color: white;
  left: 23%;
  width: 54%;
  top: 25%;
  height: 62%;
}
.basic-warning {
  position: absolute;
  left: 50%;
  top: 58%;
  transform: translateX(-50%) rotate(-8deg);
  color: #fff;
  background: rgba(255,0,60,.9);
  padding: 3px 6px;
  border-radius: 5px;
  font-size: 9px;
  font-weight: 1000;
  z-index: 4;
}
.good,
.bad,
.power {
  filter: drop-shadow(0 18px 16px rgba(0,0,0,.28));
}
.good::before,
.bad::before,
.power::before {
  position: absolute;
  right: 6px;
  top: 6px;
  z-index: 9;
  padding: 5px 8px;
  border-radius: 999px;
  background: rgba(255,255,255,.9);
  color: #050713;
  font-size: 10px;
  font-weight: 1000;
  border: 1px solid rgba(0,0,0,.12);
}
.good::before,
.power::before {
  content: "MERCH";
}
.bad::before {
  content: "INTE";
}
.ksss { color: #82d8ff; }
.ksss .body-panel, .ksss .cap-dome, .ksss .cap-brim, .ksss .badge { background: linear-gradient(145deg, #0b4d8c, #8ee4ff); color: white; }
.ksss .sleeve { background: linear-gradient(145deg, #0b4d8c, #4bb7ee); }
.stanford { color: #ff9b9b; }
.stanford .body-panel, .stanford .cap-dome, .stanford .cap-brim, .stanford .badge { background: linear-gradient(145deg, #8c1515, #ff6969); color: white; }
.stanford .sleeve { background: linear-gradient(145deg, #6d1010, #df4141); }
.saab { color: #c9dcff; }
.saab .body-panel, .saab .cap-dome, .saab .cap-brim, .saab .badge { background: linear-gradient(145deg, #101a42, #85a9e8); color: white; }
.saab .sleeve { background: linear-gradient(145deg, #101a42, #5d7fbe); }
.basic { color: #777; animation: panicGlow .35s infinite alternate; }
.basic .body-panel, .basic .cap-dome, .basic .cap-brim, .basic .badge { background: linear-gradient(145deg, #3d3d3d, #111); color: white; }
.basic .sleeve, .bad-sleeve { background: linear-gradient(145deg, #333, #111); }
.turbo, .aura, .wind { color: #ffe769; }
.turbo .key-head, .turbo .key-stem, .turbo .key-teeth { color: #ffd24c; }
.aura .badge, .wind .cap-dome, .wind .cap-brim { background: linear-gradient(145deg, #fff6a5, #ffad32); color: #221300; }
.collected { animation: collectBurst .2s ease-out forwards; }
.controls-card {
  position: absolute;
  z-index: 12;
  left: 50%;
  bottom: 20px;
  transform: translateX(-50%);
  width: min(720px, calc(100vw - 32px));
  text-align: center;
  color: rgba(255,255,255,.86);
}
.overlay {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  background: radial-gradient(circle, rgba(11,16,32,.55), rgba(3,5,12,.94));
  padding: 20px;
}
.modal {
  width: min(680px, 94vw);
  border-radius: 32px;
  padding: 34px;
  text-align: center;
  background: rgba(255,255,255,.12);
  border: 1px solid rgba(255,255,255,.22);
  box-shadow: 0 30px 120px rgba(0,0,0,.45);
  backdrop-filter: blur(18px);
}
h1 {
  margin: 0;
  font-size: clamp(42px, 8vw, 88px);
  line-height: .9;
  letter-spacing: -.07em;
  text-shadow: 0 12px 40px rgba(0,0,0,.4);
}
.subtitle { font-weight: 900; letter-spacing: .18em; opacity: .78; }
.modal p { font-size: 18px; line-height: 1.6; color: rgba(255,255,255,.82); }
button {
  border: 0;
  border-radius: 999px;
  padding: 16px 28px;
  font-size: 18px;
  font-weight: 1000;
  cursor: pointer;
  color: #0b1020;
  background: white;
  box-shadow: 0 18px 45px rgba(255,255,255,.18);
  transition: transform .15s ease, box-shadow .15s ease;
}
button:hover { transform: translateY(-2px) scale(1.03); box-shadow: 0 22px 55px rgba(255,255,255,.25); }
.rules {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 24px;
}
.rules span {
  border-radius: 999px;
  padding: 9px 13px;
  background: rgba(255,255,255,.12);
  font-weight: 800;
  font-size: 13px;
}
@keyframes gridMove { from { background-position: 0 0; } to { background-position: 0 9%; } }
@keyframes orbit { to { transform: translate(-50%, -50%) rotateX(70deg) rotateZ(360deg); } }
@keyframes slideText { to { translate: -120px 0; } }
@keyframes pop { from { scale: .7; opacity: 0; } to { scale: 1; opacity: 1; } }
@keyframes pulse { from { opacity: .45; scale: .96; } to { opacity: 1; scale: 1.04; } }
@keyframes danger { from { filter: brightness(.7); } to { filter: brightness(1.35); } }
@keyframes floatStraight {
  from { translate: 0 0; }
  to { translate: 0 -4px; }
}
  to { translate: 3px -4px; }

@keyframes panicGlow {
  from { filter: drop-shadow(0 0 4px rgba(255,0,70,.35)); }
  to { filter: drop-shadow(0 0 18px rgba(255,0,70,.9)); }
}
@keyframes collectBurst {
  to { scale: 1.8; opacity: 0; filter: blur(5px); }
}
@media (max-width: 720px) {
  .hud { grid-template-columns: repeat(2, 1fr); left: 12px; right: 12px; }
  .warning { top: 168px; width: calc(100% - 28px); text-align: center; }
  .playfield { height: 70vh; }
  .controls-card { font-size: 13px; }
}
</style>
