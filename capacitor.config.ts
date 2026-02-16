import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.angelina.ai',
  appName: 'Angelina AI',
  webDir: 'out',
  server: {
    // Load from HTTPS dev server (self-signed cert accepted in WebView)
    url: 'https://10.33.183.235:3000',
    cleartext: true,
    allowNavigation: ['10.33.183.235:3000', '*.openai.com'],
  },
  android: {
    backgroundColor: '#0a0a0f',
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      backgroundColor: '#0a0a0f',
      launchAutoHide: true,
      launchShowDuration: 1500,
    },
  },
};

export default config;
