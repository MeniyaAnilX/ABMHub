import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getProjectBySlug, getSeoProjects } from "@/lib/projectsServer";
import { absoluteUrl, money, projectDescription, projectKeywords, projectSlug, projectTasksText, projectTitle } from "@/lib/seo";
import { getQuestLinks, getQuestLabel } from "@/lib/questLinks";

export const revalidate = 3600;

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
  const project = await getProjectBySlug(slug);

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

function cleanTask(task: string) {
  return task
    .replace(/\*\*/g, "")
    .replace(/\[(cyan|green|yellow|red|blue)\]/g, "")
    .replace(/\[\/(cyan|green|yellow|red|blue)\]/g, "")
    .trim();
}

export default async function AirdropProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) notFound();

  const path = `/airdrops/${projectSlug(project)}`;
  const xUrl = `https://x.com/${project.x_handle.replace("@", "")}`;
  const questLinks = getQuestLinks(project);
  const questLabel = getQuestLabel(project);
  const tasks = projectTasksText(project);
  const updatedDate = project.updated_at || project.created_at;
  const pageUrl = absoluteUrl(path);

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
        <article className="glass rounded-[28px] p-8 max-sm:rounded-[20px] max-sm:p-5">
          <header className="mb-8 flex items-start gap-5 max-sm:gap-3">
            <div className="project-logo-frame grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-[22px] border border-slate-700/80 bg-black/45 font-black text-white max-sm:h-14 max-sm:w-14 max-sm:rounded-2xl">
              {project.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={project.logo_url} alt={`${project.project_name} logo`} className="h-full w-full object-cover" loading="eager" decoding="async" />
              ) : (
                project.project_name.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <p className="mb-2 text-sm font-extrabold text-blue-300">Airdrop Project Details</p>
              <h1 className="text-4xl font-black tracking-tight max-sm:text-3xl">
                {project.project_name} Airdrop, Funding, Tasks & Project Details
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">{projectDescription(project)}</p>
              <p className="mt-3 text-xs text-slate-500">Last updated: {new Date(updatedDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
            </div>
          </header>

          <section className="mb-6 rounded-3xl border border-white/10 bg-[#111827] p-5">
            <h2 className="mb-3 text-xl font-black">Summary</h2>
            <p className="text-sm leading-7 text-slate-300">
              {project.summary || `${project.project_name} is listed on ABM Hub as a Web3 airdrop project. This page is designed to help users review important project information before visiting official links or completing tasks.`}
            </p>
          </section>

          <section className="mb-6 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
            <div className="rounded-3xl border border-white/10 bg-[#111827] p-5">
              <h2 className="mb-4 text-xl font-black">Project Details</h2>
              <dl className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                <div className="rounded-2xl border border-white/10 bg-[#0b1020] p-4">
                  <dt className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">Funding</dt>
                  <dd className="mt-2 font-black text-emerald-300">{money(project.funding_musd)}</dd>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#0b1020] p-4">
                  <dt className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">Backed by</dt>
                  <dd className="mt-2 font-black">{project.backed_by || "Not disclosed"}</dd>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#0b1020] p-4">
                  <dt className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">Phase</dt>
                  <dd className="mt-2 font-black">{project.phase}</dd>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#0b1020] p-4">
                  <dt className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">Status</dt>
                  <dd className={`mt-2 font-black ${statusClass(project.status)}`}>{project.status}</dd>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#0b1020] p-4">
                  <dt className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">Quest Type</dt>
                  <dd className="mt-2 font-black">{questLabel}</dd>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#0b1020] p-4">
                  <dt className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">Chain</dt>
                  <dd className="mt-2 font-black">{project.chain}</dd>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#0b1020] p-4">
                  <dt className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">Cost</dt>
                  <dd className="mt-2 font-black">{project.cost}</dd>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#0b1020] p-4">
                  <dt className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">Category</dt>
                  <dd className="mt-2 font-black">{project.category}</dd>
                </div>
              </dl>
            </div>

            <aside className="rounded-3xl border border-white/10 bg-[#111827] p-5">
              <h2 className="mb-4 text-xl font-black">Official Links</h2>
              <div className="grid gap-3">
                <a href={xUrl} target="_blank" rel="noreferrer" className="btn btn-ghost justify-start">Follow on X</a>
                {project.discord_url ? <a href={project.discord_url} target="_blank" rel="noreferrer" className="btn btn-ghost justify-start">Join Discord</a> : null}
                {project.website_url ? <a href={project.website_url} target="_blank" rel="noreferrer" className="btn btn-ghost justify-start">Visit Website</a> : null}
                {project.claim_airdrop_url ? <a href={project.claim_airdrop_url} target="_blank" rel="noreferrer" className="btn justify-start">Claim Airdrop</a> : null}
              </div>
            </aside>
          </section>

          <section className="mb-6 rounded-3xl border border-white/10 bg-[#111827] p-5">
            <h2 className="mb-4 text-xl font-black">Quest Links</h2>
            {questLinks.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {questLinks.map((link, index) => (
                  <a key={`${link.url}-${index}`} href={link.url} target="_blank" rel="noreferrer" className="btn btn-ghost justify-start">
                    Open {link.platform}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No quest links have been added yet.</p>
            )}
          </section>

          <section className="mb-6 rounded-3xl border border-white/10 bg-[#111827] p-5">
            <h2 className="mb-4 text-xl font-black">{project.project_name} Tasks</h2>
            {tasks.length ? (
              <ol className="grid list-decimal gap-3 pl-5 text-sm leading-7 text-slate-300">
                {tasks.map((task, index) => (
                  <li key={`${task}-${index}`}>{cleanTask(task)}</li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-slate-400">No tasks have been added yet. Check the official links for the latest project instructions.</p>
            )}
          </section>

          <section className="rounded-3xl border border-amber-400/15 bg-amber-400/10 p-5">
            <h2 className="mb-3 text-xl font-black">Airdrop Disclaimer</h2>
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
