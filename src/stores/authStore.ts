import { create } from 'zustand'
import { toast } from 'sonner'
import {
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    type User as FirebaseUser
} from 'firebase/auth'
import { doc, getDoc, updateDoc, type DocumentData, type UpdateData } from 'firebase/firestore'
import { auth, db, clearLocalFirestoreCache } from '@/lib/firebase'
import type { User, UserRole } from '@/types'
import { useActivityStore } from './activityStore'
import { resetAllStores } from './resetAllStores'
import { cleanAuthError } from '@/lib/utils'
import { useLanguageStore } from './languageStore'
import { buildUserSettingsPatch } from '@/lib/workspace'

interface AuthState {
    user: User | null
    firebaseUser: FirebaseUser | null
    loading: boolean
    error: string | null
    initialized: boolean
    isBooted: boolean
}

interface AuthActions {
    signIn: (email: string, password: string) => Promise<void>
    loginAsDemo: (role: UserRole) => Promise<void>
    signOut: () => Promise<void>
    clearError: () => void
    initialize: () => () => void
    updateSettings: (settings: Partial<NonNullable<User['settings']>>) => Promise<void>
    setBooted: (val: boolean) => void
}

type AuthStore = AuthState & AuthActions

const DEMO_UIDS: Partial<Record<UserRole, string>> = {
    gm: 'demo-user-gm',
    receptionist: 'demo-user-staff',
}

export const useAuthStore = create<AuthStore>((set) => ({
    // State
    user: null,
    firebaseUser: null,
    loading: false,
    error: null,
    initialized: false,
    isBooted: false,

    // Actions
    signIn: async (email: string, password: string) => {
        set({ loading: true, error: null })

        try {
            const credential = await signInWithEmailAndPassword(auth, email, password)

            // Fetch user data from Firestore
            const userDoc = await getDoc(doc(db, 'users', credential.user.uid))

            if (userDoc.exists()) {
                const userData = userDoc.data()
                
                if (userData.status === 'inactive') {
                    await firebaseSignOut(auth)
                    set({ error: 'Your account has been deactivated. Please contact your manager.', loading: false })
                    return
                }

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
                // Log login activity
                if (userData.hotel_id) {
                    useActivityStore.getState().logActivity(
                        userData.hotel_id, credential.user.uid,
                        userData.name || 'User', (userData.role as UserRole) || 'receptionist',
                        'login'
                    )
                }
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
        } catch (error: any) {
            const { t } = useLanguageStore.getState()
            const cleanMessage = cleanAuthError(error, t)

            set({
                error: cleanMessage,
                loading: false
            })
            toast.error(cleanMessage)
        }
    },

    loginAsDemo: async (role: UserRole) => {
        set({ loading: true, error: null })

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Demo accounts are shared fixtures: the roster, hotel, shift and note seeds all
        // reference these ids, so a persona that is not in them would be invisible to
        // staff lists, message threads and announcement audiences.
        const demoUid = DEMO_UIDS[role] || 'demo-user-' + role
        const demoHotelId = 'demo-hotel-id'

        const demoUser: User = {
            uid: demoUid,
            email: `demo.${role}@relay.app`,
            name: role === 'gm' ? 'Demo Manager' : 'Demo Staff',
            role: role,
            hotel_id: demoHotelId,
            current_shift_type: role === 'gm' ? null : 'A',
            settings: { language: 'tr' },
            is_demo: true
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
            // Log logout activity before clearing state
            const currentUser = useAuthStore.getState().user
            if (currentUser?.hotel_id) {
                await useActivityStore.getState().logActivity(
                    currentUser.hotel_id, currentUser.uid,
                    currentUser.name, currentUser.role,
                    'logout'
                )
            }
            await firebaseSignOut(auth)

            // Clear every store that holds hotel data. Anything left behind here is readable
            // by the next account that signs in on this device. This also sweeps the hotel
            // scoped localStorage keys; device preferences like language and theme survive.
            resetAllStores()

            // Firestore keeps a persistent on device cache so the app stays readable while the
            // wifi is down. That cache outlives sign out, so the previous hotel's notes, prices
            // and messages would sit in IndexedDB for whoever opens the app next. Hotel hardware
            // is shared between shifts, so the local copy goes with the session.
            await clearLocalFirestoreCache()

            set({ user: null, firebaseUser: null, loading: false, isBooted: false })
            toast.success('Logged out')
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Logout failed'
            set({ error: errorMessage, loading: false })
        }
    },

    clearError: () => set({ error: null }),

    initialize: () => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            // Priority: If we already have a demo user, don't let Firebase overwrite it
            const currentUser = useAuthStore.getState().user
            if (currentUser?.is_demo) {
                set({ initialized: true, loading: false })
                return
            }

            if (firebaseUser) {
                // User is signed in, fetch their data
                try {
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))

                    if (userDoc.exists()) {
                        const userData = userDoc.data()
                        
                        if (userData.status === 'inactive') {
                            await firebaseSignOut(auth)
                            set({
                                user: null,
                                firebaseUser: null,
                                initialized: true,
                                loading: false
                            })
                            return
                        }

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

        // Sync language from Firestore to languageStore
        const sub = useAuthStore.subscribe((state) => {
            const firestoreLang = state.user?.settings?.language
            if (firestoreLang && firestoreLang !== useLanguageStore.getState().language) {
                void useLanguageStore.getState().setLanguage(firestoreLang, false)
            }
        })

        return () => {
            unsubscribe()
            sub()
        }
    },

    updateSettings: async (settings) => {
        const { user } = useAuthStore.getState()
        if (!user) return

        try {
            const newSettings = { ...user.settings, ...settings }
            if (user.is_demo) {
                set({ user: { ...user, settings: newSettings } })
                return
            }
            const userRef = doc(db, 'users', user.uid)
            await updateDoc(userRef, buildUserSettingsPatch(settings) as UpdateData<DocumentData>)

            set((state) => state.user?.uid === user.uid ? {
                user: {
                    ...state.user,
                    settings: { ...state.user.settings, ...settings },
                },
            } : state)
        } catch (error) {
            console.error("Error updating user settings:", error)
            throw error
        }
    },
    setBooted: (val) => set({ isBooted: val })
}))

if (typeof window !== 'undefined') {
    (window as any).useAuthStore = useAuthStore
}
