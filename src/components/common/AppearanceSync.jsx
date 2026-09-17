import { useEffect, useLayoutEffect, useState } from 'react';
import { StatusBar } from '@capacitor/status-bar';
import { usePreferences } from '@/hooks/usePreferences';
import { isNativeApp } from '@/lib/native-platform';
import { resolveAppearance, statusBarStyle } from '@/lib/appearance';

export default function AppearanceSync() {
  const { preferences } = usePreferences();
  const [deviceIsDark, setDeviceIsDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  const appearance = resolveAppearance(preferences.appearance, deviceIsDark);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setDeviceIsDark(media.matches);
    media.addEventListener('change', update);
    update();
    return () => media.removeEventListener('change', update);
  }, []);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', appearance === 'dark');
    document.documentElement.style.colorScheme = appearance;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', appearance === 'dark' ? '#18181b' : '#ffffff');
  }, [appearance]);

  useEffect(() => {
    if (!isNativeApp()) return;
    const root = document.documentElement;
    const sync = () => {
      const style = statusBarStyle(
        root.classList.contains('dark') ? 'dark' : 'light',
        root.classList.contains('app-is-launching'),
      );
      StatusBar.setStyle({ style }).catch((error) =>
        console.warn('Unable to update status bar appearance', error),
      );
    };
    // Include the launch overlay, which always has a black background.
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  return null;
}
