"use client";

import { useActionState } from "react";
import {
  updateExperienceRecord,
  deleteExperienceRecord,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ExperienceRecord } from "@/types/database";

type Props = {
  experience: ExperienceRecord;
};

type FormState =
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const initialState: FormState = { status: "success", message: "" };

export function ExperienceCard({ experience }: Props) {
  const [state, formAction] = useActionState(
    updateExperienceRecord,
    initialState
  );

  const achievements = experience.achievements?.join("\n") ?? "";
  const skills = experience.skills?.join(", ") ?? "";

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-slate-900">
          {experience.role_title} {experience.organization ? `@ ${experience.organization}` : ""}
        </h3>
        <p className="text-xs uppercase tracking-widest text-slate-500">
          {experience.start_date ?? "?"} –{" "}
          {experience.is_current ? "Present" : experience.end_date ?? "?"}
        </p>
      </header>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="id" value={experience.id} />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-xs font-medium uppercase tracking-widest text-slate-500">
              Organization
            </label>
            <Input name="organization" defaultValue={experience.organization ?? ""} required />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium uppercase tracking-widest text-slate-500">
              Role title
            </label>
            <Input name="roleTitle" defaultValue={experience.role_title ?? ""} required />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-xs font-medium uppercase tracking-widest text-slate-500">
              Location
            </label>
            <Input name="location" defaultValue={experience.location ?? ""} />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium uppercase tracking-widest text-slate-500">
              Current role
            </label>
            <Input
              type="checkbox"
              name="isCurrent"
              defaultChecked={experience.is_current ?? false}
              className="h-4 w-4"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-xs font-medium uppercase tracking-widest text-slate-500">
              Start date
            </label>
            <Input name="startDate" defaultValue={experience.start_date ?? ""} />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium uppercase tracking-widest text-slate-500">
              End date
            </label>
            <Input name="endDate" defaultValue={experience.end_date ?? ""} />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium uppercase tracking-widest text-slate-500">
            Summary
          </label>
          <Textarea name="summary" rows={3} defaultValue={experience.summary ?? ""} />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium uppercase tracking-widest text-slate-500">
            Achievements (one per line)
          </label>
          <Textarea name="achievements" rows={4} defaultValue={achievements} />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium uppercase tracking-widest text-slate-500">
            Skills (comma separated)
          </label>
          <Input name="skills" defaultValue={skills} />
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

      <form action={deleteExperienceRecord}>
        <input type="hidden" name="id" value={experience.id} />
        <Button type="submit" variant="danger" size="sm">
          Delete
        </Button>
      </form>
    </div>
  );
}

