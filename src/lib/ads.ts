import type { AdSettings } from "@/types/ad";

export const defaultAdSettings: AdSettings = {
  id: "global",
  enabled: false,
  max_ads_per_page: 2,
  home_top_code: "",
  home_middle_code: "",
  detail_top_code: "",
  detail_bottom_code: "",
  footer_code: "",
  updated_at: null,
};

function cleanCode(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function normalizeAdSettings(row: Partial<AdSettings> | null | undefined): AdSettings {
  if (!row) return defaultAdSettings;

  const maxAds = Number(row.max_ads_per_page || 2);

  return {
    id: row.id || "global",
    enabled: Boolean(row.enabled),
    max_ads_per_page: maxAds === 1 ? 1 : 2,
    home_top_code: cleanCode(row.home_top_code),
    home_middle_code: cleanCode(row.home_middle_code),
    detail_top_code: cleanCode(row.detail_top_code),
    detail_bottom_code: cleanCode(row.detail_bottom_code),
    footer_code: cleanCode(row.footer_code),
    updated_at: row.updated_at || null,
  };
}

export function hasAdCode(code: string | null | undefined) {
  return Boolean((code || "").trim());
}
