import { create } from 'zustand'
import {
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    type User as FirebaseUser
} from 'firebase/auth'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import type { User, UserRole } from '@/types'
import { useHotelStore } from './hotelStore'
import { useNotificationStore } from './notificationStore'
import { useShiftStore } from './shiftStore'

interface AuthState {
    user: User | null
    firebaseUser: FirebaseUser | null
    loading: boolean
    error: string | null
    initialized: boolean
}

interface AuthActions {
    signIn: (email: string, password: string) => Promise<void>
    loginAsDemo: (role: UserRole) => Promise<void>
    signOut: () => Promise<void>
    clearError: () => void
    initialize: () => () => void
    updateSettings: (settings: Partial<NonNullable<User['settings']>>) => Promise<void>
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
                        hotel_id: userData.hotel_id || null,
                        current_shift_type: userData.current_shift_type || null,
                        settings: userData.settings || {},
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
                        hotel_id: null,
                        current_shift_type: null,
                        settings: {},
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

    loginAsDemo: async (role: UserRole) => {
        set({ loading: true, error: null })

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500))

        const demoUid = 'demo-user-' + role
        const demoHotelId = 'demo-hotel-id'

        const demoUser: User = {
            uid: demoUid,
            email: `demo.${role}@relay.app`,
            name: role === 'gm' ? 'Demo Manager' : 'Demo Staff',
            role: role,
            hotel_id: demoHotelId,
            current_shift_type: role === 'gm' ? null : 'A',
            settings: { language: 'tr' }
        }

        // Mock Firebase User
        const demoFirebaseUser = {
            uid: demoUid,
            email: demoUser.email,
            emailVerified: true,
            isAnonymous: true,
            providerData: [],
            refreshToken: '',
            tenantId: null,
            delete: async () => { },
            getIdToken: async () => 'demo-token',
            getIdTokenResult: async () => ({
                token: 'demo-token',
                signInProvider: 'custom',
                claims: {},
                authTime: Date.now().toString(),
                issuedAtTime: Date.now().toString(),
                expirationTime: (Date.now() + 3600000).toString(),
            }),
            reload: async () => { },
            toJSON: () => ({}),
            displayName: demoUser.name,
            phoneNumber: null,
            photoURL: null,
            metadata: {
                creationTime: new Date().toISOString(),
                lastSignInTime: new Date().toISOString(),
            }
        } as unknown as FirebaseUser

        set({
            user: demoUser,
            firebaseUser: demoFirebaseUser,
            loading: false
        })
    },

    signOut: async () => {
        set({ loading: true })
        try {
            await firebaseSignOut(auth)

            // Clear all stores to prevent data leaks between users
            useHotelStore.setState({ hotel: null, error: null, loading: true })
            useNotificationStore.setState({ notifications: [], unreadCount: 0, error: null, loading: true })
            useShiftStore.setState({ currentShift: null, loading: true, error: null })

            // Note: We might want to import other stores to clear them too if they hold sensitive data
            // but these are the critical ones for the reported issue.

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
                                hotel_id: userData.hotel_id || null,
                                current_shift_type: userData.current_shift_type || null,
                                settings: userData.settings || {},
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
                                hotel_id: null,
                                current_shift_type: null,
                                settings: {},
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

    updateSettings: async (settings) => {
        const { user } = useAuthStore.getState()
        if (!user) return

        try {
            const userRef = doc(db, 'users', user.uid)
            const newSettings = { ...user.settings, ...settings }
            await updateDoc(userRef, { settings: newSettings })

            set({
                user: {
                    ...user,
                    settings: newSettings
                }
            })
        } catch (error) {
            console.error("Error updating user settings:", error)
        }
    }
}))
