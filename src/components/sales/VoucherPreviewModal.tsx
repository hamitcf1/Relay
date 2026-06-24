import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import QRCode from 'react-qr-code'
import { Download, Printer } from 'lucide-react'

import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

import { useSalesStore, saleTypeInfo, saleStatusInfo } from '@/stores/salesStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'
import { cn, formatDisplayDate } from '@/lib/utils'

interface VoucherPreviewModalProps {
    saleId: string | null
    onClose: () => void
}

export function VoucherPreviewModal({ saleId, onClose }: VoucherPreviewModalProps) {
    const { hotel } = useHotelStore()
    const { t } = useLanguageStore()
    const { sales } = useSalesStore()

    const voucherRef = useRef<HTMLDivElement>(null)
    const [isGenerating, setIsGenerating] = useState(false)

    const sale = sales.find(s => s.id === saleId)

    if (!sale) return null

    // Generate QR Code payload (compact to fit in URL query param)
    const compactData = {
        id: sale.id,
        hotelName: hotel?.info.name || 'AETHERIUS',
        name: sale.name,
        type: sale.type,
        guest: sale.customer_name,
        room: sale.room_number,
        date: sale.date, // ISO string
        pickup_time: sale.pickup_time || '',
        pax: sale.pax,
        status: sale.status || 'waiting',
        payment: sale.payment_status,
        total: `${sale.total_price} ${sale.currency}`,
        notes: sale.notes || '',
        by: sale.created_by_name || ''
    }
    
    // Create a URL for the QR code to point to the Public Voucher Page
    const b64Data = typeof window !== 'undefined' ? btoa(encodeURIComponent(JSON.stringify(compactData))) : ''
    const qrData = `${window.location.origin}/voucher?d=${b64Data}`

    const handleDownload = async () => {
        if (!voucherRef.current) return
        
        setIsGenerating(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 100))
            const dataUrl = await toPng(voucherRef.current, { quality: 1, pixelRatio: 2 })
            const link = document.createElement('a')
            link.download = `Voucher-${sale.room_number}-${sale.name.replace(/\s+/g, '-')}.png`
            link.href = dataUrl
            link.click()
        } catch (error) {
            console.error('Failed to generate voucher:', error)
        } finally {
            setIsGenerating(false)
        }
    }

    const handlePrint = async () => {
        if (!voucherRef.current) return
        
        setIsGenerating(true)
        try {
            // Give a little time for fonts/images to be fully ready
            await new Promise(resolve => setTimeout(resolve, 100))
            
            const dataUrl = await toPng(voucherRef.current, { quality: 1, pixelRatio: 3 })
            
            // Create a hidden iframe to handle printing without popup blockers
            const iframe = document.createElement('iframe')
            iframe.style.display = 'none'
            document.body.appendChild(iframe)
            
            iframe.contentDocument?.write(`
                <html>
                    <head>
                        <title>Print Voucher</title>
                        <style>
                            body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: white; }
                            @media print { 
                                body { background: white; } 
                                @page { size: landscape; margin: 0; } 
                            }
                        </style>
                    </head>
                    <body>
                        <img src="${dataUrl}" style="max-width: 100%; height: auto;" onload="window.print();" />
                    </body>
                </html>
            `)
            iframe.contentDocument?.close()
            
            // Cleanup iframe after printing dialog is closed (heuristic 5 seconds)
            setTimeout(() => {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe)
                }
            }, 5000)
            
        } catch (error) {
            console.error('Failed to generate print voucher:', error)
        } finally {
            setIsGenerating(false)
        }
    }

    const themeColor = saleTypeInfo[sale.type].color.split(' ')[0]
    const gradientFrom = themeColor.replace('text-', 'from-').replace('400', '900/40')
    
    return (
        <Dialog open={!!saleId} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-5xl bg-background border-border p-6 gap-6">
                <DialogTitle className="sr-only">Voucher Preview</DialogTitle>
                <DialogDescription className="sr-only">Preview and download voucher</DialogDescription>
                
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Digital Voucher</h2>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={handlePrint}>
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                        </Button>
                        <Button onClick={handleDownload} disabled={isGenerating}>
                            <Download className="w-4 h-4 mr-2" />
                            {isGenerating ? 'Generating...' : 'Download Image'}
                        </Button>
                    </div>
                </div>

                <div className="flex justify-center bg-muted/30 p-8 rounded-xl overflow-x-auto border border-border/50">
                    <div 
                        ref={voucherRef}
                        className="relative flex w-[850px] h-[380px] bg-[#111318] text-white rounded-2xl overflow-hidden shadow-2xl shrink-0"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                        <div className={cn("absolute inset-0 bg-gradient-to-br to-[#111318] opacity-30", gradientFrom)} />
                        
                        {/* LEFT STUB */}
                        <div className="w-[28%] border-r border-dashed border-white/20 relative flex flex-col justify-between p-6 bg-black/40 backdrop-blur-sm z-10">
                            <div className="absolute -top-4 -right-4 w-8 h-8 bg-muted/30 rounded-full" />
                            <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-muted/30 rounded-full" />
                            
                            <div>
                                <h3 className="text-sm font-bold tracking-widest text-white/50 uppercase mb-4">{hotel?.info.name || 'AETHERIUS'}</h3>
                                <div className="p-3 bg-white rounded-xl inline-block">
                                    <QRCode 
                                        value={qrData} 
                                        size={120} 
                                        bgColor="#ffffff"
                                        fgColor="#000000"
                                        level="L"
                                    />
                                </div>
                            </div>
                            
                            <div className="mt-4">
                                <p className="text-[10px] text-white/40 uppercase tracking-wider">{t('sales.details.ticket')}</p>
                                <p className="text-xs font-mono text-white/80 truncate">{sale.id.split('-')[0]}</p>
                            </div>
                        </div>

                        {/* RIGHT MAIN */}
                        <div className="flex-1 relative p-8 flex flex-col justify-between z-10">
                            
                            {/* Header */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", 
                                            sale.payment_status === 'paid' ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                                        )}>
                                            {sale.payment_status}
                                        </span>
                                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/70")}>
                                            {t(saleStatusInfo[sale.status || 'waiting'].label as any)}
                                        </span>
                                    </div>
                                    <h1 className="text-3xl font-black tracking-tight text-white/90 uppercase">{sale.name}</h1>
                                    <p className="text-sm font-medium text-white/50 uppercase tracking-widest mt-1">
                                        {t(saleTypeInfo[sale.type].label as any)}
                                    </p>
                                </div>
                                
                                <div className="text-right">
                                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">{t('sales.details.total')}</p>
                                    <p className="text-2xl font-black text-white">{sale.total_price} <span className="text-base text-white/60">{sale.currency}</span></p>
                                </div>
                            </div>

                            {/* Middle Grid */}
                            <div className="grid grid-cols-3 gap-6 mt-4 bg-white/5 rounded-xl p-4 border border-white/10">
                                <div>
                                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">{t('tours.book.guestName')}</p>
                                    <p className="text-sm font-bold text-white truncate">{sale.customer_name}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">{t('common.room')}</p>
                                    <p className="text-sm font-bold text-white">{sale.room_number}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">{t('sales.details.pax')}</p>
                                    <p className="text-sm font-bold text-white">{sale.pax}</p>
                                </div>
                            </div>

                            {/* Logistics & Notes */}
                            <div className="flex items-start justify-between mt-4">
                                <div className="space-y-4">
                                    <div className="flex gap-8">
                                        <div>
                                            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">{t('common.date')}</p>
                                            <p className="text-base font-bold text-white">{formatDisplayDate(sale.date)}</p>
                                        </div>
                                        {(sale.pickup_time || sale.type === 'transfer') && (
                                            <div>
                                                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">{t('sales.details.pickup')}</p>
                                                <p className="text-base font-bold text-white">{sale.pickup_time || '--:--'}</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Notes */}
                                    {sale.notes && (
                                        <div>
                                            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">{t('sales.details.notes')}</p>
                                            <p className="text-xs text-white/80 max-w-[400px] line-clamp-2">{sale.notes}</p>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex flex-col items-end justify-end h-full mt-auto text-right gap-4">
                                    <div className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center opacity-50">
                                        <span className="text-xl">{saleTypeInfo[sale.type].icon}</span>
                                    </div>
                                    <p className="text-[9px] text-white/30 uppercase tracking-widest mt-auto">
                                        {t('sales.soldBy', { name: sale.created_by_name })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
