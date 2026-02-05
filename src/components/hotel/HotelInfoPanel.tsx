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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface HotelInfoData {
    iban: string
    bank_name: string
    tour_prices: Record<string, number>
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
    tour_prices: {},
    laundry_price: 0,
    transfer_price: 0,
    late_checkout_price: 0,
    extra_bed_price: 0,
    notes: '',
}

export function HotelInfoPanel({ hotelId, canEdit }: HotelInfoPanelProps) {
    const [info, setInfo] = useState<HotelInfoData>(defaultInfo)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editInfo, setEditInfo] = useState<HotelInfoData>(defaultInfo)

    // Fetch hotel info
    useEffect(() => {
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
        { key: 'laundry_price', label: 'Laundry Service', icon: Shirt },
        { key: 'transfer_price', label: 'Airport Transfer', icon: Plane },
        { key: 'late_checkout_price', label: 'Late Checkout', icon: MapPin },
        { key: 'extra_bed_price', label: 'Extra Bed', icon: Settings },
    ]

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-indigo-400" />
                    Hotel Information
                </CardTitle>

                {canEdit && !isEditing && (
                    <Button size="sm" variant="ghost" onClick={handleEdit}>
                        <Edit2 className="w-4 h-4" />
                    </Button>
                )}
            </CardHeader>

            <CardContent>
                {isEditing ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                    >
                        {/* IBAN */}
                        <div className="space-y-2">
                            <label className="text-xs text-zinc-400">Bank IBAN</label>
                            <Input
                                placeholder="TR00 0000 0000 0000 0000 0000 00"
                                value={editInfo.iban}
                                onChange={(e) => setEditInfo((prev) => ({ ...prev, iban: e.target.value }))}
                            />
                        </div>

                        <div>
                            <label className="text-xs text-zinc-400">Bank Name</label>
                            <Input
                                placeholder="e.g. Garanti BBVA"
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
                            <label className="text-xs text-zinc-400">Additional Notes</label>
                            <textarea
                                placeholder="Any other important information..."
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
                                Save
                            </Button>
                            <Button variant="ghost" onClick={handleCancel} size="sm">
                                <X className="w-4 h-4" />
                                Cancel
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
                                    <span className="text-xs text-zinc-400">Bank Account</span>
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
                                No hotel information set{canEdit && ' - Click edit to add'}
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
