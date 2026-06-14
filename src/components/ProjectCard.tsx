import type { Project } from "@/types/project";
import { ExternalLink, Globe, Trophy, Wallet } from "lucide-react";
import { getQuestLabel } from "@/lib/questLinks";

type ProjectCardProps = {
  project: Project;
  onOpen?: (project: Project) => void;
};

const colorMap: Record<string, string> = {
  Live: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  Trending: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  Ended: "bg-red-500/15 text-red-300 border-red-500/25",
  Testnet: "bg-cyan-500/15 text-cyan-300 border-cyan-500/25",
  Mainnet: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  Both: "bg-purple-500/15 text-purple-300 border-purple-500/25",
  Waitlist: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  Galxe: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  Zealy: "bg-purple-500/15 text-purple-300 border-purple-500/25",
  Guild: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  Portal: "bg-cyan-500/15 text-cyan-300 border-cyan-500/25",
  None: "bg-red-500/15 text-red-300 border-red-500/25",
};

function money(value: number | null) {
  const amount = Number(value || 0);
  return amount >= 1000 ? `$${(amount / 1000).toFixed(1)}B` : `$${amount}M`;
}

function initials(name: string) {
  return name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase();
}

export function ProjectCard({ project, onOpen }: ProjectCardProps) {
  const xUrl = `https://x.com/${project.x_handle.replace("@", "")}`;
  const questLabel = getQuestLabel(project);

  return (
    <article
      onClick={() => onOpen?.(project)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter") onOpen?.(project);
      }}
      className="glass smooth-card flex min-h-[318px] cursor-pointer flex-col gap-3 rounded-[20px] p-[18px]"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-[50px] w-[50px] shrink-0 place-items-center overflow-hidden rounded-[15px] border border-white/15 bg-purple-600 font-extrabold text-white">
          {project.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={project.logo_url} alt={`${project.project_name} logo`} className="h-full w-full object-cover" />
          ) : (
            initials(project.project_name)
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="text-[17px] font-extrabold tracking-tight">{project.project_name}</h3>
            <span className="rounded-md border border-blue-500/25 bg-blue-500/15 px-2 py-1 text-[10px] font-extrabold text-blue-300">
              {project.category}
            </span>
          </div>
          <a
            href={xUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-blue-300 hover:underline"
          >
            {project.x_handle}
            <ExternalLink size={12} />
          </a>
        </div>

        {project.website_url ? (
          <a
            href={project.website_url}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="grid h-[36px] w-[36px] shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[.045] text-slate-400 hover:border-cyan-400/25 hover:text-white"
            title="Website"
          >
            <Globe size={16} />
          </a>
        ) : null}
      </div>

      <p className="min-h-[39px] text-[12.5px] leading-relaxed text-slate-400">
        {project.summary || "Airdrop opportunity with funding, backers and task tracking."}
      </p>

      <div className="flex flex-wrap gap-2">
        <span className={`badge ${colorMap[project.phase] || colorMap.Testnet}`}>{project.phase}</span>
        <span className={`badge ${colorMap[project.status] || colorMap.Live}`}>{project.status}</span>
        <span className={`badge ${colorMap[questLabel] || "bg-cyan-500/15 text-cyan-300 border-cyan-500/25"}`}>
          <Trophy size={13} />
          {questLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-[13px] border border-white/10 bg-black/15 p-3">
          <div className="mb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Funding</div>
          <div className="text-sm font-bold text-emerald-300">{money(project.funding_musd)}</div>
        </div>
        <div className="rounded-[13px] border border-white/10 bg-black/15 p-3">
          <div className="mb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Backed by</div>
          <div className="text-sm font-bold">{project.backed_by}</div>
        </div>
        <div className="col-span-2 rounded-[13px] border border-white/10 bg-black/15 p-3">
          <div className="mb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Chain</div>
          <div className="text-sm font-bold">{project.chain}</div>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap gap-2 border-t border-white/10 pt-3">
        <span className="badge border-cyan-500/25 bg-cyan-500/15 text-cyan-300">
          <Wallet size={13} />
          {project.cost}
        </span>
      </div>
    </article>
  );
}
