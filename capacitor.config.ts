import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.relay.app',
    appName: 'Relay',
    webDir: 'dist',
    server: {
        androidScheme: 'https'
    }
};

export default config;
