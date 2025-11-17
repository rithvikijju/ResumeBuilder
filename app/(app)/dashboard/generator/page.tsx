import { Suspense } from "react";
import { GenerateResumeForm } from "./resume-form";

export default function GeneratorPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Generate Tailored Resume
        </h1>
        <p className="text-gray-600 max-w-3xl leading-relaxed">
          Select a job description and we'll automatically select the most relevant experiences, projects, and skills from your library to craft a tailored resume.
        </p>
      </div>

      <Suspense fallback={
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-500">Loading…</p>
        </div>
      }>
        {/* @ts-expect-error Async Server Component */}
        <GenerateResumeForm />
      </Suspense>
    </div>
  );
}
