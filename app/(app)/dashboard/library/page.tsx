import { Suspense } from "react";
import { ResumeImportForm } from "./resume-import-form";
import { ParseResumeButton } from "./parse-resume-button";
import { ExperienceCard } from "./experience-card";
import { EducationCard } from "./education-card";
import { SkillCard } from "./skill-card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ResumeSource,
  ExperienceRecord,
  EducationRecord,
  SkillRecord,
} from "@/types/database";

async function getLibraryData(): Promise<{
  sources: ResumeSource[];
  experience: ExperienceRecord[];
  education: EducationRecord[];
  skills: SkillRecord[];
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { sources: [], experience: [], education: [], skills: [] };
  }

  const [sourcesResult, experienceResult, educationResult, skillResult] =
    await Promise.all([
    supabase
      .from("resume_sources")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("experience_records")
      .select("*")
      .eq("user_id", user.id)
        .order("start_date", { ascending: false }),
      supabase
        .from("education_records")
        .select("*")
        .eq("user_id", user.id)
        .order("start_date", { ascending: false }),
      supabase
        .from("skill_records")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

  return {
    sources: sourcesResult.data ?? [],
    experience: experienceResult.data ?? [],
    education: educationResult.data ?? [],
    skills: skillResult.data ?? [],
  };
}

function truncate(text: string | null | undefined, length = 280) {
  if (!text) return "";
  if (text.length <= length) return text;
  return `${text.slice(0, length)}…`;
}

async function ResumeLibraryList() {
  const { sources, experience, education, skills } = await getLibraryData();
  const experienceCount = experience.reduce<Record<string, number>>(
    (acc, item) => {
      if (item.resume_source_id) {
        acc[item.resume_source_id] = (acc[item.resume_source_id] ?? 0) + 1;
      }
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <header>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
            Imported resumes
          </h2>
          <p className="text-xs text-slate-500">
            We store the raw text so you can curate structured entries and reuse
            them across drafts.
          </p>
        </header>

        {sources.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            <p>No resume uploads yet.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {sources.map((source) => (
              <li
                key={source.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <p className="font-medium text-slate-900">
                      {source.original_filename ?? "Imported resume"}
                    </p>
                    <p className="text-xs uppercase tracking-widest text-slate-500">
                      {new Date(
                        source.created_at ?? source.updated_at ?? ""
                      ).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span
                      className={`rounded-full px-2 py-1 font-semibold ${
                        source.parse_status === "success"
                          ? "bg-emerald-50 text-emerald-700"
                          : source.parse_status === "failed"
                          ? "bg-red-50 text-red-600"
                          : source.parse_status === "processing"
                          ? "bg-slate-100 text-slate-600"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {source.parse_status ?? "pending"}
                    </span>
                    {source.parsed_at ? (
                      <span>
                        Parsed {new Date(source.parsed_at).toLocaleString()}
                      </span>
                    ) : null}
                    <span>
                      Experience entries: {experienceCount[source.id] ?? 0}
                    </span>
                  </div>

                  {source.parse_error ? (
                    <p className="text-xs text-red-600">{source.parse_error}</p>
                  ) : null}

                  <p className="text-sm text-slate-600">
                    {truncate(source.extracted_text)}
                  </p>

                  <ParseResumeButton
                    sourceId={source.id}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-6">
        <header className="space-y-1">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
            Experience
          </h2>
          <p className="text-xs text-slate-500">
            Edit and refine each role before generating new resumes.
          </p>
        </header>

        {experience.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            <p>No structured experience captured yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {experience.map((item) => (
              <ExperienceCard key={item.id} experience={item} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-6">
        <header className="space-y-1">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
            Education
          </h2>
          <p className="text-xs text-slate-500">
            Keep academic history accurate and up to date.
          </p>
        </header>

        {education.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            <p>No education records yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {education.map((item) => (
              <EducationCard key={item.id} education={item} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-6">
        <header className="space-y-1">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
            Skill groups
          </h2>
          <p className="text-xs text-slate-500">
            Organize skills into categories for consistent resume sections.
          </p>
        </header>

        {skills.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            <p>No skill groups yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {skills.map((item) => (
              <SkillCard key={item.id} skill={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function ResumeLibraryPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">
          Resume knowledge base
        </h1>
        <p className="text-sm text-slate-600">
          Upload existing resumes and track structured experience, education,
          and skills. We’ll use this source-of-truth to tailor every draft.
        </p>
      </header>

      <ResumeImportForm />

      <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
        <ResumeLibraryList />
      </Suspense>
    </div>
  );
}

