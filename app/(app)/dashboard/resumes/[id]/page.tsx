import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ResumeSchema, type ResumePayload } from "@/lib/resume/schema";
import { TemplateRenderer } from "@/components/resume/template-renderer";
import { getTemplateById } from "@/lib/resume/templates";

type ResumeDetailProps = {
  params: Promise<{ id: string }>;
};

function formatDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleString();
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
  const templateId = (data as any).template_id || "cs";
  const template = await getTemplateById(templateId);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
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
            {template && (
              <p className="text-sm text-slate-500">
                Template: <span className="font-medium">{template.name}</span>
              </p>
            )}
          </div>
        </div>
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
          <a
            href={`/dashboard/resumes/${id}/export-latex`}
            download
            className="inline-flex items-center rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 transition-all duration-200 hover:bg-blue-50"
          >
            Export LaTeX
          </a>
        </div>
      </header>

      {template && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <TemplateRenderer resume={resume} template={template} />
        </div>
      )}

      {/* Insights Section */}
      {resume.insights && (
        <div className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/30 p-6">
          <h2 className="text-lg font-semibold text-blue-900">Resume Insights</h2>
          
          {resume.insights.strengths && resume.insights.strengths.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Strengths</h3>
              <ul className="space-y-1 text-sm text-slate-700">
                {resume.insights.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {resume.insights.suggestions && resume.insights.suggestions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Suggestions to Improve Fit</h3>
              <ul className="space-y-1 text-sm text-slate-700">
                {resume.insights.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {resume.insights.missingKeywords && resume.insights.missingKeywords.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Missing Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {resume.insights.missingKeywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Template Analytics Section */}
      {resume.templateAnalytics && (
        <div className="space-y-4 rounded-xl border border-purple-200 bg-purple-50/30 p-6">
          <h2 className="text-lg font-semibold text-purple-900">Template Analysis</h2>
          
          {resume.templateAnalytics.whyThisTemplate && (
            <div>
              <h3 className="text-sm font-semibold text-purple-800 mb-2">Why This Template</h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                {resume.templateAnalytics.whyThisTemplate}
              </p>
            </div>
          )}

          {resume.templateAnalytics.atsCompatibility && (
            <div>
              <h3 className="text-sm font-semibold text-purple-800 mb-2">ATS Compatibility</h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                {resume.templateAnalytics.atsCompatibility}
              </p>
            </div>
          )}

          {resume.templateAnalytics.industryStandards && (
            <div>
              <h3 className="text-sm font-semibold text-purple-800 mb-2">Industry Standards</h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                {resume.templateAnalytics.industryStandards}
              </p>
            </div>
          )}
        </div>
      )}

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

