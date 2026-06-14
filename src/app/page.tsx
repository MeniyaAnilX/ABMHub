"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectDetails } from "@/components/ProjectDetails";
import { supabase } from "@/lib/supabase";
import type { Project } from "@/types/project";
import { Gamepad2, LineChart, Rocket, Search } from "lucide-react";

type SortMode = "newest" | "az" | "funding";
type Section = "airdrop" | "trading" | "gaming";

export default function PublicHomePage() {
  const [section, setSection] = useState<Section>("airdrop");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("newest");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

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

  useEffect(() => {
    loadProjects();

    const channel = supabase
      .channel("public-projects-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => {
        loadProjects();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredProjects = useMemo(() => {
    const text = query.trim().toLowerCase();

    const list = projects.filter((project) => {
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
  }, [projects, query, sort]);

  return (
    <>
      <Header />

      <main className="app-shell">
        <section className="mb-5 flex flex-wrap gap-3">
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
            <section className="glass mb-[18px] rounded-[22px] p-3.5">
              <div className="grid grid-cols-[minmax(0,1fr)_190px] gap-2.5 max-sm:grid-cols-1">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={17} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="form-field search-field"
                    placeholder="Search project, backer, chain, quest, category..."
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
                <br />
                <span className="mt-2 block text-sm text-slate-400">Run ABMHUB_V6_ADMIN_REALTIME_RATING_FIX.sql in Supabase SQL Editor.</span>
              </div>
            ) : filteredProjects.length ? (
              <section className="grid grid-cols-[repeat(auto-fill,minmax(314px,1fr))] gap-[15px] max-sm:grid-cols-1">
                {filteredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} onOpen={setSelectedProject} />
                ))}
              </section>
            ) : (
              <div className="glass rounded-2xl p-10 text-center text-slate-400">No matching projects found.</div>
            )}
          </>
        ) : (
          <section className="glass grid min-h-[360px] place-items-center rounded-[28px] p-8 text-center">
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
    </>
  );
}
