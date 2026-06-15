import type { MetadataRoute } from "next";
import { getSeoProjects } from "@/lib/projectsServer";
import { absoluteUrl, projectSlug } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getSeoProjects();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/airdrops"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: absoluteUrl("/about"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/contact"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.45,
    },
    {
      url: absoluteUrl("/privacy-policy"),
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.35,
    },
    {
      url: absoluteUrl("/terms"),
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.35,
    },
    {
      url: absoluteUrl("/disclaimer"),
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.35,
    },
  ];

  const projectPages: MetadataRoute.Sitemap = projects.map((project) => ({
    url: absoluteUrl(`/airdrops/${projectSlug(project)}`),
    lastModified: new Date(project.updated_at || project.created_at || Date.now()),
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  return [...staticPages, ...projectPages];
}
