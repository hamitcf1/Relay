import { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Send, MessageSquare, Megaphone, Search, Check, CheckCheck, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMessageStore } from '@/stores/messageStore'
import { useRosterStore } from '@/stores/rosterStore'
import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { useLanguageStore } from '@/stores/languageStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { isSameDay, format } from 'date-fns'
import { cn, formatDisplayDate } from '@/lib/utils'
import { type PrivateMessage } from '@/types'
import { useFormatting } from '@/hooks/useFormatting'
import { FormattingContextMenu } from '@/components/ui/FormattingContextMenu'
import { TextFormatter } from '@/components/ui/TextFormatter'

export function MessagingPanel() {
    const { user } = useAuthStore()
    const { hotel } = useHotelStore()
    const { t } = useLanguageStore()
    const { messages, subscribeToMessages, sendMessage, markAsRead, clearChat, deleteMessage } = useMessageStore()
    const { staff, subscribeToRoster } = useRosterStore()
    const { addNotification } = useNotificationStore()
    const [searchParams] = useSearchParams()

    const [activeConversation, setActiveConversation] = useState<string>('all') // 'all' or user uid
    const [newMessage, setNewMessage] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const messageInputRef = useRef<HTMLTextAreaElement>(null)
    const formatting = useFormatting(newMessage, setNewMessage, messageInputRef)
    const scrollRef = useRef<HTMLDivElement>(null)

    // Handle Deep Linking via URL query params
    useEffect(() => {
        const chatParam = searchParams.get('chat')
        if (chatParam) {
            setActiveConversation(chatParam)
        }
    }, [searchParams])

    // Subscribe to data
    useEffect(() => {
        if (!hotel?.id || !user?.uid) return
        const unsubRoster = subscribeToRoster(hotel.id)
        const unsubMessages = subscribeToMessages(hotel.id, user.uid)
        return () => {
            unsubRoster()
            unsubMessages()
        }
    }, [hotel?.id, user?.uid, subscribeToMessages, subscribeToRoster])

    // Scroll to bottom on new message
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, activeConversation])

    // Mark as read when viewing conversation
    useEffect(() => {
        if (!hotel?.id || !user?.uid) return

        const unreadInActive = messages.filter(m =>
            !m.is_read &&
            m.receiver_id === user.uid &&
            ((activeConversation === 'all' && m.receiver_id === 'all') || m.sender_id === activeConversation)
        )

        unreadInActive.forEach(m => {
            markAsRead(hotel.id, m.id)
        })
    }, [activeConversation, messages, hotel?.id, user?.uid, markAsRead])

    // Filter staff list
    const filteredStaff = useMemo(() => {
        return staff.filter(s =>
            s.uid !== user?.uid && // Exclude self
            (s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.role?.toLowerCase().includes(searchTerm.toLowerCase()))
        )
    }, [staff, user?.uid, searchTerm])

    // Group messages by conversation logic
    const getUnreadCount = (uid: string) => {
        return messages.filter(m => !m.is_read && m.sender_id === uid && m.receiver_id === user?.uid).length
    }

    // Sort staff: Unread first, then alphabetical
    const sortedStaff = useMemo(() => {
        return [...filteredStaff].sort((a, b) => {
            const unreadA = getUnreadCount(a.uid)
            const unreadB = getUnreadCount(b.uid)
            if (unreadA !== unreadB) return unreadB - unreadA
            return a.name.localeCompare(b.name)
        })
    }, [filteredStaff, messages, user?.uid])

    // Get active conversation messages
    const currentMessages = useMemo(() => {
        if (activeConversation === 'all') {
            return messages.filter(m => m.receiver_id === 'all')
        }
        return messages.filter(m =>
            (m.sender_id === user?.uid && m.receiver_id === activeConversation) ||
            (m.sender_id === activeConversation && m.receiver_id === user?.uid)
        )
    }, [messages, activeConversation, user?.uid])

    // Helper: Group by date
    const groupedMessages = useMemo(() => {
        const groups: { date: Date; msgs: PrivateMessage[] }[] = []
        let currentDate: Date | null = null

        currentMessages.forEach(msg => {
            if (!currentDate || !isSameDay(currentDate, msg.timestamp)) {
                currentDate = msg.timestamp
                groups.push({ date: currentDate, msgs: [] })
            }
            groups[groups.length - 1].msgs.push(msg)
        })
        return groups
    }, [currentMessages])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !hotel?.id || !user) return

        const isAnnouncement = activeConversation === 'all'
        if (isAnnouncement && user.role !== 'gm') return

        const content = newMessage.trim()
        setNewMessage('') // Optimistic clear

        try {
            await sendMessage(hotel.id, {
                sender_id: user.uid,
                sender_name: user.name,
                receiver_id: activeConversation,
                content: content
            })

            // Notifications logic
            if (activeConversation === 'all') {
                await addNotification(hotel.id, {
                    type: 'announcement',
                    title: `📢 ${user.name}`,
                    content: content,
                    target_role: 'all',
                    link: '/operations?chat=all'
                })
            } else {
                await addNotification(hotel.id, {
                    type: 'message',
                    title: `Message from ${user.name}`,
                    content: content,
                    target_uid: activeConversation,
                    link: `/operations?chat=${user.uid}`
                })
            }
        } catch (error) {
            console.error("Failed to send", error)
        }
    }

    return (
        <div className="h-full flex flex-col md:flex-row gap-4 bg-background rounded-xl overflow-hidden border border-border shadow-sm">
            {/* Sidebar */}
            <div className={cn(
                "w-full md:w-72 bg-muted/30 flex flex-col border-r border-border",
                activeConversation !== 'all' && activeConversation !== '' ? "hidden md:flex" : "flex"
            )}>
                <div className="p-4 border-b border-border">
                    <h3 className="font-bold text-foreground mb-4">{t('messages.title')}</h3>
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t('messages.search')}
                            className="h-8 pl-8 bg-background border-border text-xs"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {/* General Channel */}
                    <button
                        onClick={() => setActiveConversation('all')}
                        className={cn(
                            "w-full flex items-center gap-3 p-2 rounded-lg transition-all",
                            activeConversation === 'all'
                                ? "bg-primary/10 border border-primary/20"
                                : "hover:bg-muted/50 border border-transparent"
                        )}
                    >
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <Megaphone className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className={cn("text-sm font-medium", activeConversation === 'all' ? "text-primary" : "text-foreground")}>{t('messages.announcements')}</p>
                            <p className="text-[10px] text-muted-foreground">{t('messages.broadcast')}</p>
                        </div>
                    </button>

                    <div className="h-px bg-border my-2 mx-2" />

                    {/* Staff List */}
                    {sortedStaff.map(s => {
                        const unread = getUnreadCount(s.uid)
                        return (
                            <button
                                key={s.uid}
                                onClick={() => setActiveConversation(s.uid)}
                                className={cn(
                                    "w-full flex items-center gap-3 p-2 rounded-lg transition-all group",
                                    activeConversation === s.uid
                                        ? "bg-accent border border-border"
                                        : "hover:bg-muted/50 border border-transparent"
                                )}
                            >
                                <Avatar className="w-8 h-8 border border-border">
                                    <AvatarFallback className="bg-muted text-xs text-muted-foreground font-bold">
                                        {s.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex justify-between items-center">
                                        <p className={cn("text-sm font-medium truncate", activeConversation === s.uid ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                                            {s.name}
                                        </p>
                                        {unread > 0 && (
                                            <Badge className="h-4 px-1.5 bg-primary hover:bg-primary text-primary-foreground text-[9px]">{unread}</Badge>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.role}</p>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Chat Area */}
            <div className={cn(
                "flex-1 flex flex-col bg-background/50",
                activeConversation === 'all' || activeConversation === '' ? "hidden md:flex" : "flex"
            )}>
                {/* Header */}
                <div className="h-14 border-b border-border flex items-center px-4 md:px-6 justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden -ml-2 mr-1"
                            onClick={() => setActiveConversation('all')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left w-5 h-5"><path d="m15 18-6-6 6-6" /></svg>
                        </Button>
                        {activeConversation === 'all' ? (
                            <>
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Megaphone className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-foreground">{t('messages.announcements')}</h2>
                                    <p className="text-xs text-muted-foreground">{t('messages.broadcast')}</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <Avatar className="w-8 h-8 border border-border">
                                    <AvatarFallback className="bg-muted text-muted-foreground text-xs font-bold">
                                        {staff.find(s => s.uid === activeConversation)?.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="font-bold text-foreground">
                                        {staff.find(s => s.uid === activeConversation)?.name || t('roster.unknown')}
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        {staff.find(s => s.uid === activeConversation)?.role || t('common.staff')}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {activeConversation !== 'all' && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 ml-2"
                            title={t('messaging.clearTooltip')}
                            onClick={async () => {
                                if (window.confirm(t('messaging.clearChatConfirm'))) {
                                    if (hotel?.id && user?.uid) {
                                        await clearChat(hotel.id, user.uid, activeConversation)
                                    }
                                }
                            }}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
                    {groupedMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                            <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-sm">{t('messaging.noMessages')}</p>
                        </div>
                    ) : (
                        groupedMessages.map((group, i) => (
                            <div key={i} className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-px bg-border flex-1" />
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted/50 px-2 rounded-full border border-border">
                                        {formatDisplayDate(group.date)}
                                    </span>
                                    <div className="h-px bg-border flex-1" />
                                </div>
                                {group.msgs.map(msg => {
                                    const isMe = msg.sender_id === user?.uid
                                    return (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={cn("flex gap-3 max-w-[75%]", isMe ? "ml-auto flex-row-reverse" : "")}
                                        >
                                            {!isMe && (
                                                <Avatar className="w-8 h-8 border border-border shrink-0">
                                                    <AvatarFallback className="bg-muted text-[9px] text-muted-foreground">
                                                        {msg.sender_name.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}

                                            <div className={cn(
                                                "p-3 rounded-2xl text-sm leading-relaxed relative group/msg",
                                                isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card border border-border text-foreground rounded-tl-sm"
                                            )}>
                                                {activeConversation === 'all' && !isMe && (
                                                    <p className="text-[10px] font-bold text-primary mb-1">{msg.sender_name}</p>
                                                )}
                                                <TextFormatter text={msg.content} />
                                                <div className={cn("text-[9px] mt-1 flex items-center justify-end gap-1 opacity-70", isMe ? "text-primary-foreground/80" : "text-muted-foreground")}>
                                                    {format(msg.timestamp, 'HH:mm')}
                                                    {isMe && (
                                                        msg.is_read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                                                    )}
                                                </div>

                                                {/* Delete Message Button */}
                                                {(isMe || user?.role === 'gm') && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            if (confirm(t('messaging.deleteMessageConfirm'))) {
                                                                if (hotel?.id) deleteMessage(hotel.id, msg.id)
                                                            }
                                                        }}
                                                        className={cn(
                                                            "absolute -top-2 p-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 opacity-0 group-hover/msg:opacity-100 transition-opacity hover:text-rose-500 hover:border-rose-500",
                                                            isMe ? "-left-2" : "-right-2"
                                                        )}
                                                        title={t('messaging.deleteTooltip')}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 bg-muted/20 border-t border-border">
                    <form onSubmit={handleSend} className="flex gap-3">
                        <Textarea
                            ref={messageInputRef}
                            placeholder={
                                activeConversation === 'all'
                                    ? (user?.role === 'gm' ? t('messaging.everyone') : t('messaging.gmOnly'))
                                    : t('messaging.placeholder')
                            }
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onContextMenu={formatting.handleContextMenu}
                            disabled={activeConversation === 'all' && user?.role !== 'gm'}
                            className="bg-background border-border focus-visible:ring-primary/50 min-h-[44px] max-h-[120px] py-3 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSend(e as any)
                                }
                            }}
                        />
                        <FormattingContextMenu
                            state={formatting.menu}
                            onClose={formatting.closeMenu}
                            onToggleBullet={formatting.toggleBullet}
                            t={t}
                        />
                        <Button
                            type="submit"
                            disabled={!newMessage.trim() || (activeConversation === 'all' && user?.role !== 'gm')}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}
