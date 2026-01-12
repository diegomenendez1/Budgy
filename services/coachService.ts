import { supabase } from '../lib/supabase';

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

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
            console.log('Coach Raw Response:', text);

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
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error loading chat history:', error);
            return [];
        }

        return data.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.created_at)
        }));
    },

    // 3. Create or Get active session (Simple version: always one session per user for now)
    async getActiveSession(userId: string) {
        // Check if user has a session
        const { data, error } = await supabase
            .from('chat_sessions')
            .select('id')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

        if (data) return data.id;

        // Create new if none
        const { data: newSession, error: createError } = await supabase
            .from('chat_sessions')
            .insert({ user_id: userId, title: 'Coach Chat' })
            .select('id')
            .single();

        if (createError) throw createError;
        return newSession.id;
    },

    // 4. Save local message (Optimistic update or fallback)
    async saveMessage(sessionId: string, role: 'user' | 'assistant', content: string) {
        await supabase.from('chat_messages').insert({
            session_id: sessionId,
            role,
            content
        });
    }
};
