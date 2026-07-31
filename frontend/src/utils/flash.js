const FLASH_KEY = "doro:flash-message";

export function setFlashMessage(message, type = "exito") {
  sessionStorage.setItem(FLASH_KEY, JSON.stringify({ message, type }));
}

export function consumeFlashMessage() {
  const raw = sessionStorage.getItem(FLASH_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(FLASH_KEY);
  try {
    const flash = JSON.parse(raw);
    return flash?.message ? flash : null;
  } catch {
    return null;
  }
}
