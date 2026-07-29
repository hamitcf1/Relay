// Firebase Configuration
// Using environment variables for security with safe defaults for local/testing environments

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoKeyForLocalTestingMode12345',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'relay-e61b4.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'relay-e61b4',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'relay-e61b4.appspot.com',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '477483426209',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:477483426209:web:demoapp',
}

// Initialize Firebase safely
export const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
