import { useState } from 'react'
import { 
    Sparkles, 
    FileText, 
    TrendingUp, 
    ShieldAlert, 
    Users,
    Loader2,
    Calendar,
    Download,
    Share2,
    BarChart3,
    Clock,
    LayoutGrid,
    CheckCircle2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAIStore } from '@/stores/aiStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useSalesStore } from '@/stores/salesStore'
import { useActivityStore } from '@/stores/activityStore'
import { useNotesStore } from '@/stores/notesStore'
import { useLanguageStore } from '@/stores/languageStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type ReportPeriod = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth'
type ReportType = 'ai' | 'manual'

// Helper function to safely convert Firestore Timestamps or Dates
function toDate(value: any): Date {
    if (!value) return new Date()
    if (typeof value.toDate === 'function') return value.toDate()
    if (value instanceof Date) return value
    return new Date(value)
}

export function ManagementReportPanel() {
    const { hotel } = useHotelStore()
    const { sales } = useSalesStore()
    const { logs: activityLogs } = useActivityStore()
    const { notes } = useNotesStore()
    const { generate } = useAIStore()
    const { t, language } = useLanguageStore()
    
    const [report, setReport] = useState<string | null>(null)
    const [generating, setGenerating] = useState(false)
    const [period, setPeriod] = useState<ReportPeriod>('thisWeek')
    const [type, setType] = useState<ReportType>('ai')

    const getPeriodDates = (p: ReportPeriod) => {
        const now = new Date()
        const start = new Date()
        const end = new Date()

        switch (p) {
            case 'today':
                start.setHours(0,0,0,0)
                break
            case 'yesterday':
                start.setDate(now.getDate() - 1)
                start.setHours(0,0,0,0)
                end.setDate(now.getDate() - 1)
                end.setHours(23,59,59,999)
                break
            case 'thisWeek':
                start.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))
                start.setHours(0,0,0,0)
                break
            case 'lastWeek':
                start.setDate(now.getDate() - now.getDay() - 6)
                start.setHours(0,0,0,0)
                end.setDate(now.getDate() - now.getDay())
                end.setHours(23,59,59,999)
                break
            case 'thisMonth':
                start.setDate(1)
                start.setHours(0,0,0,0)
                break
            case 'lastMonth':
                start.setMonth(now.getMonth() - 1)
                start.setDate(1)
                start.setHours(0,0,0,0)
                end.setDate(0) // Last day of previous month
                end.setHours(23,59,59,999)
                break
        }
        return { start, end }
    }

    const filterDataByPeriod = (p: ReportPeriod) => {
        const { start, end } = getPeriodDates(p)
        
        const filteredSales = sales.filter(s => {
            const date = toDate(s.created_at)
            return date >= start && date <= end
        })

        const filteredActivity = activityLogs.filter(l => {
            const date = toDate(l.timestamp)
            return date >= start && date <= end
        })

        const filteredNotes = notes.filter(n => {
            const date = toDate(n.created_at)
            return date >= start && date <= end
        })

        return { filteredSales, filteredActivity, filteredNotes }
    }

    const generateReport = async () => {
        if (!hotel?.id) return
        setGenerating(true)
        setReport(null)

        const { filteredSales, filteredActivity, filteredNotes } = filterDataByPeriod(period)

        if (type === 'ai') {
            await generateAIReport(filteredSales, filteredActivity, filteredNotes)
        } else {
            generateManualReport(filteredSales, filteredActivity, filteredNotes)
        }
        setGenerating(false)
    }

    const generateAIReport = async (filteredSales: any[], filteredActivity: any[], filteredNotes: any[]) => {
        try {
            const salesSummary = filteredSales.slice(0, 50).map(s => ({
                type: s.type,
                amount: `${s.total_price} ${s.currency}`,
                status: s.payment_status
            }))

            const issuesSummary = filteredNotes.filter(n => n.priority === 'high' || n.priority === 'critical').slice(0, 20).map(n => ({
                category: n.category,
                content: n.content,
                status: n.status
            }))

            const context = JSON.stringify({
                hotel_name: hotel?.info?.name,
                period: t(`report.${period}`),
                sales_summary: salesSummary,
                issues_summary: issuesSummary,
                activity_count: filteredActivity.length
            })

            const prompt = language === 'tr' 
                ? `Lütfen bu otel verilerini analiz et ve bir Genel Müdür (GM) raporu oluştur.
                   Dönem: ${t(`report.${period}`)}
                   Rapor şu bölümleri içermelidir:
                   1. Operasyonel Özet
                   2. Satış Analizi
                   3. Personel Aktivite Özeti
                   4. Kritik Uyarılar
                   5. Öneriler
                   Estetik: Cyber-Concierge (Profesyonel, fütüristik).`
                : `Please analyze this hotel data and generate a General Manager (GM) report.
                   Period: ${t(`report.${period}`)}
                   The report should include:
                   1. Operational Summary
                   2. Sales Analysis
                   3. Staff Activity Summary
                   4. Critical Alerts
                   5. Recommendations
                   Aesthetic: Cyber-Concierge (Professional, futuristic).`

            const result = await generate(prompt, 'gemini-2.5-flash', 'report', context)
            if (result) {
                setReport(result)
                toast.success(t('report.successAI'))
            }
        } catch (err) {
            console.error(err)
            toast.error(t('report.errorAI'))
        }
    }

    const generateManualReport = (filteredSales: any[], filteredActivity: any[], filteredNotes: any[]) => {
        const totalSalesByCurrency: Record<string, number> = {}
        filteredSales.forEach(s => {
            totalSalesByCurrency[s.currency] = (totalSalesByCurrency[s.currency] || 0) + s.total_price
        })

        const salesStr = Object.entries(totalSalesByCurrency)
            .map(([curr, total]) => `- **${total.toLocaleString()} ${curr}**`)
            .join('\n')

        const highPriorityCount = filteredNotes.filter(n => n.priority === 'high' || n.priority === 'critical').length
        const resolvedCount = filteredNotes.filter(n => n.status === 'resolved').length

        const manualTemplate = `
# 🏨 ${hotel?.info?.name || 'Relay'} - Report
**Date:** ${new Date().toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US')}

---

## 📈 Sales
${salesStr || '> No data available'}

**Overview:**
- **Sales:** ${filteredSales.length} items
- **Total:** ${Object.entries(totalSalesByCurrency).map(([c, v]) => `${v.toLocaleString()} ${c}`).join(' / ')}

---

## 👥 Activity
- **Activity:** ${filteredActivity.length} records
- **Staff:** ${new Set(filteredActivity.map(l => l.user_id)).size} staff active

**Activity Summary:**
- ${filteredActivity.filter(a => a.action === 'sale_create').length} ${t('report.newSales')}
- ${filteredActivity.filter(a => a.action === 'note_create').length} ${t('report.newNotes')}
- ${filteredActivity.filter(a => a.action === 'compliance_check').length} Compliance checks

---

## ⚠️ Issues
- **Critical / High:** ${highPriorityCount}
- **Resolved:** ${resolvedCount}
- **Open:** ${filteredNotes.length - resolvedCount}

**Notes:**
${filteredNotes.slice(0, 5).map(n => `- [${n.priority.toUpperCase()}] ${n.content.substring(0, 60)}...`).join('\n') || 'No data available'}

---

## 🛠️ Maintenance
- **Total Notes:** ${filteredNotes.filter(n => n.category === 'maintenance').length}
- **Pending Tasks:** ${filteredNotes.filter(n => n.category === 'maintenance' && n.status !== 'resolved').length}

---

<footer>
Generated Report | ID: ${Math.random().toString(36).substring(7).toUpperCase()}
</footer>
`
        setReport(manualTemplate)
        toast.success(t('report.success'))
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-primary" />
                        {t('module.reports')}
                    </h2>
                    <p className="text-muted-foreground text-sm">{t('dashboard.operationsDesc')}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Select value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
                        <SelectTrigger className="w-40 h-10 rounded-xl bg-card border-border/50">
                            <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder={t('report.period')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">{t('report.today')}</SelectItem>
                            <SelectItem value="yesterday">{t('report.yesterday')}</SelectItem>
                            <SelectItem value="thisWeek">{t('report.thisWeek')}</SelectItem>
                            <SelectItem value="lastWeek">{t('report.lastWeek')}</SelectItem>
                            <SelectItem value="thisMonth">{t('report.thisMonth')}</SelectItem>
                            <SelectItem value="lastMonth">{t('report.lastMonth')}</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex bg-muted/30 p-1 rounded-xl border border-border/40">
                        <Button 
                            variant={type === 'ai' ? 'default' : 'ghost'} 
                            size="sm" 
                            className="rounded-lg h-8 gap-2 text-xs"
                            onClick={() => setType('ai')}
                        >
                            <Sparkles className="w-3 h-3" />
                            {t('report.ai')}
                        </Button>
                        <Button 
                            variant={type === 'manual' ? 'default' : 'ghost'} 
                            size="sm" 
                            className="rounded-lg h-8 gap-2 text-xs"
                            onClick={() => setType('manual')}
                        >
                            <LayoutGrid className="w-3 h-3" />
                            {t('report.manual')}
                        </Button>
                    </div>

                    <Button 
                        onClick={generateReport} 
                        disabled={generating}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-6 rounded-xl gap-2 shadow-lg shadow-primary/20"
                    >
                        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        {t('report.generate')}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Period Stats Summary */}
                <Card className="glass md:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            {t(`report.${period}`)} {t('module.overview')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-3 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                            <div className="text-right">
                                <p className="text-[10px] text-muted-foreground uppercase">{t('module.sales')}</p>
                                <p className="text-lg font-bold">{filterDataByPeriod(period).filteredSales.length}</p>
                            </div>
                        </div>
                        <div className="p-3 rounded-2xl bg-violet-500/5 border border-violet-500/10 flex items-center justify-between">
                            <Users className="w-4 h-4 text-violet-400" />
                            <div className="text-right">
                                <p className="text-[10px] text-muted-foreground uppercase">{t('module.activity')}</p>
                                <p className="text-lg font-bold">{filterDataByPeriod(period).filteredActivity.length}</p>
                            </div>
                        </div>
                        <div className="p-3 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex items-center justify-between">
                            <ShieldAlert className="w-4 h-4 text-rose-400" />
                            <div className="text-right">
                                <p className="text-[10px] text-muted-foreground uppercase">{t('priority.critical')}</p>
                                <p className="text-lg font-bold">{filterDataByPeriod(period).filteredNotes.filter(n => n.priority === 'high' || n.priority === 'critical').length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Report Content */}
                <Card className="glass md:col-span-3 min-h-[500px] flex flex-col relative overflow-hidden">
                    {generating && (
                        <div className="absolute inset-0 z-10 bg-background/40 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
                            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
                            <h3 className="font-bold text-lg mb-2">Preparing Report</h3>
                            <p className="text-muted-foreground text-sm max-w-xs">
                                {t('report.aiAnalyzing')}
                            </p>
                        </div>
                    )}

                    <CardHeader className="border-b border-border/40 shrink-0">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <FileText className="w-4 h-4 text-primary" />
                                {t('report.generate')}
                            </CardTitle>
                            {report && (
                                <div className="flex gap-2">
                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" title="Download"><Download className="w-4 h-4" /></Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" title="Share"><Share2 className="w-4 h-4" /></Button>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    
                    <CardContent className="flex-1 overflow-y-auto custom-scrollbar p-0">
                        <AnimatePresence mode="wait">
                            {report ? (
                                <motion.div 
                                    key={`${period}-${type}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-8 prose prose-invert prose-sm max-w-none"
                                >
                                    <div className="whitespace-pre-wrap leading-relaxed text-foreground/90 font-sans selection:bg-primary/30">
                                        {report}
                                    </div>
                                </motion.div>
                            ) : !generating && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-muted-foreground opacity-30">
                                    <Calendar className="w-16 h-16 mb-4" />
                                    <p className="text-lg font-medium">No data available</p>
                                    <p className="text-xs mt-2">{t('report.clickToStart')}</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
