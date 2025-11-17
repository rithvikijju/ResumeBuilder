import { Suspense } from "react";
import { JobDescriptionForm } from "./job-description-form";
import { deleteJobDescription } from "./actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { JobDescription } from "@/types/database";
import { Button } from "@/components/ui/button";

async function getJobDescriptions(): Promise<JobDescription[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("job_descriptions")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch job descriptions:", error);
    return [];
  }

  return data ?? [];
}

function renderKeywords(keywords: string[] | null) {
  if (!keywords?.length) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
      {keywords.map((keyword) => (
        <li
          key={keyword}
          className="rounded-full bg-slate-100 px-2.5 py-1 font-medium"
        >
          {keyword}
        </li>
      ))}
    </ul>
  );
}

async function JobDescriptionList() {
  const descriptions = await getJobDescriptions();

  if (!descriptions.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-sm text-slate-500">
        <p>Paste a real job description to start tailoring resumes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {descriptions.map((description) => (
        <article
          key={description.id}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {description.role_title ?? "Untitled role"}
              </h2>
              <p className="text-sm text-slate-600">
                {[description.company, description.location, description.seniority]
                  .filter(Boolean)
                  .join(" • ")}
              </p>
              {description.source_url ? (
                <a
                  href={description.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-500 underline"
                >
                  View posting
                </a>
              ) : null}
            </div>
            <form action={deleteJobDescription}>
              <input type="hidden" name="id" value={description.id} />
              <Button type="submit" variant="ghost" className="text-red-600">
                Remove
              </Button>
            </form>
          </div>

          {renderKeywords(description.keywords)}

          <details className="mt-4 text-sm text-slate-600">
            <summary className="cursor-pointer font-medium text-slate-700">
              Job description
            </summary>
            <p className="mt-2 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">
              {description.job_text}
            </p>
          </details>
        </article>
      ))}
    </div>
  );
}

export default function JobDescriptionsPage() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Job descriptions
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Paste the complete job postings here so drafts can align precisely
            with responsibilities, tone, and keywords.
          </p>
        </div>
        <JobDescriptionForm />
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
          Saved descriptions
        </h2>
        <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
          <JobDescriptionList />
        </Suspense>
      </div>
    </div>
  );
}

