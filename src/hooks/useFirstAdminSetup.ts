import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useFirstAdminSetup(userId: string | undefined) {
  const [setupDone, setSetupDone] = useState(false);

  useEffect(() => {
    if (!userId) { setSetupDone(true); return; }

    const trySetup = async () => {
      // Try to insert self as admin — will only succeed if no admins exist (RLS policy)
      await supabase.from("user_roles").insert({
        user_id: userId,
        role: "admin" as const,
      });
      setSetupDone(true);
    };
    trySetup();
  }, [userId]);

  return setupDone;
}
