"use client";

import { useActionState } from "react";
import {
  updateEducationRecord,
  deleteEducationRecord,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { EducationRecord } from "@/types/database";

type Props = {
  education: EducationRecord;
};

type FormState =
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const initialState: FormState = { status: "success", message: "" };

export function EducationCard({ education }: Props) {
  const [state, formAction] = useActionState(
    updateEducationRecord,
    initialState
  );

  const achievements = education.achievements?.join("\n") ?? "";

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-slate-900">
          {education.institution}
        </h3>
        <p className="text-xs uppercase tracking-widest text-slate-500">
          {education.start_date ?? "?"} – {education.end_date ?? "?"}
        </p>
      </header>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="id" value={education.id} />

        <div className="space-y-1">
          <label className="block text-xs font-medium uppercase tracking-widest text-slate-500">
            Institution
          </label>
          <Input name="institution" defaultValue={education.institution ?? ""} required />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-xs font-medium uppercase tracking-widest text-slate-500">
              Degree
            </label>
            <Input name="degree" defaultValue={education.degree ?? ""} />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium uppercase tracking-widest text-slate-500">
              Field of study
            </label>
            <Input name="fieldOfStudy" defaultValue={education.field_of_study ?? ""} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-xs font-medium uppercase tracking-widest text-slate-500">
              Start date
            </label>
            <Input name="startDate" defaultValue={education.start_date ?? ""} />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium uppercase tracking-widest text-slate-500">
              End date
            </label>
            <Input name="endDate" defaultValue={education.end_date ?? ""} />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium uppercase tracking-widest text-slate-500">
            Highlights (one per line)
          </label>
          <Textarea name="achievements" rows={4} defaultValue={achievements} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="sm">
            Save changes
          </Button>
          {state.status === "success" ? (
            <span className="text-xs text-emerald-600">{state.message}</span>
          ) : null}
          {state.status === "error" ? (
            <span className="text-xs text-red-600">{state.message}</span>
          ) : null}
        </div>
      </form>

      <form action={deleteEducationRecord}>
        <input type="hidden" name="id" value={education.id} />
        <Button type="submit" variant="danger" size="sm">
          Delete
        </Button>
      </form>
    </div>
  );
}

