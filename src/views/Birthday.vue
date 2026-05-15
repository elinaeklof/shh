<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function enterExperience() {
  router.push('/rules')
}
</script>

<template>
  <main class="scene invite">
    <div class="panel invite-card">
      <p class="kicker">A Private Birthday Experience</p>

      <h1>
        You Are<br />
        Invited
      </h1>

      <p class="desc">
        En elegant, personlig och lite mer romantisk start på presentjakten.
      </p>

      <div class="signature">for you</div>

      <button class="cta" @click="enterExperience">
        Enter
      </button>
    </div>
  </main>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

button {
  font: inherit;
  cursor: pointer;
}

.scene {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 96px 24px 48px;
  position: relative;
  overflow: hidden;
}

.panel {
  width: min(92vw, 900px);
  position: relative;
  z-index: 2;
  text-align: center;
}

.kicker {
  margin: 0 0 20px;
  text-transform: uppercase;
  letter-spacing: .32em;
  font-size: .72rem;
  color: rgba(255,255,255,.62);
}

.desc {
  max-width: 620px;
  margin: 28px auto 0;
  color: rgba(255,255,255,.72);
  line-height: 1.8;
  font-size: 1.05rem;
}

.cta {
  margin-top: 38px;
  padding: 17px 34px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.14);
  color: white;
  background: rgba(255,255,255,.08);
  transition: .28s ease;
}

.cta:hover {
  transform: translateY(-3px) scale(1.02);
}

.invite {
  background:
    radial-gradient(circle at 50% 0%, rgba(255,255,255,.08), transparent 28%),
    linear-gradient(135deg, #080b12, #121620, #070910);
}

.invite-card {
  width: min(92vw, 720px);
  padding: 74px 58px;
  border-radius: 12px;
  background: rgba(255,255,255,.96);
  color: #10131a;
  box-shadow: 0 50px 140px rgba(0,0,0,.6);
  animation: envelope .9s ease both;
}

.invite .kicker {
  color: rgba(16,19,26,.45);
}

.invite h1 {
  margin: 0;
  font-family: Didot, Georgia, serif;
  font-size: clamp(3.8rem, 10vw, 7.5rem);
  font-weight: 400;
  line-height: .92;
  letter-spacing: -.08em;
}

.invite .desc {
  color: rgba(16,19,26,.65);
}

.signature {
  margin-top: 32px;
  font-family: cursive;
  font-size: 2rem;
  color: rgba(16,19,26,.72);
}

.invite .cta {
  color: white;
  background: #10131a;
}

@keyframes envelope {
  from {
    opacity: 0;
    transform: translateY(40px) rotateX(10deg);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

@media (max-width: 760px) {
  .invite-card {
    padding: 42px 24px;
  }
}
</style>