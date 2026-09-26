import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toPng } from 'html-to-image'
import QRCode from 'react-qr-code'
import { Printer, Download, Globe, Share2, ShieldCheck } from 'lucide-react'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button'
import { saleTypeInfo } from '@/stores/salesStore'
import { cn, formatDisplayDate, parseGuestNames, isTRYCurrency } from '@/lib/utils'

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

            let rawJson = ''
            try {
                rawJson = decodeURIComponent(escape(atob(d)))
            } catch {
                rawJson = decodeURIComponent(atob(d))
            }

            const decoded = JSON.parse(rawJson)

            // Map compact v2 keys to full properties with fallbacks to legacy keys
            const mappedData = {
                ...decoded,
                id: decoded.id || '',
                reservation_code: decoded.r || decoded.reservation_code || '',
                hotelName: decoded.hn || decoded.hotelName || 'AETHERIUS',
                name: decoded.n || decoded.name || 'Service',
                type: decoded.t || decoded.type || 'other',
                customer_name: decoded.g || decoded.customer_name || decoded.guest || '',
                customer_phone: decoded.p || decoded.customer_phone || decoded.phone || '',
                room_number: decoded.rm || decoded.room_number || decoded.room || '',
                pickup_location: decoded.pu || decoded.pickup_location || '',
                flight_number: decoded.fl || decoded.flight_number || '',
                date: decoded.d || decoded.date || new Date().toISOString(),
                pickup_time: decoded.pt || decoded.pickup_time || '',
                pax: decoded.px ?? decoded.pax ?? 1,
                status: decoded.st || decoded.status || 'waiting',
                payment: decoded.py || decoded.payment || decoded.payment_status || 'pending',
                collected_amount: decoded.ca ?? decoded.collected_amount ?? 0,
                total_price: decoded.tp ?? decoded.total_price ?? 0,
                currency: decoded.c || decoded.currency || 'EUR',
                notes: decoded.nt || decoded.notes || '',
                created_by_name: decoded.by || decoded.created_by_name || decoded.by || '',
                th: decoded.th || decoded.theme || 'dark'
            }

            setData(mappedData)
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

    const typeInfo = saleTypeInfo[data.type as keyof typeof saleTypeInfo] || saleTypeInfo['other']
    const themeColor = typeInfo.color.split(' ')[0]
    
    const isDark = data.th !== 'light'
    const gradientFrom = isDark 
        ? themeColor.replace('text-', 'from-').replace('400', '950/60')
        : themeColor.replace('text-', 'from-').replace('400', '100/60')

    const qrData = window.location.href

    const handlePrint = () => window.print()
    const handleShare = async () => {
        try {
            if (navigator.share) await navigator.share({ title: `${data.name} voucher`, url: window.location.href })
            else await navigator.clipboard.writeText(window.location.href)
        } catch (error) { if ((error as DOMException)?.name !== 'AbortError') console.error('Voucher share failed', error) }
    }

    const handleDownload = async () => {
        const el = document.getElementById('voucher-canvas')
        if (!el) return
        
        setIsGenerating(true)
        try {
            await new Promise(r => setTimeout(r, 100))
            const dataUrl = await toPng(el, { quality: 1, pixelRatio: 2 })
            const link = document.createElement('a')
            link.download = `Voucher-${data.room || 'guest'}-${data.name.replace(/\s+/g, '-')}.png`
            link.href = dataUrl
            link.click()
        } catch (err) {
            console.error(err)
        } finally {
            setIsGenerating(false)
        }
    }

    const bgContainer = isDark ? 'bg-[#0E1015] text-white border border-white/10' : 'bg-white text-zinc-900 border border-zinc-200'
    const bgStub = isDark ? 'bg-black/50 border-white/15' : 'bg-zinc-50/90 border-zinc-200'
    const textLabel = isDark ? 'text-white/45 font-bold uppercase tracking-wider' : 'text-zinc-500 font-bold uppercase tracking-wider'
    const textValue = isDark ? 'text-white font-semibold' : 'text-zinc-900 font-semibold'
    const textMuted = isDark ? 'text-white/60' : 'text-zinc-600'
    const bgCard = isDark ? 'bg-white/[0.04] border-white/10' : 'bg-zinc-50 border-zinc-200'
    const cutoutBg = 'bg-background print:bg-white' 
    const qrWrapper = 'bg-white p-3 rounded-2xl shadow-xl border border-zinc-200/80 flex flex-col items-center justify-center gap-1.5'

    const paymentStatus = data.payment || 'pending'
    const totalPrice = data.total_price || (data.total ? parseFloat(data.total) : 0)
    const currencyStr = data.currency || (data.total ? data.total.split(' ')[1] : '') || 'EUR'
    const collectedAmount = data.collected_amount ?? (paymentStatus === 'paid' ? totalPrice : 0)
    const remainingAmount = Math.max(0, totalPrice - collectedAmount)

    return (
        <div className="min-h-screen bg-background flex flex-col items-center py-6 sm:py-12 px-4 overflow-x-hidden">
            {/* PUBLIC HEADER ACTIONS */}
            <div className="max-w-[880px] w-full flex flex-col sm:flex-row justify-between items-center mb-8 print:hidden gap-4">
                <h1 className="text-2xl font-bold tracking-tight">Digital Voucher</h1>
                <div className="flex flex-wrap items-center justify-center gap-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" aria-label="Select language" className="shrink-0">
                                <Globe className="w-4 h-4" aria-hidden="true" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setLanguage('en')} className="cursor-pointer">
                                English {language === 'en' && <span className="ml-2 text-primary">✓</span>}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLanguage('tr')} className="cursor-pointer">
                                Türkçe {language === 'tr' && <span className="ml-2 text-primary">✓</span>}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLanguage('ru')} className="cursor-pointer">
                                Русский {language === 'ru' && <span className="ml-2 text-primary">✓</span>}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="outline" onClick={handleShare}><Share2 className="w-4 h-4 mr-2" />Paylaş / Kopyala</Button>
                    <Button variant="outline" onClick={handlePrint} className="shrink-0">
                        <Printer className="w-4 h-4 mr-2" /> Yazdır
                    </Button>
                    <Button onClick={handleDownload} disabled={isGenerating} className="shrink-0 font-semibold">
                        <Download className="w-4 h-4 mr-2" />
                        {isGenerating ? 'Hazırlanıyor...' : 'Görsel İndir'}
                    </Button>
                </div>
            </div>

            {/* VOUCHER CANVAS CONTAINER */}
            <div className="w-full max-w-[880px] flex justify-center print:m-0 print:p-0">
                <div 
                    id="voucher-canvas"
                    className={cn(
                        "relative flex flex-col sm:flex-row w-full sm:w-[880px] sm:min-h-[420px] rounded-3xl overflow-hidden shadow-2xl shrink-0 print:shadow-none print:w-[880px] print:min-h-[420px] print:flex-row",
                        bgContainer
                    )}
                    style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
                >
                    <div className={cn("absolute inset-0 bg-gradient-to-br opacity-40 pointer-events-none", gradientFrom, isDark ? "to-[#0E1015]" : "to-white")} />
                    
                    {/* LEFT STUB (BRANDING & HIGH-CONTRAST SCANNABLE QR CODE AREA) */}
                    <div className={cn(
                        "w-full sm:w-[28%] border-b sm:border-b-0 sm:border-r border-dashed border-white/20 relative flex flex-col justify-between p-6 gap-5 backdrop-blur-md z-10",
                        bgStub
                    )}>
                        <div className={cn("hidden sm:block absolute -top-4 -right-4 w-8 h-8 rounded-full z-20", cutoutBg)} />
                        <div className={cn("hidden sm:block absolute -bottom-4 -right-4 w-8 h-8 rounded-full z-20", cutoutBg)} />
                        
                        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-base">✨</span>
                                <h3 className={cn("text-xs font-black tracking-[0.2em] uppercase truncate max-w-[180px]", isDark ? 'text-white/90' : 'text-zinc-900')}>
                                    {data.hotelName || 'AETHERIUS'}
                                </h3>
                            </div>
                            <p className={cn("text-[8px] uppercase tracking-widest font-semibold", isDark ? 'text-white/40' : 'text-zinc-500')}>
                                CONCIERGE PASS
                            </p>
                        </div>

                        <div className="flex flex-col items-center justify-center my-auto">
                            <div className={qrWrapper}>
                                <QRCode 
                                    value={qrData} 
                                    size={140} 
                                    bgColor="#FFFFFF"
                                    fgColor="#0F172A"
                                    level="M"
                                />
                                <div className="flex items-center gap-1 mt-1 pt-1 text-[8px] font-bold uppercase tracking-wider text-zinc-600">
                                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                    <span>TARA & DOĞRULA / SCAN VERIFY</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="pt-2 border-t border-dashed border-white/10 flex items-center justify-between">
                            <div>
                                <p className={cn("text-[8px]", textLabel)}>REZ. NO / BOOKING CODE</p>
                                <p className={cn("text-xs font-mono font-bold tracking-wider", isDark ? 'text-amber-400' : 'text-zinc-900')}>
                                    {data.reservation_code || (`RES-${data.id?.slice(0, 6).toUpperCase()}`)}
                                </p>
                            </div>
                            <div className={cn("text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border", isDark ? "bg-white/10 border-white/20 text-white/80" : "bg-zinc-200 border-zinc-300 text-zinc-800")}>
                                OFFICIAL
                            </div>
                        </div>
                    </div>

                    {/* RIGHT MAIN PANEL (SPACIOUS & ELEGANT) */}
                    <div className="flex-1 relative p-6 sm:p-7 flex flex-col justify-between z-10 gap-5">
                        
                        {/* Header Row: Title & Clean Single Payment Status Badge */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-white/10">
                            <div className="space-y-1.5 min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", typeInfo.color)}>
                                        {typeInfo.icon} {t(typeInfo.label as any)}
                                    </span>
                                    <span className={cn("text-xs font-medium", textMuted)}>
                                        📅 {formatDisplayDate(new Date(data.date))} {data.pickup_time ? `· 🕒 ${data.pickup_time}` : ''}
                                    </span>
                                </div>
                                <h1 className={cn("text-2xl sm:text-3xl font-black tracking-tight uppercase leading-tight break-words", isDark ? 'text-white' : 'text-zinc-900')}>
                                    {data.name}
                                </h1>
                            </div>
                            
                            {/* SINGLE UNIFIED PRICE & PAYMENT BADGE */}
                            <div className={cn(
                                "p-3 rounded-2xl border text-right shrink-0 min-w-[170px] shadow-sm backdrop-blur-md",
                                paymentStatus === 'paid'
                                    ? (isDark ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300" : "bg-emerald-50 border-emerald-300 text-emerald-950")
                                    : paymentStatus === 'partial'
                                        ? (isDark ? "bg-amber-500/15 border-amber-500/30 text-amber-300" : "bg-amber-50 border-amber-300 text-amber-950")
                                        : (isDark ? "bg-rose-500/15 border-rose-500/30 text-rose-300" : "bg-rose-50 border-rose-300 text-rose-950")
                            )}>
                                <p className="text-[9px] font-bold uppercase tracking-wider opacity-75">
                                    {paymentStatus === 'paid' ? '🟢 ÖDEME ALINDI / PAID' : paymentStatus === 'partial' ? '🟡 KISMİ / PARTIAL' : '🔴 ÖDEME ALINACAK / UNPAID'}
                                </p>
                                <p className="text-2xl font-black tracking-tight mt-0.5">
                                    {totalPrice} <span className="text-base font-bold">{currencyStr}</span>
                                </p>
                                {paymentStatus !== 'paid' && remainingAmount > 0 && (
                                    <p className="text-[10px] font-semibold text-rose-400 mt-0.5">
                                        Kalan Bakiye: {remainingAmount} {currencyStr}
                                    </p>
                                )}
                                {!isTRYCurrency(currencyStr) && rates?.[currencyStr as keyof typeof rates] && (
                                    <p className={cn("text-[10px] opacity-75 font-semibold mt-0.5", textMuted)}>
                                        ≈ {(totalPrice * rates[currencyStr as keyof typeof rates]!.selling).toFixed(2)} ₺
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* MAIN DETAILS GRID (SPACIOUS 2-COLUMN LAYOUT) */}
                        <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl border backdrop-blur-sm", bgCard)}>
                            {/* COLUMN 1: ROUTE & LOGISTICS */}
                            <div className="space-y-2.5">
                                <p className={cn("text-[9px]", textLabel)}>HİZMET & GÜZERGAH / SERVICE LOGISTICS</p>
                                
                                {data.type === 'transfer' ? (
                                    <div className="space-y-1.5 text-xs font-semibold">
                                        <div className="flex items-start gap-2">
                                            <span className="text-base shrink-0 mt-0.5">📍</span>
                                            <div className="min-w-0 flex-1">
                                                <span className={cn("text-[10px] block opacity-75", textMuted)}>Nereden / From:</span>
                                                <span className={cn("font-bold break-words block", textValue)}>{data.pickup_location || 'Otel Resepsiyon'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="text-base shrink-0 mt-0.5">🏁</span>
                                            <div className="min-w-0 flex-1">
                                                <span className={cn("text-[10px] block opacity-75", textMuted)}>Nereye / To:</span>
                                                <span className={cn("font-bold break-words block", textValue)}>{data.dropoff_location || data.name}</span>
                                            </div>
                                        </div>
                                        {data.flight_number && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-base shrink-0">✈️</span>
                                                <span className={textMuted}>Uçuş:</span>
                                                <span className={cn("font-mono font-bold", textValue)}>{data.flight_number}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-1.5 text-xs font-semibold">
                                        <div className="flex items-start gap-2">
                                            <span className="text-base shrink-0 mt-0.5">✨</span>
                                            <div className="min-w-0 flex-1">
                                                <span className={cn("text-[10px] block opacity-75", textMuted)}>Hizmet / Service:</span>
                                                <span className={cn("font-bold break-words block", textValue)}>{data.name}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-base shrink-0">🕒</span>
                                            <span className={textMuted}>Saat / Time:</span>
                                            <span className={cn("font-bold", textValue)}>{data.pickup_time || '--:--'}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* COLUMN 2: GUEST & ROOM DETAILS */}
                            <div className="space-y-2.5 border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-4">
                                <p className={cn("text-[9px]", textLabel)}>MİSAFİR BİLGİLERİ / GUEST DETAILS</p>
                                
                                <div className="space-y-2 text-xs font-semibold">
                                    <div className="flex items-start gap-2">
                                        <span className="text-base shrink-0 mt-0.5">👤</span>
                                        <div className="min-w-0 flex-1">
                                            <span className={cn("text-[10px] block opacity-75", textMuted)}>Misafir / Guest(s):</span>
                                            {(() => {
                                                const guestRaw = data.customer_name || data.guest
                                                const guests = parseGuestNames(guestRaw)
                                                if (guests.length > 1) {
                                                    return (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {guests.map((g, i) => (
                                                                <span key={i} className={cn("text-xs font-bold px-2 py-0.5 rounded-md border leading-tight", isDark ? "bg-white/10 border-white/20 text-white" : "bg-zinc-100 border-zinc-300 text-zinc-900")}>
                                                                    {g}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )
                                                }
                                                return (
                                                    <span className={cn("font-bold text-xs leading-snug break-words block mt-0.5", textValue)}>
                                                        {guestRaw || '—'}
                                                    </span>
                                                )
                                            })()}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-base shrink-0">📞</span>
                                        <span className={textMuted}>Telefon:</span>
                                        <span className={cn("font-bold break-all", textValue)}>{data.customer_phone || data.phone || '—'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-base shrink-0">🔑</span>
                                        <span className={textMuted}>Oda / Pax:</span>
                                        <span className={cn("font-bold", textValue)}>
                                            {data.room_number || data.room ? `#${data.room_number || data.room}` : '—'} · {data.pax} Person
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FOOTER ROW: NOTES & ISSUER */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs">
                            <div className="flex-1 min-w-0">
                                {data.notes ? (
                                    <div className="flex items-start gap-1.5 text-xs">
                                        <span className="text-amber-400 font-bold shrink-0">📝 Not:</span>
                                        <p className={cn("italic truncate", textMuted)}>{data.notes}</p>
                                    </div>
                                ) : (
                                    <p className={cn("text-[10px] tracking-wide", textMuted)}>
                                        Aetherius Concierge Network · Official Digital Voucher Pass
                                    </p>
                                )}
                            </div>
                            
                            <div className="text-right shrink-0 text-[10px] font-medium opacity-80">
                                <span className={textMuted}>Satan / Issued: </span>
                                <span className={cn("font-bold", textValue)}>{data.created_by_name || data.by || 'Concierge Desk'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { size: landscape; margin: 0; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
                    #voucher-canvas { transform: scale(0.95); transform-origin: top center; margin-top: 1cm; }
                }
            `}</style>
        </div>
    )
}
