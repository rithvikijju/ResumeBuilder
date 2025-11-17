import { Suspense } from "react";
import { CoverLetterForm } from "./cover-letter-form";

export default function CoverLetterPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">
          Cover letter outline generator
        </h1>
        <p className="text-sm text-slate-600">
          Get a personalized outline and template for writing your cover letter. We'll analyze the job description and your resume to provide specific guidance on what to write.
        </p>
      </header>

      <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
        <CoverLetterForm />
      </Suspense>
    </div>
  );
}

