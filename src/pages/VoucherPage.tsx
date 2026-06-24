import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toPng } from 'html-to-image'
import QRCode from 'react-qr-code'
import { Printer, Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { saleTypeInfo, saleStatusInfo } from '@/stores/salesStore'
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
    const typeInfo = saleTypeInfo[data.type as keyof typeof saleTypeInfo] || saleTypeInfo['other']
    const themeColor = typeInfo.color.split(' ')[0]
    
    const isDark = data.th !== 'light' // Default to dark if not provided
    const gradientFrom = isDark 
        ? themeColor.replace('text-', 'from-').replace('400', '900/40')
        : themeColor.replace('text-', 'from-').replace('400', '200/40')

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

    const bgContainer = isDark ? 'bg-[#111318] text-white' : 'bg-white text-zinc-900 border border-zinc-200'
    const bgStub = isDark ? 'bg-black/40 border-white/20' : 'bg-zinc-50 border-zinc-200'
    const textLabel = isDark ? 'text-white/40' : 'text-zinc-500'
    const textValue = isDark ? 'text-white' : 'text-zinc-900'
    const textMuted = isDark ? 'text-white/50' : 'text-zinc-600'
    const bgGrid = isDark ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'
    const cutoutBg = 'bg-background print:bg-white' 
    const qrWrapper = isDark ? 'bg-white' : 'bg-white border border-zinc-200'

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
                    className={cn("relative flex w-[850px] h-[380px] rounded-2xl overflow-hidden shadow-2xl shrink-0 print:shadow-none", bgContainer)}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                >
                    <div className={cn("absolute inset-0 bg-gradient-to-br opacity-30", gradientFrom, isDark ? "to-[#111318]" : "to-white")} />
                    
                    {/* LEFT STUB */}
                    <div className={cn("w-[28%] border-r border-dashed relative flex flex-col justify-between p-6 backdrop-blur-sm z-10", bgStub)}>
                        <div className={cn("absolute -top-4 -right-4 w-8 h-8 rounded-full", cutoutBg)} />
                        <div className={cn("absolute -bottom-4 -right-4 w-8 h-8 rounded-full", cutoutBg)} />
                        
                        <div>
                            <h3 className={cn("text-sm font-bold tracking-widest uppercase mb-4", textMuted)}>{data.hotelName || 'AETHERIUS'}</h3>
                            <div className={cn("p-3 rounded-xl inline-block", qrWrapper)}>
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
                            <p className={cn("text-[10px] uppercase tracking-wider", textLabel)}>{t('sales.details.ticket')}</p>
                            <p className={cn("text-xs font-mono truncate", isDark ? 'text-white/80' : 'text-zinc-700')}>{data.id?.split('-')[0]}</p>
                        </div>
                    </div>

                    {/* RIGHT MAIN */}
                    <div className="flex-1 relative p-8 flex flex-col justify-between z-10">
                        {/* Header */}
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", 
                                        data.payment === 'paid' 
                                            ? (isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-700") 
                                            : (isDark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-700")
                                    )}>
                                        {data.payment}
                                    </span>
                                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                        isDark ? "bg-white/10 text-white/70" : "bg-zinc-200 text-zinc-600"
                                    )}>
                                        {t(saleStatusInfo[(data.status || 'waiting') as keyof typeof saleStatusInfo]?.label as any) || data.status}
                                    </span>
                                </div>
                                <h1 className={cn("text-3xl font-black tracking-tight uppercase", isDark ? 'text-white/90' : 'text-zinc-900')}>{data.name}</h1>
                                <p className={cn("text-sm font-medium uppercase tracking-widest mt-1", textMuted)}>
                                    {t(typeInfo.label as any)}
                                </p>
                            </div>
                            
                            <div className="text-right">
                                <p className={cn("text-[10px] uppercase tracking-wider mb-1", textLabel)}>{t('sales.details.total')}</p>
                                <p className={cn("text-2xl font-black", textValue)}>{data.total}</p>
                            </div>
                        </div>

                        {/* Middle Grid */}
                        <div className={cn("grid grid-cols-3 gap-6 mt-4 rounded-xl p-4 border", bgGrid)}>
                            <div>
                                <p className={cn("text-[10px] uppercase tracking-wider mb-1", textLabel)}>{t('tours.book.guestName')}</p>
                                <p className={cn("text-sm font-bold truncate", textValue)}>{data.guest}</p>
                            </div>
                            <div>
                                <p className={cn("text-[10px] uppercase tracking-wider mb-1", textLabel)}>{t('common.room')}</p>
                                <p className={cn("text-sm font-bold", textValue)}>{data.room}</p>
                            </div>
                            <div>
                                <p className={cn("text-[10px] uppercase tracking-wider mb-1", textLabel)}>{t('sales.details.pax')}</p>
                                <p className={cn("text-sm font-bold", textValue)}>{data.pax}</p>
                            </div>
                        </div>

                        {/* Logistics & Notes */}
                        <div className="flex items-start justify-between mt-4">
                            <div className="space-y-4">
                                <div className="flex gap-8">
                                    <div>
                                        <p className={cn("text-[10px] uppercase tracking-wider mb-1", textLabel)}>{t('common.date')}</p>
                                        <p className={cn("text-base font-bold", textValue)}>{formatDisplayDate(new Date(data.date))}</p>
                                    </div>
                                    {(data.pickup_time || data.type === 'transfer') && (
                                        <div>
                                            <p className={cn("text-[10px] uppercase tracking-wider mb-1", textLabel)}>{t('sales.details.pickup')}</p>
                                            <p className={cn("text-base font-bold", textValue)}>{data.pickup_time || '--:--'}</p>
                                        </div>
                                    )}
                                </div>
                                
                                {data.notes && (
                                    <div>
                                        <p className={cn("text-[10px] uppercase tracking-wider mb-1", textLabel)}>{t('sales.details.notes')}</p>
                                        <p className={cn("text-xs max-w-[400px] line-clamp-2", isDark ? 'text-white/80' : 'text-zinc-600')}>{data.notes}</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex flex-col items-end justify-end h-full mt-auto text-right gap-4">
                                <div className={cn("w-12 h-12 rounded-full border-2 flex items-center justify-center opacity-50", isDark ? 'border-white/20' : 'border-zinc-300')}>
                                    <span className="text-xl">{typeInfo.icon}</span>
                                </div>
                                {data.by && (
                                    <p className={cn("text-[9px] uppercase tracking-widest mt-auto", isDark ? 'text-white/30' : 'text-zinc-400')}>
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
