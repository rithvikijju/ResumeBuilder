"use client";

import { useActionState } from "react";
import {
  updateSkillRecord,
  deleteSkillRecord,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SkillRecord } from "@/types/database";

type Props = {
  skill: SkillRecord;
};

type FormState =
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const initialState: FormState = { status: "success", message: "" };

export function SkillCard({ skill }: Props) {
  const [state, formAction] = useActionState(updateSkillRecord, initialState);

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="id" value={skill.id} />

        <div className="space-y-1">
          <label className="block text-xs font-medium uppercase tracking-widest text-slate-500">
            Category
          </label>
          <Input name="category" defaultValue={skill.category ?? ""} />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium uppercase tracking-widest text-slate-500">
            Skills (comma separated)
          </label>
          <Input name="skills" defaultValue={skill.skills?.join(", ") ?? ""} />
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

      <form action={deleteSkillRecord}>
        <input type="hidden" name="id" value={skill.id} />
        <Button type="submit" variant="danger" size="sm">
          Delete
        </Button>
      </form>
    </div>
  );
}

