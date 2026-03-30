import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.talentleague.app',
  appName: 'TalentLeague',
  webDir: 'build',
  server: {
    androidScheme: 'http',
    cleartext: true
  },
  plugins: {
    App: {
      handleUrlOpen: true
    }
  }
};

export default config;
