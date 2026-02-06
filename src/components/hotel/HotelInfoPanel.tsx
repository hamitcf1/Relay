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
    X
} from 'lucide-react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
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
                    </div>
                )}
            </div>
        </CollapsibleCard>
    )
}