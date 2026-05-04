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
    connectionSuccessful: boolean | null;
    fetchRates: () => Promise<void>;
}

export const useCurrencyStore = create<CurrencyState>((set) => ({
    rates: null,
    lastUpdated: null,
    loading: false,
    error: null,
    connectionSuccessful: null,
    fetchRates: async () => {
        set({ loading: true, error: null });
        try {
            // Parallel fetch
            const [usdRes, eurRes, gbpRes] = await Promise.all([
                fetch('https://open.er-api.com/v6/latest/USD'),
                fetch('https://open.er-api.com/v6/latest/EUR'),
                fetch('https://open.er-api.com/v6/latest/GBP')
            ]);

            if (!usdRes.ok || !eurRes.ok || !gbpRes.ok) throw new Error("Failed to fetch rates");

            const usdData = await usdRes.json();
            const eurData = await eurRes.json();
            const gbpData = await gbpRes.json();

            const usdRate = usdData.rates.TRY;
            const eurRate = eurData.rates.TRY;
            const gbpRate = gbpData.rates.TRY;

            const SPREAD = 0.005; // 0.5%

            set({
                rates: {
                    USD: {
                        buying: usdRate * (1 - SPREAD),
                        selling: usdRate * (1 + SPREAD)
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
                loading: false,
                connectionSuccessful: true
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
                error: "Using offline rates",
                connectionSuccessful: false
            });
        }
    }
}));
