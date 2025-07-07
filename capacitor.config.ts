import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sporating.app',
  appName: 'Sporating',
  webDir: 'out',
  server: {
    // Pour le développement avec localhost
    url: 'http://localhost:3000',
    cleartext: true,
    androidScheme: 'http'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#2563eb",
      showSpinner: false
    }
  }
};

export default config;