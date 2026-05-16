// External Supabase client — dedicated to the CRM module.
// Separate from Lovable Cloud (which still powers the public website).
import { createClient } from "@supabase/supabase-js";

const EXTERNAL_SUPABASE_URL = "https://ssekwmvrnbuvayehbzdy.supabase.co";
const EXTERNAL_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzZWt3bXZybmJ1dmF5ZWhiemR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MDM2NTMsImV4cCI6MjA4NjM3OTY1M30.MD2FdrqSDqTXQikCIZ6ZSKY8OltND39oIO_IZezZibg";

export const crmSupabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    storageKey: "crm-auth",
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const EXTERNAL_SUPABASE_PROJECT_URL = EXTERNAL_SUPABASE_URL;
