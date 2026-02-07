import { create } from 'zustand'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Models requested by the user
export type AIProvider = 'google' | 'openai' | 'anthropic'

export type AIModelType =
    | 'gemini-2.5-flash'
    | 'gemini-3-flash-preview'
    | 'gemini-3-pro-preview'
    | 'gpt-5'
    | 'gpt-5-mini'
    | 'o3'
    | 'o3-mini'
    | 'claude-4.5-sonnet'
    | 'claude-4.5-haiku'
    | 'gemma-3-27b'
    | 'gemma-3-12b'
    | 'gemma-3-4b'
    | 'gemma-3-2b'
    | 'gemma-3-1b'

// Task types for specific prompts
export type AITaskType = 'email' | 'report' | 'review' | 'general'

interface AIState {
    loading: boolean
    result: string | null
    error: string | null
    lastUsedModel: AIModelType
    currentKeyIndex: number
}

interface AIActions {
    generate: (
        prompt: string,
        modelType: AIModelType,
        task: AITaskType,
        context?: string
    ) => Promise<string | null>
    clearResult: () => void
}

type AIStore = AIState & AIActions

// API Keys from .env
const GEMINI_KEYS = [
    import.meta.env.VITE_GEMINI_API_KEY_1,
    import.meta.env.VITE_GEMINI_API_KEY_2,
    import.meta.env.VITE_GEMINI_API_KEY_3,
    import.meta.env.VITE_GEMINI_API_KEY_4,
    import.meta.env.VITE_GEMINI_API_KEY_5,
    import.meta.env.VITE_GEMINI_API_KEY_6,
    import.meta.env.VITE_GEMINI_API_KEY_7,
    import.meta.env.VITE_GEMINI_API_KEY_8,
    import.meta.env.VITE_GEMINI_API_KEY_9,
].filter(Boolean)


// Task-specific system prompts
const SYSTEM_PROMPTS: Record<AITaskType, string> = {
    general: "You are a helpful AI assistant for hotel receptionists. Provide professional, concise, and accurate information.",
    email: "You are a professional hotel receptionist writing an email. Maintain a polite, formal, and helpful tone. Format it as a ready-to-send email.",
    report: "You are writing a formal hotel incident report (Tutanak) in Turkish or English. Use objective language, specify dates/times clearly, and follow official report standards.",
    review: "You are a guest relations manager replying to a review. Be appreciative of positive feedback and professional/empathetic regarding complaints. Always aim to convert the guest back to a happy customer."
}

export const useAIStore = create<AIStore>((set, get) => ({
    loading: false,
    result: null,
    error: null,
    lastUsedModel: 'gemini-2.5-flash',
    currentKeyIndex: 0,

    clearResult: () => set({ result: null, error: null }),

    generate: async (prompt, modelType, task, context?: string) => {
        const { currentKeyIndex } = get()
        set({ loading: true, error: null })

        try {
            let systemInstruction = SYSTEM_PROMPTS[task]
            if (context) {
                systemInstruction += `\n\n[HOTEL KNOWLEDGE BASE]\nUse the following information to answer factual questions about the hotel:\n${context}`
            }
            systemInstruction += `\n\n[TRANSLATION RULE]\nIf you generate content in any language OTHER than Turkish, you MUST append a Turkish translation at the very bottom.\nUse this format:\n\n[Original Content]\n\n--- TÜRKÇE ÇEVİRİSİ ---\n[Turkish Translation]`

            let text = ""

            // OpenAI / Reasoning / Anthropic Models (Using Proxy)
            if (modelType.startsWith('gpt-') || modelType.startsWith('o') || modelType.startsWith('claude-')) {
                const response = await fetch('/api/ai', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt,
                        modelType,
                        systemInstruction
                    })
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.error || "AI Proxy request failed")
                }

                const data = await response.json()
                text = data.text
            }
            // Google Gemini / Gemma Models
            else {
                if (GEMINI_KEYS.length === 0) throw new Error("Gemini API keys not configured in .env")
                const apiKey = GEMINI_KEYS[currentKeyIndex % GEMINI_KEYS.length]
                const genAI = new GoogleGenerativeAI(apiKey)

                let officialModel = "gemini-1.5-flash"
                if (modelType.includes('gemini-3')) officialModel = "gemini-3-flash-preview"
                else if (modelType.includes('gemini-3-pro')) officialModel = "gemini-3-pro-preview"
                else if (modelType.includes('gemini-2.5')) officialModel = "gemini-2.5-flash"
                else if (modelType.startsWith('gemma-3')) {
                    // Map to corresponding gemma-3 model
                    officialModel = modelType
                }

                const model = genAI.getGenerativeModel({
                    model: officialModel,
                    systemInstruction: systemInstruction
                })

                const result = await model.generateContent(prompt)
                text = result.response.text()
            }

            set({
                result: text,
                loading: false,
                lastUsedModel: modelType,
                currentKeyIndex: (currentKeyIndex + 1) % (GEMINI_KEYS.length || 1)
            })

            return text
        } catch (error: any) {
            console.error('AI Generation Error:', error)
            set({
                error: error.message,
                loading: false,
                currentKeyIndex: (currentKeyIndex + 1) % (GEMINI_KEYS.length || 1)
            })
            return null
        }
    }
}))
