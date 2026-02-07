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
            const response = await fetch('/api/currency');

            // Check if response is JSON (api exists) or HTML (local dev without proxy)
            const contentType = response.headers.get("content-type");
            if (!response.ok || (contentType && contentType.includes("text/html"))) {
                // Fallback for local development or API failure
                console.warn("Currency API not available, using mock data");
                set({
                    rates: {
                        USD: { buying: 36.50, selling: 36.60 },
                        EUR: { buying: 39.20, selling: 39.30 },
                        GBP: { buying: 46.10, selling: 46.20 }
                    },
                    lastUpdated: new Date(),
                    loading: false
                });
                return;
            }

            const data = await response.json();
            set({ rates: data, lastUpdated: new Date(), loading: false });
        } catch (error) {
            console.error('Currency fetch error:', error);
            // Fallback on error too, to prevent UI crash
            set({
                rates: {
                    USD: { buying: 36.50, selling: 36.60 },
                    EUR: { buying: 39.20, selling: 39.30 },
                    GBP: { buying: 46.10, selling: 46.20 }
                },
                lastUpdated: new Date(),
                loading: false
            });
        }
    }
}));
