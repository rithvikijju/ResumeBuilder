"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { importResumeSource } from "./actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ImportState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const initialState: ImportState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Importing…" : "Import resume"}
    </Button>
  );
}

export function ResumeImportForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(importResumeSource, initialState);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="space-y-2">
        <label
          htmlFor="resumeFile"
          className="block text-sm font-medium text-slate-700"
        >
          Upload your current resume
        </label>
        <input
          id="resumeFile"
          name="resumeFile"
          type="file"
          accept=".pdf,.docx,.txt,.md"
          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700"
        />
        <p className="text-xs text-slate-500">
          PDF, DOCX, TXT, or Markdown. We extract text, then you can refine the
          structured data before generating resumes.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="resumeText"
          className="block text-sm font-medium text-slate-700"
        >
          Or paste resume text
        </label>
        <Textarea
          id="resumeText"
          name="resumeText"
          rows={8}
          placeholder="Paste the full contents of your resume here."
        />
        <p className="text-xs text-slate-500">
          Useful if the parser doesn’t capture everything. We store the text
          exactly as you provide it.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-slate-700"
        >
          Notes for parsing (optional)
        </label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Add context, highlight sections to focus on, or mark areas to ignore."
        />
      </div>

      <SubmitButton />

      {state.status === "error" ? (
        <p className="text-sm text-red-600">{state.message}</p>
      ) : null}
      {state.status === "success" ? (
        <p className="text-sm text-emerald-600">{state.message}</p>
      ) : null}
    </form>
  );
}

