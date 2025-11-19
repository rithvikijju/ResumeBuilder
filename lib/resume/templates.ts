export type ResumeTemplate = {
  id: string;
  name: string;
  description: string;
  category: "finance" | "tech" | "custom";
  style: {
    fontFamily: string;
    fontSize: string;
    lineHeight: string;
    spacing: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      text: string;
      background: string;
    };
  };
  layout: {
    headerStyle: "centered" | "left-aligned" | "two-column";
    sectionOrder: string[];
    showSummary: boolean;
    showSkills: boolean;
    skillsFormat: "list" | "categories" | "inline";
  };
  formatting: {
    emphasisStyle: "bold" | "italic" | "underline";
    dateFormat: string;
    bulletStyle: "bullet" | "dash" | "none";
  };
  structure?: "standard" | "structured"; // New: indicates which format to use
  structureFormat?: {
    header?: {
      showName?: boolean;
      showPhone?: boolean;
      showEmail?: boolean;
      showLinks?: boolean;
      linkFormat?: string;
    };
    education?: {
      showLocation?: boolean;
      showDates?: boolean;
      dateFormat?: string;
    };
    experience?: {
      showLocation?: boolean;
      showDates?: boolean;
      dateFormat?: string;
      showBullets?: boolean;
    };
    projects?: {
      showTechStack?: boolean;
      showDates?: boolean;
      dateFormat?: string;
      showBullets?: boolean;
    };
    technical_skills?: {
      format?: "categories" | "list";
      showCategories?: boolean;
    };
  };
};

export const DEFAULT_TEMPLATES: ResumeTemplate[] = [
  {
    id: "ib",
    name: "Investment Banking",
    description: "Traditional, conservative format preferred by finance firms. Clean, professional, and ATS-friendly.",
    category: "finance",
    style: {
      fontFamily: "Times New Roman, serif",
      fontSize: "11pt",
      lineHeight: "1.15",
      spacing: "tight",
      colors: {
        primary: "#000000",
        secondary: "#333333",
        accent: "#000000",
        text: "#000000",
        background: "#FFFFFF",
      },
    },
    layout: {
      headerStyle: "centered",
      sectionOrder: ["Education", "Experience", "Leadership", "Skills", "Additional"],
      showSummary: true,
      showSkills: true,
      skillsFormat: "categories",
    },
    formatting: {
      emphasisStyle: "bold",
      dateFormat: "MM/YYYY",
      bulletStyle: "bullet",
    },
  },
  {
    id: "quant",
    name: "Quantitative Finance",
    description: "Technical format emphasizing skills, projects, and quantitative achievements. Perfect for quant roles.",
    category: "finance",
    style: {
      fontFamily: "Arial, sans-serif",
      fontSize: "10pt",
      lineHeight: "1.2",
      spacing: "normal",
      colors: {
        primary: "#1a1a1a",
        secondary: "#4a4a4a",
        accent: "#0066cc",
        text: "#1a1a1a",
        background: "#FFFFFF",
      },
    },
    layout: {
      headerStyle: "left-aligned",
      sectionOrder: ["Education", "Technical Skills", "Experience", "Projects", "Publications"],
      showSummary: true,
      showSkills: true,
      skillsFormat: "categories",
    },
    formatting: {
      emphasisStyle: "bold",
      dateFormat: "MMM YYYY",
      bulletStyle: "bullet",
    },
  },
  {
    id: "cs",
    name: "Computer Science",
    description: "Modern tech resume format. Highlights projects, technical skills, and impact metrics. Great for software engineering roles.",
    category: "tech",
    style: {
      fontFamily: "Calibri, Arial, sans-serif",
      fontSize: "11pt",
      lineHeight: "1.3",
      spacing: "normal",
      colors: {
        primary: "#2c3e50",
        secondary: "#34495e",
        accent: "#3498db",
        text: "#2c3e50",
        background: "#FFFFFF",
      },
    },
    layout: {
      headerStyle: "left-aligned",
      sectionOrder: ["Experience", "Projects", "Education", "Technical Skills"],
      showSummary: false,
      showSkills: true,
      skillsFormat: "inline",
    },
    formatting: {
      emphasisStyle: "bold",
      dateFormat: "MMM YYYY",
      bulletStyle: "bullet",
    },
  },
];

export async function getTemplateById(id: string): Promise<ResumeTemplate | undefined> {
  // Try to fetch from database first
  try {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("resume_templates")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        name: data.name,
        description: data.description || "",
        category: data.category,
        ...(data.template_config as Omit<ResumeTemplate, "id" | "name" | "description" | "category">),
      };
    }
  } catch (error) {
    console.warn("Failed to fetch template from database, using default:", error);
  }

  // Fall back to default templates
  return DEFAULT_TEMPLATES.find((t) => t.id === id);
}

export async function getAllTemplates(): Promise<ResumeTemplate[]> {
  // Try to fetch from database first
  try {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("resume_templates")
      .select("*")
      .order("is_default", { ascending: false })
      .order("category")
      .order("name");

    if (!error && data && data.length > 0) {
      return data.map((template) => ({
        id: template.id,
        name: template.name,
        description: template.description || "",
        category: template.category,
        ...(template.template_config as Omit<ResumeTemplate, "id" | "name" | "description" | "category">),
      }));
    }
  } catch (error) {
    console.warn("Failed to fetch templates from database, using defaults:", error);
  }

  // Fall back to default templates
  return DEFAULT_TEMPLATES;
}

