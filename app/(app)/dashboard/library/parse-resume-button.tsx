"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { parseResumeSource } from "./actions";
import { Button } from "@/components/ui/button";

type ParseResumeButtonProps = {
  sourceId: string;
};

type ParseState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const initialState: ParseState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" size="sm" disabled={pending}>
      {pending ? "Parsing…" : "Parse resume"}
    </Button>
  );
}

export function ParseResumeButton({ sourceId }: ParseResumeButtonProps) {
  const [state, formAction] = useActionState(parseResumeSource, initialState);

  return (
    <div className="space-y-1">
      <form action={formAction} className="inline-flex">
        <input type="hidden" name="sourceId" value={sourceId} />
        <SubmitButton />
      </form>
      {state.status === "error" ? (
        <p className="text-xs text-red-600">{state.message}</p>
      ) : null}
      {state.status === "success" ? (
        <p className="text-xs text-emerald-600">{state.message}</p>
      ) : null}
    </div>
  );
}

