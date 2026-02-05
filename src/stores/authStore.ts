import { create } from 'zustand'
import {
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    type User as FirebaseUser
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import type { User, UserRole } from '@/types'

interface AuthState {
    user: User | null
    firebaseUser: FirebaseUser | null
    loading: boolean
    error: string | null
    initialized: boolean
}

interface AuthActions {
    signIn: (email: string, password: string) => Promise<void>
    signOut: () => Promise<void>
    clearError: () => void
    initialize: () => () => void
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>((set) => ({
    // State
    user: null,
    firebaseUser: null,
    loading: false,
    error: null,
    initialized: false,

    // Actions
    signIn: async (email: string, password: string) => {
        set({ loading: true, error: null })

        try {
            const credential = await signInWithEmailAndPassword(auth, email, password)

            // Fetch user data from Firestore
            const userDoc = await getDoc(doc(db, 'users', credential.user.uid))

            if (userDoc.exists()) {
                const userData = userDoc.data()
                set({
                    user: {
                        uid: credential.user.uid,
                        email: credential.user.email || '',
                        name: userData.name || 'User',
                        role: (userData.role as UserRole) || 'receptionist',
                        current_shift_type: userData.current_shift_type || null,
                    },
                    firebaseUser: credential.user,
                    loading: false,
                })
            } else {
                // User exists in Auth but not in Firestore
                // Create a default user object
                set({
                    user: {
                        uid: credential.user.uid,
                        email: credential.user.email || '',
                        name: credential.user.email?.split('@')[0] || 'User',
                        role: 'receptionist',
                        current_shift_type: null,
                    },
                    firebaseUser: credential.user,
                    loading: false,
                })
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Login failed'
            set({
                error: errorMessage.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim(),
                loading: false
            })
        }
    },

    signOut: async () => {
        set({ loading: true })
        try {
            await firebaseSignOut(auth)
            set({ user: null, firebaseUser: null, loading: false })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Logout failed'
            set({ error: errorMessage, loading: false })
        }
    },

    clearError: () => set({ error: null }),

    initialize: () => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // User is signed in, fetch their data
                try {
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))

                    if (userDoc.exists()) {
                        const userData = userDoc.data()
                        set({
                            user: {
                                uid: firebaseUser.uid,
                                email: firebaseUser.email || '',
                                name: userData.name || 'User',
                                role: (userData.role as UserRole) || 'receptionist',
                                current_shift_type: userData.current_shift_type || null,
                            },
                            firebaseUser,
                            initialized: true,
                            loading: false,
                        })
                    } else {
                        set({
                            user: {
                                uid: firebaseUser.uid,
                                email: firebaseUser.email || '',
                                name: firebaseUser.email?.split('@')[0] || 'User',
                                role: 'receptionist',
                                current_shift_type: null,
                            },
                            firebaseUser,
                            initialized: true,
                            loading: false,
                        })
                    }
                } catch {
                    set({
                        user: null,
                        firebaseUser: null,
                        initialized: true,
                        loading: false
                    })
                }
            } else {
                // User is signed out
                set({
                    user: null,
                    firebaseUser: null,
                    initialized: true,
                    loading: false
                })
            }
        })

        return unsubscribe
    },
}))
