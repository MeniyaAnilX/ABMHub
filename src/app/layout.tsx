import type { Metadata } from "next";
import "./globals.css";


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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
