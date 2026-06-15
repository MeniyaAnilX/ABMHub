import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read the ABM Hub privacy policy and learn how basic site and account information is handled.",
  alternates: {
    canonical: "/privacy-policy",
  },
};

export default function Page() {
  return (
    <StaticPage title="Privacy Policy" description="Read the ABM Hub privacy policy and learn how basic site and account information is handled.">
      <h2>Privacy Policy</h2>
                <p>ABM Hub is designed as an informational airdrop directory. Users may browse public project content without creating an account. If users choose to sign up or log in, authentication and favorite project data are handled through Supabase.</p>
                <h2>Information we may process</h2>
                <p>When users create an account, basic account information such as email address may be processed for login and favorite project features. Favorite project records are used to let users save and view their watchlist.</p>
                <h2>Cookies and local storage</h2>
                <p>ABM Hub may use browser storage for login sessions, performance and user experience. Third-party services such as Supabase may use cookies or storage as part of authentication.</p>
                <h2>Third-party links</h2>
                <p>ABM Hub includes links to project websites, social pages and quest platforms. Those websites have their own privacy policies and security practices.</p>
                <h2>Contact</h2>
                <p>For privacy questions, contact admin@abmhub.xyz.</p>
    </StaticPage>
  );
}
