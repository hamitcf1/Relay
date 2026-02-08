import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Megaphone, X, Bell } from 'lucide-react'
import { useNotificationStore } from '@/stores/notificationStore'
import { useHotelStore } from '@/stores/hotelStore'
import { Button } from '@/components/ui/button'

export function AnnouncementModal() {
    const { hotel } = useHotelStore()
    const { notifications, markAsRead } = useNotificationStore()

    // Find the latest unread announcement
    const announcement = notifications
        .filter(n => n.type === 'announcement' && !n.is_read)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]

    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        if (announcement) {
            setIsVisible(true)
        } else {
            setIsVisible(false)
        }
    }, [announcement])

    const handleDismiss = async () => {
        if (hotel?.id && announcement) {
            await markAsRead(hotel.id, announcement.id)
            setIsVisible(false)
        }
    }

    return (
        <AnimatePresence>
            {isVisible && announcement && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-full max-w-lg bg-zinc-900 border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden"
                    >
                        <div className="relative p-8">
                            {/* Decorative Background Icon */}
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Megaphone className="w-32 h-32 text-indigo-500" />
                            </div>

                            <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                                <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                                    <Megaphone className="w-8 h-8 text-indigo-400" />
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-white tracking-tight">
                                        {announcement.title}
                                    </h3>
                                    <div className="flex items-center justify-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-[0.2em]">
                                        <Bell className="w-3 h-3" />
                                        Official GM Broadcast
                                    </div>
                                </div>

                                <div className="bg-zinc-950/50 p-6 rounded-2xl border border-zinc-800 w-full max-h-[40vh] overflow-y-auto custom-scrollbar">
                                    <p className="text-zinc-300 leading-relaxed text-lg italic whitespace-pre-wrap">
                                        "{announcement.content}"
                                    </p>
                                </div>

                                <Button
                                    onClick={handleDismiss}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 h-12 rounded-xl font-bold group"
                                >
                                    Understood
                                    <X className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
