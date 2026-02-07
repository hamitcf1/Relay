import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Settings,
    CreditCard,
    Plane,
    Shirt,
    MapPin,
    Save,
    Loader2,
    Edit2,
    X,
    Lock,
    LockOpen,
    ShieldCheck,
    KeyRound
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLanguageStore } from '@/stores/languageStore'
import { CollapsibleCard } from '@/components/dashboard/CollapsibleCard'

interface HotelInfoData {
    iban: string
    bank_name: string
    laundry_price: number
    transfer_price: number
    late_checkout_price: number
    extra_bed_price: number
    notes: string
}

interface HotelInfoPanelProps {
    hotelId: string
    canEdit: boolean
}

const defaultInfo: HotelInfoData = {
    iban: '',
    bank_name: '',
    laundry_price: 0,
    transfer_price: 0,
    late_checkout_price: 0,
    extra_bed_price: 0,
    notes: '',
}

export function HotelInfoPanel({ hotelId, canEdit }: HotelInfoPanelProps) {
    const { t } = useLanguageStore()
    const [info, setInfo] = useState<HotelInfoData>(defaultInfo)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editInfo, setEditInfo] = useState<HotelInfoData>(defaultInfo)
    const [isVaultUnlocked, setIsVaultUnlocked] = useState(false)
    const [passwordInput, setPasswordInput] = useState('')

    const { user } = useAuthStore()
    const { hotel, updateHotelSettings } = useHotelStore()
    const isGM = user?.role === 'gm'

    // Fetch hotel info
    useEffect(() => {
        if (!hotelId) return

        const fetchInfo = async () => {
            setLoading(true)
            try {
                const infoRef = doc(db, 'hotels', hotelId, 'settings', 'info')
                const snap = await getDoc(infoRef)

                if (snap.exists()) {
                    setInfo({ ...defaultInfo, ...snap.data() as HotelInfoData })
                }
            } catch (error) {
                console.error('Error fetching hotel info:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchInfo()
    }, [hotelId])

    const handleEdit = () => {
        setEditInfo(info)
        setIsEditing(true)
    }

    const handleCancel = () => {
        setIsEditing(false)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const infoRef = doc(db, 'hotels', hotelId, 'settings', 'info')
            await setDoc(infoRef, editInfo)
            setInfo(editInfo)
            setIsEditing(false)
        } catch (error) {
            console.error('Error saving hotel info:', error)
        } finally {
            setSaving(false)
        }
    }
    const handleSaveSecret = async (secretData: any) => {
        if (!hotel?.id) return
        setSaving(true)
        try {
            await updateHotelSettings(hotel.id, {
                secret_info: {
                    ...hotel.settings.secret_info,
                    ...secretData
                }
            })
        } catch (error) {
            console.error('Error saving secret info:', error)
        } finally {
            setSaving(false)
        }
    }

    const handleSetSafePassword = async () => {
        if (!hotel?.id || !passwordInput) return
        setSaving(true)
        try {
            await updateHotelSettings(hotel.id, {
                safe_password: passwordInput
            })
            setPasswordInput('')
            setIsVaultUnlocked(true)
        } catch (error) {
            console.error('Error setting safe password:', error)
        } finally {
            setSaving(false)
        }
    }

    const handleUnlock = () => {
        if (passwordInput === hotel?.settings?.safe_password) {
            setIsVaultUnlocked(true)
            setPasswordInput('')
        } else {
            alert('Yanlış şifre!')
        }
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
                </CardContent>
            </Card>
        )
    }

    const priceItems = [
        { key: 'laundry_price', label: t('hotel.laundry'), icon: Shirt },
        { key: 'transfer_price', label: t('hotel.transfer'), icon: Plane },
        { key: 'late_checkout_price', label: t('hotel.lateCheckout'), icon: MapPin },
        { key: 'extra_bed_price', label: t('hotel.extraBed'), icon: Settings },
    ]

    return (
        <CollapsibleCard
            id="hotel-info"
            title={
                <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-indigo-400" />
                    {t('module.hotelInfo')}
                </CardTitle>
            }
            headerActions={
                canEdit && !isEditing && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation()
                            handleEdit()
                        }}
                        className="h-8 w-8 p-0"
                    >
                        <Edit2 className="w-4 h-4" />
                    </Button>
                )
            }
        >
            <div className="pt-2">
                {isEditing ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                    >
                        {/* IBAN */}
                        <div className="space-y-2">
                            <label className="text-xs text-zinc-400">{t('hotel.iban')}</label>
                            <Input
                                placeholder="TR00 0000 0000 0000 0000 0000 00"
                                value={editInfo.iban}
                                onChange={(e) => setEditInfo((prev) => ({ ...prev, iban: e.target.value }))}
                            />
                        </div>

                        <div>
                            <label className="text-xs text-zinc-400">{t('hotel.bankName')}</label>
                            <Input
                                placeholder={t('hotel.bankNamePlaceholder')}
                                value={editInfo.bank_name}
                                onChange={(e) => setEditInfo((prev) => ({ ...prev, bank_name: e.target.value }))}
                            />
                        </div>

                        {/* Prices */}
                        <div className="grid grid-cols-2 gap-3">
                            {priceItems.map((item) => (
                                <div key={item.key}>
                                    <label className="text-xs text-zinc-400">{item.label} (₺)</label>
                                    <Input
                                        type="number"
                                        value={String(editInfo[item.key as keyof HotelInfoData] || 0)}
                                        onChange={(e) => setEditInfo((prev) => ({
                                            ...prev,
                                            [item.key]: parseFloat(e.target.value) || 0
                                        }))}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="text-xs text-zinc-400">{t('hotel.additionalNotes')}</label>
                            <textarea
                                placeholder={t('hotel.notesPlaceholder')}
                                value={editInfo.notes}
                                onChange={(e) => setEditInfo((prev) => ({ ...prev, notes: e.target.value }))}
                                rows={3}
                                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <Button onClick={handleSave} disabled={saving} size="sm">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {t('common.save')}
                            </Button>
                            <Button variant="ghost" onClick={handleCancel} size="sm">
                                <X className="w-4 h-4" />
                                {t('common.cancel')}
                            </Button>
                        </div>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {/* IBAN Display */}
                        {/* Hotel Code Display or Generation */}
                        {isGM && (
                            <div className="p-3 bg-zinc-800/50 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <KeyRound className="w-4 h-4 text-indigo-400" />
                                    <span className="text-xs text-zinc-400">Hotel Code:</span>
                                    <div className="flex items-center gap-2">
                                        {hotel?.code ? (
                                            <div className="flex items-center gap-2">
                                                <div className="bg-black/40 px-3 py-1.5 rounded border border-indigo-500/30 flex items-center gap-2">
                                                    <span className="font-mono text-xl font-bold text-indigo-300 tracking-[0.2em]">{hotel.code}</span>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(hotel.code || '')
                                                        // Ideally show a toast here, but for now simple feedback
                                                        const btn = document.activeElement as HTMLElement
                                                        if (btn) {
                                                            const originalHTML = btn.innerHTML
                                                            btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check w-4 h-4 text-emerald-400"><path d="M20 6 9 17l-5-5"/></svg>'
                                                            setTimeout(() => { btn.innerHTML = originalHTML }, 2000)
                                                        }
                                                    }}
                                                    title="Copy Code"
                                                >
                                                    <div className="relative">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy w-4 h-4"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                                                    </div>
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={async (e) => {
                                                    e.preventDefault() // Prevent form submission if inside one
                                                    if (!hotel?.id) return

                                                    setSaving(true)

                                                    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
                                                    let result = ''
                                                    for (let i = 0; i < 6; i++) {
                                                        result += chars.charAt(Math.floor(Math.random() * chars.length))
                                                    }

                                                    try {
                                                        const { doc, updateDoc } = await import('firebase/firestore')
                                                        const { db } = await import('@/lib/firebase')
                                                        await updateDoc(doc(db, 'hotels', hotel.id), { code: result })
                                                    } catch (e) {
                                                        console.error("Code generation failed:", e)
                                                        alert("Failed to generate code. Please try again.")
                                                    } finally {
                                                        setSaving(false)
                                                    }
                                                }}
                                                className="h-7 text-xs bg-indigo-600/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-600/20"
                                                disabled={saving}
                                            >
                                                {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <KeyRound className="w-3 h-3 mr-1" />}
                                                Generate Hotel Code
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {info.iban && (
                            <div className="p-3 bg-zinc-800/50 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <CreditCard className="w-4 h-4 text-indigo-400" />
                                    <span className="text-xs text-zinc-400">{t('hotel.bankAccount')}</span>
                                </div>
                                <p className="font-mono text-sm text-zinc-200">{info.iban}</p>
                                {info.bank_name && (
                                    <p className="text-xs text-zinc-500 mt-1">{info.bank_name}</p>
                                )}
                            </div>
                        )}

                        {/* Prices Grid */}
                        <div className="grid grid-cols-2 gap-2">
                            {priceItems.map((item) => {
                                const value = info[item.key as keyof HotelInfoData]
                                if (!value || value === 0) return null
                                const Icon = item.icon
                                return (
                                    <div key={item.key} className="flex items-center gap-2 p-2 bg-zinc-800/30 rounded">
                                        <Icon className="w-4 h-4 text-zinc-500" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-zinc-400 truncate">{item.label}</p>
                                            <p className="text-sm font-bold text-zinc-200">₺{(value as number).toLocaleString()}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Notes */}
                        {info.notes && (
                            <div className="text-sm text-zinc-400 p-2 bg-zinc-800/30 rounded">
                                {info.notes}
                            </div>
                        )}

                        {!info.iban && !info.notes && priceItems.every((item) => !info[item.key as keyof HotelInfoData]) && (
                            <p className="text-zinc-500 text-sm text-center py-4">
                                {t('hotel.noInfo')}{canEdit && ` - ${t('hotel.clickEdit')}`}
                            </p>
                        )}

                        {/* Secret Info Section */}
                        <div className="mt-6 pt-4 border-t border-zinc-800">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                    <h3 className="text-sm font-semibold text-white">{t('hotel.secure.title')}</h3>
                                </div>
                                {isVaultUnlocked ? (
                                    <Button size="sm" variant="ghost" onClick={() => setIsVaultUnlocked(false)}>
                                        <Lock className="w-3 h-3 mr-1" /> Kilitle
                                    </Button>
                                ) : (
                                    <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
                                        {t('hotel.secure.encrypted')}
                                    </Badge>
                                )}
                            </div>

                            {!hotel?.settings?.safe_password ? (
                                isGM ? (
                                    <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/20 space-y-3">
                                        <p className="text-xs text-zinc-400">Henüz kasa şifresi belirlenmemiş. Gözetmen olarak şifre belirleyerek bu alanı kullanmaya başlayabilirsiniz.</p>
                                        <div className="flex gap-2">
                                            <Input
                                                type="password"
                                                placeholder="Güvenli Kasa Şifresi"
                                                value={passwordInput}
                                                onChange={e => setPasswordInput(e.target.value)}
                                                className="h-8 bg-zinc-950 border-zinc-800 text-xs"
                                            />
                                            <Button size="sm" onClick={handleSetSafePassword} disabled={saving}>
                                                Belirle
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-zinc-500 italic">Gözetmen henüz kasa şifresi belirlememiş.</p>
                                )
                            ) : !isVaultUnlocked ? (
                                <div className="flex gap-2">
                                    <Input
                                        type="password"
                                        placeholder={t('hotel.secure.safeCode')}
                                        value={passwordInput}
                                        onChange={e => setPasswordInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                                        className="h-9 bg-zinc-950 border-zinc-800"
                                    />
                                    <Button onClick={handleUnlock}>
                                        <LockOpen className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-zinc-500 font-bold uppercase">{t('hotel.secure.agency')}</label>
                                            <textarea
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 min-h-[60px]"
                                                defaultValue={hotel.settings.secret_info?.agency_logins}
                                                onBlur={e => handleSaveSecret({ agency_logins: e.target.value })}
                                                placeholder="Bcom: user/pass&#10;Expedia: user/pass..."
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-zinc-500 font-bold uppercase">{t('hotel.secure.kbs')}</label>
                                            <textarea
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 min-h-[60px]"
                                                defaultValue={hotel.settings.secret_info?.kbs_logins}
                                                onBlur={e => handleSaveSecret({ kbs_logins: e.target.value })}
                                                placeholder="Tesis Kodu: XXXXX&#10;Şifre: XXXXX..."
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-zinc-500 font-bold uppercase">{t('hotel.secure.other')}</label>
                                            <textarea
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 min-h-[60px]"
                                                defaultValue={hotel.settings.secret_info?.safe_info}
                                                onBlur={e => handleSaveSecret({ safe_info: e.target.value })}
                                                placeholder="Kasa kodu, önemli anahtar yerleri vb..."
                                            />
                                        </div>
                                    </div>
                                    {isGM && (
                                        <div className="pt-2 flex justify-end">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 text-[10px] text-zinc-600 hover:text-rose-400"
                                                onClick={() => {
                                                    if (confirm('Şifreyi sıfırlamak istiyor musunuz?')) {
                                                        updateHotelSettings(hotel.id, { safe_password: '' })
                                                        setIsVaultUnlocked(false)
                                                    }
                                                }}
                                            >
                                                Şifreyi Sıfırla
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </CollapsibleCard>
    )
}