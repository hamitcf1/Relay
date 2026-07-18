import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus,
    Trash2,
    BedDouble,
    User,
    ShieldAlert,
    Sparkles,
    SprayCan,
    Search,
    AlertTriangle,
    KeyRound,
    Package
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useRoomStore } from '@/stores/roomStore'
import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useIncidentStore } from '@/stores/incidentStore'
import { useLanguageStore } from '@/stores/languageStore'
import { cn } from '@/lib/utils'
import type { Room, RoomStatus, RoomType, BedConfig } from '@/types'
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton'
import { IncidentReportModal } from './IncidentReportModal'
import { LoanModal } from './LoanModal'

const statusColors: Record<RoomStatus, string> = {
    clean: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    dirty: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    inspect: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    dnd: 'bg-primary/15 text-primary border-primary/25'
}

const statusLabels: Record<RoomStatus, string> = {
    clean: 'Clean',
    dirty: 'Dirty',
    inspect: 'Inspect',
    dnd: 'DND'
}

const roomTypeLabels: Record<RoomType, string> = {
    standard: 'Standard',
    corner: 'Corner',
    corner_jacuzzi: 'Corner Jakuzzi',
    triple: 'Triple',
    teras_suite: 'Teras Suite'
}

export function RoomManagementPanel() {
    const { user } = useAuthStore()
    const { hotel } = useHotelStore()
    const hotelId = hotel?.id
    const {
        rooms,
        subscribeToRooms,
        addRoom,
        updateRoomStatus,
        updateRoomOccupancy,
        updateRoom,
        deleteRoom,
        resetRoomBorrowables,
    } = useRoomStore()
    const { incidents, subscribeToIncidents } = useIncidentStore()
    const { t } = useLanguageStore()

    const [activeTab, setActiveTab] = useState<'overview' | 'setup'>('overview')
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState<RoomStatus | 'all'>('all')
    const [loanRoomId, setLoanRoomId] = useState<string | null>(null)

    // Setup Form State
    const [newRoomNumber, setNewRoomNumber] = useState('')
    const [newRoomType, setNewRoomType] = useState<RoomType>('standard')
    const [newRoomFloor, setNewRoomFloor] = useState('')
    const [newRoomBedConfig, setNewRoomBedConfig] = useState<BedConfig>('separated')

    // Incident Modal State
    const [reportingRoom, setReportingRoom] = useState<string | null>(null)

    // Checkout-with-borrowables prompt state
    const [checkoutPromptRoomId, setCheckoutPromptRoomId] = useState<string | null>(null)

    useEffect(() => {
        if (hotelId) {
            const unsubRooms = subscribeToRooms(hotelId)
            const unsubIncidents = subscribeToIncidents(hotelId)
            return () => {
                unsubRooms()
                unsubIncidents()
            }
        }
    }, [hotelId])

    const isGM = user?.role === 'gm'

    const filteredRooms = rooms.filter(room => {
        const matchesSearch = room.number.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = filterStatus === 'all' || room.status === filterStatus
        return matchesSearch && matchesStatus
    })

    const handleAddRoom = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!hotelId || !newRoomNumber) return

        try {
            await addRoom(hotelId, {
                number: newRoomNumber,
                type: newRoomType,
                status: 'clean',
                occupancy: 'vacant', // Default to vacant
                floor: parseInt(newRoomFloor) || 1,
                bed_config: newRoomType === 'standard' ? newRoomBedConfig : null
            })
            setNewRoomNumber('')
            setNewRoomFloor('')
            setNewRoomBedConfig('separated')
        } catch (error) {
            console.error(error)
        }
    }

    const toggleOccupancy = async (room: Room) => {
        if (!hotelId) return
        const newOccupancy = room.occupancy === 'vacant' ? 'occupied' : 'vacant'
        // If checking guest out and they still have borrowed items / extra cards, prompt first
        const hasBorrowables = (room.key_card_count ?? 0) > 0 || (room.active_loans ?? []).length > 0
        if (newOccupancy === 'vacant' && hasBorrowables) {
            setCheckoutPromptRoomId(room.id)
            return
        }
        await updateRoomOccupancy(hotelId, room.id, newOccupancy)
    }

    const confirmCheckout = async (clearBorrowables: boolean) => {
        if (!hotelId || !checkoutPromptRoomId) return
        const roomId = checkoutPromptRoomId
        setCheckoutPromptRoomId(null)
        if (clearBorrowables) {
            await resetRoomBorrowables(hotelId, roomId)
        }
        await updateRoomOccupancy(hotelId, roomId, 'vacant')
    }

    const cycleStatus = async (room: Room) => {
        if (!hotelId) return
        const flow: RoomStatus[] = ['clean', 'dirty', 'inspect', 'dnd']
        const nextIndex = (flow.indexOf(room.status) + 1) % flow.length
        await updateRoomStatus(hotelId, room.id, flow[nextIndex])
    }

    const toggleBedConfig = async (room: Room) => {
        if (!hotelId || room.type !== 'standard') return
        const newConfig: BedConfig = room.bed_config === 'together' ? 'separated' : 'together'
        await updateRoom(hotelId, room.id, { bed_config: newConfig })
    }

    return (
        <div className="w-full bg-background/50">
            {/* Header / Tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <BedDouble className="w-6 h-6 text-primary" />
                        Room Management
                    </h2>
                    <p className="text-sm text-muted-foreground">Manage hotel rooms availability and status.</p>
                </div>

                <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as any)} className="w-full sm:w-auto">
                    <TabsList className="bg-muted border border-border w-full sm:w-auto">
                        <TabsTrigger value="overview" className="flex-1 sm:flex-none">Room Situation</TabsTrigger>
                        {isGM && <TabsTrigger value="setup" className="flex-1 sm:flex-none">Room Setup</TabsTrigger>}
                    </TabsList>
                </Tabs>
            </div>

            <div className="rounded-[1.5rem] border-[5px] border-surface-deep bg-card">
                <Tabs value={activeTab}>
                    <TabsContent value="overview" className="relative m-0 space-y-6 p-4 data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-4 sm:p-6 duration-500">
                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-xl border border-border">
                            <div className="relative w-full sm:w-auto max-w-12 focus-within:max-w-full sm:focus-within:max-w-64 transition-[max-width] ease-in-out duration-300 group">
                                <Input
                                    placeholder="Search room..."
                                    className="h-10 w-full rounded-full bg-background border-border text-sm pl-4 pr-10 placeholder:text-transparent focus:placeholder:text-muted-foreground transition-all focus:border-primary"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none group-hover:animate-quacke" />
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                                {(['all', 'clean', 'dirty', 'inspect', 'dnd'] as const).map((status) => (
                                    <Button
                                        key={status}
                                        variant={filterStatus === status ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setFilterStatus(status)}
                                        className={cn(
                                            "capitalize text-xs h-8 border-border",
                                            filterStatus === status && status !== 'all' && statusColors[status as RoomStatus]
                                        )}
                                    >
                                        {status}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Matrix Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                            <AnimatePresence>
                                {filteredRooms.map((room) => {
                                    const roomIncidents = incidents.filter(i => i.room === room.number && i.status === 'pending_payment')
                                    const hasIncident = roomIncidents.length > 0
                                    const keyCardCount = room.key_card_count ?? 0
                                    const loanCount = (room.active_loans ?? []).length
                                    const hasBorrowables = keyCardCount > 0 || loanCount > 0

                                    return (
                                        <motion.div
                                            key={room.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className={cn(
                                                "relative group p-4 rounded-xl border transition-all cursor-pointer hover:shadow-lg flex flex-col gap-3",
                                                room.occupancy === 'occupied'
                                                    ? "bg-primary/5 border-primary/40 hover:border-primary"
                                                    : "bg-card border-border hover:border-primary/50",
                                                hasIncident && "border-rose-500/50"
                                            )}
                                        >
                                            {/* Header */}
                                            <div className="flex justify-between items-start">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xl font-bold text-foreground tracking-tight">
                                                            {room.number}
                                                        </span>
                                                        {hasIncident && (
                                                            <div className="animate-pulse bg-rose-500 w-2 h-2 rounded-full" />
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground uppercase font-medium">{roomTypeLabels[room.type]}</span>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setLoanRoomId(room.id); }}
                                                        className={cn(
                                                            "relative p-1.5 rounded-full transition-all",
                                                            hasBorrowables
                                                                ? "bg-amber-500/15 text-amber-500 hover:bg-amber-500/25"
                                                                : "bg-zinc-800/10 text-zinc-500 hover:bg-zinc-700/10 opacity-0 group-hover:opacity-100"
                                                        )}
                                                        title={t('loans.openDialog')}
                                                    >
                                                        <KeyRound className="w-3.5 h-3.5" />
                                                        {hasBorrowables && (
                                                            <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-1 rounded-full bg-amber-500 text-[9px] font-bold text-amber-950 flex items-center justify-center leading-none">
                                                                {keyCardCount + loanCount}
                                                            </span>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setReportingRoom(room.number); }}
                                                        className="p-1.5 rounded-full bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all opacity-0 group-hover:opacity-100"
                                                        title="Report Incident"
                                                    >
                                                        <AlertTriangle className="w-3.5 h-3.5" />
                                                    </button>
                                                    {room.type === 'standard' && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); toggleBedConfig(room); }}
                                                            className={cn(
                                                                "p-1.5 rounded-full transition-colors",
                                                                room.bed_config === 'together'
                                                                    ? "bg-amber-500/20 text-amber-500"
                                                                    : "bg-zinc-800/10 text-zinc-500 hover:bg-zinc-700/10"
                                                            )}
                                                            title={room.bed_config === 'together' ? 'Birleşik Yatak' : 'Ayrık Yataklar'}
                                                        >
                                                            <BedDouble className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    <div
                                                        onClick={(e) => { e.stopPropagation(); toggleOccupancy(room); }}
                                                        className={cn(
                                                            "p-1.5 rounded-full transition-colors",
                                                            room.occupancy === 'occupied'
                                                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                                                : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                                                        )}
                                                        title={room.occupancy}
                                                    >
                                                        {room.occupancy === 'occupied' ? <User className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5 opacity-50" />}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status Button */}
                                            <Button
                                                variant="ghost"
                                                className={cn(
                                                    "w-full h-8 text-xs font-semibold capitalize justify-start px-2 mt-auto",
                                                    statusColors[room.status]
                                                )}
                                                onClick={() => cycleStatus(room)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {room.status === 'clean' && <Sparkles className="w-3.5 h-3.5" />}
                                                    {room.status === 'dirty' && <SprayCan className="w-3.5 h-3.5" />}
                                                    {room.status === 'inspect' && <Search className="w-3.5 h-3.5" />}
                                                    {room.status === 'dnd' && <ShieldAlert className="w-3.5 h-3.5" />}
                                                    {statusLabels[room.status]}
                                                </div>
                                            </Button>
                                        </motion.div>
                                    )
                                })}
                            </AnimatePresence>
                        </div>
                        
                        <IncidentReportModal
                            isOpen={!!reportingRoom}
                            onClose={() => setReportingRoom(null)}
                            roomNumber={reportingRoom || ''}
                            hotelId={hotelId || ''}
                        />

                        <LoanModal
                            isOpen={!!loanRoomId}
                            onClose={() => setLoanRoomId(null)}
                            room={rooms.find(r => r.id === loanRoomId) || null}
                            hotelId={hotelId || ''}
                        />

                        {checkoutPromptRoomId && (() => {
                            const r = rooms.find(x => x.id === checkoutPromptRoomId)
                            if (!r) return null
                            const cards = r.key_card_count ?? 0
                            const loans = r.active_loans ?? []
                            return (
                                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        className="w-full max-w-md bg-card border border-border shadow-2xl rounded-3xl overflow-hidden"
                                    >
                                        <div className="p-6 border-b border-border/40 bg-muted/20 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                                <KeyRound className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold tracking-tight">{t('loans.checkout.title')}</h3>
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                                                    {t('loans.roomLabel')} {r.number}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="p-6 space-y-4">
                                            <p className="text-sm text-muted-foreground">{t('loans.checkout.body')}</p>
                                            <div className="space-y-2 p-3 rounded-2xl bg-muted/30 border border-border">
                                                {cards > 0 && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <KeyRound className="w-4 h-4 text-amber-500" />
                                                        <span>{t('loans.extraKeyCards')}: <strong>{cards}</strong></span>
                                                    </div>
                                                )}
                                                {loans.map(loan => (
                                                    <div key={loan.id} className="flex items-center gap-2 text-sm">
                                                        <Package className="w-4 h-4 text-primary" />
                                                        <span>{t(`loans.item.${loan.item}` as any)} <strong>x{loan.qty}</strong>{loan.label && <span className="text-muted-foreground italic"> · {loan.label}</span>}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="p-4 bg-muted/10 border-t border-border/40 flex flex-col sm:flex-row gap-2">
                                            <Button variant="ghost" onClick={() => setCheckoutPromptRoomId(null)} className="flex-1 rounded-xl">
                                                Cancel
                                            </Button>
                                            <Button variant="outline" onClick={() => confirmCheckout(false)} className="flex-1 rounded-xl border-border">
                                                {t('loans.checkout.keep')}
                                            </Button>
                                            <Button onClick={() => confirmCheckout(true)} className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500">
                                                <Sparkles className="w-4 h-4 mr-1" />
                                                {t('loans.checkout.clear')}
                                            </Button>
                                        </div>
                                    </motion.div>
                                </div>
                            )
                        })()}


                        {filteredRooms.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                No rooms found matching your filter.
                            </div>
                        )}
                        <ScrollToTopButton />
                    </TabsContent>

                    <TabsContent value="setup" className="relative m-0 space-y-6 p-4 data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-4 sm:p-6 duration-500">
                        {!isGM ? (
                            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                                <ShieldAlert className="w-12 h-12 mb-4 text-zinc-700" />
                                <p>Only General Managers can access Room Setup.</p>
                            </div>
                        ) : (
                            <div className="space-y-6 max-w-5xl mx-auto">
                                <div className="bg-card border border-border rounded-xl p-6">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <Plus className="w-5 h-5 text-primary" />
                                        Add New Room
                                    </h3>
                                    <form onSubmit={handleAddRoom} className="flex flex-wrap gap-4 items-end">
                                        <div className="space-y-2 flex-1 min-w-[120px]">
                                            <Label>Room Number</Label>
                                            <Input
                                                value={newRoomNumber}
                                                onChange={(e) => setNewRoomNumber(e.target.value)}
                                                placeholder="e.g. 101"
                                                className="bg-background border-border"
                                            />
                                        </div>
                                        <div className="space-y-2 w-24">
                                            <Label>Floor</Label>
                                            <Input
                                                value={newRoomFloor}
                                                onChange={(e) => setNewRoomFloor(e.target.value)}
                                                placeholder="1"
                                                type="number"
                                                className="bg-background border-border"
                                            />
                                        </div>
                                        <div className="space-y-2 w-40">
                                            <Label>Type</Label>
                                            <Select value={newRoomType} onValueChange={(v: string) => setNewRoomType(v as RoomType)}>
                                                <SelectTrigger className="bg-background border-border">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="standard">Standard</SelectItem>
                                                    <SelectItem value="corner">Corner</SelectItem>
                                                    <SelectItem value="corner_jacuzzi">Corner Jakuzzi</SelectItem>
                                                    <SelectItem value="triple">Triple</SelectItem>
                                                    <SelectItem value="teras_suite">Teras Suite</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {newRoomType === 'standard' && (
                                            <div className="space-y-2 w-40">
                                                <Label>Bed Config</Label>
                                                <Select value={newRoomBedConfig} onValueChange={(v: string) => setNewRoomBedConfig(v as BedConfig)}>
                                                    <SelectTrigger className="bg-background border-border">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="separated">Ayrık</SelectItem>
                                                        <SelectItem value="together">Birleşik</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                        <Button type="submit" disabled={!newRoomNumber} className="bg-primary hover:bg-primary/90">
                                            Add Room
                                        </Button>
                                    </form>
                                </div>

                                <div className="rounded-xl border border-border overflow-hidden bg-card">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50 text-muted-foreground font-medium">
                                            <tr>
                                                <th className="p-3 text-left">Room</th>
                                                <th className="p-3 text-left">Type</th>
                                                <th className="p-3 text-left">Bed</th>
                                                <th className="p-3 text-left">Floor</th>
                                                <th className="p-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {rooms.map((room) => (
                                                <tr key={room.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="p-3 font-medium">{room.number}</td>
                                                    <td className="p-3 text-muted-foreground">{roomTypeLabels[room.type]}</td>
                                                    <td className="p-3 text-muted-foreground">
                                                        {room.type === 'standard' && room.bed_config && (
                                                            <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                                                                {room.bed_config === 'separated' ? 'Ayrık' : 'Birleşik'}
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-muted-foreground">{room.floor}</td>
                                                    <td className="p-3 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-muted-foreground hover:text-destructive"
                                                            onClick={() => hotelId && deleteRoom(hotelId, room.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {rooms.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                                        No rooms added yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        <ScrollToTopButton />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
