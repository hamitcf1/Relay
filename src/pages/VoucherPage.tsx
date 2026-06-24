import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toPng } from 'html-to-image'
import QRCode from 'react-qr-code'
import { Printer, Download, Globe } from 'lucide-react'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button'
import { saleTypeInfo, saleStatusInfo } from '@/stores/salesStore'
import { cn, formatDisplayDate } from '@/lib/utils'

// Since this is a public page and doesn't load the full store/i18n by default,
// we will rely on English for now or add a mini-translator if needed.
// But for exact consistency with the app, we can use the translation store if it's available.
import { useLanguageStore } from '@/stores/languageStore'
import { useCurrencyStore } from '@/stores/currencyStore'

export function VoucherPage() {
    const [searchParams] = useSearchParams()
    const { t, language, setLanguage } = useLanguageStore()
    const { rates, fetchRates } = useCurrencyStore()
    
    const [data, setData] = useState<any>(null)
    const [error, setError] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)

    useEffect(() => {
        fetchRates()
    }, [fetchRates])

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
        <div className="min-h-screen bg-background flex flex-col items-center py-6 sm:py-12 px-4 overflow-x-hidden">
            <div className="max-w-[850px] w-full flex flex-col sm:flex-row justify-between items-center mb-8 print:hidden gap-4">
                <h1 className="text-2xl font-bold">Digital Voucher</h1>
                <div className="flex flex-wrap items-center justify-center gap-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" aria-label="Select language" className="shrink-0">
                                <Globe className="w-4 h-4" aria-hidden="true" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setLanguage('en')} className="cursor-pointer">
                                English
                                {language === 'en' && <span className="ml-2 text-primary">✓</span>}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLanguage('tr')} className="cursor-pointer">
                                Türkçe
                                {language === 'tr' && <span className="ml-2 text-primary">✓</span>}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLanguage('ru')} className="cursor-pointer">
                                Русский
                                {language === 'ru' && <span className="ml-2 text-primary">✓</span>}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="outline" onClick={handlePrint} className="shrink-0">
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                    </Button>
                    <Button onClick={handleDownload} disabled={isGenerating} className="shrink-0">
                        <Download className="w-4 h-4 mr-2" />
                        {isGenerating ? 'Generating...' : 'Download Image'}
                    </Button>
                </div>
            </div>

            {/* Voucher Canvas Container */}
            <div className="w-full max-w-[850px] flex justify-center print:m-0 print:p-0">
                <div 
                    id="voucher-canvas"
                    className={cn("relative flex flex-col sm:flex-row w-full sm:w-[850px] sm:h-[380px] rounded-2xl overflow-hidden shadow-2xl shrink-0 print:shadow-none print:w-[850px] print:h-[380px] print:flex-row", bgContainer)}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                >
                    <div className={cn("absolute inset-0 bg-gradient-to-br opacity-30", gradientFrom, isDark ? "to-[#111318]" : "to-white")} />
                    
                    {/* LEFT STUB */}
                    <div className={cn("w-full sm:w-[28%] border-b sm:border-b-0 sm:border-r border-dashed relative flex flex-col sm:justify-between p-6 sm:p-6 gap-6 sm:gap-0 backdrop-blur-sm z-10", bgStub)}>
                        <div className={cn("hidden sm:block absolute -top-4 -right-4 w-8 h-8 rounded-full", cutoutBg)} />
                        <div className={cn("hidden sm:block absolute -bottom-4 -right-4 w-8 h-8 rounded-full", cutoutBg)} />
                        
                        <div className="flex sm:flex-col justify-between items-center sm:items-start">
                            <h3 className={cn("text-sm font-bold tracking-widest uppercase mb-4", textMuted)}>{data.hotelName || 'AETHERIUS'}</h3>
                            <div className={cn("p-3 rounded-xl inline-block", qrWrapper)}>
                                <QRCode 
                                    value={qrData} 
                                    size={160} 
                                    bgColor="#ffffff"
                                    fgColor="#000000"
                                    level="L"
                                />
                            </div>
                        </div>
                        
                        <div className="mt-0 sm:mt-4 text-center sm:text-left">
                            <p className={cn("text-[10px] uppercase tracking-wider", textLabel)}>{t('sales.details.ticket')}</p>
                            <p className={cn("text-xs font-mono truncate", isDark ? 'text-white/80' : 'text-zinc-700')}>{data.id?.split('-')[0]}</p>
                        </div>
                    </div>

                    {/* RIGHT MAIN */}
                    <div className="flex-1 relative p-6 sm:p-8 flex flex-col justify-between z-10 gap-6 sm:gap-0">
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
                                {(() => {
                                    if (!data.total) return null;
                                    const [amountStr, currency] = data.total.split(' ');
                                    const amount = parseFloat(amountStr);
                                    if (currency && currency !== 'TRY' && rates?.[currency as keyof typeof rates]) {
                                        return (
                                            <p className={cn("text-xs mt-1 font-medium", textMuted)}>
                                                ≈ {(amount * rates[currency as keyof typeof rates].selling).toFixed(2)} ₺
                                            </p>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        </div>

                        {/* Middle Grid */}
                        <div className={cn("grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 mt-0 sm:mt-4 rounded-xl p-4 border", bgGrid)}>
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
                        <div className="flex flex-col sm:flex-row items-start justify-between mt-0 sm:mt-4 gap-4 sm:gap-0">
                            <div className="space-y-4 w-full sm:w-auto">
                                <div className="flex gap-6 sm:gap-8">
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
