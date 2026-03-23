import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.angelina.ai',
  appName: 'Angelina AI',
  webDir: 'out',
  server: {
    url: 'https://angelina-vercel-clean.vercel.app',
    cleartext: true,
    allowNavigation: ['angelina-vercel-clean.vercel.app', '*.vercel.app', '*.openai.com'],
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
