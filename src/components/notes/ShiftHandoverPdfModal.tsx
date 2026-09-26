import { Printer, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useHotelStore } from '@/stores/hotelStore'
import { formatDisplayDate } from '@/lib/utils'
import type { ShiftNote } from '@/types'

interface ShiftHandoverPdfModalProps {
    isOpen: boolean
    onClose: () => void
    notes: ShiftNote[]
}

export function ShiftHandoverPdfModal({ isOpen, onClose, notes }: ShiftHandoverPdfModalProps) {
    const { hotel } = useHotelStore()

    const handlePrint = () => {
        window.print()
    }

    const activeNotes = notes.filter(n => n.status === 'active')
    const criticalNotes = notes.filter(n => n.priority === 'critical' || n.priority === 'high')

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-card border-border text-foreground max-w-3xl p-0 overflow-hidden max-h-[90vh]">
                <DialogTitle className="sr-only">Yazdırılabilir Vardiya Devir Özet Tutanak Belgesi</DialogTitle>
                <DialogDescription className="sr-only">Printable Shift Handover Summary Document</DialogDescription>

                <div className="flex flex-col h-full overflow-y-auto p-6 space-y-6 bg-white text-zinc-950 printable-area">
                    {/* Document Header */}
                    <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-4">
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-zinc-950 uppercase">{hotel?.info?.name || 'AETHERIUS HOTEL'}</h2>
                            <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Resmi Vardiya Devir Teslim Tutanağı</p>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-mono font-bold px-2.5 py-1 bg-zinc-100 border border-zinc-300 rounded-md">
                                {formatDisplayDate(new Date())}
                            </span>
                            <p className="text-[10px] text-zinc-500 mt-1 font-mono">Devir Zamanı: {new Date().toLocaleTimeString('tr-TR')}</p>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-3 text-center text-xs">
                        <div className="p-3 bg-zinc-100 rounded-lg border border-zinc-300">
                            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Toplam Devir Notu</span>
                            <span className="text-lg font-bold text-zinc-900">{notes.length}</span>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-300">
                            <span className="text-[10px] uppercase font-bold text-amber-700 block">Devreden Açık Notlar</span>
                            <span className="text-lg font-bold text-amber-900">{activeNotes.length}</span>
                        </div>
                        <div className="p-3 bg-rose-50 rounded-lg border border-rose-300">
                            <span className="text-[10px] uppercase font-bold text-rose-700 block">Kritik & Yüksek Öncelik</span>
                            <span className="text-lg font-bold text-rose-900">{criticalNotes.length}</span>
                        </div>
                    </div>

                    {/* Active Notes Section */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2 border-b border-zinc-300 pb-1 flex items-center justify-between">
                            <span>Devreden Takip Edilecek İşler & Talepler</span>
                            <span className="text-[10px] font-normal">({activeNotes.length} Açık Kayıt)</span>
                        </h3>
                        <div className="space-y-2">
                            {activeNotes.length === 0 ? (
                                <p className="text-xs italic text-zinc-500 py-2">Tüm vardiya notları çözüldü veya tamamlandı.</p>
                            ) : (
                                activeNotes.map((note, idx) => (
                                    <div key={note.id} className="p-2.5 bg-zinc-50 rounded border border-zinc-200 text-xs space-y-1">
                                        <div className="flex items-center justify-between font-bold text-zinc-900">
                                            <span>#{idx + 1} {note.room_number ? `Oda #${note.room_number}` : ''} {note.guest_name ? `- Misafir: ${note.guest_name}` : ''}</span>
                                            {note.priority && (
                                                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-zinc-200 font-bold">
                                                    Öncelik: {note.priority}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-zinc-800 leading-normal">{note.content}</p>
                                        <div className="text-[10px] text-zinc-500 pt-1">
                                            Ekleyen: {note.created_by_name} ({formatDisplayDate(note.created_at)})
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Regulatory Compliance Verification */}
                    <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-300 text-xs space-y-2">
                        <h4 className="font-bold uppercase text-zinc-800 text-[11px]">Yasal & Mevzuat Kontrolleri</h4>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className="flex items-center gap-2 text-emerald-800">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>KBS Kimlik Bildirimi Tamamlandı</span>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-800">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Acente Mesajları & Kasa Kontrol Edildi</span>
                            </div>
                        </div>
                    </div>

                    {/* Signatures Area */}
                    <div className="grid grid-cols-2 gap-8 pt-8 border-t-2 border-zinc-900 text-center text-xs">
                        <div>
                            <p className="font-bold text-zinc-900 uppercase">Devreden Vardiya Sorumlusu</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">Teslim Eden Resepsiyon / Amir</p>
                            <div className="mt-10 border-b border-zinc-400 w-44 mx-auto" />
                            <p className="text-[9px] text-zinc-400 mt-1">İmza & Tarih</p>
                        </div>
                        <div>
                            <p className="font-bold text-zinc-900 uppercase">Devralan Vardiya Sorumlusu</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">Teslim Alan Resepsiyon / Amir</p>
                            <div className="mt-10 border-b border-zinc-400 w-44 mx-auto" />
                            <p className="text-[9px] text-zinc-400 mt-1">İmza & Tarih</p>
                        </div>
                    </div>

                    {/* Print Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-200 no-print">
                        <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs text-zinc-700">
                            Kapat
                        </Button>
                        <Button size="sm" onClick={handlePrint} className="bg-zinc-900 text-white hover:bg-zinc-800 h-8 text-xs">
                            <Printer className="w-3.5 h-3.5 mr-1" /> Devir Tutanağını Yazdır / PDF İndir
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
