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

export const ResumeSchema = z.object({
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
});

export type ResumePayload = z.infer<typeof ResumeSchema>;

export const EducationSchema = z.object({
  institution: z.string().min(1).max(200),
  degree: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  field_of_study: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  achievements: z.array(z.string().min(1)).optional().nullable(),
});

