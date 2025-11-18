"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { signInWithMagicLink } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="inline-flex w-full justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
    >
      {pending ? "Sending magic link…" : "Send magic link"}
    </button>
  );
}

const initialState = {
  status: "success" as const,
  message: "",
};

function ErrorMessage({ state }: { state: { status: "error" | "success"; message: string } }) {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const errorMessage = searchParams.get("message");

  // Determine which error message to display
  let displayError = state.message;
  let isError = state.status === "error";
  
  if (errorParam === "callback") {
    displayError = errorMessage || "Authentication failed. Please try again.";
    isError = true;
  } else if (errorParam === "missing_code") {
    displayError = "Invalid magic link. Please request a new one.";
    isError = true;
  } else if (errorParam === "session_failed") {
    displayError = "Session could not be established. Please try again.";
    isError = true;
  }

  if (!displayError) return null;

  return (
    <p
      className={`text-sm ${
        isError ? "text-red-600" : "text-emerald-600"
      }`}
    >
      {displayError}
    </p>
  );
}

export default function SignInPage() {
  const [state, formAction] = useActionState(
    signInWithMagicLink,
    initialState
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-8 px-6 py-12">
      <div className="space-y-3 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
          Focus Resume
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Sign in to continue
        </h1>
        <p className="text-sm text-slate-600">
          Use your email to receive a one-time magic link. No passwords to
          remember.
        </p>
      </div>

      <form action={formAction} className="space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="space-y-2 text-left">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="block w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <SubmitButton />

        <Suspense fallback={null}>
          <ErrorMessage state={state} />
        </Suspense>
      </form>

      <p className="text-center text-sm text-slate-500">
        <span>Need to go back?</span>{" "}
        <Link href="/" className="font-medium text-slate-900 underline">
          Return home
        </Link>
      </p>
    </main>
  );
}

