import { supabase as rawSupabase } from "@/integrations/supabase/client";

export const safeSupabase = rawSupabase as any;
