// The title screen is deliberately self-contained while the game is built.
const startButton = document.getElementById("start-button");
const status = document.getElementById("status");

function startAdventure() {
  startButton.disabled = true;
  startButton.querySelector("span").textContent = "PREPARING SPELLS...";
  status.textContent = "The graveyard awaits.";
  document.body.classList.add("adventure-starting");
}

startButton.addEventListener("click", startAdventure);
window.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !startButton.disabled) startAdventure();
});

window.__APP = { ready: true, startAdventure };
