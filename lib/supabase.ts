import { createClient } from '@supabase/supabase-js';
import { Database } from '../types_db'; // We will generate this or use a generic one/any for now

// Use Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables. Sync features will be disabled.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
