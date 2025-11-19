"use client";

import { type ResumeTemplate } from "@/lib/resume/templates";
import type { ResumePayload } from "@/lib/resume/schema";

type TemplateRendererProps = {
  resume: ResumePayload;
  template: ResumeTemplate | null;
};

export function TemplateRenderer({ resume, template }: TemplateRendererProps) {
  if (!template) {
    return <div>Template not found</div>;
  }

  return (
    <div
      className="resume-template"
      style={{
        fontFamily: template.style.fontFamily,
        fontSize: template.style.fontSize,
        lineHeight: template.style.lineHeight,
        color: template.style.colors.text,
        backgroundColor: template.style.background,
      }}
    >
      {template.layout.headerStyle === "centered" ? (
        <CenteredHeader template={template} />
      ) : (
        <LeftAlignedHeader template={template} />
      )}

      {template.layout.showSummary && resume.summary && (
        <SummarySection resume={resume} template={template} />
      )}

      {template.layout.sectionOrder.map((sectionTitle) => {
        const section = resume.sections.find((s) => s.title === sectionTitle);
        if (!section) return null;
        return (
          <Section
            key={section.title}
            section={section}
            template={template}
          />
        );
      })}

      {/* Render any sections not in the template's order */}
      {resume.sections
        .filter(
          (s) => !template.layout.sectionOrder.includes(s.title)
        )
        .map((section) => (
          <Section
            key={section.title}
            section={section}
            template={template}
          />
        ))}

      {template.layout.showSkills && resume.skills && (
        <SkillsSection resume={resume} template={template} />
      )}
    </div>
  );
}

function CenteredHeader({ template }: { template: ResumeTemplate }) {
  return (
    <header
      className="text-center mb-6"
      style={{
        borderBottom: `2px solid ${template.style.colors.primary}`,
        paddingBottom: "0.5rem",
      }}
    >
      {/* Header content would go here - name, contact info, etc. */}
    </header>
  );
}

function LeftAlignedHeader({ template }: { template: ResumeTemplate }) {
  return (
    <header
      className="mb-6"
      style={{
        borderBottom: `1px solid ${template.style.colors.secondary}`,
        paddingBottom: "0.5rem",
      }}
    >
      {/* Header content would go here */}
    </header>
  );
}

function SummarySection({
  resume,
  template,
}: {
  resume: ResumePayload;
  template: ResumeTemplate;
}) {
  if (!resume.summary) return null;

  return (
    <section className="mb-6">
      <h2
        className="font-bold mb-2"
        style={{
          color: template.style.colors.primary,
          fontSize: "1.1em",
          textTransform: template.category === "finance" ? "uppercase" : "none",
          letterSpacing: template.category === "finance" ? "0.05em" : "normal",
        }}
      >
        Professional Summary
      </h2>
      <ul
        className="space-y-1"
        style={{
          listStyle: template.formatting.bulletStyle === "bullet" ? "disc" : "none",
          paddingLeft: template.formatting.bulletStyle === "bullet" ? "1.5rem" : "0",
        }}
      >
        {resume.summary.map((item, index) => (
          <li key={index} style={{ marginLeft: template.formatting.bulletStyle === "bullet" ? "0" : "1.5rem" }}>
            {template.formatting.bulletStyle === "bullet" ? "" : "• "}
            {item.sentence}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Section({
  section,
  template,
}: {
  section: ResumePayload["sections"][number];
  template: ResumeTemplate;
}) {
  return (
    <section className="mb-6">
      <h2
        className="font-bold mb-3"
        style={{
          color: template.style.colors.primary,
          fontSize: "1.1em",
          textTransform: template.category === "finance" ? "uppercase" : "none",
          letterSpacing: template.category === "finance" ? "0.05em" : "normal",
          borderBottom:
            template.category === "tech"
              ? `1px solid ${template.style.colors.accent}`
              : "none",
          paddingBottom: template.category === "tech" ? "0.25rem" : "0",
        }}
      >
        {section.title}
      </h2>
      <div className="space-y-4">
        {section.items.map((item, index) => (
          <div key={index} className="mb-3">
            {item.heading && (
              <h3
                className="font-semibold mb-1"
                style={{
                  fontWeight: template.formatting.emphasisStyle === "bold" ? "bold" : "normal",
                  fontStyle: template.formatting.emphasisStyle === "italic" ? "italic" : "normal",
                  textDecoration:
                    template.formatting.emphasisStyle === "underline" ? "underline" : "none",
                }}
              >
                {item.heading}
              </h3>
            )}
            <p
              className="leading-relaxed"
              style={{
                marginLeft: template.formatting.bulletStyle === "none" ? "0" : "1.5rem",
              }}
            >
              {template.formatting.bulletStyle === "bullet" && "• "}
              {template.formatting.bulletStyle === "dash" && "— "}
              {item.content}
            </p>
            {item.metrics && item.metrics.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {item.metrics.map((metric, metricIndex) => (
                  <span
                    key={metricIndex}
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor: template.style.colors.accent + "20",
                      color: template.style.colors.accent,
                    }}
                  >
                    <strong>{metric.value}</strong> {metric.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function SkillsSection({
  resume,
  template,
}: {
  resume: ResumePayload;
  template: ResumeTemplate;
}) {
  if (!resume.skills) return null;

  if (template.layout.skillsFormat === "inline") {
    const allSkills = [
      ...(resume.skills.primary || []),
      ...(resume.skills.secondary || []),
      ...(resume.skills.tools || []),
    ];

    return (
      <section className="mb-6">
        <h2
          className="font-bold mb-2"
          style={{
            color: template.style.colors.primary,
            fontSize: "1.1em",
            textTransform: template.category === "finance" ? "uppercase" : "none",
          }}
        >
          Technical Skills
        </h2>
        <p className="leading-relaxed">
          {allSkills.join(" • ")}
        </p>
      </section>
    );
  }

  return (
    <section className="mb-6">
      <h2
        className="font-bold mb-3"
        style={{
          color: template.style.colors.primary,
          fontSize: "1.1em",
          textTransform: template.category === "finance" ? "uppercase" : "none",
        }}
      >
        Skills
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        {resume.skills.primary && resume.skills.primary.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Primary</h3>
            <ul
              className="space-y-1"
              style={{
                listStyle: template.formatting.bulletStyle === "bullet" ? "disc" : "none",
                paddingLeft: template.formatting.bulletStyle === "bullet" ? "1.5rem" : "0",
              }}
            >
              {resume.skills.primary.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </div>
        )}
        {resume.skills.secondary && resume.skills.secondary.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Secondary</h3>
            <ul
              className="space-y-1"
              style={{
                listStyle: template.formatting.bulletStyle === "bullet" ? "disc" : "none",
                paddingLeft: template.formatting.bulletStyle === "bullet" ? "1.5rem" : "0",
              }}
            >
              {resume.skills.secondary.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </div>
        )}
        {resume.skills.tools && resume.skills.tools.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Tools</h3>
            <ul
              className="space-y-1"
              style={{
                listStyle: template.formatting.bulletStyle === "bullet" ? "disc" : "none",
                paddingLeft: template.formatting.bulletStyle === "bullet" ? "1.5rem" : "0",
              }}
            >
              {resume.skills.tools.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

