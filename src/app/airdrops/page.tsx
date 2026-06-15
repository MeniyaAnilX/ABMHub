import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProjectCard } from "@/components/ProjectCard";
import { getSeoProjects } from "@/lib/projectsServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

        {projects.length ? (
          <section className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-[15px] max-sm:grid-cols-1 max-sm:gap-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </section>
        ) : (
          <section className="glass rounded-[20px] p-8 text-center text-slate-400">
            No airdrop projects found yet.
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
