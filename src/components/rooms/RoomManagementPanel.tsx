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
    Layers,
    CheckSquare,
    Square
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
import { cn } from '@/lib/utils'
import type { Room, RoomStatus, RoomType, BedConfig } from '@/types'

const statusColors: Record<RoomStatus, string> = {
    clean: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    dirty: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    inspect: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    dnd: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
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
        updateMultipleRooms
    } = useRoomStore()

    const [activeTab, setActiveTab] = useState<'overview' | 'setup'>('overview')
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState<RoomStatus | 'all'>('all')

    // Setup Form State
    const [newRoomNumber, setNewRoomNumber] = useState('')
    const [newRoomType, setNewRoomType] = useState<RoomType>('standard')
    const [newRoomFloor, setNewRoomFloor] = useState('')
    const [newRoomBedConfig, setNewRoomBedConfig] = useState<BedConfig>('separated')

    // Bulk Setup State
    const [selectedRoomIds, setSelectedRoomIds] = useState<Set<string>>(new Set())
    const [bulkBedConfig, setBulkBedConfig] = useState<BedConfig>('separated')

    useEffect(() => {
        if (hotelId) {
            const unsub = subscribeToRooms(hotelId)
            return () => unsub()
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
        await updateRoomOccupancy(hotelId, room.id, newOccupancy)
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

    const toggleRoomSelection = (roomId: string) => {
        setSelectedRoomIds(prev => {
            const newSet = new Set(prev)
            if (newSet.has(roomId)) {
                newSet.delete(roomId)
            } else {
                newSet.add(roomId)
            }
            return newSet
        })
    }

    const selectAllStandardRooms = () => {
        const standardRoomIds = rooms.filter(r => r.type === 'standard').map(r => r.id)
        setSelectedRoomIds(new Set(standardRoomIds))
    }

    const clearSelection = () => setSelectedRoomIds(new Set())

    const handleBulkUpdate = async () => {
        if (!hotelId || selectedRoomIds.size === 0) return
        await updateMultipleRooms(hotelId, Array.from(selectedRoomIds), { bed_config: bulkBedConfig })
        clearSelection()
    }

    const standardRooms = rooms.filter(r => r.type === 'standard')

    return (
        <div className="flex flex-col h-full bg-background/50">
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

            <div className="flex-1 min-h-0 bg-background rounded-xl border border-border overflow-hidden flex flex-col">
                <Tabs value={activeTab} className="flex-1 flex flex-col min-h-0">
                    <TabsContent value="overview" className="flex-1 flex flex-col min-h-0 m-0 p-4 sm:p-6 space-y-6 overflow-y-auto">
                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-xl border border-border">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <Input
                                    placeholder="Search room..."
                                    className="pl-9 bg-background border-border focus:border-primary"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
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
                                {filteredRooms.map((room) => (
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
                                                : "bg-card border-border hover:border-primary/50"
                                        )}
                                    >
                                        {/* Header */}
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col">
                                                <span className="text-xl font-bold text-foreground tracking-tight">
                                                    {room.number}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground uppercase font-medium">{roomTypeLabels[room.type]}</span>
                                            </div>
                                            <div className="flex gap-1">
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
                                ))}
                            </AnimatePresence>
                        </div>

                        {filteredRooms.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                No rooms found matching your filter.
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="setup" className="flex-1 overflow-y-auto m-0 p-4 sm:p-6 space-y-6">
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

                                {/* Bulk Setup Section */}
                                <div className="bg-card border border-border rounded-xl p-6">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <Layers className="w-5 h-5 text-primary" />
                                        Bulk Room Setup
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-4">Select standard rooms to update their bed configuration.</p>

                                    <div className="flex gap-2 mb-4">
                                        <Button variant="outline" size="sm" onClick={selectAllStandardRooms} className="border-border">
                                            Select All Standard ({standardRooms.length})
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={clearSelection} disabled={selectedRoomIds.size === 0}>
                                            Clear ({selectedRoomIds.size})
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 mb-4 max-h-48 overflow-y-auto p-2 bg-muted/30 rounded-lg border border-border">
                                        {standardRooms.map(room => (
                                            <button
                                                key={room.id}
                                                onClick={() => toggleRoomSelection(room.id)}
                                                className={cn(
                                                    'p-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1',
                                                    selectedRoomIds.has(room.id)
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                                )}
                                            >
                                                {selectedRoomIds.has(room.id) ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                                                {room.number}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center gap-4">
                                        <div className="space-y-1 w-full sm:w-auto">
                                            <Label className="text-xs text-zinc-500">Bed Configuration</Label>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant={bulkBedConfig === 'separated' ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setBulkBedConfig('separated')}
                                                    className={bulkBedConfig === 'separated' ? 'bg-primary' : 'border-border'}
                                                >
                                                    Ayrık Yataklar
                                                </Button>
                                                <Button
                                                    variant={bulkBedConfig === 'together' ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setBulkBedConfig('together')}
                                                    className={bulkBedConfig === 'together' ? 'bg-primary' : 'border-border'}
                                                >
                                                    Birleşik Yatak
                                                </Button>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={handleBulkUpdate}
                                            disabled={selectedRoomIds.size === 0}
                                            className="bg-emerald-600 hover:bg-emerald-500 sm:ml-auto w-full sm:w-auto"
                                        >
                                            Update {selectedRoomIds.size} Rooms
                                        </Button>
                                    </div>
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
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
