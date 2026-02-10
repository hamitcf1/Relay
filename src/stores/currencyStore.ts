import { create } from 'zustand';

interface CurrencyRates {
    USD?: { buying: number; selling: number };
    EUR?: { buying: number; selling: number };
    GBP?: { buying: number; selling: number };
}

interface CurrencyState {
    rates: CurrencyRates | null;
    lastUpdated: Date | null;
    loading: boolean;
    error: string | null;
    fetchRates: () => Promise<void>;
}

export const useCurrencyStore = create<CurrencyState>((set) => ({
    rates: null,
    lastUpdated: null,
    loading: false,
    error: null,
    fetchRates: async () => {
        set({ loading: true, error: null });
        try {
            // Fetch rates against TRY
            // free API: https://api.frankfurter.app/latest?from=TRY&to=USD,EUR,GBP
            // OR fetch from USD, EUR, GBP to TRY.
            // Let's fetch base EUR to get all cross rates if needed, or simpler:
            // Fetch individually to be precise? No, let's fetch base TRY and inverted, or base EUR.
            // Actually, Frankfurter supports 'from'. Let's fetch base 'USD' to get USD->TRY? No, we need multiple bases.
            // Better: Fetch 'from=TRY' and invert values? Or just make 3 requests?
            // 3 requests is safer for accuracy on direct pairs.

            // Parallel fetch
            const [usdRes, eurRes, gbpRes] = await Promise.all([
                fetch('https://api.frankfurter.app/latest?from=USD&to=TRY'),
                fetch('https://api.frankfurter.app/latest?from=EUR&to=TRY'),
                fetch('https://api.frankfurter.app/latest?from=GBP&to=TRY')
            ]);

            if (!usdRes.ok || !eurRes.ok || !gbpRes.ok) throw new Error("Failed to fetch rates");

            const usdData = await usdRes.json();
            const eurData = await eurRes.json();
            const gbpData = await gbpRes.json();

            // Raw mid-market rates
            const usdRate = usdData.rates.TRY;
            const eurRate = eurData.rates.TRY;
            const gbpRate = gbpData.rates.TRY;

            // Apply spread (Bank usually buys lower, sells higher)
            // Buying = We (User) buy from Bank = Bank Sells = higher
            // Selling = We (User) sell to Bank = Bank Buys = lower
            // WAIT - In Turkey "Dolar Alış" means Bank Buying (lower), "Dolar Satış" means Bank Selling (higher).
            // Usually spread is around 1-2% or fixed amount. Let's use 0.5% for "Digital" rates.

            const SPREAD = 0.005; // 0.5%

            set({
                rates: {
                    USD: {
                        buying: usdRate * (1 - SPREAD), // Bank buys low
                        selling: usdRate * (1 + SPREAD) // Bank sells high
                    },
                    EUR: {
                        buying: eurRate * (1 - SPREAD),
                        selling: eurRate * (1 + SPREAD)
                    },
                    GBP: {
                        buying: gbpRate * (1 - SPREAD),
                        selling: gbpRate * (1 + SPREAD)
                    }
                },
                lastUpdated: new Date(),
                loading: false
            });

        } catch (error) {
            console.error('Currency fetch error:', error);
            // Fallback to approximate values if API fails
            set({
                rates: {
                    USD: { buying: 36.50, selling: 36.80 },
                    EUR: { buying: 39.20, selling: 39.50 },
                    GBP: { buying: 46.10, selling: 46.50 }
                },
                lastUpdated: new Date(),
                loading: false,
                error: "Using offline rates"
            });
        }
    }
}));
