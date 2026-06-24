import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toPng } from 'html-to-image'
import QRCode from 'react-qr-code'
import { Printer, Download, MapPin } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { saleTypeInfo, paymentStatusInfo, saleStatusInfo } from '@/stores/salesStore'
import { cn, formatDisplayDate } from '@/lib/utils'

// Since this is a public page and doesn't load the full store/i18n by default,
// we will rely on English for now or add a mini-translator if needed.
// But for exact consistency with the app, we can use the translation store if it's available.
import { useLanguageStore } from '@/stores/languageStore'

export function VoucherPage() {
    const [searchParams] = useSearchParams()
    const { t } = useLanguageStore()
    
    const [data, setData] = useState<any>(null)
    const [error, setError] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)

    useEffect(() => {
        try {
            const d = searchParams.get('d')
            if (!d) throw new Error("No data")
            const decoded = JSON.parse(decodeURIComponent(atob(d)))
            setData(decoded)
        } catch (e) {
            console.error("Failed to parse voucher data", e)
            setError(true)
        }
    }, [searchParams])

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
                <h1 className="text-2xl font-bold mb-2">Invalid Voucher</h1>
                <p className="text-muted-foreground">The voucher link is broken or malformed.</p>
            </div>
        )
    }

    if (!data) {
        return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>
    }

    // Determine theme colors based on type
    // Fallback to 'other' if type is missing or malformed
    const typeInfo = saleTypeInfo[data.type as keyof typeof saleTypeInfo] || saleTypeInfo['other']
    const themeColor = typeInfo.color.split(' ')[0]
    const gradientFrom = themeColor.replace('text-', 'from-').replace('400', '900/40')

    const qrData = window.location.href

    const handlePrint = () => window.print()

    const handleDownload = async () => {
        const el = document.getElementById('voucher-canvas')
        if (!el) return
        
        setIsGenerating(true)
        try {
            await new Promise(r => setTimeout(r, 100))
            const dataUrl = await toPng(el, { quality: 1, pixelRatio: 2 })
            const link = document.createElement('a')
            link.download = `Voucher-${data.room}-${data.name.replace(/\s+/g, '-')}.png`
            link.href = dataUrl
            link.click()
        } catch (err) {
            console.error(err)
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center py-12 px-4">
            <div className="max-w-[850px] w-full flex justify-between items-center mb-8 print:hidden">
                <h1 className="text-2xl font-bold">Digital Voucher</h1>
                <div className="flex gap-3">
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

            {/* Voucher Canvas Container */}
            <div className="w-full flex justify-center print:m-0 print:p-0">
                <div 
                    id="voucher-canvas"
                    className="relative flex w-[850px] h-[380px] bg-[#111318] text-white rounded-2xl overflow-hidden shadow-2xl shrink-0 print:shadow-none"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                >
                    <div className={cn("absolute inset-0 bg-gradient-to-br to-[#111318] opacity-30", gradientFrom)} />
                    
                    {/* LEFT STUB */}
                    <div className="w-[28%] border-r border-dashed border-white/20 relative flex flex-col justify-between p-6 bg-black/40 backdrop-blur-sm z-10">
                        <div className="absolute -top-4 -right-4 w-8 h-8 bg-background print:bg-white rounded-full" />
                        <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-background print:bg-white rounded-full" />
                        
                        <div>
                            <h3 className="text-sm font-bold tracking-widest text-white/50 uppercase mb-4">{data.hotelName || 'AETHERIUS'}</h3>
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
                            <p className="text-xs font-mono text-white/80 truncate">{data.id?.split('-')[0]}</p>
                        </div>
                    </div>

                    {/* RIGHT MAIN */}
                    <div className="flex-1 relative p-8 flex flex-col justify-between z-10">
                        {/* Header */}
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", 
                                        data.payment === 'paid' ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                                    )}>
                                        {data.payment}
                                    </span>
                                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/70")}>
                                        {t(saleStatusInfo[(data.status as any) || 'waiting']?.label as any) || data.status}
                                    </span>
                                </div>
                                <h1 className="text-3xl font-black tracking-tight text-white/90 uppercase">{data.name}</h1>
                                <p className="text-sm font-medium text-white/50 uppercase tracking-widest mt-1">
                                    {t(typeInfo.label as any)}
                                </p>
                            </div>
                            
                            <div className="text-right">
                                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">{t('sales.details.total')}</p>
                                <p className="text-2xl font-black text-white">{data.total}</p>
                            </div>
                        </div>

                        {/* Middle Grid */}
                        <div className="grid grid-cols-3 gap-6 mt-4 bg-white/5 rounded-xl p-4 border border-white/10">
                            <div>
                                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">{t('tours.book.guestName')}</p>
                                <p className="text-sm font-bold text-white truncate">{data.guest}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">{t('common.room')}</p>
                                <p className="text-sm font-bold text-white">{data.room}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">{t('sales.details.pax')}</p>
                                <p className="text-sm font-bold text-white">{data.pax}</p>
                            </div>
                        </div>

                        {/* Logistics & Notes */}
                        <div className="flex items-start justify-between mt-4">
                            <div className="space-y-4">
                                <div className="flex gap-8">
                                    <div>
                                        <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">{t('common.date')}</p>
                                        <p className="text-base font-bold text-white">{formatDisplayDate(new Date(data.date))}</p>
                                    </div>
                                    {(data.pickup_time || data.type === 'transfer') && (
                                        <div>
                                            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">{t('sales.details.pickup')}</p>
                                            <p className="text-base font-bold text-white">{data.pickup_time || '--:--'}</p>
                                        </div>
                                    )}
                                </div>
                                
                                {data.notes && (
                                    <div>
                                        <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">{t('sales.details.notes')}</p>
                                        <p className="text-xs text-white/80 max-w-[400px] line-clamp-2">{data.notes}</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex flex-col items-end justify-end h-full mt-auto text-right gap-4">
                                <div className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center opacity-50">
                                    <span className="text-xl">{typeInfo.icon}</span>
                                </div>
                                {data.by && (
                                    <p className="text-[9px] text-white/30 uppercase tracking-widest mt-auto">
                                        {t('sales.soldBy', { name: data.by })}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { size: landscape; margin: 0; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
                    #voucher-canvas { transform: scale(0.9); transform-origin: top center; margin-top: 1cm; }
                }
            `}</style>
        </div>
    )
}
