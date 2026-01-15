import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate Supabase configuration
const isValidConfig = supabaseUrl && supabaseAnonKey;

if (!isValidConfig) {
    console.warn('⚠️ Supabase credentials not configured. Please set VITE_SUPABASE_* variables in your .env file.');
    console.warn('Required variables:');
    console.warn('  - VITE_SUPABASE_URL');
    console.warn('  - VITE_SUPABASE_ANON_KEY');
}

// Create Supabase client
export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
);

// Export validation status for components to check
export const isSupabaseConfigured = isValidConfig;

export default supabase;
