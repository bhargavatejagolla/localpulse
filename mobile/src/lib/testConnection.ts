import { supabase } from "./supabase";

export const testConnection = async () => {
  console.log("Testing Supabase connection...");

  // Test auth
  const { data: authData, error: authError } = await supabase.auth.getSession();
  console.log("Auth connection:", authError ? "❌ FAILED" : "✅ OK");

  // Test database
  const { data: dbData, error: dbError } = await supabase
    .from("profiles")
    .select("count", { count: "exact", head: true });
  console.log("Database connection:", dbError ? "❌ FAILED" : "✅ OK");

  return {
    auth: !authError,
    database: !dbError,
  };
};
