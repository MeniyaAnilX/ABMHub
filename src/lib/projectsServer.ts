import { createClient } from "@supabase/supabase-js";
import type { Project } from "@/types/project";
import { projectSlug } from "@/lib/seo";

function createServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function getSeoProjects() {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("SEO projects read error:", error.message);
    return [] as Project[];
  }

  return (data || []) as Project[];
}

export async function getProjectBySlug(slug: string) {
  const projects = await getSeoProjects();
  return projects.find((project) => projectSlug(project) === slug) || null;
}
