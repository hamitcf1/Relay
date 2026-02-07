import { useEffect, useState } from 'react'
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

    const [amount, setAmount] = useState<string>('')
    const [selectedCurrency, setSelectedCurrency] = useState<string>('EUR')
    const [conversionType, setConversionType] = useState<'toTRY' | 'fromTRY'>('toTRY')

    const calculateResult = () => {
        if (!amount || isNaN(parseFloat(amount)) || !rates) return null

        const rate = rates[selectedCurrency as keyof typeof rates]
        if (!rate) return null

        const val = parseFloat(amount)

        if (conversionType === 'toTRY') {
            return {
                buying: val * rate.buying,
                selling: val * rate.selling
            }
        } else {
            return {
                buying: val / rate.selling, // Buying foreign means bank sells to you
                selling: val / rate.buying  // Selling foreign means bank buys from you
            }
        }
    }

    const result = calculateResult()

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
            <div className="space-y-4">
                {/* Rates Grid */}
                <div className="grid grid-cols-3 gap-2 py-1">
                    {currencies.map((currency) => {
                        const rate = rates?.[currency.code as keyof typeof rates]
                        const Icon = currency.icon
                        const isSelected = selectedCurrency === currency.code

                        return (
                            <div
                                key={currency.code}
                                onClick={() => setSelectedCurrency(currency.code)}
                                className={cn(
                                    "rounded-lg p-2 border text-center relative overflow-hidden group cursor-pointer transition-all duration-200",
                                    isSelected
                                        ? "bg-zinc-800/80 border-indigo-500/50 shadow-[0_0_15px_-5px_rgba(99,102,241,0.3)]"
                                        : "bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-800/60"
                                )}
                            >
                                <div className={cn(
                                    "absolute inset-0 bg-gradient-to-br transition-opacity",
                                    isSelected ? "from-indigo-500/10 to-transparent opacity-100" : "from-white/5 to-transparent opacity-0 group-hover:opacity-100"
                                )} />

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

                {/* Calculator Section */}
                {rates && (
                    <div className="bg-zinc-900/30 rounded-lg p-3 border border-zinc-800/50 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex gap-1">
                                {currencies.map(c => (
                                    <button
                                        key={c.code}
                                        onClick={() => setSelectedCurrency(c.code)}
                                        className={cn(
                                            "w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-colors border",
                                            selectedCurrency === c.code
                                                ? "bg-indigo-600 text-white border-indigo-500"
                                                : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300"
                                        )}
                                    >
                                        {c.code.charAt(0)}
                                    </button>
                                ))}
                            </div>

                            <div className="flex bg-zinc-900 rounded-md p-0.5 border border-zinc-800">
                                <button
                                    onClick={() => setConversionType('toTRY')}
                                    className={cn("px-2 py-0.5 text-[10px] rounded hover:bg-zinc-800 transition-colors", conversionType === 'toTRY' ? "bg-zinc-800 text-white font-medium" : "text-zinc-500")}
                                >
                                    {selectedCurrency} → TRY
                                </button>
                                <button
                                    onClick={() => setConversionType('fromTRY')}
                                    className={cn("px-2 py-0.5 text-[10px] rounded hover:bg-zinc-800 transition-colors", conversionType === 'fromTRY' ? "bg-zinc-800 text-white font-medium" : "text-zinc-500")}
                                >
                                    TRY → {selectedCurrency}
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Amount"
                                    className="w-full bg-black/40 border border-zinc-800 rounded-md py-1.5 pl-2 pr-12 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                                />
                                <span className="absolute right-2 top-1.5 text-xs font-medium text-zinc-500">
                                    {conversionType === 'toTRY' ? selectedCurrency : 'TRY'}
                                </span>
                            </div>
                        </div>

                        {result && (
                            <div className="grid grid-cols-2 gap-2 text-center">
                                <div className="bg-black/20 rounded p-1.5 border border-zinc-800/30">
                                    <div className="text-[9px] text-zinc-500 mb-0.5">Bank Buys (Bozma)</div>
                                    <div className="text-xs font-mono font-medium text-emerald-400">
                                        {result.buying.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {conversionType === 'toTRY' ? '₺' : selectedCurrency}
                                    </div>
                                </div>
                                <div className="bg-black/20 rounded p-1.5 border border-zinc-800/30">
                                    <div className="text-[9px] text-zinc-500 mb-0.5">Bank Sells (Satış)</div>
                                    <div className="text-xs font-mono font-medium text-rose-400">
                                        {result.selling.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {conversionType === 'toTRY' ? '₺' : selectedCurrency}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
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
