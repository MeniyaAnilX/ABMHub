"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AuthModal } from "@/components/AuthModal";
import { Header } from "@/components/Header";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectDetails } from "@/components/ProjectDetails";
import { Toast } from "@/components/Toast";
import { supabase } from "@/lib/supabase";
import type { Project } from "@/types/project";
import { CheckCircle2, Clock3, Coins, Gamepad2, Gift, Heart, LineChart, Rocket, Search, ShieldCheck, Star, Trophy } from "lucide-react";

type SortMode = "newest" | "az" | "funding";
type Section = "airdrop" | "trading" | "gaming";
type ViewMode = "all" | "favorites";

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
  updated_at: string;
};

function formatInrFromPoints(points: number) {
  const value = points / 100;
  return Number.isInteger(value) ? `₹${value}` : `₹${value.toFixed(2)}`;
}

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
  const [gamingLedger, setGamingLedger] = useState<GamingLedger[]>([]);
  const [gamingRedemptions, setGamingRedemptions] = useState<GamingRedemption[]>([]);
  const [gamingSettings, setGamingSettings] = useState<GamingSettings | null>(null);
  const [serverTodayKey, setServerTodayKey] = useState("");
  const [redeemPoints, setRedeemPoints] = useState("1000");
  const [gamingBusy, setGamingBusy] = useState("");
  const modalHistoryActiveRef = useRef(false);

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

  async function loadGamingData(currentUserId: string) {
    const [ledgerResult, redemptionResult] = await Promise.all([
      supabase
        .from("gaming_points_ledger")
        .select("*")
        .eq("user_id", currentUserId)
        .order("created_at", { ascending: false }),
      supabase
        .from("gaming_redemptions")
        .select("*")
        .eq("user_id", currentUserId)
        .order("created_at", { ascending: false }),
    ]);

    if (!ledgerResult.error) {
      setGamingLedger((ledgerResult.data || []) as GamingLedger[]);
    }

    if (!redemptionResult.error) {
      setGamingRedemptions((redemptionResult.data || []) as GamingRedemption[]);
    }
  }

  async function loadGamingSettings() {
    const [{ data: settingsData }, { data: dateData }] = await Promise.all([
      supabase.from("gaming_settings").select("*").eq("id", "main").maybeSingle(),
      supabase.rpc("get_ist_today_key"),
    ]);

    if (settingsData) {
      setGamingSettings(settingsData as GamingSettings);
    }

    if (dateData) {
      setServerTodayKey(String(dateData));
    }
  }

  useEffect(() => {
    loadProjects();
    loadGamingSettings();

    supabase.auth.getSession().then(({ data }) => {
      const currentUser = data.session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        loadFavorites(currentUser.id);
        loadGamingData(currentUser.id);
      }
    });

    const authListener = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        loadFavorites(currentUser.id);
        loadGamingData(currentUser.id);
      } else {
        setFavoriteIds(new Set());
        setGamingLedger([]);
        setGamingRedemptions([]);
        setViewMode("all");
      }
    });

    const channel = supabase
      .channel("public-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => {
        loadProjects();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "gaming_points_ledger" }, () => {
        supabase.auth.getSession().then(({ data }) => {
          if (data.session?.user) loadGamingData(data.session.user.id);
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "gaming_redemptions" }, () => {
        supabase.auth.getSession().then(({ data }) => {
          if (data.session?.user) loadGamingData(data.session.user.id);
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "gaming_settings" }, () => {
        loadGamingSettings();
      })
      .subscribe();

    return () => {
      authListener.data.subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!selectedProject || typeof window === "undefined") return;

    if (!modalHistoryActiveRef.current) {
      window.history.pushState({ ...(window.history.state || {}), abmhubProjectModal: true }, "", window.location.href);
      modalHistoryActiveRef.current = true;
    }

    const handlePopState = () => {
      if (modalHistoryActiveRef.current) {
        modalHistoryActiveRef.current = false;
        setSelectedProject(null);
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [selectedProject]);

  function closeProjectDetails() {
    if (modalHistoryActiveRef.current && typeof window !== "undefined") {
      window.history.back();
      return;
    }

    setSelectedProject(null);
  }

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

  async function claimDailyCheckin() {
    if (!user) {
      setAuthOpen(true);
      showToast("Login to earn gaming points.");
      return;
    }

    setGamingBusy("daily_checkin");

    const { data, error } = await supabase.rpc("claim_daily_checkin");
    setGamingBusy("");

    if (error) {
      showToast(error.message);
      return;
    }

    const result = Array.isArray(data) ? data[0] : data;

    if (result?.already_claimed) {
      showToast("Already claimed today.");
    } else {
      showToast(`+${result?.points_awarded || 2} points added`);
    }

    await Promise.all([loadGamingData(user.id), loadGamingSettings()]);
  }

  async function claimYouTubeShort() {
    if (!user) {
      setAuthOpen(true);
      showToast("Login to earn gaming points.");
      return;
    }

    const shortUrl = gamingSettings?.youtube_short_url?.trim();

    if (!shortUrl) {
      showToast("YouTube Short link not available yet.");
      return;
    }

    window.open(shortUrl, "_blank", "noopener,noreferrer");

    setGamingBusy("youtube_short");

    const { data, error } = await supabase.rpc("claim_youtube_short");
    setGamingBusy("");

    if (error) {
      showToast(error.message);
      return;
    }

    const result = Array.isArray(data) ? data[0] : data;

    if (result?.already_claimed) {
      showToast("Already claimed YouTube Short today.");
    } else {
      showToast(`+${result?.points_awarded || gamingSettings?.youtube_reward_points || 10} points added`);
    }

    await Promise.all([loadGamingData(user.id), loadGamingSettings()]);
  }

  async function requestRedeem(availablePoints: number) {
    if (!user) {
      setAuthOpen(true);
      showToast("Login to redeem points.");
      return;
    }

    const pointsCost = Math.floor(Number(redeemPoints || 0));

    if (!Number.isFinite(pointsCost) || pointsCost < 1000) {
      showToast("Minimum redeem is 1000 points.");
      return;
    }

    if (availablePoints < pointsCost) {
      showToast("Not enough approved points yet.");
      return;
    }

    const rewardName = `${formatInrFromPoints(pointsCost)} Google Play Gift Card`;

    setGamingBusy("custom_redeem");

    const { error } = await supabase.from("gaming_redemptions").insert({
      user_id: user.id,
      user_email: user.email || null,
      reward_name: rewardName,
      points_cost: pointsCost,
      status: "pending",
    });

    setGamingBusy("");

    if (error) {
      showToast(error.message);
      return;
    }

    showToast("Redeem request sent for admin approval.");
    await loadGamingData(user.id);
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

  const gamingStats = useMemo(() => {
    const approvedPoints = gamingLedger
      .filter((item) => item.status === "approved")
      .reduce((sum, item) => sum + Number(item.points || 0), 0);

    const pendingPoints = gamingLedger
      .filter((item) => item.status === "pending")
      .reduce((sum, item) => sum + Math.max(0, Number(item.points || 0)), 0);

    return {
      approvedPoints,
      pendingPoints,
      availablePoints: Math.max(0, approvedPoints),
    };
  }, [gamingLedger]);

  function hasClaimedServerToday(source: string) {
    if (!user || !serverTodayKey) return false;
    const key = `${source}-${user.id}-${serverTodayKey}`;
    return gamingLedger.some((item) => item.task_key === key);
  }

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
        <section className="mb-5 flex max-w-full gap-3 overflow-x-auto pb-1">
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
                <div className="relative min-w-0">
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
        ) : section === "gaming" ? (
          <section className="grid gap-5">
            <div className="glass rounded-[28px] p-6 max-sm:rounded-[20px] max-sm:p-4">
              <div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-extrabold text-emerald-200">
                    <Gamepad2 size={14} />
                    Gaming Earn Points
                  </div>
                  <h1 className="mb-3 text-3xl font-extrabold tracking-tight max-sm:text-2xl">
                    Earn ABM Points, redeem Google Play gift cards
                  </h1>
                  <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
                    Complete safe gaming tasks, collect approved points, then request a Google Play gift card. Use the gift card on Play Store for Free Fire diamonds by yourself.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
                  <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      <Coins size={14} />
                      Approved
                    </div>
                    <div className="text-2xl font-black text-emerald-300">{gamingStats.approvedPoints}</div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      <Clock3 size={14} />
                      Pending
                    </div>
                    <div className="text-2xl font-black text-amber-300">{gamingStats.pendingPoints}</div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      <Gift size={14} />
                      Redeemable
                    </div>
                    <div className="text-2xl font-black text-cyan-300">{gamingStats.availablePoints}</div>
                  </div>
                </div>
              </div>

              {!user ? (
                <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">
                  Login or sign up to start earning points.
                  <button className="btn ml-3 max-sm:ml-0 max-sm:mt-3" onClick={() => setAuthOpen(true)}>Login / Sign Up</button>
                </div>
              ) : null}
            </div>

            <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
              <div className="glass rounded-[28px] p-6 max-sm:rounded-[20px] max-sm:p-4">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-extrabold">
                  <Trophy size={20} className="text-amber-300" />
                  Daily Tasks
                </h2>

                <div className="grid gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                    <div className="flex items-start justify-between gap-4 max-sm:flex-col">
                      <div>
                        <h3 className="font-extrabold">Daily Check-in</h3>
                        <p className="mt-1 text-sm text-slate-400">Open Gaming section every day and claim small points.</p>
                      </div>
                      <button
                        className="btn max-sm:w-full"
                        disabled={!user || gamingBusy === "daily_checkin" || hasClaimedServerToday("daily_checkin")}
                        onClick={claimDailyCheckin}
                      >
                        <CheckCircle2 size={16} />
                        {hasClaimedServerToday("daily_checkin") ? "Claimed" : "+2 Points"}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                    <div className="flex items-start justify-between gap-4 max-sm:flex-col">
                      <div>
                        <h3 className="font-extrabold">Daily YouTube Short</h3>
                        <p className="mt-1 text-sm text-slate-400">
                          Watch today&apos;s ABM short and claim daily points. Link resets by Supabase IST date.
                        </p>
                        {gamingSettings?.youtube_short_url ? (
                          <a href={gamingSettings.youtube_short_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-red-300 hover:underline">
                            <span className="text-xs font-black">▶</span>
                            Open today&apos;s short
                          </a>
                        ) : (
                          <p className="mt-2 text-xs text-amber-300">Admin has not added today&apos;s short yet.</p>
                        )}
                      </div>
                      <button
                        className="btn max-sm:w-full"
                        disabled={!user || !gamingSettings?.youtube_short_url || gamingBusy === "youtube_short" || hasClaimedServerToday("youtube_short")}
                        onClick={claimYouTubeShort}
                      >
                        <span className="text-sm font-black">▶</span>
                        {hasClaimedServerToday("youtube_short") ? "Claimed" : `Watch +${gamingSettings?.youtube_reward_points || 10} Points`}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-400/15 bg-amber-400/10 p-4">
                    <div className="flex items-start justify-between gap-4 max-sm:flex-col">
                      <div>
                        <h3 className="font-extrabold text-amber-100">Offerwall Tasks</h3>
                        <p className="mt-1 text-sm text-amber-100/70">
                          Lootably / CPAlead integration placeholder. Use postback later so points are approved only after real payout.
                        </p>
                      </div>
                      <button className="btn btn-ghost max-sm:w-full" onClick={() => showToast("Offerwall integration coming in next build.")}>
                        Coming Soon
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-blue-400/15 bg-blue-400/10 p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck size={18} className="mt-0.5 shrink-0 text-blue-300" />
                      <p className="text-sm leading-relaxed text-blue-100/75">
                        Profit-safe rule: offerwall points should stay pending until payout is confirmed. Only approved points can be redeemed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass rounded-[28px] p-6 max-sm:rounded-[20px] max-sm:p-4">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-extrabold">
                  <Gift size={20} className="text-purple-300" />
                  Redeem Store
                </h2>

                <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-extrabold">Google Play Gift Card</h3>
                      <p className="text-sm text-slate-400">100 points = ₹1. Minimum redeem: 1000 points.</p>
                    </div>
                    <span className="rounded-lg border border-purple-400/20 bg-purple-400/10 px-2 py-1 text-xs font-extrabold text-purple-200">
                      Custom Amount
                    </span>
                  </div>

                  <label className="mb-3 grid gap-2 text-sm text-slate-300">
                    Enter points to redeem
                    <input
                      className="form-field"
                      type="number"
                      min="1000"
                      step="100"
                      value={redeemPoints}
                      onChange={(event) => setRedeemPoints(event.target.value)}
                      placeholder="1000"
                    />
                  </label>

                  <div className="mb-3 rounded-xl border border-white/10 bg-white/[.03] p-3 text-sm text-slate-400">
                    Gift card value: <b className="text-white">{formatInrFromPoints(Math.max(0, Number(redeemPoints || 0)))}</b>
                  </div>

                  <button
                    className="btn w-full"
                    disabled={!user || gamingBusy === "custom_redeem" || Number(redeemPoints || 0) < 1000 || gamingStats.availablePoints < Number(redeemPoints || 0)}
                    onClick={() => requestRedeem(gamingStats.availablePoints)}
                  >
                    Request Redeem
                  </button>
                </div>

                <div className="mt-5">
                  <h3 className="mb-3 text-sm font-extrabold text-slate-300">My Redeem Requests</h3>
                  {!user ? (
                    <p className="text-sm text-slate-500">Login to see requests.</p>
                  ) : gamingRedemptions.length ? (
                    <div className="grid gap-2">
                      {gamingRedemptions.slice(0, 5).map((item) => (
                        <div key={item.id} className="rounded-xl border border-white/10 bg-black/15 p-3 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-bold">{item.reward_name}</span>
                            <span className={`rounded-lg px-2 py-1 text-xs font-extrabold ${
                              item.status === "approved"
                                ? "bg-emerald-400/10 text-emerald-300"
                                : item.status === "rejected"
                                  ? "bg-red-400/10 text-red-300"
                                  : "bg-amber-400/10 text-amber-300"
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          {item.reward_code ? (
                            <div className="mt-2 rounded-lg border border-emerald-400/15 bg-emerald-400/10 p-2 text-emerald-100">
                              Code: <b>{item.reward_code}</b>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No redeem requests yet.</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="glass grid min-h-[360px] place-items-center rounded-[28px] p-8 text-center max-sm:min-h-[300px] max-sm:rounded-[20px] max-sm:p-5">
            <div>
              <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-purple-600">
                <LineChart size={30} />
              </div>
              <h1 className="mb-2 text-3xl font-extrabold tracking-tight">Trading Section Coming Soon</h1>
              <p className="mx-auto max-w-lg text-sm leading-relaxed text-slate-400">
                This section is planned for ABM Hub future expansion. For now, Airdrop and Gaming sections are active.
              </p>
            </div>
          </section>
        )}
      </main>

      <ProjectDetails project={selectedProject} onClose={closeProjectDetails} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onSuccess={() => showToast("Login successful")} />
    </>
  );
}
