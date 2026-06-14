"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AuthModal } from "@/components/AuthModal";
import { Header } from "@/components/Header";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectDetails } from "@/components/ProjectDetails";
import { Toast } from "@/components/Toast";
import { supabase } from "@/lib/supabase";
import type { Project } from "@/types/project";
import { Gamepad2, Heart, LineChart, Rocket, Search, Star } from "lucide-react";

type SortMode = "newest" | "az" | "funding";
type Section = "airdrop" | "trading" | "gaming";
type ViewMode = "all" | "favorites";

export default function PublicHomePage() {
  const [section, setSection] = useState<Section>("airdrop");
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("newest");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [authOpen, setAuthOpen] = useState(false);
  const [toast, setToast] = useState("");

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(""), 2400);
  }

  async function loadProjects() {
    setLoading(true);
    setErrorMsg("");

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMsg(error.message);
      setProjects([]);
    } else {
      setProjects((data || []) as Project[]);
    }

    setLoading(false);
  }

  async function loadFavorites(currentUserId: string) {
    const { data, error } = await supabase
      .from("user_favorites")
      .select("project_id")
      .eq("user_id", currentUserId);

    if (!error && data) {
      setFavoriteIds(new Set(data.map((item) => item.project_id as string)));
    }
  }

  useEffect(() => {
    loadProjects();

    supabase.auth.getSession().then(({ data }) => {
      const currentUser = data.session?.user || null;
      setUser(currentUser);
      if (currentUser) loadFavorites(currentUser.id);
    });

    const authListener = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        loadFavorites(currentUser.id);
      } else {
        setFavoriteIds(new Set());
        setViewMode("all");
      }
    });

    const channel = supabase
      .channel("public-projects-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => {
        loadProjects();
      })
      .subscribe();

    return () => {
      authListener.data.subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    showToast("Logged out");
  }

  function openFavoritesView() {
    if (!user) {
      setAuthOpen(true);
      showToast("Sign up or login to view your favorites.");
      return;
    }

    setViewMode("favorites");
  }

  async function toggleFavorite(project: Project) {
    if (!user) {
      setAuthOpen(true);
      showToast("Sign up or login to save favorite projects.");
      return;
    }

    const alreadySaved = favoriteIds.has(project.id);

    if (alreadySaved) {
      setFavoriteIds((current) => {
        const next = new Set(current);
        next.delete(project.id);
        return next;
      });

      const { error } = await supabase
        .from("user_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("project_id", project.id);

      if (error) {
        showToast(error.message);
        loadFavorites(user.id);
        return;
      }

      showToast("Removed from favorites");
      return;
    }

    setFavoriteIds((current) => new Set(current).add(project.id));

    const { error } = await supabase.from("user_favorites").insert({
      user_id: user.id,
      project_id: project.id,
    });

    if (error) {
      showToast(error.message);
      loadFavorites(user.id);
      return;
    }

    showToast("Added to favorites");
  }

  const filteredProjects = useMemo(() => {
    const text = query.trim().toLowerCase();

    const list = projects.filter((project) => {
      if (viewMode === "favorites" && !favoriteIds.has(project.id)) return false;

      const searchText = [
        project.project_name,
        project.x_handle,
        project.backed_by,
        project.category,
        project.status,
        project.phase,
        project.quest_platform,
        project.chain,
        project.cost,
        project.summary,
      ].join(" ").toLowerCase();

      return !text || searchText.includes(text);
    });

    list.sort((a, b) => {
      if (sort === "funding") return Number(b.funding_musd || 0) - Number(a.funding_musd || 0);
      if (sort === "az") return a.project_name.localeCompare(b.project_name);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return list;
  }, [projects, query, sort, viewMode, favoriteIds]);

  return (
    <>
      <Header
        showAuth
        userEmail={user?.email || null}
        onOpenAuth={() => setAuthOpen(true)}
        onLogout={logout}
      />

      <Toast message={toast} />

      <main className="app-shell">
        <section className="mb-5 flex gap-3 overflow-x-auto pb-1 max-sm:-mx-3 max-sm:px-3">
          <button className={`section-tab ${section === "airdrop" ? "active" : ""}`} onClick={() => setSection("airdrop")}>
            <Rocket size={15} className="inline-block" /> Airdrop
          </button>
          <button className={`section-tab ${section === "trading" ? "active" : ""}`} onClick={() => setSection("trading")}>
            <LineChart size={15} className="inline-block" /> Trading
          </button>
          <button className={`section-tab ${section === "gaming" ? "active" : ""}`} onClick={() => setSection("gaming")}>
            <Gamepad2 size={15} className="inline-block" /> Gaming
          </button>
        </section>

        {section === "airdrop" ? (
          <>
            <section className="glass mb-[18px] rounded-[22px] p-3.5 max-sm:rounded-[18px] max-sm:p-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 max-sm:block">
                <div className="flex flex-wrap gap-2 max-sm:mb-3">
                  <button
                    className={`section-tab !px-4 !py-2 ${viewMode === "all" ? "active" : ""}`}
                    onClick={() => setViewMode("all")}
                  >
                    <Rocket size={14} className="inline-block" />
                    All Projects
                    <span className="ml-1 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px]">{projects.length}</span>
                  </button>

                  <button
                    className={`section-tab !px-4 !py-2 ${viewMode === "favorites" ? "active" : ""}`}
                    onClick={openFavoritesView}
                  >
                    <Star size={14} className="inline-block" />
                    My Favorites
                    <span className="ml-1 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px]">{favoriteIds.size}</span>
                  </button>
                </div>

              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_190px] gap-2.5 max-sm:grid-cols-1">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={17} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="form-field search-field"
                    placeholder={
                      viewMode === "favorites"
                        ? "Search your favorite projects..."
                        : "Search project, backer, chain, quest, category..."
                    }
                  />
                </div>

                <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} className="form-field">
                  <option value="newest">New First</option>
                  <option value="az">A-Z</option>
                  <option value="funding">Funding</option>
                </select>
              </div>
            </section>

            {loading ? (
              <div className="glass rounded-2xl p-10 text-center text-slate-400">Loading projects...</div>
            ) : errorMsg ? (
              <div className="glass rounded-2xl p-10 text-center text-cyan-200">
                Supabase read error: {errorMsg}
              </div>
            ) : filteredProjects.length ? (
              <section className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-[15px] max-sm:grid-cols-1 max-sm:gap-3">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onOpen={setSelectedProject}
                    isFavorite={favoriteIds.has(project.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </section>
            ) : viewMode === "favorites" ? (
              <div className="glass rounded-2xl p-10 text-center">
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
                  <Heart size={24} />
                </div>
                <h2 className="mb-2 text-xl font-extrabold">No favorite project found</h2>
                <p className="mx-auto mb-5 max-w-md text-sm leading-relaxed text-slate-400">
                  Star projects from the cards, then open My Favorites to find them quickly anytime.
                </p>
                <button className="btn" onClick={() => setViewMode("all")}>
                  Browse All Projects
                </button>
              </div>
            ) : (
              <div className="glass rounded-2xl p-10 text-center text-slate-400">No matching projects found.</div>
            )}
          </>
        ) : (
          <section className="glass grid min-h-[360px] place-items-center rounded-[28px] p-8 text-center max-sm:min-h-[300px] max-sm:rounded-[20px] max-sm:p-5">
            <div>
              <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-purple-600">
                {section === "trading" ? <LineChart size={30} /> : <Gamepad2 size={30} />}
              </div>
              <h1 className="mb-2 text-3xl font-extrabold tracking-tight">
                {section === "trading" ? "Trading Section Coming Soon" : "Gaming Section Coming Soon"}
              </h1>
              <p className="mx-auto max-w-lg text-sm leading-relaxed text-slate-400">
                This section is planned for ABM Hub future expansion. For now, Airdrop section is active.
              </p>
            </div>
          </section>
        )}
      </main>

      <ProjectDetails project={selectedProject} onClose={() => setSelectedProject(null)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onSuccess={() => showToast("Login successful")} />
    </>
  );
}
