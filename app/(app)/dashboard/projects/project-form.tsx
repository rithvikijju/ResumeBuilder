"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { createProject } from "./actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save project"}
    </Button>
  );
}

const initialState = {
  status: "success" as const,
  message: "",
};

type ProjectFormState = typeof initialState;

export function ProjectForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    createProject,
    initialState
  );

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
      <div className="space-y-1">
        <label
          htmlFor="title"
          className="block text-sm font-medium text-slate-700"
        >
          Project title
        </label>
        <Input
          id="title"
          name="title"
          placeholder="e.g. Automated deployment pipeline"
          required
        />
        <p className="text-xs text-slate-500">
          Keep it concise—company + impact is a good pattern.
        </p>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="summary"
          className="block text-sm font-medium text-slate-700"
        >
          Summary
        </label>
        <Textarea
          id="summary"
          name="summary"
          rows={4}
          placeholder="Briefly describe the project goals, tech, and your role."
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="highlights"
          className="block text-sm font-medium text-slate-700"
        >
          Highlights (one per line)
        </label>
        <Textarea
          id="highlights"
          name="highlights"
          rows={4}
          placeholder={`Increased deployment frequency by 3x\nReduced incident MTTR from 45m to 12m`}
        />
        <p className="text-xs text-slate-500">
          Each line becomes a bullet point when we tailor the resume.
        </p>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="tags"
          className="block text-sm font-medium text-slate-700"
        >
          Tags (comma separated)
        </label>
        <Input
          id="tags"
          name="tags"
          placeholder="devops, kubernetes, aws"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="rawInput"
          className="block text-sm font-medium text-slate-700"
        >
          Imported text (optional)
        </label>
        <Textarea
          id="rawInput"
          name="rawInput"
          rows={3}
          placeholder="Paste raw resume text or notes here."
        />
        <p className="text-xs text-slate-500">
          We’ll parse this later to extract structured accomplishments.
        </p>
      </div>

      <div className="space-y-2">
        <SubmitButton />
        {state.message ? (
          <p
            className={`text-sm ${
              state.status === "error" ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}

