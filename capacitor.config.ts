import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.boilertransport.app',
  appName: 'Boiler Transport',
  webDir: 'dist',
  backgroundColor: '#f9fafb',
  ios: {
    backgroundColor: '#f9fafb',
    contentInset: 'never',
    preferredContentMode: 'mobile',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: '#080808',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#f9fafb',
      overlaysWebView: true,
    },
  },
};

export default config;
