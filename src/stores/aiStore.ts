import { create } from 'zustand'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Models requested by the user
export type AIModelType =
    | 'gemini-2.5-flash-lite'
    | 'gemini-2.5-flash'
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
    generate: (prompt: string, modelType: AIModelType, task: AITaskType, context?: string) => Promise<string | null>
    clearResult: () => void
}

type AIStore = AIState & AIActions

// API Keys from .env
const API_KEYS = [
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

        if (API_KEYS.length === 0) {
            set({ error: "No API keys configured. Please add VITE_GEMINI_API_KEY_1...9 to .env" })
            return null
        }

        set({ loading: true, error: null })

        try {
            // Pick current key
            const apiKey = API_KEYS[currentKeyIndex]
            const genAI = new GoogleGenerativeAI(apiKey)

            // Map our types to actual Gemini model names
            let officialModel = "gemini-1.5-flash" // Safe default

            if (modelType.includes('flash-lite')) {
                officialModel = "gemini-2.5-flash-lite"
            } else if (modelType.includes('flash')) {
                officialModel = "gemini-2.5-flash"
            } else if (modelType.includes('gemma')) {
                // Map Gemma 3 to Gemma 2 if 3 is not yet available in the SDK
                officialModel = modelType.replace('gemma-3', 'gemma-2')
                if (!officialModel.endsWith('-it')) officialModel += "-it"
            }

            let systemInstruction = SYSTEM_PROMPTS[task]

            // Add Context Injection
            if (context) {
                systemInstruction += `\n\n[HOTEL KNOWLEDGE BASE]\nUse the following information to answer factual questions about the hotel:\n${context}`
            }

            // Add Translation Rule
            systemInstruction += `\n\n[TRANSLATION RULE]\nIf you generate content in any language OTHER than Turkish, you MUST append a Turkish translation at the very bottom.\nUse this format:\n\n[Original Content]\n\n--- TÜRKÇE ÇEVİRİSİ ---\n[Turkish Translation]`

            const model = genAI.getGenerativeModel({
                model: officialModel,
                systemInstruction: systemInstruction
            })

            const result = await model.generateContent(prompt)
            const text = result.response.text()

            // Rotate key for next call
            set({
                result: text,
                loading: false,
                lastUsedModel: modelType,
                currentKeyIndex: (currentKeyIndex + 1) % API_KEYS.length
            })

            return text
        } catch (error: any) {
            console.error('AI Generation Error:', error)

            // Try next key if this one fails (quota?)
            set({
                error: error.message,
                loading: false,
                currentKeyIndex: (currentKeyIndex + 1) % API_KEYS.length
            })
            return null
        }
    }
}))
