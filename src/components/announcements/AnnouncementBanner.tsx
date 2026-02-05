import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, Trash2 } from 'lucide-react'
import { useMessageStore } from '@/stores/messageStore'
import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'

/**
 * AnnouncementBanner displays important GM announcements at the top of the dashboard.
 * Only shows messages that are marked as 'all' (broadcast) and are recent (< 24 hours).
 */
export function AnnouncementBanner() {
    const { user, updateSettings } = useAuthStore()
    const { hotel } = useHotelStore()
    const { messages, subscribeToMessages, deleteMessage } = useMessageStore()

    // Filter for important announcements (receiver_id === 'all' and recent)
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const announcements = messages.filter(m =>
        m.receiver_id === 'all' &&
        m.timestamp > oneDayAgo &&
        !(user?.settings?.dismissed_announcements || []).includes(m.id)
    ).slice(0, 3) // Show max 3 banners

    const handleDismiss = async (id: string) => {
        if (!user) return
        const dismissed = user.settings?.dismissed_announcements || []
        await updateSettings({
            dismissed_announcements: [...dismissed, id]
        })
    }

    const handleDelete = async (id: string) => {
        if (!hotel?.id) return
        if (window.confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) {
            await deleteMessage(hotel.id, id)
        }
    }

    useEffect(() => {
        if (hotel?.id && user?.uid) {
            const unsub = subscribeToMessages(hotel.id, user.uid)
            return () => unsub()
        }
    }, [hotel?.id, user?.uid, subscribeToMessages])

    if (announcements.length === 0) return null

    return (
        <div className="space-y-2 mb-4">
            <AnimatePresence>
                {announcements.map(a => (
                    <motion.div
                        key={a.id}
                        initial={{ opacity: 0, y: -20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -20, height: 0 }}
                        className="bg-gradient-to-r from-amber-600/20 via-amber-500/10 to-amber-600/20 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3"
                    >
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Önemli Duyuru</span>
                                <span className="text-[10px] text-amber-500/60">
                                    {formatDistanceToNow(a.timestamp, { addSuffix: true })}
                                </span>
                            </div>
                            <p className="text-sm text-amber-100">{a.content}</p>
                            <p className="text-[10px] text-amber-500/50 mt-1">— {a.sender_name}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                            {user?.role === 'gm' && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(a.id)}
                                    className="h-6 w-6 p-0 text-rose-500 hover:text-rose-300 hover:bg-rose-500/10"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDismiss(a.id)}
                                className="h-6 w-6 p-0 text-amber-500 hover:text-amber-300 hover:bg-amber-500/10"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}
