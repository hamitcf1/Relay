import { initializeApp, deleteApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, setDoc, arrayUnion, updateDoc } from 'firebase/firestore'
import { db } from './firebase'
import type { UserRole } from '@/types'

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export async function createSecondaryUser(params: {
    email: string
    password: string
    name: string
    role: UserRole
    hotelId: string
}) {
    // 1. Initialize a secondary Firebase app
    const appName = `SecondaryApp_${Date.now()}`
    const secondaryApp = initializeApp(firebaseConfig, appName)
    const secondaryAuth = getAuth(secondaryApp)

    try {
        // 2. Create the user using the secondary app
        const userCredential = await createUserWithEmailAndPassword(
            secondaryAuth,
            params.email,
            params.password
        )
        
        const newUid = userCredential.user.uid

        // 3. Create the user document in Firestore using the primary app (db)
        await setDoc(doc(db, 'users', newUid), {
            email: params.email,
            name: params.name.trim(),
            role: params.role,
            current_shift_type: null,
            hotel_id: params.hotelId,
            status: 'active',
            created_at: new Date(),
        })

        // 4. Add the user to the hotel's staff list
        await updateDoc(doc(db, 'hotels', params.hotelId), {
            staff_list: arrayUnion(newUid)
        })

        return newUid
    } finally {
        // 5. Clean up the secondary app to prevent memory leaks and state issues
        await signOut(secondaryAuth).catch(() => {})
        await deleteApp(secondaryApp).catch(() => {})
    }
}
