import { useEffect } from 'react'
import { useLeaderboardStore } from '@/stores/leaderboardStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Trophy, Medal, Clock, Crown, TrendingUp } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export function LeaderboardPanel() {
    const { hotel } = useHotelStore()
    const { entries, loadLeaderboard, loading, timeRange, setTimeRange } = useLeaderboardStore()
    const { t } = useLanguageStore()

    useEffect(() => {
        if (hotel?.id) {
            loadLeaderboard(hotel.id)
        }
    }, [hotel?.id, timeRange, loadLeaderboard])

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500/20 animate-pulse" />
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
        <Card className="h-full border-border/50 bg-background/50 backdrop-blur-xl">
            <CardHeader className="pb-4 border-b border-border/30">
                <div className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-bold flex items-center gap-3 text-foreground">
                            <Trophy className="w-6 h-6 text-indigo-500" />
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
                                timeRange === 'day' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {t('leaderboard.today')}
                        </button>
                        <button
                            onClick={() => setTimeRange('week')}
                            className={cn(
                                "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                                timeRange === 'week' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {t('leaderboard.thisWeek')}
                        </button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4 overflow-y-auto max-h-[calc(100vh-250px)] custom-scrollbar">
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
                                    <Avatar className="h-12 w-12 border-2 border-foreground/5 ring-2 ring-transparent group-hover:ring-indigo-500/30 transition-all">
                                        <AvatarFallback className="bg-muted text-muted-foreground font-bold">
                                            {entry.userName.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div>
                                        <p className="font-bold text-foreground text-lg group-hover:text-indigo-400 transition-colors">
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
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-200%] group-hover:animate-shine" />
                                </div>
                            )}
                        </motion.div>
                    ))
                )}
            </CardContent>
        </Card>
    )
}
