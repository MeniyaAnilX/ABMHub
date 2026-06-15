import type { Project } from "@/types/project";

export const SITE_URL = "https://www.abmhub.xyz";
export const SITE_NAME = "ABM Hub";

export function absoluteUrl(path = "") {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${cleanPath}`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export function seoTitleText(project: Pick<Project, "project_name" | "project_title">) {
  const customTitle = (project.project_title || "").trim();
  return customTitle || `${project.project_name} Airdrop Details Funding`;
}

export function projectSlug(project: Pick<Project, "project_name" | "project_title" | "project_slug" | "id">) {
  const permanentSlug = slugify(project.project_slug || "");
  if (permanentSlug) return permanentSlug;

  const slug = slugify(seoTitleText(project));
  return slug || project.id;
}

export function money(value: number | null | undefined) {
  const amount = Number(value || 0);
  if (!amount) return "Not disclosed";
  return amount >= 1000 ? `$${(amount / 1000).toFixed(1)}B` : `$${amount}M`;
}

export function stripRichText(value: string) {
  return value
    .replace(/\*\*/g, "")
    .replace(/\[(cyan|green|yellow|red|blue)\]/g, "")
    .replace(/\[\/(cyan|green|yellow|red|blue)\]/g, "")
    .replace(/^\s*\d+[.)-]\s*/gm, "")
    .trim();
}

export function projectTasksText(project: Project) {
  const tasks = Array.isArray(project.tasks) ? project.tasks : [];

  return tasks
    .map((task) => stripRichText(String(task || "")))
    .filter(Boolean);
}

export function projectDescription(project: Project) {
  const funding = money(project.funding_musd);
  const backers = project.backed_by || "known backers";
  const chain = project.chain || "Web3";
  const status = project.status || "Live";
  const quest = project.quest_platform || "quests";
  const summary = stripRichText(project.summary || "");

  const title = seoTitleText(project);
  const description = `${title} including funding ${funding}, backers ${backers}, ${chain} chain, ${quest} quest type, ${status} status, tasks and official links. ${summary}`;

  return description.replace(/\s+/g, " ").slice(0, 158);
}

export function projectTitle(project: Project) {
  const title = seoTitleText(project);
  return `${title} | ABM Hub`;
}

export function projectKeywords(project: Project) {
  return [
    project.project_name,
    `${project.project_name} airdrop`,
    `${project.project_name} funding`,
    `${project.project_name} tasks`,
    `${project.project_name} claim`,
    project.chain,
    project.category,
    project.backed_by,
    "airdrop",
    "Web3 airdrop",
    "ABM Hub",
  ]
    .filter(Boolean)
    .join(", ");
}
