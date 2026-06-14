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
  const [redemptions, setRedemptions] = useState<GamingRedemption[]>([]);
  const [redemptionCodes, setRedemptionCodes] = useState<Record<string, string>>({});
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
    }

    checkAuth();

    const channel = supabase
      .channel("admin-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => {
        loadProjects(false);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "gaming_redemptions" }, () => {
        loadRedemptions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);


  async function loadRedemptions() {
    const { data, error } = await supabase
      .from("gaming_redemptions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return;
    }

    setRedemptions((data || []) as GamingRedemption[]);
  }

  async function approveRedemption(redemption: GamingRedemption) {
    const code = (redemptionCodes[redemption.id] || "").trim();

    const { error: updateError } = await supabase
      .from("gaming_redemptions")
      .update({
        status: "approved",
        reward_code: code || null,
        admin_note: "Approved by admin",
        updated_at: new Date().toISOString(),
      })
      .eq("id", redemption.id);

    if (updateError) {
      setMessage(updateError.message);
      return;
    }

    const { error: ledgerError } = await supabase
      .from("gaming_points_ledger")
      .upsert({
        user_id: redemption.user_id,
        user_email: redemption.user_email,
        points: -Math.abs(Number(redemption.points_cost || 0)),
        source: "redeem_spent",
        task_key: `redeem-spent-${redemption.id}`,
        status: "approved",
        note: `${redemption.reward_name} approved`,
      }, { onConflict: "task_key" });

    if (ledgerError) {
      setMessage("Redeem approved, but point deduction failed: " + ledgerError.message);
      return;
    }

    setToast("Redeem approved.");
    setTimeout(() => setToast(""), 2600);
    loadRedemptions();
  }

  async function rejectRedemption(redemption: GamingRedemption) {
    const { error } = await supabase
      .from("gaming_redemptions")
      .update({
        status: "rejected",
        admin_note: "Rejected by admin",
        updated_at: new Date().toISOString(),
      })
      .eq("id", redemption.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setToast("Redeem rejected.");
    setTimeout(() => setToast(""), 2600);
    loadRedemptions();
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
          <div className="mb-4 flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-stretch">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Gaming Redeem Requests</h2>
              <p className="text-sm text-slate-400">Approve only after checking points and giving a real gift card code.</p>
            </div>
            <button type="button" className="btn btn-ghost" onClick={loadRedemptions}>Refresh</button>
          </div>

          <div className="grid gap-3">
            {redemptions.length ? redemptions.map((redemption) => (
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
