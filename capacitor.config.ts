import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.ialangue.app',
  appName: 'IAlangue',
  webDir: 'public',
  server: {
    // Charge l’app déployée (remplacez par votre URL Vercel si besoin)
    url: process.env.CAPACITOR_SERVER_URL || 'https://ai-langue.vercel.app',
    androidScheme: 'https',
  },
}

export default config
