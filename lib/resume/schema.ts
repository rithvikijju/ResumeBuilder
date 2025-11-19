import { z } from "zod";

export const ResumeSectionSchema = z.object({
  title: z.string(),
  items: z
    .array(
      z.object({
        heading: z.string().optional(),
        content: z.string(),
        metrics: z
          .array(
            z.object({
              label: z.string(),
              value: z.string(),
            })
          )
          .optional(),
      })
    )
    .min(1),
});

// Structured resume format (for templates like cs-structured)
export const StructuredResumeSchema = z.object({
  header: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    links: z.array(z.object({
      label: z.string(),
      url: z.string(),
    })).optional(),
  }).optional(),
  education: z.array(z.object({
    institution: z.string(),
    location: z.string().optional(),
    degree: z.string(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
  })).optional(),
  experience: z.array(z.object({
    title: z.string(),
    organization: z.string(),
    location: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    bullets: z.array(z.string()),
  })).optional(),
  projects: z.array(z.object({
    name: z.string(),
    tech_stack: z.array(z.string()).optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    bullets: z.array(z.string()),
  })).optional(),
  technical_skills: z.record(z.string(), z.array(z.string())).optional(),
  insights: z
    .object({
      suggestions: z.array(z.string()).optional(),
      missingKeywords: z.array(z.string()).optional(),
      strengths: z.array(z.string()).optional(),
    })
    .optional(),
  templateAnalytics: z
    .object({
      whyThisTemplate: z.string().optional(),
      atsCompatibility: z.string().optional(),
      industryStandards: z.string().optional(),
    })
    .optional(),
});

// Standard resume format (existing format)
export const StandardResumeSchema = z.object({
  summary: z
    .array(
      z.object({
        sentence: z.string(),
      })
    )
    .optional(),
  sections: z.array(ResumeSectionSchema).min(1),
  skills: z
    .object({
      primary: z.array(z.string()).optional(),
      secondary: z.array(z.string()).optional(),
      tools: z.array(z.string()).optional(),
    })
    .optional(),
  insights: z
    .object({
      suggestions: z.array(z.string()).optional(),
      missingKeywords: z.array(z.string()).optional(),
      strengths: z.array(z.string()).optional(),
    })
    .optional(),
  templateAnalytics: z
    .object({
      whyThisTemplate: z.string().optional(),
      atsCompatibility: z.string().optional(),
      industryStandards: z.string().optional(),
    })
    .optional(),
});

// Union of both formats - accepts either structure
export const ResumeSchema = z.union([StandardResumeSchema, StructuredResumeSchema]);

export type ResumePayload = z.infer<typeof ResumeSchema>;

export const EducationSchema = z.object({
  institution: z.string().min(1).max(200),
  degree: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  field_of_study: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  achievements: z.array(z.string().min(1)).optional().nullable(),
});

