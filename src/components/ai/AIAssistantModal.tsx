import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X,
    Sparkles,
    Mail,
    FileText,
    MessageCircle,
    Send,
    Copy,
    Check,
    Wand2,
    Settings2,
    ChevronDown,
    Loader2,
    Brain as BrainIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAIStore, AIModelType, AITaskType } from '@/stores/aiStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

interface AIAssistantModalProps {
    isOpen: boolean
    onClose: () => void
    initialTask?: AITaskType
    initialPrompt?: string
}

const MODELLS = [
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', desc: 'Fastest' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Balanced' },
    { id: 'gemma-3-27b', name: 'Gemma 3 27B', desc: 'Largest' },
    { id: 'gemma-3-12b', name: 'Gemma 3 12B', desc: 'Large' },
    { id: 'gemma-3-4b', name: 'Gemma 3 4B', desc: 'Medium' },
    { id: 'gemma-3-2b', name: 'Gemma 3 2B', desc: 'Small' },
    { id: 'gemma-3-1b', name: 'Gemma 3 1B', desc: 'Smallest' },
] as const

const TASKS = [
    { id: 'general', name: 'General Assistant', icon: Sparkles, prompt: 'How can I help you today?' },
    { id: 'report', name: 'Incident Report (Tutanak)', icon: FileText, prompt: 'Describe the incident (Who, What, When, Where)...' },
    { id: 'email', name: 'Professional Email', icon: Mail, prompt: 'Who is the recipient and what is the core message?' },
    { id: 'review', name: 'Review Reply', icon: MessageCircle, prompt: 'Paste the guest review here...' },
] as const

export function AIAssistantModal({ isOpen, onClose, initialTask = 'general', initialPrompt = '' }: AIAssistantModalProps) {
    const { generate, loading, result, error } = useAIStore()
    const { hotel, updateHotelSettings } = useHotelStore()
    const { user } = useAuthStore()

    const [task, setTask] = useState<AITaskType>(initialTask)
    const [prompt, setPrompt] = useState(initialPrompt)
    const [selectedModel, setSelectedModel] = useState<AIModelType>('gemini-2.5-flash')
    const [copied, setCopied] = useState(false)
    const [showModels, setShowModels] = useState(false)

    // Knowledge Base State
    const [showKbEditor, setShowKbEditor] = useState(false)
    const [kbContent, setKbContent] = useState('')

    // Initialize KB content when opening editor
    useEffect(() => {
        if (showKbEditor && hotel?.settings?.knowledge_base) {
            setKbContent(hotel.settings.knowledge_base)
        }
    }, [showKbEditor, hotel])

    const handleGenerate = async () => {
        if (!prompt.trim()) return
        // Pass hotel knowledge base context
        await generate(prompt, selectedModel, task, hotel?.settings?.knowledge_base)
    }

    const handleSaveKb = async () => {
        if (!hotel?.id) return
        try {
            await updateHotelSettings(hotel.id, { knowledge_base: kbContent })
            setShowKbEditor(false)
        } catch (error) {
            console.error("Failed to save knowledge base:", error)
        }
    }

    const handleCopy = () => {
        if (!result) return
        navigator.clipboard.writeText(result)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (!isOpen) return null
    const isGM = user?.role === 'gm'

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                            <Wand2 className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight">Relay AI Assistant</h2>
                            <p className="text-xs text-zinc-500">Powered by Gemini & Gemma</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isGM && (
                            <button
                                onClick={() => setShowKbEditor(!showKbEditor)}
                                className={cn(
                                    "p-2 rounded-full transition-colors flex items-center gap-2 px-3",
                                    showKbEditor ? "bg-emerald-500/20 text-emerald-400" : "hover:bg-white/5 text-zinc-500 hover:text-white"
                                )}
                                title="Edit Hotel Knowledge Base"
                            >
                                <BrainIcon className="w-4 h-4" />
                                {showKbEditor && <span className="text-xs font-bold">Knowledge Base</span>}
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-500 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Knowledge Base Editor Overlay or Section */}
                    <AnimatePresence>
                        {showKbEditor && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-4 mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                                            <BrainIcon className="w-4 h-4" /> Hotel Knowledge Base
                                        </h3>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowKbEditor(false)}>Cancel</Button>
                                            <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500" onClick={handleSaveKb}>Save Context</Button>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 mb-3">
                                        Enter facts about your hotel (breakfast hours, wifi password, policies).
                                        The AI will use this to generate accurate answers.
                                    </p>
                                    <textarea
                                        value={kbContent}
                                        onChange={e => setKbContent(e.target.value)}
                                        className="w-full h-32 bg-black/40 border border-emerald-500/20 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                                        placeholder="e.g. Breakfast is served 07:00-10:00. Pool closes at 20:00. Checkout is 12:00..."
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Model & Task Selector */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">AI Model</label>
                            <div className="relative">
                                <button
                                    onClick={() => setShowModels(!showModels)}
                                    className="w-full h-12 px-4 bg-zinc-800/50 border border-zinc-700/50 rounded-2xl flex items-center justify-between text-sm text-zinc-300 hover:border-indigo-500/50 transition-all font-medium"
                                >
                                    <div className="flex items-center gap-2">
                                        <Settings2 className="w-4 h-4 text-indigo-400" />
                                        {MODELLS.find(m => m.id === selectedModel)?.name}
                                    </div>
                                    <ChevronDown className={cn("w-4 h-4 transition-transform", showModels && "rotate-180")} />
                                </button>

                                <AnimatePresence>
                                    {showModels && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute top-full left-0 right-0 mt-2 bg-zinc-800 border border-zinc-700 rounded-2xl shadow-2xl z-50 overflow-hidden"
                                        >
                                            <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                                                {MODELLS.map((m) => (
                                                    <button
                                                        key={m.id}
                                                        onClick={() => {
                                                            setSelectedModel(m.id)
                                                            setShowModels(false)
                                                        }}
                                                        className={cn(
                                                            "w-full px-4 py-3 rounded-xl text-left text-sm transition-colors flex items-center justify-between group",
                                                            selectedModel === m.id ? "bg-indigo-500 text-white" : "text-zinc-400 hover:bg-white/5"
                                                        )}
                                                    >
                                                        <div>
                                                            <p className="font-semibold">{m.name}</p>
                                                            <p className={cn("text-[10px]", selectedModel === m.id ? "text-indigo-100" : "text-zinc-600")}>{m.desc}</p>
                                                        </div>
                                                        {selectedModel === m.id && <Check className="w-4 h-4" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Assistant Mode</label>
                            <div className="flex gap-2">
                                {TASKS.map((t) => {
                                    const Icon = t.icon
                                    return (
                                        <button
                                            key={t.id}
                                            onClick={() => setTask(t.id)}
                                            title={t.name}
                                            className={cn(
                                                "flex-1 h-12 rounded-2xl border transition-all flex items-center justify-center relative group",
                                                task === t.id
                                                    ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                                                    : "bg-zinc-800/50 border-zinc-700/50 text-zinc-500 hover:border-zinc-600"
                                            )}
                                        >
                                            <Icon className="w-5 h-5" />
                                            {task === t.id && (
                                                <motion.div
                                                    layoutId="active-task"
                                                    className="absolute -bottom-1 w-1 h-1 rounded-full bg-indigo-500"
                                                />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">
                            {TASKS.find(t => t.id === task)?.name} Request
                        </label>
                        <div className="relative">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={TASKS.find(t => t.id === task)?.prompt}
                                className="w-full h-32 bg-zinc-800/30 border border-zinc-700/50 rounded-2xl p-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all resize-none"
                            />
                            <div className="absolute bottom-3 right-3">
                                <Button
                                    onClick={handleGenerate}
                                    disabled={loading || !prompt.trim()}
                                    className="rounded-xl bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-900/20 h-10 px-4"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-3.5 h-3.5 mr-2" />}
                                    Generate
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Result Area */}
                    <AnimatePresence mode="wait">
                        {result && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-3 pt-2"
                            >
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Suggested Draft</label>
                                    <button
                                        onClick={handleCopy}
                                        className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
                                    >
                                        {copied ? <><Check className="w-3 h-3 text-emerald-500" /> Copied</> : <><Copy className="w-3 h-3" /> Copy Text</>}
                                    </button>
                                </div>
                                <div className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 text-sm text-zinc-300 leading-relaxed font-normal whitespace-pre-wrap selection:bg-emerald-500/30">
                                    {result}
                                </div>
                            </motion.div>
                        )}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="p-4 bg-white/5 text-center flex items-center justify-center gap-4 border-t border-white/5">
                    <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-widest">
                        {selectedModel.toUpperCase()}
                    </p>
                    <div className="w-1 h-1 rounded-full bg-zinc-800" />
                    <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-widest">
                        Quota Balanced Mode
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
