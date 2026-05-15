<template>
  <main class="maze-room">
    <svg class="maze-svg">
      <defs>
        <clipPath id="left">
          <path d="M208.051459,2400 C263.281717,2400 309.415831,2355.25297 311.095095,2300.04788 L312.664062,2248.46875 L237.390625,2194.82812 L137.777344,2030.35938 L237.390625,1931.83594 L201.117188,1718.30469 L512.40625,1671.47266 L625.328125,1623.67187 L554.5,1528.82813 L554.671875,1367.17188 L505.5,1496.0625 L389.328125,1318.78125 L308.054687,1456.08984 L292.945312,1260.08984 L139.835938,1239.41797 L193.140625,968.167969 L594.265625,834.582031 L589.878906,810.363281 L294.828125,639.890625 L466.5625,514 L286.109375,421.609375 L403.671875,259.953125 L307.732398,87.3968996 C280.895903,39.1289248 214.371469,0 159.13546,0 L0,0 L0,2400 L208.051459,2400 Z"></path>
        </clipPath>

        <clipPath id="right">
          <path d="M607.571488,2400 C552.344521,2400 500.243973,2355.8417 491.198356,2301.34979 L477.292969,2217.58203 L322.253906,2136.07031 L277.097656,2050.32031 L335.421875,1981.23438 L322.253906,1799.02734 L555.867188,1774.47266 L740.628906,1650.70703 L634.464844,1501 L606.171875,1092.44531 L489.804688,1280.52734 L455.144531,1174.73438 L363.847656,1236.04297 L393.441406,1148.53906 L268.179688,1157.70312 L292.765625,1043.58203 L708.695312,919.421875 L669.171875,751.890625 L442.472656,634.820312 L614.207031,508.929688 L400,400.347656 L477.292969,265.375 L508.251674,98.3209413 C518.314845,44.0197848 571.238285,0 626.48025,0 L800,0 L800,2400 L607.571488,2400 Z"></path>
        </clipPath>
      </defs>
    </svg>

    <div id="game">
      <div id="start-spot"></div>
      <div class="wall-left"></div>
      <div class="wall-right"></div>

      <div id="gameover">
        <h1>You lose</h1>
      </div>

      <div id="win">
        <h1>
          Room complete<br />
          Ledtråd: I
        </h1>
      </div>
    </div>

    <p class="instructions">
      Place your cursor on the white dot to start.<br />
      Avoid the walls and escape.
    </p>
  </main>
</template>

<style scoped>
.maze-room {
  min-height: 100vh;
  overflow: hidden;
  text-align: center;
  font-family: sans-serif;
  background: #333;
  color: #fff;
  text-transform: uppercase;
  padding-top: 20px;
}

.maze-svg {
  position: absolute;
  width: 0;
  height: 0;
}

#game {
  position: relative;
  width: 800px;
  height: 600px;
  margin: 20px auto 40px;
  box-shadow: 0 1px 15px #222;
  overflow: hidden;
  transform: perspective(200px) rotateX(15deg) translateY(-90px);
}

#gameover,
#win {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
}

#gameover {
  display: none;
  background: tomato;
}

#win {
  opacity: 0;
  pointer-events: none;
  background: #111;
}

#start-spot {
  position: absolute;
  bottom: 10px;
  left: 50%;
  width: 20px;
  height: 20px;
  transform: translateX(-50%);
  background: #fff;
  border-radius: 999px;
}

.wall-left,
.wall-right {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 400%;
  background: linear-gradient(#fff, #777);
  transform: translateZ(1px);
}

.wall-left {
  left: 0;
  clip-path: url("#left");
}

.wall-right {
  right: 0;
  clip-path: url("#right");
}

#game:hover .wall-left,
#game:hover .wall-right {
  animation: wallScroll 10s ease-in forwards;
}

#game:hover #win {
  animation: win 10s linear forwards;
}

#game:hover #start-spot {
  display: none;
}

.wall-left:hover ~ #gameover,
.wall-right:hover ~ #gameover,
#gameover:hover {
  display: block;
  z-index: 1;
}

#gameover h1,
#win h1 {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate3d(-50%, -50%, 0);
}

.instructions {
  font-weight: lighter;
}

@keyframes wallScroll {
  0% {
    transform: none;
  }

  100% {
    transform: translateY(100%);
  }
}

@keyframes win {
  0% {
    opacity: 0;
  }

  99% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}
</style>