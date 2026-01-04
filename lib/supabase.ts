import { createClient } from '@supabase/supabase-js';
import { Database } from '../types_db'; // We will generate this or use a generic one/any for now

// Use Vite environment variables
// Use Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase variables not detected via import.meta.env');
}

// Actual connection values
const url = supabaseUrl || 'https://yvahpmjytjsbflauixga.supabase.co';
const key = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2YWhwbWp5dGpzYmZsYXVpeGdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0MDc5MTAsImV4cCI6MjA4Mjk4MzkxMH0.5_6kT41Ybr9oTIftUyOQfQ_4Si-wXoWlagGBtSQiXA0';

console.log('🔌 Supabase Client Initialized with URL:', url);

export const supabase = createClient(url, key);
