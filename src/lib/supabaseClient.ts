import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are valid and not the placeholder ones from .env.example
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-id') && 
  supabaseAnonKey && 
  supabaseAnonKey !== 'your-anon-key'
);

// We use a fallback URL to prevent createClient from throwing a "supabaseUrl is required" error 
// during initialization. If not configured, requests will naturally fail but the app won't crash on boot.
const url = isSupabaseConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co';
const key = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key';

export const supabase = createClient(url, key);
