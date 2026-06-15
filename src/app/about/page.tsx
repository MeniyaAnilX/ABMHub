import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = {
  title: "About ABM Hub",
  description: "Learn what ABM Hub does and how it helps users research Web3 airdrop projects.",
  alternates: {
    canonical: "/about",
  },
};

export default function Page() {
  return (
    <StaticPage title="About ABM Hub" description="Learn what ABM Hub does and how it helps users research Web3 airdrop projects.">
      <h2>What is ABM Hub?</h2>
                <p>ABM Hub is an informational Web3 airdrop directory. The goal is to help users quickly review airdrop projects, funding details, backers, chain information, quest types, status, official links and project tasks in one clean place.</p>
                <h2>Why ABM Hub exists</h2>
                <p>Many airdrop hunters spend time moving between social posts, project websites and quest platforms. ABM Hub is built to organize that research so users can compare projects before deciding whether to visit official links or complete tasks.</p>
                <h2>Important note</h2>
                <p>ABM Hub does not guarantee rewards, token allocations or eligibility. Users should always verify official project sources and do their own research before connecting a wallet or completing tasks.</p>
    </StaticPage>
  );
}
