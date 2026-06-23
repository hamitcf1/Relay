import { useState, useEffect } from 'react'
import { 
    Hotel, 
    Clock, 
    Save, 
    Plus, 
    Trash2, 
    Check, 
    AlertCircle, 
    Settings, 
    Users, 
    ShieldCheck,
    Briefcase,
    BarChart3,
    Loader2
} from 'lucide-react'
import { ManagementReportPanel } from '@/components/admin/ManagementReportPanel'
import { StaffManagement } from './StaffManagement'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'
import { useAuthStore } from '@/stores/authStore'
import { useRosterStore } from '@/stores/rosterStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function HotelSettings() {
    const { hotel, updateHotelSettings, updateHotelInfo } = useHotelStore()
    const { t } = useLanguageStore()
    const { user } = useAuthStore()
    const staff = useRosterStore(state => state.staff)
    const subscribeToRoster = useRosterStore(state => state.subscribeToRoster)
    
    const [name, setName] = useState('')
    const [saving, setSaving] = useState(false)
    const [shifts, setShifts] = useState<{ id: string, name: string, code: string, startTime: string, endTime: string, color?: string }[]>([])

    useEffect(() => {
        if (hotel?.id) {
            const unsub = subscribeToRoster(hotel.id)
            return () => unsub()
        }
    }, [hotel?.id, subscribeToRoster])

    useEffect(() => {
        if (hotel) {
            setName(hotel.info?.name || '')
            setShifts(hotel.settings?.shifts || [
                { id: '1', name: 'Morning', code: 'A', startTime: '08:00', endTime: '16:00', color: 'bg-indigo-500' },
                { id: '2', name: 'Evening', code: 'B', startTime: '16:00', endTime: '00:00', color: 'bg-purple-500' },
                { id: '3', name: 'Night', code: 'C', startTime: '00:00', endTime: '08:00', color: 'bg-rose-500' },
                { id: '4', name: 'Extra', code: 'E', startTime: '09:00', endTime: '18:00', color: 'bg-amber-500' }
            ])
        }
    }, [hotel])

    if (user?.role !== 'gm') {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
                <ShieldCheck className="w-16 h-16 text-rose-500/20" />
                <h2 className="text-xl font-bold">{t('common.accessDenied')}</h2>
                <p className="text-muted-foreground">{t('common.gmOnly')}</p>
            </div>
        )
    }

    const handleSaveInfo = async () => {
        if (!hotel?.id) return
        setSaving(true)
        try {
            await updateHotelInfo(hotel.id, { name })
            toast.success('Changes saved')
        } catch (err) {
            toast.error('Error saving changes')
        } finally {
            setSaving(false)
        }
    }

    const handleSaveShifts = async () => {
        if (!hotel?.id) return
        setSaving(true)
        try {
            await updateHotelSettings(hotel.id, { shifts })
            toast.success(t('hotel.shifts.success'))
        } catch (err) {
            toast.error(t('hotel.shifts.error'))
        } finally {
            setSaving(false)
        }
    }

    const addShift = () => {
        const id = Math.random().toString(36).substr(2, 9)
        setShifts([...shifts, { id, name: t('common.addNew'), code: '?', startTime: '00:00', endTime: '23:59' }])
    }

    const removeShift = (id: string) => {
        setShifts(shifts.filter(s => s.id !== id))
    }

    const updateShift = (id: string, field: string, value: string) => {
        setShifts(shifts.map(s => s.id === id ? { ...s, [field]: value } : s))
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-32">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
                    <Settings className="w-8 h-8 text-primary" />
                    {t('hotel.settings.title')}
                </h1>
                <p className="text-muted-foreground">
                    {t('hotel.settings.desc')}
                </p>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="bg-muted/50 p-1 mb-8">
                    <TabsTrigger value="general" className="gap-2">
                        <Hotel className="w-4 h-4" />
                        {t('hotel.settings.hotelDetails')}
                    </TabsTrigger>
                    <TabsTrigger value="shifts" className="gap-2">
                        <Clock className="w-4 h-4" />
                        {t('module.roster')}
                    </TabsTrigger>
                    <TabsTrigger value="roles" className="gap-2">
                        <Users className="w-4 h-4" />
                        {t('common.staff')}
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="gap-2">
                        <BarChart3 className="w-4 h-4" />
                        {t('module.reports')}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6">
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle>{t('hotel.settings.hotelDetails')}</CardTitle>
                            <CardDescription>{t('hotel.settings.hotelDetailsDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="hotel-name">{t('setup.hotelName')}</Label>
                                <Input 
                                    id="hotel-name" 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={t('setup.hotelNamePlaceholder')}
                                    className="bg-muted/30 border-border/50"
                                />
                            </div>
                            <Button 
                                onClick={handleSaveInfo} 
                                disabled={saving}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {t('common.update')}
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="glass border-rose-500/20">
                            <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-rose-500" />
                                    {t('hotel.settings.criticalNotifications')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground mb-4">
                                    {t('hotel.settings.criticalNotificationsDesc')}
                                </p>
                                <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/20">{t('status.active')}</Badge>
                            </CardContent>
                        </Card>

                        <Card className="glass border-emerald-500/20">
                            <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    {t('hotel.settings.autoReports')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground mb-4">
                                    {t('hotel.settings.autoReportsDesc')}
                                </p>
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{t('status.active')}</Badge>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="shifts" className="space-y-6">
                    <Card className="glass">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>{t('hotel.settings.shiftPlanning')}</CardTitle>
                                <CardDescription>{t('hotel.settings.shiftPlanningDesc')}</CardDescription>
                            </div>
                            <Button size="sm" onClick={addShift} variant="outline" className="gap-2">
                                <Plus className="w-4 h-4" />
                                {t('common.addNew')}
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                {shifts.map((shift) => (
                                    <div key={shift.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/40 group">
                                        <div className="w-12 h-10 rounded-lg bg-primary/20 flex items-center justify-center font-semibold text-primary shrink-0 border border-primary/30">
                                            <Input 
                                                value={shift.code} 
                                                onChange={(e) => updateShift(shift.id, 'code', e.target.value.toUpperCase())}
                                                className="w-full h-full text-center bg-transparent border-none p-0 focus:ring-0 text-lg uppercase font-mono"
                                                maxLength={3}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Input 
                                                value={shift.name} 
                                                onChange={(e) => updateShift(shift.id, 'name', e.target.value)}
                                                className="bg-transparent border-none p-0 focus:ring-0 font-bold h-auto text-foreground"
                                            />
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded text-[10px] border border-border/30">
                                                    <Clock className="w-3 h-3 text-muted-foreground" />
                                                    <Input 
                                                        type="time"
                                                        value={shift.startTime || '00:00'} 
                                                        onChange={(e) => updateShift(shift.id, 'startTime', e.target.value)}
                                                        className="bg-transparent border-none p-0 h-auto w-12 text-[10px] focus:ring-0"
                                                    />
                                                    <span>-</span>
                                                    <Input 
                                                        type="time"
                                                        value={shift.endTime || '00:00'} 
                                                        onChange={(e) => updateShift(shift.id, 'endTime', e.target.value)}
                                                        className="bg-transparent border-none p-0 h-auto w-12 text-[10px] focus:ring-0"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            onClick={() => removeShift(shift.id)}
                                            className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-4 border-t border-border/40">
                                <Button 
                                    onClick={handleSaveShifts} 
                                    disabled={saving}
                                    className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    {t('hotel.settings.saveShifts')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="roles" className="space-y-6">
                    <StaffManagement />
                </TabsContent>

                <TabsContent value="reports" className="space-y-6">
                    <ManagementReportPanel />
                </TabsContent>
            </Tabs>
        </div>
    )
}
