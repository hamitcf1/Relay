interface Env { }

// @ts-ignore
export const onRequest: PagesFunction<Env> = async (context) => {
    const TCMB_URL = 'https://www.tcmb.gov.tr/kurlar/today.xml';

    try {
        const response = await fetch(TCMB_URL);
        if (!response.ok) {
            return new Response(JSON.stringify({ error: 'Failed to fetch from TCMB' }), {
                status: 502,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const xmlText = await response.text();

        // Simple regex parsing to avoid heavy XML parser dependencies in edge function
        const currencies = ['USD', 'EUR', 'GBP'];
        const rates: Record<string, { buying: number, selling: number }> = {};

        currencies.forEach(code => {
            // Regex to find the block for the currency
            // <Currency ... CurrencyCode="USD"> ... <ForexBuying>...</ForexBuying> ... <ForexSelling>...</ForexSelling>
            const currencyBlockRegex = new RegExp(`<Currency[^>]*CurrencyCode="${code}"[^>]*>[\\s\\S]*?<\\/Currency>`, 'i');
            const match = xmlText.match(currencyBlockRegex);

            if (match) {
                const block = match[0];
                const buyingMatch = block.match(/<ForexBuying>([\d.]+)<\/ForexBuying>/);
                const sellingMatch = block.match(/<ForexSelling>([\d.]+)<\/ForexSelling>/);

                if (buyingMatch && sellingMatch) {
                    rates[code] = {
                        buying: parseFloat(buyingMatch[1]),
                        selling: parseFloat(sellingMatch[1])
                    };
                }
            }
        });

        return new Response(JSON.stringify(rates), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
            },
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return new Response(JSON.stringify({ error: 'Internal Server Error', details: errorMessage }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
