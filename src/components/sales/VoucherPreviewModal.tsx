import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import QRCode from 'react-qr-code'
import { Download, Printer, Sun, Moon, ChevronDown } from 'lucide-react'

import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { useSalesStore, saleTypeInfo, saleStatusInfo } from '@/stores/salesStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useCurrencyStore } from '@/stores/currencyStore'
import { cn, formatDisplayDate } from '@/lib/utils'

interface VoucherPreviewModalProps {
    saleId: string | null
    onClose: () => void
}

export function VoucherPreviewModal({ saleId, onClose }: VoucherPreviewModalProps) {
    const { hotel } = useHotelStore()
    const { t } = useLanguageStore()
    const { sales } = useSalesStore()
    const { rates, fetchRates } = useCurrencyStore()

    const voucherRef = useRef<HTMLDivElement>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [theme, setTheme] = useState<'dark' | 'light'>('dark')

    const sale = sales.find(s => s.id === saleId)

    // Fetch rates when opened
    useState(() => {
        if (saleId) {
            fetchRates()
        }
    })

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
        by: sale.created_by_name || '',
        th: theme // Embed theme selection
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

    const handlePrint = async (size: 'banknote' | 'a5' | 'a4' = 'banknote') => {
        if (!voucherRef.current) return
        
        setIsGenerating(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 100))
            const dataUrl = await toPng(voucherRef.current, { quality: 1, pixelRatio: 3 })
            const iframe = document.createElement('iframe')
            iframe.style.display = 'none'
            document.body.appendChild(iframe)
            
            let imgWidth = '15cm' // Banknote default
            if (size === 'a5') imgWidth = '20cm'
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
    
    // Theme-based class names
    const isDark = theme === 'dark'
    const gradientFrom = isDark 
        ? themeColor.replace('text-', 'from-').replace('400', '900/40')
        : themeColor.replace('text-', 'from-').replace('400', '200/40')
    
    const bgContainer = isDark ? 'bg-[#111318] text-white' : 'bg-white text-zinc-900 border border-zinc-200'
    const bgStub = isDark ? 'bg-black/40 border-white/20' : 'bg-zinc-50 border-zinc-200'
    const textLabel = isDark ? 'text-white/40' : 'text-zinc-500'
    const textValue = isDark ? 'text-white' : 'text-zinc-900'
    const textMuted = isDark ? 'text-white/50' : 'text-zinc-600'
    const bgGrid = isDark ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'
    const cutoutBg = 'bg-background' // Cutouts should match the modal background
    const qrWrapper = isDark ? 'bg-white' : 'bg-white border border-zinc-200'

    return (
        <Dialog open={!!saleId} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-5xl bg-background border-border p-6 gap-6">
                <DialogTitle className="sr-only">Voucher Preview</DialogTitle>
                <DialogDescription className="sr-only">Preview and download voucher</DialogDescription>
                
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Digital Voucher</h2>
                    <div className="flex items-center gap-3">
                        {/* Theme Toggle */}
                        <div className="flex bg-muted rounded-lg p-1 mr-2 border border-border">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className={cn("h-7 px-3 rounded-md", isDark && "bg-background shadow-sm")} 
                                onClick={() => setTheme('dark')}
                            >
                                <Moon className="w-4 h-4 mr-2" /> Dark
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className={cn("h-7 px-3 rounded-md", !isDark && "bg-background shadow-sm")} 
                                onClick={() => setTheme('light')}
                            >
                                <Sun className="w-4 h-4 mr-2" /> Light
                            </Button>
                        </div>
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <Printer className="w-4 h-4 mr-2" />
                                    Print <ChevronDown className="w-3 h-3 ml-2 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handlePrint('banknote')}>
                                    Small (Banknote Size)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePrint('a5')}>
                                    Medium (A5 Width)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePrint('a4')}>
                                    Large (A4 Width)
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button onClick={handleDownload} disabled={isGenerating}>
                            <Download className="w-4 h-4 mr-2" />
                            {isGenerating ? 'Generating...' : 'Download Image'}
                        </Button>
                    </div>
                </div>

                <div className="w-full flex justify-center print:m-0 print:p-0 overflow-x-auto p-1">
                    <div 
                        ref={voucherRef}
                        className={cn("relative flex flex-col sm:flex-row w-full sm:w-[850px] sm:h-[380px] rounded-2xl overflow-hidden shadow-2xl shrink-0 print:shadow-none print:w-[850px] print:h-[380px] print:flex-row", bgContainer)}
                        style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-30", gradientFrom, isDark ? "to-[#111318]" : "to-white")} />
                        
                        {/* LEFT STUB */}
                        <div className={cn("w-full sm:w-[28%] border-b sm:border-b-0 sm:border-r border-dashed relative flex flex-col sm:justify-between p-6 sm:p-6 gap-6 sm:gap-0 backdrop-blur-sm z-10", bgStub)}>
                            <div className={cn("hidden sm:block absolute -top-4 -right-4 w-8 h-8 rounded-full", cutoutBg)} />
                            <div className={cn("hidden sm:block absolute -bottom-4 -right-4 w-8 h-8 rounded-full", cutoutBg)} />
                            
                            <div className="flex sm:flex-col justify-between items-center sm:items-start">
                                <div>
                                    <h3 className={cn("text-sm font-bold tracking-widest uppercase mb-4", textMuted)}>{hotel?.info.name || 'AETHERIUS'}</h3>
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
                                    <p className={cn("text-xs font-mono truncate", isDark ? 'text-white/80' : 'text-zinc-700')}>{sale.id.split('-')[0]}</p>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT MAIN */}
                        <div className="flex-1 relative p-6 sm:p-8 flex flex-col justify-between z-10 gap-6 sm:gap-0">
                            
                            {/* Header */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", 
                                            sale.payment_status === 'paid' 
                                                ? (isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-700") 
                                                : (isDark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-700")
                                        )}>
                                            {sale.payment_status}
                                        </span>
                                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                            isDark ? "bg-white/10 text-white/70" : "bg-zinc-200 text-zinc-600"
                                        )}>
                                            {t(saleStatusInfo[sale.status || 'waiting'].label as any)}
                                        </span>
                                    </div>
                                    <h1 className={cn("text-3xl font-black tracking-tight uppercase", isDark ? 'text-white/90' : 'text-zinc-900')}>{sale.name}</h1>
                                    <p className={cn("text-sm font-medium uppercase tracking-widest mt-1", textMuted)}>
                                        {t(saleTypeInfo[sale.type].label as any)}
                                    </p>
                                </div>
                                
                                <div className="text-right">
                                    <p className={cn("text-[10px] uppercase tracking-wider mb-1", textLabel)}>{t('sales.details.total')}</p>
                                    <p className={cn("text-2xl font-black", textValue)}>{sale.total_price} <span className={cn("text-base", isDark ? 'text-white/60' : 'text-zinc-500')}>{sale.currency}</span></p>
                                    {sale.currency !== 'TRY' && rates?.[sale.currency as keyof typeof rates] && (
                                        <p className={cn("text-xs mt-1 font-medium", textMuted)}>
                                            ≈ {(sale.total_price * rates[sale.currency as keyof typeof rates]!.selling).toFixed(2)} ₺
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Middle Grid */}
                            <div className={cn("grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 mt-0 sm:mt-4 rounded-xl p-4 border", bgGrid)}>
                                <div>
                                    <p className={cn("text-[10px] uppercase tracking-wider mb-1", textLabel)}>{t('tours.book.guestName')}</p>
                                    <p className={cn("text-sm font-bold truncate", textValue)}>{sale.customer_name}</p>
                                </div>
                                <div>
                                    <p className={cn("text-[10px] uppercase tracking-wider mb-1", textLabel)}>{t('common.room')}</p>
                                    <p className={cn("text-sm font-bold", textValue)}>{sale.room_number}</p>
                                </div>
                                <div>
                                    <p className={cn("text-[10px] uppercase tracking-wider mb-1", textLabel)}>{t('sales.details.pax')}</p>
                                    <p className={cn("text-sm font-bold", textValue)}>{sale.pax}</p>
                                </div>
                            </div>

                            {/* Logistics & Notes */}
                            <div className="flex flex-col sm:flex-row items-start justify-between mt-0 sm:mt-4 gap-4 sm:gap-0">
                                <div className="space-y-4 w-full sm:w-auto">
                                    <div className="flex gap-6 sm:gap-8">
                                        <div>
                                            <p className={cn("text-[10px] uppercase tracking-wider mb-1", textLabel)}>{t('common.date')}</p>
                                            <p className={cn("text-base font-bold", textValue)}>{formatDisplayDate(sale.date)}</p>
                                        </div>
                                        {(sale.pickup_time || sale.type === 'transfer') && (
                                            <div>
                                                <p className={cn("text-[10px] uppercase tracking-wider mb-1", textLabel)}>{t('sales.details.pickup')}</p>
                                                <p className={cn("text-base font-bold", textValue)}>{sale.pickup_time || '--:--'}</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Notes */}
                                    {sale.notes && (
                                        <div>
                                            <p className={cn("text-[10px] uppercase tracking-wider mb-1", textLabel)}>{t('sales.details.notes')}</p>
                                            <p className={cn("text-xs max-w-[400px] line-clamp-2", isDark ? 'text-white/80' : 'text-zinc-600')}>{sale.notes}</p>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex flex-col items-end justify-end h-full mt-auto text-right gap-4">
                                    <div className={cn("w-12 h-12 rounded-full border-2 flex items-center justify-center opacity-50", isDark ? 'border-white/20' : 'border-zinc-300')}>
                                        <span className="text-xl">{saleTypeInfo[sale.type].icon}</span>
                                    </div>
                                    <p className={cn("text-[9px] uppercase tracking-widest mt-auto", isDark ? 'text-white/30' : 'text-zinc-400')}>
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
