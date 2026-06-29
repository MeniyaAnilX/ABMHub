"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { defaultAdSettings, normalizeAdSettings } from "@/lib/ads";
import { supabase } from "@/lib/supabase";
import type { AdSettings } from "@/types/ad";

type FieldKey = keyof Pick<AdSettings, "home_top_code" | "home_middle_code" | "detail_top_code" | "detail_bottom_code" | "footer_code">;

const codeFields: { key: FieldKey; label: string; help: string }[] = [
  { key: "home_top_code", label: "Home/Main Site Ad Code", help: "Shows once after search/filter. Best for A-ADS verification or main banner." },
  { key: "home_middle_code", label: "Home Cards Middle Ad Code", help: "Shows after 6 project cards when Max Ads Per Page is 2." },
  { key: "detail_top_code", label: "Post/Project Detail Top Ad Code", help: "Shows after summary/intro on project detail pages." },
  { key: "detail_bottom_code", label: "Post/Project Detail Bottom Ad Code", help: "Shows near bottom before disclaimer when Max Ads Per Page is 2." },
  { key: "footer_code", label: "Optional Footer Ad Code", help: "Reserved for future footer placement. Keep empty unless needed." },
];

export function AdminAdsSettings() {
  const [settings, setSettings] = useState<AdSettings>(defaultAdSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("ad_settings")
      .select("*")
      .eq("id", "global")
      .maybeSingle();

    if (error) {
      setMessage("Ads settings table missing or blocked. Run ABMHub_Ads_Settings_SQL_v67.sql in Supabase.");
      setLoading(false);
      return;
    }

    setSettings(normalizeAdSettings(data as Partial<AdSettings> | null));
    setLoading(false);
  }

  function update<K extends keyof AdSettings>(key: K, value: AdSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function saveSettings() {
    setSaving(true);
    setMessage("");

    const payload = {
      ...settings,
      id: "global",
      max_ads_per_page: settings.max_ads_per_page === 1 ? 1 : 2,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("ad_settings")
      .upsert(payload, { onConflict: "id" });

    setSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Ads settings saved successfully.");
  }

  return (
    <section className="glass mb-6 rounded-3xl p-5 max-sm:rounded-[20px] max-sm:p-4">
      <div className="mb-4 flex items-start justify-between gap-3 max-sm:flex-col">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight">Ads Settings</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">Paste A-ADS, AdSense, iframe or script ad code. Public pages show max 1–2 ads only.</p>
        </div>
        <button type="button" className="btn max-sm:w-full" onClick={saveSettings} disabled={saving || loading}>
          <Save size={16} />
          {saving ? "Saving..." : "Save Ads"}
        </button>
      </div>

      {message ? <div className="mb-4 rounded-2xl border border-cyan-400/15 bg-cyan-400/10 p-3 text-sm text-cyan-100">{message}</div> : null}

      <div className="mb-4 grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/10 p-4 text-sm font-extrabold text-slate-200">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(event) => update("enabled", event.target.checked)}
            className="h-4 w-4 accent-cyan-400"
          />
          Enable Ads On Site
        </label>

        <label className="grid gap-2 text-sm text-slate-300">
          Max Ads Per Page
          <select className="form-field" value={settings.max_ads_per_page} onChange={(event) => update("max_ads_per_page", Number(event.target.value))}>
            <option value={1}>1 ad per page</option>
            <option value={2}>2 ads per page</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4">
        {codeFields.map((field) => (
          <label key={field.key} className="grid gap-2 text-sm text-slate-300">
            <span className="font-extrabold text-slate-200">{field.label}</span>
            <textarea
              className="form-field min-h-[130px] font-mono text-xs leading-5"
              value={settings[field.key]}
              onChange={(event) => update(field.key, event.target.value)}
              placeholder="Paste full ad HTML/iframe/script code here"
            />
            <span className="text-xs leading-relaxed text-slate-500">{field.help}</span>
          </label>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-amber-400/15 bg-amber-400/10 p-4 text-xs leading-6 text-amber-50/80">
        Best setup: keep 1 ad near top and 1 ad inside content. Avoid popups/sticky ads for better UX and ad approval safety.
      </div>
    </section>
  );
}
