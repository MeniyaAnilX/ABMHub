import { Header } from "@/components/Header";

export default function Loading() {
  return (
    <>
      <Header />
      <main className="app-shell">
        <section className="project-seo-page mx-auto max-w-[1040px] rounded-[28px] border border-white/15 bg-[#0b1220] p-6 text-slate-400">
          Loading project details...
        </section>
      </main>
    </>
  );
}
