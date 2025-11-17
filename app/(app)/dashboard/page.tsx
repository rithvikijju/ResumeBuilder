import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Overview</h1>
        <p className="text-gray-600">
          Welcome to your resume builder dashboard. Get started by importing your resume data or creating a new project.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card variant="gradient" interactive>
          <CardHeader>
            <CardTitle className="text-lg">Import Resume</CardTitle>
            <CardDescription>
              Upload your existing resume to extract structured data
            </CardDescription>
          </CardHeader>
        </Card>

        <Card variant="elevated" interactive>
          <CardHeader>
            <CardTitle className="text-lg">Add Projects</CardTitle>
            <CardDescription>
              Showcase your work and achievements
            </CardDescription>
          </CardHeader>
        </Card>

        <Card variant="elevated" interactive>
          <CardHeader>
            <CardTitle className="text-lg">Generate Resume</CardTitle>
            <CardDescription>
              Create tailored resumes for specific job descriptions
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card variant="subtle">
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Deeper parsing of uploaded resumes, structured editing for
            experience and education, and fine-grained controls for AI-generated
            drafts.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
