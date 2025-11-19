import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { TemplateManagement } from "./template-management";

export default async function TemplatesPage() {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: templates, error } = await supabase
    .from("resume_templates")
    .select("*")
    .order("is_default", { ascending: false })
    .order("category")
    .order("name");

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Resume Templates</h1>
        <p className="text-gray-600">
          Manage resume templates. Upload custom templates or modify existing ones.
        </p>
      </div>

      <TemplateManagement initialTemplates={templates || []} />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(templates || []).map((template) => (
          <Card key={template.id} variant="elevated" hover>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <p className="text-xs font-medium text-gray-500 mt-1 capitalize">
                    {template.category}
                    {template.is_default && " • Default"}
                  </p>
                </div>
              </div>
              {template.description && (
                <CardDescription className="mt-2">
                  {template.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs text-gray-600">
                <p>
                  <span className="font-medium">Font:</span>{" "}
                  {(template.template_config as any)?.style?.fontFamily || "N/A"}
                </p>
                <p>
                  <span className="font-medium">Sections:</span>{" "}
                  {((template.template_config as any)?.layout?.sectionOrder || []).join(", ")}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(templates || []).length === 0 && (
        <Card variant="subtle">
          <CardContent className="pt-6 text-center py-12">
            <p className="text-gray-600 font-medium mb-1">No templates found</p>
            <p className="text-sm text-gray-500">
              Templates will appear here once they're added to the database.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

