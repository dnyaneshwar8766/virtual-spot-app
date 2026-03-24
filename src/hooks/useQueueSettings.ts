import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface QueueSettings {
  id: string;
  is_paused: boolean;
  paused_message: string;
  business_hours_enabled: boolean;
  business_open_time: string;
  business_close_time: string;
  business_days: number[];
  updated_at: string;
}

const DEFAULT_SETTINGS: QueueSettings = {
  id: "",
  is_paused: false,
  paused_message: "Queue is currently paused. Please check back later.",
  business_hours_enabled: false,
  business_open_time: "09:00",
  business_close_time: "17:00",
  business_days: [1, 2, 3, 4, 5],
  updated_at: new Date().toISOString(),
};

export function useQueueSettings() {
  const [settings, setSettings] = useState<QueueSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase
      .from("queue_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (data) {
      setSettings(data as unknown as QueueSettings);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();

    const channel = supabase
      .channel("queue-settings-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "queue_settings" }, () => {
        fetchSettings();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchSettings]);

  const updateSettings = async (updates: Partial<QueueSettings>) => {
    const { error } = await supabase
      .from("queue_settings")
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq("id", settings.id);
    if (error) throw error;
  };

  const togglePause = async () => {
    await updateSettings({ is_paused: !settings.is_paused });
  };

  // Check if queue is currently open based on business hours
  const isWithinBusinessHours = () => {
    if (!settings.business_hours_enabled) return true;
    
    const now = new Date();
    const currentDay = now.getDay(); // 0=Sun, 1=Mon...
    if (!settings.business_days.includes(currentDay)) return false;

    const currentTime = now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
    return currentTime >= settings.business_open_time && currentTime <= settings.business_close_time;
  };

  const isQueueOpen = !settings.is_paused && isWithinBusinessHours();

  return {
    settings,
    loading,
    isQueueOpen,
    togglePause,
    updateSettings,
    refetch: fetchSettings,
  };
}
