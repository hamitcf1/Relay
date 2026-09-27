import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search, CreditCard, ArrowLeftRight, Clock, ShieldAlert,
    Settings, Globe, Plus, Receipt, ArrowRight, X, Command, FileText
} from 'lucide-react'
import { useSalesStore } from '@/stores/salesStore'
import { useLanguageStore } from '@/stores/languageStore'
import { cn } from '@/lib/utils'

interface CommandPaletteProps {
    isOpen: boolean
    onClose: () => void
    onOpen?: () => void
    onNavigateTab?: (tabId: string) => void
    onOpenNewSale?: () => void
    onOpenNewNote?: () => void
    onOpenOfficialRecord?: () => void
}

export function CommandPalette({
    isOpen,
    onClose,
    onOpen,
    onNavigateTab,
    onOpenNewSale,
    onOpenNewNote,
    onOpenOfficialRecord
}: CommandPaletteProps) {
    const { setLanguage } = useLanguageStore()
    const { sales } = useSalesStore()
    const [query, setQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'k' || e.code === 'KeyK')) {
                e.preventDefault()
                if (isOpen) {
                    onClose()
                } else {
                    setQuery('')
                    onOpen?.()
                }
            }
            if (e.key === 'Escape' && isOpen) {
                onClose()
            }
        }
        window.addEventListener('keydown', handleKeyDown, true)
        return () => window.removeEventListener('keydown', handleKeyDown, true)
    }, [isOpen, onClose, onOpen])

    if (!isOpen) return null

    const navigationItems = [
        { id: 'notes', label: 'Vardiya Devri & Notlar (Shift Handover & Notes)', icon: ArrowLeftRight, category: 'Navigasyon' },
        { id: 'sales', label: 'Satışlar & Tur Kataloğu (Sales & Tours)', icon: CreditCard, category: 'Navigasyon' },
        { id: 'roster', label: 'Haftalık Vardiya Matrisi (Roster)', icon: Clock, category: 'Navigasyon' },
        { id: 'asset-management', label: 'Bakım & Kayıp Eşya Yönetimi (Asset & Maintenance)', icon: ShieldAlert, category: 'Navigasyon' },
        { id: 'hotel-tools', label: 'Otel Rehberi & Araçları (Hotel Tools)', icon: Globe, category: 'Navigasyon' },
        { id: 'team', label: 'Ekip & İzin Günleri Planlayıcı (Team & Off-Days)', icon: Settings, category: 'Navigasyon' },
    ]

    const actionItems = [
        {
            id: 'action-new-sale',
            label: 'Yeni Tur/Transfer Satışı Yap (#RES-...)',
            icon: Plus,
            category: 'Hızlı Aksiyon',
            run: () => { onOpenNewSale?.(); onClose() }
        },
        {
            id: 'action-new-note',
            label: 'Yeni Vardiya Notu / Talep Ekle',
            icon: FileText,
            category: 'Hızlı Aksiyon',
            run: () => { onOpenNewNote?.(); onClose() }
        },
        {
            id: 'action-personal-notes',
            label: 'Kişisel Notlarıma Geç',
            icon: FileText,
            category: 'Hızlı Aksiyon',
            run: () => { onNavigateTab?.('personal-notes'); onClose() }
        },
        {
            id: 'action-hotel-info',
            label: 'Otel Rehberi & Dahili Telefonlar',
            icon: Globe,
            category: 'Hızlı Aksiyon',
            run: () => { onNavigateTab?.('hotel-info'); onClose() }
        },
        {
            id: 'action-official-record',
            label: 'Resmi Otel Tutanağı Oluştur (Official Record)',
            icon: ShieldAlert,
            category: 'Hızlı Aksiyon',
            run: () => { onOpenOfficialRecord?.(); onClose() }
        },
        {
            id: 'action-lang-tr',
            label: 'Dili Türkçe Yap (Switch to Turkish)',
            icon: Globe,
            category: 'Dil Ayarları',
            run: () => { setLanguage('tr'); onClose() }
        },
        {
            id: 'action-lang-en',
            label: 'Dili İngilizce Yap (Switch to English)',
            icon: Globe,
            category: 'Dil Ayarları',
            run: () => { setLanguage('en'); onClose() }
        }
    ]

    const q = query.toLowerCase().trim()

    const filteredNav = navigationItems.filter(item =>
        item.label.toLowerCase().includes(q)
    )

    const filteredActions = actionItems.filter(item =>
        item.label.toLowerCase().includes(q)
    )

    const filteredSales = q ? sales.filter(s => {
        const resCode = (s.reservation_code || ('RES-' + s.id.slice(0, 6))).toLowerCase()
        return resCode.includes(q) || s.name.toLowerCase().includes(q) || (s.customer_name || '').toLowerCase().includes(q) || (s.room_number || '').includes(q)
    }).slice(0, 5) : []

    const allResults = [
        ...filteredNav.map(n => ({ ...n, type: 'nav' as const })),
        ...filteredActions.map(a => ({ ...a, type: 'action' as const })),
        ...filteredSales.map(s => ({
            id: `sale-${s.id}`,
            label: `${s.name} - ${s.customer_name || 'Misafir'} (#${s.reservation_code || ('RES-' + s.id.slice(0, 6).toUpperCase())})`,
            icon: Receipt,
            category: 'Satışlar & Rezervasyonlar',
            type: 'sale' as const,
            saleId: s.id
        }))
    ]

    const handleSelect = (index: number) => {
        const item = allResults[index]
        if (!item) return

        if (item.type === 'nav') {
            onNavigateTab?.(item.id)
            onClose()
        } else if (item.type === 'action' && item.run) {
            item.run()
        } else if (item.type === 'sale') {
            onNavigateTab?.('sales')
            onClose()
        }
    }

    return (
        <AnimatePresence>
            <div onClick={onClose} className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-start justify-center pt-16 px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-xl bg-card border border-primary/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                >
                    {/* Header Input */}
                    <div className="p-4 border-b border-border flex items-center gap-3 relative">
                        <Search className="w-5 h-5 text-primary shrink-0" />
                        <input
                            type="text"
                            autoFocus
                            placeholder="Komut yazın veya rezervasyon no (#RES-...), oda (#104) veya modül arayın..."
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                            onKeyDown={(e) => {
                                if (e.key === 'ArrowDown') {
                                    e.preventDefault()
                                    setSelectedIndex(p => (p + 1) % Math.max(1, allResults.length))
                                } else if (e.key === 'ArrowUp') {
                                    e.preventDefault()
                                    setSelectedIndex(p => (p - 1 + allResults.length) % Math.max(1, allResults.length))
                                } else if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleSelect(selectedIndex)
                                }
                            }}
                            className="w-full bg-transparent border-none text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                        />
                        <button
                            onClick={onClose}
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Results List */}
                    <div className="overflow-y-auto p-2 space-y-1 divide-y divide-border/20">
                        {allResults.length === 0 ? (
                            <div className="py-8 text-center text-xs text-muted-foreground">
                                Eşleşen komut veya kayıt bulunamadı.
                            </div>
                        ) : (
                            allResults.map((item, idx) => {
                                const Icon = item.icon
                                const isSelected = idx === selectedIndex

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => handleSelect(idx)}
                                        onMouseEnter={() => setSelectedIndex(idx)}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl text-xs font-medium cursor-pointer transition-all",
                                            isSelected ? "bg-primary/10 text-primary border border-primary/20" : "text-foreground hover:bg-muted/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Icon className={cn("w-4 h-4 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
                                            <span className="truncate">{item.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-muted-foreground uppercase px-2 py-0.5 rounded bg-muted/60">
                                                {item.category}
                                            </span>
                                            {isSelected && <ArrowRight className="w-3.5 h-3.5 text-primary" />}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>

                    {/* Footer Guide */}
                    <div className="p-3 bg-muted/40 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[9px] font-mono">↑↓</kbd> Gezin
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[9px] font-mono">↵</kbd> Seç
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[9px] font-mono">ESC</kbd> Kapat
                            </span>
                        </div>
                        <div className="flex items-center gap-1 font-semibold text-primary">
                            <Command className="w-3 h-3" /> Cyber-Concierge
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
