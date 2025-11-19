"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { generateResume, type GenerateState } from "./actions";
import type {
  JobDescription,
  ProjectRecord,
  ExperienceRecord,
  EducationRecord,
  SkillRecord,
} from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getAllTemplates } from "@/lib/resume/templates";
import Link from "next/link";

type AutoSummary = {
  projects: ProjectRecord[];
  experiences: ExperienceRecord[];
  education: EducationRecord[];
  skills: SkillRecord[];
};

type GenerateFormClientProps = {
  jobDescriptions: JobDescription[];
  summary: AutoSummary;
};

const initialState: GenerateState = { status: "success", message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant="gradient" size="lg" className="w-full">
      {pending ? (
        <>
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
          Generating…
        </>
      ) : (
        "Generate Resume"
      )}
    </Button>
  );
}

export function GenerateFormClient({
  jobDescriptions,
  summary,
}: GenerateFormClientProps) {
  const [state, formAction] = useActionState(generateResume, initialState);
  const templates = getAllTemplates();

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <Card variant="elevated">
        <form action={formAction} className="space-y-6">
          <CardHeader>
            <CardTitle>Resume Details</CardTitle>
            <CardDescription>
              Configure your resume generation settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="title"
                className="block text-sm font-semibold text-gray-900"
              >
                Resume Title
              </label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Senior Software Engineer • Google"
              />
              <p className="text-xs text-gray-500">
                Optional label to help you identify this draft later.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900">
                Resume Template
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                {templates.map((template) => (
                  <label
                    key={template.id}
                    className="flex cursor-pointer flex-col gap-2 rounded-xl border-2 border-gray-200 bg-white p-4 transition-all duration-200 hover:border-blue-500 hover:shadow-md active:scale-[0.98]"
                  >
                    <input
                      type="radio"
                      name="templateId"
                      value={template.id}
                      defaultChecked={template.id === "cs"}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      required
                    />
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-900">{template.name}</p>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {template.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Choose a template that matches your target role. The resume will be formatted accordingly.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900">
                Job Description
              </label>
              {jobDescriptions.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                  <p className="text-sm text-gray-600">
                    Save a job description first to enable resume generation.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobDescriptions.map((target) => (
                    <label
                      key={target.id}
                      className="flex cursor-pointer gap-4 rounded-xl border-2 border-gray-200 bg-white p-4 transition-all duration-200 hover:border-blue-500 hover:shadow-md active:scale-[0.98]"
                    >
                      <input
                        type="radio"
                        name="jobDescriptionId"
                        value={target.id}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                        required
                      />
                      <div className="flex-1 space-y-2">
                        <p className="font-semibold text-gray-900">
                          {target.role_title ?? "Untitled role"}
                        </p>
                        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                          {[target.company, target.location, target.seniority]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>
                        <p className="line-clamp-2 text-sm text-gray-600">
                          {target.job_text}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <SubmitButton />

            {state.status === "error" ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-800">{state.message}</p>
              </div>
            ) : null}
            {state.status === "success" ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-semibold text-green-900">{state.message}</p>
                <p className="mt-2 text-sm text-green-700">
                  View it in{" "}
                  <Link
                    href={`/dashboard/resumes/${state.resumeId}`}
                    className="font-semibold underline hover:text-green-900"
                  >
                    your resume library
                  </Link>
                  .
                </p>
              </div>
            ) : null}
          </CardContent>
        </form>
      </Card>

      <Card variant="gradient">
        <CardHeader>
          <CardTitle>Automatic Relevance Scoring</CardTitle>
          <CardDescription>
            How we select the best content for your resume
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-gray-700 leading-relaxed">
            When you click generate, we'll automatically score all items in your library against the job description using AI, then select the most relevant ones for your resume.
          </p>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">
                Available in Library
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-white/60 p-3">
                  <div className="text-2xl font-bold text-gray-900">{summary.experiences.length}</div>
                  <div className="text-xs text-gray-600">Experiences</div>
                </div>
                <div className="rounded-lg bg-white/60 p-3">
                  <div className="text-2xl font-bold text-gray-900">{summary.projects.length}</div>
                  <div className="text-xs text-gray-600">Projects</div>
                </div>
                <div className="rounded-lg bg-white/60 p-3">
                  <div className="text-2xl font-bold text-gray-900">{summary.education.length}</div>
                  <div className="text-xs text-gray-600">Education</div>
                </div>
                <div className="rounded-lg bg-white/60 p-3">
                  <div className="text-2xl font-bold text-gray-900">{summary.skills.length}</div>
                  <div className="text-xs text-gray-600">Skill Groups</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">
                Selection Criteria
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Top 5-7 most relevant experiences</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Top 2-3 most relevant education entries</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Top 3-5 most relevant skill groups</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Top 3-5 most relevant projects</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="rounded-lg bg-white/60 p-3 border border-blue-200">
            <p className="text-xs text-gray-600 leading-relaxed">
              Items are scored using AI based on how well they match the job requirements, skills, and responsibilities.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
