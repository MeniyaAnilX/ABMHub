import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink, Gift, Globe } from "lucide-react";
import { Footer } from "@/components/Footer";
import { AdSlot } from "@/components/AdSlot";
import { Header } from "@/components/Header";
import { getProjectBySlug, getSeoProjects } from "@/lib/projectsServer";
import { absoluteUrl, money, projectDescription, projectKeywords, projectSlug, projectTitle, seoTitleText } from "@/lib/seo";
import { getQuestLinks, getQuestLabel } from "@/lib/questLinks";
import { getAdSettings } from "@/lib/adsServer";
import { hasAdCode } from "@/lib/ads";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const projects = await getSeoProjects();
  return projects.map((project) => ({
    slug: projectSlug(project),
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [project, adSettings] = await Promise.all([getProjectBySlug(slug), getAdSettings()]);

  if (!project) {
    return {
      title: "Airdrop Project Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const path = `/airdrops/${projectSlug(project)}`;

  return {
    title: projectTitle(project),
    description: projectDescription(project),
    keywords: projectKeywords(project),
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "article",
      url: path,
      title: projectTitle(project),
      description: projectDescription(project),
      siteName: "ABM Hub",
      images: project.logo_url ? [{ url: project.logo_url, alt: `${project.project_name} logo` }] : undefined,
    },
    twitter: {
      card: project.logo_url ? "summary_large_image" : "summary",
      title: projectTitle(project),
      description: projectDescription(project),
      images: project.logo_url ? [project.logo_url] : undefined,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

function statusClass(status: string) {
  const text = status.toLowerCase();

  if (text === "ended") return "text-red-300";
  if (text === "trending") return "text-blue-300";
  if (text === "live" || text === "active") return "text-emerald-300";

  return "text-white";
}

const richTags = [
  { open: "**", close: "**", className: "font-extrabold text-white" },
  { open: "[cyan]", close: "[/cyan]", className: "font-semibold text-cyan-300" },
  { open: "[green]", close: "[/green]", className: "font-semibold text-emerald-300" },
  { open: "[yellow]", close: "[/yellow]", className: "font-semibold text-amber-300" },
  { open: "[red]", close: "[/red]", className: "font-semibold text-red-300" },
  { open: "[blue]", close: "[/blue]", className: "font-semibold text-blue-300" },
];

function renderRichText(text: string, keyPrefix = "rich"): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let index = 0;
  let partIndex = 0;

  while (index < text.length) {
    let nextMatch: {
      start: number;
      end: number;
      contentStart: number;
      className: string;
      closeLength: number;
    } | null = null;

    for (const tag of richTags) {
      const start = text.indexOf(tag.open, index);
      if (start === -1) continue;

      const contentStart = start + tag.open.length;
      const end = text.indexOf(tag.close, contentStart);

      if (end === -1) continue;

      if (!nextMatch || start < nextMatch.start) {
        nextMatch = {
          start,
          end,
          contentStart,
          className: tag.className,
          closeLength: tag.close.length,
        };
      }
    }

    if (!nextMatch) {
      parts.push(text.slice(index));
      break;
    }

    if (nextMatch.start > index) {
      parts.push(text.slice(index, nextMatch.start));
    }

    const innerText = text.slice(nextMatch.contentStart, nextMatch.end);
    parts.push(
      <span key={`${keyPrefix}-${partIndex}`} className={nextMatch.className}>
        {renderRichText(innerText, `${keyPrefix}-${partIndex}`)}
      </span>
    );

    index = nextMatch.end + nextMatch.closeLength;
    partIndex += 1;
  }

  return parts;
}

function normalizeTaskLine(task: string) {
  return task.replace(/^\s*\d+[.)-]\s*/g, "").trim();
}

function renderTaskItems(tasks: string[]) {
  let number = 0;

  return tasks.map((task, index) => {
    const normalized = normalizeTaskLine(task);
    if (!normalized) return null;

    const plain = normalized
      .replace(/\*\*/g, "")
      .replace(/\[(cyan|green|yellow|red|blue)\]/g, "")
      .replace(/\[\/(cyan|green|yellow|red|blue)\]/g, "")
      .trim();

    const isBullet = /^[•\-]\s+/.test(plain);
    const isHeading = normalized.includes("**") || (plain.endsWith(":") && plain.length <= 90);

    if (isHeading) {
      return (
        <div key={`task-heading-${index}`} className="pt-2 text-sm font-black text-white">
          {renderRichText(normalized.replace(/^[-•]\s+/, ""), `task-heading-${index}`)}
        </div>
      );
    }

    if (isBullet) {
      return (
        <p key={`task-bullet-${index}`} className="task-line text-sm leading-7 text-slate-300">
          <span className="task-number text-slate-500">•</span>
          <span>{renderRichText(normalized.replace(/^[•\-]\s+/, ""), `task-bullet-${index}`)}</span>
        </p>
      );
    }

    number += 1;

    return (
      <p key={`task-${index}`} className="task-line text-sm leading-7 text-slate-300">
        <span className="task-number text-slate-400">{number}.</span>
        <span>{renderRichText(normalized, `task-${index}`)}</span>
      </p>
    );
  });
}

function initials(name: string) {
  return name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase();
}

function faviconUrl(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

function domainFromUrl(url: string, fallbackDomain: string) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return fallbackDomain;
  }
}

function getQuestIconUrl(platform: string, url: string) {
  if (platform === "Galxe") return faviconUrl("galxe.com");
  if (platform === "Zealy") return faviconUrl("zealy.io");
  if (platform === "Guild") return faviconUrl("guild.xyz");

  return faviconUrl(domainFromUrl(url, "abmhub.xyz"));
}

function BrandIcon({ src, label }: { src: string; label: string }) {
  return (
    <span className="grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/10 bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`${label} logo`} className="h-4 w-4 object-contain" loading="lazy" />
    </span>
  );
}

function QuestBrandIcon({ platform, url }: { platform: string; url: string }) {
  return <BrandIcon src={getQuestIconUrl(platform, url)} label={platform} />;
}

function DetailBox({
  label,
  value,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b1020] p-4">
      <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">{label}</div>
      <div className={`text-sm font-extrabold ${highlight ? "text-emerald-300" : "text-white"}`}>{value}</div>
    </div>
  );
}

export default async function AirdropProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const [project, adSettings] = await Promise.all([getProjectBySlug(slug), getAdSettings()]);

  if (!project) notFound();

  const path = `/airdrops/${projectSlug(project)}`;
  const xUrl = `https://x.com/${project.x_handle.replace("@", "")}`;
  const questLinks = getQuestLinks(project);
  const questLabel = getQuestLabel(project);
  const tasks = Array.isArray(project.tasks) ? project.tasks.filter(Boolean) : [];
  const updatedDate = project.updated_at || project.created_at;
  const pageUrl = absoluteUrl(path);
  const projectSeoTitle = seoTitleText(project);
  const showDetailTopAd = adSettings.enabled && hasAdCode(adSettings.detail_top_code) && adSettings.max_ads_per_page >= 1;
  const showDetailBottomAd = adSettings.enabled && hasAdCode(adSettings.detail_bottom_code) && adSettings.max_ads_per_page >= 2;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: projectTitle(project),
    description: projectDescription(project),
    url: pageUrl,
    datePublished: project.created_at,
    dateModified: updatedDate,
    author: {
      "@type": "Organization",
      name: "ABM Hub",
      url: "https://www.abmhub.xyz",
    },
    publisher: {
      "@type": "Organization",
      name: "ABM Hub",
      url: "https://www.abmhub.xyz",
    },
    mainEntityOfPage: pageUrl,
    image: project.logo_url || undefined,
    about: [
      project.project_name,
      project.category,
      project.chain,
      "Web3 airdrop",
      "Crypto airdrop",
    ],
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What is the ${project.project_name} airdrop page about?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `This page tracks ${project.project_name} airdrop information including funding, backers, status, chain, quest type, cost, official links and tasks.`,
        },
      },
      {
        "@type": "Question",
        name: `How much funding does ${project.project_name} have?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${project.project_name} funding is listed as ${money(project.funding_musd)} on ABM Hub.`,
        },
      },
      {
        "@type": "Question",
        name: `Is the ${project.project_name} airdrop guaranteed?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Airdrops are not guaranteed. Users should always verify official links and do their own research before completing tasks or connecting a wallet.",
        },
      },
    ],
  };

  return (
    <>
      <Header />

      <main className="app-shell">
        <article className="project-seo-page mx-auto max-w-[1040px] rounded-[28px] border border-white/15 bg-[#0b1220] p-6 max-sm:rounded-[20px] max-sm:p-4">
          <header className="mb-5 flex items-start gap-4 max-sm:gap-3">
            <div className="project-logo-frame grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-[18px] border border-slate-700/80 bg-black/45 font-extrabold text-white shadow-none max-sm:h-12 max-sm:w-12 max-sm:rounded-2xl">
              {project.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={project.logo_url} alt={`${project.project_name} logo`} className="h-full w-full object-cover" loading="eager" decoding="async" />
              ) : (
                initials(project.project_name)
              )}
            </div>
            <div className="min-w-0">
              <p className="mb-1 text-xs font-extrabold text-blue-300">Airdrop Project Details</p>
              <h1 className="break-words text-3xl font-extrabold tracking-tight max-sm:text-2xl">
                {projectSeoTitle}
              </h1>
              <a href={xUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-blue-300 hover:underline">
                {project.x_handle}
                <ExternalLink size={13} />
              </a>
            </div>
          </header>

          <section className="mb-5 rounded-3xl border border-white/10 bg-[#111827] p-5 max-sm:rounded-2xl max-sm:p-4">
            <div className="mb-2 text-sm font-extrabold">Summary</div>
            <p className="text-sm leading-relaxed text-slate-400">
              {project.summary || `${project.project_name} is listed on ABM Hub as a Web3 airdrop project. This page helps users review important project information before visiting official links or completing tasks.`}
            </p>
            <p className="mt-3 text-xs text-slate-600">Last updated: {new Date(updatedDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
          </section>

          {showDetailTopAd ? (
            <AdSlot code={adSettings.detail_top_code} slotId="detail-top" className="mb-5" />
          ) : null}

          <section className="mb-5 grid gap-5 lg:grid-cols-[1.15fr_.85fr] max-sm:gap-4">
            <div className="rounded-3xl border border-white/10 bg-[#111827] p-5 max-sm:rounded-2xl max-sm:p-4">
              <h2 className="mb-4 text-base font-extrabold tracking-tight">Project Details</h2>
              <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                <DetailBox label="Funding" value={money(project.funding_musd)} highlight />
                <DetailBox label="Backed by" value={project.backed_by || "Not disclosed"} />
                <DetailBox label="Phase" value={project.phase} />
                <DetailBox label="Status" value={<span className={statusClass(project.status)}>{project.status}</span>} />
                <DetailBox label="Quest Type" value={questLabel} />
                <DetailBox label="Chain" value={project.chain} />
                <DetailBox label="Cost" value={project.cost} />
                <DetailBox label="Category" value={project.category} />
              </div>
            </div>

            <aside className="rounded-3xl border border-white/10 bg-[#111827] p-5 max-sm:rounded-2xl max-sm:p-4">
              <h2 className="mb-4 text-base font-extrabold tracking-tight">Official Links</h2>
              <div className="grid gap-3">
                <a href={xUrl} target="_blank" rel="noreferrer" className="btn btn-ghost justify-start">
                  <BrandIcon src={faviconUrl("x.com")} label="X" />
                  Follow on X
                </a>

                {project.discord_url ? (
                  <a href={project.discord_url} target="_blank" rel="noreferrer" className="btn btn-ghost justify-start">
                    <BrandIcon src={faviconUrl("discord.com")} label="Discord" />
                    Join Discord
                  </a>
                ) : null}

                {project.website_url ? (
                  <a href={project.website_url} target="_blank" rel="noreferrer" className="btn btn-ghost justify-start">
                    <Globe size={18} />
                    Visit Website
                  </a>
                ) : null}

                {project.claim_airdrop_url ? (
                  <a href={project.claim_airdrop_url} target="_blank" rel="noreferrer" className="btn justify-start">
                    <Gift size={18} />
                    Claim Airdrop
                  </a>
                ) : null}
              </div>
            </aside>
          </section>

          <section className="mb-5 rounded-3xl border border-white/10 bg-[#111827] p-5 max-sm:rounded-2xl max-sm:p-4">
            <h2 className="mb-4 text-base font-extrabold tracking-tight">Quest Links</h2>
            {questLinks.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {questLinks.map((link) => (
                  <a key={`${link.platform}-${link.url}`} href={link.url} target="_blank" rel="noreferrer" className="btn btn-ghost justify-start">
                    <QuestBrandIcon platform={link.platform} url={link.url} />
                    Open {link.platform}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No quest links have been added yet.</p>
            )}
          </section>

          <section className="mb-5 rounded-3xl border border-white/10 bg-[#111827] p-5 max-sm:rounded-2xl max-sm:p-4">
            <h2 className="mb-3 text-base font-extrabold tracking-tight">Tasks</h2>
            {tasks.length ? (
              <div className="grid gap-3">
                {renderTaskItems(tasks)}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No tasks have been added yet. Check official links for the latest project instructions.</p>
            )}
          </section>

          {showDetailBottomAd ? (
            <AdSlot code={adSettings.detail_bottom_code} slotId="detail-bottom" className="mb-5" />
          ) : null}

          <section className="rounded-3xl border border-amber-400/15 bg-amber-400/10 p-5 max-sm:rounded-2xl max-sm:p-4">
            <h2 className="mb-3 text-base font-extrabold tracking-tight">Airdrop Disclaimer</h2>
            <p className="text-sm leading-7 text-amber-50/80">
              ABM Hub provides informational airdrop research only. Airdrops, rewards, token allocations and eligibility are not guaranteed.
              Always verify official project links, avoid sharing seed phrases and use your own research before completing tasks.
            </p>
          </section>
        </article>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <Footer />
    </>
  );
}
