import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CollapsibleCardProps {
    id: string
    title: React.ReactNode
    children: React.ReactNode
    className?: string
    headerActions?: React.ReactNode
    defaultCollapsed?: boolean
    onToggle?: (isCollapsed: boolean) => void
}

export function CollapsibleCard({
    id,
    title,
    children,
    className,
    headerActions,
    defaultCollapsed = false,
    onToggle
}: CollapsibleCardProps) {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        // Read initial state from localStorage
        const saved = localStorage.getItem(`relay_card_collapsed_${id}`)
        if (saved !== null) {
            return saved === 'true'
        }
        return defaultCollapsed
    })
    const [isFocused, setIsFocused] = useState(false)
    const cardRef = useRef<HTMLDivElement>(null)
    const [placeholderHeight, setPlaceholderHeight] = useState(0)

    // Handle Esc key to exit focus mode
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFocused) {
                setIsFocused(false)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isFocused])

    const handleToggle = () => {
        if (isFocused) return // Disable collapsing when focused
        const newState = !isCollapsed
        setIsCollapsed(newState)
        // Persist to localStorage
        localStorage.setItem(`relay_card_collapsed_${id}`, String(newState))
        if (onToggle) onToggle(newState)
    }

    const toggleFocus = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!isFocused && cardRef.current) {
            setPlaceholderHeight(cardRef.current.offsetHeight)
        }
        setIsFocused(!isFocused)
        // Ensure card is expanded when focusing
        if (!isFocused && isCollapsed) {
            setIsCollapsed(false)
        }
    }

    return (
        <>
            {/* Backdrop */}
            <AnimatePresence>
                {isFocused && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
                        onClick={() => setIsFocused(false)}
                    />
                )}
            </AnimatePresence>

            {/* Placeholder to prevent layout shift */}
            {isFocused && <div style={{ height: placeholderHeight }} className="w-full" />}

            <div
                ref={cardRef}
                className={cn(
                    "transition-all duration-300 ease-in-out",
                    isFocused ? "fixed inset-4 z-50 m-auto max-w-5xl h-fit max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" : "relative"
                )}
            >
                <Card className={cn(
                    "overflow-hidden flex flex-col h-full",
                    className,
                    isFocused && "border-primary/50 shadow-[0_0_50px_-12px_hsl(var(--primary)/0.5)]"
                )}>
                    <CardHeader className="pb-3 select-none flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div
                                className={cn("flex-1 flex items-center gap-2 group", !isFocused && "cursor-pointer")}
                                onClick={handleToggle}
                            >
                                {title}
                                {!isFocused && (
                                    <div className="p-1 rounded-md hover:bg-muted transition-colors">
                                        {isCollapsed ? (
                                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
                                        ) : (
                                            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {headerActions}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleFocus}
                                    className="h-6 w-6 text-muted-foreground hover:text-foreground ml-1"
                                    title={isFocused ? "Minimize" : "Focus Mode"}
                                >
                                    {isFocused ? (
                                        <Minimize2 className="w-3.5 h-3.5" />
                                    ) : (
                                        <Maximize2 className="w-3.5 h-3.5" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <AnimatePresence initial={false}>
                        {(!isCollapsed || isFocused) && (
                            <motion.div
                                initial={isFocused ? { opacity: 1, height: 'auto' } : { height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className={cn(isFocused && "flex-1 overflow-y-auto custom-scrollbar")}
                            >
                                <CardContent className="pt-0 h-full">
                                    {children}
                                </CardContent>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>
            </div>
        </>
    )
}
