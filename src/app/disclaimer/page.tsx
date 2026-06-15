import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = {
  title: "Airdrop Disclaimer",
  description: "Important disclaimer about airdrops, crypto risk, wallet safety and ABM Hub information.",
  alternates: {
    canonical: "/disclaimer",
  },
};

export default function Page() {
  return (
    <StaticPage title="Airdrop Disclaimer" description="Important disclaimer about airdrops, crypto risk, wallet safety and ABM Hub information.">
      <h2>Airdrop Disclaimer</h2>
                <p>ABM Hub does not guarantee that any airdrop will happen, that users will qualify, or that rewards will have value. Airdrop campaigns can change, pause or end at any time.</p>
                <h2>Security warning</h2>
                <p>Never share your seed phrase, private key or recovery phrase. Always verify URLs before connecting a wallet. Be careful with unknown contracts, token approvals and social media links.</p>
                <h2>No financial advice</h2>
                <p>ABM Hub content is for informational purposes only. It should not be treated as financial, legal, tax or investment advice.</p>
                <h2>Do your own research</h2>
                <p>Users should check official project sources and evaluate risk before completing tasks or interacting with Web3 applications.</p>
    </StaticPage>
  );
}
