import { createClient } from "@supabase/supabase-js";

import * as fs from "fs";
import * as path from "path";

// Load .env if present
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [k, ...v] = trimmed.split("=");
        if (k && v) {
          process.env[k.trim()] = v.join("=").trim();
        }
      }
    });
  }
} catch (e) {}

async function runBenchmark() {
  console.log("==================================================");
  console.log("       ADVOCATO PERFORMANCE BENCHMARK SUITE       ");
  console.log("==================================================");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://iudtvlplbuyuazgidllo.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Measure API endpoints locally
  const measureEndpoint = async (url: string, runs = 5) => {
    const times: number[] = [];
    for (let i = 0; i < runs; i++) {
      const start = performance.now();
      try {
        const res = await fetch(url);
        await res.text();
        const duration = performance.now() - start;
        times.push(duration);
      } catch (err: any) {
        console.error(`Failed to fetch ${url}:`, err.message);
      }
    }
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    return { avg, min, max, times };
  };

  console.log("\n[1/3] Benchmarking Local API Routes (5 runs each)...");
  const port = 3001;
  const practiceAreasBench = await measureEndpoint(`http://localhost:${port}/api/practice-areas`);
  console.log(`  /api/practice-areas: Avg: ${practiceAreasBench.avg.toFixed(1)}ms (Min: ${practiceAreasBench.min.toFixed(1)}ms, Max: ${practiceAreasBench.max.toFixed(1)}ms)`);

  const lawyersBench = await measureEndpoint(`http://localhost:${port}/api/lawyers`);
  console.log(`  /api/lawyers:        Avg: ${lawyersBench.avg.toFixed(1)}ms (Min: ${lawyersBench.min.toFixed(1)}ms, Max: ${lawyersBench.max.toFixed(1)}ms)`);

  // 2. Measure Database Queries
  console.log("\n[2/3] Benchmarking Raw Database Queries (Supabase PostgREST)...");
  
  // Query A: lawyer_marketplace_view
  const viewTimes: number[] = [];
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    await supabase.from("lawyer_marketplace_view").select("*").eq("is_verified", true).eq("verification_status", "VERIFIED").gt("hourly_rate", 0);
    viewTimes.push(performance.now() - start);
  }
  const viewAvg = viewTimes.reduce((a, b) => a + b, 0) / viewTimes.length;
  console.log(`  lawyer_marketplace_view query: Avg: ${viewAvg.toFixed(1)}ms`);

  // Query B: messages query by matter_id
  const msgTimes: number[] = [];
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    await supabase.from("messages").select("*, document:documents(*)").limit(50);
    msgTimes.push(performance.now() - start);
  }
  const msgAvg = msgTimes.reduce((a, b) => a + b, 0) / msgTimes.length;
  console.log(`  messages + documents query:    Avg: ${msgAvg.toFixed(1)}ms`);

  // Query C: matters query with profiles join
  const mattersTimes: number[] = [];
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    await supabase.from("matters").select(`
      *,
      client:profiles!matters_client_id_fkey(id, full_name, email),
      lawyer:profiles!matters_lawyer_id_fkey(id, full_name, email)
    `).limit(20);
    mattersTimes.push(performance.now() - start);
  }
  const mattersAvg = mattersTimes.reduce((a, b) => a + b, 0) / mattersTimes.length;
  console.log(`  matters + profiles join query: Avg: ${mattersAvg.toFixed(1)}ms`);

  console.log("\n==================================================");
  console.log("             BASELINE RECORDED                    ");
  console.log("==================================================");
}

runBenchmark().catch(console.error);
