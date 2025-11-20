import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ResumeRecord } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteResume } from "./actions";

async function getResumes(): Promise<ResumeRecord[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch resumes:", error);
    return [];
  }

  return data ?? [];
}

export default async function ResumeListPage() {
  const resumes = await getResumes();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Resume Drafts</h1>
        <p className="text-gray-600">
          Each AI generated draft is stored here. Open a resume to review, iterate, and export.
        </p>
      </div>

      {resumes.length === 0 ? (
        <Card variant="subtle">
          <CardContent className="pt-6 text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium mb-1">No resumes yet</p>
            <p className="text-sm text-gray-500">
              Generate your first draft from the Generate tab.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume, index) => (
            <Card 
              key={resume.id} 
              variant="elevated" 
              hover
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader>
                <CardTitle className="line-clamp-2 text-lg">{resume.title}</CardTitle>
                <p className="text-xs font-medium text-gray-500 mt-1">
                  {new Date(resume.updated_at ?? resume.created_at ?? "").toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/dashboard/resumes/${resume.id}`}>
                  <Button variant="secondary" size="sm" className="w-full">
                    View draft
                  </Button>
                </Link>
                <form action={deleteResume}>
                  <input type="hidden" name="id" value={resume.id} />
                  <Button 
                    type="submit" 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
