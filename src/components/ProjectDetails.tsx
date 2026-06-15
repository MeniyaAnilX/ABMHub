import type { Project } from "@/types/project";
import { ExternalLink, Gift, Globe, X } from "lucide-react";
import { getQuestLinks, getQuestLabel } from "@/lib/questLinks";

type ProjectDetailsProps = {
  project: Project | null;
  onClose: () => void;
};

function money(value: number | null) {
  const amount = Number(value || 0);
  return amount >= 1000 ? `$${(amount / 1000).toFixed(1)}B` : `$${amount}M`;
}

function initials(name: string) {
  return name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase();
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

function renderTaskText(tasks: string[] | null) {
  const text = tasks && tasks.length ? tasks.join("\n") : "No tasks added yet.";
  const lines = text.split("\n");

  return lines.map((line, index) => {
    if (!line.trim()) {
      return <div key={`blank-${index}`} className="h-4" />;
    }

    return (
      <p key={`line-${index}`} className="min-h-7 break-words">
        {renderRichText(line, `line-${index}`)}
      </p>
    );
  });
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

function LinkBrandIcon({ url, label, fallbackDomain }: { url: string; label: string; fallbackDomain: string }) {
  return <BrandIcon src={faviconUrl(domainFromUrl(url, fallbackDomain))} label={label} />;
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

export function ProjectDetails({ project, onClose }: ProjectDetailsProps) {
  if (!project) return null;

  const xUrl = `https://x.com/${project.x_handle.replace("@", "")}`;
  const questLinks = getQuestLinks(project);
  const questLabel = getQuestLabel(project);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#020617] p-4 max-sm:p-0">
      <button className="absolute inset-0 cursor-default" aria-label="Close project details" onClick={onClose} />

      <section className="project-modal-opaque no-glow relative z-[60] max-h-[92vh] w-full max-w-[1040px] overflow-y-auto overflow-x-hidden rounded-[28px] border border-white/15 bg-[#0b1220] p-6 max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:rounded-none max-sm:border-0 max-sm:p-4">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-4 max-sm:gap-3">
            <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-[18px] border border-slate-700/80 bg-black/45 font-extrabold text-white shadow-none project-logo-frame max-sm:h-12 max-sm:w-12 max-sm:rounded-2xl">
              {project.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={project.logo_url} alt={`${project.project_name} logo`} className="h-full w-full object-cover" loading="lazy" decoding="async" />
              ) : (
                initials(project.project_name)
              )}
            </div>
            <div>
              <h2 className="break-words text-3xl font-extrabold tracking-tight max-sm:text-2xl">{project.project_name}</h2>
              <a href={xUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-300 hover:underline">
                {project.x_handle}
                <ExternalLink size={13} />
              </a>
            </div>
          </div>

          <button className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[.04] text-slate-400 hover:text-white" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="mb-5 rounded-3xl border border-white/10 bg-[#111827] p-5 max-sm:rounded-2xl max-sm:p-4">
          <div className="mb-2 text-sm font-extrabold">Summary</div>
          <p className="text-sm leading-relaxed text-slate-400">
            {project.summary || "Project details and links."}
          </p>
        </div>

        <div className="mb-5 grid gap-5 lg:grid-cols-[1.15fr_.85fr] max-sm:gap-4">
          <div className="rounded-3xl border border-white/10 bg-[#111827] p-5 max-sm:rounded-2xl max-sm:p-4">
            <h3 className="mb-4 text-base font-extrabold tracking-tight">Project Snapshot</h3>
            <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
              <DetailBox label="Funding" value={money(project.funding_musd)} highlight />
              <DetailBox label="Backed by" value={project.backed_by} />
              <DetailBox label="Phase" value={project.phase} />
              <DetailBox label="Status" value={<span className={statusClass(project.status)}>{project.status}</span>} />
              <DetailBox label="Quest" value={questLabel} />
              <DetailBox label="Chain" value={project.chain} />
              <DetailBox label="Cost" value={project.cost} />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#111827] p-5 max-sm:rounded-2xl max-sm:p-4">
            <h3 className="mb-4 text-base font-extrabold tracking-tight">Official Links</h3>
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
          </div>
        </div>

        {questLinks.length ? (
          <div className="mb-5 rounded-3xl border border-white/10 bg-[#111827] p-5 max-sm:rounded-2xl max-sm:p-4">
            <h3 className="mb-4 text-base font-extrabold tracking-tight">Quest Links</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {questLinks.map((link) => (
                <a key={`${link.platform}-${link.url}`} href={link.url} target="_blank" rel="noreferrer" className="btn btn-ghost justify-start">
                  <QuestBrandIcon platform={link.platform} url={link.url} />
                  Open {link.platform}
                </a>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-3xl border border-white/10 bg-[#111827] p-5 max-sm:rounded-2xl max-sm:p-4">
          <h3 className="mb-3 text-base font-extrabold tracking-tight">Tasks</h3>
          <div className="break-words text-sm leading-7 text-slate-300">
            {renderTaskText(project.tasks)}
          </div>
        </div>
      </section>
    </div>
  );
}
