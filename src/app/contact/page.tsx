import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = {
  title: "Contact ABM Hub",
  description: "Contact ABM Hub for project listing questions, corrections or general support.",
  alternates: {
    canonical: "/contact",
  },
};

export default function Page() {
  return (
    <StaticPage title="Contact ABM Hub" description="Contact ABM Hub for project listing questions, corrections or general support.">
      <h2>Contact</h2>
                <p>For project corrections, listing questions or general feedback, contact ABM Hub by email.</p>
                <p><strong>Email:</strong> admin@abmhub.xyz</p>
                <h2>Project information updates</h2>
                <p>If you notice an outdated funding amount, broken link, changed project status or incorrect task information, send the project name and the correction details.</p>
                <h2>Safety</h2>
                <p>ABM Hub will never ask for your seed phrase or private key. Do not share wallet recovery phrases with anyone.</p>
    </StaticPage>
  );
}
