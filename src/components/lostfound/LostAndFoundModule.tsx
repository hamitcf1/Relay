import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { Package, Plus, Search, CheckCircle2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useHotelStore } from '@/stores/hotelStore'
import { useAuthStore } from '@/stores/authStore'
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { cn, formatDisplayDate } from '@/lib/utils'
import { toast } from 'sonner'
import { useConfirm } from '@/components/ui/confirm-dialog'

export interface LostItem {
    id: string
    tracking_code: string
    title: string
    category: 'electronics' | 'jewelry' | 'clothing' | 'documents' | 'other'
    date_found: string
    location_found: string
    found_by: string
    guest_name?: string | null
    status: 'unclaimed' | 'claimed' | 'disposed'
    storage_location: string
    notes?: string
    claimed_at?: Date | null
    claimed_by_guest?: string | null
    created_at: Date
}

export function LostAndFoundModule() {
    const { hotel } = useHotelStore()
    const { user } = useAuthStore()
    const confirm = useConfirm()

    const [items, setItems] = useState<LostItem[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'unclaimed' | 'claimed' | 'disposed'>('unclaimed')
    const [isAdding, setIsAdding] = useState(false)
    const [saving, setSaving] = useState(false)

    // Form
    const [formData, setFormData] = useState({
        title: '',
        category: 'other' as LostItem['category'],
        date_found: format(new Date(), 'yyyy-MM-dd'),
        location_found: '',
        found_by: user?.name || '',
        guest_name: '',
        storage_location: 'Resepsiyon Kasa',
        notes: ''
    })

    useEffect(() => {
        if (!hotel?.id) return
        const q = query(collection(db, 'hotels', hotel.id, 'lost_found'), orderBy('created_at', 'desc'))
        const unsub = onSnapshot(q, (snap) => {
            const list: LostItem[] = []
            snap.forEach(docSnap => {
                const d = docSnap.data()
                list.push({
                    id: docSnap.id,
                    tracking_code: d.tracking_code || `LF-${docSnap.id.slice(0, 5).toUpperCase()}`,
                    title: d.title || '',
                    category: d.category || 'other',
                    date_found: d.date_found || format(new Date(), 'yyyy-MM-dd'),
                    location_found: d.location_found || '',
                    found_by: d.found_by || 'Staff',
                    guest_name: d.guest_name || null,
                    status: d.status || 'unclaimed',
                    storage_location: d.storage_location || 'Storage',
                    notes: d.notes || '',
                    claimed_at: d.claimed_at?.toDate ? d.claimed_at.toDate() : null,
                    claimed_by_guest: d.claimed_by_guest || null,
                    created_at: d.created_at?.toDate ? d.created_at.toDate() : new Date()
                })
            })
            setItems(list)
        })
        return () => unsub()
    }, [hotel?.id])

    const handleAdd = async () => {
        if (!hotel?.id || !user || !formData.title.trim()) return
        if (user.is_demo) {
            toast.info('Demo modunda veritabanı yazması engellenmiştir.')
            return
        }
        setSaving(true)
        try {
            const trackingCode = `LF-${Math.floor(10000 + Math.random() * 90000)}`
            await addDoc(collection(db, 'hotels', hotel.id, 'lost_found'), {
                tracking_code: trackingCode,
                title: formData.title.trim(),
                category: formData.category,
                date_found: formData.date_found,
                location_found: formData.location_found.trim(),
                found_by: formData.found_by.trim() || user.name,
                guest_name: formData.guest_name.trim() || null,
                status: 'unclaimed',
                storage_location: formData.storage_location.trim(),
                notes: formData.notes.trim(),
                created_at: serverTimestamp()
            })

            toast.success(`Kayıt oluşturuldu: #${trackingCode}`)
            setIsAdding(false)
            setFormData({
                title: '',
                category: 'other',
                date_found: format(new Date(), 'yyyy-MM-dd'),
                location_found: '',
                found_by: user.name || '',
                guest_name: '',
                storage_location: 'Resepsiyon Kasa',
                notes: ''
            })
        } catch (error) {
            console.error('Failed to add lost item:', error)
            toast.error('Kayıt eklenirken hata oluştu')
        } finally {
            setSaving(false)
        }
    }

    const handleMarkClaimed = async (item: LostItem) => {
        if (!hotel?.id || !user) return
        if (user.is_demo) {
            toast.info('Demo modunda veritabanı yazması engellenmiştir.')
            return
        }
        const guestName = prompt('Eşyayı teslim alan misafirin adı soyadı:', item.guest_name || '')
        if (!guestName) return

        await updateDoc(doc(db, 'hotels', hotel.id, 'lost_found', item.id), {
            status: 'claimed',
            claimed_by_guest: guestName,
            claimed_at: serverTimestamp()
        })
        toast.success('Eşya misafire teslim edildi olarak işaretlendi')
    }

    const handleDelete = async (itemId: string) => {
        if (!hotel?.id || !user || user?.role !== 'gm') return
        if (user.is_demo) {
            toast.info('Demo modunda veritabanı yazması engellenmiştir.')
            return
        }
        const confirmed = await confirm({
            title: 'Kayıt Silinsin mi?',
            description: 'Bu kayıp eşya kaydını kalıcı olarak silmek istediğinizden emin misiniz?',
            variant: 'destructive',
            confirmLabel: 'Sil'
        })
        if (confirmed) {
            await deleteDoc(doc(db, 'hotels', hotel.id, 'lost_found', itemId))
            toast.success('Kayıt silindi')
        }
    }

    const filteredItems = items.filter(item => {
        if (statusFilter !== 'all' && item.status !== statusFilter) return false
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim()
            const matchCode = item.tracking_code.toLowerCase().includes(q)
            const matchTitle = item.title.toLowerCase().includes(q)
            const matchLoc = item.location_found.toLowerCase().includes(q)
            const matchGuest = (item.guest_name || '').toLowerCase().includes(q)
            return matchCode || matchTitle || matchLoc || matchGuest
        }
        return true
    })

    const categoryLabels: Record<LostItem['category'], string> = {
        electronics: 'Elektronik',
        jewelry: 'Takı & Mücevher',
        clothing: 'Giyim & Tekstil',
        documents: 'Belok & Kimlik',
        other: 'Diğer'
    }

    return (
        <Card className="bg-card border-border shadow-xl">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Kayıp & Bulunan Eşya Takibi (Lost & Found)
                </CardTitle>
                {!isAdding && (
                    <Button size="sm" onClick={() => setIsAdding(true)} className="bg-primary hover:bg-primary/90 h-8 text-xs gap-1">
                        <Plus className="w-3.5 h-3.5" /> Yeni Bulunan Eşya Ekle
                    </Button>
                )}
            </CardHeader>

            <CardContent className="space-y-4 p-3">
                {/* Search & Filter Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Takip No (#LF-...), Eşya Adı, Bulunduğu Yer veya Misafir..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 h-8 text-xs bg-background/60"
                        />
                    </div>

                    <div className="flex items-center gap-1">
                        {(['unclaimed', 'claimed', 'disposed', 'all'] as const).map(st => (
                            <button
                                key={st}
                                onClick={() => setStatusFilter(st)}
                                className={cn(
                                    "text-xs px-2.5 py-1 rounded-md transition-all font-medium border",
                                    statusFilter === st
                                        ? "bg-primary/10 text-primary border-primary/30"
                                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                                )}
                            >
                                {st === 'unclaimed' ? 'Beklemede (Unclaimed)' : st === 'claimed' ? 'Teslim Edildi' : st === 'disposed' ? 'İmha Edildi' : 'Tümü'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Add Form */}
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-3 bg-muted/30 rounded-xl border border-primary/30 space-y-3"
                    >
                        <h4 className="text-xs font-bold text-foreground uppercase">Yeni Bulunan Eşya Girişi</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <Input
                                placeholder="Eşya Tanımı (Örn: Siyah iPhone 14 Pro, Mavi Deri Cüzdan)"
                                value={formData.title}
                                onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                                className="h-8 text-xs"
                            />
                            <select
                                value={formData.category}
                                onChange={(e: any) => setFormData(p => ({ ...p, category: e.target.value }))}
                                className="h-8 text-xs rounded-md border border-border bg-background px-2"
                            >
                                {Object.entries(categoryLabels).map(([cat, label]) => (
                                    <option key={cat} value={cat}>{label}</option>
                                ))}
                            </select>
                            <Input
                                placeholder="Bulunduğu Yer (Örn: Room #304 veya Havuz Başı)"
                                value={formData.location_found}
                                onChange={(e) => setFormData(p => ({ ...p, location_found: e.target.value }))}
                                className="h-8 text-xs"
                            />
                            <Input
                                placeholder="Saklandığı Yer (Örn: Resepsiyon Kasa A-2)"
                                value={formData.storage_location}
                                onChange={(e) => setFormData(p => ({ ...p, storage_location: e.target.value }))}
                                className="h-8 text-xs"
                            />
                            <Input
                                placeholder="Tahmini Misafir Adı (Varsa)"
                                value={formData.guest_name}
                                onChange={(e) => setFormData(p => ({ ...p, guest_name: e.target.value }))}
                                className="h-8 text-xs"
                            />
                            <Input
                                type="date"
                                value={formData.date_found}
                                onChange={(e) => setFormData(p => ({ ...p, date_found: e.target.value }))}
                                className="h-8 text-xs"
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button onClick={handleAdd} disabled={!formData.title.trim() || saving} className="flex-1 bg-primary hover:bg-primary/90 h-8 text-xs">
                                Kaydı Oluştur
                            </Button>
                            <Button variant="ghost" onClick={() => setIsAdding(false)} className="h-8 text-xs">
                                Vazgeç
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* Items List */}
                <div className="space-y-2">
                    {filteredItems.length === 0 ? (
                        <div className="text-center py-10 text-xs text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/60">
                            Kayıtlı bulunmuş eşya bulunmuyor.
                        </div>
                    ) : (
                        filteredItems.map(item => {
                            const categoryColors: Record<LostItem['category'], string> = {
                                electronics: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25',
                                jewelry: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
                                clothing: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/25',
                                documents: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
                                other: 'bg-muted text-muted-foreground border-border'
                            }

                            return (
                                <div
                                    key={item.id}
                                    className={cn(
                                        "p-3.5 rounded-2xl border transition-all duration-200 flex flex-wrap items-center justify-between gap-3 shadow-xs hover:shadow-md hover:-translate-y-[1px]",
                                        item.status === 'claimed'
                                            ? "bg-emerald-500/5 border-emerald-500/20"
                                            : item.status === 'disposed'
                                                ? "bg-muted/40 border-border opacity-70"
                                                : "bg-card/90 border-border/80 hover:border-primary/40"
                                    )}
                                >
                                    <div className="space-y-1.5 flex-1 min-w-[240px]">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                                                #{item.tracking_code}
                                            </span>
                                            <span className="font-bold text-sm text-foreground tracking-tight">{item.title}</span>
                                            <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border", categoryColors[item.category])}>
                                                {categoryLabels[item.category]}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                            <span>Bulunduğu Yer: <strong className="text-foreground">{item.location_found || 'Belirtilmedi'}</strong></span>
                                            <span className="text-muted-foreground/40">•</span>
                                            <span>Saklandığı Yeri: <strong className="text-foreground">{item.storage_location}</strong></span>
                                            <span className="text-muted-foreground/40">•</span>
                                            <span>Tarih: {item.date_found}</span>
                                            {item.guest_name && (
                                                <>
                                                    <span className="text-muted-foreground/40">•</span>
                                                    <span className="text-primary font-semibold">Misafir: {item.guest_name}</span>
                                                </>
                                            )}
                                        </div>

                                        {item.status === 'claimed' && item.claimed_by_guest && (
                                            <div className="text-xs text-emerald-500 font-semibold flex items-center gap-1.5 pt-0.5">
                                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                                Teslim Alan: {item.claimed_by_guest} ({formatDisplayDate(item.claimed_at || new Date())})
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {item.status === 'unclaimed' && (
                                            <Button size="sm" onClick={() => handleMarkClaimed(item)} className="bg-emerald-600 hover:bg-emerald-500 text-white h-8 text-xs font-semibold px-3">
                                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Misafire Teslim Et
                                            </Button>
                                        )}
                                        {user?.role === 'gm' && (
                                            <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)} className="w-8 h-8 text-rose-500 hover:bg-rose-500/10 hover:text-rose-400">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
