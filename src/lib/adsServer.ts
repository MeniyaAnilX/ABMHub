import { createClient } from "@supabase/supabase-js";
import { defaultAdSettings, normalizeAdSettings } from "@/lib/ads";
import type { AdSettings } from "@/types/ad";

function createServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables.");
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function getAdSettings(): Promise<AdSettings> {
  try {
    const supabase = createServerSupabase();
    if (!supabase) return defaultAdSettings;

    const { data, error } = await supabase
      .from("ad_settings")
      .select("*")
      .eq("id", "global")
      .maybeSingle();

    if (error) {
      console.error("Ad settings read error:", error.message);
      return defaultAdSettings;
    }

    return normalizeAdSettings(data as Partial<AdSettings> | null);
  } catch (error) {
    console.error("Ad settings server error:", error);
    return defaultAdSettings;
  }
}
