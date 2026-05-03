import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import {
    Bot,
    X,
    Send,
    Loader2,
    Trash2,
    Sparkles,
    MessageCircle,
    Zap,
    Plus,
    PanelLeftOpen,
    PanelLeftClose,
    Home,
    Settings2,
    ChevronDown,
    Check,
    Mail,
    FileText,
    Brain as BrainIcon,
    Copy,
    CheckCircle2,
} from 'lucide-react'
import { useChatStore, type ChatMessage } from '@/stores/chatStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import type { AIModelType, AITaskType } from '@/stores/aiStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function getQuickSuggestions(t: (k: any) => string) {
    return [
        { label: t('ai.suggest.activeNotes'), text: t('ai.suggest.activeNotes.text') },
        { label: t('ai.suggest.todaySales'), text: t('ai.suggest.todaySales.text') },
        { label: t('ai.suggest.roomPrices'), text: t('ai.suggest.roomPrices.text') },
        { label: t('ai.suggest.shiftStatus'), text: t('ai.suggest.shiftStatus.text') },
        { label: t('ai.suggest.roomStatus'), text: t('ai.suggest.roomStatus.text') },
        { label: t('ai.suggest.exchangeRates'), text: t('ai.suggest.exchangeRates.text') },
        { label: t('ai.suggest.draftReport'), text: t('ai.suggest.draftReport.text') },
        { label: t('ai.suggest.writeEmail'), text: t('ai.suggest.writeEmail.text') },
    ]
}

function getSupportSuggestions(t: (k: any) => string) {
    return [
        { label: t('ai.suggest.whatIsRelay'), text: t('ai.suggest.whatIsRelay.text') },
        { label: t('ai.suggest.pricing'), text: t('ai.suggest.pricing.text') },
        { label: t('ai.suggest.security'), text: t('ai.suggest.security.text') },
        { label: t('ai.suggest.mobileApp'), text: t('ai.suggest.mobileApp.text') },
        { label: t('ai.suggest.handover'), text: t('ai.suggest.handover.text') },
    ]
}

const MODELS: { id: AIModelType; name: string; desc: string }[] = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Balanced (Google)' },
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', desc: 'Frontier (Google)' },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', desc: 'Pro (Google)' },
    { id: 'gpt-5', name: 'GPT-5', desc: 'Next Frontier (OpenAI)' },
    { id: 'gpt-5-mini', name: 'GPT-5 Mini', desc: 'Fast (OpenAI)' },
    { id: 'o3', name: 'o3', desc: 'Reasoning (OpenAI)' },
    { id: 'o3-mini', name: 'o3-mini', desc: 'Fast Reasoning' },
    { id: 'claude-4.5-sonnet', name: 'Claude 4.5 Sonnet', desc: 'Intelligent (Anthropic)' },
    { id: 'claude-4.5-haiku', name: 'Claude 4.5 Haiku', desc: 'Balanced (Anthropic)' },
]

function getTaskModes(t: (k: any) => string): { id: AITaskType; label: string; icon: typeof Sparkles }[] {
    return [
        { id: 'general', label: t('ai.chat.task.general'), icon: Sparkles },
        { id: 'email', label: t('ai.chat.task.email'), icon: Mail },
        { id: 'report', label: t('ai.chat.task.report'), icon: FileText },
        { id: 'review', label: t('ai.chat.task.review'), icon: MessageCircle },
    ]
}

function MessageBubble({ message }: { message: ChatMessage }) {
    const isUser = message.role === 'user'

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2 }}
            className={cn(
                "flex gap-2 max-w-[90%] group relative", // Added group for hover effects
                isUser ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
        >
            {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-violet-500/20">
                    <Bot className="w-4 h-4 text-white" />
                </div>
            )}
            <div className={cn(
                "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm relative select-text", // Added select-text
                isUser
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted/80 text-foreground border border-border/30 rounded-bl-md"
            )}>
                <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                            li: ({ children }) => <li className="mb-0.5">{children}</li>,
                            h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-3 text-white">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-base font-bold mb-1.5 mt-2.5 text-white">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-sm font-bold mb-1 mt-2 text-white">{children}</h3>,
                            strong: ({ children }) => <strong className="font-bold text-violet-400">{children}</strong>,
                            code: ({ children }) => <code className="bg-black/30 px-1 rounded text-violet-300 font-mono text-[12px]">{children}</code>,
                            blockquote: ({ children }) => <blockquote className="border-l-2 border-violet-500/50 pl-3 italic my-2 text-muted-foreground">{children}</blockquote>,
                            a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">{children}</a>
                        }}
                    >
                        {message.content}
                    </ReactMarkdown>
                </div>

                {/* Footer / Meta */}
                <div className="flex items-center justify-end gap-2 mt-1.5 opacity-50">
                    <span className={cn("text-[10px]", isUser ? "text-primary-foreground" : "text-muted-foreground")}>
                        {format(message.timestamp, 'HH:mm')}
                    </span>
                    {!isUser && (
                        <CopyButton text={message.content} />
                    )}
                </div>
            </div>
        </motion.div>
    )
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <button
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/5 p-1 rounded-md"
            title="Kopyala"
        >
            {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
        </button>
    )
}

function TypingIndicator() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mr-auto relative"
        >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20">
                <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-muted/80 border border-border/30 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                        <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full bg-muted-foreground/40"
                            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    )
}

function ChatSidebar() {
    const { threads, activeThreadId, switchThread, deleteThread, createThread, toggleOpen, toggleSidebar } = useChatStore()
    const { t } = useLanguageStore()

    return (
        <motion.div
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute inset-y-0 left-0 w-[260px] bg-background/98 backdrop-blur-xl border-r border-border/30 z-20 flex flex-col"
        >
            {/* Sidebar Header */}
            <div className="p-3 border-b border-border/30 flex items-center justify-between">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('ai.sidebar.chats')}</h4>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                        onClick={() => toggleOpen()}
                        title={t('ai.chat.backToDashboard')}
                    >
                        <Home className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                        onClick={toggleSidebar}
                    >
                        <PanelLeftClose className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            {/* New Chat Button */}
            <div className="p-2">
                <button
                    onClick={createThread}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 hover:border-violet-500/50 transition-all text-xs text-violet-400 font-medium cursor-pointer"
                >
                    <Plus className="w-3.5 h-3.5" />
                    {t('ai.sidebar.newChat')}
                </button>
            </div>

            {/* Thread List */}
            <div className="flex-1 overflow-y-auto px-2 space-y-0.5 scrollbar-thin relative">
                {threads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                        <MessageCircle className="w-6 h-6 text-muted-foreground/30 mb-2" />
                        <p className="text-[11px] text-muted-foreground/50">{t('ai.sidebar.noChats')}</p>
                    </div>
                ) : (
                    threads.map(thread => (
                        <div
                            key={thread.id}
                            className={cn(
                                "group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all",
                                thread.id === activeThreadId
                                    ? "bg-violet-500/10 border border-violet-500/20 text-foreground"
                                    : "hover:bg-muted/50 text-muted-foreground hover:text-foreground border border-transparent"
                            )}
                            onClick={() => switchThread(thread.id)}
                        >
                            <MessageCircle className="w-3.5 h-3.5 shrink-0 opacity-50" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{thread.title}</p>
                                <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                                    {thread.messages.length} {thread.messages.length === 1 ? t('ai.sidebar.message') : t('ai.sidebar.messages')} · {format(thread.updatedAt, 'HH:mm')}
                                </p>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); deleteThread(thread.id) }}
                                className="opacity-0 group-hover:opacity-100 h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer shrink-0"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </motion.div>
    )
}

// ── Model Selector Dropdown ──────────────────────
function ModelSelector() {
    const { selectedModel, setModel } = useChatStore()
    const [open, setOpen] = useState(false)
    const current = MODELS.find(m => m.id === selectedModel)

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/50 border border-border/30 hover:bg-muted/80 transition-all text-[11px] font-medium text-muted-foreground hover:text-foreground cursor-pointer"
            >
                <Settings2 className="w-3 h-3" />
                <span className="max-w-[100px] truncate">{current?.name || 'Model'}</span>
                <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute top-full left-0 mt-1 w-56 bg-popover border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                        <div className="max-h-52 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin relative">
                            {MODELS.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => { setModel(m.id); setOpen(false) }}
                                    className={cn(
                                        "w-full px-3 py-2 rounded-lg text-left text-xs transition-colors flex items-center justify-between cursor-pointer",
                                        selectedModel === m.id
                                            ? "bg-violet-500/10 text-violet-400"
                                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                    )}
                                >
                                    <div>
                                        <p className="font-semibold">{m.name}</p>
                                        <p className="text-[10px] opacity-60">{m.desc}</p>
                                    </div>
                                    {selectedModel === m.id && <Check className="w-3 h-3 text-violet-400" />}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// ── Task Mode Selector ───────────────────────────
function TaskSelector() {
    const { selectedTask, setTask } = useChatStore()

    const { t } = useLanguageStore()

    return (
        <div className="flex gap-0.5 bg-muted/30 rounded-lg p-0.5 border border-border/20">
            {getTaskModes(t).map(tm => {
                const Icon = tm.icon
                return (
                    <button
                        key={tm.id}
                        onClick={() => setTask(tm.id)}
                        title={tm.label}
                        className={cn(
                            "px-2 py-1 rounded-md text-[10px] font-medium transition-all cursor-pointer flex items-center gap-1",
                            selectedTask === tm.id
                                ? "bg-violet-500/15 text-violet-400 border border-violet-500/20"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                        )}
                    >
                        <Icon className="w-3 h-3" />
                        <span className="hidden sm:inline">{tm.label}</span>
                    </button>
                )
            })}
        </div>
    )
}

// ── Knowledge Base Editor ────────────────────────
function KBEditor() {
    const { hotel, updateHotelSettings } = useHotelStore()
    const { t } = useLanguageStore()
    const [kbContent, setKbContent] = useState(hotel?.settings?.knowledge_base || '')
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        if (!hotel?.id) return
        setSaving(true)
        try {
            await updateHotelSettings(hotel.id, { knowledge_base: kbContent })
        } catch (error) {
            console.error("Failed to save knowledge base:", error)
        }
        setSaving(false)
    }

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
        >
            <div className="mx-3 mt-2 bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                        <BrainIcon className="w-3.5 h-3.5" /> Knowledge Base
                    </h3>
                    <Button
                        size="sm"
                        className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-500 px-2"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : t('ai.context.save')}
                    </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mb-2">
                    {t('ai.chat.kbDesc')}
                </p>
                <textarea
                    value={kbContent}
                    onChange={e => setKbContent(e.target.value)}
                    className="w-full h-24 bg-background/50 border border-emerald-500/20 rounded-lg p-2.5 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-none"
                    placeholder="Örn: Kahvaltı 07:00-10:00. Havuz 20:00'a kadar. Checkout 12:00..."
                />
            </div>
        </motion.div>
    )
}

export function AIChatBot() {
    const {
        threads, activeThreadId, isOpen, showSidebar, loading, isPublic,
        toggleOpen, setOpen, sendMessage, createThread, toggleSidebar, setIsPublic
    } = useChatStore()
    const { user } = useAuthStore()
    const { t } = useLanguageStore()
    const location = useLocation()
    const [input, setInput] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const [showKB, setShowKB] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [showQuickSuggestions, setShowQuickSuggestions] = useState(false)

    // Location detection
    useEffect(() => {
        const publicPaths = ['/', '/pricing', '/legal/privacy', '/legal/terms', '/legal/status']
        setIsPublic(publicPaths.includes(location.pathname))
    }, [location.pathname, setIsPublic])

    const isGM = user?.role === 'gm'
    const activeThread = threads.find(t => t.id === activeThreadId)
    const messages = activeThread?.messages || []

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading])

    // Click outside listener
    useEffect(() => {
        if (!isOpen) return

        const handleClickOutside = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                // Using setOpen(false) is safer than toggleOpen()
                setOpen(false)
            }
        }

        // Delay attaching the listener to avoid capturing the same click that opened it
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside)
        }, 100)

        return () => {
            clearTimeout(timer)
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen, setOpen])

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                const active = document.activeElement
                const isInput = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement
                if (!isInput) {
                    inputRef.current?.focus()
                }
            }, 300)
        }
    }, [isOpen])

    const handleSend = () => {
        const text = input.trim()
        if (!text || loading) return
        setInput('')
        sendMessage(text)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleSuggestion = (text: string) => {
        if (loading) return
        sendMessage(text)
    }

    const portalRoot = document.getElementById('ai-chatbot-root') || document.body

    return createPortal(
        <div className="fixed inset-0 z-[99999] pointer-events-none font-sans" style={{ direction: 'ltr' }}>
            {/* Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop (mobile) */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm lg:hidden pointer-events-auto"
                        />

                        {/* Panel */}
                        <motion.div
                            ref={panelRef}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className={cn(
                                "fixed pointer-events-auto flex flex-col overflow-hidden bg-background/95 backdrop-blur-2xl shadow-2xl shadow-black/20",
                                // Mobile: Bottom Sheet
                                "bottom-0 left-0 right-0 h-[85vh] rounded-t-2xl border-t border-border/50",
                                // Desktop: Floating Window
                                "md:w-[450px] md:h-[650px] md:rounded-2xl md:border md:border-border/50 md:bottom-6 md:right-6 md:left-auto"
                            )}
                        >
                            {/* Sidebar Overlay */}
                            <AnimatePresence>
                                {showSidebar && <ChatSidebar />}
                            </AnimatePresence>

                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-muted/20 shrink-0 relative z-10">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                                        onClick={toggleSidebar}
                                    >
                                        {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
                                    </Button>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                                            <Bot className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-foreground leading-tight">
                                                {activeThread ? activeThread.title : 'Aetherius Relay AI'}
                                            </h3>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                <span className="text-[10px] text-muted-foreground">Çevrimiçi</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {!isPublic && isGM && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn("h-8 w-8 rounded-lg", showKB ? "text-emerald-400" : "text-muted-foreground hover:text-emerald-400")}
                                            onClick={() => setShowKB(!showKB)}
                                            title="Knowledge Base"
                                        >
                                            <BrainIcon className="w-4 h-4" />
                                        </Button>
                                    )}
                                    {!isPublic && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn("h-8 w-8 rounded-lg", showSettings ? "text-violet-400" : "text-muted-foreground hover:text-violet-400")}
                                            onClick={() => setShowSettings(!showSettings)}
                                            title="Model & Mod"
                                        >
                                            <Settings2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-violet-400"
                                        onClick={createThread}
                                        title="Yeni sohbet"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg text-muted-foreground"
                                        onClick={toggleOpen}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Settings Bar (Model + Task) */}
                            <AnimatePresence>
                                {showSettings && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden border-b border-border/20"
                                    >
                                        <div className="px-3 py-2.5 flex flex-col gap-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <ModelSelector />
                                                <TaskSelector />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* KB Editor */}
                            <AnimatePresence>
                                {showKB && <KBEditor />}
                            </AnimatePresence>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin relative">
                                {messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center px-6">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 flex items-center justify-center mb-4 border border-violet-500/20">
                                            <MessageCircle className="w-8 h-8 text-violet-400" />
                                        </div>
                                        <h4 className="text-base font-bold text-foreground mb-1">
                                            {isPublic ? t('ai.chat.publicTitle') : t('ai.chat.internalTitle')}
                                        </h4>
                                        <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                                            {isPublic
                                                ? t('ai.chat.publicWelcome')
                                                : t('ai.chat.internalWelcome')
                                            }
                                        </p>

                                        <div className="grid grid-cols-2 gap-2 w-full mb-6">
                                            {(isPublic ? getSupportSuggestions(t) : getQuickSuggestions(t)).map((s, i) => (
                                                <motion.button
                                                    key={i}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    onClick={() => handleSuggestion(s.text)}
                                                    className="text-left px-3 py-2.5 rounded-xl bg-muted/50 border border-border/30 hover:bg-muted/80 hover:border-violet-500/30 transition-all text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                                                >
                                                    {s.label}
                                                </motion.button>
                                            ))}
                                        </div>

                                        {!isPublic && (
                                            <div className="w-full text-left space-y-2 pt-2 border-t border-border/10">
                                                <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider mb-2">{t('ai.chat.expertiseTitle')}</p>
                                                <div className="grid grid-cols-3 gap-1.5">
                                                    {[
                                                        { icon: BrainIcon, label: t('ai.chat.expertise.shift') },
                                                        { icon: Zap, label: t('ai.chat.expertise.compliance') },
                                                        { icon: FileText, label: t('ai.chat.expertise.report') },
                                                        { icon: Settings2, label: t('ai.chat.expertise.pricing') },
                                                        { icon: Home, label: t('ai.chat.expertise.rooms') },
                                                        { icon: Sparkles, label: t('ai.chat.expertise.sales') }
                                                    ].map((cap, idx) => (
                                                        <div key={idx} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background/40 border border-border/10">
                                                            <cap.icon className="w-3.5 h-3.5 text-muted-foreground/60" />
                                                            <span className="text-[9px] text-muted-foreground">{cap.label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        {messages.map(msg => (
                                            <MessageBubble key={msg.id} message={msg} />
                                        ))}
                                        {loading && <TypingIndicator />}
                                    </>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="shrink-0 p-3 border-t border-border/30 bg-muted/10">
                                {/* Quick Suggestions Popup */}
                                <AnimatePresence>
                                    {showQuickSuggestions && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8, height: 0 }}
                                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                                            exit={{ opacity: 0, y: 8, height: 0 }}
                                            className="overflow-hidden mb-2"
                                        >
                                            <div className="grid grid-cols-2 gap-1.5 p-2 rounded-xl bg-muted/30 border border-border/20">
                                                {(isPublic ? getSupportSuggestions(t) : getQuickSuggestions(t)).map((s, i) => (
                                                    <motion.button
                                                        key={i}
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: i * 0.03 }}
                                                        onClick={() => {
                                                            handleSuggestion(s.text)
                                                            setShowQuickSuggestions(false)
                                                        }}
                                                        className="text-left px-2.5 py-2 rounded-lg bg-background/60 border border-border/20 hover:bg-violet-500/10 hover:border-violet-500/30 transition-all text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                                                    >
                                                        {s.label}
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="flex items-center gap-2 bg-background/80 border border-border/50 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-violet-500/30 focus-within:border-violet-500/50 transition-all">
                                    <button
                                        onClick={() => setShowQuickSuggestions(prev => !prev)}
                                        className={cn(
                                            "shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-all cursor-pointer",
                                            showQuickSuggestions
                                                ? "bg-violet-500/20 text-violet-400"
                                                : "text-muted-foreground/40 hover:text-violet-400 hover:bg-violet-500/10"
                                        )}
                                        title={t('ai.chat.quickTitle')}
                                    >
                                        <Zap className="w-4 h-4" />
                                    </button>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={t('ai.chat.placeholder')}
                                        disabled={loading}
                                        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none py-1.5 disabled:opacity-50"
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!input.trim() || loading}
                                        className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer",
                                            input.trim() && !loading
                                                ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40"
                                                : "bg-muted/50 text-muted-foreground/30"
                                        )}
                                    >
                                        {loading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>,
        portalRoot
    )
}
