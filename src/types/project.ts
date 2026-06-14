export type ProjectStatus = "Live" | "Trending" | "Ended";
export type ProjectPhase = "Testnet" | "Mainnet" | "Both" | "Waitlist";
export type QuestPlatform = "Galxe" | "Zealy" | "Guild" | "Portal" | "None";
export type Chain =
  | "Ethereum"
  | "Optimism"
  | "Arbitrum"
  | "Base"
  | "Solana"
  | "Sui"
  | "Bitcoin"
  | "Canton Network"
  | "Hyperliquid"
  | "Multi"
  | "Polygon"
  | "BNB Chain"
  | "Avalanche"
  | "Other";
export type Cost = "Free" | "Low Gas" | "Paid";
export type Category =
  | "DeFi"
  | "AI"
  | "Layer 2"
  | "Gaming"
  | "SocialFi"
  | "Infra"
  | "Wallet"
  | "NFT"
  | "Bridge"
  | "Restaking"
  | "RWA"
  | "Other"
  | "L1"
  | "L2"
  | "ZK"
  | "DEX"
  | "Lending";

export type QuestLink = {
  platform: Exclude<QuestPlatform, "None">;
  url: string;
};

export type Project = {
  id: string;
  project_name: string;
  x_handle: string;
  funding_musd: number | null;
  backed_by: string;
  discord_url: string | null;
  website_url: string | null;
  quest_url: string | null;
  logo_url: string | null;
  category: Category;
  phase: ProjectPhase;
  status: ProjectStatus;
  quest_platform: QuestPlatform;
  quest_links: QuestLink[] | null;
  chain: Chain;
  cost: Cost;
  summary: string | null;
  tasks: string[] | null;
  created_at: string;
  updated_at: string;
};

export type ProjectForm = Omit<Project, "id" | "created_at" | "updated_at">;
