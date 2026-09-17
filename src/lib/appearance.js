export const normalizeAppearance = (value) =>
  ['light', 'dark', 'system'].includes(value) ? value : 'system';

export function resolveAppearance(preference, deviceIsDark) {
  const appearance = normalizeAppearance(preference);
  return appearance === 'system' ? (deviceIsDark ? 'dark' : 'light') : appearance;
}

// Capacitor names styles for the BACKGROUND: LIGHT gives dark status-bar text.
export function statusBarStyle(appearance, launching = false) {
  return launching || appearance === 'dark' ? 'DARK' : 'LIGHT';
}
