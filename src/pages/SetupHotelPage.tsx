import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Hotel, Plus, Building2, MapPin, Loader2, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, doc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'

interface HotelOption {
    id: string
    name: string
    address: string
}

export function SetupHotelPage() {
    const navigate = useNavigate()
    const { user } = useAuthStore()

    const [mode, setMode] = useState<'choose' | 'create'>('choose')
    const [hotels, setHotels] = useState<HotelOption[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedHotel, setSelectedHotel] = useState<string | null>(null)

    // Create hotel form
    const [hotelName, setHotelName] = useState('')
    const [hotelAddress, setHotelAddress] = useState('')
    const [creating, setCreating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Fetch available hotels
    useEffect(() => {
        const fetchHotels = async () => {
            try {
                const hotelsSnap = await getDocs(collection(db, 'hotels'))
                const hotelsList: HotelOption[] = []

                hotelsSnap.forEach((doc) => {
                    const data = doc.data()
                    if (data.info) {
                        hotelsList.push({
                            id: doc.id,
                            name: data.info.name || 'Unnamed Hotel',
                            address: data.info.address || '',
                        })
                    }
                })

                setHotels(hotelsList)
            } catch (err) {
                console.error('Error fetching hotels:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchHotels()
    }, [])

    const handleJoinHotel = async () => {
        if (!selectedHotel || !user) return

        setCreating(true)
        setError(null)

        try {
            // Add user to hotel's staff list
            const hotelRef = doc(db, 'hotels', selectedHotel)
            await updateDoc(hotelRef, {
                staff_list: arrayUnion(user.uid)
            })

            // Update user's assigned hotel
            const userRef = doc(db, 'users', user.uid)
            await updateDoc(userRef, {
                hotel_id: selectedHotel
            })

            // Store in localStorage for quick access
            localStorage.setItem('relay_hotel_id', selectedHotel)

            navigate('/')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to join hotel')
        } finally {
            setCreating(false)
        }
    }

    const handleCreateHotel = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!hotelName.trim() || !user) {
            setError('Please enter a hotel name')
            return
        }

        setCreating(true)
        setError(null)

        try {
            // Generate a simple hotel ID
            const hotelId = hotelName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString(36)

            // Create hotel document
            await setDoc(doc(db, 'hotels', hotelId), {
                info: {
                    name: hotelName.trim(),
                    address: hotelAddress.trim(),
                },
                settings: {
                    kbs_time: '23:00',
                    check_agency_intervals: [9, 12, 15, 18, 21],
                },
                staff_list: [user.uid],
                created_by: user.uid,
                created_at: new Date(),
            })

            // Update user's assigned hotel
            const userRef = doc(db, 'users', user.uid)
            await updateDoc(userRef, {
                hotel_id: hotelId
            })

            // Store in localStorage
            localStorage.setItem('relay_hotel_id', hotelId)

            navigate('/')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create hotel')
        } finally {
            setCreating(false)
        }
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center relative overflow-hidden p-4">
            {/* Background */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    className="absolute w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ top: '10%', left: '10%' }}
                />
                <motion.div
                    className="absolute w-80 h-80 rounded-full bg-purple-500/20 blur-3xl"
                    animate={{ x: [0, -80, 0], y: [0, 80, 0] }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ bottom: '10%', right: '10%' }}
                />
            </div>

            <motion.div
                className="relative z-10 w-full max-w-lg"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="glass rounded-3xl p-8 shadow-2xl">
                    {/* Header */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 glow-primary mb-4">
                            <Hotel className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gradient-primary">Select Your Hotel</h1>
                        <p className="text-zinc-400 mt-1 text-sm text-center">
                            Join an existing hotel or create a new one
                        </p>
                    </div>

                    {/* Mode Tabs */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setMode('choose')}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${mode === 'choose'
                                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500'
                                    : 'text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                                }`}
                        >
                            <Building2 className="w-4 h-4 inline mr-2" />
                            Join Existing
                        </button>
                        <button
                            onClick={() => setMode('create')}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${mode === 'create'
                                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500'
                                    : 'text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                                }`}
                        >
                            <Plus className="w-4 h-4 inline mr-2" />
                            Create New
                        </button>
                    </div>

                    {/* Join Existing Hotel */}
                    {mode === 'choose' && (
                        <div className="space-y-4">
                            {loading ? (
                                <div className="text-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-zinc-500" />
                                    <p className="text-zinc-500 text-sm mt-2">Loading hotels...</p>
                                </div>
                            ) : hotels.length === 0 ? (
                                <div className="text-center py-8">
                                    <Building2 className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                                    <p className="text-zinc-400">No hotels found</p>
                                    <p className="text-zinc-500 text-sm mt-1">Create a new hotel to get started</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
                                        {hotels.map((hotel) => (
                                            <Card
                                                key={hotel.id}
                                                className={`cursor-pointer transition-all ${selectedHotel === hotel.id
                                                        ? 'border-indigo-500 bg-indigo-500/10'
                                                        : 'hover:border-zinc-600'
                                                    }`}
                                                onClick={() => setSelectedHotel(hotel.id)}
                                            >
                                                <CardContent className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-zinc-800">
                                                            <Building2 className="w-5 h-5 text-zinc-400" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="font-medium text-zinc-200">{hotel.name}</div>
                                                            {hotel.address && (
                                                                <div className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                                                                    <MapPin className="w-3 h-3" />
                                                                    {hotel.address}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {selectedHotel === hotel.id && (
                                                            <div className="w-4 h-4 rounded-full bg-indigo-500" />
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>

                                    <Button
                                        onClick={handleJoinHotel}
                                        disabled={!selectedHotel || creating}
                                        className="w-full"
                                    >
                                        {creating ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                Join Hotel
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                </>
                            )}
                        </div>
                    )}

                    {/* Create New Hotel */}
                    {mode === 'create' && (
                        <form onSubmit={handleCreateHotel} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm text-zinc-400">Hotel Name</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                    <Input
                                        placeholder="Grand Palace Hotel"
                                        value={hotelName}
                                        onChange={(e) => setHotelName(e.target.value)}
                                        className="pl-11"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm text-zinc-400">
                                    Address <span className="text-zinc-600">(optional)</span>
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                    <Input
                                        placeholder="123 Main Street, City"
                                        value={hotelAddress}
                                        onChange={(e) => setHotelAddress(e.target.value)}
                                        className="pl-11"
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={creating}>
                                {creating ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        Create Hotel
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        </form>
                    )}

                    {/* Error */}
                    {error && (
                        <motion.div
                            className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {error}
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
