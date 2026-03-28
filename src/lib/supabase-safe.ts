/**
 * Re-export the typed Supabase client.
 *
 * Previously this file cast the client to `any` to work around type errors.
 * The proper fix is to address the type errors at their source (via Database types
 * or explicit casts where truly needed) rather than silencing the entire client.
 *
 * If you encounter a table not yet in the generated types, use:
 *   supabase.from("table_name" as any)  ← scoped, not global
 * instead of casting the whole client.
 */
export { supabase as safeSupabase } from "@/integrations/supabase/client";
