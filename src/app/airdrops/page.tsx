import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getSeoProjects } from "@/lib/projectsServer";
import { money, projectDescription, projectSlug } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Airdrop Projects, Funding, Backers & Tasks",
  description: "Browse Web3 airdrop projects with funding, backers, chain, quest type, status, cost, tasks and official project links.",
  alternates: {
    canonical: "/airdrops",
  },
  openGraph: {
    title: "Airdrop Projects, Funding, Backers & Tasks | ABM Hub",
    description: "Browse Web3 airdrop projects with funding, backers, chain, quest type, status, cost, tasks and official project links.",
    url: "/airdrops",
  },
};

export default async function AirdropsPage() {
  const projects = await getSeoProjects();

  return (
    <>
      <Header />
      <main className="app-shell">
        <section className="glass mb-5 rounded-[28px] p-8 max-sm:rounded-[20px] max-sm:p-5">
          <h1 className="text-4xl font-black tracking-tight max-sm:text-3xl">Web3 Airdrop Projects</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">
            Browse ABM Hub airdrop project pages with funding, backers, chain, status, quest type, cost, official links and task information.
          </p>
        </section>

        <section className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 max-sm:grid-cols-1">
          {projects.map((project) => (
            <article key={project.id} className="glass rounded-[20px] p-5">
              <Link href={`/airdrops/${projectSlug(project)}`} className="text-xl font-black hover:text-blue-300">
                {project.project_name}
              </Link>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{projectDescription(project)}</p>

              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
                  <dt className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Funding</dt>
                  <dd className="mt-1 font-extrabold text-emerald-300">{money(project.funding_musd)}</dd>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
                  <dt className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Status</dt>
                  <dd className="mt-1 font-extrabold">{project.status}</dd>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
                  <dt className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Chain</dt>
                  <dd className="mt-1 font-extrabold">{project.chain}</dd>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
                  <dt className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Cost</dt>
                  <dd className="mt-1 font-extrabold">{project.cost}</dd>
                </div>
              </dl>

              <Link href={`/airdrops/${projectSlug(project)}`} className="btn mt-4 w-full">
                Read Project Details
              </Link>
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </>
  );
}
