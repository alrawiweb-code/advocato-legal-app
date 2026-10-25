import { createBrowserClient } from "@supabase/ssr";

let clientInstance: ReturnType<typeof createClientInternal> | undefined;

function createClientInternal() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export function createClient() {
  if (typeof window !== "undefined") {
    if (!clientInstance) {
      clientInstance = createClientInternal();
    }
    return clientInstance;
  }
  return createClientInternal();
}
