import { z } from "zod";
import { getOpenAIClient } from "@/lib/openai/client";

const ExperienceSchema = z.object({
  organization: z.string().min(1).max(200),
  role_title: z.string().min(1).max(200),
  section_label: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  is_current: z.boolean().optional().default(false),
  summary: z.string().optional().nullable(),
  achievements: z.array(z.string().min(1)).default([]),
  skills: z.array(z.string().min(1)).default([]),
});

const EducationSchema = z.object({
  institution: z.string().min(1).max(200),
  degree: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  field_of_study: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  achievements: z.array(z.string().min(1)).default([]),
});

const SkillCategorySchema = z.object({
  category: z.string().optional().nullable(),
  skills: z.array(z.string().min(1)).default([]),
});

const SKILL_DELIMITER = /[,;•\n]+/;
const LIST_DELIMITER = /[\n•]+/;

function splitSkillStrings(value: unknown): string[] {
  if (value == null) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => splitSkillStrings(item))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(SKILL_DELIMITER)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return [String(value)];
  }

  return [];
}

function normalizeSkillEntry(raw: unknown): {
  category: string | null;
  skills: string[];
} {
  if (!raw || typeof raw !== "object") {
    return {
      category: null,
      skills: splitSkillStrings(raw),
    };
  }

  const record = raw as Record<string, unknown>;

  const category =
    typeof record.category === "string"
      ? record.category
      : typeof record.label === "string"
      ? record.label
      : typeof record.name === "string"
      ? record.name
      : typeof record.group === "string"
      ? record.group
      : null;

  let rawSkills: unknown;

  if ("skills" in record) {
    rawSkills = record.skills;
  } else if ("items" in record) {
    rawSkills = record.items;
  } else if ("values" in record) {
    rawSkills = record.values;
  }

  const skills = splitSkillStrings(rawSkills ?? []);

  return {
    category,
    skills,
  };
}

const SkillsArraySchema = z.preprocess((value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => normalizeSkillEntry(entry))
      .filter((entry) => entry.skills.length > 0 || entry.category);
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    if (
      "category" in record ||
      "skills" in record ||
      "items" in record ||
      "values" in record ||
      "label" in record ||
      "name" in record ||
      "group" in record
    ) {
      const normalized = normalizeSkillEntry(record);
      return normalized.skills.length > 0 || normalized.category
        ? [normalized]
        : [];
    }

    return Object.entries(record)
      .map(([category, raw]) =>
        normalizeSkillEntry({ category, skills: raw })
      )
      .filter((entry) => entry.skills.length > 0 || entry.category);
  }

  const normalized = normalizeSkillEntry(value);
  return normalized.skills.length > 0 || normalized.category
    ? [normalized]
    : [];
}, z.array(SkillCategorySchema).default([]));

function normalizeExperienceEntry(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    return {
      organization: "Unknown",
      role_title: typeof raw === "string" ? raw.trim() || "Unknown" : "Unknown",
      section_label: null,
      location: null,
      start_date: null,
      end_date: null,
      is_current: false,
      summary: null,
      achievements: [],
      skills: [],
    };
  }

  const record = raw as Record<string, unknown>;

  const achievementsRaw =
    record.achievements ??
    record.bullets ??
    record.details ??
    record.items ??
    record.responsibilities ??
    [];

  // Achievements should be kept as complete bullet points, NOT split on commas
  const achievements = Array.isArray(achievementsRaw)
    ? achievementsRaw
        .map((item) => (typeof item === "string" ? item.trim() : String(item).trim()))
        .filter(Boolean)
    : typeof achievementsRaw === "string"
    ? [achievementsRaw.trim()].filter(Boolean)
    : [];

  const organizationCandidates = [
    record.organization,
    record.company,
    record.employer,
    record.institution,
    record.school,
  ]
    .map((value) =>
      typeof value === "string" ? value.trim() : value != null ? String(value).trim() : ""
    )
    .filter(Boolean);

  const roleTitleCandidates = [
    record.role_title,
    record.title,
    record.position,
    record.role,
    record.job_title,
  ]
    .map((value) =>
      typeof value === "string" ? value.trim() : value != null ? String(value).trim() : ""
    )
    .filter(Boolean);

  const location =
    typeof record.location === "string"
      ? record.location.trim()
      : typeof record.city === "string" || typeof record.place === "string"
      ? `${record.city || record.place || ""}`.trim()
      : null;

  const startDate =
    typeof record.start_date === "string"
      ? record.start_date.trim()
      : typeof record.start === "string"
      ? record.start.trim()
      : null;

  const endDate =
    typeof record.end_date === "string"
      ? record.end_date.trim()
      : record.end_date === null
      ? null
      : typeof record.end === "string"
      ? record.end.trim()
      : null;

  const isCurrent =
    typeof record.is_current === "boolean"
      ? record.is_current
      : record.current === true ||
        record.ongoing === true ||
        (endDate === null && startDate != null);

  const summary =
    typeof record.summary === "string"
      ? record.summary.trim()
      : typeof record.description === "string"
      ? record.description.trim()
      : null;

  const sectionLabel =
    typeof record.section_label === "string"
      ? record.section_label.trim()
      : typeof record.section === "string"
      ? record.section.trim()
      : null;

  const skillsRaw = record.skills ?? record.technologies ?? record.tools ?? [];
  const skills = splitSkillStrings(skillsRaw).filter(Boolean);

  return {
    organization:
      organizationCandidates[0] ||
      (roleTitleCandidates[0] ? roleTitleCandidates[0] : "Unknown"),
    role_title: roleTitleCandidates[0] || "Unknown Role",
    section_label: sectionLabel,
    location: location || null,
    start_date: startDate || null,
    end_date: endDate,
    is_current: isCurrent,
    summary: summary || null,
    achievements: achievements.length > 0 ? achievements : [],
    skills: skills.length > 0 ? skills : [],
  };
}

function normalizeEducationEntry(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    const text =
      typeof raw === "string"
        ? raw
        : raw != null
        ? String(raw)
        : "Unknown institution";
    return {
      institution: text.trim() || "Unknown institution",
      degree: null,
      field_of_study: null,
      start_date: null,
      end_date: null,
      achievements: text
        .split(LIST_DELIMITER)
        .map((item) => item.trim())
        .filter(Boolean),
    };
  }

  const record = raw as Record<string, unknown>;

  const achievementsRaw =
    record.achievements ??
    record.bullets ??
    record.details ??
    record.items ??
    [];

  // Achievements should be kept as complete bullet points, NOT split on commas
  const achievements = Array.isArray(achievementsRaw)
    ? achievementsRaw
        .map((item) => (typeof item === "string" ? item.trim() : String(item).trim()))
        .filter(Boolean)
    : typeof achievementsRaw === "string"
    ? [achievementsRaw.trim()].filter(Boolean)
    : [];

  const institutionCandidates = [
    record.institution,
    record.school,
    record.organization,
    record.university,
    record.college,
  ]
    .map((value) =>
      typeof value === "string" ? value.trim() : value != null ? String(value).trim() : ""
    )
    .filter(Boolean);

  if (institutionCandidates.length === 0 && achievements.length > 0) {
    institutionCandidates.push(achievements[0]);
  }

  const degreeCandidates = [
    record.degree,
    record.program,
    record.major,
    record.field,
    record.field_of_study,
  ]
    .map((value) =>
      typeof value === "string"
        ? value.trim()
        : Array.isArray(value)
        ? value
            .map((item) =>
              typeof item === "string"
                ? item.trim()
                : item != null
                ? String(item).trim()
                : ""
            )
            .filter(Boolean)
        : value != null
        ? String(value).trim()
        : ""
    )
    .filter((value) => value && (typeof value === "string" || Array.isArray(value)));

  const fieldCandidates = [
    record.field_of_study,
    record.major,
    record.program,
    record.focus,
    record.concentration,
  ]
    .map((value) =>
      typeof value === "string"
        ? value.trim()
        : Array.isArray(value)
        ? value
            .map((item) =>
              typeof item === "string"
                ? item.trim()
                : item != null
                ? String(item).trim()
                : ""
            )
            .filter(Boolean)
        : value != null
        ? String(value).trim()
        : ""
    )
    .filter((value) => value && (typeof value === "string" || Array.isArray(value)));

  const startDate =
    typeof record.start_date === "string"
      ? record.start_date
      : typeof record.start === "string"
      ? record.start
      : typeof record.startDate === "string"
      ? record.startDate
      : null;

  const endDate =
    typeof record.end_date === "string"
      ? record.end_date
      : typeof record.end === "string"
      ? record.end
      : typeof record.endDate === "string"
      ? record.endDate
      : null;

  return {
    institution: institutionCandidates[0] ?? "Unknown institution",
    degree:
      degreeCandidates.length > 0
        ? degreeCandidates[0]
        : undefined,
    field_of_study:
      fieldCandidates.length > 0
        ? fieldCandidates[0]
        : undefined,
    start_date: startDate,
    end_date: endDate,
    achievements,
  };
}

const ExperiencesArraySchema = z.preprocess(
  (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.map((entry) => normalizeExperienceEntry(entry));
    }
    if (typeof value === "object") {
      return [normalizeExperienceEntry(value)];
    }
    return [];
  },
  z.array(ExperienceSchema).default([])
);

const EducationArraySchema = z.preprocess(
  (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.map((entry) => normalizeEducationEntry(entry));
    }
    if (typeof value === "object") {
      return [normalizeEducationEntry(value)];
    }
    return [];
  },
  z.array(EducationSchema).default([])
);

const ParsedResumeSchema = z.object({
  experiences: ExperiencesArraySchema,
  education: EducationArraySchema,
  skills: SkillsArraySchema,
});

export type ParsedResume = z.infer<typeof ParsedResumeSchema>;

/**
 * Fallback parser that extracts experiences directly from text when AI fails.
 * Looks for patterns like "Organization - Role Title Date" or bolded headers followed by bullets.
 */
function extractExperiencesFromText(text: string): Array<{
  organization: string;
  role_title: string;
  section_label: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  summary: string | null;
  achievements: string[];
  skills: string[];
}> {
  const experiences: Array<{
    organization: string;
    role_title: string;
    section_label: string | null;
    location: string | null;
    start_date: string | null;
    end_date: string | null;
    is_current: boolean;
    summary: string | null;
    achievements: string[];
    skills: string[];
  }> = [];

  // Section headers that indicate experience-like content
  const experienceSectionPattern = /(?:^|\n)\s*(?:E\s*X\s*P\s*E\s*R\s*I\s*E\s*N\s*C\s*E|P\s*R\s*O\s*J\s*E\s*C\s*T\s*S?|L\s*E\s*A\s*D\s*E\s*R\s*S\s*H\s*I\s*P|A\s*C\s*T\s*I\s*V\s*I\s*T\s*I\s*E\s*S|I\s*N\s*T\s*E\s*R\s*N\s*S\s*H\s*I\s*P\s*S?|R\s*E\s*S\s*E\s*A\s*R\s*C\s*H|V\s*O\s*L\s*U\s*N\s*T\s*E\s*E\s*R\s*I\s*N\s*G|W\s*O\s*R\s*K)\s*(?:\n|$)/i;

  // Pattern to match: Organization - Role Title Date Range Location
  // Examples: "Morgan Stanley - Wealth Management Intern June 2025 – Aug 2025 NewYorkCity,NY"
  //           "Fathom Events - Finance Intern Jan 2023 - May 2023 Denver,CO"
  // More flexible pattern that handles various formats
  const entryPattern = /^([A-Z][A-Za-z0-9\s&.,'-]+?)\s*[-–—|]\s*([A-Z][A-Za-z0-9\s&.,'-/()]+?)\s+((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December|\d{1,2})\s+\d{4}\s*[-–—]\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December|\d{1,2})\s+\d{4}|Present|Current|Now))\s*([A-Z][A-Za-z\s,]+)?$/im;

  const lines = text.split(/\n/);
  let currentSection: string | null = null;
  let currentEntry: {
    organization: string;
    role_title: string;
    section_label: string | null;
    location: string | null;
    start_date: string | null;
    end_date: string | null;
    is_current: boolean;
    summary: string | null;
    achievements: string[];
    skills: string[];
  } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check for section headers
    if (experienceSectionPattern.test(line)) {
      currentSection = line.replace(/\s+/g, " ").trim();
      continue;
    }

    // Skip empty lines
    if (!line) {
      if (currentEntry) {
        experiences.push(currentEntry);
        currentEntry = null;
      }
      continue;
    }

    // Try to match entry pattern
    const entryMatch = line.match(entryPattern);
    if (entryMatch) {
      // Save previous entry if exists
      if (currentEntry) {
        experiences.push(currentEntry);
      }

      const [, org, role, dateRange, location] = entryMatch;
      const dateMatch = dateRange?.match(/(\w+\s+\d{4})\s*[-–—]\s*(\w+\s+\d{4}|Present|Current|Now)/i);
      
      currentEntry = {
        organization: org.trim(),
        role_title: role.trim(),
        section_label: currentSection,
        location: location?.trim() || null,
        start_date: dateMatch ? dateMatch[1].trim() : null,
        end_date: dateMatch && !/Present|Current|Now/i.test(dateMatch[2]) ? dateMatch[2].trim() : null,
        is_current: dateMatch ? /Present|Current|Now/i.test(dateMatch[2]) : false,
        summary: null,
        achievements: [],
        skills: [],
      };
      continue;
    }

    // Try simpler pattern: Organization - Role Title (with optional date/location on same or next line)
    if (currentSection && /^[A-Z][A-Za-z0-9\s&.,'-]+\s*[-–—|]\s*[A-Z]/.test(line) && line.length > 10) {
      if (currentEntry) {
        experiences.push(currentEntry);
      }
      const parts = line.split(/\s*[-–—|]\s*/);
      if (parts.length >= 2) {
        const org = parts[0].trim();
        const rest = parts.slice(1).join(" - ").trim();
        // Try to extract date from rest
        const dateMatch = rest.match(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December|\d{1,2})\s+\d{4}\s*[-–—]\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December|\d{1,2})\s+\d{4}|Present|Current|Now))/i);
        const role = dateMatch ? rest.substring(0, dateMatch.index).trim() : rest;
        const dateRange = dateMatch ? dateMatch[1] : null;
        const dateParts = dateRange?.match(/(\w+\s+\d{4})\s*[-–—]\s*(\w+\s+\d{4}|Present|Current|Now)/i);
        
        currentEntry = {
          organization: org,
          role_title: role || "Unknown Role",
          section_label: currentSection,
          location: null,
          start_date: dateParts ? dateParts[1].trim() : null,
          end_date: dateParts && !/Present|Current|Now/i.test(dateParts[2]) ? dateParts[2].trim() : null,
          is_current: dateParts ? /Present|Current|Now/i.test(dateParts[2]) : false,
          summary: null,
          achievements: [],
          skills: [],
        };
        continue;
      }
    }

    // If we have a current entry, collect bullets or location
    if (currentEntry) {
      // Check if it's a location (City, State or City, Country pattern)
      if (/^[A-Z][A-Za-z]+,\s*[A-Z]{2}$/.test(line) || /^[A-Z][A-Za-z]+,\s*[A-Z][A-Za-z]+$/.test(line)) {
        if (!currentEntry.location) {
          currentEntry.location = line.trim();
        }
        continue;
      }
      
      // Check if it's a bullet point
      if (/^[•\-\*]\s+/.test(line) || /^\d+[\.\)]\s+/.test(line)) {
        const bullet = line.replace(/^[•\-\*\d\.\)]\s+/, "").trim();
        if (bullet && bullet.length > 3) {
          currentEntry.achievements.push(bullet);
        }
      } else if (line.length > 20 && !/^[A-Z\s]+$/.test(line) && !/^[A-Z][A-Za-z]+,\s*[A-Z]/.test(line)) {
        // Might be a continuation or description (but not a location)
        currentEntry.achievements.push(line);
      }
    } else if (currentSection && line.length > 10 && !/^[•\-\*]/.test(line)) {
      // Try to create entry from a bolded/standalone line (but not a bullet)
      const parts = line.split(/\s*[-–—|]\s*/);
      if (parts.length >= 2) {
        currentEntry = {
          organization: parts[0].trim(),
          role_title: parts.slice(1).join(" - ").trim(),
          section_label: currentSection,
          location: null,
          start_date: null,
          end_date: null,
          is_current: false,
          summary: null,
          achievements: [],
          skills: [],
        };
      }
    }
  }

  // Save last entry
  if (currentEntry) {
    experiences.push(currentEntry);
  }

  return experiences;
}

/**
 * Fallback parser for education entries
 */
function extractEducationFromText(text: string): Array<{
  institution: string;
  degree: string | null;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  achievements: string[];
}> {
  const education: Array<{
    institution: string;
    degree: string | null;
    field_of_study: string | null;
    start_date: string | null;
    end_date: string | null;
    achievements: string[];
  }> = [];

  const educationSectionPattern = /(?:^|\n)\s*E\s*D\s*U\s*C\s*A\s*T\s*I\s*O\s*N\s*(?:\n|$)/i;
  const lines = text.split(/\n/);
  let inEducationSection = false;
  let currentEntry: {
    institution: string;
    degree: string | null;
    field_of_study: string | null;
    start_date: string | null;
    end_date: string | null;
    achievements: string[];
  } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (educationSectionPattern.test(line)) {
      inEducationSection = true;
      if (currentEntry) {
        education.push(currentEntry);
        currentEntry = null;
      }
      continue;
    }

    if (!inEducationSection) continue;

    if (!line) {
      if (currentEntry) {
        education.push(currentEntry);
        currentEntry = null;
      }
      continue;
    }

    // Look for university name (usually capitalized, might have "University of" or "College")
    if (/University|College|School|Institute/i.test(line) && line.length > 5 && line.length < 100) {
      if (currentEntry) {
        education.push(currentEntry);
      }
      currentEntry = {
        institution: line,
        degree: null,
        field_of_study: null,
        start_date: null,
        end_date: null,
        achievements: [],
      };
      continue;
    }

    if (currentEntry) {
      // Collect all other lines as achievements (coursework, GPA, etc.)
      if (line.length > 3) {
        currentEntry.achievements.push(line);
      }
    }
  }

  if (currentEntry) {
    education.push(currentEntry);
  }

  return education;
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length);
  }
  
  // Simple word overlap
  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * Check if two experiences are duplicates
 */
function areExperiencesDuplicate(
  exp1: z.infer<typeof ExperienceSchema>,
  exp2: z.infer<typeof ExperienceSchema>
): boolean {
  const orgSim = stringSimilarity(exp1.organization, exp2.organization);
  const roleSim = stringSimilarity(exp1.role_title, exp2.role_title);
  
  // If both organization and role are very similar, consider duplicate
  if (orgSim > 0.8 && roleSim > 0.8) {
    return true;
  }
  
  // If organization is identical and dates overlap significantly
  if (orgSim > 0.9 && exp1.start_date && exp2.start_date) {
    const date1 = exp1.start_date.toLowerCase();
    const date2 = exp2.start_date.toLowerCase();
    if (stringSimilarity(date1, date2) > 0.7) {
      return true;
    }
  }
  
  return false;
}

/**
 * Merge two duplicate experiences, keeping the most complete data
 */
function mergeExperiences(
  exp1: z.infer<typeof ExperienceSchema>,
  exp2: z.infer<typeof ExperienceSchema>
): z.infer<typeof ExperienceSchema> {
  return {
    organization: exp1.organization || exp2.organization,
    role_title: exp1.role_title || exp2.role_title,
    section_label: exp1.section_label || exp2.section_label,
    location: exp1.location || exp2.location,
    start_date: exp1.start_date || exp2.start_date,
    end_date: exp1.end_date || exp2.end_date,
    is_current: exp1.is_current || exp2.is_current,
    summary: exp1.summary || exp2.summary,
    achievements: [
      ...new Set([...exp1.achievements, ...exp2.achievements])
    ],
    skills: [
      ...new Set([...exp1.skills, ...exp2.skills])
    ],
  };
}

/**
 * Deduplicate experiences array
 */
function deduplicateExperiences(
  experiences: z.infer<typeof ExperienceSchema>[]
): z.infer<typeof ExperienceSchema>[] {
  const deduplicated: z.infer<typeof ExperienceSchema>[] = [];
  const seen = new Set<number>();
  
  for (let i = 0; i < experiences.length; i++) {
    if (seen.has(i)) continue;
    
    let merged = experiences[i];
    
    // Check against all remaining experiences
    for (let j = i + 1; j < experiences.length; j++) {
      if (seen.has(j)) continue;
      
      if (areExperiencesDuplicate(merged, experiences[j])) {
        merged = mergeExperiences(merged, experiences[j]);
        seen.add(j);
      }
    }
    
    deduplicated.push(merged);
    seen.add(i);
  }
  
  return deduplicated;
}

/**
 * Check if two education entries are duplicates
 */
function areEducationDuplicate(
  edu1: z.infer<typeof EducationSchema>,
  edu2: z.infer<typeof EducationSchema>
): boolean {
  const instSim = stringSimilarity(edu1.institution, edu2.institution);
  
  if (instSim > 0.85) {
    // Same institution, check if degree/field overlap
    const degree1 = Array.isArray(edu1.degree) ? edu1.degree.join(" ") : (edu1.degree || "");
    const degree2 = Array.isArray(edu2.degree) ? edu2.degree.join(" ") : (edu2.degree || "");
    const field1 = Array.isArray(edu1.field_of_study) ? edu1.field_of_study.join(" ") : (edu1.field_of_study || "");
    const field2 = Array.isArray(edu2.field_of_study) ? edu2.field_of_study.join(" ") : (edu2.field_of_study || "");
    
    if (degree1 && degree2 && stringSimilarity(degree1, degree2) > 0.7) {
      return true;
    }
    if (field1 && field2 && stringSimilarity(field1, field2) > 0.7) {
      return true;
    }
    // If same institution and no conflicting degree info, likely duplicate
    if (!degree1 && !degree2 && !field1 && !field2) {
      return true;
    }
  }
  
  return false;
}

/**
 * Merge two duplicate education entries
 */
function mergeEducation(
  edu1: z.infer<typeof EducationSchema>,
  edu2: z.infer<typeof EducationSchema>
): z.infer<typeof EducationSchema> {
  const degree1 = Array.isArray(edu1.degree) ? edu1.degree : (edu1.degree ? [edu1.degree] : []);
  const degree2 = Array.isArray(edu2.degree) ? edu2.degree : (edu2.degree ? [edu2.degree] : []);
  const field1 = Array.isArray(edu1.field_of_study) ? edu1.field_of_study : (edu1.field_of_study ? [edu1.field_of_study] : []);
  const field2 = Array.isArray(edu2.field_of_study) ? edu2.field_of_study : (edu2.field_of_study ? [edu2.field_of_study] : []);
  
  return {
    institution: edu1.institution || edu2.institution,
    degree: [...new Set([...degree1, ...degree2])],
    field_of_study: [...new Set([...field1, ...field2])],
    start_date: edu1.start_date || edu2.start_date,
    end_date: edu1.end_date || edu2.end_date,
    achievements: [
      ...new Set([...edu1.achievements, ...edu2.achievements])
    ],
  };
}

/**
 * Deduplicate education array
 */
function deduplicateEducation(
  education: z.infer<typeof EducationSchema>[]
): z.infer<typeof EducationSchema>[] {
  const deduplicated: z.infer<typeof EducationSchema>[] = [];
  const seen = new Set<number>();
  
  for (let i = 0; i < education.length; i++) {
    if (seen.has(i)) continue;
    
    let merged = education[i];
    
    for (let j = i + 1; j < education.length; j++) {
      if (seen.has(j)) continue;
      
      if (areEducationDuplicate(merged, education[j])) {
        merged = mergeEducation(merged, education[j]);
        seen.add(j);
      }
    }
    
    deduplicated.push(merged);
    seen.add(i);
  }
  
  return deduplicated;
}

export async function parseResumeText(rawText: string): Promise<ParsedResume> {
  const client = getOpenAIClient();

  // Stage 1: Use AI to extract structured data
  const systemPrompt = [
    "You are an expert resume parser. Extract experiences, education, and skills into separate arrays.",
    "",
    "CRITICAL DISTINCTION:",
    "- EXPERIENCES: Work, internships, projects, leadership, activities, research, volunteering. These go in the 'experiences' array.",
    "- EDUCATION: Schools, universities, degrees, coursework. These go in the 'education' array.",
    "- SKILLS: Technical skills, tools, languages. These go in the 'skills' array.",
    "",
    "EXTRACTION RULES:",
    "",
    "1. EXPERIENCES (put in 'experiences' array):",
    "   - Work experience, internships, jobs",
    "   - Projects (personal, academic, or professional)",
    "   - Leadership roles, club positions",
    "   - Research positions",
    "   - Volunteering",
    "   - Activities, competitions, publications",
    "   Each experience needs: organization (company/project name), role_title (job/project title), dates, achievements (all bullets)",
    "",
    "2. EDUCATION (put in 'education' array):",
    "   - ONLY schools, universities, colleges",
    "   - Degrees, majors, fields of study",
    "   - GPA, coursework, honors, academic achievements",
    "   Each education needs: institution (school name), degree, field_of_study, achievements (coursework, GPA, etc.)",
    "",
    "3. SKILLS (put in 'skills' array):",
    "   - Technical skills, programming languages, tools, software",
    "   - Group by category if possible",
    "",
    "IMPORTANT:",
    "- Work experiences and projects go in 'experiences', NOT 'education'",
    "- Only actual educational institutions go in 'education'",
    "- Extract EVERY entry from the resume",
    "- Include ALL bullet points as separate strings",
    "- Each achievement string should be a COMPLETE bullet point - do NOT split on commas within a bullet",
    "- Preserve the full text of each bullet point exactly as written in the resume",
    "",
    "Output ONLY valid JSON:",
    JSON.stringify({
      experiences: [
        {
          organization: "Company Name",
          role_title: "Job Title",
          section_label: "Experience",
          location: "City, State",
          start_date: "Month Year",
          end_date: "Month Year",
          is_current: false,
          achievements: ["Achievement 1", "Achievement 2"],
          skills: []
        }
      ],
      education: [
        {
          institution: "University Name",
          degree: "B.S. in Computer Science",
          field_of_study: "Computer Science",
          start_date: null,
          end_date: "Year",
          achievements: ["GPA: 3.8", "Relevant Coursework: ..."]
        }
      ],
      skills: [
        {
          category: "Programming",
          skills: ["Python", "JavaScript"]
        }
      ]
    }, null, 2),
  ].join("\n");

  const userPrompt = `Parse this resume and extract all experiences, education, and skills:\n\n${rawText}`;

  let result: ParsedResume = {
    experiences: [],
    education: [],
    skills: [],
  };

  try {
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      temperature: 0,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: systemPrompt }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: userPrompt }],
        },
      ],
      text: { format: { type: "json_object" } },
    });

    const text =
      (response.output_text ?? "").trim() ||
      (Array.isArray(response.output)
        ? response.output
            .map((item) =>
              "content" in item && Array.isArray(item.content)
                ? item.content
                    .map((chunk) =>
                      typeof chunk === "string"
                        ? chunk
                        : "text" in chunk
                        ? chunk.text
                        : ""
                    )
                    .join("")
                : ""
            )
            .join("")
        : "");

    if (text) {
      try {
        const parsed = JSON.parse(text);
        console.log("Raw parsed JSON from AI:", JSON.stringify(parsed, null, 2));
        
        // Check what arrays exist in the response
        if (parsed && typeof parsed === "object") {
          const keys = Object.keys(parsed);
          console.log("Keys in parsed JSON:", keys);
          console.log("experiences type:", Array.isArray(parsed.experiences) ? `array with ${parsed.experiences.length} items` : typeof parsed.experiences);
          console.log("education type:", Array.isArray(parsed.education) ? `array with ${parsed.education.length} items` : typeof parsed.education);
          console.log("skills type:", Array.isArray(parsed.skills) ? `array with ${parsed.skills.length} items` : typeof parsed.skills);
        }
        
        const validation = ParsedResumeSchema.safeParse(parsed);
        if (validation.success) {
          result = validation.data;
          console.log(`✓ AI extracted: ${result.experiences.length} experiences, ${result.education.length} education, ${result.skills.length} skill categories`);
          
          // Log first few items to verify categorization
          if (result.experiences.length > 0) {
            console.log("First experience:", result.experiences[0].organization, "-", result.experiences[0].role_title);
          }
          if (result.education.length > 0) {
            console.log("First education:", result.education[0].institution);
          }
        } else {
          console.error("✗ AI parsing validation failed:", validation.error.message);
          console.error("Failed JSON structure:", JSON.stringify(parsed, null, 2));
        }
      } catch (error) {
        console.error("✗ AI parsing JSON parse failed:", error);
        console.error("Raw text that failed to parse:", text.substring(0, 500));
      }
    } else {
      console.warn("No text returned from OpenAI API");
    }
  } catch (error) {
    console.warn("AI parsing failed, using fallback:", error);
  }

  // Stage 2: Use fallback parser if AI didn't extract enough
  if (result.experiences.length === 0) {
    console.log("Using fallback parser for experiences");
    const fallbackExperiences = extractExperiencesFromText(rawText);
    if (fallbackExperiences.length > 0) {
      result.experiences = fallbackExperiences.map((exp) => normalizeExperienceEntry(exp));
    }
  }

  if (result.education.length === 0) {
    console.log("Using fallback parser for education");
    const fallbackEducation = extractEducationFromText(rawText);
    if (fallbackEducation.length > 0) {
      result.education = fallbackEducation.map((edu) => normalizeEducationEntry(edu));
    }
  }

  // Stage 3: Deduplicate and merge
  result.experiences = deduplicateExperiences(result.experiences);
  result.education = deduplicateEducation(result.education);

  // Stage 4: Final normalization
  result.experiences = result.experiences.map((exp) => normalizeExperienceEntry(exp));
  result.education = result.education.map((edu) => normalizeEducationEntry(edu));

  return result;
}

