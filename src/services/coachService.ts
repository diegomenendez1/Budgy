// import { supabase } from '../lib/supabase';
import { db } from '../db/db';

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

// Helper to generate UUIDs locally
const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const coachService = {
    // 1. Send message to AI
    async sendMessage(userId: string, sessionId: string, message: string, dataPacket: any, privacyMode: boolean = false, apiKey?: string) {

        // If an API Key is provided, we use direct OpenAI for a 100% local-to-cloud experience without intermediate servers
        if (apiKey) {
            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'gpt-5-mini', // MANDATORY: ALWAYS USE GPT-5 MINI
                        messages: [
                            {
                                role: 'system',
                                content: `Eres Budgy Coach, un asistente financiero experto y cercano operando con GPT-5 Mini. 
                                Analiza los datos del usuario y responde de forma motivadora, sencilla y precisa. Evita tecnicismos innecesarios.
                                Datos actuales: ${JSON.stringify(dataPacket)}
                                Modo Privacidad: ${privacyMode ? 'SÍ (las descripciones están ocultas)' : 'NO'}`
                            },
                            { role: 'user', content: message }
                        ],
                        temperature: 0.7,
                    }),
                });

                if (!response.ok) {
                    const err = await response.json().catch(() => ({ error: { message: "Error desconocido" } }));
                    throw new Error(`OpenAI_GPT5MINI_ERROR: ${err.error?.message || response.statusText}`);
                }

                const data = await response.json();
                return data.choices[0].message.content;
            } catch (error: any) {
                console.error('Error with direct OpenAI Coach (GPT-5 Mini):', error);
                throw error;
            }
        }

        // Fallback or Legacy: Use N8N if no local API key provided
        if (!N8N_WEBHOOK_URL) {
            throw new Error('CONFIG_ERROR: Configura tu API Key en Ajustes o define VITE_N8N_WEBHOOK_URL.');
        }

        const payload = {
            userId,
            sessionId,
            message,
            dataPacket,
            privacyMode
        };

        try {
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`AI_ERROR: ${response.statusText}`);
            }

            const text = await response.text();

            if (!text) {
                return "El asistente recibió tu mensaje pero no envió respuesta (Body vacío). Revisa el nodo Webhook en n8n.";
            }

            try {
                const data = JSON.parse(text);
                return data.text || data.message || data.output || (typeof data === 'string' ? data : JSON.stringify(data));
            } catch (e) {
                return text;
            }
        } catch (error) {
            console.error('Error sending message to Coach via N8N:', error);
            throw error;
        }
    },

    // 2. Load History for a specific session
    async getHistory(sessionId: string): Promise<ChatMessage[]> {
        const messages = await db.chatMessages
            .where('session_id')
            .equals(sessionId)
            .sortBy('created_at');

        return messages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.created_at || Date.now())
        }));
    },

    // 3. Create or Get active session (Simple version: always one session per user for now)
    async getActiveSession(userId: string) {
        // Find most recent session
        const sessions = await db.chatSessions
            .where('user_id')
            .equals(userId)
            .toArray(); // Dexie Sort logic can be tricky with string keys, so sort in memory for now if small

        // Start with latest
        const latestInfo = sessions.sort((a, b) =>
            new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
        )[0];

        if (latestInfo) return latestInfo.id;

        // Create new if none
        const newId = generateUUID();
        await db.chatSessions.add({
            id: newId,
            user_id: userId,
            title: 'Coach Chat',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

        return newId;
    },

    // 4. Save local message (Optimistic update or fallback)
    async saveMessage(sessionId: string, role: 'user' | 'assistant', content: string) {
        await db.chatMessages.add({
            id: generateUUID(),
            session_id: sessionId,
            role,
            content,
            created_at: new Date().toISOString()
        });

        // Update session timestamp
        const session = await db.chatSessions.get(sessionId);
        if (session) {
            await db.chatSessions.put({
                ...session,
                updated_at: new Date().toISOString()
            });
        }
    }
};


