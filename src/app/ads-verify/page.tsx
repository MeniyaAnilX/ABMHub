import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ServerAdSlot } from "@/components/ServerAdSlot";
import { getAdSettings } from "@/lib/adsServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Ads Verification | ABM Hub",
  description: "ABM Hub advertising verification page.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdsVerifyPage() {
  const ads = await getAdSettings();
  const mainCode = ads.home_top_code || ads.home_middle_code || ads.detail_top_code || ads.detail_bottom_code || ads.footer_code || "";

  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto w-full max-w-[980px] px-4 py-8">
        <div className="glass rounded-[24px] p-5">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[.18em] text-cyan-300">ABM Hub</p>
          <h1 className="mb-2 text-2xl font-extrabold">Ads Verification</h1>
          <p className="mb-5 text-sm leading-relaxed text-slate-400">
            This page renders the saved ad code directly in the server HTML so ad network bots can verify the ad unit on the exact URL.
          </p>

          <ServerAdSlot code={mainCode} label="Advertisement" slotId="aads-verification" />
        </div>
      </section>
      <Footer />
    </main>
  );
}
