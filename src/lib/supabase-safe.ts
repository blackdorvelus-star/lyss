import { supabase as rawSupabase } from "@/integrations/supabase/client";

export const supabase = rawSupabase as any;
