import { useEffect } from 'react'
import { useCurrencyStore } from '@/stores/currencyStore'
import { CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, TrendingUp, DollarSign, Euro, PoundSterling } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CollapsibleCard } from '@/components/dashboard/CollapsibleCard'

export function CurrencyWidget() {
    const { rates, loading, error, fetchRates, lastUpdated } = useCurrencyStore()

    useEffect(() => {
        // Fetch if not loaded or if data is older than 1 hour
        const oneHour = 60 * 60 * 1000
        if (!rates || (lastUpdated && new Date().getTime() - lastUpdated.getTime() > oneHour)) {
            fetchRates()
        }
    }, [])

    const currencies = [
        { code: 'USD', icon: DollarSign, color: 'text-emerald-400', label: 'USD' },
        { code: 'EUR', icon: Euro, color: 'text-blue-400', label: 'EUR' },
        { code: 'GBP', icon: PoundSterling, color: 'text-purple-400', label: 'GBP' }
    ]

    return (
        <CollapsibleCard
            id="currency-widget"
            title={
                <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    Exchange Rates (TCMB)
                </CardTitle>
            }
            headerActions={
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                        e.stopPropagation()
                        fetchRates()
                    }}
                    disabled={loading}
                    className="h-6 w-6 text-zinc-400 hover:text-white"
                >
                    <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                </Button>
            }
            className="glass border-zinc-800/50"
        >
            <div className="grid grid-cols-3 gap-2 py-1">
                {currencies.map((currency) => {
                    const rate = rates?.[currency.code as keyof typeof rates]
                    const Icon = currency.icon

                    return (
                        <div key={currency.code} className="bg-zinc-900/40 rounded-lg p-2 border border-zinc-800/50 text-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex items-center justify-center gap-1 mb-1">
                                <Icon className={cn("w-3 h-3", currency.color)} />
                                <span className={cn("text-xs font-bold", currency.color)}>{currency.label}</span>
                            </div>

                            {loading && !rates ? (
                                <div className="space-y-1 animate-pulse">
                                    <div className="h-3 w-12 bg-zinc-800 rounded mx-auto" />
                                    <div className="h-2 w-8 bg-zinc-800 rounded mx-auto" />
                                </div>
                            ) : rate ? (
                                <div>
                                    <div className="text-sm font-bold text-zinc-200 tracking-tight">
                                        {rate.selling.toFixed(4)}
                                    </div>
                                    <div className="text-[10px] text-zinc-500">
                                        Buy: {rate.buying.toFixed(4)}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-[10px] text-zinc-500 py-1">
                                    {error ? 'Error' : 'No Data'}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
            {lastUpdated && (
                <div className="text-[9px] text-zinc-600 text-right mt-1 px-1">
                    Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            )}
        </CollapsibleCard>
    )
}

// Re-export for clarity
export default CurrencyWidget
