import { Capacitor } from '@capacitor/core';

export const isNativeApp = () => Capacitor.isNativePlatform();
export const isIOSApp = () => Capacitor.getPlatform() === 'ios';

export async function openExternalUrl(url) {
  if (!url) return false;

  if (isNativeApp() && /^https?:\/\//i.test(url)) {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url, presentationStyle: 'popover' });
    return true;
  }

  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  return Boolean(opened);
}

export async function openDirections(latitude, longitude, label = 'Destination') {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;

  const destination = `${lat},${lng}`;
  const url = isIOSApp()
    ? `https://maps.apple.com/?daddr=${encodeURIComponent(destination)}&dirflg=d&q=${encodeURIComponent(label)}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;

  return openExternalUrl(url);
}

export async function getCurrentCoordinates() {
  const { Geolocation } = await import('@capacitor/geolocation');

  if (isNativeApp()) {
    const current = await Geolocation.checkPermissions();
    if (current.location !== 'granted' && current.coarseLocation !== 'granted') {
      const requested = await Geolocation.requestPermissions({ permissions: ['location'] });
      if (requested.location !== 'granted' && requested.coarseLocation !== 'granted') {
        throw new Error('Location access was not granted. You can enable it in Settings.');
      }
    }
  }

  const position = await Geolocation.getCurrentPosition({
    enableHighAccuracy: false,
    timeout: 12_000,
    maximumAge: 60_000,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
  };
}
