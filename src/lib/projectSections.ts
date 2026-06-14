import type { Category, Project } from "@/types/project";

export type ProjectSection = "airdrop" | "trading";

export const airdropCategories: Category[] = [
  "DeFi",
  "AI",
  "Layer 2",
  "SocialFi",
  "Infra",
  "Wallet",
  "NFT",
  "Bridge",
  "Restaking",
  "RWA",
  "Other",
];

export const tradingCategories: Category[] = [
  "Prop Firm",
  "Free Funding",
  "Trading Challenge",
  "Broker",
  "Trading Tool",
];

export const allCategories: Category[] = [...airdropCategories, ...tradingCategories];

export function isTradingCategory(category: string | null | undefined) {
  return tradingCategories.includes(category as Category);
}

export function getProjectSection(project: Project): ProjectSection {
  return isTradingCategory(project.category) ? "trading" : "airdrop";
}

export function getSectionCopy(section: ProjectSection) {
  if (section === "trading") {
    return {
      title: "Trading",
      allLabel: "All Funding",
      favoritesLabel: "My Favorites",
      search: "Search prop firm, funding account, broker, market...",
      favoriteEmptyTitle: "No favorite funding account found",
      favoriteEmptyText: "Star prop firm opportunities from the cards, then open My Favorites to find them quickly.",
      emptyText: "No matching prop firm opportunities found.",
      browseText: "Browse All Funding",
      claimText: "Claim Free Funding",
      fundingLabel: "Max Account",
      backedLabel: "Provider",
      phaseLabel: "Program",
      chainLabel: "Market",
      questLabel: "Links",
      fallbackSummary: "Free funding or prop firm opportunity with details, rules and application links.",
    };
  }

  return {
    title: "Airdrop",
    allLabel: "All Projects",
    favoritesLabel: "My Favorites",
    search: "Search project, backer, chain, quest, category...",
    favoriteEmptyTitle: "No favorite project found",
    favoriteEmptyText: "Star projects from the cards, then open My Favorites to find them quickly anytime.",
    emptyText: "No matching projects found.",
    browseText: "Browse All Projects",
    claimText: "Claim Airdrop",
    fundingLabel: "Funding",
    backedLabel: "Backed by",
    phaseLabel: "Phase",
    chainLabel: "Chain",
    questLabel: "Quest",
    fallbackSummary: "Airdrop opportunity with funding, backers and task tracking.",
  };
}
