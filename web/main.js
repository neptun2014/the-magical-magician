// The title screen is deliberately self-contained while the game is built.
const startButton = document.getElementById("start-button");
const status = document.getElementById("status");
const gameScreen = document.getElementById("game-screen");
const arena = document.getElementById("arena");
const player = document.getElementById("player");

const playerState = { x: 80, y: 0, velocityY: 0, direction: 1, grounded: true };
const keys = new Set();
let gameActive = false;
let lastFrame = 0;

function startAdventure() {
  startButton.disabled = true;
  startButton.querySelector("span").textContent = "PREPARING SPELLS...";
  status.textContent = "The graveyard awaits.";
  document.body.classList.add("adventure-starting");

  window.setTimeout(() => {
    document.body.classList.add("game-active");
    gameScreen.setAttribute("aria-hidden", "false");
    gameActive = true;
    requestAnimationFrame(updateGame);
  }, 650);
}

startButton.addEventListener("click", startAdventure);
window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (key === "enter" && !startButton.disabled) startAdventure();
  if (!gameActive || !["a", "d", "w"].includes(key)) return;
  event.preventDefault();
  keys.add(key);
  if (key === "w" && playerState.grounded) {
    playerState.velocityY = 680;
    playerState.grounded = false;
  }
});

window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));

function updateGame(timestamp) {
  const delta = Math.min((timestamp - lastFrame) / 1000 || 0, 0.04);
  lastFrame = timestamp;
  const arenaWidth = arena.clientWidth;
  const speed = 235;

  if (keys.has("a")) {
    playerState.x -= speed * delta;
    playerState.direction = -1;
  }
  if (keys.has("d")) {
    playerState.x += speed * delta;
    playerState.direction = 1;
  }
  playerState.x = Math.max(10, Math.min(arenaWidth - 82, playerState.x));
  playerState.velocityY -= 1750 * delta;
  playerState.y += playerState.velocityY * delta;
  if (playerState.y <= 0) {
    playerState.y = 0;
    playerState.velocityY = 0;
    playerState.grounded = true;
  }

  player.style.transform = `translate(${playerState.x}px, ${-playerState.y}px) scaleX(${playerState.direction})`;
  player.classList.toggle("walking", keys.has("a") || keys.has("d"));
  requestAnimationFrame(updateGame);
}

window.__APP = { ready: true, startAdventure, playerState };
