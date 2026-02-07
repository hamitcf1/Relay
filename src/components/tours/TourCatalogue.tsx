import { useState, useEffect } from 'react'
import { Map, Plus, Save, Trash2, Calendar, Euro, Loader2, Edit3, X, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTourStore } from '@/stores/tourStore'
import { useSalesStore } from '@/stores/salesStore'
import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { Tour } from '@/types'
import { format } from 'date-fns'

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function TourCatalogue() {
    const { user } = useAuthStore()
    const { hotel } = useHotelStore()
    const { tours, subscribeToTours, addTour, updateTour, deleteTour, loading } = useTourStore()
    const { addSale } = useSalesStore()

    const [isAdding, setIsAdding] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState<Omit<Tour, 'id'>>({
        name: '',
        description: '',
        base_price_eur: 0,
        adult_price: 0,
        child_3_7_price: 0,
        child_0_3_price: 0,
        operating_days: [],
        is_active: true
    })

    // Booking Modal State
    const [bookingTour, setBookingTour] = useState<Tour | null>(null)
    const [bookingType, setBookingType] = useState<'adult' | 'child_3_7' | 'child_0_3'>('adult')
    const [bookingForm, setBookingForm] = useState({
        guest_name: '',
        room_number: '',
        pax: 1,
        date: format(new Date(), 'yyyy-MM-dd'),
        pickup_time: ''
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
            // Reset form
            setFormData({
                name: '',
                description: '',
                base_price_eur: 0,
                adult_price: 0,
                child_3_7_price: 0,
                child_0_3_price: 0,
                operating_days: [],
                is_active: true
            })
        } catch (error) {
            console.error("Save tour error:", error)
        }
    }

    const openBookingModal = (tour: Tour, type: 'adult' | 'child_3_7' | 'child_0_3') => {
        setBookingTour(tour)
        setBookingType(type)
        setBookingForm({
            guest_name: '',
            room_number: '',
            pax: 1,
            date: format(new Date(), 'yyyy-MM-dd'),
            pickup_time: ''
        })
    }

    const confirmBooking = async () => {
        if (!hotel?.id || !user || !bookingTour) return

        let pricePerPax = bookingTour.adult_price
        if (bookingType === 'child_3_7') pricePerPax = bookingTour.child_3_7_price
        if (bookingType === 'child_0_3') pricePerPax = bookingTour.child_0_3_price

        const totalPrice = pricePerPax * bookingForm.pax

        try {
            await addSale(hotel.id, {
                type: 'tour',
                name: `${bookingTour.name} (${bookingType === 'adult' ? 'Adult' : bookingType === 'child_3_7' ? 'Child 3-7' : 'Child 0-3'})`,
                customer_name: bookingForm.guest_name,
                room_number: bookingForm.room_number,
                pax: bookingForm.pax,
                date: new Date(bookingForm.date),
                pickup_time: bookingForm.pickup_time || undefined,
                total_price: totalPrice,
                currency: 'EUR',
                created_by: user.uid,
                created_by_name: user.name,
                notes: `Quick booking from Catalogue`
            })
            setBookingTour(null)
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
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs text-zinc-500 uppercase font-bold flex items-center gap-1">
                                                <Euro className="w-3 h-3 text-indigo-400" /> Base Price (EUR)
                                            </label>
                                            <Input
                                                type="number"
                                                value={formData.base_price_eur}
                                                onChange={e => setFormData(p => ({ ...p, base_price_eur: parseFloat(e.target.value) || 0 }))}
                                                className="bg-zinc-950 border-zinc-800"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs text-zinc-500 uppercase font-bold">Adult Price</label>
                                            <Input
                                                type="number"
                                                value={formData.adult_price}
                                                onChange={e => setFormData(p => ({ ...p, adult_price: parseFloat(e.target.value) || 0 }))}
                                                className="bg-zinc-950 border-zinc-800"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs text-zinc-500 uppercase font-bold text-amber-400">Child (3-7y)</label>
                                            <Input
                                                type="number"
                                                value={formData.child_3_7_price}
                                                onChange={e => setFormData(p => ({ ...p, child_3_7_price: parseFloat(e.target.value) || 0 }))}
                                                className="bg-zinc-950 border-zinc-800"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs text-zinc-500 uppercase font-bold text-emerald-400">Child (0-3y)</label>
                                            <Input
                                                type="number"
                                                value={formData.child_0_3_price}
                                                onChange={e => setFormData(p => ({ ...p, child_0_3_price: parseFloat(e.target.value) || 0 }))}
                                                className="bg-zinc-950 border-zinc-800"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-zinc-500 uppercase font-bold">Operating Days</label>
                                        <div className="flex flex-wrap gap-2">
                                            {DAYS_OF_WEEK.map(day => (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => {
                                                        const days = formData.operating_days.includes(day)
                                                            ? formData.operating_days.filter(d => d !== day)
                                                            : [...formData.operating_days, day]
                                                        setFormData(p => ({ ...p, operating_days: days }))
                                                    }}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                                        formData.operating_days.includes(day)
                                                            ? "bg-indigo-600 text-white"
                                                            : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                                                    )}
                                                >
                                                    {day.slice(0, 3)}
                                                </button>
                                            ))}
                                        </div>
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
                    [...tours].sort((a, b) => a.name.localeCompare(b.name)).map(tour => (
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
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {tour.operating_days.map(day => (
                                            <span key={day} className="text-[9px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded-md font-bold uppercase">
                                                {day.slice(0, 3)}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        <div
                                            onClick={() => openBookingModal(tour, 'adult')}
                                            className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-900 cursor-pointer transition-all group/price"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[10px] text-zinc-500 uppercase font-bold">Adult Price</span>
                                                <Calendar className="w-3 h-3 text-zinc-700 group-hover/price:text-indigo-400 opacity-0 group-hover/price:opacity-100 transition-all" />
                                            </div>
                                            <p className="text-lg font-bold text-white">
                                                €{tour.adult_price.toLocaleString()}
                                                <span className="text-xs text-zinc-500 ml-1 font-normal">(Base: €{tour.base_price_eur})</span>
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div
                                                onClick={() => openBookingModal(tour, 'child_3_7')}
                                                className="p-2.5 bg-zinc-950/50 rounded-xl border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-900 cursor-pointer transition-all group/price"
                                            >
                                                <p className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Child (3-7y)</p>
                                                <p className="text-sm font-bold text-amber-400">€{tour.child_3_7_price}</p>
                                            </div>
                                            <div
                                                onClick={() => openBookingModal(tour, 'child_0_3')}
                                                className="p-2.5 bg-zinc-950/50 rounded-xl border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900 cursor-pointer transition-all group/price"
                                            >
                                                <p className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Child (0-3y)</p>
                                                <p className="text-sm font-bold text-emerald-400">€{tour.child_0_3_price}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-auto pt-4 border-t border-zinc-800/50">
                                        <p className="text-[10px] text-zinc-600 italic text-center">Click a category to log a sale.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))
                )}

                {/* Booking Modal */}
                <Dialog open={!!bookingTour} onOpenChange={(open) => !open && setBookingTour(null)}>
                    <DialogContent className="bg-zinc-950 border-zinc-800">
                        <DialogHeader>
                            <DialogTitle className="text-white">New Booking: {bookingTour?.name}</DialogTitle>
                            <DialogDescription className="text-zinc-500 text-sm">
                                Enter booking details for this tour.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-zinc-500">Guest Name</label>
                                    <Input
                                        value={bookingForm.guest_name}
                                        onChange={e => setBookingForm(p => ({ ...p, guest_name: e.target.value }))}
                                        className="bg-zinc-900 border-zinc-800"
                                        placeholder="Full Name"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-zinc-500">Room #</label>
                                    <Input
                                        value={bookingForm.room_number}
                                        onChange={e => setBookingForm(p => ({ ...p, room_number: e.target.value }))}
                                        className="bg-zinc-900 border-zinc-800"
                                        placeholder="101"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-zinc-500">Pax</label>
                                    <Input
                                        type="number"
                                        value={bookingForm.pax}
                                        onChange={e => setBookingForm(p => ({ ...p, pax: parseInt(e.target.value) || 1 }))}
                                        className="bg-zinc-900 border-zinc-800"
                                        min={1}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-zinc-500">Date</label>
                                    <Input
                                        type="date"
                                        value={bookingForm.date}
                                        onChange={e => setBookingForm(p => ({ ...p, date: e.target.value }))}
                                        className="bg-zinc-900 border-zinc-800"
                                    />
                                </div>
                            </div>
                            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                                <p className="text-xs text-indigo-300">
                                    Total Price: <span className="font-bold text-white">€{bookingTour ? (
                                        (bookingType === 'adult' ? bookingTour.adult_price :
                                            bookingType === 'child_3_7' ? bookingTour.child_3_7_price :
                                                bookingTour.child_0_3_price) * bookingForm.pax
                                    ) : 0}</span>
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setBookingTour(null)}>Cancel</Button>
                            <Button className="bg-indigo-600 hover:bg-indigo-500" onClick={confirmBooking} disabled={!bookingForm.guest_name || !bookingForm.room_number}>
                                <Check className="w-4 h-4 mr-1" /> Confirm Booking
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
