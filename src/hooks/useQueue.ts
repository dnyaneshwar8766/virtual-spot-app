import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type QueueEntry = Tables<"queue_entries">;

export function useQueue() {
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    const { data, error } = await supabase
      .from("queue_entries")
      .select("*")
      .in("status", ["waiting", "serving"])
      .order("entered_at", { ascending: true });

    if (!error && data) {
      // Sort: priority first, then by entered_at
      const sorted = [...data].sort((a, b) => {
        const aPriority = (a as any).priority === "priority" ? 0 : 1;
        const bPriority = (b as any).priority === "priority" ? 0 : 1;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return new Date(a.entered_at).getTime() - new Date(b.entered_at).getTime();
      });
      setEntries(sorted);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEntries();

    const channel = supabase
      .channel("queue-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue_entries" },
        () => {
          fetchEntries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEntries]);

  const joinQueue = async (customerName: string, phone?: string, partySize?: number, email?: string, priority?: string) => {
    const { data, error } = await supabase
      .from("queue_entries")
      .insert({
        customer_name: customerName.trim(),
        phone: phone?.trim() || null,
        party_size: partySize || 1,
        email: email?.trim() || null,
        priority: priority || "normal",
      } as any)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const getPosition = (entryId: string) => {
    const waitingEntries = entries.filter((e) => e.status === "waiting");
    const index = waitingEntries.findIndex((e) => e.id === entryId);
    return index === -1 ? null : index + 1;
  };

  const getEstimatedWait = (position: number | null) => {
    if (!position) return null;
    const avgMinutes = 5;
    return position * avgMinutes;
  };

  const waitingCount = entries.filter((e) => e.status === "waiting").length;

  return {
    entries,
    loading,
    joinQueue,
    getPosition,
    getEstimatedWait,
    waitingCount,
    refetch: fetchEntries,
  };
}
