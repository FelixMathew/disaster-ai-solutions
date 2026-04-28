import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.disasterai.app',
  appName: 'DisasterAI',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true, // Allow HTTP during development
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f172a',
      showSpinner: false,
    },
    StatusBar: {
      backgroundColor: '#0f172a',
      style: 'dark',
    },
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#0f172a',
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#0f172a',
  },
};

export default config;
