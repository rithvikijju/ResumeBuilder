"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { createJobDescription } from "./actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type FormState =
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const initialState: FormState = { status: "success", message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save job description"}
    </Button>
  );
}

export function JobDescriptionForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(createJobDescription, initialState);

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
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label
            htmlFor="roleTitle"
            className="block text-sm font-medium text-slate-700"
          >
            Role title
          </label>
          <Input
            id="roleTitle"
            name="roleTitle"
            placeholder="Principal Product Designer"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="company"
            className="block text-sm font-medium text-slate-700"
          >
            Company
          </label>
          <Input id="company" name="company" placeholder="Figma" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label
            htmlFor="location"
            className="block text-sm font-medium text-slate-700"
          >
            Location
          </label>
          <Input id="location" name="location" placeholder="Remote / NYC" />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="seniority"
            className="block text-sm font-medium text-slate-700"
          >
            Seniority level
          </label>
          <Input id="seniority" name="seniority" placeholder="Principal" />
        </div>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="sourceUrl"
          className="block text-sm font-medium text-slate-700"
        >
          Job posting URL
        </label>
        <Input
          id="sourceUrl"
          name="sourceUrl"
          placeholder="https://"
          type="url"
        />
        <p className="text-xs text-slate-500">
          Optional—useful for reference if the job posting changes or expires.
        </p>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="jobText"
          className="block text-sm font-medium text-slate-700"
        >
          Full job description
        </label>
        <Textarea
          id="jobText"
          name="jobText"
          rows={10}
          placeholder="Paste the entire job description here so we can match tone, responsibilities, and skills."
          required
        />
        <p className="text-xs text-slate-500">
          Include responsibilities, qualifications, and any listed keywords. The
          more detail, the better the tailored resume.
        </p>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="keywords"
          className="block text-sm font-medium text-slate-700"
        >
          Keywords (comma separated)
        </label>
        <Input
          id="keywords"
          name="keywords"
          placeholder="Figma, design systems, accessibility, leadership"
        />
        <p className="text-xs text-slate-500">
          Optional. Use this to highlight critical terms that must appear.
        </p>
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

