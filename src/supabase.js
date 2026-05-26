import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hxhnmaqpuecamiceynqf.supabase.co";

const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4aG5tYXFwdWVjYW1pY2V5bnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzYzNTAsImV4cCI6MjA5NTMxMjM1MH0.khOgSaIBF5m5tYpkIpttikba56WMNklEWPVILF9toMA";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);