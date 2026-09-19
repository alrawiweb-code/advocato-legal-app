import { LAWYERS } from "../lib/data/lawyers";
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

  // 2. Seed Lawyers
  lines.push("-- 3. Lawyer Profiles and Services");
  for (const lawyer of LAWYERS.slice(0, 10)) {
    const uuid = generateUUID(lawyer.id);
    const email = `lawyer${lawyer.id}@advocato.local`;

    // Upsert Auth User (Requires pgcrypto for crypt, which is available on Supabase)
    lines.push(
      `INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        ${escapeSql(uuid)},
        'authenticated',
        'authenticated',
        ${escapeSql(email)},
        crypt('password123', gen_salt('bf')),
        current_timestamp,
        '{"provider":"email","providers":["email"]}',
        ${escapeSqlJson({ full_name: lawyer.name, role: "lawyer" })},
        current_timestamp,
        current_timestamp,
        '',
        '',
        '',
        ''
      ) ON CONFLICT (id) DO NOTHING;`
    );

    // Upsert Profile
    lines.push(
      `INSERT INTO public.profiles (id, email, full_name, avatar_url, role) VALUES (${escapeSql(
        uuid
      )}, ${escapeSql(email)}, ${escapeSql(lawyer.name)}, ${escapeSql(
        lawyer.avatar
      )}, 'lawyer') ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, avatar_url = EXCLUDED.avatar_url;`
    );

    // Upsert Lawyer Profile
    const isVerifiedSql = lawyer.isVerified ? "TRUE" : "FALSE";
    const acceptingClientsSql = lawyer.acceptingClients ? "TRUE" : "FALSE";
    const verificationStatusSql = escapeSql(lawyer.verificationStatus || "PENDING");
    
    // Extract a bar number from jurisdiction if possible, else make one up
    const barNumMatch = lawyer.jurisdiction?.match(/#([A-Z0-9\/]+)/);
    const barNumber = barNumMatch ? barNumMatch[1] : `BAR/${lawyer.id}/2015`;
    const stateBar = lawyer.state || 'Delhi (DL)';

    lines.push(
      `INSERT INTO public.lawyer_profiles (
        id, title, headline, bar_number, state_bar, is_verified, verification_status, availability, accepting_clients,
        years_experience, jurisdiction, state, city, hourly_rate, languages, practice_areas, tags, bio, notable_cases, rating, review_count, verified_review_count
      ) VALUES (
        ${escapeSql(uuid)}, ${escapeSql(lawyer.title)}, ${escapeSql(
        lawyer.headline
      )}, ${escapeSql(barNumber)}, ${escapeSql(stateBar)}, ${isVerifiedSql}, ${verificationStatusSql}::verification_status, ${escapeSql(
        lawyer.availability
      )}, ${acceptingClientsSql}, ${lawyer.yearsExperience || 0}, ${escapeSql(
        lawyer.jurisdiction
      )}, ${escapeSql(lawyer.state)}, ${escapeSql(lawyer.city)}, ${
        lawyer.hourlyRate || 0
      }, ${escapeSqlArray(lawyer.languages)}, ${escapeSqlArray(
        lawyer.practiceAreas
      )}, ${escapeSqlArray(lawyer.tags)}, ${escapeSql(
        lawyer.bio
      )}, ${escapeSqlJson(lawyer.notableCases)}, ${lawyer.rating || 0}, ${
        lawyer.reviewCount || 0
      }, ${lawyer.verifiedReviewCount || 0}
      ) ON CONFLICT (id) DO UPDATE SET 
        title = EXCLUDED.title, headline = EXCLUDED.headline, bar_number = EXCLUDED.bar_number, state_bar = EXCLUDED.state_bar, is_verified = EXCLUDED.is_verified, verification_status = EXCLUDED.verification_status,
        availability = EXCLUDED.availability, accepting_clients = EXCLUDED.accepting_clients, years_experience = EXCLUDED.years_experience,
        jurisdiction = EXCLUDED.jurisdiction, state = EXCLUDED.state, city = EXCLUDED.city, hourly_rate = EXCLUDED.hourly_rate,
        languages = EXCLUDED.languages, practice_areas = EXCLUDED.practice_areas, tags = EXCLUDED.tags, bio = EXCLUDED.bio, notable_cases = EXCLUDED.notable_cases,
        rating = EXCLUDED.rating, review_count = EXCLUDED.review_count, verified_review_count = EXCLUDED.verified_review_count;`
    );

    // Insert Lawyer Services
    if (lawyer.serviceIds && lawyer.serviceIds.length > 0) {
      for (const serviceId of lawyer.serviceIds) {
        lines.push(
          `INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES (${escapeSql(
            uuid
          )}, ${escapeSql(serviceId)}) ON CONFLICT (lawyer_id, service_id) DO NOTHING;`
        );
      }
    }
  }

  const outPath = path.resolve(process.cwd(), "supabase", "migrations", "20260919_seed_phase2_data.sql");
  fs.writeFileSync(outPath, lines.join("\n"));
  console.log(`✅ Seed SQL generated at ${outPath}`);
}

generateSql();
