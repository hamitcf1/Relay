import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ShieldAlert, Plus, Printer, Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useHotelStore } from '@/stores/hotelStore'
import { useAuthStore } from '@/stores/authStore'
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { formatDisplayDate } from '@/lib/utils'
import { toast } from 'sonner'
import { useConfirm } from '@/components/ui/confirm-dialog'

export interface OfficialRecord {
    id: string
    record_number: string
    category: 'damage' | 'theft' | 'rule_violation' | 'cash_discrepancy' | 'general'
    title: string
    incident_date: string
    incident_time: string
    location: string
    related_person: string
    description: string
    witnesses: string
    created_by_name: string
    created_at: Date
}

interface OfficialRecordModalProps {
    isOpen: boolean
    onClose: () => void
}

export function OfficialRecordModal({ isOpen, onClose }: OfficialRecordModalProps) {
    const { hotel } = useHotelStore()
    const { user } = useAuthStore()
    const confirm = useConfirm()

    const [records, setRecords] = useState<OfficialRecord[]>([])
    const [selectedRecord, setSelectedRecord] = useState<OfficialRecord | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [loading, setLoading] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        category: 'general' as OfficialRecord['category'],
        title: '',
        incident_date: format(new Date(), 'yyyy-MM-dd'),
        incident_time: format(new Date(), 'HH:mm'),
        location: '',
        related_person: '',
        description: '',
        witnesses: ''
    })

    useEffect(() => {
        if (!hotel?.id || !isOpen) return

        const q = query(collection(db, 'hotels', hotel.id, 'official_records'), orderBy('created_at', 'desc'))
        const unsub = onSnapshot(q, (snap) => {
            const list: OfficialRecord[] = []
            snap.forEach(docSnap => {
                const d = docSnap.data()
                list.push({
                    id: docSnap.id,
                    record_number: d.record_number || `TUT-${docSnap.id.slice(0, 6).toUpperCase()}`,
                    category: d.category || 'general',
                    title: d.title || '',
                    incident_date: d.incident_date || format(new Date(), 'yyyy-MM-dd'),
                    incident_time: d.incident_time || format(new Date(), 'HH:mm'),
                    location: d.location || '',
                    related_person: d.related_person || '',
                    description: d.description || '',
                    witnesses: d.witnesses || '',
                    created_by_name: d.created_by_name || 'Staff',
                    created_at: d.created_at?.toDate ? d.created_at.toDate() : new Date()
                })
            })
            setRecords(list)
        })

        return () => unsub()
    }, [hotel?.id, isOpen])

    const handleCreate = async () => {
        if (!hotel?.id || !user || !formData.title.trim() || !formData.description.trim()) return
        if (user.is_demo) {
            toast.info('Demo modunda veritabanı yazması engellenmiştir.')
            return
        }

        setLoading(true)
        try {
            const generatedNumber = `TUT-${Math.floor(100000 + Math.random() * 900000)}`
            await addDoc(collection(db, 'hotels', hotel.id, 'official_records'), {
                record_number: generatedNumber,
                category: formData.category,
                title: formData.title.trim(),
                incident_date: formData.incident_date,
                incident_time: formData.incident_time,
                location: formData.location.trim(),
                related_person: formData.related_person.trim(),
                description: formData.description.trim(),
                witnesses: formData.witnesses.trim(),
                created_by_name: user.name || 'Unknown Staff',
                created_at: serverTimestamp()
            })

            toast.success(`Tutanak oluşturuldu: #${generatedNumber}`)
            setIsCreating(false)
            setFormData({
                category: 'general',
                title: '',
                incident_date: format(new Date(), 'yyyy-MM-dd'),
                incident_time: format(new Date(), 'HH:mm'),
                location: '',
                related_person: '',
                description: '',
                witnesses: ''
            })
        } catch (error) {
            console.error('Failed to create official record:', error)
            toast.error('Tutanak oluşturulurken hata oluştu')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (recordId: string) => {
        if (!hotel?.id || !user || user?.role !== 'gm') return
        if (user.is_demo) {
            toast.info('Demo modunda veritabanı yazması engellenmiştir.')
            return
        }
        const confirmed = await confirm({
            title: 'Tutanağı Sil',
            description: 'Bu tutanağı kalıcı olarak silmek istediğinizden emin misiniz?',
            variant: 'destructive',
            confirmLabel: 'Sil'
        })
        if (confirmed) {
            await deleteDoc(doc(db, 'hotels', hotel.id, 'official_records', recordId))
            if (selectedRecord?.id === recordId) setSelectedRecord(null)
            toast.success('Tutanak silindi')
        }
    }

    const handlePrint = () => {
        window.print()
    }

    const categoryLabels: Record<OfficialRecord['category'], string> = {
        damage: 'Otel Malına Hasar Tutanağı',
        theft: 'Kayıp / Hırsızlık Olay Tutanağı',
        rule_violation: 'Kural İhlali & Disiplin Tutanağı',
        cash_discrepancy: 'Kasa Kapanış Açığı Tutanağı',
        general: 'Genel Durum & Olay Tutanağı'
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-card border-border text-foreground max-w-4xl p-0 overflow-hidden max-h-[90vh]">
                <DialogTitle className="sr-only">Resmi Otel Tutanak Tutucu</DialogTitle>
                <DialogDescription className="sr-only">Official Hotel Record Generator</DialogDescription>

                <div className="flex flex-col h-full overflow-hidden">
                    {/* Header */}
                    <div className="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-rose-500" />
                            <h3 className="font-bold text-foreground text-sm">Resmi Otel Tutanak Tutucu (Official Record Generator)</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            {!isCreating && (
                                <Button size="sm" onClick={() => setIsCreating(true)} className="bg-primary hover:bg-primary/90 h-8 text-xs gap-1">
                                    <Plus className="w-3.5 h-3.5" /> Yeni Tutanak Oluştur
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* New Record Form */}
                        {isCreating ? (
                            <div className="bg-card p-4 rounded-xl border border-primary/30 space-y-4 shadow-lg">
                                <div className="flex items-center justify-between pb-2 border-b border-border">
                                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Yeni Tutanak Kaydı Formu</h4>
                                    <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)} className="h-7 text-xs">
                                        Vazgeç
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-muted-foreground font-bold uppercase">Tutanak Kategorisi</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e: any) => setFormData(p => ({ ...p, category: e.target.value }))}
                                            className="w-full h-8 text-xs rounded-md border border-border bg-background px-2"
                                        >
                                            {Object.entries(categoryLabels).map(([cat, label]) => (
                                                <option key={cat} value={cat}>{label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] text-muted-foreground font-bold uppercase">Tutanak Başlığı / Konusu</label>
                                        <Input
                                            placeholder="Örn: 204 Nolu Odada Kırılan Sehpa Hasarı"
                                            value={formData.title}
                                            onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                                            className="h-8 text-xs"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] text-muted-foreground font-bold uppercase">Olay Tarihi & Saati</label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="date"
                                                value={formData.incident_date}
                                                onChange={(e) => setFormData(p => ({ ...p, incident_date: e.target.value }))}
                                                className="h-8 text-xs"
                                            />
                                            <Input
                                                type="time"
                                                value={formData.incident_time}
                                                onChange={(e) => setFormData(p => ({ ...p, incident_time: e.target.value }))}
                                                className="h-8 text-xs w-28"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] text-muted-foreground font-bold uppercase">Olay Yeri / Oda Numarası</label>
                                        <Input
                                            placeholder="Örn: Oda #204 veya Lobi Restoran"
                                            value={formData.location}
                                            onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))}
                                            className="h-8 text-xs"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] text-muted-foreground font-bold uppercase">İlgili Misafir veya Personel</label>
                                        <Input
                                            placeholder="Örn: John Doe (Oda 204)"
                                            value={formData.related_person}
                                            onChange={(e) => setFormData(p => ({ ...p, related_person: e.target.value }))}
                                            className="h-8 text-xs"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] text-muted-foreground font-bold uppercase">Şahit Personeller</label>
                                        <Input
                                            placeholder="Örn: Mehmet Can (Resepsiyonist), Ahmet Y. (Güvenlik)"
                                            value={formData.witnesses}
                                            onChange={(e) => setFormData(p => ({ ...p, witnesses: e.target.value }))}
                                            className="h-8 text-xs"
                                        />
                                    </div>

                                    <div className="col-span-2 space-y-1">
                                        <label className="text-[10px] text-muted-foreground font-bold uppercase">Detaylı Olay Açıklaması & İfadeler</label>
                                        <textarea
                                            placeholder="Olayın nasıl meydana geldiğini, tespit edilen durumları ve tarafların beyanlarını detaylı olarak yazınız..."
                                            value={formData.description}
                                            onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                            className="w-full min-h-[100px] text-xs p-2 rounded-md border border-border bg-background"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button
                                        onClick={handleCreate}
                                        disabled={!formData.title.trim() || !formData.description.trim() || loading}
                                        className="flex-1 bg-primary hover:bg-primary/90 h-8 text-xs"
                                    >
                                        <Check className="w-3.5 h-3.5 mr-1" /> Tutanağı Oluştur & Kaydet
                                    </Button>
                                </div>
                            </div>
                        ) : selectedRecord ? (
                            /* Record Detail / Printable Official Document View */
                            <div className="bg-white text-zinc-950 p-6 rounded-xl space-y-6 shadow-2xl printable-area">
                                <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
                                    <div>
                                        <h2 className="text-xl font-bold uppercase tracking-wide">{hotel?.info?.name || 'AETHERIUS HOTEL'}</h2>
                                        <p className="text-xs text-zinc-600 font-semibold">{categoryLabels[selectedRecord.category]}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-mono text-xs font-bold px-2 py-1 bg-zinc-100 border border-zinc-300 rounded">
                                            #{selectedRecord.record_number}
                                        </span>
                                        <p className="text-[10px] text-zinc-500 mt-1">{formatDisplayDate(selectedRecord.created_at)}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-xs bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                                    <div>
                                        <span className="font-bold text-zinc-500 uppercase block">Olay Konusu:</span>
                                        <span className="font-semibold text-zinc-900">{selectedRecord.title}</span>
                                    </div>
                                    <div>
                                        <span className="font-bold text-zinc-500 uppercase block">Olay Tarihi & Saati:</span>
                                        <span className="font-semibold text-zinc-900">{selectedRecord.incident_date} - {selectedRecord.incident_time}</span>
                                    </div>
                                    <div>
                                        <span className="font-bold text-zinc-500 uppercase block">Olay Yeri / Oda:</span>
                                        <span className="font-semibold text-zinc-900">{selectedRecord.location || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="font-bold text-zinc-500 uppercase block">İlgili Kişi / Misafir:</span>
                                        <span className="font-semibold text-zinc-900">{selectedRecord.related_person || '-'}</span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold uppercase text-zinc-500 mb-1">Olay Açıklaması & İfade Metni</h4>
                                    <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200 text-xs text-zinc-800 leading-relaxed whitespace-pre-wrap">
                                        {selectedRecord.description}
                                    </div>
                                </div>

                                {selectedRecord.witnesses && (
                                    <div>
                                        <h4 className="text-xs font-bold uppercase text-zinc-500 mb-1">Şahitler</h4>
                                        <p className="text-xs font-medium text-zinc-800">{selectedRecord.witnesses}</p>
                                    </div>
                                )}

                                {/* Signatures Area */}
                                <div className="grid grid-cols-3 gap-6 pt-8 border-t border-zinc-200 text-center">
                                    <div>
                                        <p className="text-xs font-bold text-zinc-800">Tutanağı Tutan</p>
                                        <p className="text-[10px] text-zinc-500">{selectedRecord.created_by_name}</p>
                                        <div className="mt-8 border-b border-zinc-400 w-32 mx-auto" />
                                        <p className="text-[9px] text-zinc-400 mt-1">İmza</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-zinc-800">Şahit Personel</p>
                                        <p className="text-[10px] text-zinc-500">{selectedRecord.witnesses || 'İmza'}</p>
                                        <div className="mt-8 border-b border-zinc-400 w-32 mx-auto" />
                                        <p className="text-[9px] text-zinc-400 mt-1">İmza</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-zinc-800">Otel Müdürü / GM</p>
                                        <p className="text-[10px] text-zinc-500">Onay</p>
                                        <div className="mt-8 border-b border-zinc-400 w-32 mx-auto" />
                                        <p className="text-[9px] text-zinc-400 mt-1">İmza & Kaşe</p>
                                    </div>
                                </div>

                                {/* Print Actions */}
                                <div className="flex items-center justify-between pt-4 border-t border-zinc-200 no-print">
                                    <Button variant="outline" size="sm" onClick={() => setSelectedRecord(null)} className="h-8 text-xs text-zinc-700">
                                        Kayıt Listesine Dön
                                    </Button>
                                    <div className="flex items-center gap-2">
                                        {user?.role === 'gm' && (
                                            <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedRecord.id)} className="h-8 text-xs">
                                                <Trash2 className="w-3.5 h-3.5 mr-1" /> Tutanağı Sil
                                            </Button>
                                        )}
                                        <Button size="sm" onClick={handlePrint} className="bg-zinc-900 text-white hover:bg-zinc-800 h-8 text-xs">
                                            <Printer className="w-3.5 h-3.5 mr-1" /> Resmi Tutanağı Yazdır / PDF İndir
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Records List */
                            <div className="space-y-2">
                                {records.length === 0 ? (
                                    <div className="text-center py-12 text-xs text-muted-foreground">
                                        Henüz kaydedilmiş tutanak bulunmuyor.
                                    </div>
                                ) : (
                                    records.map(rec => (
                                        <div
                                            key={rec.id}
                                            onClick={() => setSelectedRecord(rec)}
                                            className="p-3 bg-card border border-border hover:border-primary/50 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                                                        #{rec.record_number}
                                                    </span>
                                                    <span className="font-bold text-xs text-foreground">{rec.title}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                                    <span>{categoryLabels[rec.category]}</span>
                                                    <span>•</span>
                                                    <span>{rec.incident_date} - {rec.incident_time}</span>
                                                    <span>•</span>
                                                    <span>Tutanak: {rec.created_by_name}</span>
                                                </div>
                                            </div>

                                            <Button variant="ghost" size="sm" className="h-7 text-xs text-primary">
                                                Görüntüle / Yazdır
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
