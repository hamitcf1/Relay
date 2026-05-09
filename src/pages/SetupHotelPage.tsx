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
                    <div className="w-10 h-10 bg-primary rounded-lg mx-auto flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">{t('setup.title')}</h1>
                    <p className="text-muted-foreground text-sm">{t('setup.subtitle')}</p>
                </div>

                <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg" role="tablist">
                    <button
                        onClick={() => setMode('join')}
                        role="tab"
                        aria-selected={mode === 'join'}
                        className={`py-2 text-sm font-medium rounded-md transition-colors ${mode === 'join' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {t('setup.joinExisting') || 'Join Hotel'}
                    </button>
                    <button
                        onClick={() => setMode('create')}
                        role="tab"
                        aria-selected={mode === 'create'}
                        className={`py-2 text-sm font-medium rounded-md transition-colors ${mode === 'create' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {t('setup.createNew') || 'Create Hotel'}
                    </button>
                </div>

                <Card>
                    <CardContent className="p-6">
                        {mode === 'join' ? (
                            <form onSubmit={handleJoin} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label htmlFor="setup-join-code" className="text-xs font-medium text-muted-foreground">
                                        Hotel Code
                                    </label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                                        <Input
                                            id="setup-join-code"
                                            name="hotelCode"
                                            value={joinCode}
                                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                            placeholder="RELAY-XXXX"
                                            className="pl-9 uppercase font-mono tracking-widest"
                                            maxLength={10}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {t('auth.helper.askManager')}
                                    </p>
                                </div>

                                {error && (
                                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={loading || !joinCode.trim()}
                                    className="w-full"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" aria-hidden="true" />}
                                    {t('setup.joinSuccess') || 'Join Hotel'}
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label htmlFor="setup-hotel-name" className="text-xs font-medium text-muted-foreground">
                                        {t('setup.hotelName')}
                                    </label>
                                    <Input
                                        id="setup-hotel-name"
                                        name="hotelName"
                                        value={hotelName}
                                        onChange={(e) => setHotelName(e.target.value)}
                                        placeholder={t('setup.hotelNamePlaceholder') || 'e.g. Grand Hotel'}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="setup-hotel-address" className="text-xs font-medium text-muted-foreground">
                                        {t('setup.address')} <span className="text-muted-foreground/60">({t('setup.optional')})</span>
                                    </label>
                                    <Input
                                        id="setup-hotel-address"
                                        name="hotelAddress"
                                        value={hotelAddress}
                                        onChange={(e) => setHotelAddress(e.target.value)}
                                        placeholder={t('setup.addressPlaceholder') || 'City, Country'}
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={loading || !hotelName.trim()}
                                    className="w-full"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" aria-hidden="true" />}
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
