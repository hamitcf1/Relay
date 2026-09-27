import { useState, useRef } from 'react'
import { toPng } from 'html-to-image'
import QRCode from 'react-qr-code'
import { Printer, Download, Share2, Globe, ShieldCheck, CheckCircle2, Clock, User, FileText, X } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'
import { formatDisplayDate } from '@/lib/utils'
import type { Sale } from '@/types'
import { toast } from 'sonner'

export type ConfirmationLanguage = 'tr' | 'en' | 'ru'

interface TourConfirmationPdfModalProps {
    isOpen: boolean
    onClose: () => void
    sale: Sale | null
}

const CONFIRMATION_TEXTS: Record<ConfirmationLanguage, {
    title: string
    subtitle: string
    welcome: string
    guestSection: string
    guidelinesTitle: string
    pickupHeader: string
    pickupText: string
    bringHeader: string
    bringText: string
    policyHeader: string
    policyText: string
    supportHeader: string
    supportText: string
    voucherHeader: string
    labels: {
        guestName: string
        roomNo: string
        phone: string
        tourName: string
        serviceDate: string
        saleDate: string
        pickupTime: string
        pickupLocation: string
        pax: string
        price: string
        paymentStatus: string
        reservationCode: string
        issuedBy: string
        verifiedStamp: string
    }
}> = {
    tr: {
        title: 'TUR REZERVASYON KONFİRME BELGESİ',
        subtitle: 'Aetherius Concierge Hizmetleri · Resmi Bilet & Bilgilendirme Belgesi',
        welcome: 'Değerli Misafirimiz, otelimiz aracılığıyla gerçekleştirmiş olduğunuz tur rezervasyonunuz başarıyla konfirme edilmiştir. Hizmet detayları, kalkış bilgileri ve seyahatiniz esnasında dikkat etmeniz gereken önemli hususlar aşağıda sunulmuştur.',
        guestSection: 'Rezervasyon & Hizmet Detayları',
        guidelinesTitle: 'Önemli Tur Bilgilendirmesi & Katılım Koşulları',
        pickupHeader: '1. Transfer & Alış Saati:',
        pickupText: 'Lütfen belirtilen teslim alma saatinden en az 15 dakika önce otel lobisinde / resepsiyon alanında hazır bulunuz. Transfer aracımız sırayla farklı otellerden misafir topladığı için trafik durumuna bağlı olarak ±10 dakikalık esneklik olabilmektedir.',
        bringHeader: '2. Yanınızda Bulundurmanız Gerekenler:',
        bringText: 'Tur günü lütfen geçerli bir fotoğraflı kimlik veya pasaportunuzu, güneş gözlüğü, koruyucu krem, rahat yürüyüş ayakkabısı ve kişisel harcamalarınız için bir miktar nakit paranızı yanınızda bulundurunuz.',
        policyHeader: '3. Değişiklik & İptal Şartları:',
        policyText: 'Tur saati veya tarihindeki olası değişiklik veya iptal taleplerinizi tur saatinden en az 24 saat önce resepsiyon / konsiyerj masamıza iletmeniz gerekmektedir.',
        supportHeader: '4. 7/24 Misafir Destek Hattı:',
        supportText: 'Tur esnasında veya öncesinde her türlü acil durum, soru ve bilgi talepleriniz için otelimiz resepsiyonu ile anında iletişime geçebilirsiniz.',
        voucherHeader: 'RESMİ TUR VOUCHER & GİRİŞ BİLETİ (TUR PASS)',
        labels: {
            guestName: 'Misafir Adı',
            roomNo: 'Oda No',
            phone: 'İletişim Tel',
            tourName: 'Tur / Aktivite Adı',
            serviceDate: 'Hizmet Tarihi',
            saleDate: 'Satış Tarihi',
            pickupTime: 'Alış / Pick-up Saati',
            pickupLocation: 'Alınış Noktası',
            pax: 'Kişi Sayısı (Pax)',
            price: 'Toplam Tutar',
            paymentStatus: 'Ödeme Durumu',
            reservationCode: 'Rezervasyon No',
            issuedBy: 'Düzenleyen Personel',
            verifiedStamp: 'Resmi Onaylı Bilet'
        }
    },
    en: {
        title: 'OFFICIAL TOUR BOOKING CONFIRMATION',
        subtitle: 'Aetherius Concierge Network · Official Voucher & Guidelines Pass',
        welcome: 'Dear Guest, your tour booking arranged via our concierge desk has been officially confirmed. Please find your complete itinerary, service details, and essential tour instructions below.',
        guestSection: 'Booking & Guest Information',
        guidelinesTitle: 'Essential Tour Instructions & Guidelines',
        pickupHeader: '1. Pickup & Departure Instructions:',
        pickupText: 'Please be ready in the hotel lobby/reception area at least 15 minutes before your scheduled pickup time. As our shared transfer vehicle collects guests from multiple locations, a minor flexibility window of ±10 minutes may apply due to local traffic.',
        bringHeader: '2. What to Bring:',
        bringText: 'Kindly carry a valid photo ID or passport, sunglasses, sun protection, comfortable walking footwear, and local currency for personal expenses or souvenirs.',
        policyHeader: '3. Cancellation & Modification Policy:',
        policyText: 'Any changes to your schedule or cancellations must be communicated to our front desk / concierge team at least 24 hours prior to departure.',
        supportHeader: '4. 24/7 Concierge Guest Support:',
        supportText: 'For any immediate inquiries, adjustments, or assistance before or during your excursion, our front desk is available 24/7.',
        voucherHeader: 'OFFICIAL TOUR VOUCHER & ENTRY PASS',
        labels: {
            guestName: 'Guest Name',
            roomNo: 'Room No',
            phone: 'Phone Number',
            tourName: 'Tour / Excursion',
            serviceDate: 'Service Date',
            saleDate: 'Booking Date',
            pickupTime: 'Pickup Time',
            pickupLocation: 'Pickup Location',
            pax: 'Pax Count',
            price: 'Total Amount',
            paymentStatus: 'Payment Status',
            reservationCode: 'Reservation Ref',
            issuedBy: 'Issued By',
            verifiedStamp: 'Official Confirmed Pass'
        }
    },
    ru: {
        title: 'ОФИЦИАЛЬНОЕ ПОДТВЕРЖДЕНИЕ БРОНИРОВАНИЯ ТУРА',
        subtitle: 'Aetherius Concierge Services · Официальный Ваучер и Билет',
        welcome: 'Уважаемый Гость, ваше бронирование тура, оформленное через консьерж-службу отеля, успешно подтверждено. Ниже приведены детали поездки и важные инструкции для участников.',
        guestSection: 'Детали Бронирования и Гостя',
        guidelinesTitle: 'Важная Информация и Правила Участия',
        pickupHeader: '1. Трансфер и Время Сбора:',
        pickupText: 'Пожалуйста, будьте в лобби отеля / на ресепшене за 15 минут до указанного времени сбора. Поскольку трансфер собирает гостей из нескольких отелей, возможна небольшая задержка (±10 минут) из-за дорожной обстановки.',
        bringHeader: '2. Что Необходим Взять с Собой:',
        bringText: 'Возьмите с собой удостоверение личности / паспорт, солнцезащитные очки, крем от солнца, удобную обувь и немного наличных для личных расходов.',
        policyHeader: '3. Изменение и Отмена:',
        policyText: 'Любые изменения даты/времени или отмена бронирования должны быть согласованы с ресепшеном не менее чем за 24 часа до выезда.',
        supportHeader: '4. Круглосуточная Служба Поддержки:',
        supportText: 'По всем вопросам до или во время экскурсии вы можете обращаться на ресепшен отеля в любое время (24/7).',
        voucherHeader: 'ОФИЦИАЛЬНЫЙ ВАУЧЕР И ВХОДНОЙ БИЛЕТ',
        labels: {
            guestName: 'Имя Гостя',
            roomNo: 'Номер Комнаты',
            phone: 'Телефон',
            tourName: 'Название Тура',
            serviceDate: 'Дата Проведения',
            saleDate: 'Дата Бронирования',
            pickupTime: 'Время Сбора',
            pickupLocation: 'Место Сбора',
            pax: 'Человек (Pax)',
            price: 'Общая Стоимость',
            paymentStatus: 'Статус Оплаты',
            reservationCode: 'Код Брони',
            issuedBy: 'Оформил',
            verifiedStamp: 'Подтвержденный Билет'
        }
    }
}

export function TourConfirmationPdfModal({ isOpen, onClose, sale }: TourConfirmationPdfModalProps) {
    const { hotel } = useHotelStore()
    const { language: appLang } = useLanguageStore()
    const [docLang, setDocLang] = useState<ConfirmationLanguage>(() => {
        if (appLang === 'ru') return 'ru'
        if (appLang === 'en') return 'en'
        return 'tr'
    })
    const [isGenerating, setIsGenerating] = useState(false)
    const docRef = useRef<HTMLDivElement>(null)

    if (!sale) return null

    const texts = CONFIRMATION_TEXTS[docLang]
    const reservationCode = sale.reservation_code || (`RES-${sale.id.slice(0, 6).toUpperCase()}`)
    const collected = sale.collected_amount ?? (sale.payment_status === 'paid' ? sale.total_price : 0)
    const remaining = Math.max(0, sale.total_price - collected)

    // QR Payload
    const qrData = (() => {
        if (typeof window === 'undefined') return ''
        try {
            const rawPayload = {
                v: 2,
                id: sale.id,
                r: reservationCode,
                hn: (hotel?.info?.name || 'AETHERIUS').slice(0, 30),
                n: (sale.name || '').slice(0, 45),
                t: sale.type,
                g: (sale.customer_name || '').slice(0, 60),
                rm: sale.room_number || '',
                d: sale.date ? (sale.date instanceof Date ? sale.date.toISOString().slice(0, 10) : String(sale.date).slice(0, 10)) : undefined,
                pt: sale.pickup_time || '',
                px: sale.pax,
                py: sale.payment_status,
                tp: sale.total_price,
                c: sale.currency
            }
            const jsonStr = JSON.stringify(rawPayload)
            const b64 = btoa(unescape(encodeURIComponent(jsonStr)))
            return `${window.location.origin}/voucher?id=${sale.id}&d=${b64}`
        } catch {
            return `${window.location.origin}/voucher?id=${sale.id}`
        }
    })()

    const handlePrintA4 = () => {
        window.print()
    }

    const handleDownloadPng = async () => {
        if (!docRef.current) return
        setIsGenerating(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 150))
            const dataUrl = await toPng(docRef.current, { quality: 1, pixelRatio: 3 })
            const link = document.createElement('a')
            link.download = `Tour-Confirmation-${reservationCode}-${docLang.toUpperCase()}.png`
            link.href = dataUrl
            link.click()
            toast.success('Konfirme belgesi yüksek kalitede indirildi!')
        } catch (error) {
            console.error('Failed to download confirmation PNG:', error)
            toast.error('Görsel indirilemedi. Lütfen yazdır seçeneğini kullanın.')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({ title: `${sale.name} Konfirme Belgesi`, url: qrData })
            } else {
                await navigator.clipboard.writeText(qrData)
                toast.success('Bilet ve konfirme bağlantısı kopyalandı!')
            }
        } catch (error) {
            if ((error as DOMException)?.name !== 'AbortError') toast.error('Paylaşılamadı.')
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-5xl bg-card border-border text-foreground p-0 overflow-hidden max-h-[92vh] flex flex-col shadow-2xl">
                <DialogTitle className="sr-only">A4 Tur Rezervasyon Konfirme Belgesi (PDF & Voucher)</DialogTitle>
                <DialogDescription className="sr-only">A4 Tour Booking Confirmation Document with Voucher Pass</DialogDescription>

                {/* Top Control Toolbar (Hidden in print) */}
                <div className="flex flex-wrap items-center justify-between p-3.5 bg-muted/90 backdrop-blur-md border-b border-border/60 shrink-0 no-print gap-2">
                    {/* Language Switcher */}
                    <div className="flex items-center gap-1.5 bg-background/80 p-1 rounded-lg border border-border">
                        <Globe className="w-3.5 h-3.5 ml-1.5 text-primary" />
                        <span className="text-[11px] font-bold text-muted-foreground mr-1">Dil / Language:</span>
                        {(['tr', 'en', 'ru'] as const).map((lang) => (
                            <button
                                key={lang}
                                type="button"
                                onClick={() => setDocLang(lang)}
                                className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase transition-all ${
                                    docLang === lang
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                            >
                                {lang === 'tr' ? '🇹🇷 TR' : lang === 'en' ? '🇬🇧 EN' : '🇷🇺 RU'}
                            </button>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleShare}
                            className="h-8 text-xs gap-1 border-border/80"
                        >
                            <Share2 className="w-3.5 h-3.5" /> Paylaş
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={isGenerating}
                            onClick={handleDownloadPng}
                            className="h-8 text-xs gap-1 border-border/80"
                        >
                            <Download className="w-3.5 h-3.5 text-primary" /> İndir (HD)
                        </Button>
                        <Button
                            size="sm"
                            onClick={handlePrintA4}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs font-bold gap-1.5 shadow-md"
                        >
                            <Printer className="w-4 h-4" /> Yazdır / A4 PDF
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Printable Document Scroll Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-zinc-900/40 text-zinc-950 flex justify-center scrollbar-thin">
                    {/* A4 Sheet Container */}
                    <div
                        ref={docRef}
                        className="printable-area bg-white text-zinc-950 w-full max-w-[210mm] min-h-[297mm] p-6 sm:p-10 shadow-2xl rounded-sm flex flex-col justify-between space-y-6 font-sans border border-zinc-200 relative select-text"
                        style={{ boxSizing: 'border-box' }}
                    >
                        {/* Top Header */}
                        <div>
                            <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-5">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="size-7 rounded-lg bg-zinc-950 text-white font-black flex items-center justify-center text-sm tracking-tighter">
                                            AR
                                        </div>
                                        <h1 className="text-xl font-black tracking-tight text-zinc-950 uppercase">
                                            {hotel?.info?.name || 'AETHERIUS RELAY CONCIERGE'}
                                        </h1>
                                    </div>
                                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest pl-9">
                                        {texts.subtitle}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-900 text-white rounded-md text-xs font-mono font-bold tracking-wider">
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                        {reservationCode}
                                    </div>
                                    <p className="text-[10px] text-zinc-500 mt-1.5 font-mono">
                                        {texts.labels.saleDate}: {formatDisplayDate(sale.sale_date || sale.created_at)}
                                    </p>
                                </div>
                            </div>

                            {/* Document Title Bar */}
                            <div className="my-5 bg-zinc-950 text-white py-2.5 px-4 rounded-lg flex items-center justify-between shadow-sm">
                                <h2 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-amber-400" />
                                    {texts.title}
                                </h2>
                                <span className="text-[11px] font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {texts.labels.verifiedStamp}
                                </span>
                            </div>

                            {/* Welcome Note */}
                            <p className="text-xs text-zinc-700 leading-relaxed mb-5 italic border-l-2 border-zinc-400 pl-3 py-0.5">
                                "{texts.welcome}"
                            </p>

                            {/* Guest & Service Summary Grid */}
                            <div className="bg-zinc-50 border border-zinc-300 rounded-xl p-4 mb-6 shadow-xs">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-250 pb-2 mb-3 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-zinc-600" />
                                    {texts.guestSection}
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-xs">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase text-zinc-500 block">{texts.labels.guestName}</span>
                                        <span className="font-bold text-zinc-950 text-sm">{sale.customer_name || '—'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase text-zinc-500 block">{texts.labels.roomNo}</span>
                                        <span className="font-bold text-zinc-950 text-sm">{sale.room_number ? `Oda #${sale.room_number}` : '—'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase text-zinc-500 block">{texts.labels.phone}</span>
                                        <span className="font-mono text-zinc-900">{sale.customer_phone || '—'}</span>
                                    </div>
                                    <div className="col-span-2 sm:col-span-2">
                                        <span className="text-[10px] font-bold uppercase text-zinc-500 block">{texts.labels.tourName}</span>
                                        <span className="font-black text-zinc-950 text-sm text-primary">{sale.name}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase text-zinc-500 block">{texts.labels.pax}</span>
                                        <span className="font-bold text-zinc-900">{sale.pax} {docLang === 'tr' ? 'Kişi' : 'Pax'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase text-zinc-500 block">{texts.labels.serviceDate}</span>
                                        <span className="font-bold text-zinc-950">{formatDisplayDate(sale.date)}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase text-zinc-500 block">{texts.labels.pickupTime}</span>
                                        <span className="font-bold font-mono text-zinc-950 text-sm text-amber-700">🕒 {sale.pickup_time || '—'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase text-zinc-500 block">{texts.labels.pickupLocation}</span>
                                        <span className="font-semibold text-zinc-900">{sale.pickup_location || 'Otel Resepsiyon / Lobisi'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase text-zinc-500 block">{texts.labels.price}</span>
                                        <span className="font-black font-mono text-sm text-zinc-950">{sale.total_price} {sale.currency}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase text-zinc-500 block">{texts.labels.paymentStatus}</span>
                                        <span className={`font-bold text-xs ${remaining === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                                            {remaining === 0 ? '✓ Ödendi (Paid)' : `Kalan: ${remaining} ${sale.currency}`}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase text-zinc-500 block">{texts.labels.issuedBy}</span>
                                        <span className="text-zinc-800">{sale.created_by_name || 'Resepsiyon'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Informative Instructions Section */}
                            <div className="space-y-3 mb-6">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-300 pb-1 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                                    {texts.guidelinesTitle}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] leading-relaxed">
                                    <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200 space-y-1">
                                        <h4 className="font-bold text-zinc-900 text-xs">{texts.pickupHeader}</h4>
                                        <p className="text-zinc-700">{texts.pickupText}</p>
                                    </div>
                                    <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200 space-y-1">
                                        <h4 className="font-bold text-zinc-900 text-xs">{texts.bringHeader}</h4>
                                        <p className="text-zinc-700">{texts.bringText}</p>
                                    </div>
                                    <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200 space-y-1">
                                        <h4 className="font-bold text-zinc-900 text-xs">{texts.policyHeader}</h4>
                                        <p className="text-zinc-700">{texts.policyText}</p>
                                    </div>
                                    <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200 space-y-1">
                                        <h4 className="font-bold text-zinc-900 text-xs">{texts.supportHeader}</h4>
                                        <p className="text-zinc-700">{texts.supportText}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* BOTTOM SECTION: DIGITAL VOUCHER TICKET PASS (EN ALTTA) */}
                        <div className="border-t-2 border-dashed border-zinc-400 pt-5 mt-auto">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    {texts.voucherHeader}
                                </span>
                                <span className="text-[10px] font-mono text-zinc-400">CUT OR KEEP WITH YOU</span>
                            </div>

                            {/* The Ticket Pass Box */}
                            <div className="bg-zinc-950 text-white rounded-xl p-4 shadow-lg border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
                                {/* Accent Side Strip */}
                                <div className="absolute left-0 top-0 bottom-0 w-2 bg-amber-400" />

                                <div className="pl-3 space-y-1.5 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-mono font-bold bg-amber-400 text-zinc-950 px-2 py-0.5 rounded uppercase">
                                            {sale.type.toUpperCase()} PASS
                                        </span>
                                        <span className="text-[10px] font-mono text-zinc-400">{reservationCode}</span>
                                    </div>
                                    <h4 className="text-base font-black text-white tracking-tight leading-tight">{sale.name}</h4>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-300">
                                        <span>👤 <strong>{sale.customer_name || 'Misafir'}</strong></span>
                                        {sale.room_number && <span>🏠 Oda: <strong>{sale.room_number}</strong></span>}
                                        <span>👥 <strong>{sale.pax} Pax</strong></span>
                                        <span>📅 <strong>{formatDisplayDate(sale.date)}</strong></span>
                                        <span>🕒 <strong>{sale.pickup_time}</strong></span>
                                    </div>
                                    <div className="text-[10px] text-zinc-400 font-mono pt-1">
                                        {hotel?.info?.name || 'Aetherius Concierge'} · Verified Ticket Pass
                                    </div>
                                </div>

                                {/* QR Code & Scan Stub */}
                                <div className="bg-white p-2.5 rounded-xl text-zinc-950 flex flex-col items-center justify-center shrink-0 border border-zinc-200">
                                    {qrData && <QRCode value={qrData} size={76} level="M" />}
                                    <span className="text-[9px] font-mono font-bold text-zinc-700 mt-1 uppercase">
                                        {reservationCode}
                                    </span>
                                </div>
                            </div>

                            {/* Verification Footer */}
                            <div className="flex items-center justify-between pt-3 text-[9px] text-zinc-400 font-mono">
                                <span>{hotel?.info?.name || 'Aetherius Hotel Concierge Desk'}</span>
                                <span>Official Confirmation & Ticket Pass · Generated Version 2.0</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Control Toolbar */}
                <div className="flex items-center justify-between p-3.5 bg-muted/90 backdrop-blur-md border-t border-border/60 shrink-0 no-print">
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                        Seçili Dil: <strong className="text-foreground uppercase">{docLang}</strong> — A4 formatında yazdırılmaya hazır.
                    </span>
                    <div className="flex items-center gap-2 ml-auto">
                        <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
                            Kapat
                        </Button>
                        <Button
                            size="sm"
                            onClick={handlePrintA4}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs font-bold gap-1.5 shadow-md"
                        >
                            <Printer className="w-4 h-4" /> Yazdır / PDF Olarak Kaydet
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
