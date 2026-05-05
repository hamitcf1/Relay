import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Play, RefreshCw, Zap, Target, Medal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useGameStore } from '@/stores/gameStore'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { cn } from '@/lib/utils'

interface OfficeGamesProps {
    hotelId: string
}

export function OfficeGames({ hotelId }: OfficeGamesProps) {
    const { user } = useAuthStore()
    const { t } = useLanguageStore()
    const { scores, submitScore, subscribeToScores } = useGameStore()
    
    const [activeGame, setActiveGame] = useState<'reaction' | 'memory'>('reaction')

    // REACTION GAME STATE
    const [gameState, setGameState] = useState<'idle' | 'waiting' | 'active' | 'finished' | 'too-early'>('idle')
    const [startTime, setStartTime] = useState<number>(0)
    const [reactionTime, setReactionTime] = useState<number | null>(null)
    const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null)

    // MEMORY GAME STATE
    const [cards, setCards] = useState<Array<{ id: number, emoji: string, flipped: boolean, matched: boolean }>>([])
    const [flippedIndices, setFlippedIndices] = useState<number[]>([])
    const [moves, setMoves] = useState(0)
    const [memoryFinished, setMemoryFinished] = useState(false)

    useEffect(() => {
        const unsub = subscribeToScores(hotelId, activeGame === 'reaction' ? 'reaction-time' : 'memory-match')
        return () => {
            unsub()
            if (timerId) clearTimeout(timerId)
        }
    }, [hotelId, subscribeToScores, activeGame])

    // --- REACTION GAME LOGIC ---
    const startReaction = () => {
        setGameState('waiting')
        setReactionTime(null)
        const delay = Math.floor(Math.random() * 3000) + 2000
        const timeout = setTimeout(() => {
            setGameState('active')
            setStartTime(Date.now())
        }, delay)
        setTimerId(timeout)
    }

    const handleReactionClick = () => {
        if (gameState === 'waiting') {
            if (timerId) clearTimeout(timerId)
            setGameState('too-early')
        } else if (gameState === 'active') {
            const time = Date.now() - startTime
            setReactionTime(time)
            setGameState('finished')
            if (user) submitScore(hotelId, user.uid, user.name, time, 'reaction-time')
        }
    }

    // --- MEMORY GAME LOGIC ---
    const EMOJIS = ['🏨', '🔑', '🤵', '🛎️', '🛌', '🥐', '🥂', '🏊']
    
    const startMemory = () => {
        const deck = [...EMOJIS, ...EMOJIS]
            .sort(() => Math.random() - 0.5)
            .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }))
        setCards(deck)
        setFlippedIndices([])
        setMoves(0)
        setMemoryFinished(false)
    }

    const handleCardClick = (index: number) => {
        if (cards[index].flipped || cards[index].matched || flippedIndices.length === 2) return

        const newCards = [...cards]
        newCards[index].flipped = true
        setCards(newCards)

        const newFlipped = [...flippedIndices, index]
        setFlippedIndices(newFlipped)

        if (newFlipped.length === 2) {
            setMoves(m => m + 1)
            const [first, second] = newFlipped
            if (cards[first].emoji === cards[second].emoji) {
                newCards[first].matched = true
                newCards[second].matched = true
                setCards(newCards)
                setFlippedIndices([])
                if (newCards.every(c => c.matched)) {
                    setMemoryFinished(true)
                    if (user) submitScore(hotelId, user.uid, user.name, moves + 1, 'memory-match')
                }
            } else {
                setTimeout(() => {
                    newCards[first].flipped = false
                    newCards[second].flipped = false
                    setCards(newCards)
                    setFlippedIndices([])
                }, 800)
            }
        }
    }

    return (
        <div className="space-y-6 pb-20 lg:pb-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-amber-500" />
                        Office Games
                    </h2>
                    <p className="text-sm text-muted-foreground">Compete with your colleagues during quiet shifts.</p>
                </div>

                <div className="flex bg-muted p-1 rounded-2xl border border-border/50 self-start">
                    <button 
                        onClick={() => setActiveGame('reaction')}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                            activeGame === 'reaction' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Reaction Timer
                    </button>
                    <button 
                        onClick={() => setActiveGame('memory')}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                            activeGame === 'memory' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Grid Match
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Game Area */}
                <Card className="lg:col-span-2 glass border-primary/20 overflow-hidden relative min-h-[450px]">
                    <CardHeader className="border-b border-border/40 bg-primary/5">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            {activeGame === 'reaction' ? (
                                <><Zap className="w-4 h-4 text-primary" /> Reaction Time Test</>
                            ) : (
                                <><Target className="w-4 h-4 text-primary" /> Memory Grid Match</>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {activeGame === 'reaction' ? (
                            <div 
                                onClick={handleReactionClick}
                                className={cn(
                                    "w-full h-[400px] flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 select-none p-6 text-center",
                                    gameState === 'idle' && "bg-background/40 hover:bg-primary/5",
                                    gameState === 'waiting' && "bg-rose-500/20",
                                    gameState === 'active' && "bg-emerald-500 animate-pulse",
                                    gameState === 'finished' && "bg-primary/10",
                                    gameState === 'too-early' && "bg-rose-500/40"
                                )}
                            >
                                <AnimatePresence mode="wait">
                                    {gameState === 'idle' && (
                                        <motion.div key="idle" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="space-y-4">
                                            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto border-2 border-primary/30">
                                                <Play className="w-8 h-8 text-primary fill-primary" />
                                            </div>
                                            <h3 className="text-xl font-bold">Ready to test your reflexes?</h3>
                                            <p className="text-sm text-muted-foreground max-w-xs mx-auto">Click the area when it turns <span className="text-emerald-500 font-bold uppercase">Green</span>.</p>
                                            <Button onClick={(e) => { e.stopPropagation(); startReaction(); }} size="lg" className="rounded-2xl font-bold">Start Game</Button>
                                        </motion.div>
                                    )}

                                    {gameState === 'waiting' && (
                                        <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                            <h3 className="text-3xl font-black text-rose-500 uppercase tracking-tighter">Wait for Green...</h3>
                                            <p className="text-sm text-rose-500/60 font-medium">Concentrate...</p>
                                        </motion.div>
                                    )}

                                    {gameState === 'active' && (
                                        <motion.div key="active" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1.2 }} className="space-y-4">
                                            <Target className="w-24 h-24 text-white mx-auto drop-shadow-lg" />
                                            <h3 className="text-5xl font-black text-white uppercase tracking-tighter">CLICK NOW!</h3>
                                        </motion.div>
                                    )}

                                    {gameState === 'finished' && (
                                        <motion.div key="finished" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Your Result</p>
                                                <h3 className="text-7xl font-black text-primary tabular-nums">{reactionTime}ms</h3>
                                            </div>
                                            <Button onClick={(e) => { e.stopPropagation(); startReaction(); }} variant="default" size="lg" className="rounded-2xl font-bold gap-2">
                                                <RefreshCw className="w-4 h-4" /> Try Again
                                            </Button>
                                        </motion.div>
                                    )}

                                    {gameState === 'too-early' && (
                                        <motion.div key="too-early" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                                            <div className="text-rose-500 text-6xl">⚠️</div>
                                            <h3 className="text-2xl font-bold text-rose-500">Too Early!</h3>
                                            <p className="text-sm text-muted-foreground">Wait for the green light before clicking.</p>
                                            <Button onClick={(e) => { e.stopPropagation(); startReaction(); }} variant="outline" className="rounded-2xl font-bold border-rose-500/50 text-rose-500 hover:bg-rose-500/10">Reset</Button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                                {cards.length === 0 ? (
                                    <div className="text-center space-y-6">
                                        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto border-2 border-primary/30">
                                            <Target className="w-8 h-8 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-bold">Memory Grid Match</h3>
                                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">Find all pairs in the fewest moves possible.</p>
                                        <Button onClick={startMemory} size="lg" className="rounded-2xl font-bold">Start Memory Game</Button>
                                    </div>
                                ) : (
                                    <div className="w-full max-w-sm space-y-6">
                                        <div className="flex justify-between items-center px-2">
                                            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Moves: <span className="text-primary">{moves}</span></span>
                                            {memoryFinished && <span className="text-xs font-bold text-emerald-500 uppercase">Game Complete!</span>}
                                        </div>
                                        <div className="grid grid-cols-4 gap-3">
                                            {cards.map((card, i) => (
                                                <motion.button
                                                    key={i}
                                                    whileHover={{ scale: card.flipped || card.matched ? 1 : 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleCardClick(i)}
                                                    className={cn(
                                                        "h-16 sm:h-20 rounded-xl text-2xl flex items-center justify-center transition-all duration-300 border shadow-inner",
                                                        card.flipped || card.matched 
                                                            ? "bg-primary/20 border-primary/40 text-primary rotate-0" 
                                                            : "bg-muted border-border hover:border-primary/30 rotate-180"
                                                    )}
                                                >
                                                    <div className={cn("transition-all duration-300", card.flipped || card.matched ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 rotate-180")}>
                                                        {card.emoji}
                                                    </div>
                                                </motion.button>
                                            ))}
                                        </div>
                                        {memoryFinished && (
                                            <Button onClick={startMemory} className="w-full rounded-2xl font-bold" variant="outline">Play Again</Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Scoreboard */}
                <Card className="glass border-amber-500/20">
                    <CardHeader className="border-b border-border/40 bg-amber-500/5">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-500 uppercase tracking-wider">
                            <Medal className="w-4 h-4" />
                            {activeGame === 'reaction' ? 'Fastest Reactions' : 'Fewest Moves'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="space-y-3">
                            {scores.length === 0 ? (
                                <div className="text-center py-8 opacity-40 italic text-sm">No scores yet. Be the first!</div>
                            ) : (
                                scores.map((score, index) => (
                                    <motion.div 
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        key={score.id}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl border backdrop-blur-sm transition-all",
                                            score.userId === user?.uid 
                                                ? "bg-primary/20 border-primary/40 shadow-lg shadow-primary/10" 
                                                : "bg-muted/30 border-border/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black",
                                                index === 0 ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" :
                                                index === 1 ? "bg-slate-300 text-slate-700" :
                                                index === 2 ? "bg-amber-700 text-white" :
                                                "bg-muted-foreground/20 text-muted-foreground"
                                            )}>
                                                {index + 1}
                                            </span>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold truncate max-w-[120px]">{score.userName}</span>
                                                {score.userId === user?.uid && <span className="text-[8px] uppercase tracking-widest text-primary font-black">Personal Best</span>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-lg font-black text-foreground tabular-nums">{score.score}</span>
                                            <span className="text-[10px] font-medium text-muted-foreground ml-1">
                                                {activeGame === 'reaction' ? 'ms' : 'moves'}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function AlertTriangle(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
        </svg>
    )
}
