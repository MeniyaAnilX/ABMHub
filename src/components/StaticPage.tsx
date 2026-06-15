import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export function StaticPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="app-shell">
        <section className="glass rounded-[28px] p-8 max-sm:rounded-[20px] max-sm:p-5">
          <div className="mb-6 max-w-3xl">
            <h1 className="text-4xl font-black tracking-tight max-sm:text-3xl">{title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{description}</p>
          </div>

          <div className="seo-content max-w-4xl text-sm leading-7 text-slate-300">{children}</div>
        </section>
      </main>
      <Footer />
    </>
  );
}
