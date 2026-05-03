// Vibration API wrapper — silently no-ops on unsupported devices
function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

// Short tap — tile selection, minor feedback
export function hapticTap() {
  vibrate(18);
}

// Medium pulse — tile placed on board
export function hapticPlay() {
  vibrate(35);
}

// Double pulse — pass turn
export function hapticPass() {
  vibrate([22, 60, 22]);
}

// Strong single — your turn arrived
export function hapticYourTurn() {
  vibrate(65);
}

// Victory pattern — won a round
export function hapticVictory() {
  vibrate([40, 80, 40, 80, 80]);
}

// Defeat pattern — lost a round
export function hapticDefeat() {
  vibrate([80, 60, 40]);
}

// Capicúa — special double-tap
export function hapticCapicua() {
  vibrate([30, 50, 30, 50, 60]);
}

// Cochina (6-6 opener) — strong triple
export function hapticCochina() {
  vibrate([50, 40, 50, 40, 100]);
}

// Game over win
export function hapticGameOverWin() {
  vibrate([60, 80, 60, 80, 60, 80, 120]);
}

// Game over loss
export function hapticGameOverLoss() {
  vibrate([100, 60, 80]);
}
