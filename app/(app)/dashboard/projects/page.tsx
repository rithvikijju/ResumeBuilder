import { Suspense } from "react";
import { ProjectForm } from "./project-form";
import { deleteProject } from "./actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProjectRecord } from "@/types/database";
import { Button } from "@/components/ui/button";

async function getProjects(): Promise<ProjectRecord[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("project_records")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch projects:", error);
    return [];
  }

  return data ?? [];
}

function formatTags(tags: string[] | null) {
  if (!tags?.length) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
      {tags.map((tag) => (
        <li
          key={tag}
          className="rounded-full bg-slate-100 px-2.5 py-1 font-medium"
        >
          {tag}
        </li>
      ))}
    </ul>
  );
}

function formatHighlights(highlights: string[] | null) {
  if (!highlights?.length) return null;
  return (
    <ul className="mt-3 space-y-1 text-sm text-slate-700">
      {highlights.map((item) => (
        <li key={item} className="leading-relaxed">
          • {item}
        </li>
      ))}
    </ul>
  );
}

async function ProjectList() {
  const projects = await getProjects();

  if (!projects.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-sm text-slate-500">
        <p>No projects yet. Add your first project to build your library.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <article
          key={project.id}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {project.title}
              </h2>
              {project.summary ? (
                <p className="mt-1 text-sm text-slate-600">
                  {project.summary}
                </p>
              ) : null}
            </div>

            <form action={deleteProject}>
              <input type="hidden" name="id" value={project.id} />
              <Button type="submit" variant="ghost" className="text-red-600">
                Remove
              </Button>
            </form>
          </div>

          {formatHighlights(project.highlights)}
          {formatTags(project.tags)}

          {project.raw_input ? (
            <details className="mt-3 text-sm text-slate-600">
              <summary className="cursor-pointer font-medium text-slate-700">
                Raw import
              </summary>
              <pre className="mt-2 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-xs text-slate-500">
                {project.raw_input}
              </pre>
            </details>
          ) : null}
        </article>
      ))}
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Project library
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Capture detailed accomplishments. We’ll rank and tailor them for
            each job later.
          </p>
        </div>
        <ProjectForm />
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
          Saved projects
        </h2>
        <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
          <ProjectList />
        </Suspense>
      </div>
    </div>
  );
}

