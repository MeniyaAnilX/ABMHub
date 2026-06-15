"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AuthModal } from "@/components/AuthModal";
import { Header } from "@/components/Header";
import { ProjectCard } from "@/components/ProjectCard";
import { Footer } from "@/components/Footer";
import { supabase } from "@/lib/supabase";
import type { Project } from "@/types/project";
import { Heart, LineChart, Rocket, Search, Star } from "lucide-react";

type CostFilter = "all" | "free" | "paid";
type Section = "airdrop" | "trading" | "favorites";

export default function PublicHomePage() {
  const [section, setSection] = useState<Section>("airdrop");
  const [projects, setProjects] = useState<Project[]>([]);
  const [query, setQuery] = useState("");
  const [costFilter, setCostFilter] = useState<CostFilter>("all");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [authOpen, setAuthOpen] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") return;

    navigator.serviceWorker.register("/abmhub-sw.js").catch(() => {
      // Image cache boost is optional; site works normally if browser blocks service worker.
    });
  }, []);

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
        setSection("airdrop");
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
}

  function openFavoritesSection() {
    if (!user) {
      setAuthOpen(true);
return;
    }

    setSection("favorites");
  }

  async function toggleFavorite(project: Project) {
    if (!user) {
      setAuthOpen(true);
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
loadFavorites(user.id);
        return;
      }
return;
    }

    setFavoriteIds((current) => new Set(current).add(project.id));

    const { error } = await supabase.from("user_favorites").insert({
      user_id: user.id,
      project_id: project.id,
    });

    if (error) {
loadFavorites(user.id);
      return;
    }
}

  const filteredProjects = useMemo(() => {
    const text = query.trim().toLowerCase();

    const list = projects.filter((project) => {
      if (section === "favorites" && !favoriteIds.has(project.id)) return false;
      if (costFilter === "free" && project.cost !== "Free") return false;
      if (costFilter === "paid" && project.cost !== "Paid" && project.cost !== "Low Gas") return false;

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

    return list;
  }, [projects, query, section, favoriteIds, costFilter]);

  return (
    <>
      <Header
        showAuth
        userEmail={user?.email || null}
        onOpenAuth={() => setAuthOpen(true)}
        onLogout={logout}
      />
<main className="app-shell">
        <section className="mb-5 flex max-w-full gap-3 overflow-x-auto pb-1">
          <button className={`section-tab ${section === "airdrop" ? "active" : ""}`} onClick={() => setSection("airdrop")}>
            <Rocket size={15} className="inline-block" /> Airdrop
          </button>
          <button className={`section-tab ${section === "trading" ? "active" : ""}`} onClick={() => setSection("trading")}>
            <LineChart size={15} className="inline-block" /> Trading
          </button>
          <button className={`section-tab ${section === "favorites" ? "active" : ""}`} onClick={openFavoritesSection}>
            <Star size={15} className="inline-block" /> My Favorites
            <span className="ml-1 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px]">{favoriteIds.size}</span>
          </button>
        </section>

        {section === "airdrop" || section === "favorites" ? (
          <>
            <section className="sr-only">
              <h1>ABM Hub Web3 Airdrop Directory</h1>
              <p>
                ABM Hub lists Web3 airdrop projects with funding, backers, chain, status, cost, quest type, tasks and official links.
                Each project also has a dedicated SEO page for users searching project funding, airdrop tasks and claim information.
              </p>
            </section>
            <section className="glass mb-[18px] rounded-[22px] p-3.5 max-sm:rounded-[18px] max-sm:p-3">
              <div className="grid grid-cols-[minmax(0,1fr)_260px] gap-2.5 max-sm:grid-cols-1">
                <div className="relative min-w-0">
                  <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={17} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="form-field search-field"
                    placeholder={
                      section === "favorites"
                        ? "Search your favorite projects..."
                        : "Search project, backer, chain, quest, category..."
                    }
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-black/10 p-1">
                  <button type="button" className={`cost-filter-tab ${costFilter === "all" ? "active" : ""}`} onClick={() => setCostFilter("all")}>All</button>
                  <button type="button" className={`cost-filter-tab ${costFilter === "free" ? "active" : ""}`} onClick={() => setCostFilter("free")}>Free</button>
                  <button type="button" className={`cost-filter-tab ${costFilter === "paid" ? "active" : ""}`} onClick={() => setCostFilter("paid")}>Paid</button>
                </div>
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
                    isFavorite={favoriteIds.has(project.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </section>
            ) : section === "favorites" ? (
              <div className="glass rounded-2xl p-10 text-center">
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
                  <Heart size={24} />
                </div>
                <h2 className="mb-2 text-xl font-extrabold">No favorite project found</h2>
                <p className="mx-auto mb-5 max-w-md text-sm leading-relaxed text-slate-400">
                  Star projects from the cards, then open My Favorites to find them quickly anytime.
                </p>
                <button className="btn" onClick={() => setSection("airdrop")}>
                  Browse Airdrops
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
                <LineChart size={30} />
              </div>
              <h1 className="mb-2 text-3xl font-extrabold tracking-tight">Trading Section Coming Soon</h1>
              <p className="mx-auto max-w-lg text-sm leading-relaxed text-slate-400">
                This section is planned for ABM Hub future expansion. For now, Airdrop section is active.
              </p>
            </div>
          </section>
        )}
      </main>

      <Footer />

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onSuccess={() => {}} />
    </>
  );
}
