// The title screen is deliberately self-contained while the game is built.
const startButton = document.getElementById("start-button");
const status = document.getElementById("status");
const gameScreen = document.getElementById("game-screen");
const arena = document.getElementById("arena");
const player = document.getElementById("player");
const hill = document.querySelector(".small-hill");
const enemiesLayer = document.getElementById("enemies");
const joystick = document.getElementById("joystick");
const joystickKnob = document.getElementById("joystick-knob");
const healthText = document.getElementById("player-health-text");
const healthBar = document.getElementById("player-health-bar");
const gameOver = document.getElementById("game-over");
const returnToTitleButton = document.getElementById("return-to-title");

const playerState = { x: 80, y: 0, velocityY: 0, direction: 1, grounded: true };
const playerHealth = { current: 150, max: 150 };
const keys = new Set();
const touchAxis = { x: 0, jumping: false };
const enemies = [];
let gameActive = false;
let lastFrame = 0;
let initialWaveSpawned = false;
let nextFireballAt = 0;

function startAdventure() {
  startButton.disabled = true;
  startButton.querySelector("span").textContent = "PREPARING SPELLS...";
  status.textContent = "The graveyard awaits.";
  document.body.classList.add("adventure-starting");

  window.setTimeout(() => {
    document.body.classList.add("game-active");
    gameScreen.setAttribute("aria-hidden", "false");
    gameActive = true;
    spawnInitialZombies();
    requestAnimationFrame(updateGame);
  }, 650);
}

function livingZombieCount() {
  return enemies.filter((zombie) => zombie.alive).length;
}

function spawnZombie(x, variant = 0) {
  if (livingZombieCount() >= 9) return;
  const zombie = document.createElement("div");
  zombie.className = "enemy-zombie";
  zombie.setAttribute("role", "img");
  zombie.setAttribute("aria-label", "Zombie with two health points");
  zombie.innerHTML = `<div class="enemy-health"><i></i><i></i></div><i class="enemy-head"></i><i class="enemy-body"></i><i class="enemy-arm"></i>`;
  enemiesLayer.append(zombie);
  enemies.push({ element: zombie, x, health: 2, alive: true, variant, nextAttackAt: performance.now() + 500 });
}

function spawnInitialZombies() {
  if (initialWaveSpawned) return;
  initialWaveSpawned = true;
  const width = arena.clientWidth;
  spawnZombie(width - 70, 0);
  spawnZombie(-34, 1);
  spawnZombie(width * 0.64, 2);
}

function spawnReinforcements() {
  const openings = Math.min(2, 9 - livingZombieCount());
  if (openings > 0) spawnZombie(-48, 1);
  if (openings > 1) spawnZombie(arena.clientWidth + 18, 2);
}

function updateZombies(delta) {
  const now = performance.now();
  enemies.forEach((zombie) => {
    if (!zombie.alive) return;
    const distanceToPlayer = playerState.x - zombie.x;
    if (Math.abs(distanceToPlayer) > 55) zombie.x += Math.sign(distanceToPlayer) * 36 * delta;
    const attacking = Math.abs(distanceToPlayer) <= 55;
    zombie.element.classList.toggle("zombie-attacking", attacking);
    if (attacking && now >= zombie.nextAttackAt) {
      damagePlayer(1);
      zombie.nextAttackAt = now + 900;
    }
    zombie.element.style.transform = `translate(${zombie.x}px, 0)`;
  });
}

function updateHealthDisplay() {
  healthText.textContent = `${playerHealth.current} / ${playerHealth.max}`;
  healthBar.style.width = `${(playerHealth.current / playerHealth.max) * 100}%`;
}

function damagePlayer(amount) {
  if (!gameActive) return;
  playerHealth.current = Math.max(0, playerHealth.current - amount);
  updateHealthDisplay();
  player.classList.add("player-hit");
  window.setTimeout(() => player.classList.remove("player-hit"), 130);
  if (playerHealth.current === 0) endGame();
}

function endGame() {
  gameActive = false;
  keys.clear();
  resetJoystick();
  document.body.classList.add("game-over-active");
  gameOver.setAttribute("aria-hidden", "false");
}

function returnToTitle() {
  gameActive = false;
  keys.clear();
  resetJoystick();
  enemies.forEach((zombie) => zombie.element.remove());
  enemies.length = 0;
  initialWaveSpawned = false;
  playerHealth.current = playerHealth.max;
  playerState.x = 80;
  playerState.y = 0;
  playerState.velocityY = 0;
  playerState.direction = 1;
  playerState.grounded = true;
  player.style.transform = "translate(80px, 0) scaleX(1)";
  updateHealthDisplay();
  gameOver.setAttribute("aria-hidden", "true");
  gameScreen.setAttribute("aria-hidden", "true");
  document.body.classList.remove("game-active", "game-over-active", "adventure-starting");
  startButton.disabled = false;
  startButton.querySelector("span").textContent = "START ADVENTURE";
  status.textContent = "Press start to begin your quest";
}

function damageZombie(zombie) {
  zombie.health -= 1;
  zombie.element.classList.add("zombie-hit");
  window.setTimeout(() => zombie.element.classList.remove("zombie-hit"), 140);
  zombie.element.querySelectorAll(".enemy-health i")[zombie.health]?.classList.add("health-empty");
  if (zombie.health > 0) return;
  zombie.alive = false;
  zombie.element.classList.add("zombie-defeated");
  zombie.element.setAttribute("aria-label", "Defeated zombie");
  spawnReinforcements();
  window.setTimeout(() => zombie.element.remove(), 360);
}

function zombieNearTarget(x, y) {
  const arenaBounds = arena.getBoundingClientRect();
  let closest = null;
  let closestDistance = 92;
  enemies.forEach((zombie) => {
    if (!zombie.alive) return false;
    const bounds = zombie.element.getBoundingClientRect();
    const centerX = bounds.left - arenaBounds.left + bounds.width / 2;
    const centerY = bounds.top - arenaBounds.top + bounds.height / 2;
    const distance = Math.hypot(centerX - x, centerY - y);
    if (distance < closestDistance) {
      closest = zombie;
      closestDistance = distance;
    }
  });
  return closest;
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
  if (!gameActive) return;
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
  updateZombies(delta);
  requestAnimationFrame(updateGame);
}

function castFireball(event) {
  if (!gameActive || (event.pointerType === "mouse" && event.button !== 0)) return;
  const now = performance.now();
  if (now < nextFireballAt) return;
  nextFireballAt = now + 1000;
  event.preventDefault();
  const bounds = arena.getBoundingClientRect();
  const target = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  const origin = {
    x: playerState.x + (playerState.direction === 1 ? 71 : 4),
    y: arena.clientHeight - 76 - playerState.y - 44,
  };
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const distance = Math.hypot(dx, dy) || 1;
  const targetZombie = zombieNearTarget(target.x, target.y);
  const fireball = document.createElement("i");
  fireball.className = "fireball";
  fireball.setAttribute("aria-hidden", "true");
  arena.append(fireball);

  const speed = 650;
  const startedAt = performance.now();
  const duration = Math.min(900, Math.max(130, (distance / speed) * 1000));
  let lastTrailAt = 0;
  if (targetZombie) {
    window.setTimeout(() => {
      if (targetZombie.alive) damageZombie(targetZombie);
    }, duration);
  }
  function leaveTrail(x, y, now) {
    if (now - lastTrailAt < 36) return;
    lastTrailAt = now;
    const spark = document.createElement("i");
    spark.className = "fire-trail";
    spark.setAttribute("aria-hidden", "true");
    spark.style.transform = `translate(${x + (Math.random() - .5) * 8}px, ${y + (Math.random() - .5) * 8}px)`;
    arena.append(spark);
    window.setTimeout(() => spark.remove(), 420);
  }
  function fly(now) {
    const progress = Math.min(1, (now - startedAt) / duration);
    const x = origin.x + dx * progress;
    const y = origin.y + dy * progress;
    fireball.style.transform = `translate(${x}px, ${y}px)`;
    leaveTrail(x, y, now);
    if (progress < 1) requestAnimationFrame(fly);
    else fireball.remove();
  }
  requestAnimationFrame(fly);
}

arena.addEventListener("pointerdown", castFireball);
returnToTitleButton.addEventListener("click", returnToTitle);

window.__APP = { ready: true, startAdventure, castFireball, damagePlayer, playerState, playerHealth };
