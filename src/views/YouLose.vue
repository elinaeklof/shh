<template>
  <main class="maze-room">
    <div class="noise"></div>

  <div class="fake-hint">
    <strong>Hint:</strong><br />
    Kolla i vänstra hörnet.
  </div>

  <div class="message" id="message"></div>

  <main class="trap-card">
    <div class="trap-idle">
      <div>
        <p>Escape room</p>
        <h1>Do not<br />touch</h1>
        <span>Den grå rutan är absolut inte en fälla.</span>
      </div>
    </div>

    <div class="trap-lose">
      <h2>You<br />Lose</h2>
    </div>
  </main>

  <section class="help-panel">
    <button type="button" id="helpButton">Hjälp</button>
    <p id="helpText">0 / 5 hjälp använda · 0 pussar skyldig Elina</p>
  </section>

  <div class="clue-overlay" id="clueOverlay">
    <div class="clue-card">
      <p>Room complete</p>
      <h2>Okej, du får den</h2>
      <span>5 pussar skyldig Elina</span>
      <div class="letter">I</div>
    </div>
  </div>
  </main>
</template>

<style scoped>
* {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      font-family: Arial, Helvetica, sans-serif;
      background: #111;
      color: white;
    }

    body {
      display: grid;
      place-items: center;
      text-transform: uppercase;
      background:
        radial-gradient(circle at 50% 20%, rgba(255,255,255,0.08), transparent 30%),
        linear-gradient(135deg, #1b1b1b, #303030, #151515);
    }

    .noise {
      position: fixed;
      inset: 0;
      pointer-events: none;
      opacity: 0.07;
      background-image: repeating-radial-gradient(circle at 20% 30%, white 0, white 1px, transparent 1px, transparent 5px);
      animation: noiseMove 0.25s steps(2) infinite;
    }

    .fake-hint {
      position: fixed;
      top: 28px;
      left: 28px;
      z-index: 6;
      color: rgba(255,255,255,0.38);
      font-size: 0.72rem;
      letter-spacing: 0.18em;
      line-height: 1.6;
      max-width: 280px;
    }

    .fake-hint strong {
      color: rgba(255,255,255,0.68);
      font-weight: 700;
    }

    .trap-card {
      position: relative;
      z-index: 2;
      width: min(86vw, 640px);
      height: min(46vh, 360px);
      display: grid;
      place-items: center;
      border-radius: 34px;
      text-align: center;
      background: linear-gradient(180deg, #777, #4f4f4f);
      border: 1px solid rgba(255,255,255,0.18);
      box-shadow:
        0 50px 160px rgba(0,0,0,0.65),
        inset 0 1px 0 rgba(255,255,255,0.18);
      cursor: crosshair;
      transition: 0.16s ease;
    }

    .trap-idle,
    .trap-lose {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      padding: 28px;
      transition: 0.16s ease;
    }

    .trap-idle p {
      margin: 0 0 16px;
    }
</style>

<script>
    let helpCount = 0;

    const helpButton = document.getElementById('helpButton');
    const helpText = document.getElementById('helpText');
    const clueOverlay = document.getElementById('clueOverlay');
    const message = document.getElementById('message');

    const messages = [
      'Kolla mer noggrant i vänstra hörnet.',
      'Nej, inte där. Lite mer vänster kanske?',
      'Konstigt. Det borde verkligen finnas något där.',
      'Du kanske måste acceptera att hjälp kostar pussar.',
      'Okej då. Fem hjälp senare.'
    ];

    helpButton.addEventListener('click', () => {
      if (helpCount >= 5) return;

      helpCount++;

      const pussText = helpCount === 1 ? 'puss' : 'pussar';
      helpText.textContent = `${helpCount} / 5 hjälp använda · ${helpCount} ${pussText} skyldig Elina`;
      message.textContent = messages[helpCount - 1];

      if (helpCount === 5) {
        helpButton.textContent = 'Ledtråd upplåst';
        clueOverlay.classList.add('visible');
      }
    });
  </script>