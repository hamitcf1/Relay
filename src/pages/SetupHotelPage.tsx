import { useState } from 'react'
import { Building2, KeyRound, Loader2, ArrowRight, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'
import { useHotelStore } from '@/stores/hotelStore'
import { useLanguageStore } from '@/stores/languageStore'

export function SetupHotelPage() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const { t } = useLanguageStore()
    const { joinHotelByCode, createNewHotel } = useHotelStore()

    const [mode, setMode] = useState<'join' | 'create'>('join')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form states
    const [joinCode, setJoinCode] = useState('')
    const [hotelName, setHotelName] = useState('')
    const [hotelAddress, setHotelAddress] = useState('')

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!joinCode.trim() || !user) return

        setLoading(true)
        setError(null)

        try {
            const success = await joinHotelByCode(joinCode.trim().toUpperCase(), user)
            if (success) {
                navigate('/')
            } else {
                setError(t('setup.error.joinFailed') || 'Invalid hotel code')
            }
        } catch (err) {
            setError(t('setup.error.joinFailed'))
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!hotelName.trim() || !user) return

        setLoading(true)
        setError(null)

        try {
            const hotelId = await createNewHotel({
                name: hotelName.trim(),
                address: hotelAddress.trim()
            }, user)

            if (hotelId) {
                navigate('/')
            } else {
                setError(t('setup.error.createFailed'))
            }
        } catch (err) {
            setError(t('setup.error.createFailed'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-primary rounded-xl mx-auto flex items-center justify-center shadow-lg shadow-primary/20">
                        <Building2 className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">{t('setup.title')}</h1>
                    <p className="text-muted-foreground text-sm">{t('setup.subtitle')}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg border border-border">
                    <button
                        onClick={() => setMode('join')}
                        className={`py-2 text-sm font-medium rounded-md transition-all ${mode === 'join' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {t('setup.joinExisting') || 'Join Hotel'}
                    </button>
                    <button
                        onClick={() => setMode('create')}
                        className={`py-2 text-sm font-medium rounded-md transition-all ${mode === 'create' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {t('setup.createNew') || 'Create Hotel'}
                    </button>
                </div>

                <Card className="bg-card border-border">
                    <CardContent className="p-6">
                        {mode === 'join' ? (
                            <form onSubmit={handleJoin} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Hotel Code
                                    </label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            value={joinCode}
                                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                            placeholder="RELAY-XXXX"
                                            className="pl-9 bg-muted/30 border-border text-foreground placeholder:text-muted-foreground uppercase font-mono tracking-widest"
                                            maxLength={10}
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">
                                        Ask your General Manager for the 6-character hotel code.
                                    </p>
                                </div>

                                {error && (
                                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={loading || !joinCode.trim()}
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                                    {t('setup.joinSuccess') || 'Join Hotel'}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        {t('setup.hotelName')}
                                    </label>
                                    <Input
                                        value={hotelName}
                                        onChange={(e) => setHotelName(e.target.value)}
                                        placeholder={t('setup.hotelNamePlaceholder') || 'e.g. Grand Hotel'}
                                        className="bg-muted/30 border-border text-foreground"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        {t('setup.address')} <span className="text-muted-foreground/60 lowercase">({t('setup.optional')})</span>
                                    </label>
                                    <Input
                                        value={hotelAddress}
                                        onChange={(e) => setHotelAddress(e.target.value)}
                                        placeholder={t('setup.addressPlaceholder') || 'City, Country'}
                                        className="bg-muted/30 border-border text-foreground"
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={loading || !hotelName.trim()}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                    {t('setup.createSuccess') || 'Create Hotel'}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
