// The title screen is deliberately self-contained while the game is built.
const startButton = document.getElementById("start-button");
const status = document.getElementById("status");
const gameScreen = document.getElementById("game-screen");
const arena = document.getElementById("arena");
const player = document.getElementById("player");
const hill = document.querySelector(".small-hill");
const joystick = document.getElementById("joystick");
const joystickKnob = document.getElementById("joystick-knob");

const playerState = { x: 80, y: 0, velocityY: 0, direction: 1, grounded: true };
const keys = new Set();
const touchAxis = { x: 0, jumping: false };
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

function jump() {
  if (!playerState.grounded) return;
  playerState.velocityY = 680;
  playerState.grounded = false;
}

function updateJoystick(event) {
  const bounds = joystick.getBoundingClientRect();
  const radius = bounds.width / 2;
  let x = event.clientX - bounds.left - radius;
  let y = event.clientY - bounds.top - radius;
  const distance = Math.hypot(x, y);
  const maxDistance = radius * 0.56;
  if (distance > maxDistance) {
    x = (x / distance) * maxDistance;
    y = (y / distance) * maxDistance;
  }
  touchAxis.x = x / maxDistance;
  joystickKnob.style.transform = `translate(${x}px, ${y}px)`;
  if (y < -maxDistance * 0.52 && !touchAxis.jumping) {
    jump();
    touchAxis.jumping = true;
  }
  if (y >= -maxDistance * 0.52) touchAxis.jumping = false;
}

function resetJoystick(event) {
  if (event) joystick.releasePointerCapture?.(event.pointerId);
  touchAxis.x = 0;
  touchAxis.jumping = false;
  joystickKnob.style.transform = "translate(0, 0)";
}

joystick.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  joystick.setPointerCapture(event.pointerId);
  updateJoystick(event);
});
joystick.addEventListener("pointermove", (event) => {
  if (joystick.hasPointerCapture(event.pointerId)) updateJoystick(event);
});
joystick.addEventListener("pointerup", resetJoystick);
joystick.addEventListener("pointercancel", resetJoystick);

function updateGame(timestamp) {
  const delta = Math.min((timestamp - lastFrame) / 1000 || 0, 0.04);
  lastFrame = timestamp;
  const arenaWidth = arena.clientWidth;
  const speed = 235;

  const horizontalInput = (keys.has("d") ? 1 : 0) - (keys.has("a") ? 1 : 0) + touchAxis.x;
  if (horizontalInput < -0.12) {
    playerState.x -= speed * delta * Math.min(1, Math.abs(horizontalInput));
    playerState.direction = -1;
  }
  if (horizontalInput > 0.12) {
    playerState.x += speed * delta * Math.min(1, Math.abs(horizontalInput));
    playerState.direction = 1;
  }
  playerState.x = Math.max(10, Math.min(arenaWidth - 82, playerState.x));
  const hillStart = (arenaWidth - hill.offsetWidth) / 2;
  const playerCenter = playerState.x + 37;
  const standingOnHill = playerCenter > hillStart + 16
    && playerCenter < hillStart + hill.offsetWidth - 16;
  const floorHeight = standingOnHill ? 84 : 0;
  playerState.velocityY -= 1750 * delta;
  playerState.y += playerState.velocityY * delta;
  if (playerState.y <= floorHeight) {
    playerState.y = floorHeight;
    playerState.velocityY = 0;
    playerState.grounded = true;
  } else {
    playerState.grounded = false;
  }

  player.style.transform = `translate(${playerState.x}px, ${-playerState.y}px) scaleX(${playerState.direction})`;
  player.classList.toggle("walking", Math.abs(horizontalInput) > 0.12);
  requestAnimationFrame(updateGame);
}

window.__APP = { ready: true, startAdventure, playerState };
