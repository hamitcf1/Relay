// Firebase Configuration
// Using environment variables for security with safe defaults for local/testing environments

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
    getFirestore,
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
    clearIndexedDbPersistence,
} from 'firebase/firestore'

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

/**
 * Firestore with a persistent local cache.
 *
 * `getFirestore(app)` alone keeps everything in memory, so the moment a hotel's wifi blips the
 * app empties out. Staff at a front desk see a roster, notes and a shift board that silently
 * become blank, and because an empty list looks like a real list there is no way to tell the
 * difference. Worse, a write made during the blip is discarded rather than queued, so a shift
 * handover recorded in a lift is just gone.
 *
 * With the local cache the last known state stays readable while offline and writes are queued
 * until the connection returns.
 *
 * `persistentMultipleTabManager` rather than the single tab default: a front desk and a back
 * office are routinely open at the same time, and the single tab manager logs an error and
 * disables persistence when a second tab opens.
 *
 * Persistence is a best effort. It can be refused (private browsing, quota, an old browser) and
 * the SDK falls back to memory on its own, but an initialisation failure must not take the whole
 * app down, hence the fallback to the plain in-memory instance.
 */
function createFirestore() {
    try {
        return initializeFirestore(app, {
            localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager(),
            }),
        })
    } catch (error) {
        // Already initialised elsewhere in this bundle, or the environment refuses IndexedDB.
        console.warn('Firestore persistence unavailable, falling back to memory only:', error)
        return getFirestore(app)
    }
}

export const db = createFirestore()

/**
 * Erases the on device copy of Firestore data.
 *
 * Persistence has a cost that has to be paid deliberately: the cache is readable by anyone who
 * opens the app on that device, signed in or not. Hotel hardware is shared between shifts, so the
 * previous manager's notes, prices and messages sitting in IndexedDB after they sign out is the
 * same leak the in memory stores had, one layer deeper and much less visible.
 *
 * Called from signOut, alongside clearing the stores. The tradeoff is deliberate: a user gets
 * offline data for the whole of their shift, and signing out erases it.
 */
export async function clearLocalFirestoreCache() {
    try {
        await clearIndexedDbPersistence(db)
    } catch (error) {
        // Nothing to clear, or the browser refused. Not worth failing a sign out over.
        console.warn('Could not clear the local Firestore cache:', error)
    }
}
