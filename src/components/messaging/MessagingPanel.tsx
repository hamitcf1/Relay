import { useState, useEffect } from 'react'
import { Send, MessageSquare, Megaphone, Loader2, Mail, Bell, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMessageStore } from '@/stores/messageStore'
import { useRosterStore } from '@/stores/rosterStore'
import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

export function MessagingPanel() {
    const { user } = useAuthStore()
    const { hotel } = useHotelStore()
    const { messages, subscribeToMessages, sendMessage, deleteMessage, loading } = useMessageStore()
    const { staff, subscribeToRoster } = useRosterStore()
    const { addNotification } = useNotificationStore()

    const [content, setContent] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [recipient, setRecipient] = useState<string>('gm') // 'gm', 'all', or specific uid
    const [isBanner, setIsBanner] = useState(false)

    const isGM = user?.role === 'gm'
    const staffMembers = staff.filter(s => s.role !== 'gm') // Exclude GM from staff list

    useEffect(() => {
        if (hotel?.id) {
            const unsubRoster = subscribeToRoster(hotel.id)
            return () => unsubRoster()
        }
    }, [hotel?.id, subscribeToRoster])

    useEffect(() => {
        if (hotel?.id && user?.uid) {
            const unsub = subscribeToMessages(hotel.id, user.uid)
            return () => unsub()
        }
    }, [hotel?.id, user?.uid, subscribeToMessages])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim() || !hotel?.id || !user) return

        setSubmitting(true)
        try {
            await sendMessage(hotel.id, {
                sender_id: user.uid,
                sender_name: user.name,
                receiver_id: recipient,
                content: content.trim()
            })

            // If it's a broadcast, also create a notification
            if (recipient === 'all' && hotel?.id) {
                await addNotification(hotel.id, {
                    type: 'announcement',
                    title: isBanner ? '⚠️ ÖNEMLİ DUYURU' : 'Yeni GM Duyurusu',
                    content: content.trim(),
                    target_role: 'all'
                })
            } else if (recipient !== 'gm' && hotel?.id) {
                // If specific user, notify them
                await addNotification(hotel.id, {
                    type: 'message',
                    title: `Yeni Mesaj: ${user.name}`,
                    content: content.trim().substring(0, 50) + (content.length > 50 ? '...' : ''),
                    target_uid: recipient
                })
            } else if (recipient === 'gm' && !isGM && hotel?.id) {
                // If staff sending to GM, notify GM role
                await addNotification(hotel.id, {
                    type: 'message',
                    title: `Personel Mesajı: ${user.name}`,
                    content: content.trim().substring(0, 50) + (content.length > 50 ? '...' : ''),
                    target_role: 'gm'
                })
            }

            setContent('')
        } catch (error) {
            console.error("Message send error:", error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteMessage = async (id: string) => {
        if (!hotel?.id) return
        if (window.confirm('Bu mesajı silmek istediğinize emin misiniz?')) {
            await deleteMessage(hotel.id, id)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Internal Communications</h2>
                    <p className="text-zinc-500 text-sm">Direct messaging and hotel-wide announcements.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Message List */}
                <Card className="md:col-span-3 bg-zinc-900/50 border-zinc-800 flex flex-col h-[600px]">
                    <CardHeader className="border-b border-zinc-800 pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-zinc-200 text-base flex items-center gap-2">
                                <Mail className="w-4 h-4 text-indigo-400" />
                                {isGM ? "Staff Messages & Announcements" : "Messages to Management"}
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {loading ? (
                            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-zinc-700" /></div>
                        ) : messages.length === 0 ? (
                            <div className="text-center py-20">
                                <MessageSquare className="w-12 h-12 text-zinc-800 mx-auto mb-4 opacity-20" />
                                <p className="text-zinc-600">No messages found.</p>
                            </div>
                        ) : (
                            messages.map((m) => {
                                const isOwn = m.sender_id === user?.uid
                                const isAnnouncement = m.receiver_id === 'all'

                                return (
                                    <motion.div
                                        key={m.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={cn(
                                            "flex flex-col max-w-[80%] group",
                                            isOwn ? "ml-auto items-end" : "items-start",
                                            isAnnouncement && "max-w-full w-full items-center mx-auto"
                                        )}
                                    >
                                        <div className="flex items-start gap-2 max-w-full">
                                            {isOwn && (
                                                <button
                                                    onClick={() => handleDeleteMessage(m.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-rose-500 transition-all mt-2"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            <div className={cn(
                                                "rounded-2xl px-4 py-2.5 text-sm",
                                                isAnnouncement
                                                    ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 w-full text-center"
                                                    : isOwn
                                                        ? "bg-indigo-600 text-white rounded-tr-none"
                                                        : "bg-zinc-800 text-zinc-200 rounded-tl-none border border-zinc-700"
                                            )}>
                                                {isAnnouncement && (
                                                    <div className="flex items-center justify-center gap-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                                                        <Megaphone className="w-3 h-3" />
                                                        Announcement
                                                    </div>
                                                )}
                                                {!isOwn && !isAnnouncement && (
                                                    <p className="text-[10px] font-bold text-indigo-400 mb-1">{m.sender_name}</p>
                                                )}
                                                {m.content}
                                            </div>
                                            {!isOwn && isGM && !isAnnouncement && (
                                                <button
                                                    onClick={() => handleDeleteMessage(m.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-rose-500 transition-all mt-2"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-zinc-600 mt-1 px-1">
                                            {formatDistanceToNow(m.timestamp, { addSuffix: true })}
                                        </span>
                                    </motion.div>
                                )
                            })
                        )}
                    </CardContent>
                    <div className="p-4 border-t border-zinc-800 bg-zinc-950/30">
                        <form onSubmit={handleSend} className="flex gap-2">
                            <div className="flex-1 flex gap-2">
                                {isGM && (
                                    <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
                                        <button
                                            type="button"
                                            onClick={() => { setRecipient('all'); setIsBanner(false); }}
                                            className={cn(
                                                "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                                                recipient === 'all' ? "bg-indigo-600 text-white" : "text-zinc-500 hover:text-zinc-300"
                                            )}
                                        >
                                            ALL
                                        </button>
                                        <Select value={recipient === 'gm' || recipient === 'all' ? '' : recipient} onValueChange={(v) => setRecipient(v)}>
                                            <SelectTrigger className="h-6 w-24 bg-transparent border-0 text-[10px] font-bold">
                                                <SelectValue placeholder="STAFF" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {staffMembers.map(s => (
                                                    <SelectItem key={s.uid} value={s.uid}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {recipient === 'all' && (
                                            <button
                                                type="button"
                                                onClick={() => setIsBanner(!isBanner)}
                                                className={cn(
                                                    "px-2 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1",
                                                    isBanner ? "bg-amber-600 text-white" : "text-zinc-500 hover:text-amber-400"
                                                )}
                                                title="Banner (Important)"
                                            >
                                                <Bell className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                )}
                                <Input
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder={recipient === 'all' ? "Broadcast announcement..." : "Type your message..."}
                                    className="bg-zinc-900/50 border-zinc-800 h-10 border-0 focus-visible:ring-1 focus-visible:ring-indigo-500"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={submitting || !content.trim()}
                                className="bg-indigo-600 hover:bg-indigo-500 h-10 w-10 p-0 shrink-0"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </Button>
                        </form>
                    </div>
                </Card>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-zinc-400 text-xs uppercase tracking-wider font-bold">Directions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!isGM ? (
                                <div className="space-y-2">
                                    <p className="text-xs text-zinc-500 italic">Sending a message here will notify the General Manager immediately.</p>
                                    <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 text-[11px] text-indigo-400">
                                        Use this for reporting urgent issues, schedule requests, or direct feedback.
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-xs text-zinc-500 italic">Toggle between broadcasting to all staff or replying to individuals.</p>
                                    <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 text-[11px] text-amber-500">
                                        Announcements will appear in the notification center for everyone.
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
