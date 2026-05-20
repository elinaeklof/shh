<script setup>
import { useRouter } from 'vue-router'
import { ref, onMounted, onBeforeUnmount } from 'vue'

const router = useRouter()

const envelopeOpen = ref(false)
const showInviteCard = ref(false)

function beginGame() {
  router.push('/')
}

function openEnvelope() {
  if (envelopeOpen.value) return

  envelopeOpen.value = true

  setTimeout(() => {
    showInviteCard.value = true
  }, 3100)
}

function enterExperience() {
  router.push('/rules')
}

let balloonAnimationId
let cakeAnimationId

let resizeBalloons
let resizeCake

onMounted(() => {
  /**
   * HERO BALLOONS
   */
  const balloonCanvas = document.getElementById('birthday-canvas')
  const balloonCtx = balloonCanvas.getContext('2d')

  let balloonWidth
  let balloonHeight
  let balloonFrames = 0
  let balloons = []

  function random(min, max) {
    return Math.random() * (max - min) + min
  }

  resizeBalloons = function () {
    balloonWidth = balloonCanvas.width = window.innerWidth
    balloonHeight = balloonCanvas.height = window.innerHeight
  }

  function createBalloon() {
    return {
      x: random(80, balloonWidth - 80),
      y: balloonHeight + random(80, 220),
      size: random(34, 72),
      speed: random(0.45, 1.15),
      sway: random(20, 54),
      phase: random(0, Math.PI * 2),
      color: Math.random() > 0.5 ? 'blue' : 'champagne',
    }
  }

  function drawBalloon(balloon) {
    const swayX =
      Math.sin(balloonFrames * 0.018 + balloon.phase) * balloon.sway

    const x = balloon.x + swayX
    const y = balloon.y
    const r = balloon.size

    const gradient = balloonCtx.createRadialGradient(
      x - r * 0.35,
      y - r * 0.55,
      0,
      x,
      y,
      r * 1.4
    )

    if (balloon.color === 'blue') {
      gradient.addColorStop(0, 'rgba(190, 210, 255, 0.82)')
      gradient.addColorStop(0.45, 'rgba(92, 128, 210, 0.48)')
      gradient.addColorStop(1, 'rgba(22, 34, 70, 0.34)')
    } else {
      gradient.addColorStop(0, 'rgba(255, 235, 190, 0.75)')
      gradient.addColorStop(0.45, 'rgba(205, 170, 110, 0.45)')
      gradient.addColorStop(1, 'rgba(80, 55, 25, 0.28)')
    }

    balloonCtx.fillStyle = gradient

    balloonCtx.beginPath()
    balloonCtx.ellipse(x, y, r * 0.72, r, 0, 0, Math.PI * 2)
    balloonCtx.fill()

    balloonCtx.beginPath()
    balloonCtx.moveTo(x - r * 0.12, y + r * 0.95)
    balloonCtx.lineTo(x, y + r * 1.16)
    balloonCtx.lineTo(x + r * 0.12, y + r * 0.95)
    balloonCtx.closePath()
    balloonCtx.fill()

    balloonCtx.strokeStyle = 'rgba(255,255,255,.16)'
    balloonCtx.lineWidth = 1

    balloonCtx.beginPath()
    balloonCtx.moveTo(x, y + r * 1.15)

    for (let i = 0; i < 90; i++) {
      const yy = y + r * 1.15 + i * 3
      const xx =
        x +
        Math.sin(i * 0.18 + balloonFrames * 0.025 + balloon.phase) * 10

      balloonCtx.lineTo(xx, yy)
    }

    balloonCtx.stroke()
  }

  function animateBalloons() {
    balloonFrames++

    balloonCtx.clearRect(0, 0, balloonWidth, balloonHeight)

    if (balloonFrames % 90 === 0 && balloons.length < 18) {
      balloons.push(createBalloon())
    }

    balloons.forEach((balloon) => {
      balloon.y -= balloon.speed

      if (balloon.y < -180) {
        Object.assign(balloon, createBalloon())
      }

      drawBalloon(balloon)
    })

    balloonAnimationId = requestAnimationFrame(animateBalloons)
  }

  resizeBalloons()
  balloons = Array.from({ length: 10 }, createBalloon)
  animateBalloons()

  window.addEventListener('resize', resizeBalloons)

  /**
   * EDITORIAL CAKE
   */
  const cakeCanvas = document.getElementById('cake-canvas')
  const cakeCtx = cakeCanvas.getContext('2d')

  let cakeW
  let cakeH
  let time = 0

  resizeCake = function () {
    cakeW = cakeCanvas.width = window.innerWidth
    cakeH = cakeCanvas.height = window.innerHeight
  }

  function roundedCake(x, y, w, h, radius = 10) {
    const g = cakeCtx.createLinearGradient(x, y, x, y + h)

    g.addColorStop(0, '#ffffff')
    g.addColorStop(0.55, '#e5ddd1')
    g.addColorStop(1, '#bcb09d')

    cakeCtx.save()

    cakeCtx.shadowColor = 'rgba(20,20,20,.14)'
    cakeCtx.shadowBlur = 40
    cakeCtx.shadowOffsetY = 24

    cakeCtx.beginPath()
    cakeCtx.roundRect(x, y, w, h, radius)

    cakeCtx.fillStyle = g
    cakeCtx.fill()

    cakeCtx.restore()

    cakeCtx.beginPath()
    cakeCtx.roundRect(x, y, w, h * 0.28, radius)

    cakeCtx.fillStyle = 'rgba(255,255,255,.12)'
    cakeCtx.fill()
  }

  function drawCandle(x, y, h = 62) {
    cakeCtx.save()

    cakeCtx.translate(x, y)

    cakeCtx.fillStyle = 'rgba(30,30,35,.78)'

    cakeCtx.beginPath()
    cakeCtx.roundRect(-3, 0, 6, h, 4)

    cakeCtx.fill()

    const flame = cakeCtx.createRadialGradient(
      0,
      -13,
      0,
      0,
      -13,
      24
    )

    flame.addColorStop(0, 'rgba(255,255,225,1)')
    flame.addColorStop(.36, 'rgba(255,190,80,.85)')
    flame.addColorStop(1, 'rgba(255,120,30,0)')

    cakeCtx.beginPath()
    cakeCtx.ellipse(
      Math.sin(time * 0.08) * 1.5,
      -13,
      10,
      18,
      0,
      0,
      Math.PI * 2
    )

    cakeCtx.fillStyle = flame
    cakeCtx.fill()

    cakeCtx.restore()
  }

  function drawEditorialCake() {
    time++

    cakeCtx.clearRect(0, 0, cakeW, cakeH)

    const bg = cakeCtx.createLinearGradient(0, 0, 0, cakeH)

    bg.addColorStop(0, '#f5f1eb')
    bg.addColorStop(1, '#ebe4d9')

    cakeCtx.fillStyle = bg
    cakeCtx.fillRect(0, 0, cakeW, cakeH)

    const cx = cakeW / 2
    const baseY = cakeH * 0.66

    roundedCake(cx - 230, baseY - 20, 460, 92, 10)
    roundedCake(cx - 150, baseY - 110, 300, 82, 8)
    roundedCake(cx - 82, baseY - 188, 164, 74, 6)

    cakeCtx.strokeStyle = 'rgba(20,22,29,.18)'
    cakeCtx.lineWidth = 1

    for (let i = 0; i < 5; i++) {
      cakeCtx.beginPath()

      cakeCtx.moveTo(cx - 210, baseY - 6 + i * 16)
      cakeCtx.lineTo(cx + 210, baseY - 6 + i * 16)

      cakeCtx.stroke()
    }

    drawCandle(cx, baseY - 255)

    cakeAnimationId = requestAnimationFrame(drawEditorialCake)
  }

  resizeCake()
  drawEditorialCake()

  window.addEventListener('resize', resizeCake)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(balloonAnimationId)
  cancelAnimationFrame(cakeAnimationId)

  window.removeEventListener('resize', resizeBalloons)
  window.removeEventListener('resize', resizeCake)
})
</script>

<template>
  <main class="start-view">
    <!-- HERO -->
    <section class="birthday-hero">
      <canvas id="birthday-canvas"></canvas>

      <div class="birthday-text">
        <p>A private birthday experience</p>

        <h1>Happy Birthday</h1>

        <span>scroll to continue</span>
      </div>
    </section>

    <!-- CAKE -->
    <section class="cake-section">
      <canvas id="cake-canvas"></canvas>

      <div class="cake-text">
        <p>A small celebration</p>

        <h2>
          before the<br />
          invitation
        </h2>

        <span>keep scrolling</span>
      </div>
    </section>

    <section class="doodle-section">
  <div class="doodle-background-glow"></div>

  <div class="doodle-card">
    <svg viewBox="0 0 900 600" class="doodle-svg">
      
      <!-- TEXT -->
      <text x="150" y="80" class="doodle-text big">
        YOU STILL LOOK 20
      </text>


      <text x="575" y="190" class="doodle-text small-1 rotate-one">
        from a distance
      </text>

      <text x="575" y="470" class="doodle-text small-2 rotate-two">
        in the dark
      </text>

      <!-- BALLOON -->
      <path
        d="M135 310
          C90 245, 155 215, 170 275
          C176 302, 150 322, 135 310Z"
        class="doodle-line"
      />

      <path
        d="M154 322
           C132 350, 158 370, 138 430"
        class="doodle-line balloon-string"
      />

      <!-- PERSON -->
      <circle cx="315" cy="305" r="68" class="doodle-line" />

      <circle cx="292" cy="292" r="4" class="doodle-fill" />
      <circle cx="337" cy="292" r="4" class="doodle-fill" />

      <path
        d="M292 332 C310 344, 330 343, 344 328"
        class="doodle-line"
      />

      <!-- PARTY HAT -->
      <path
        d="M275 240 L320 145 L365 240"
        class="doodle-line"
      />

      <path d="M320 145 L320 120" class="doodle-line sparkle-line" />
      <path d="M320 145 L300 118" class="doodle-line sparkle-line" />
      <path d="M320 145 L342 118" class="doodle-line sparkle-line" />

      <!-- BODY -->
      <path d="M315 375 L300 500" class="doodle-line" />
      <path d="M300 430 L215 390" class="doodle-line" />
      <path d="M330 430 L405 395" class="doodle-line" />

      <!-- GIFT -->
      <rect
        x="410"
        y="375"
        width="55"
        height="55"
        rx="3"
        class="doodle-line"
      />

      <!-- vertikal linje -->
      <path d="M438 375 L438 430" class="doodle-line" />

      <!-- horisontell linje -->
      <path d="M410 402 L465 402" class="doodle-line" />

      <!-- vänster rosett -->
      <path
        d="M438 375
          C417 342, 415 378, 438 375"
        class="doodle-line"
      />

      <!-- höger rosett -->
      <path
        d="M438 375
          C462 342, 464 378, 438 375"
        class="doodle-line"
      />
    </svg>

    <div class="doodle-caption">
      <p>Först lite uppskattning</p>
    </div>
  </div>
</section>

    <!-- INVITE -->
  <section class="birthday-invite-section">
    <!-- ENVELOPE -->
    <div
      v-if="!showInviteCard"
      class="birthday-invite-envelope"
      :class="{
        'birthday-invite-envelope--new': !envelopeOpen,
        'birthday-invite-envelope--open': envelopeOpen
      }"
      @click="openEnvelope"
    >
      <div class="birthday-invite-envelope-front">
        <div class="birthday-invite-mail">
          <p>Richard 25</p>
          <p>click to open</p>
        </div>
      </div>

      <div class="birthday-invite-envelope-back">
        <div class="birthday-invite-flip birthday-invite-top-flip"></div>
        <div class="birthday-invite-flip birthday-invite-bottom-flip"></div>
        <div class="birthday-invite-flip birthday-invite-left-flip"></div>
        <div class="birthday-invite-flip birthday-invite-right-flip"></div>
      </div>
    </div>

    <!-- ORIGINAL INVITE CARD -->
    <div
      v-else
      class="birthday-invite-panel birthday-invite-card birthday-invite-card-reveal"
    >
      <p class="birthday-invite-kicker">A Private Birthday Experience</p>

      <h1>
        You Are<br />
        Invited
      </h1>

      <p class="birthday-invite-desc">
        En upplevelse har skapats endast för dig, och bara DU kan lösa den. <br>
        Tryck på knappen för att ge det ett försök.
      </p>

      <div class="birthday-invite-signature">for you</div>

      <button class="birthday-invite-cta" @click="enterExperience">
        Enter
      </button>
    </div>
  </section>
  </main>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.start-view {
  min-height: 100vh;
  background: #05070d;
  color: white;
}

/* HERO */

.birthday-hero {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  display: grid;
  place-items: center;

  background:
    radial-gradient(circle at 50% 20%, rgba(120,145,210,.18), transparent 32%),
    linear-gradient(135deg, #040711, #08111d, #04060d);
}

#birthday-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.birthday-text {
  position: relative;
  z-index: 2;
  text-align: center;
}

.birthday-text p {
  margin: 0 0 24px;
  text-transform: uppercase;
  letter-spacing: .34em;
  font-size: .75rem;
  color: rgba(255,255,255,.55);
}

.birthday-text h1 {
  margin: 0;

  font-family: Georgia, serif;
  font-size: clamp(4.5rem, 13vw, 11rem);
  font-weight: 400;
  line-height: .85;
  letter-spacing: -.08em;

  color: rgba(245,247,255,.92);

  text-shadow: 0 30px 90px rgba(0,0,0,.6);
}

.birthday-text span {
  display: inline-block;
  margin-top: 42px;

  color: rgba(255,255,255,.42);

  font-size: .75rem;
  letter-spacing: .22em;
  text-transform: uppercase;

  animation: bounce 1.8s ease-in-out infinite;
}

/* CAKE */

.cake-section {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  display: grid;
  place-items: center;

  background: #f1ece4;
}

#cake-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.cake-text {
  position: relative;
  z-index: 2;
  text-align: center;
  color: #14161d;
}

.cake-text p {
  margin: 0 0 24px;

  color: rgba(20,22,29,.42);

  text-transform: uppercase;
  letter-spacing: .32em;
  font-size: .72rem;
}

.cake-text h2 {
  margin: 0;

  font-family: Georgia, serif;
  font-size: clamp(4rem, 11vw, 8rem);
  font-weight: 400;
  line-height: .9;
  letter-spacing: -.07em;
}

.cake-text span {
  display: inline-block;
  margin-top: 42px;

  color: rgba(20,22,29,.42);

  text-transform: uppercase;
  letter-spacing: .22em;
  font-size: .72rem;
}

/* DOODLE */

.doodle-section {
  min-height: 100vh;
  position: relative;
  display: grid;
  place-items: center;
  overflow: hidden;
  padding: 80px 24px;
  background:
    radial-gradient(circle at top, rgba(90, 120, 210, 0.12), transparent 30%),
    linear-gradient(135deg, #040711, #0b1220, #05070d);
}

.doodle-background-glow {
  position: absolute;
  width: 700px;
  height: 700px;
  border-radius: 999px;
  background: rgba(100, 140, 255, 0.08);
  filter: blur(120px);
  animation: pulseGlow 6s ease-in-out infinite;
}

.doodle-card {
  position: relative;
  z-index: 2;
  width: min(92vw, 950px);
  aspect-ratio: 1.4;
  border-radius: 40px;

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,0.08),
      rgba(255,255,255,0.025)
    );

  border: 1px solid rgba(255,255,255,0.1);

  backdrop-filter: blur(30px);

  box-shadow:
    0 60px 140px rgba(0,0,0,0.65),
    inset 0 1px 0 rgba(255,255,255,0.12);

  overflow: hidden;

  animation: doodleCardIn 1.4s ease both;
}

.doodle-svg {
  width: 100%;
  height: 100%;
}

.doodle-text {
  fill: rgba(255,255,255,0.88);
  font-family: "Comic Sans MS", "Marker Felt", cursive;
  letter-spacing: 0.03em;
}

.doodle-text.big {
  font-size: 54px;
  font-weight: 700;
}

.doodle-text.small-1 {
  font-size: 18px;
}

.doodle-text.small-2 {
  font-size: 12px;
}

.rotate-one {
  transform: rotate(20deg);
  transform-origin: 580px 180px;
}

.rotate-two {
  transform: rotate(-8deg);
  transform-origin: 590px 470px;
}

.doodle-line {
  fill: none;
  stroke: rgba(255,255,255,0.88);
  stroke-width: 5;
  stroke-linecap: round;
  stroke-linejoin: round;

  stroke-dasharray: 1200;
  stroke-dashoffset: 1200;

  animation: drawLine 4s ease forwards;
}

.doodle-fill {
  fill: rgba(255,255,255,0.88);
  opacity: 0;

  animation: fadeDots .5s ease forwards;
  animation-delay: 2s;
}

.string {
  animation-delay: .3s;
}

.balloon-string {
  animation-delay: .8s;
  transform-box: fill-box;
  transform-origin: 50% 0%;
  transform: rotate(-48deg);
}

.sparkle-line {
  animation-delay: .8s;
}

.doodle-caption {
  position: absolute;
  bottom: 40px;
  width: 100%;
  text-align: center;
}

.doodle-caption p {
  margin: 0;
  color: rgba(255,255,255,0.38);
  text-transform: uppercase;
  letter-spacing: 0.28em;
  font-size: 0.72rem;
}

@keyframes drawLine {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes fadeDots {
  to {
    opacity: 1;
  }
}

@keyframes doodleCardIn {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes pulseGlow {
  50% {
    transform: scale(1.08);
    opacity: 0.5;
  }
}

@media (max-width: 700px) {
  .doodle-card {
    aspect-ratio: 0.95;
  }

  .doodle-text.big {
    font-size: 42px;
  }

  .doodle-text.small {
    font-size: 28px;
  }
}

/* INVITE */

.birthday-invite-section {
  min-height: 100svh;
  height: 100vh;
  display: grid;
  place-items: center;
  padding: 96px 24px 48px;

  position: relative;
}

.birthday-invite-section {
  background:
    radial-gradient(circle at 50% 0%, rgba(255,255,255,.08), transparent 28%),
    linear-gradient(135deg, #080b12, #121620, #070910);

  perspective: 1000px;
}

/* ENVELOPE */

.birthday-invite-envelope {
  z-index: 2;
  position: absolute;
  width: min(86vw, 550px);
  aspect-ratio: 550 / 366.667;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  transform-style: preserve-3d;
  transform-origin: right center;
  cursor: pointer;
  font-family: Georgia, serif;
}

.birthday-invite-envelope-front,
.birthday-invite-envelope-back {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background-color: #fff;
  border-radius: 5px;
}

.birthday-invite-envelope-front {
  backface-visibility: hidden;
  display: grid;
  place-items: center;
  z-index: 10;
}

.birthday-invite-envelope-back {
  backface-visibility: hidden;
  transform: rotateY(180deg) translate3d(0, 0, 1px);
}

/* FLAPS */
.birthday-invite-flip {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.birthday-invite-flip::before {
  content: "";
  position: absolute;
  background-color: #fff;
}

.birthday-invite-top-flip,
.birthday-invite-bottom-flip {
  /* nothing extra */
}

.birthday-invite-top-flip::before,
.birthday-invite-bottom-flip::before {
  width: 388.9px;
  height: 388.9px;
}

.birthday-invite-top-flip {
  z-index: 5;
  transform-origin: top center;
}

.birthday-invite-top-flip::before {
  transform-origin: top left;
  transform: rotate(-45deg);
  border-bottom-left-radius: 50px;
  border-top-left-radius: 10px;
  border-bottom-right-radius: 10px;
}

.birthday-invite-bottom-flip {
  z-index: 4;
}

.birthday-invite-bottom-flip::before {
  transform-origin: left bottom;
  transform: rotate(45deg) translate(-15px, -15px);
  border-top-left-radius: 100px;
  border-bottom-left-radius: 10px;
  border-top-right-radius: 10px;
}

.birthday-invite-left-flip::before,
.birthday-invite-right-flip::before {
  width: 269.3px;
  height: 269.3px;
  top: -5px;
}

.birthday-invite-left-flip {
  z-index: 3;
}

.birthday-invite-left-flip::before {
  transform-origin: top left;
  transform: rotate(45deg);
  border-top-left-radius: 20px;
  border-bottom-right-radius: 30px;
  border-top-right-radius: 5px;
}

.birthday-invite-right-flip {
  z-index: 2;
}

.birthday-invite-right-flip::before {
  right: 0;
  transform-origin: top right;
  transform: rotate(-45deg);
  border-top-right-radius: 20px;
  border-bottom-left-radius: 30px;
  border-top-left-radius: 5px;
}

/* MAIL TEXT */
.birthday-invite-mail {
  text-align: center;
}

.birthday-invite-mail p:first-child {
  margin: 0;
  font-family: Didot, Georgia, serif;
  font-size: clamp(2.4rem, 7vw, 4.7rem);
  font-weight: 400;
  line-height: 0.9;
  letter-spacing: -0.08em;
  color: #151111;
}

.birthday-invite-mail p:last-child {
  margin: 18px 0 0;
  text-transform: uppercase;
  letter-spacing: 0.28em;
  font-size: 0.72rem;
  color: rgba(16,19,26,0.48);
}

/* ENVELOPE ANIMATIONS */.envelope.new {animation: newEnvelope 1s forwards;}

.envelope.open {animation: openEnvelope 3s forwards;}

.envelope.open .top-flip {animation: flipOpen 1s 1s forwards;}

@keyframes newEnvelope {0% {left: 0%;margin-left: -100%;}100% {left: 50%;margin-left: 0;}}

@keyframes openEnvelope {0% {transform: translate(-50%, -50%) rotateY(0deg);}33% {transform: translate(-150%, -50%) rotateY(-180deg);}66% {transform: translate(-150%, -50%) rotateY(-180deg);}100% {transform: translate(-150%, 150%) rotateY(-180deg);opacity: 0;}}

@keyframes flipOpen {0% {transform: rotateX(0deg);z-index: 5;}50% {transform: rotateX(0deg);z-index: 5;}100% {transform: rotateX(-180deg);z-index: -1;}}


/* ORIGINAL INVITE CARD */

.birthday-invite-panel {
  width: min(92vw, 900px);
  position: relative;
  z-index: 2;
  text-align: center;
}

.birthday-invite-card {
  width: min(92vw, 720px);

  padding: 74px 58px;

  border-radius: 12px;

  background: rgba(255,255,255,.96);

  color: #10131a;

}

.birthday-invite-kicker {
  margin: 0 0 20px;

  text-transform: uppercase;
  letter-spacing: .32em;
  font-size: .72rem;

  color: rgba(16,19,26,.45);
}

.birthday-invite-section h1 {
  margin: 0;

  font-family: Didot, Georgia, serif;
  font-size: clamp(3.8rem, 10vw, 7.5rem);
  font-weight: 400;
  line-height: .92;
  letter-spacing: -.08em;
}

.birthday-invite-desc {
  max-width: 620px;

  margin: 28px auto 0;

  color: rgba(16,19,26,.65);

  line-height: 1.8;
  font-size: 1.05rem;
}

.birthday-invite-signature {
  margin-top: 32px;

  font-family: cursive;
  font-size: 2rem;

  color: rgba(16,19,26,.72);
}

.birthday-invite-cta {
  margin-top: 38px;

  padding: 17px 34px;

  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.14);

  color: white;
  background: #10131a;

  transition: .28s ease;

  cursor: pointer;
}

.cta:hover {
  transform: translateY(-3px) scale(1.02);
}

/* ENVELOPE ANIMATION */

.birthday-invite-envelope--new {
  animation: newEnvelope 1s forwards;
}

.birthday-invite-envelope--open {
  animation: openEnvelope 2.2s forwards;
}

.birthday-invite-envelope--open .birthday-invite-top-flip {
  animation: flipOpen .9s .8s forwards;
}

.birthday-invite-card-reveal {
  animation: revealInviteCard .8s ease forwards;
}


/* ANIMATIONS */

@keyframes bounce {
  50% {
    transform: translateY(8px);
  }
}

/* MOBILE */

@media (max-width: 760px) {
  .invite-card {
    padding: 42px 24px;
  }

  .birthday-text h1,
  .cake-text h2 {
    font-size: clamp(3.4rem, 15vw, 6rem);
  }

   .envelope.open {animation: openEnvelope 3s forwards;}

.envelope.open .top-flip {animation: flipOpen 1s 1s forwards;}

@keyframes newEnvelope {0% {left: 0%;margin-left: -100%;}100% {left: 50%;margin-left: 0;}}

@keyframes openEnvelope {0% {transform: translate(-50%, -50%) rotateY(0deg);}33% {transform: translate(-150%, -50%) rotateY(-180deg);}66% {transform: translate(-150%, -50%) rotateY(-180deg);}100% {transform: translate(-150%, 150%) rotateY(-180deg);opacity: 0;}}

@keyframes flipOpen {0% {transform: rotateX(0deg);z-index: 5;}50% {transform: rotateX(0deg);z-index: 5;}100% {transform: rotateX(-180deg);z-index: -1;}}

}

.start-view {
  min-height: 100vh;
  background: #05070d;
  color: white;
  overflow-y: auto;
  overflow-x: hidden;
}
</style>