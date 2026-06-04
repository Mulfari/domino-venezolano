import { createClient } from "@supabase/supabase-js";

export function getTestClient() {
  return createClient(
    process.env.SUPABASE_TEST_URL || "http://localhost:54321",
    process.env.SUPABASE_TEST_KEY || "anon-key"
  );
}
