import { ReactNode } from "react";
import { signOut } from "@/app/actions/sign-out";
import { requireUser } from "@/lib/auth/server";
import { DashboardNav } from "@/components/dashboard/nav";
import { Button } from "@/components/ui/button";
import { BackgroundPattern } from "@/components/ui/background-pattern";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/library", label: "Resume data" },
  { href: "/dashboard/projects", label: "Projects" },
  { href: "/dashboard/job-descriptions", label: "Job descriptions" },
  { href: "/dashboard/generator", label: "Generate" },
  { href: "/dashboard/resumes", label: "Resumes" },
  { href: "/dashboard/cover-letter", label: "Cover letter" },
];

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  await requireUser();

  return (
    <div className="min-h-screen relative">
      <BackgroundPattern />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Focus Resume</h1>
                <p className="text-sm text-gray-500 mt-0.5">AI-powered resume builder</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
              Collect resume content, track real job descriptions, and generate
              tailored drafts powered by AI.
            </p>
          </div>
          <form action={signOut}>
            <Button variant="secondary" size="md">
              Sign out
            </Button>
          </form>
        </header>

        <DashboardNav items={navItems} />

        <main className="mt-8 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
