"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { generateCoverLetterOutline, type CoverLetterState } from "./actions";
import type { JobDescription, ResumeRecord } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

type Props = {
  jobDescriptions: JobDescription[];
  resumes: ResumeRecord[];
};

const initialState: CoverLetterState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Generating outline…" : "Generate outline"}
    </Button>
  );
}

export function CoverLetterFormClient({ jobDescriptions, resumes }: Props) {
  const [state, formAction] = useActionState(generateCoverLetterOutline, initialState);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <span className="block text-sm font-medium text-slate-700">
            Job description
          </span>
          {jobDescriptions.length === 0 ? (
            <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500">
              Save a job description first to generate a cover letter outline.
            </p>
          ) : (
            <div className="space-y-3">
              {jobDescriptions.map((job) => (
                <label
                  key={job.id}
                  className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm transition hover:border-slate-300"
                >
                  <input
                    type="radio"
                    name="jobDescriptionId"
                    value={job.id}
                    className="mt-1"
                    required
                  />
                  <div className="space-y-1">
                    <p className="font-medium text-slate-900">
                      {job.role_title ?? "Untitled role"}
                    </p>
                    <p className="text-xs uppercase tracking-widest text-slate-500">
                      {[job.company, job.location, job.seniority]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <span className="block text-sm font-medium text-slate-700">
            Related resume (optional)
          </span>
          <p className="text-xs text-slate-500">
            Select a resume you've generated for this job to get more specific guidance.
          </p>
          {resumes.length === 0 ? (
            <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500">
              No resumes yet. Generate one from the{" "}
              <Link href="/dashboard/generator" className="font-medium text-slate-700 underline">
                Generator
              </Link>{" "}
              tab.
            </p>
          ) : (
            <select
              name="resumeId"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">None selected</option>
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.title}
                </option>
              ))}
            </select>
          )}
        </div>

        <SubmitButton />

        {state.status === "error" ? (
          <p className="text-sm text-red-600">{state.message}</p>
        ) : null}
      </form>

      {state.status === "success" && state.outline ? (
        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Cover Letter Outline</h2>
            <p className="mt-1 text-sm text-slate-600">
              Use this outline as a guide to write your cover letter. Fill in each section with your own voice and specific examples.
            </p>
          </div>

          <div className="space-y-6">
            {state.outline.sections.map((section, index) => (
              <section key={index} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-900">{section.title}</h3>
                <div className="space-y-2 text-sm text-slate-700">
                  <p className="font-medium text-slate-900">What to write:</p>
                  <p className="leading-relaxed">{section.guidance}</p>
                  {section.keyPoints && section.keyPoints.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-2 font-medium text-slate-900">Key points to include:</p>
                      <ul className="ml-4 list-disc space-y-1">
                        {section.keyPoints.map((point, pointIndex) => (
                          <li key={pointIndex}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {section.examples && section.examples.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-2 font-medium text-slate-900">Example phrases (adapt these):</p>
                      <ul className="ml-4 list-disc space-y-1 italic text-slate-600">
                        {section.examples.map((example, exampleIndex) => (
                          <li key={exampleIndex}>{example}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>

          {state.outline.tips && state.outline.tips.length > 0 && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <h3 className="mb-2 font-semibold text-emerald-900">Writing Tips</h3>
              <ul className="space-y-1 text-sm text-emerald-800">
                {state.outline.tips.map((tip, tipIndex) => (
                  <li key={tipIndex}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

