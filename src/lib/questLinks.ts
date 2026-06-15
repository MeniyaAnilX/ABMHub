import type { Project, QuestLink } from "@/types/project";

const validPlatforms = ["Galxe", "Zealy", "Guild", "Portal"] as const;

export function getQuestLinks(project: Project): QuestLink[] {
  if (Array.isArray(project.quest_links) && project.quest_links.length > 0) {
    return project.quest_links.filter((link) => {
      return validPlatforms.includes(link.platform) && Boolean(link.url);
    });
  }

  if (
    project.quest_url &&
    project.quest_platform &&
    project.quest_platform !== "None" &&
    validPlatforms.includes(project.quest_platform)
  ) {
    return [
      {
        platform: project.quest_platform,
        url: project.quest_url,
      },
    ];
  }

  return [];
}

export function getQuestLabel(project: Project) {
  const links = getQuestLinks(project);

  if (links.length === 0) return "None";
  if (links.length === 1) return links[0].platform;

  return `${links.length} Quests`;
}
