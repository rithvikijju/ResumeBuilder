#!/usr/bin/env node
/**
 * Script to load template JSON files into the Supabase database
 * 
 * Usage:
 *   npm run load-templates
 *   or
 *   node scripts/load-templates.js
 * 
 * This will read all JSON files from the templates/ directory and
 * insert/update them in the resume_templates table.
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const templatesDir = path.join(__dirname, "..", "templates");

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: Missing Supabase credentials");
  console.error("Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function loadTemplates() {
  console.log("Loading templates from:", templatesDir);

  // Read all JSON files from templates directory
  const files = fs.readdirSync(templatesDir).filter((file) => file.endsWith(".json"));

  if (files.length === 0) {
    console.error("No template files found in templates/ directory");
    process.exit(1);
  }

  console.log(`Found ${files.length} template file(s)\n`);

  const templates = [];

  // Read and parse each template file
  for (const file of files) {
    const filePath = path.join(templatesDir, file);
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const template = JSON.parse(content);

      // Validate required fields
      if (!template.id || !template.name || !template.category || !template.template_config) {
        console.error(`❌ Invalid template in ${file}: missing required fields`);
        continue;
      }

      templates.push(template);
      console.log(`✓ Loaded: ${template.name} (${template.id})`);
    } catch (error) {
      console.error(`❌ Error reading ${file}:`, error.message);
    }
  }

  if (templates.length === 0) {
    console.error("No valid templates to load");
    process.exit(1);
  }

  console.log(`\nUploading ${templates.length} template(s) to database...\n`);

  // Insert/update each template
  let successCount = 0;
  let errorCount = 0;

  for (const template of templates) {
    try {
      const { error } = await supabase
        .from("resume_templates")
        .upsert(
          {
            id: template.id,
            name: template.name,
            description: template.description || null,
            category: template.category,
            is_default: template.is_default || false,
            template_config: template.template_config,
          },
          {
            onConflict: "id",
          }
        );

      if (error) {
        console.error(`❌ Failed to upload ${template.name}:`, error.message);
        errorCount++;
      } else {
        console.log(`✓ Uploaded: ${template.name} (${template.id})`);
        successCount++;
      }
    } catch (error) {
      console.error(`❌ Error uploading ${template.name}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n✅ Done! ${successCount} template(s) uploaded successfully`);
  if (errorCount > 0) {
    console.log(`❌ ${errorCount} template(s) failed to upload`);
  }
}

loadTemplates().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

