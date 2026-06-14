import type { Project } from "@/types/project";
import { ExternalLink, Globe, MessageCircle, Trophy, X } from "lucide-react";
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

      <section className="project-modal-opaque no-glow relative z-[60] max-h-[92vh] w-full max-w-[1040px] overflow-y-auto rounded-[28px] border border-white/15 bg-[#0b1220] p-6 max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:rounded-none max-sm:border-0 max-sm:p-4">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-4 max-sm:gap-3">
            <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-[18px] border border-white/15 bg-purple-600 font-extrabold text-white max-sm:h-12 max-sm:w-12 max-sm:rounded-2xl">
              {project.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={project.logo_url} alt={`${project.project_name} logo`} className="h-full w-full object-cover" />
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

        <div className="mb-5 rounded-3xl border border-white/10 bg-[#111827] p-5">
          <div className="mb-2 text-sm font-extrabold">Summary</div>
          <p className="text-sm leading-relaxed text-slate-400">
            {project.summary || "Project details and links."}
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr] max-sm:gap-4">
          <div className="grid gap-5">
            <div className="rounded-3xl border border-white/10 bg-[#111827] p-5 max-sm:rounded-2xl max-sm:p-4">
              <h3 className="mb-4 text-base font-extrabold tracking-tight">Project Snapshot</h3>
              <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                <DetailBox label="Funding" value={money(project.funding_musd)} highlight />
                <DetailBox label="Backed by" value={project.backed_by} />
                <DetailBox label="Phase" value={project.phase} />
                <DetailBox label="Status" value={project.status} />
                <DetailBox label="Quest" value={questLabel} />
                <DetailBox label="Chain" value={project.chain} />
                <DetailBox label="Cost" value={project.cost} />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#111827] p-5 max-sm:rounded-2xl max-sm:p-4">
              <h3 className="mb-3 text-base font-extrabold tracking-tight">Tasks</h3>
              <div className="text-sm leading-7 text-slate-300 whitespace-pre-wrap">
                {(project.tasks && project.tasks.length ? project.tasks.join("\n") : "No tasks added yet.")}
              </div>
            </div>
          </div>

          <div className="grid gap-5 content-start">
            <div className="rounded-3xl border border-white/10 bg-[#111827] p-5 max-sm:rounded-2xl max-sm:p-4">
              <h3 className="mb-4 text-base font-extrabold tracking-tight">Official Links</h3>
              <div className="grid gap-3">
                <a href={xUrl} target="_blank" rel="noreferrer" className="btn btn-ghost justify-start">
                  <ExternalLink size={16} />
                  Open X
                </a>

                {project.discord_url ? (
                  <a href={project.discord_url} target="_blank" rel="noreferrer" className="btn btn-ghost justify-start">
                    <MessageCircle size={16} />
                    Join Discord
                  </a>
                ) : null}

                {project.website_url ? (
                  <a href={project.website_url} target="_blank" rel="noreferrer" className="btn justify-start">
                    <Globe size={16} />
                    Visit Website
                  </a>
                ) : null}
              </div>
            </div>

            {questLinks.length ? (
              <div className="rounded-3xl border border-white/10 bg-[#111827] p-5 max-sm:rounded-2xl max-sm:p-4">
                <h3 className="mb-4 text-base font-extrabold tracking-tight">Quest Links</h3>
                <div className="grid gap-3">
                  {questLinks.map((link) => (
                    <a key={`${link.platform}-${link.url}`} href={link.url} target="_blank" rel="noreferrer" className="btn btn-ghost justify-start">
                      <Trophy size={16} />
                      Open {link.platform}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
