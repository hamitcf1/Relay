import { useState, useEffect } from 'react'
import { Map, Plus, Save, Trash2, Calendar, DollarSign, Euro, PoundSterling, Coins, Loader2, Edit3, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTourStore } from '@/stores/tourStore'
import { useCalendarStore } from '@/stores/calendarStore'
import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Tour, TourPrices } from '@/types'

const CURRENCIES = [
    { code: 'TRY', label: 'Turkish Lira', icon: Coins, color: 'text-rose-400' },
    { code: 'EUR', label: 'Euro', icon: Euro, color: 'text-indigo-400' },
    { code: 'USD', label: 'US Dollar', icon: DollarSign, color: 'text-emerald-400' },
    { code: 'GBP', label: 'British Pound', icon: PoundSterling, color: 'text-amber-400' },
]

export function TourCatalogue() {
    const { user } = useAuthStore()
    const { hotel } = useHotelStore()
    const { tours, subscribeToTours, addTour, updateTour, deleteTour, loading } = useTourStore()
    const { addEvent } = useCalendarStore()

    const [isAdding, setIsAdding] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState<Omit<Tour, 'id'>>({
        name: '',
        description: '',
        prices: { try: 0, eur: 0, usd: 0, gbp: 0 },
        is_active: true
    })

    const isGM = user?.role === 'gm'

    useEffect(() => {
        if (hotel?.id) {
            const unsub = subscribeToTours(hotel.id)
            return () => unsub()
        }
    }, [hotel?.id, subscribeToTours])

    const handleSave = async () => {
        if (!hotel?.id) return
        try {
            if (editingId) {
                await updateTour(hotel.id, editingId, formData)
                setEditingId(null)
            } else {
                await addTour(hotel.id, formData)
                setIsAdding(false)
            }
            setFormData({ name: '', description: '', prices: { try: 0, eur: 0, usd: 0, gbp: 0 }, is_active: true })
        } catch (error) {
            console.error("Save tour error:", error)
        }
    }

    const handleBook = async (tour: Tour, currencyCode: keyof TourPrices) => {
        if (!hotel?.id || !user) return
        const price = tour.prices[currencyCode]

        try {
            await addEvent(hotel.id, {
                type: 'tour',
                title: `Tour: ${tour.name}`,
                description: `Booked by ${user.name}. Price: ${price} ${currencyCode.toUpperCase()}`,
                date: new Date(),
                time: null,
                room_number: null,
                price,
                currency: currencyCode.toUpperCase(),
                created_by: user.uid,
                created_by_name: user.name
            })
            alert(`Tour ${tour.name} added to calendar for tracking!`)
        } catch (error) {
            console.error("Booking error:", error)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Tour Catalogue</h2>
                    <p className="text-zinc-500 text-sm">Browse available tours and track local sales.</p>
                </div>
                {isGM && !isAdding && (
                    <Button onClick={() => setIsAdding(true)} className="bg-indigo-600 hover:bg-indigo-500 gap-2">
                        <Plus className="w-4 h-4" />
                        Add New Tour
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Add/Edit Form */}
                <AnimatePresence>
                    {(isAdding || editingId) && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="col-span-full"
                        >
                            <Card className="bg-zinc-900 border-indigo-500/30">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="text-white">{editingId ? 'Edit Tour' : 'Create New Tour Entry'}</CardTitle>
                                    <Button variant="ghost" size="sm" onClick={() => { setIsAdding(false); setEditingId(null); }}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs text-zinc-500 uppercase font-bold">Tour Name</label>
                                            <Input
                                                value={formData.name}
                                                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                                className="bg-zinc-950 border-zinc-800"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs text-zinc-500 uppercase font-bold">Short Description</label>
                                            <Input
                                                value={formData.description}
                                                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                                className="bg-zinc-950 border-zinc-800"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {CURRENCIES.map(curr => (
                                            <div key={curr.code} className="space-y-2">
                                                <div className="flex items-center gap-1.5">
                                                    <curr.icon className={cn("w-3 h-3", curr.color)} />
                                                    <label className="text-[10px] text-zinc-500 uppercase font-bold">{curr.label}</label>
                                                </div>
                                                <Input
                                                    type="number"
                                                    value={formData.prices[curr.code.toLowerCase() as keyof TourPrices]}
                                                    onChange={e => setFormData(p => ({
                                                        ...p,
                                                        prices: { ...p.prices, [curr.code.toLowerCase()]: parseFloat(e.target.value) || 0 }
                                                    }))}
                                                    className="bg-zinc-950 border-zinc-800"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <Button variant="ghost" onClick={() => { setIsAdding(false); setEditingId(null); }}>Cancel</Button>
                                        <Button className="bg-indigo-600 hover:bg-indigo-500 px-8" onClick={handleSave}>
                                            <Save className="w-4 h-4 mr-2" />
                                            {editingId ? 'Update Tour' : 'Save Tour'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tour List */}
                {loading ? (
                    <div className="col-span-full py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-zinc-800" /></div>
                ) : tours.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-zinc-900/40 rounded-3xl border border-dashed border-zinc-800">
                        <Map className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
                        <p className="text-zinc-500 font-medium">No tours in the catalogue yet.</p>
                        {isGM && <Button variant="link" className="text-indigo-400 mt-2" onClick={() => setIsAdding(true)}>Create the first one</Button>}
                    </div>
                ) : (
                    tours.map(tour => (
                        <motion.div key={tour.id} layout>
                            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all overflow-hidden flex flex-col h-full group">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                                            Local Tour
                                        </Badge>
                                        {isGM && (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 text-zinc-500 hover:text-white"
                                                    onClick={() => {
                                                        setEditingId(tour.id)
                                                        setFormData({ ...tour })
                                                    }}
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 text-zinc-500 hover:text-rose-400"
                                                    onClick={() => hotel?.id && deleteTour(hotel.id, tour.id)}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <CardTitle className="text-zinc-200">{tour.name}</CardTitle>
                                    <CardDescription className="text-xs line-clamp-2">{tour.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-2 flex-1 flex flex-col">
                                    <div className="grid grid-cols-2 gap-2">
                                        {CURRENCIES.map(curr => (
                                            <div
                                                key={curr.code}
                                                onClick={() => handleBook(tour, curr.code.toLowerCase() as keyof TourPrices)}
                                                className="p-2.5 bg-zinc-950/50 rounded-xl border border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-900 cursor-pointer transition-all group/price"
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <curr.icon className={cn("w-3 h-3", curr.color)} />
                                                    <Calendar className="w-3 h-3 text-zinc-700 group-hover/price:text-indigo-400 opacity-0 group-hover/price:opacity-100 transition-all" />
                                                </div>
                                                <p className="text-sm font-bold text-white">
                                                    {tour.prices[curr.code.toLowerCase() as keyof TourPrices]?.toLocaleString()}
                                                    <span className="text-[10px] text-zinc-500 ml-1 font-normal">{curr.code}</span>
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-auto pt-4 border-t border-zinc-800/50">
                                        <p className="text-[10px] text-zinc-600 italic text-center">Click a price to log a sale directly to the calendar.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    )
}
