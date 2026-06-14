"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Toast } from "@/components/Toast";
import { supabase } from "@/lib/supabase";
import type { Category, Chain, Cost, Project, ProjectPhase, ProjectStatus, QuestLink } from "@/types/project";
import { LogOut, Plus, Save, Search, Trash2, Upload } from "lucide-react";

const categories: Category[] = ["DeFi", "AI", "Layer 2", "Gaming", "SocialFi", "Infra", "Wallet", "NFT", "Bridge", "Restaking", "RWA", "Other"];
const phases: ProjectPhase[] = ["Testnet", "Mainnet", "Both", "Waitlist"];
const statuses: ProjectStatus[] = ["Live", "Trending", "Ended"];
const chains: Chain[] = ["Ethereum", "Optimism", "Arbitrum", "Base", "Solana", "Sui", "Bitcoin", "BNB Chain", "Other"];
const costs: Cost[] = ["Free", "Low Gas", "Paid"];

type AdminSection = "airdrop" | "gaming";
type RedemptionFilter = "pending" | "approved" | "all";


type GamingRedemption = {
  id: string;
  user_id: string;
  user_email: string | null;
  reward_name: string;
  points_cost: number;
  status: "pending" | "approved" | "rejected";
  reward_code: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

type GamingSettings = {
  id: string;
  youtube_short_url: string | null;
  youtube_reward_points: number;
  cpalead_offerwall_url: string | null;
  torox_offerwall_url: string | null;
  updated_at: string;
};

type GamingLedger = {
  id: string;
  user_id: string;
  user_email: string | null;
  points: number;
  source: string;
  task_key: string | null;
  status: "approved" | "pending" | "rejected";
  note: string | null;
  created_at: string;
};

type GamingUser = {
  user_id: string;
  email: string | null;
  created_at: string;
  approved_points: number;
  pending_points: number;
  redemption_count: number;
};

type ManualPointsForm = {
  email: string;
  points: string;
  status: "approved" | "pending" | "rejected";
  note: string;
};

type FormState = {
  id?: string;
  project_name: string;
  x_handle: string;
  funding_musd: string;
  backed_by: string;
  discord_url: string;
  website_url: string;
  claim_airdrop_url: string;
  logo_url: string;
  category: Category;
  phase: ProjectPhase;
  status: ProjectStatus;
  chain: Chain;
  cost: Cost;
  galxe_url: string;
  zealy_url: string;
  guild_url: string;
  portal_url: string;
  summary: string;
  tasks: string;
};

const emptyForm: FormState = {
  project_name: "",
  x_handle: "",
  funding_musd: "",
  backed_by: "",
  discord_url: "",
  website_url: "",
  claim_airdrop_url: "",
  logo_url: "",
  category: "DeFi",
  phase: "Testnet",
  status: "Live",
  chain: "Ethereum",
  cost: "Free",
  galxe_url: "",
  zealy_url: "",
  guild_url: "",
  portal_url: "",
  summary: "",
  tasks: "",
};

function getQuestUrls(project: Project) {
  const links = Array.isArray(project.quest_links) ? project.quest_links : [];
  const get = (platform: string) => links.find((link) => link.platform === platform)?.url || "";

  const fallbackPlatform = project.quest_platform;
  const fallbackUrl = project.quest_url || "";

  return {
    galxe_url: get("Galxe") || (fallbackPlatform === "Galxe" ? fallbackUrl : ""),
    zealy_url: get("Zealy") || (fallbackPlatform === "Zealy" ? fallbackUrl : ""),
    guild_url: get("Guild") || (fallbackPlatform === "Guild" ? fallbackUrl : ""),
    portal_url: get("Portal") || (fallbackPlatform === "Portal" ? fallbackUrl : ""),
  };
}

function buildQuestLinks(form: FormState): QuestLink[] {
  const links: QuestLink[] = [];

  if (form.galxe_url.trim()) links.push({ platform: "Galxe", url: form.galxe_url.trim() });
  if (form.zealy_url.trim()) links.push({ platform: "Zealy", url: form.zealy_url.trim() });
  if (form.guild_url.trim()) links.push({ platform: "Guild", url: form.guild_url.trim() });
  if (form.portal_url.trim()) links.push({ platform: "Portal", url: form.portal_url.trim() });

  return links;
}

export default function AdminPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminSection, setAdminSection] = useState<AdminSection>("airdrop");
  const [redemptionFilter, setRedemptionFilter] = useState<RedemptionFilter>("pending");
  const [redemptions, setRedemptions] = useState<GamingRedemption[]>([]);
  const [redemptionCodes, setRedemptionCodes] = useState<Record<string, string>>({});
  const [gamingSettings, setGamingSettings] = useState<GamingSettings>({ id: "main", youtube_short_url: "", youtube_reward_points: 10, cpalead_offerwall_url: "", torox_offerwall_url: "", updated_at: "" });
  const [gamingLedger, setGamingLedger] = useState<GamingLedger[]>([]);
  const [gamingUsers, setGamingUsers] = useState<GamingUser[]>([]);
  const [gamingSearch, setGamingSearch] = useState("");
  const [manualPoints, setManualPoints] = useState<ManualPointsForm>({ email: "", points: "1000", status: "approved", note: "Manual admin points" });
  const tasksRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.push("/admin/login");
        return;
      }

      const email = data.session.user.email;
      const { data: adminRow, error } = await supabase
        .from("admin_users")
        .select("email")
        .ilike("email", email || "")
        .maybeSingle();

      if (error) {
        setMessage("Admin permission check failed: " + error.message + ". Run admin setup SQL in Supabase.");
        setCheckingAuth(false);
        return;
      }

      if (!adminRow) {
        setMessage("Logged in, but this email is not admin: " + email);
        setCheckingAuth(false);
        return;
      }

      setCheckingAuth(false);
      loadProjects();
      loadRedemptions();
      loadGamingLedger();
      searchGamingUsers();
      loadGamingSettings();
    }

    checkAuth();

    const channel = supabase
      .channel("admin-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => {
        loadProjects(false);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "gaming_redemptions" }, () => {
        loadRedemptions();
        searchGamingUsers();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "gaming_points_ledger" }, () => {
        loadGamingLedger();
        searchGamingUsers();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "gaming_settings" }, () => {
        loadGamingSettings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);


  async function loadGamingSettings() {
    const { data, error } = await supabase
      .from("gaming_settings")
      .select("*")
      .eq("id", "main")
      .maybeSingle();

    if (error || !data) return;

    setGamingSettings(data as GamingSettings);
  }

  async function saveGamingSettings() {
    const points = Math.max(1, Math.floor(Number(gamingSettings.youtube_reward_points || 10)));

    const { error } = await supabase
      .from("gaming_settings")
      .upsert({
        id: "main",
        youtube_short_url: gamingSettings.youtube_short_url?.trim() || "",
        youtube_reward_points: points,
        cpalead_offerwall_url: gamingSettings.cpalead_offerwall_url?.trim() || "",
        torox_offerwall_url: gamingSettings.torox_offerwall_url?.trim() || "",
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });

    if (error) {
      setMessage(error.message);
      return;
    }

    setToast("Gaming settings updated.");
    setTimeout(() => setToast(""), 2600);
    loadGamingSettings();
  }

  async function loadRedemptions() {
    const { data, error } = await supabase
      .from("gaming_redemptions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setRedemptions((data || []) as GamingRedemption[]);
  }

  async function loadGamingLedger() {
    const { data, error } = await supabase
      .from("gaming_points_ledger")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      return;
    }

    setGamingLedger((data || []) as GamingLedger[]);
  }

  async function searchGamingUsers() {
    const { data, error } = await supabase.rpc("admin_search_gaming_users", {
      search_text: gamingSearch.trim() || null,
    });

    if (error) {
      return;
    }

    setGamingUsers((data || []) as GamingUser[]);
  }

  async function addManualGamingPoints() {
    const points = Math.floor(Number(manualPoints.points || 0));
    const email = manualPoints.email.trim().toLowerCase();

    if (!email) {
      setMessage("Enter user email first.");
      return;
    }

    if (!Number.isFinite(points) || points === 0) {
      setMessage("Points cannot be zero.");
      return;
    }

    const { error } = await supabase.rpc("admin_add_gaming_points", {
      target_email: email,
      points_amount: points,
      point_status: manualPoints.status,
      note_text: manualPoints.note.trim() || "Manual admin points",
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setToast("Gaming points updated.");
    setTimeout(() => setToast(""), 2600);
    await Promise.all([loadGamingLedger(), searchGamingUsers()]);
  }

  async function approveRedemption(redemption: GamingRedemption) {
    const code = (redemptionCodes[redemption.id] || "").trim();

    const { error } = await supabase.rpc("admin_approve_gaming_redemption", {
      redemption_id: redemption.id,
      gift_code: code || null,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setToast("Redeem approved and points deducted.");
    setTimeout(() => setToast(""), 2600);
    await Promise.all([loadRedemptions(), loadGamingLedger(), searchGamingUsers()]);
  }

  async function rejectRedemption(redemption: GamingRedemption) {
    const { error } = await supabase.rpc("admin_reject_gaming_redemption", {
      redemption_id: redemption.id,
      reject_note: "Rejected by admin",
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setToast("Redeem rejected.");
    setTimeout(() => setToast(""), 2600);
    await Promise.all([loadRedemptions(), searchGamingUsers()]);
  }


  async function loadProjects(showLoading = false) {
    if (showLoading) setCheckingAuth(true);

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      if (showLoading) setCheckingAuth(false);
      return;
    }

    setProjects((data || []) as Project[]);
    if (showLoading) setCheckingAuth(false);
  }

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function formatTaskText(startTag: string, endTag: string) {
    const textarea = tasksRef.current;
    const value = form.tasks;
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? value.length;
    const selectedText = value.slice(start, end);

    let nextValue = value;
    let selectionStart = start;
    let selectionEnd = end;

    if (!selectedText) {
      const placeholder = "your text";
      nextValue = value.slice(0, start) + startTag + placeholder + endTag + value.slice(end);
      selectionStart = start + startTag.length;
      selectionEnd = selectionStart + placeholder.length;
    } else if (selectedText.startsWith(startTag) && selectedText.endsWith(endTag) && selectedText.length >= startTag.length + endTag.length) {
      const normalText = selectedText.slice(startTag.length, selectedText.length - endTag.length);
      nextValue = value.slice(0, start) + normalText + value.slice(end);
      selectionStart = start;
      selectionEnd = start + normalText.length;
    } else if (value.slice(0, start).endsWith(startTag) && value.slice(end).startsWith(endTag)) {
      const before = value.slice(0, start - startTag.length);
      const after = value.slice(end + endTag.length);
      nextValue = before + selectedText + after;
      selectionStart = start - startTag.length;
      selectionEnd = selectionStart + selectedText.length;
    } else {
      nextValue = value.slice(0, start) + startTag + selectedText + endTag + value.slice(end);
      selectionStart = start + startTag.length;
      selectionEnd = selectionStart + selectedText.length;
    }

    updateForm("tasks", nextValue);

    window.setTimeout(() => {
      const currentTextarea = tasksRef.current;
      if (!currentTextarea) return;

      currentTextarea.focus();
      currentTextarea.setSelectionRange(selectionStart, selectionEnd);
    }, 0);
  }


  function editProject(project: Project) {
    const questUrls = getQuestUrls(project);

    setForm({
      id: project.id,
      project_name: project.project_name,
      x_handle: project.x_handle,
      funding_musd: String(project.funding_musd || ""),
      backed_by: project.backed_by,
      discord_url: project.discord_url || "",
      website_url: project.website_url || "",
      claim_airdrop_url: project.claim_airdrop_url || "",
      logo_url: project.logo_url || "",
      category: project.category,
      phase: project.phase,
      status: project.status,
      chain: project.chain,
      cost: project.cost,
      ...questUrls,
      summary: project.summary || "",
      tasks: (project.tasks || []).join("\n"),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadLogo(file: File) {
    const ext = file.name.split(".").pop() || "png";
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `logos/${safeName}`;

    const { error } = await supabase.storage
      .from("project-logos")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      setMessage(error.message);
      return;
    }

    const { data } = supabase.storage.from("project-logos").getPublicUrl(path);
    updateForm("logo_url", data.publicUrl);
    setMessage("Logo uploaded. Now click Save Project.");
  }

  async function saveProject(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const questLinks = buildQuestLinks(form);
    const primaryQuest = questLinks[0];

    const payload = {
      project_name: form.project_name.trim(),
      x_handle: form.x_handle.trim().startsWith("@") ? form.x_handle.trim() : `@${form.x_handle.trim()}`,
      funding_musd: Number(form.funding_musd || 0),
      backed_by: form.backed_by.trim(),
      discord_url: form.discord_url.trim() || null,
      website_url: form.website_url.trim() || null,
      claim_airdrop_url: form.claim_airdrop_url.trim() || null,
      quest_url: primaryQuest?.url || null,
      logo_url: form.logo_url.trim() || null,
      category: form.category,
      phase: form.phase,
      status: form.status,
      quest_platform: primaryQuest?.platform || "None",
      quest_links: questLinks,
      chain: form.chain,
      cost: form.cost,
      summary: form.summary.trim() || null,
      tasks: (() => {
        const lines = form.tasks.replace(/\r\n/g, "\n").split("\n").map((task) => task.trimEnd());

        while (lines.length && !lines[0].trim()) lines.shift();
        while (lines.length && !lines[lines.length - 1].trim()) lines.pop();

        return lines;
      })(),
    };

    const result = form.id
      ? await supabase.from("projects").update(payload).eq("id", form.id).select().single()
      : await supabase.from("projects").insert(payload).select().single();

    setSaving(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    const successMessage = form.id ? "Project updated successfully." : "Project added successfully.";
    setMessage(successMessage);
    setToast(successMessage);
    setTimeout(() => setToast(""), 2600);
    setForm(emptyForm);
    await loadProjects();
  }

  async function deleteProject(id: string) {
    if (!confirm("Delete this project?")) return;

    const { error } = await supabase.from("projects").delete().eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Project deleted.");
    setToast("Project deleted successfully.");
    setTimeout(() => setToast(""), 2600);
    await loadProjects();
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  const filteredProjects = useMemo(() => {
    const text = query.trim().toLowerCase();
    return projects.filter((project) => {
      const searchText = [
        project.project_name,
        project.x_handle,
        project.backed_by,
        project.category,
        project.status,
        project.phase,
        project.quest_platform,
        project.chain,
      ].join(" ").toLowerCase();

      return !text || searchText.includes(text);
    });
  }, [projects, query]);

  const filteredRedemptions = useMemo(() => {
    const text = gamingSearch.trim().toLowerCase();

    return redemptions.filter((item) => {
      const searchText = [
        item.user_email,
        item.user_id,
        item.reward_name,
        item.status,
        item.points_cost,
      ].join(" ").toLowerCase();

      const matchesSearch = !text || searchText.includes(text);
      const matchesStatus = redemptionFilter === "all" || item.status === redemptionFilter;

      return matchesSearch && matchesStatus;
    });
  }, [redemptions, gamingSearch, redemptionFilter]);

  const filteredLedger = useMemo(() => {
    const text = gamingSearch.trim().toLowerCase();

    return gamingLedger.filter((item) => {
      const searchText = [
        item.user_email,
        item.user_id,
        item.points,
        item.source,
        item.status,
        item.note,
        item.created_at,
      ].join(" ").toLowerCase();

      return !text || searchText.includes(text);
    });
  }, [gamingLedger, gamingSearch]);

  if (checkingAuth) {
    return (
      <>
        <Header />
        <main className="app-shell">
          <div className="glass rounded-2xl p-10 text-center text-slate-400">Checking admin session...</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <Toast message={toast} />

      <main className="app-shell">
        <div className="mb-4 flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-stretch">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Admin Dashboard</h1>
            <p className="text-sm text-slate-400">Add, edit, delete projects and upload logos.</p>
          </div>
          <button className="btn btn-ghost" onClick={logout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>

        {message && <div className="glass mb-4 rounded-2xl p-4 text-sm text-cyan-200">{message}</div>}

        <section className="mb-5 flex max-w-full gap-3 overflow-x-auto pb-1">
          <button className={`section-tab ${adminSection === "airdrop" ? "active" : ""}`} onClick={() => setAdminSection("airdrop")}>
            Airdrop Admin
          </button>
          <button className={`section-tab ${adminSection === "gaming" ? "active" : ""}`} onClick={() => setAdminSection("gaming")}>
            Gaming Admin
          </button>
        </section>

        <form onSubmit={saveProject} className="glass mb-6 rounded-3xl p-5 max-sm:rounded-[20px] max-sm:p-4">
          <div className="mb-4 flex items-center gap-2">
            <Plus size={18} className="text-cyan-300" />
            <h2 className="text-lg font-extrabold tracking-tight">{form.id ? "Edit Project" : "Add Project"}</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
            <label className="grid gap-2 text-sm text-slate-300">
              Project name *
              <input className="form-field" value={form.project_name} onChange={(e) => updateForm("project_name", e.target.value)} required />
            </label>

            <label className="grid gap-2 text-sm text-slate-300">
              X handle *
              <input className="form-field" value={form.x_handle} onChange={(e) => updateForm("x_handle", e.target.value)} placeholder="@project" required />
            </label>

            <label className="grid gap-2 text-sm text-slate-300">
              Funding raised, M USD
              <input className="form-field" type="number" min="0" step="0.1" value={form.funding_musd} onChange={(e) => updateForm("funding_musd", e.target.value)} />
            </label>

            <label className="col-span-2 grid gap-2 text-sm text-slate-300 max-md:col-span-1">
              Backed team *
              <input className="form-field" value={form.backed_by} onChange={(e) => updateForm("backed_by", e.target.value)} required />
            </label>

            <SelectField label="Category" value={form.category} options={categories} onChange={(value) => updateForm("category", value as Category)} />
            <SelectField label="Phase" value={form.phase} options={phases} onChange={(value) => updateForm("phase", value as ProjectPhase)} />
            <SelectField label="Status" value={form.status} options={statuses} onChange={(value) => updateForm("status", value as ProjectStatus)} />
            <SelectField label="Chain" value={form.chain} options={chains} onChange={(value) => updateForm("chain", value as Chain)} />
            <SelectField label="Cost" value={form.cost} options={costs} onChange={(value) => updateForm("cost", value as Cost)} />

            <div className="col-span-2 grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-black/10 p-4 max-md:col-span-1 max-md:grid-cols-1">
              <div className="col-span-2 text-sm font-extrabold text-slate-200 max-md:col-span-1">Quest Links — add one or many</div>
              <label className="grid gap-2 text-sm text-slate-300">
                Galxe URL
                <input className="form-field" value={form.galxe_url} onChange={(e) => updateForm("galxe_url", e.target.value)} placeholder="https://app.galxe.com/..." />
              </label>
              <label className="grid gap-2 text-sm text-slate-300">
                Zealy URL
                <input className="form-field" value={form.zealy_url} onChange={(e) => updateForm("zealy_url", e.target.value)} placeholder="https://zealy.io/..." />
              </label>
              <label className="grid gap-2 text-sm text-slate-300">
                Guild URL
                <input className="form-field" value={form.guild_url} onChange={(e) => updateForm("guild_url", e.target.value)} placeholder="https://guild.xyz/..." />
              </label>
              <label className="grid gap-2 text-sm text-slate-300">
                Own Portal URL
                <input className="form-field" value={form.portal_url} onChange={(e) => updateForm("portal_url", e.target.value)} placeholder="https://project.xyz/quest" />
              </label>
            </div>

            <label className="col-span-2 grid gap-2 text-sm text-slate-300 max-md:col-span-1">
              Discord URL
              <input className="form-field" value={form.discord_url} onChange={(e) => updateForm("discord_url", e.target.value)} />
            </label>

            <label className="col-span-2 grid gap-2 text-sm text-slate-300 max-md:col-span-1">
              Website URL
              <input className="form-field" value={form.website_url} onChange={(e) => updateForm("website_url", e.target.value)} placeholder="https://project.xyz" />
            </label>

            <label className="col-span-2 grid gap-2 text-sm text-slate-300 max-md:col-span-1">
              Claim Airdrop URL
              <input className="form-field" value={form.claim_airdrop_url} onChange={(e) => updateForm("claim_airdrop_url", e.target.value)} placeholder="https://project.xyz/claim" />
            </label>

            <label className="col-span-2 grid gap-2 text-sm text-slate-300 max-md:col-span-1">
              Logo Upload
              <div className="flex gap-3 max-sm:flex-col">
                <input
                  className="form-field"
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) uploadLogo(file);
                  }}
                />
                {form.logo_url && (
                  <a href={form.logo_url} target="_blank" rel="noreferrer" className="btn btn-ghost">
                    <Upload size={16} />
                    Open Logo
                  </a>
                )}
              </div>
            </label>

            <label className="col-span-2 grid gap-2 text-sm text-slate-300 max-md:col-span-1">
              Summary
              <textarea className="form-field min-h-[90px]" value={form.summary} onChange={(e) => updateForm("summary", e.target.value)} />
            </label>

            <div className="col-span-2 grid gap-2 text-sm text-slate-300 max-md:col-span-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>Tasks, one per line</span>
                <span className="text-xs text-slate-500">Select text, then click style button</span>
              </div>

              <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/10 p-2">
                <button type="button" className="rounded-xl border border-white/10 bg-white/[.05] px-3 py-2 text-xs font-extrabold text-white hover:bg-white/10" onClick={() => formatTaskText("**", "**")}>
                  Bold
                </button>
                <button type="button" className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-extrabold text-cyan-200 hover:bg-cyan-400/15" onClick={() => formatTaskText("[cyan]", "[/cyan]")}>
                  Cyan
                </button>
                <button type="button" className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-extrabold text-emerald-200 hover:bg-emerald-400/15" onClick={() => formatTaskText("[green]", "[/green]")}>
                  Green
                </button>
                <button type="button" className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs font-extrabold text-amber-200 hover:bg-amber-400/15" onClick={() => formatTaskText("[yellow]", "[/yellow]")}>
                  Yellow
                </button>
                <button type="button" className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs font-extrabold text-red-200 hover:bg-red-400/15" onClick={() => formatTaskText("[red]", "[/red]")}>
                  Red
                </button>
                <button type="button" className="rounded-xl border border-blue-400/20 bg-blue-400/10 px-3 py-2 text-xs font-extrabold text-blue-200 hover:bg-blue-400/15" onClick={() => formatTaskText("[blue]", "[/blue]")}>
                  Blue
                </button>
              </div>

              <textarea
                ref={tasksRef}
                className="form-field min-h-[220px] max-w-full whitespace-pre-wrap break-words"
                value={form.tasks}
                onChange={(e) => updateForm("tasks", e.target.value)}
              />

              <div className="text-xs leading-5 text-slate-500">
                Supported: <b>**bold**</b>, [cyan]text[/cyan], [green]text[/green], [yellow]text[/yellow], [red]text[/red], [blue]text[/blue].
              </div>
            </div>
          </div>

          <div className="mt-5 flex gap-3 max-sm:flex-col">
            <button className="btn" disabled={saving}>
              <Save size={16} />
              {saving ? "Saving..." : "Save Project"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setForm(emptyForm)}>
              Clear
            </button>
          </div>
        </form>

        <section className="glass rounded-3xl p-5 max-sm:rounded-[20px] max-sm:p-4">
          <div className="mb-4 grid grid-cols-[1fr_220px] items-center gap-3 max-sm:grid-cols-1">
            <h2 className="text-lg font-extrabold tracking-tight">Manage Projects</h2>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              <input className="form-field search-field" placeholder="Search admin list..." value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
          </div>

          <div className="grid gap-3">
            {filteredProjects.map((project) => (
              <div key={project.id} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                <div className="flex items-start justify-between gap-4 max-sm:flex-col">
                  <div>
                    <h3 className="font-extrabold tracking-tight">{project.project_name}</h3>
                    <p className="text-sm text-slate-400">{project.x_handle} • {project.phase} • {project.status}</p>
                    <p className="mt-1 text-sm text-slate-500">{project.backed_by}</p>
                  </div>
                  <div className="flex gap-2 max-sm:w-full">
                    <button className="btn btn-ghost max-sm:flex-1" onClick={() => editProject(project)}>Edit</button>
                    <button className="btn btn-danger" onClick={() => deleteProject(project.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>


        <section className="glass mt-6 rounded-3xl p-5 max-sm:rounded-[20px] max-sm:p-4">
          <div className="mb-4">
            <h2 className="text-lg font-extrabold tracking-tight">Gaming Section Settings</h2>
            <p className="text-sm text-slate-400">Update daily YouTube Short link and reward points.</p>
          </div>

          <div className="grid gap-3">
            <div className="grid gap-3 md:grid-cols-[1fr_180px]">
              <label className="grid gap-2 text-sm text-slate-300">
                Daily YouTube Short URL
                <input
                  className="form-field"
                  value={gamingSettings.youtube_short_url || ""}
                  onChange={(event) => setGamingSettings((current) => ({ ...current, youtube_short_url: event.target.value }))}
                  placeholder="https://youtube.com/shorts/..."
                />
              </label>

              <label className="grid gap-2 text-sm text-slate-300">
                Reward Points
                <input
                  className="form-field"
                  type="number"
                  min="1"
                  value={gamingSettings.youtube_reward_points}
                  onChange={(event) => setGamingSettings((current) => ({ ...current, youtube_reward_points: Number(event.target.value || 10) }))}
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm text-slate-300">
              CPAlead Offerwall URL
              <input
                className="form-field"
                value={gamingSettings.cpalead_offerwall_url || ""}
                onChange={(event) => setGamingSettings((current) => ({ ...current, cpalead_offerwall_url: event.target.value }))}
                placeholder="Paste CPAlead offerwall link. Use {USER_ID} or {SUBID} placeholder if needed."
              />
            </label>

            <label className="grid gap-2 text-sm text-slate-300">
              Torox Offerwall URL
              <input
                className="form-field"
                value={gamingSettings.torox_offerwall_url || ""}
                onChange={(event) => setGamingSettings((current) => ({ ...current, torox_offerwall_url: event.target.value }))}
                placeholder="Paste Torox offerwall link. Use {USER_ID} or {SUBID} placeholder if needed."
              />
            </label>

            <button type="button" className="btn w-full" onClick={saveGamingSettings}>Save Gaming Settings</button>
          </div>
        </section>


        <section className="glass mt-6 rounded-3xl p-5 max-sm:rounded-[20px] max-sm:p-4">
          <div className="mb-4">
            <h2 className="text-lg font-extrabold tracking-tight">Gaming Users & Points Control</h2>
            <p className="text-sm text-slate-400">Search any user email, see approved/pending points, requests, and add or cut points.</p>
          </div>

          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              className="form-field"
              value={gamingSearch}
              onChange={(event) => setGamingSearch(event.target.value)}
              placeholder="Search user email, request, source..."
            />
            <button type="button" className="btn btn-ghost" onClick={() => {
              searchGamingUsers();
              loadRedemptions();
              loadGamingLedger();
            }}>
              Search / Refresh
            </button>
          </div>

          <div className="mb-5 grid gap-3 md:grid-cols-[1fr_150px_160px_1fr_auto]">
            <input
              className="form-field"
              value={manualPoints.email}
              onChange={(event) => setManualPoints((current) => ({ ...current, email: event.target.value }))}
              placeholder="User email"
            />
            <input
              className="form-field"
              type="number"
              value={manualPoints.points}
              onChange={(event) => setManualPoints((current) => ({ ...current, points: event.target.value }))}
              placeholder="Points"
            />
            <select
              className="form-field"
              value={manualPoints.status}
              onChange={(event) => setManualPoints((current) => ({ ...current, status: event.target.value as ManualPointsForm["status"] }))}
            >
              <option value="approved">approved</option>
              <option value="pending">pending</option>
              <option value="rejected">rejected</option>
            </select>
            <input
              className="form-field"
              value={manualPoints.note}
              onChange={(event) => setManualPoints((current) => ({ ...current, note: event.target.value }))}
              placeholder="Note"
            />
            <button type="button" className="btn" onClick={addManualGamingPoints}>Add / Cut</button>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {gamingUsers.length ? gamingUsers.slice(0, 9).map((item) => (
              <div key={item.user_id} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                <div className="mb-2 break-all text-sm font-extrabold text-white">{item.email || item.user_id}</div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <span>Approved</span>
                  <b className="text-right text-emerald-300">{item.approved_points}</b>
                  <span>Pending</span>
                  <b className="text-right text-amber-300">{item.pending_points}</b>
                  <span>Requests</span>
                  <b className="text-right text-cyan-300">{item.redemption_count}</b>
                </div>
              </div>
            )) : (
              <div className="rounded-2xl border border-white/10 bg-black/15 p-5 text-sm text-slate-400 lg:col-span-3">
                No users found. Run v41 SQL functions, then search again.
              </div>
            )}
          </div>
        </section>

        <section className="glass mt-6 rounded-3xl p-5 max-sm:rounded-[20px] max-sm:p-4">
          <div className="mb-4 flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-stretch">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Gaming Redeem Requests</h2>
              <p className="text-sm text-slate-400">Pending requests are already cut from user approved points. Reject refunds points; approve keeps them cut.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={`section-tab !px-4 !py-2 ${redemptionFilter === "pending" ? "active" : ""}`} onClick={() => setRedemptionFilter("pending")}>Pending</button>
              <button type="button" className={`section-tab !px-4 !py-2 ${redemptionFilter === "approved" ? "active" : ""}`} onClick={() => setRedemptionFilter("approved")}>Approved</button>
              <button type="button" className={`section-tab !px-4 !py-2 ${redemptionFilter === "all" ? "active" : ""}`} onClick={() => setRedemptionFilter("all")}>All</button>
              <button type="button" className="btn btn-ghost" onClick={loadRedemptions}>Refresh</button>
            </div>
          </div>

          <div className="grid gap-3">
            {filteredRedemptions.length ? filteredRedemptions.map((redemption) => (
              <div key={redemption.id} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="font-extrabold">{redemption.reward_name}</span>
                      <span className={`rounded-lg px-2 py-1 text-xs font-extrabold ${
                        redemption.status === "approved"
                          ? "bg-emerald-400/10 text-emerald-300"
                          : redemption.status === "rejected"
                            ? "bg-red-400/10 text-red-300"
                            : "bg-amber-400/10 text-amber-300"
                      }`}>
                        {redemption.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">User: {redemption.user_email || redemption.user_id}</p>
                    <p className="text-sm text-slate-400">Cost: {redemption.points_cost} points</p>
                    {redemption.reward_code ? (
                      <p className="mt-2 rounded-xl border border-emerald-400/15 bg-emerald-400/10 p-2 text-sm text-emerald-100">
                        Code: <b>{redemption.reward_code}</b>
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-2">
                    <input
                      className="form-field"
                      placeholder="Gift card code"
                      value={redemptionCodes[redemption.id] || ""}
                      onChange={(event) => setRedemptionCodes((current) => ({ ...current, [redemption.id]: event.target.value }))}
                      disabled={redemption.status !== "pending"}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" className="btn" disabled={redemption.status !== "pending"} onClick={() => approveRedemption(redemption)}>
                        Approve
                      </button>
                      <button type="button" className="btn btn-danger" disabled={redemption.status !== "pending"} onClick={() => rejectRedemption(redemption)}>
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="rounded-2xl border border-white/10 bg-black/15 p-5 text-sm text-slate-400">
                No redeem requests yet.
              </div>
            )}
          </div>
        </section>


        <section className="glass mt-6 rounded-3xl p-5 max-sm:rounded-[20px] max-sm:p-4">
          <div className="mb-4 flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-stretch">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Gaming Points Ledger</h2>
              <p className="text-sm text-slate-400">Approved, pending, rejected, manual adjustments, and redeem cuts.</p>
            </div>
            <button type="button" className="btn btn-ghost" onClick={loadGamingLedger}>Refresh</button>
          </div>

          <div className="grid gap-2">
            {filteredLedger.length ? filteredLedger.slice(0, 100).map((item) => (
              <div key={item.id} className="grid gap-2 rounded-2xl border border-white/10 bg-black/15 p-3 text-sm md:grid-cols-[1.1fr_100px_110px_1fr]">
                <div className="break-all">
                  <b>{item.user_email || item.user_id}</b>
                  <div className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</div>
                </div>
                <div className={Number(item.points) >= 0 ? "font-extrabold text-emerald-300" : "font-extrabold text-red-300"}>
                  {Number(item.points) >= 0 ? "+" : ""}{item.points}
                </div>
                <div className={`font-bold ${
                  item.status === "approved"
                    ? "text-emerald-300"
                    : item.status === "pending"
                      ? "text-amber-300"
                      : "text-red-300"
                }`}>
                  {item.status}
                </div>
                <div className="text-slate-400">
                  {item.source} {item.note ? `• ${item.note}` : ""}
                </div>
              </div>
            )) : (
              <div className="rounded-2xl border border-white/10 bg-black/15 p-5 text-sm text-slate-400">
                No ledger rows found.
              </div>
            )}
          </div>
        </section>

          </>
        ) : null}
      </main>
    </>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm text-slate-300">
      {label}
      <select className="form-field" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
