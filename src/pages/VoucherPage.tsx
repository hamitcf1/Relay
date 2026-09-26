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
import { saleTypeInfo, saleStatusInfo } from '@/stores/salesStore'
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
    const bgGrid = isDark ? 'bg-white/[0.04] border-white/10' : 'bg-zinc-50 border-zinc-200'
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
                                    {data.hotelName || 'AETHERIUS'}
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
                                    {data.reservation_code || (`RES-${data.id?.split('-')[0].toUpperCase()}`)}
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
                                        paymentStatus === 'paid' 
                                            ? (isDark ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-emerald-100 text-emerald-800 border-emerald-300") 
                                            : paymentStatus === 'cancelled' || paymentStatus === 'refunded'
                                                ? (isDark ? "bg-zinc-500/20 text-zinc-300 border-zinc-500/40" : "bg-zinc-200 text-zinc-700 border-zinc-300")
                                                : (isDark ? "bg-rose-500/20 text-rose-300 border-rose-500/40" : "bg-rose-100 text-rose-800 border-rose-300")
                                    )}>
                                        {paymentStatus === 'paid' ? '🟢 ÖDEME ALINDI / PAID' : paymentStatus === 'partial' ? '🟡 KISMİ / PARTIAL' : '🔴 ÖDEME ALINACAK / UNPAID'}
                                    </span>

                                    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                        isDark ? "bg-white/10 text-white/80 border-white/20" : "bg-zinc-100 text-zinc-700 border-zinc-300"
                                    )}>
                                        {t(saleStatusInfo[(data.status || 'waiting') as keyof typeof saleStatusInfo]?.label as any) || data.status}
                                    </span>

                                    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", typeInfo.color)}>
                                        {typeInfo.icon} {t(typeInfo.label as any)}
                                    </span>
                                </div>

                                <h1 className={cn("text-2xl sm:text-3xl font-black tracking-tight uppercase leading-tight", isDark ? 'text-white' : 'text-zinc-900')}>
                                    {data.name}
                                </h1>
                            </div>
                            
                            <div className="text-right sm:text-right self-end sm:self-center shrink-0 bg-white/5 p-3 rounded-2xl border border-white/10 min-w-[140px]">
                                <p className={cn("text-[9px]", textLabel)}>TOPLAM TUTAR / TOTAL PRICE</p>
                                <p className={cn("text-2xl font-black tracking-tight text-emerald-400", isDark ? 'text-emerald-400' : 'text-emerald-600')}>
                                    {totalPrice} <span className="text-base font-bold">{currencyStr}</span>
                                </p>
                                {!isTRYCurrency(currencyStr) && rates?.[currencyStr as keyof typeof rates] && (
                                    <p className={cn("text-[11px] font-bold mt-0.5", textMuted)}>
                                        ≈ {(totalPrice * rates[currencyStr as keyof typeof rates]!.selling).toFixed(2)} ₺
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* BILINGUAL PAYMENT STATUS & COLLECTION BANNER */}
                        <div className={cn(
                            "p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-md shadow-sm",
                            paymentStatus === 'paid'
                                ? (isDark ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-200" : "bg-emerald-50 border-emerald-300 text-emerald-950")
                                : paymentStatus === 'partial'
                                    ? (isDark ? "bg-amber-500/15 border-amber-500/40 text-amber-200" : "bg-amber-50 border-amber-300 text-amber-950")
                                    : (isDark ? "bg-rose-500/15 border-rose-500/40 text-rose-200" : "bg-rose-50 border-rose-300 text-rose-950")
                        )}>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">
                                    {paymentStatus === 'paid' ? '💳' : paymentStatus === 'partial' ? '⏳' : '⚠️'}
                                </span>
                                <div>
                                    <p className={cn("text-[9px] font-bold uppercase tracking-wider opacity-80")}>
                                        ÖDEME DURUMU / PAYMENT STATUS
                                    </p>
                                    <p className="text-sm font-black tracking-wide">
                                        {paymentStatus === 'paid' && '🟢 ÖDEME ALINDI / PAYMENT RECEIVED'}
                                        {paymentStatus === 'pending' && '🔴 ÖDEME ALINACAK / PAYMENT DUE AT PICKUP'}
                                        {paymentStatus === 'partial' && '🟡 KISMİ ÖDEME ALINDI / PARTIAL PAYMENT'}
                                        {paymentStatus === 'refunded' && '⚪ İADE EDİLDİ / REFUNDED'}
                                        {paymentStatus === 'cancelled' && '⚪ İPTAL EDİLDİ / CANCELLED'}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-6 text-right self-end sm:self-center font-mono">
                                <div>
                                    <p className="text-[9px] font-bold uppercase tracking-wider opacity-80">TAHSİL EDİLEN / COLLECTED</p>
                                    <p className="text-sm font-black">
                                        {collectedAmount} {currencyStr}
                                    </p>
                                </div>
                                {paymentStatus !== 'paid' && paymentStatus !== 'refunded' && paymentStatus !== 'cancelled' && (
                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-wider opacity-80">KALAN BAKİYE / BALANCE DUE</p>
                                        <p className="text-sm font-black text-rose-400">
                                            {remainingAmount} {currencyStr}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* CATEGORY SPECIFIC LOGISTICS & GUEST DETAILS */}
                        {data.type === 'transfer' ? (
                            <div className="space-y-3">
                                {/* Transfer Route Banner */}
                                <div className={cn("p-4 rounded-2xl border border-amber-500/40 flex items-center justify-between gap-4", isDark ? "bg-amber-500/10" : "bg-amber-50/80")}>
                                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                        <span className="text-3xl shrink-0">🚐</span>
                                        <div className="min-w-0 flex-1">
                                            <p className={cn("text-[10px] font-bold uppercase tracking-wider", isDark ? "text-amber-300" : "text-amber-800")}>
                                                TRANSFER GÜZERGAHI / ROUTE DETAILS
                                            </p>
                                            <div className="flex flex-wrap items-center gap-2 text-base font-black truncate mt-0.5">
                                                <span className={cn(isDark ? "text-amber-100" : "text-amber-950")}>
                                                    📍 {data.pickup_location || 'Otel / Resepsiyon'}
                                                </span>
                                                <span className="opacity-60 text-lg">➔</span>
                                                <span className={cn(isDark ? "text-amber-100" : "text-amber-950")}>
                                                    🏁 {data.dropoff_location || data.name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/30">
                                        <p className={cn("text-[9px] font-bold uppercase tracking-wider", isDark ? "text-amber-300" : "text-amber-800")}>ALIŞ SAATİ / TIME</p>
                                        <p className={cn("text-xl font-black tracking-tight", isDark ? "text-amber-200" : "text-amber-950")}>{data.pickup_time || '--:--'}</p>
                                    </div>
                                </div>

                                {/* Transfer Logistics Grid */}
                                <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl p-4 border", bgGrid)}>
                                    <div className="col-span-2">
                                        <p className={cn("text-[9px]", textLabel)}>MİSAFİR ADI / GUEST NAME(S)</p>
                                        {(() => {
                                            const guests = parseGuestNames(data.guest)
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
                                            return <p className={cn("text-sm font-bold truncate mt-0.5", textValue)}>{data.guest || '—'}</p>
                                        })()}
                                    </div>

                                    <div>
                                        <p className={cn("text-[9px]", textLabel)}>TELEFON / PHONE</p>
                                        <p className={cn("text-xs font-bold truncate mt-1 flex items-center gap-1", textValue)}>
                                            {data.phone ? <>📞 {data.phone}</> : '—'}
                                        </p>
                                    </div>

                                    <div>
                                        <p className={cn("text-[9px]", textLabel)}>ODA / ROOM & UÇUŞ / FLIGHT</p>
                                        <p className={cn("text-xs font-bold truncate mt-1", textValue)}>
                                            🔑 {data.room ? `#${data.room}` : '—'} {data.flight_number ? `· ✈️ ${data.flight_number}` : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : data.type === 'tour' ? (
                            <div className="space-y-3">
                                <div className={cn("flex items-center justify-between p-4 rounded-2xl border border-indigo-500/40", isDark ? "bg-indigo-500/10" : "bg-indigo-50/80")}>
                                    <div className="flex items-center gap-3.5">
                                        <span className="text-3xl">🗺️</span>
                                        <div>
                                            <p className={cn("text-[10px] font-bold uppercase tracking-wider", isDark ? "text-indigo-300" : "text-indigo-800")}>TUR & GEZİ BİLET DETAYI / EXCURSION PASS</p>
                                            <p className={cn("text-base font-black truncate", isDark ? "text-indigo-100" : "text-indigo-950")}>{data.name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right bg-indigo-500/20 px-3 py-1.5 rounded-xl border border-indigo-500/30">
                                        <p className={cn("text-[9px] font-bold uppercase tracking-wider", isDark ? "text-indigo-300" : "text-indigo-800")}>KALKIŞ / TIME</p>
                                        <p className={cn("text-lg font-black", isDark ? "text-indigo-200" : "text-indigo-950")}>{data.pickup_time || '--:--'}</p>
                                    </div>
                                </div>

                                <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl p-4 border", bgGrid)}>
                                    <div className="col-span-2">
                                        <p className={cn("text-[9px]", textLabel)}>MİSAFİR ADI / GUEST NAME(S)</p>
                                        <p className={cn("text-sm font-bold truncate mt-0.5", textValue)}>{data.guest}</p>
                                    </div>
                                    <div>
                                        <p className={cn("text-[9px]", textLabel)}>TELEFON / PHONE</p>
                                        <p className={cn("text-xs font-bold truncate mt-1", textValue)}>{data.phone || '—'}</p>
                                    </div>
                                    <div>
                                        <p className={cn("text-[9px]", textLabel)}>ODA / ROOM & PAX</p>
                                        <p className={cn("text-xs font-bold mt-1", textValue)}>🔑 {data.room || '—'} · 👥 {data.pax} Person</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl p-4 border", bgGrid)}>
                                <div className="col-span-2">
                                    <p className={cn("text-[9px]", textLabel)}>MİSAFİR ADI / GUEST NAME(S)</p>
                                    <p className={cn("text-sm font-bold truncate mt-0.5", textValue)}>{data.guest}</p>
                                </div>
                                <div>
                                    <p className={cn("text-[9px]", textLabel)}>TELEFON / PHONE</p>
                                    <p className={cn("text-xs font-bold truncate mt-1", textValue)}>{data.phone || '—'}</p>
                                </div>
                                <div>
                                    <p className={cn("text-[9px]", textLabel)}>ODA / ROOM & PAX</p>
                                    <p className={cn("text-xs font-bold mt-1", textValue)}>🔑 {data.room || '—'} · 👥 {data.pax} Item/Pax</p>
                                </div>
                            </div>
                        )}

                        {/* LOGISTICS FOOTER & NOTES */}
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pt-3 border-t border-white/10 text-xs">
                            <div className="space-y-2 flex-1">
                                <div className="flex flex-wrap gap-6 sm:gap-8">
                                    {data.sale_date && (
                                        <div>
                                            <p className={cn("text-[9px]", textLabel)}>SATIŞ TARİHİ / BOOKED DATE</p>
                                            <p className={cn("text-xs font-semibold mt-0.5", textValue)}>{formatDisplayDate(new Date(data.sale_date))}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className={cn("text-[9px]", textLabel)}>HİZMET TARİHİ / SERVICE DATE</p>
                                        <p className={cn("text-xs font-bold text-amber-400 mt-0.5", isDark ? 'text-amber-400' : 'text-amber-700')}>{formatDisplayDate(new Date(data.date))}</p>
                                    </div>
                                    {data.pickup_time && (
                                        <div>
                                            <p className={cn("text-[9px]", textLabel)}>SAAT / TIME</p>
                                            <p className={cn("text-xs font-bold mt-0.5", textValue)}>{data.pickup_time}</p>
                                        </div>
                                    )}
                                </div>

                                {data.notes && (
                                    <div className="mt-2 p-2.5 rounded-xl border border-white/10 bg-white/5">
                                        <p className={cn("text-[9px]", textLabel)}>NOTLAR & TALİMATLAR / NOTES & SPECIAL REQUESTS</p>
                                        <p className={cn("text-xs whitespace-pre-wrap break-words mt-0.5", isDark ? 'text-white/80' : 'text-zinc-700')}>{data.notes}</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="text-right shrink-0 self-end sm:self-center">
                                <p className={cn("text-[9px]", textLabel)}>SATAN / ISSUED BY</p>
                                <p className={cn("text-xs font-semibold", textValue)}>{data.by || 'Reception'}</p>
                                <p className={cn("text-[9px] mt-0.5", textMuted)}>Aetherius Concierge Network</p>
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
