import { supabase } from "@/integrations/supabase/client";

export function useAdminQueue() {
  const markServing = async (id: string) => {
    const { error } = await supabase
      .from("queue_entries")
      .update({ status: "serving" })
      .eq("id", id);
    if (error) throw error;
  };

  const markServed = async (id: string) => {
    const { error } = await supabase
      .from("queue_entries")
      .update({ status: "served", served_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  };

  const removeFromQueue = async (id: string) => {
    const { error } = await supabase
      .from("queue_entries")
      .update({ status: "removed" })
      .eq("id", id);
    if (error) throw error;
  };

  return { markServing, markServed, removeFromQueue };
}
