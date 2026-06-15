import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.abmhub.xyz"),
  applicationName: "ABM Hub",
  title: {
    default: "ABM Hub — Web3 Projects Details",
    template: "%s | ABM Hub",
  },
  description: "Discover Web3 airdrop projects with funding, backers, chain, quest type, status, tasks and official links.",
  keywords: ["airdrop", "Web3 airdrops", "crypto airdrop", "airdrop tasks", "airdrop funding", "ABM Hub"],
  authors: [{ name: "ABM Hub" }],
  creator: "ABM Hub",
  publisher: "ABM Hub",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://www.abmhub.xyz",
    siteName: "ABM Hub",
    title: "ABM Hub — Web3 Airdrop Projects, Funding & Tasks",
    description: "Discover Web3 airdrop projects with funding, backers, chain, quest type, status, tasks and official links.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ABM Hub — Web3 Airdrop Projects, Funding & Tasks",
    description: "Discover Web3 airdrop projects with funding, backers, chain, quest type, status, tasks and official links.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={quicksand.className}>{children}</body>
    </html>
  );
}
