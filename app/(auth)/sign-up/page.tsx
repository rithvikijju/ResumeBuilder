"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { signUp } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="inline-flex w-full justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
    >
      {pending ? "Creating account…" : "Create account"}
    </button>
  );
}

const initialState = {
  status: "success" as const,
  message: "",
};

export default function SignUpPage() {
  const [state, formAction] = useActionState(signUp, initialState);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-8 px-6 py-12">
      <div className="space-y-3 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
          Focus Resume
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Create an account
        </h1>
        <p className="text-sm text-slate-600">
          Sign up to start building tailored resumes with AI.
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
            autoComplete="email"
            placeholder="you@example.com"
            className="block w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <div className="space-y-2 text-left">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="At least 6 characters"
            minLength={6}
            className="block w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
          <p className="text-xs text-slate-500">
            Must be at least 6 characters long.
          </p>
        </div>

        <div className="space-y-2 text-left">
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-slate-700"
          >
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Re-enter your password"
            minLength={6}
            className="block w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>

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
      </form>

      <p className="text-center text-sm text-slate-500">
        <span>Already have an account?</span>{" "}
        <Link href="/sign-in" className="font-medium text-slate-900 underline">
          Sign in
        </Link>
        {" · "}
        <Link href="/" className="font-medium text-slate-900 underline">
          Return home
        </Link>
      </p>
    </main>
  );
}

