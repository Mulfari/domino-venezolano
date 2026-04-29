let permissionGranted = false;

export async function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    permissionGranted = true;
    return;
  }
  if (Notification.permission === "denied") return;
  const result = await Notification.requestPermission();
  permissionGranted = result === "granted";
}

export function notifyTurn() {
  if (!permissionGranted || document.visibilityState === "visible") return;
  try {
    new Notification("Dominó Venezolano", {
      body: "¡Es tu turno!",
      icon: "/icons/icon.svg",
      tag: "turn",
    });
  } catch {
    // Silent fail on environments that don't support Notification constructor
  }
}
