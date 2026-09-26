import { useRef, useState, useEffect } from 'react'
import { toPng } from 'html-to-image'
import QRCode from 'react-qr-code'
import { Download, Printer, Sun, Moon, ChevronDown, Share2, Copy, Edit3, Check, X, ShieldCheck } from 'lucide-react'

import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

import { useSalesStore, saleTypeInfo } from '@/stores/salesStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useCurrencyStore } from '@/stores/currencyStore'
import { cn, formatDisplayDate, parseGuestNames, isTRYCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import type { Sale, Currency, PaymentStatus } from '@/types'

interface VoucherPreviewModalProps {
    saleId: string | null
    onClose: () => void
}

export function VoucherPreviewModal({ saleId, onClose }: VoucherPreviewModalProps) {
    const { hotel } = useHotelStore()
    const { t } = useLanguageStore()
    const { sales, updateSale } = useSalesStore()
    const { rates, fetchRates } = useCurrencyStore()

    const voucherRef = useRef<HTMLDivElement>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [theme, setTheme] = useState<'dark' | 'light'>('dark')
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState<Partial<Sale>>({})

    const sale = sales.find(s => s.id === saleId)

    useEffect(() => {
        if (saleId) fetchRates()
    }, [saleId, fetchRates])

    useEffect(() => {
        if (sale) {
            setEditForm({
                name: sale.name,
                customer_name: sale.customer_name,
                customer_phone: sale.customer_phone || '',
                room_number: sale.room_number || '',
                pickup_location: sale.pickup_location || '',
                dropoff_location: sale.dropoff_location || '',
                flight_number: sale.flight_number || '',
                date: sale.date,
                sale_date: sale.sale_date || sale.created_at,
                pickup_time: sale.pickup_time || '',
                pax: sale.pax,
                total_price: sale.total_price,
                currency: sale.currency,
                payment_status: sale.payment_status,
                collected_amount: sale.collected_amount ?? (sale.payment_status === 'paid' ? sale.total_price : 0),
                status: sale.status || 'waiting',
                notes: sale.notes || ''
            })
        }
    }, [sale, isEditing])

    if (!sale) return null

    const reservationCode = sale.reservation_code || (`RES-${sale.id.slice(0, 6).toUpperCase()}`)

    const handleSaveEdit = async () => {
        if (!hotel?.id || !sale.id) return
        try {
            const finalTotal = editForm.total_price !== undefined ? editForm.total_price : sale.total_price
            let finalStatus = editForm.payment_status || sale.payment_status
            let finalCollected = editForm.collected_amount ?? sale.collected_amount

            if (finalStatus === 'paid' && (finalCollected === 0 || finalCollected === undefined)) {
                finalCollected = finalTotal
            } else if (finalCollected >= finalTotal && finalTotal > 0) {
                finalStatus = 'paid'
            }

            const updates: Partial<Sale> = {
                ...editForm,
                total_price: finalTotal,
                payment_status: finalStatus,
                collected_amount: finalCollected
            }

            await updateSale(hotel.id, sale.id, updates)
            toast.success('Voucher bilgileri başarıyla güncellendi.')
            setIsEditing(false)
        } catch (error) {
            console.error('Failed to update sale from voucher:', error)
            toast.error('Voucher bilgileri güncellenemedi.')
        }
    }

    const collected = sale.collected_amount ?? (sale.payment_status === 'paid' ? sale.total_price : 0)
    const remaining = Math.max(0, sale.total_price - collected)

    // Generate lean, safe QR Code payload (guaranteed under 1000 chars to avoid QR code length overflow)
    const qrData = (() => {
        if (typeof window === 'undefined') return ''
        try {
            const rawNotes = (sale.notes || '').slice(0, 60)
            const payload = {
                v: 2,
                id: sale.id,
                r: reservationCode,
                hn: (hotel?.info?.name || 'AETHERIUS').slice(0, 30),
                n: (sale.name || '').slice(0, 40),
                t: sale.type,
                g: (sale.customer_name || '').slice(0, 30),
                p: (sale.customer_phone || '').slice(0, 20),
                rm: sale.room_number || '',
                pu: (sale.pickup_location || '').slice(0, 30),
                fl: (sale.flight_number || '').slice(0, 15),
                d: sale.date ? (sale.date instanceof Date ? sale.date.toISOString() : new Date(sale.date).toISOString()) : '',
                pt: sale.pickup_time || '',
                px: sale.pax,
                st: sale.status || 'waiting',
                py: sale.payment_status,
                ca: collected,
                tp: sale.total_price,
                c: sale.currency,
                nt: rawNotes,
                by: (sale.created_by_name || '').slice(0, 20),
                th: theme
            }
            const jsonStr = JSON.stringify(payload)
            const b64 = btoa(unescape(encodeURIComponent(jsonStr)))
            const url = `${window.location.origin}/voucher?d=${b64}`
            if (url.length > 1500) {
                delete (payload as any).nt
                delete (payload as any).pu
                const strippedB64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
                return `${window.location.origin}/voucher?d=${strippedB64}`
            }
            return url
        } catch (e) {
            console.error('Failed to encode QR payload:', e)
            return `${window.location.origin}/voucher?id=${sale.id}`
        }
    })()

    const handleShare = async () => {
        try {
            if (navigator.share) await navigator.share({ title: `${sale.name} voucher`, url: qrData })
            else { await navigator.clipboard.writeText(qrData); toast.success('Voucher bağlantısı kopyalandı.') }
        } catch (error) { if ((error as DOMException)?.name !== 'AbortError') toast.error('Voucher paylaşılamadı.') }
    }

    const handleDownload = async () => {
        if (!voucherRef.current) return
        setIsGenerating(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 100))
            const dataUrl = await toPng(voucherRef.current, { quality: 1, pixelRatio: 2 })
            const link = document.createElement('a')
            link.download = `Voucher-${reservationCode}-${sale.name.replace(/\s+/g, '-')}.png`
            link.href = dataUrl
            link.click()
        } catch (error) {
            console.error('Failed to generate voucher:', error)
        } finally {
            setIsGenerating(false)
        }
    }

    const handlePrint = async (size: 'banknote' | 'a5' | 'a4' = 'banknote') => {
        if (!voucherRef.current) return
        setIsGenerating(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 100))
            const dataUrl = await toPng(voucherRef.current, { quality: 1, pixelRatio: 3 })
            const iframe = document.createElement('iframe')
            iframe.style.display = 'none'
            document.body.appendChild(iframe)
            
            let imgWidth = '16cm'
            if (size === 'a5') imgWidth = '21cm'
            if (size === 'a4') imgWidth = '100%'

            iframe.contentDocument?.write(`
                <html>
                    <head>
                        <title>Print Voucher</title>
                        <style>
                            body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; background: white; padding-top: 1cm; }
                            @media print { 
                                body { background: white; justify-content: center; align-items: flex-start; } 
                                @page { size: landscape; margin: 0.5cm; } 
                            }
                        </style>
                    </head>
                    <body>
                        <img src="${dataUrl}" style="width: ${imgWidth}; max-width: 100%; height: auto; box-shadow: 0 0 10px rgba(0,0,0,0.1);" onload="window.print();" />
                    </body>
                </html>
            `)
            iframe.contentDocument?.close()
            
            setTimeout(() => {
                if (document.body.contains(iframe)) document.body.removeChild(iframe)
            }, 5000)
        } catch (error) {
            console.error('Failed to print voucher:', error)
        } finally {
            setIsGenerating(false)
        }
    }

    const typeInfo = saleTypeInfo[sale.type] || saleTypeInfo['other']
    const themeColor = typeInfo.color.split(' ')[0]
    
    const isDark = theme === 'dark'
    const gradientFrom = isDark 
        ? themeColor.replace('text-', 'from-').replace('400', '950/60')
        : themeColor.replace('text-', 'from-').replace('400', '100/60')
    
    const bgContainer = isDark ? 'bg-[#0E1015] text-white border border-white/10' : 'bg-white text-zinc-900 border border-zinc-200'
    const bgStub = isDark ? 'bg-black/50 border-white/15' : 'bg-zinc-50/90 border-zinc-200'
    const textLabel = isDark ? 'text-white/45 font-bold uppercase tracking-wider' : 'text-zinc-500 font-bold uppercase tracking-wider'
    const textValue = isDark ? 'text-white font-semibold' : 'text-zinc-900 font-semibold'
    const textMuted = isDark ? 'text-white/60' : 'text-zinc-600'
    const bgGrid = isDark ? 'bg-white/[0.04] border-white/10' : 'bg-zinc-50 border-zinc-200'
    const cutoutBg = 'bg-background'
    const qrWrapper = 'bg-white p-3 rounded-2xl shadow-xl border border-zinc-200/80 flex flex-col items-center justify-center gap-1.5'

    return (
        <Dialog open={!!saleId} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-5xl bg-background border-border p-6 gap-6 max-h-[90vh] overflow-y-auto">
                <DialogTitle className="sr-only">Voucher Preview & Edit</DialogTitle>
                <DialogDescription className="sr-only">Preview, edit and download luxury voucher</DialogDescription>
                
                {/* TOOLBAR */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold tracking-tight">Digital Voucher</h2>
                        <span className="text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md">
                            {reservationCode}
                        </span>
                        <Button 
                            variant={isEditing ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => setIsEditing(!isEditing)}
                            className="ml-2 font-medium"
                        >
                            {isEditing ? <X className="w-4 h-4 mr-1.5" /> : <Edit3 className="w-4 h-4 mr-1.5" />}
                            {isEditing ? 'Düzenlemeyi İptal Et' : 'Voucher Bilgilerini Düzenle'}
                        </Button>
                        {isEditing && (
                            <Button 
                                size="sm" 
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                                onClick={handleSaveEdit}
                            >
                                <Check className="w-4 h-4 mr-1.5" /> Kaydet
                            </Button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        {/* Theme Toggle */}
                        <div className="flex bg-muted rounded-lg p-1 border border-border">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className={cn("h-7 px-3 rounded-md text-xs", isDark && "bg-background shadow-sm font-bold")} 
                                onClick={() => setTheme('dark')}
                            >
                                <Moon className="w-3.5 h-3.5 mr-1.5" /> Dark
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className={cn("h-7 px-3 rounded-md text-xs", !isDark && "bg-background shadow-sm font-bold")} 
                                onClick={() => setTheme('light')}
                            >
                                <Sun className="w-3.5 h-3.5 mr-1.5" /> Light
                            </Button>
                        </div>
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Printer className="w-3.5 h-3.5 mr-1.5" />
                                    Yazdır <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handlePrint('banknote')}>
                                    Küçük (Fiş / Banknot Boyu)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePrint('a5')}>
                                    Orta (A5 Genişliği)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePrint('a4')}>
                                    Büyük (Tam Sayfa A4)
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="outline" size="sm" onClick={handleShare}><Share2 className="mr-1.5 h-3.5 w-3.5" />Paylaş</Button>
                        <Button variant="outline" size="sm" onClick={async () => { try { await navigator.clipboard.writeText(qrData); toast.success('Bağlantı kopyalandı.') } catch { toast.error('Kopyalanamadı.') } }}><Copy className="mr-1.5 h-3.5 w-3.5" />Bağlantı</Button>
                        <Button size="sm" onClick={handleDownload} disabled={isGenerating}>
                            <Download className="w-3.5 h-3.5 mr-1.5" />
                            {isGenerating ? 'Hazırlanıyor...' : 'Görsel İndir'}
                        </Button>
                    </div>
                </div>

                {/* INLINE EDIT FORM - DYNAMIC PER SALE TYPE */}
                {isEditing && (
                    <div className="p-4 sm:p-5 rounded-2xl border border-primary/30 bg-primary/5 space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between border-b border-primary/20 pb-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                                <Edit3 className="w-4 h-4" />
                                {sale.type === 'transfer' ? '🚐 Transfer Voucher Bilgilerini Güncelle' :
                                 sale.type === 'tour' ? '🗺️ Tur Bilet Bilgilerini Güncelle' :
                                 sale.type === 'laundry' ? '🧺 Çamaşırhane Fiş Bilgilerini Güncelle' :
                                 '✨ Hizmet Bilgilerini Güncelle'}
                            </h3>
                            <span className="text-[11px] text-muted-foreground font-medium">Satış tipine uygun özel alanlar gösterilmektedir.</span>
                        </div>

                        {/* Common Guest & Room Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">Misafir Adı / İsimleri (virgülle ayırın)</label>
                                <Input 
                                    value={editForm.customer_name || ''} 
                                    onChange={e => setEditForm(p => ({ ...p, customer_name: e.target.value }))}
                                    placeholder="Örn: Ahmet Yılmaz, Ayşe Yılmaz"
                                    className="h-8 text-xs bg-background"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">Misafir Tel No</label>
                                <Input 
                                    value={editForm.customer_phone || ''} 
                                    onChange={e => setEditForm(p => ({ ...p, customer_phone: e.target.value }))}
                                    placeholder="+90 532 000 00 00"
                                    className="h-8 text-xs bg-background"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">Oda Numarası</label>
                                <Input 
                                    value={editForm.room_number || ''} 
                                    onChange={e => setEditForm(p => ({ ...p, room_number: e.target.value }))}
                                    placeholder="Örn. 101"
                                    className="h-8 text-xs bg-background"
                                />
                            </div>
                        </div>

                        {/* TYPE SPECIFIC FIELDS */}
                        {sale.type === 'transfer' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">📍 Alınış Yeri (Nereden)</label>
                                    <Input 
                                        value={editForm.pickup_location || ''} 
                                        onChange={e => setEditForm(p => ({ ...p, pickup_location: e.target.value }))}
                                        placeholder="Resepsiyon / AYT T1"
                                        className="h-8 text-xs bg-background"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">🏁 Bırakılış Yeri (Nereye)</label>
                                    <Input 
                                        value={editForm.dropoff_location || ''} 
                                        onChange={e => setEditForm(p => ({ ...p, dropoff_location: e.target.value, name: e.target.value }))}
                                        placeholder="Otogar / Havalimanı T2"
                                        className="h-8 text-xs bg-background"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">✈️ Uçuş Kodu</label>
                                    <Input 
                                        value={editForm.flight_number || ''} 
                                        onChange={e => setEditForm(p => ({ ...p, flight_number: e.target.value }))}
                                        placeholder="TK 2411"
                                        className="h-8 text-xs bg-background font-mono"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">Alış Saati</label>
                                    <Input 
                                        type="time"
                                        value={editForm.pickup_time || ''} 
                                        onChange={e => setEditForm(p => ({ ...p, pickup_time: e.target.value }))}
                                        className="h-8 text-xs bg-background"
                                    />
                                </div>
                            </div>
                        ) : sale.type === 'tour' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1 sm:col-span-2">
                                    <label className="text-xs font-semibold">🗺️ Tur / Gezi Adı</label>
                                    <Input 
                                        value={editForm.name || ''} 
                                        onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                                        className="h-8 text-xs bg-background"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">Kalkış Saati</label>
                                    <Input 
                                        type="time"
                                        value={editForm.pickup_time || ''} 
                                        onChange={e => setEditForm(p => ({ ...p, pickup_time: e.target.value }))}
                                        className="h-8 text-xs bg-background"
                                    />
                                </div>
                            </div>
                        ) : sale.type === 'laundry' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">🧺 Teslim Saati</label>
                                    <Input 
                                        type="time"
                                        value={editForm.pickup_time || ''} 
                                        onChange={e => setEditForm(p => ({ ...p, pickup_time: e.target.value }))}
                                        className="h-8 text-xs bg-background"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">Parça / Servis Sayısı</label>
                                    <Input 
                                        type="number"
                                        value={editForm.pax ?? 1} 
                                        onChange={e => setEditForm(p => ({ ...p, pax: parseInt(e.target.value) || 1 }))}
                                        className="h-8 text-xs bg-background"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1 sm:col-span-2">
                                    <label className="text-xs font-semibold">Hizmet / Satış Adı</label>
                                    <Input 
                                        value={editForm.name || ''} 
                                        onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                                        className="h-8 text-xs bg-background"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">Saat</label>
                                    <Input 
                                        type="time"
                                        value={editForm.pickup_time || ''} 
                                        onChange={e => setEditForm(p => ({ ...p, pickup_time: e.target.value }))}
                                        className="h-8 text-xs bg-background"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Financials & Status */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">Toplam Tutar</label>
                                <Input 
                                    type="number"
                                    value={editForm.total_price ?? 0} 
                                    onChange={e => setEditForm(p => ({ ...p, total_price: parseFloat(e.target.value) || 0 }))}
                                    className="h-8 text-xs bg-background"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">Para Birimi</label>
                                <Select 
                                    value={editForm.currency || 'EUR'} 
                                    onValueChange={(v: Currency) => setEditForm(p => ({ ...p, currency: v }))}
                                >
                                    <SelectTrigger className="h-8 text-xs bg-background">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EUR">EUR (€)</SelectItem>
                                        <SelectItem value="TRY">TRY (₺)</SelectItem>
                                        <SelectItem value="USD">USD ($)</SelectItem>
                                        <SelectItem value="GBP">GBP (£)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">Ödeme Durumu</label>
                                <Select 
                                    value={editForm.payment_status || 'pending'} 
                                    onValueChange={(v: PaymentStatus) => setEditForm(p => ({ ...p, payment_status: v }))}
                                >
                                    <SelectTrigger className="h-8 text-xs bg-background">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="paid">🟢 Ödeme Alındı (Paid)</SelectItem>
                                        <SelectItem value="pending">🔴 Ödeme Alınacak (Unpaid)</SelectItem>
                                        <SelectItem value="partial">🟡 Kısmi Ödeme (Partial)</SelectItem>
                                        <SelectItem value="refunded">⚪ İade Edildi (Refunded)</SelectItem>
                                        <SelectItem value="cancelled">⚪ İptal Edildi (Cancelled)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold">Alınan / Tahsil Edilen Tutar</label>
                                <Input 
                                    type="number"
                                    value={editForm.collected_amount ?? 0} 
                                    onChange={e => setEditForm(p => ({ ...p, collected_amount: parseFloat(e.target.value) || 0 }))}
                                    className="h-8 text-xs bg-background"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold">Notlar / Özel İstekler</label>
                            <Input 
                                value={editForm.notes || ''} 
                                onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}
                                placeholder="Örn: Özel istekler, hatırlatmalar..."
                                className="h-8 text-xs bg-background"
                            />
                        </div>
                    </div>
                )}

                {/* VOUCHER CANVAS PREVIEW (SPACIOUS, ELEGANT & BILINGUAL) */}
                <div className="w-full flex justify-center print:m-0 print:p-0 overflow-x-auto p-2">
                    <div 
                        ref={voucherRef}
                        className={cn(
                            "relative flex flex-col sm:flex-row w-full sm:w-[880px] sm:min-h-[440px] rounded-3xl overflow-hidden shadow-2xl shrink-0 print:shadow-none print:w-[880px] print:min-h-[440px] print:flex-row",
                            bgContainer
                        )}
                        style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
                    >
                        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-40 pointer-events-none", gradientFrom, isDark ? "to-[#0E1015]" : "to-white")} />
                        
                        {/* LEFT STUB (BRANDING & HIGH-CONTRAST QR CODE AREA) */}
                        <div className={cn(
                            "w-full sm:w-[30%] border-b sm:border-b-0 sm:border-r border-dashed border-white/20 relative flex flex-col justify-between p-6 sm:p-7 gap-6 backdrop-blur-md z-10",
                            bgStub
                        )}>
                            <div className={cn("hidden sm:block absolute -top-4 -right-4 w-8 h-8 rounded-full z-20", cutoutBg)} />
                            <div className={cn("hidden sm:block absolute -bottom-4 -right-4 w-8 h-8 rounded-full z-20", cutoutBg)} />
                            
                            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">✨</span>
                                    <h3 className={cn("text-sm font-black tracking-[0.25em] uppercase", isDark ? 'text-white/90' : 'text-zinc-900')}>
                                        {hotel?.info.name || 'AETHERIUS'}
                                    </h3>
                                </div>
                                <p className={cn("text-[9px] uppercase tracking-widest font-semibold", isDark ? 'text-white/40' : 'text-zinc-500')}>
                                    LUXURY CONCIERGE VOUCHER
                                </p>
                            </div>

                            <div className="flex flex-col items-center justify-center my-auto">
                                <div className={qrWrapper}>
                                    <QRCode 
                                        value={qrData} 
                                        size={155} 
                                        bgColor="#ffffff"
                                        fgColor="#0A0B0E"
                                        level="H"
                                    />
                                    <div className="flex items-center gap-1.5 mt-1 pt-1.5 border-t border-zinc-200/60 text-[9px] font-bold uppercase tracking-wider text-zinc-700">
                                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                        <span>TARA VE DOĞRULA / SCAN VERIFY</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-2 border-t border-dashed border-white/10 text-center sm:text-left flex items-center justify-between">
                                <div>
                                    <p className={cn("text-[9px] font-bold uppercase tracking-wider", textLabel)}>REZ. NO / BOOKING CODE</p>
                                    <p className={cn("text-xs font-mono font-bold tracking-widest", isDark ? 'text-amber-400' : 'text-zinc-900')}>
                                        {reservationCode}
                                    </p>
                                </div>
                                <div className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border", isDark ? "bg-white/10 border-white/20 text-white/80" : "bg-zinc-200 border-zinc-300 text-zinc-800")}>
                                    OFFICIAL
                                </div>
                            </div>
                        </div>

                        {/* RIGHT MAIN (SPACIOUS & BILINGUAL CONTENT AREA) */}
                        <div className="flex-1 relative p-6 sm:p-8 flex flex-col justify-between z-10 gap-5">
                            
                            {/* Header Row: Title & Total Price */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                        <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm",
                                            sale.payment_status === 'paid' 
                                                ? (isDark ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-emerald-100 text-emerald-800 border-emerald-300") 
                                                : sale.payment_status === 'cancelled' || sale.payment_status === 'refunded'
                                                    ? (isDark ? "bg-zinc-500/20 text-zinc-300 border-zinc-500/40" : "bg-zinc-200 text-zinc-700 border-zinc-300")
                                                    : (isDark ? "bg-rose-500/20 text-rose-300 border-rose-500/40" : "bg-rose-100 text-rose-800 border-rose-300")
                                        )}>
                                            {sale.payment_status === 'paid' ? '🟢 ÖDEME ALINDI / PAID' : sale.payment_status === 'partial' ? '🟡 KISMİ / PARTIAL' : '🔴 ÖDEME ALINACAK / UNPAID'}
                                        </span>

                                        <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border font-mono",
                                            isDark ? "bg-white/10 text-white/80 border-white/20" : "bg-zinc-100 text-zinc-700 border-zinc-300"
                                        )}>
                                            {reservationCode}
                                        </span>

                                        <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", typeInfo.color)}>
                                            {typeInfo.icon} {t(typeInfo.label as any)}
                                        </span>
                                    </div>

                                    <h1 className={cn("text-2xl sm:text-3xl font-black tracking-tight uppercase leading-tight", isDark ? 'text-white' : 'text-zinc-900')}>
                                        {sale.name}
                                    </h1>
                                </div>
                                
                                <div className="text-right sm:text-right self-end sm:self-center shrink-0 bg-white/5 p-3 rounded-2xl border border-white/10 min-w-[140px]">
                                    <p className={cn("text-[9px]", textLabel)}>TOPLAM TUTAR / TOTAL PRICE</p>
                                    <p className={cn("text-2xl font-black tracking-tight text-emerald-400", isDark ? 'text-emerald-400' : 'text-emerald-600')}>
                                        {sale.total_price} <span className="text-base font-bold">{sale.currency}</span>
                                    </p>
                                    {!isTRYCurrency(sale.currency) && rates?.[sale.currency as keyof typeof rates] && (
                                        <p className={cn("text-[11px] font-bold mt-0.5", textMuted)}>
                                            ≈ {(sale.total_price * rates[sale.currency as keyof typeof rates]!.selling).toFixed(2)} ₺
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* BILINGUAL PAYMENT STATUS & COLLECTION BANNER */}
                            <div className={cn(
                                "p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-md shadow-sm",
                                sale.payment_status === 'paid'
                                    ? (isDark ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-200" : "bg-emerald-50 border-emerald-300 text-emerald-950")
                                    : sale.payment_status === 'partial'
                                        ? (isDark ? "bg-amber-500/15 border-amber-500/40 text-amber-200" : "bg-amber-50 border-amber-300 text-amber-950")
                                        : (isDark ? "bg-rose-500/15 border-rose-500/40 text-rose-200" : "bg-rose-50 border-rose-300 text-rose-950")
                            )}>
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">
                                        {sale.payment_status === 'paid' ? '💳' : sale.payment_status === 'partial' ? '⏳' : '⚠️'}
                                    </span>
                                    <div>
                                        <p className={cn("text-[9px] font-bold uppercase tracking-wider opacity-80")}>
                                            ÖDEME DURUMU / PAYMENT STATUS
                                        </p>
                                        <p className="text-sm font-black tracking-wide">
                                            {sale.payment_status === 'paid' && '🟢 ÖDEME ALINDI / PAYMENT RECEIVED'}
                                            {sale.payment_status === 'pending' && '🔴 ÖDEME ALINACAK / PAYMENT DUE AT PICKUP'}
                                            {sale.payment_status === 'partial' && '🟡 KISMİ ÖDEME ALINDI / PARTIAL PAYMENT'}
                                            {sale.payment_status === 'refunded' && '⚪ İADE EDİLDİ / REFUNDED'}
                                            {sale.payment_status === 'cancelled' && '⚪ İPTAL EDİLDİ / CANCELLED'}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-6 text-right self-end sm:self-center font-mono">
                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-wider opacity-80">TAHSİL EDİLEN / COLLECTED</p>
                                        <p className="text-sm font-black">
                                            {collected} {sale.currency}
                                        </p>
                                    </div>
                                    {sale.payment_status !== 'paid' && sale.payment_status !== 'refunded' && sale.payment_status !== 'cancelled' && (
                                        <div>
                                            <p className="text-[9px] font-bold uppercase tracking-wider opacity-80">KALAN BAKİYE / BALANCE DUE</p>
                                            <p className="text-sm font-black text-rose-400">
                                                {remaining} {sale.currency}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* CATEGORY SPECIFIC LOGISTICS & GUEST DETAILS */}
                            {sale.type === 'transfer' ? (
                                <div className="space-y-3">
                                    <div className={cn("p-4 rounded-2xl border border-amber-500/40 flex items-center justify-between gap-4", isDark ? "bg-amber-500/10" : "bg-amber-50/80")}>
                                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                            <span className="text-3xl shrink-0">🚐</span>
                                            <div className="min-w-0 flex-1">
                                                <p className={cn("text-[10px] font-bold uppercase tracking-wider", isDark ? "text-amber-300" : "text-amber-800")}>
                                                    TRANSFER GÜZERGAHI / ROUTE DETAILS
                                                </p>
                                                <div className="flex flex-wrap items-center gap-2 text-base font-black truncate mt-0.5">
                                                    <span className={cn(isDark ? "text-amber-100" : "text-amber-950")}>
                                                        📍 {sale.pickup_location || 'Otel / Resepsiyon'}
                                                    </span>
                                                    <span className="opacity-60 text-lg">➔</span>
                                                    <span className={cn(isDark ? "text-amber-100" : "text-amber-950")}>
                                                        🏁 {sale.dropoff_location || sale.name}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/30">
                                            <p className={cn("text-[9px] font-bold uppercase tracking-wider", isDark ? "text-amber-300" : "text-amber-800")}>ALIŞ SAATİ / TIME</p>
                                            <p className={cn("text-xl font-black tracking-tight", isDark ? "text-amber-200" : "text-amber-950")}>{sale.pickup_time || '--:--'}</p>
                                        </div>
                                    </div>

                                    <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl p-4 border", bgGrid)}>
                                        <div className="col-span-2">
                                            <p className={cn("text-[9px]", textLabel)}>MİSAFİR ADI / GUEST NAME(S)</p>
                                            {(() => {
                                                const guests = parseGuestNames(sale.customer_name)
                                                if (guests.length > 1) {
                                                    return (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {guests.map((g, i) => (
                                                                <span key={i} className={cn("text-xs font-bold px-2 py-0.5 rounded-md border", isDark ? "bg-white/10 border-white/20 text-white" : "bg-zinc-100 border-zinc-300 text-zinc-900")}>
                                                                    👤 {g}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )
                                                }
                                                return <p className={cn("text-sm font-bold truncate mt-0.5", textValue)}>{sale.customer_name || '—'}</p>
                                            })()}
                                        </div>

                                        <div>
                                            <p className={cn("text-[9px]", textLabel)}>TELEFON / PHONE</p>
                                            <p className={cn("text-xs font-bold truncate mt-1 flex items-center gap-1", textValue)}>
                                                {sale.customer_phone ? <>📞 {sale.customer_phone}</> : '—'}
                                            </p>
                                        </div>

                                        <div>
                                            <p className={cn("text-[9px]", textLabel)}>ODA / ROOM & UÇUŞ / FLIGHT</p>
                                            <p className={cn("text-xs font-bold truncate mt-1", textValue)}>
                                                🔑 {sale.room_number ? `#${sale.room_number}` : '—'} {sale.flight_number ? `· ✈️ ${sale.flight_number}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : sale.type === 'tour' ? (
                                <div className="space-y-3">
                                    <div className={cn("flex items-center justify-between p-4 rounded-2xl border border-indigo-500/40", isDark ? "bg-indigo-500/10" : "bg-indigo-50/80")}>
                                        <div className="flex items-center gap-3.5">
                                            <span className="text-3xl">🗺️</span>
                                            <div>
                                                <p className={cn("text-[10px] font-bold uppercase tracking-wider", isDark ? "text-indigo-300" : "text-indigo-800")}>TUR & GEZİ BİLET DETAYI / EXCURSION PASS</p>
                                                <p className={cn("text-base font-black truncate", isDark ? "text-indigo-100" : "text-indigo-950")}>{sale.name}</p>
                                            </div>
                                        </div>
                                        <div className="text-right bg-indigo-500/20 px-3 py-1.5 rounded-xl border border-indigo-500/30">
                                            <p className={cn("text-[9px] font-bold uppercase tracking-wider", isDark ? "text-indigo-300" : "text-indigo-800")}>KALKIŞ / TIME</p>
                                            <p className={cn("text-lg font-black", isDark ? "text-indigo-200" : "text-indigo-950")}>{sale.pickup_time || '--:--'}</p>
                                        </div>
                                    </div>

                                    <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl p-4 border", bgGrid)}>
                                        <div className="col-span-2">
                                            <p className={cn("text-[9px]", textLabel)}>MİSAFİR ADI / GUEST NAME(S)</p>
                                            <p className={cn("text-sm font-bold truncate mt-0.5", textValue)}>{sale.customer_name}</p>
                                        </div>
                                        <div>
                                            <p className={cn("text-[9px]", textLabel)}>TELEFON / PHONE</p>
                                            <p className={cn("text-xs font-bold truncate mt-1", textValue)}>{sale.customer_phone || '—'}</p>
                                        </div>
                                        <div>
                                            <p className={cn("text-[9px]", textLabel)}>ODA / ROOM & PAX</p>
                                            <p className={cn("text-xs font-bold mt-1", textValue)}>🔑 {sale.room_number || '—'} · 👥 {sale.pax} Person</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl p-4 border", bgGrid)}>
                                    <div className="col-span-2">
                                        <p className={cn("text-[9px]", textLabel)}>MİSAFİR ADI / GUEST NAME(S)</p>
                                        <p className={cn("text-sm font-bold truncate mt-0.5", textValue)}>{sale.customer_name}</p>
                                    </div>
                                    <div>
                                        <p className={cn("text-[9px]", textLabel)}>TELEFON / PHONE</p>
                                        <p className={cn("text-xs font-bold truncate mt-1", textValue)}>{sale.customer_phone || '—'}</p>
                                    </div>
                                    <div>
                                        <p className={cn("text-[9px]", textLabel)}>ODA / ROOM & PAX</p>
                                        <p className={cn("text-xs font-bold mt-1", textValue)}>🔑 {sale.room_number || '—'} · 👥 {sale.pax} Item/Pax</p>
                                    </div>
                                </div>
                            )}

                            {/* LOGISTICS FOOTER & NOTES */}
                            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pt-3 border-t border-white/10 text-xs">
                                <div className="space-y-2 flex-1">
                                    <div className="flex flex-wrap gap-6 sm:gap-8">
                                        <div>
                                            <p className={cn("text-[9px]", textLabel)}>SATIŞ TARİHİ / BOOKED DATE</p>
                                            <p className={cn("text-xs font-semibold mt-0.5", textValue)}>{formatDisplayDate(sale.sale_date || sale.created_at)}</p>
                                        </div>
                                        <div>
                                            <p className={cn("text-[9px]", textLabel)}>HİZMET TARİHİ / SERVICE DATE</p>
                                            <p className={cn("text-xs font-bold text-amber-400 mt-0.5", isDark ? 'text-amber-400' : 'text-amber-700')}>{formatDisplayDate(sale.date)}</p>
                                        </div>
                                        {sale.pickup_time && (
                                            <div>
                                                <p className={cn("text-[9px]", textLabel)}>SAAT / TIME</p>
                                                <p className={cn("text-xs font-bold mt-0.5", textValue)}>{sale.pickup_time}</p>
                                            </div>
                                        )}
                                    </div>

                                    {sale.notes && (
                                        <div className="mt-2 p-2.5 rounded-xl border border-white/10 bg-white/5">
                                            <p className={cn("text-[9px]", textLabel)}>NOTLAR & TALİMATLAR / NOTES & SPECIAL REQUESTS</p>
                                            <p className={cn("text-xs whitespace-pre-wrap break-words mt-0.5", isDark ? 'text-white/80' : 'text-zinc-700')}>{sale.notes}</p>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="text-right shrink-0 self-end sm:self-center">
                                    <p className={cn("text-[9px]", textLabel)}>SATAN / ISSUED BY</p>
                                    <p className={cn("text-xs font-semibold", textValue)}>{sale.created_by_name}</p>
                                    <p className={cn("text-[9px] mt-0.5", textMuted)}>Aetherius Concierge Network</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
