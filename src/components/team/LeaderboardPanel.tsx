import { useEffect, useState } from 'react'
import { useLeaderboardStore } from '@/stores/leaderboardStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Trophy, Medal, Clock, Crown, TrendingUp, Users, CalendarDays } from 'lucide-react'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton'
import { OffDayScheduler } from '@/components/staff/OffDayScheduler'

export function LeaderboardPanel({ initialTab = 'leaderboard' }: { initialTab?: 'leaderboard' | 'off-days' }) {
    const [activeTab, setActiveTab] = useState<'leaderboard' | 'off-days'>(initialTab)
    const { hotel } = useHotelStore()
    const { entries, loadLeaderboard, loading, timeRange, setTimeRange } = useLeaderboardStore()
    const { language, t } = useLanguageStore()

    useEffect(() => {
        if (hotel?.id) {
            loadLeaderboard(hotel.id)
        }
    }, [hotel?.id, timeRange, loadLeaderboard])

    if (activeTab === 'off-days') {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                    <button
                        onClick={() => setActiveTab('leaderboard')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-muted/40 text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
                    >
                        <Users className="w-4 h-4" />
                        <span>{language === 'tr' ? 'Ekip & Performans' : 'Team & Performance'}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('off-days')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground shadow-md transition-colors"
                    >
                        <CalendarDays className="w-4 h-4" />
                        <span>{language === 'tr' ? 'İzin Günleri Planlayıcı' : 'Off-Days Planner'}</span>
                    </button>
                </div>
                <OffDayScheduler />
            </div>
        )
    }

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500/20" />
            case 2: return <Medal className="w-6 h-6 text-muted-foreground fill-muted-foreground/20" />
            case 3: return <Medal className="w-6 h-6 text-amber-600 fill-amber-600/20" />
            default: return <span className="text-muted-foreground font-bold w-6 text-center tabular-nums">#{rank}</span>
        }
    }

    const getRowStyle = (rank: number) => {
        if (rank === 1) return "bg-gradient-to-r from-yellow-500/10 to-transparent border-l-4 border-l-yellow-500"
        if (rank === 2) return "bg-gradient-to-r from-muted-foreground/10 to-transparent border-l-4 border-l-muted-foreground"
        if (rank === 3) return "bg-gradient-to-r from-amber-600/10 to-transparent border-l-4 border-l-amber-600"
        return "bg-muted/40 border border-border/50 hover:bg-muted/60"
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/40 w-fit">
                <button
                    onClick={() => setActiveTab('leaderboard')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground shadow-xs transition-all"
                >
                    <Users className="size-3.5" />
                    <span>{language === 'tr' ? 'Ekip & Performans' : 'Team & Performance'}</span>
                </button>
                <button
                    onClick={() => setActiveTab('off-days')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all"
                >
                    <CalendarDays className="size-3.5" />
                    <span>{language === 'tr' ? 'İzin Günleri Planlayıcı' : 'Off-Days Planner'}</span>
                </button>
            </div>

            <Card className="border-border/50 bg-background/50 backdrop-blur-xl">
                <CardHeader className="pb-4 border-b border-border/30">
                    <div className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold flex items-center gap-3 text-foreground">
                                <Trophy className="w-6 h-6 text-primary" />
                                {t('leaderboard.title')}
                            </CardTitle>
                            <CardDescription className="text-muted-foreground mt-1">
                                {t('leaderboard.desc')}
                            </CardDescription>
                        </div>
                    <div className="flex bg-muted p-1 rounded-lg border border-border">
                        <button
                            onClick={() => setTimeRange('day')}
                            className={cn(
                                "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                                timeRange === 'day' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {t('leaderboard.today')}
                        </button>
                        <button
                            onClick={() => setTimeRange('week')}
                            className={cn(
                                "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                                timeRange === 'week' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {t('leaderboard.thisWeek')}
                        </button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 animate-pulse">
                                <div className="w-8 h-8 rounded-full bg-muted" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-32 bg-muted rounded" />
                                    <div className="h-3 w-20 bg-muted/50 rounded" />
                                </div>
                                <div className="w-16 h-8 bg-muted rounded" />
                            </div>
                        ))}
                    </div>
                ) : entries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
                        <div className="p-4 rounded-full bg-muted/50">
                            <TrendingUp className="w-8 h-8 opacity-50" />
                        </div>
                        <p>{t('leaderboard.noActivity')}</p>
                    </div>
                ) : (
                    entries.map((entry, index) => (
                        <motion.div
                            key={entry.userId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={cn(
                                "group relative flex items-center justify-between p-4 rounded-xl transition-all duration-300",
                                getRowStyle(entry.rank)
                            )}
                        >
                            <div className="flex items-center gap-5">
                                <div className="flex items-center justify-center w-8 shrink-0">
                                    {getRankIcon(entry.rank)}
                                </div>

                                <div className="flex items-center gap-4">
                                    <UserAvatar
                                        user={{ id: entry.userId, name: entry.userName, settings: entry.settings } as any}
                                        size="lg"
                                        className="h-12 w-12 border-2 border-foreground/5 ring-2 ring-transparent group-hover:ring-indigo-500/30 transition-all shadow-none"
                                    />

                                    <div>
                                        <p className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">
                                            {entry.userName}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span className="bg-muted/50 px-2 py-0.5 rounded">
                                                {hotel?.info.name} {t('common.staff')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold font-mono text-foreground tabular-nums">
                                        {Math.floor(entry.totalMinutes / 60)}
                                    </span>
                                    <span className="text-sm font-medium text-muted-foreground">h</span>
                                    <span className="text-2xl font-bold font-mono text-foreground tabular-nums ml-2">
                                        {entry.totalMinutes % 60}
                                    </span>
                                    <span className="text-sm font-medium text-muted-foreground">m</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">
                                    <Clock className="w-3 h-3" />
                                    {t('leaderboard.activeDuration')}
                                </div>
                            </div>

                            {/* Shine effect for top 3 */}
                            {entry.rank <= 3 && (
                                <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-200%] " />
                                </div>
                            )}
                        </motion.div>
                    ))
                )}
                <ScrollToTopButton />
            </CardContent>
        </Card>
        </div>
    )
}
