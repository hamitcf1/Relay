interface Env {
    VITE_OPENAI_API_KEY: string;
    VITE_ANTHROPIC_API_KEY: string;
}

// @ts-ignore
export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const body: any = await request.json();
        const { prompt, modelType, systemInstruction } = body;

        if (!modelType) {
            return new Response(JSON.stringify({ error: 'modelType is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // OpenAI Proxy
        if (modelType.startsWith('gpt-') || modelType.startsWith('o')) {
            const apiKey = env.VITE_OPENAI_API_KEY;
            if (!apiKey) {
                return new Response(JSON.stringify({ error: 'OpenAI API key not configured on server' }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: modelType,
                    messages: [
                        { role: 'system', content: systemInstruction },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errorData: any = await response.json();
                return new Response(JSON.stringify({ error: errorData.error?.message || 'OpenAI request failed' }), {
                    status: response.status,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const data: any = await response.json();
            return new Response(JSON.stringify({ text: data.choices[0].message.content }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Anthropic Proxy
        if (modelType.startsWith('claude-')) {
            const apiKey = env.VITE_ANTHROPIC_API_KEY;
            if (!apiKey) {
                return new Response(JSON.stringify({ error: 'Anthropic API key not configured on server' }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'dangerously-allow-browser': 'true'
                },
                body: JSON.stringify({
                    model: modelType,
                    max_tokens: 4096,
                    system: systemInstruction,
                    messages: [{ role: 'user', content: prompt }]
                })
            });

            if (!response.ok) {
                const errorData: any = await response.json();
                return new Response(JSON.stringify({ error: errorData.error?.message || 'Anthropic request failed' }), {
                    status: response.status,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const data: any = await response.json();
            return new Response(JSON.stringify({ text: data.content[0].text }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ error: 'Unsupported model type for proxy' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: 'Server error', details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
