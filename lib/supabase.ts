import { createClient } from '@supabase/supabase-js';
import { Database } from '../types_db'; // We will generate this or use a generic one/any for now

// Use Vite environment variables
// Use Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables. Sync features will be disabled.');
}

// Fallback to prevent app crash if env vars are missing (e.g. build time or misconfiguration)
// The calls will simply fail, but the UI will render.
const url = supabaseUrl || 'https://placeholder.supabase.co';
const key = supabaseAnonKey || 'placeholder-key';

console.log('🔌 Supabase Client Initialized with URL:', url);

export const supabase = createClient(url, key);
