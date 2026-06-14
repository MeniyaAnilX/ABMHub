"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Toast } from "@/components/Toast";
import { supabase } from "@/lib/supabase";
import type { Category, Chain, Cost, Project, ProjectPhase, ProjectStatus, QuestLink } from "@/types/project";
import { FileJson, LogOut, Plus, Save, Search, Trash2, Upload } from "lucide-react";

const categories: Category[] = ["DeFi", "AI", "Layer 2", "Gaming", "SocialFi", "Infra", "Wallet", "NFT", "Bridge", "Restaking", "RWA", "Other", "L1", "L2", "ZK", "DEX", "Lending"];
const phases: ProjectPhase[] = ["Testnet", "Mainnet", "Both", "Waitlist"];
const statuses: ProjectStatus[] = ["Live", "Trending", "Ended"];
const chains: Chain[] = ["Ethereum", "Optimism", "Arbitrum", "Base", "Solana", "Sui", "Bitcoin", "Multi", "Polygon", "BNB Chain", "Avalanche", "Other"];
const costs: Cost[] = ["Free", "Low Gas", "Paid"];

type FormState = {
  id?: string;
  project_name: string;
  x_handle: string;
  funding_musd: string;
  backed_by: string;
  discord_url: string;
  website_url: string;
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

type BulkProjectInput = {
  project_name?: string;
  x_handle?: string;
  funding_musd?: number | string;
  backed_by?: string;
  category?: string;
  phase?: string;
  status?: string;
  chain?: string;
  cost?: string;
  galxe_url?: string;
  zealy_url?: string;
  guild_url?: string;
  portal_url?: string;
  discord_url?: string;
  website_url?: string;
  summary?: string;
  tasks?: string[] | string;
};

const emptyForm: FormState = {
  project_name: "",
  x_handle: "",
  funding_musd: "",
  backed_by: "",
  discord_url: "",
  website_url: "",
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

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeXHandle(value: unknown) {
  const text = cleanText(value).replace("https://x.com/", "").replace("https://twitter.com/", "").replace(/^@/, "");
  return text ? `@${text}` : "";
}

function normalizeCategory(value: unknown): Category {
  const text = cleanText(value).toLowerCase();
  if (text === "layer 2" || text === "l2") return "Layer 2";
  if (text === "socialfi") return "SocialFi";
  if (text === "restaking") return "Restaking";
  if (text === "rwa") return "RWA";
  const found = categories.find((item) => item.toLowerCase() === text);
  return found || "Other";
}

function normalizePhase(value: unknown): ProjectPhase {
  const text = cleanText(value).toLowerCase();
  const found = phases.find((item) => item.toLowerCase() === text);
  return found || "Testnet";
}

function normalizeStatus(value: unknown): ProjectStatus {
  const text = cleanText(value).toLowerCase();
  const found = statuses.find((item) => item.toLowerCase() === text);
  return found || "Live";
}

function normalizeChain(value: unknown): Chain {
  const text = cleanText(value).toLowerCase();
  if (!text) return "Other";
  if (text === "multi-chain" || text === "multichain" || text === "multi") return "Multi";
  if (text === "bnb" || text === "bnb chain") return "BNB Chain";
  const found = chains.find((item) => item.toLowerCase() === text);
  return found || "Other";
}

function normalizeCost(value: unknown): Cost {
  const text = cleanText(value).toLowerCase();
  if (text.includes("paid")) return "Paid";
  if (text.includes("low")) return "Low Gas";
  return "Free";
}

function normalizeTasks(value: unknown) {
  if (Array.isArray(value)) return value.map((task) => cleanText(task)).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split("\n")
      .map((task) => task.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean);
  }
  return [];
}


function cleanBulkJsonInput(value: string) {
  let text = value.trim();

  text = text.replace(/^```json\s*/i, "");
  text = text.replace(/^```\s*/i, "");
  text = text.replace(/```\s*$/i, "");
  text = text.trim();

  if (text.toLowerCase().startsWith("json")) {
    text = text.slice(4).trim();
  }

  const firstArray = text.indexOf("[");
  const lastArray = text.lastIndexOf("]");
  const firstObject = text.indexOf("{");
  const lastObject = text.lastIndexOf("}");

  if (firstArray !== -1 && lastArray !== -1 && lastArray > firstArray) {
    return text.slice(firstArray, lastArray + 1);
  }

  if (firstObject !== -1 && lastObject !== -1 && lastObject > firstObject) {
    return text.slice(firstObject, lastObject + 1);
  }

  return text;
}

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

function buildQuestLinksFromBulk(item: BulkProjectInput): QuestLink[] {
  const links: QuestLink[] = [];
  const galxe = cleanText(item.galxe_url);
  const zealy = cleanText(item.zealy_url);
  const guild = cleanText(item.guild_url);
  const portal = cleanText(item.portal_url);

  if (galxe) links.push({ platform: "Galxe", url: galxe });
  if (zealy) links.push({ platform: "Zealy", url: zealy });
  if (guild) links.push({ platform: "Guild", url: guild });
  if (portal) links.push({ platform: "Portal", url: portal });

  return links;
}

function makePayloadFromBulk(item: BulkProjectInput) {
  const questLinks = buildQuestLinksFromBulk(item);
  const primaryQuest = questLinks[0];

  return {
    project_name: cleanText(item.project_name),
    x_handle: normalizeXHandle(item.x_handle),
    funding_musd: Number(item.funding_musd || 0),
    backed_by: cleanText(item.backed_by),
    discord_url: cleanText(item.discord_url) || null,
    website_url: cleanText(item.website_url) || null,
    quest_url: primaryQuest?.url || null,
    logo_url: null,
    category: normalizeCategory(item.category),
    phase: normalizePhase(item.phase),
    status: normalizeStatus(item.status),
    quest_platform: primaryQuest?.platform || "None",
    quest_links: questLinks,
    chain: normalizeChain(item.chain),
    cost: normalizeCost(item.cost),
    summary: cleanText(item.summary) || null,
    tasks: normalizeTasks(item.tasks),
  };
}

export default function AdminPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [bulkJson, setBulkJson] = useState("");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bulkImporting, setBulkImporting] = useState(false);

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
    }

    checkAuth();

    const channel = supabase
      .channel("admin-projects-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => {
        loadProjects(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

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
      tasks: form.tasks.split("\n").map((task) => task.trim()).filter(Boolean),
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

  async function importBulkProjects() {
    setBulkImporting(true);
    setMessage("");

    try {
      const cleanedJson = cleanBulkJsonInput(bulkJson);
      const parsed = JSON.parse(cleanedJson);
      const items: BulkProjectInput[] = Array.isArray(parsed) ? parsed : [parsed];

      if (!items.length) {
        setMessage("No projects found in JSON.");
        setBulkImporting(false);
        return;
      }

      const existingNames = new Set(projects.map((project) => project.project_name.trim().toLowerCase()));
      const validPayloads = [];
      let skipped = 0;

      for (const item of items) {
        const payload = makePayloadFromBulk(item);

        if (!payload.project_name || !payload.x_handle) {
          skipped += 1;
          continue;
        }

        if (existingNames.has(payload.project_name.toLowerCase())) {
          skipped += 1;
          continue;
        }

        existingNames.add(payload.project_name.toLowerCase());
        validPayloads.push(payload);
      }

      if (!validPayloads.length) {
        setMessage(`No valid new projects to import. Skipped ${skipped}. Make sure project_name and x_handle exist.`);
        setBulkImporting(false);
        return;
      }

      const { error } = await supabase.from("projects").insert(validPayloads);

      if (error) {
        setMessage(error.message);
        setBulkImporting(false);
        return;
      }

      const successMessage = `Bulk import complete: ${validPayloads.length} added, ${skipped} skipped.`;
      setMessage(successMessage);
      setToast(successMessage);
      setBulkJson("");
      setTimeout(() => setToast(""), 3000);
      await loadProjects();
    } catch (error) {
      setMessage(error instanceof Error ? `${error.message}. Tip: paste only JSON array/object. Code fences or the word json are now auto-cleaned, but broken commas/brackets still need fixing.` : "Invalid JSON.");
    }

    setBulkImporting(false);
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
            <p className="text-sm text-slate-400">Add, bulk import, edit, delete projects and upload logos.</p>
          </div>
          <button className="btn btn-ghost" onClick={logout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>

        {message && <div className="glass mb-4 rounded-2xl p-4 text-sm text-cyan-200">{message}</div>}

        <section className="glass mb-6 rounded-3xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <FileJson size={18} className="text-cyan-300" />
            <h2 className="text-lg font-extrabold tracking-tight">Bulk Import Projects</h2>
          </div>

          <p className="mb-3 text-sm leading-relaxed text-slate-400">
            Paste Grok JSON array here. Import skips duplicate project names and rows without project name or X handle.
          </p>

          <textarea
            className="form-field min-h-[220px] font-mono text-xs"
            value={bulkJson}
            onChange={(event) => setBulkJson(event.target.value)}
            placeholder='[{"project_name":"Ekiden","x_handle":"ekidenfi","funding_musd":2,"backed_by":"GSR","category":"DeFi","phase":"Testnet","status":"Live","chain":"Canton Network","cost":"Free","portal_url":"https://app.cnt.ekiden.fi/","website_url":"https://ekiden.fi/","summary":"Short summary","tasks":["Connect wallet","Trade testnet"]}]'
          />

          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className="btn" onClick={importBulkProjects} disabled={bulkImporting || !bulkJson.trim()}>
              <FileJson size={16} />
              {bulkImporting ? "Importing..." : "Import JSON"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setBulkJson("")}>
              Clear JSON
            </button>
          </div>
        </section>

        <form onSubmit={saveProject} className="glass mb-6 rounded-3xl p-5">
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
              <input className="form-field" value={form.website_url} onChange={(e) => updateForm("website_url", e.target.value)} />
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

            <label className="col-span-2 grid gap-2 text-sm text-slate-300 max-md:col-span-1">
              Tasks, one per line
              <textarea className="form-field min-h-[110px]" value={form.tasks} onChange={(e) => updateForm("tasks", e.target.value)} />
            </label>
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

        <section className="glass rounded-3xl p-5">
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
                  <div className="flex gap-2">
                    <button className="btn btn-ghost" onClick={() => editProject(project)}>Edit</button>
                    <button className="btn btn-danger" onClick={() => deleteProject(project.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
