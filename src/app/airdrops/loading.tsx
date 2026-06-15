import { Header } from "@/components/Header";

export default function Loading() {
  return (
    <>
      <Header />
      <main className="app-shell">
        <section className="glass rounded-[28px] p-8 text-center text-slate-400">
          Loading airdrop projects...
        </section>
      </main>
    </>
  );
}
