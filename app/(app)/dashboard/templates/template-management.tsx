"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { uploadTemplate } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TemplateManagementProps = {
  initialTemplates: Array<{
    id: string;
    name: string;
    description: string | null;
    category: string;
    template_config: any;
  }>;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant="gradient">
      {pending ? "Uploading..." : "Upload Template"}
    </Button>
  );
}

export function TemplateManagement({ initialTemplates }: TemplateManagementProps) {
  const [state, formAction] = useActionState(uploadTemplate, { status: "success", message: "" });
  const [templateJson, setTemplateJson] = useState("");

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Upload Custom Template</CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Upload a template JSON file or paste the template configuration below.
        </p>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="templateId" className="block text-sm font-semibold text-gray-900">
              Template ID
            </label>
            <Input
              id="templateId"
              name="templateId"
              placeholder="e.g., ib-custom, cs-modern"
              required
            />
            <p className="text-xs text-gray-500">
              Unique identifier for this template (lowercase, no spaces).
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="templateName" className="block text-sm font-semibold text-gray-900">
              Template Name
            </label>
            <Input
              id="templateName"
              name="templateName"
              placeholder="e.g., Investment Banking - Modern"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="templateDescription" className="block text-sm font-semibold text-gray-900">
              Description
            </label>
            <Textarea
              id="templateDescription"
              name="templateDescription"
              placeholder="Brief description of this template..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="templateCategory" className="block text-sm font-semibold text-gray-900">
              Category
            </label>
            <select
              id="templateCategory"
              name="templateCategory"
              className="block w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            >
              <option value="finance">Finance</option>
              <option value="tech">Tech</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="templateConfig" className="block text-sm font-semibold text-gray-900">
              Template Configuration (JSON)
            </label>
            <Textarea
              id="templateConfig"
              name="templateConfig"
              placeholder='{"style": {...}, "layout": {...}, "formatting": {...}}'
              rows={12}
              required
              value={templateJson}
              onChange={(e) => setTemplateJson(e.target.value)}
              className="font-mono text-xs"
            />
            <p className="text-xs text-gray-500">
              Paste the complete template configuration JSON. See existing templates for reference.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              name="isDefault"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isDefault" className="text-sm text-gray-700">
              Mark as default template
            </label>
          </div>

          <SubmitButton />

          {state.status === "error" && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">{state.message}</p>
            </div>
          )}

          {state.status === "success" && state.message && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-semibold text-green-900">{state.message}</p>
            </div>
          )}
        </form>

        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50/30 p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Template JSON Format</h3>
          <pre className="text-xs text-gray-700 overflow-x-auto">
{`{
  "style": {
    "fontFamily": "Times New Roman, serif",
    "fontSize": "11pt",
    "lineHeight": "1.15",
    "spacing": "tight",
    "colors": {
      "primary": "#000000",
      "secondary": "#333333",
      "accent": "#000000",
      "text": "#000000",
      "background": "#FFFFFF"
    }
  },
  "layout": {
    "headerStyle": "centered",
    "sectionOrder": ["Education", "Experience", "Skills"],
    "showSummary": true,
    "showSkills": true,
    "skillsFormat": "categories"
  },
  "formatting": {
    "emphasisStyle": "bold",
    "dateFormat": "MM/YYYY",
    "bulletStyle": "bullet"
  }
}`}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

