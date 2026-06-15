import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Read the ABM Hub terms of use for informational airdrop research and project links.",
  alternates: {
    canonical: "/terms",
  },
};

export default function Page() {
  return (
    <StaticPage title="Terms of Use" description="Read the ABM Hub terms of use for informational airdrop research and project links.">
      <h2>Terms of Use</h2>
                <p>By using ABM Hub, users agree that the website is provided for informational and research purposes only. ABM Hub is not financial advice, investment advice or a guarantee of any reward.</p>
                <h2>User responsibility</h2>
                <p>Users are responsible for verifying official project links, reviewing risk, protecting wallet security and deciding whether to complete any airdrop task.</p>
                <h2>No guarantee</h2>
                <p>Funding information, project status, tasks and links may change over time. ABM Hub tries to organize useful information but cannot guarantee accuracy, availability, rewards or eligibility.</p>
                <h2>External websites</h2>
                <p>ABM Hub may link to third-party websites and social platforms. Users visit third-party websites at their own risk.</p>
    </StaticPage>
  );
}
