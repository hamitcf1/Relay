import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import {
    LogIn,
    LogOut,
    Play,
    Square,
    StickyNote,
    Trash2,
    DollarSign,
    CreditCard,
    Send,
    ShieldCheck,
    CalendarDays,
    Loader2,
    Filter,
    User as UserIcon,
    ScrollText,
} from 'lucide-react'
import { useActivityStore } from '@/stores/activityStore'
import { useHotelStore } from '@/stores/hotelStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { ActivityAction } from '@/types'

const ACTION_META: Record<ActivityAction, { icon: typeof LogIn; label: string; color: string }> = {
    login: { icon: LogIn, label: 'Giriş', color: 'text-emerald-400' },
    logout: { icon: LogOut, label: 'Çıkış', color: 'text-rose-400' },
    shift_start: { icon: Play, label: 'Vardiya Başlangıç', color: 'text-blue-400' },
    shift_end: { icon: Square, label: 'Vardiya Bitiş', color: 'text-amber-400' },
    note_create: { icon: StickyNote, label: 'Not Oluşturma', color: 'text-violet-400' },
    note_edit: { icon: StickyNote, label: 'Not Düzenleme', color: 'text-violet-300' },
    note_delete: { icon: Trash2, label: 'Not Silme', color: 'text-rose-300' },
    message_send: { icon: Send, label: 'Mesaj Gönderme', color: 'text-sky-400' },
    pricing_update: { icon: DollarSign, label: 'Fiyat Güncelleme', color: 'text-yellow-400' },
    roster_update: { icon: CalendarDays, label: 'Roster Güncelleme', color: 'text-teal-400' },
    compliance_check: { icon: ShieldCheck, label: 'Uyumluluk', color: 'text-green-400' },
    sale_create: { icon: CreditCard, label: 'Satış Oluşturma', color: 'text-indigo-400' },
    sale_update: { icon: CreditCard, label: 'Satış Güncelleme', color: 'text-indigo-300' },
    feedback_create: { icon: Send, label: 'Geri Bildirim', color: 'text-purple-400' },
}

function formatTimestamp(ts: any): string {
    if (!ts) return ''
    const date = ts.toDate ? ts.toDate() : new Date(ts)
    return format(date, 'dd.MM HH:mm:ss')
}

export function ActivityLogPanel() {
    const { hotel } = useHotelStore()
    const { logs, loading, subscribeToActivityLogs } = useActivityStore()
    const [filterUser, setFilterUser] = useState('')
    const [filterAction, setFilterAction] = useState<string>('all')

    useEffect(() => {
        if (!hotel?.id) return
        const unsub = subscribeToActivityLogs(hotel.id)
        return () => unsub()
    }, [hotel?.id, subscribeToActivityLogs])

    // Extract unique users from logs
    const uniqueUsers = Array.from(new Set(logs.map(l => l.user_name))).sort()

    // Filtered logs
    const filtered = logs.filter(log => {
        if (filterUser && log.user_name !== filterUser) return false
        if (filterAction !== 'all' && log.action !== filterAction) return false
        return true
    })

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-border/50 bg-background/50 backdrop-blur-xl overflow-hidden relative shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent pointer-events-none" />

                <CardHeader className="relative z-10 border-b border-border/30 bg-muted/20 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ScrollText className="w-5 h-5 text-orange-400" />
                            Personel Aktivite Kayıtları
                        </CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* User filter */}
                            <Select value={filterUser || '__all__'} onValueChange={(v) => setFilterUser(v === '__all__' ? '' : v)}>
                                <SelectTrigger className="w-40 h-9 bg-background/80 border-border/50 text-xs">
                                    <UserIcon className="w-3 h-3 mr-1 text-muted-foreground" />
                                    <SelectValue placeholder="Tüm Kullanıcılar" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">Tüm Kullanıcılar</SelectItem>
                                    {uniqueUsers.map(u => (
                                        <SelectItem key={u} value={u}>{u}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Action filter */}
                            <Select value={filterAction} onValueChange={setFilterAction}>
                                <SelectTrigger className="w-44 h-9 bg-background/80 border-border/50 text-xs">
                                    <Filter className="w-3 h-3 mr-1 text-muted-foreground" />
                                    <SelectValue placeholder="Tüm Aksiyonlar" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tüm Aksiyonlar</SelectItem>
                                    {Object.entries(ACTION_META).map(([key, meta]) => (
                                        <SelectItem key={key} value={key}>
                                            {meta.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0 relative z-10">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <ScrollText className="w-10 h-10 mb-3 opacity-30" />
                            <p className="text-sm">Henüz aktivite kaydı yok</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/20 max-h-[calc(100vh-20rem)] overflow-y-auto scrollbar-thin">
                            <AnimatePresence initial={false}>
                                {filtered.map((log, idx) => {
                                    const meta = ACTION_META[log.action] || ACTION_META.login
                                    const Icon = meta.icon

                                    return (
                                        <motion.div
                                            key={log.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                                            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
                                        >
                                            {/* Action Icon */}
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                                "bg-muted/50 border border-border/30 group-hover:border-border/60 transition-colors"
                                            )}>
                                                <Icon className={cn("w-4 h-4", meta.color)} />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-foreground truncate">
                                                        {log.user_name}
                                                    </span>
                                                    <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded", meta.color, "bg-current/10")}>
                                                        {meta.label}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground uppercase px-1.5 py-0.5 rounded bg-muted/50">
                                                        {log.user_role}
                                                    </span>
                                                </div>
                                                {log.details && (
                                                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                                        {log.details}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Timestamp */}
                                            <span className="text-[11px] text-muted-foreground font-mono shrink-0">
                                                {formatTimestamp(log.timestamp)}
                                            </span>
                                        </motion.div>
                                    )
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
