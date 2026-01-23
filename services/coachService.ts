// import { supabase } from '../lib/supabase';
import { db } from '../src/db/db';

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
    // 1. Send message to AI (via n8n)
    async sendMessage(userId: string, sessionId: string, message: string, dataPacket: any, privacyMode: boolean = false) {
        if (!N8N_WEBHOOK_URL) {
            throw new Error('CONFIG_ERROR: VITE_N8N_WEBHOOK_URL is missing in .env');
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
                // Robust parsing
                return data.text || data.message || data.output || (typeof data === 'string' ? data : JSON.stringify(data));
            } catch (e) {
                // If response is not JSON (e.g. plain text), return it directly
                return text;
            }
        } catch (error) {
            console.error('Error sending message to Coach:', error);
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


