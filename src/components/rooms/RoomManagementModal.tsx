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
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Label } from '../ui/label'
import { useRoomStore } from '@/stores/roomStore'
import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { cn } from '@/lib/utils'
import type { Room, RoomStatus, RoomType } from '@/types'

interface RoomManagementModalProps {
    isOpen: boolean
    onClose: () => void
}

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

export function RoomManagementModal({ isOpen, onClose }: RoomManagementModalProps) {
    const { user } = useAuthStore()
    const { hotel } = useHotelStore()
    const hotelId = hotel?.id
    const {
        rooms,
        subscribeToRooms,
        addRoom,
        updateRoomStatus,
        updateRoomOccupancy,
        deleteRoom
    } = useRoomStore()

    const [activeTab, setActiveTab] = useState<'overview' | 'setup'>('overview')
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState<RoomStatus | 'all'>('all')

    // Setup Form State
    const [newRoomNumber, setNewRoomNumber] = useState('')
    const [newRoomType, setNewRoomType] = useState<RoomType>('standard')
    const [newRoomFloor, setNewRoomFloor] = useState('')

    useEffect(() => {
        if (isOpen && hotelId) {
            const unsub = subscribeToRooms(hotelId)
            return () => unsub()
        }
    }, [isOpen, hotelId])

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
                floor: parseInt(newRoomFloor) || 1
            })
            setNewRoomNumber('')
            setNewRoomFloor('')
        } catch (error) {
            console.error(error)
        }
    }

    const toggleOccupancy = async (room: Room) => {
        if (!hotelId) return
        const newOccupancy = room.occupancy === 'vacant' ? 'occupied' : 'vacant'
        // If becoming occupied, maybe auto-set to dirty? Optional rule.
        // For now just toggle.
        await updateRoomOccupancy(hotelId, room.id, newOccupancy)
    }

    const cycleStatus = async (room: Room) => {
        if (!hotelId) return
        // Cycle: Clean -> Dirty -> Inspect -> Clean
        const flow: RoomStatus[] = ['clean', 'dirty', 'inspect', 'dnd']
        const nextIndex = (flow.indexOf(room.status) + 1) % flow.length
        await updateRoomStatus(hotelId, room.id, flow[nextIndex])
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0">
                <div className="p-6 pb-2 border-b border-zinc-800 bg-zinc-900/50">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between text-xl font-bold">
                            <div className="flex items-center gap-2">
                                <BedDouble className="w-6 h-6 text-indigo-400" />
                                Room Management
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as any)} className="mt-6">
                        <TabsList className="bg-zinc-900 border border-zinc-800">
                            <TabsTrigger value="overview">Room Situation</TabsTrigger>
                            {isGM && <TabsTrigger value="setup">Room Setup</TabsTrigger>}
                        </TabsList>
                    </Tabs>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-zinc-950/50">
                    <Tabs value={activeTab} className="h-full">
                        <TabsContent value="overview" className="mt-0 space-y-6 h-full">
                            {/* Filters */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <Input
                                        placeholder="Search room..."
                                        className="pl-9 bg-zinc-950 border-zinc-800 focus:border-indigo-500"
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
                                                "capitalize text-xs h-8 border-zinc-800",
                                                filterStatus === status && status !== 'all' && statusColors[status as RoomStatus]
                                            )}
                                        >
                                            {status}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Matrix Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                <AnimatePresence>
                                    {filteredRooms.map((room) => (
                                        <motion.div
                                            key={room.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className={cn(
                                                "relative group p-4 rounded-xl border transition-all cursor-pointer hover:shadow-lg",
                                                room.occupancy === 'occupied'
                                                    ? "bg-zinc-800/60 border-indigo-500/40 hover:border-indigo-500"
                                                    : "bg-zinc-900 border-zinc-800 hover:border-zinc-600"
                                            )}
                                        >
                                            {/* Header */}
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="text-lg font-bold text-zinc-200">
                                                    {room.number}
                                                </span>
                                                <div
                                                    onClick={(e) => { e.stopPropagation(); toggleOccupancy(room); }}
                                                    className={cn(
                                                        "p-1.5 rounded-full transition-colors",
                                                        room.occupancy === 'occupied'
                                                            ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                                                            : "bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700"
                                                    )}
                                                    title={room.occupancy}
                                                >
                                                    {room.occupancy === 'occupied' ? <User className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5 opacity-50" />}
                                                </div>
                                            </div>

                                            {/* Status Button */}
                                            <Button
                                                variant="ghost"
                                                className={cn(
                                                    "w-full h-8 text-xs font-semibold capitalize justify-start px-2",
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

                                            {/* Type Hint */}
                                            <div className="mt-2 flex justify-end">
                                                <span className="text-[10px] text-zinc-600 uppercase font-medium">{room.type}</span>
                                            </div>

                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {filteredRooms.length === 0 && (
                                <div className="text-center py-12 text-zinc-500">
                                    No rooms found matching your filter.
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="setup" className="mt-0">
                            {!isGM ? (
                                <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                                    <ShieldAlert className="w-12 h-12 mb-4 text-zinc-700" />
                                    <p>Only General Managers can access Room Setup.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <Card className="bg-zinc-900/50 border-zinc-800 p-6">
                                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                            <Plus className="w-5 h-5 text-indigo-400" />
                                            Add New Room
                                        </h3>
                                        <form onSubmit={handleAddRoom} className="flex gap-4 items-end">
                                            <div className="space-y-2 flex-1">
                                                <Label>Room Number</Label>
                                                <Input
                                                    value={newRoomNumber}
                                                    onChange={(e) => setNewRoomNumber(e.target.value)}
                                                    placeholder="e.g. 101"
                                                    className="bg-zinc-950 border-zinc-800"
                                                />
                                            </div>
                                            <div className="space-y-2 w-32">
                                                <Label>Floor</Label>
                                                <Input
                                                    value={newRoomFloor}
                                                    onChange={(e) => setNewRoomFloor(e.target.value)}
                                                    placeholder="1"
                                                    type="number"
                                                    className="bg-zinc-950 border-zinc-800"
                                                />
                                            </div>
                                            <div className="space-y-2 w-48">
                                                <Label>Type</Label>
                                                <Select value={newRoomType} onValueChange={(v: string) => setNewRoomType(v as RoomType)}>
                                                    <SelectTrigger className="bg-zinc-950 border-zinc-800">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="standard">Standard</SelectItem>
                                                        <SelectItem value="deluxe">Deluxe</SelectItem>
                                                        <SelectItem value="suite">Suite</SelectItem>
                                                        <SelectItem value="family">Family</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button type="submit" disabled={!newRoomNumber} className="bg-indigo-600 hover:bg-indigo-700">
                                                Add Room
                                            </Button>
                                        </form>
                                    </Card>

                                    <div className="rounded-lg border border-zinc-800 overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-zinc-900 text-zinc-400 font-medium">
                                                <tr>
                                                    <th className="p-3 text-left">Room</th>
                                                    <th className="p-3 text-left">Type</th>
                                                    <th className="p-3 text-left">Floor</th>
                                                    <th className="p-3 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-800">
                                                {rooms.map((room) => (
                                                    <tr key={room.id} className="bg-zinc-900/30 hover:bg-zinc-800/50 transition-colors">
                                                        <td className="p-3 font-medium">{room.number}</td>
                                                        <td className="p-3 capitalize text-zinc-400">{room.type}</td>
                                                        <td className="p-3 text-zinc-400">{room.floor}</td>
                                                        <td className="p-3 text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-zinc-500 hover:text-rose-400"
                                                                onClick={() => hotelId && deleteRoom(hotelId, room.id)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {rooms.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="p-8 text-center text-zinc-500">
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
            </DialogContent>
        </Dialog>
    )
}

function Card({ children, className }: { children: React.ReactNode, className?: string }) {
    return <div className={cn("rounded-xl border", className)}>{children}</div>
}
