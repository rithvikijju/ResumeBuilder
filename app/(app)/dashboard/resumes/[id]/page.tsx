import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ResumeSchema, type ResumePayload } from "@/lib/resume/schema";

type ResumeDetailProps = {
  params: Promise<{ id: string }>;
};

function formatDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleString();
}

function Section({ section }: { section: ResumePayload["sections"][number] }) {
  return (
    <section className="space-y-3 rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
      <header>
        <h3 className="text-lg font-semibold text-blue-900">
          {section.title}
        </h3>
      </header>
      <ul className="space-y-3">
        {section.items.map((item, index) => (
          <li key={index} className="space-y-1 text-sm text-slate-700">
            {item.heading ? (
              <p className="font-medium text-blue-900">{item.heading}</p>
            ) : null}
            <p className="leading-relaxed">{item.content}</p>
            {item.metrics?.length ? (
              <ul className="flex flex-wrap gap-2 text-xs uppercase tracking-widest text-slate-500">
                {item.metrics.map((metric, metricIndex) => (
                  <li
                    key={`${metric.label}-${metricIndex}`}
                    className="rounded-full border border-blue-200 px-2.5 py-1 bg-blue-50/50"
                  >
                    <span className="font-semibold text-blue-900">
                      {metric.value}
                    </span>{" "}
                    {metric.label}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function ResumeDetailPage({ params }: ResumeDetailProps) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data, error } = await supabase
    .from("resumes")
    .select("*, job_descriptions(role_title, company, job_text)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const validation = ResumeSchema.safeParse(data.structured_content);
  if (!validation.success) {
    throw new Error("Stored resume content is invalid.");
  }

  const resume = validation.data;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-slate-500">
          Generated on {formatDate(data.created_at)}
        </p>
        <h1 className="text-3xl font-semibold text-blue-900">
          {data.title}
        </h1>
        {data.job_descriptions?.role_title ? (
          <p className="text-sm text-slate-600">
            Tailored for {data.job_descriptions.role_title}{" "}
            {data.job_descriptions.company
              ? `@ ${data.job_descriptions.company}`
              : ""}
          </p>
        ) : null}
        <div className="flex gap-3">
          <Link
            href="/dashboard/resumes"
            className="inline-flex items-center rounded-lg border border-blue-200 px-4 py-2 text-sm font-medium text-blue-700 transition-all duration-200 hover:bg-blue-50 hover:border-blue-300"
          >
            Back to list
          </Link>
          <a
            href={`/dashboard/resumes/${id}/export-pdf`}
            download
            className="inline-flex items-center rounded-lg bg-blue-800 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-700 shadow-sm hover:shadow"
          >
            Export PDF
          </a>
        </div>
      </header>

      {resume.summary?.length ? (
        <section className="space-y-2 rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-blue-900">
            Professional summary
          </h2>
          <ul className="space-y-1 text-sm text-slate-700">
            {resume.summary.map((line, index) => (
              <li key={index}>• {line.sentence}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-4">
        {resume.sections.map((section, index) => (
          <Section key={section.title + index} section={section} />
        ))}
      </section>

      {resume.skills ? (
        <section className="space-y-3 rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-blue-900">Skills</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {resume.skills.primary?.length ? (
              <div>
                <h3 className="text-sm font-medium text-slate-700">Primary</h3>
                <ul className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                  {resume.skills.primary.map((skill) => (
                    <li
                      key={skill}
                      className="rounded-full bg-blue-100 px-2.5 py-1 text-blue-800"
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {resume.skills.secondary?.length ? (
              <div>
                <h3 className="text-sm font-medium text-slate-700">
                  Secondary
                </h3>
                <ul className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                  {resume.skills.secondary.map((skill) => (
                    <li
                      key={skill}
                      className="rounded-full bg-blue-100 px-2.5 py-1 text-blue-800"
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {resume.skills.tools?.length ? (
              <div>
                <h3 className="text-sm font-medium text-slate-700">Tools</h3>
                <ul className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                  {resume.skills.tools.map((skill) => (
                    <li
                      key={skill}
                      className="rounded-full bg-blue-100 px-2.5 py-1 text-blue-800"
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <details className="rounded-xl border border-blue-200 bg-blue-50/30 p-5 text-sm text-slate-600">
        <summary className="cursor-pointer font-medium text-blue-900">
          Job description reference
        </summary>
        <p className="mt-3 whitespace-pre-wrap rounded-md bg-white p-4 text-sm leading-relaxed text-slate-700">
          {data.job_descriptions?.job_text ?? "No description stored."}
        </p>
      </details>

      <details className="rounded-xl border border-blue-200 bg-blue-50/30 p-5 text-sm text-slate-600">
        <summary className="cursor-pointer font-medium text-blue-900">
          Raw JSON
        </summary>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-md bg-white p-4 text-xs text-slate-700">
          {JSON.stringify(resume, null, 2)}
        </pre>
      </details>
    </div>
  );
}

