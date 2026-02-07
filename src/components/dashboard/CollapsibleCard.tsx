import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
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
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

    // Load state from localStorage on mount
    useEffect(() => {
        const savedState = localStorage.getItem(`relay_card_collapsed_${id}`)
        if (savedState !== null) {
            setIsCollapsed(savedState === 'true')
        }
    }, [id])

    const handleToggle = () => {
        const newState = !isCollapsed
        setIsCollapsed(newState)
        localStorage.setItem(`relay_card_collapsed_${id}`, String(newState))
        if (onToggle) onToggle(newState)
    }

    return (
        <Card className={cn("overflow-hidden flex flex-col", className)}>
            <CardHeader className="pb-3 select-none">
                <div className="flex items-center justify-between">
                    <div
                        className="flex-1 cursor-pointer flex items-center gap-2 group"
                        onClick={handleToggle}
                    >
                        {title}
                        <div className="p-1 rounded-md hover:bg-muted transition-colors">
                            {isCollapsed ? (
                                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
                            ) : (
                                <ChevronUp className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
                            )}
                        </div>
                    </div>
                    {headerActions && (
                        <div className="flex items-center gap-2">
                            {headerActions}
                        </div>
                    )}
                </div>
            </CardHeader>

            <AnimatePresence initial={false}>
                {!isCollapsed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                        <CardContent className="pt-0">
                            {children}
                        </CardContent>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    )
}
