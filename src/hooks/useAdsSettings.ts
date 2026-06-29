"use client";

import { useEffect, useState } from "react";
import { defaultAdSettings, normalizeAdSettings } from "@/lib/ads";
import { supabase } from "@/lib/supabase";
import type { AdSettings } from "@/types/ad";

export function useAdsSettings() {
  const [ads, setAds] = useState<AdSettings>(defaultAdSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadAds() {
      const { data, error } = await supabase
        .from("ad_settings")
        .select("*")
        .eq("id", "global")
        .maybeSingle();

      if (!active) return;

      if (!error) {
        setAds(normalizeAdSettings(data as Partial<AdSettings> | null));
      }

      setLoading(false);
    }

    loadAds();

    const channel = supabase
      .channel("public-ad-settings-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "ad_settings" }, () => {
        loadAds();
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { ads, loading };
}
