
import { PRACTICE_AREAS } from "../lib/data/practice-areas";
import fs from "fs";
import path from "path";

// A simple deterministic UUID generator based on integer ID
function generateUUID(idString: string): string {
  const num = parseInt(idString, 10);
  if (isNaN(num)) {
    return `99999999-9999-9999-9999-000000000000`;
  }
  const hex = num.toString(16).padStart(12, "0");
  return `00000000-0000-0000-0000-${hex}`;
}

function escapeSql(str: string | undefined | null): string {
  if (str === undefined || str === null) return "NULL";
  // Escape single quotes for SQL
  return `'${str.replace(/'/g, "''")}'`;
}

function escapeSqlArray(arr: string[] | undefined | null): string {
  if (!arr || arr.length === 0) return "ARRAY[]::text[]";
  const elements = arr.map(escapeSql).join(", ");
  return `ARRAY[${elements}]`;
}

function escapeSqlJson(obj: any): string {
  if (!obj || (Array.isArray(obj) && obj.length === 0)) return "NULL";
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`;
}

async function generateSql() {
  const lines: string[] = [];
  lines.push("-- ==========================================");
  lines.push("-- AUTO-GENERATED SEED DATA");
  lines.push("-- ==========================================\n");

  // 1. Seed Taxonomies (Practice Areas & Services)
  lines.push("-- 1. Practice Areas");
  for (const pa of PRACTICE_AREAS) {
    lines.push(
      `INSERT INTO public.practice_area_categories (id, name, icon, description) VALUES (${escapeSql(
        pa.id
      )}, ${escapeSql(pa.name)}, ${escapeSql(pa.icon)}, ${escapeSql(
        pa.description
      )}) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, description = EXCLUDED.description;`
    );
  }
  lines.push("");

  lines.push("-- 2. Legal Services");
  for (const pa of PRACTICE_AREAS) {
    if (pa.services && pa.services.length > 0) {
      for (const s of pa.services) {
        lines.push(
          `INSERT INTO public.legal_services (id, practice_area_id, name) VALUES (${escapeSql(
            s.id
          )}, ${escapeSql(s.practiceAreaId)}, ${escapeSql(
            s.name
          )}) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;`
        );
      }
    }
  }
  lines.push("");



  const outPath = path.resolve(process.cwd(), "supabase", "migrations", "20260919_seed_phase2_data.sql");
  fs.writeFileSync(outPath, lines.join("\n"));
  console.log(`✅ Seed SQL generated at ${outPath}`);
}

generateSql();
