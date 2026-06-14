import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ABMHub — Airdrop & Trading Hub",
  description: "Discover Web3 airdrops and prop firm funding opportunities with official links, tasks and status tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
