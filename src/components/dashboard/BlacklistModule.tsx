import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Ban, Plus, X, User, Phone, MapPin, Users, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CollapsibleCard } from '@/components/dashboard/CollapsibleCard'
import { Badge } from '@/components/ui/badge'

import { useAuthStore } from '@/stores/authStore'
import { useBlacklistStore } from '@/stores/blacklistStore'

interface BlacklistModuleProps {
    hotelId: string
}

export function BlacklistModule({ hotelId }: BlacklistModuleProps) {
    const { user } = useAuthStore()
    const { blacklistedGuests, loading, addBlacklistedGuest, removeBlacklistedGuest } = useBlacklistStore()

    const [isAdding, setIsAdding] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        phone_numbers: '',
        reason: '',
        room_numbers: '',
        related_persons: '',
    })

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!hotelId || !user || !formData.name || !formData.reason) return

        setSubmitting(true)
        try {
            await addBlacklistedGuest(hotelId, {
                name: formData.name,
                surname: formData.surname,
                phone_numbers: formData.phone_numbers.split(',').map(n => n.trim()).filter(Boolean),
                reason: formData.reason,
                room_numbers: formData.room_numbers.split(',').map(n => n.trim()).filter(Boolean),
                related_persons: formData.related_persons,
                created_by: user.uid,
                created_by_name: user.name,
            })
            setIsAdding(false)
            setFormData({
                name: '',
                surname: '',
                phone_numbers: '',
                reason: '',
                room_numbers: '',
                related_persons: '',
            })
        } catch (error) {
            console.error('Error adding blacklisted guest:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (guestId: string) => {
        if (!hotelId || !user) return
        if (confirm('Are you sure you want to remove this guest from the blacklist?')) {
            try {
                await removeBlacklistedGuest(hotelId, guestId)
            } catch (error) {
                console.error('Error removing guest:', error)
            }
        }
    }

    return (
        <CollapsibleCard
            id="blacklist"
            title={
                <div className="flex items-center gap-2">
                    <Ban className="w-5 h-5 text-red-500" />
                    <span className="font-semibold text-lg text-red-500">Blacklisted Guests</span>
                </div>
            }
            defaultCollapsed={false}
            headerActions={
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                    onClick={(e) => {
                        e.stopPropagation()
                        setIsAdding(true)
                    }}
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add Guest</span>
                </Button>
            }
        >
            <div className="p-4 flex flex-col gap-4">
                <AnimatePresence>
                    {isAdding && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <form onSubmit={handleAdd} className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 mb-4 space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold text-red-500 flex items-center gap-2">
                                        <Ban className="w-4 h-4" />
                                        Add to Blacklist
                                    </h4>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 rounded-full hover:bg-white/10"
                                        onClick={() => setIsAdding(false)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">First Name *</label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="John"
                                            className="bg-background/50 border-red-500/20 focus-visible:ring-red-500/50"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">Last Name</label>
                                        <Input
                                            value={formData.surname}
                                            onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                                            placeholder="Doe"
                                            className="bg-background/50 border-red-500/20 focus-visible:ring-red-500/50"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Reason *</label>
                                    <Textarea
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                        placeholder="Detailed reason for blacklisting..."
                                        className="bg-background/50 border-red-500/20 focus-visible:ring-red-500/50 min-h-[80px]"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">Phone Number(s)</label>
                                        <Input
                                            value={formData.phone_numbers}
                                            onChange={(e) => setFormData({ ...formData, phone_numbers: e.target.value })}
                                            placeholder="+123..., +456..."
                                            className="bg-background/50 border-red-500/20 focus-visible:ring-red-500/50"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">Room Number(s)</label>
                                        <Input
                                            value={formData.room_numbers}
                                            onChange={(e) => setFormData({ ...formData, room_numbers: e.target.value })}
                                            placeholder="101, 102..."
                                            className="bg-background/50 border-red-500/20 focus-visible:ring-red-500/50"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Related Persons</label>
                                    <Input
                                        value={formData.related_persons}
                                        onChange={(e) => setFormData({ ...formData, related_persons: e.target.value })}
                                        placeholder="Family members or friends..."
                                        className="bg-background/50 border-red-500/20 focus-visible:ring-red-500/50"
                                    />
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button
                                        type="submit"
                                        disabled={submitting || !formData.name || !formData.reason}
                                        className="bg-red-500 hover:bg-red-600 text-white"
                                    >
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add to Blacklist'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {loading ? (
                    <div className="py-8 flex justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : blacklistedGuests.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                        <Ban className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No blacklisted guests.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {blacklistedGuests.map((guest) => (
                            <div key={guest.id} className="p-3 rounded-xl border border-red-500/20 bg-card relative group hover:border-red-500/40 transition-colors">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm text-red-500 flex items-center gap-2">
                                                {guest.name} {guest.surname}
                                            </h4>
                                            <div className="text-[10px] text-muted-foreground">
                                                Added by {guest.created_by_name} • {guest.created_at.toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    {(user?.role === 'gm' || user?.uid === guest.created_by) && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                            onClick={() => handleDelete(guest.id)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>

                                <div className="bg-red-500/5 text-red-400/90 p-2 rounded-lg text-xs leading-relaxed border border-red-500/10 mb-3">
                                    <span className="font-medium text-red-500">Reason:</span> {guest.reason}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {guest.phone_numbers && guest.phone_numbers.length > 0 && (
                                        <Badge variant="outline" className="text-[10px] h-5 py-0 px-2 bg-muted text-muted-foreground border-border flex items-center gap-1">
                                            <Phone className="w-3 h-3" />
                                            {guest.phone_numbers.join(', ')}
                                        </Badge>
                                    )}
                                    {guest.room_numbers && guest.room_numbers.length > 0 && (
                                        <Badge variant="outline" className="text-[10px] h-5 py-0 px-2 bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 font-medium flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {guest.room_numbers.join(', ')}
                                        </Badge>
                                    )}
                                    {guest.related_persons && (
                                        <Badge variant="outline" className="text-[10px] h-5 py-0 px-2 bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 font-medium flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            {guest.related_persons}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </CollapsibleCard>
    )
}
