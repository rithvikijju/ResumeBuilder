import { getSession } from "@/lib/auth/server";
import { signOut } from "@/app/actions/sign-out";
import Link from "next/link";

export default async function Home() {
  const user = await getSession();
  const isAuthenticated = Boolean(user);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-12 px-6 py-24 lg:px-8">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
          Focus Resume
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Tailor every résumé to the role that matters.
          </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-slate-600">
          We’ll collect your best projects, parse prior résumés, understand the
          job you’re targeting, and generate a polished résumé that highlights
          what recruiters expect for that position.
        </p>
      </header>

      <section className="grid gap-6 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 sm:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">
            Build plan (in progress)
          </h2>
          <p className="text-sm text-slate-600">
            We’re setting up authentication, secure data storage, and the AI
            resume pipeline. Follow along as we iterate on each layer.
          </p>
        </div>
        <ol className="space-y-2 text-sm text-slate-700">
          <li>1. Project scaffolding & design system</li>
          <li>2. Supabase auth + data model</li>
          <li>3. Project/job collection workflows</li>
          <li>4. AI tailoring pipeline</li>
          <li>5. PDF / LaTeX generation & export</li>
          <li>6. Deployment & observability</li>
        </ol>
      </section>

      <section className="space-y-5 rounded-3xl bg-slate-900 p-8 text-slate-50">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Next up</h2>
          <p className="text-sm text-slate-200">
            Authentication is wired. We’re about to layer in project intake,
            job-target capture, and AI-driven resume drafts.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-200"
              >
                Go to dashboard
              </Link>
              <form action={signOut} className="inline-flex">
                <button
                  type="submit"
                  className="inline-flex items-center rounded-md border border-white/60 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/sign-in"
              className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-200"
          >
              Sign in to get started
            </Link>
          )}
        </div>
      </section>
      </main>
  );
}
