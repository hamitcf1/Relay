import { create } from 'zustand'
import { 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    onSnapshot, 
    serverTimestamp,
    where
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Incident, IncidentStatus, IncidentType } from '@/types'
import { toast } from 'sonner'
import { useAuthStore } from './authStore'
import { useActivityStore } from './activityStore'

interface IncidentState {
    incidents: Incident[]
    loading: boolean
    error: string | null
}

interface IncidentActions {
    subscribeToIncidents: (hotelId: string) => () => void
    addIncident: (hotelId: string, incident: Omit<Incident, 'id'>) => Promise<void>
    updateIncidentStatus: (hotelId: string, incidentId: string, status: IncidentStatus) => Promise<void>
    deleteIncident: (hotelId: string, incidentId: string) => Promise<void>
}

type IncidentStore = IncidentState & IncidentActions

export const useIncidentStore = create<IncidentStore>((set) => ({
    incidents: [],
    loading: true,
    error: null,

    subscribeToIncidents: (hotelId: string) => {
        set({ loading: true, error: null })

        const incidentsRef = collection(db, 'hotels', hotelId, 'incidents')
        const q = query(incidentsRef)

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const list = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Incident[]
                set({ incidents: list, loading: false })
            },
            (err) => {
                console.error('Error subscribing to incidents:', err)
                set({ error: err.message, loading: false })
            }
        )

        return unsubscribe
    },

    addIncident: async (hotelId, data) => {
        try {
            const incidentsRef = collection(db, 'hotels', hotelId, 'incidents')
            const docRef = await addDoc(incidentsRef, {
                ...data,
                created_at: serverTimestamp()
            })

            // Log activity
            const user = useAuthStore.getState().user
            if (user) {
                useActivityStore.getState().logActivity(
                    hotelId, user.uid, user.name, user.role,
                    'note_create', // Reusing action type or could add 'incident_report'
                    `Incident: ${data.type} in Room ${data.room} (${data.item})`
                )
            }

            toast.success('Incident reported')
        } catch (err) {
            console.error('Error adding incident:', err)
            toast.error('Failed to report incident')
            throw err
        }
    },

    updateIncidentStatus: async (hotelId, incidentId, status) => {
        try {
            const docRef = doc(db, 'hotels', hotelId, 'incidents', incidentId)
            await updateDoc(docRef, { 
                status,
                updated_at: serverTimestamp()
            })
            toast.success(`Incident marked as ${status}`)
        } catch (err) {
            console.error('Error updating incident status:', err)
            toast.error('Failed to update status')
        }
    },

    deleteIncident: async (hotelId, incidentId) => {
        try {
            const docRef = doc(db, 'hotels', hotelId, 'incidents', incidentId)
            await deleteDoc(docRef)
            toast.success('Incident removed')
        } catch (err) {
            console.error('Error deleting incident:', err)
            toast.error('Failed to remove incident')
        }
    }
}))
