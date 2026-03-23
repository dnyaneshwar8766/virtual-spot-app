import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSmartWaitTime() {
  const [avgServiceTime, setAvgServiceTime] = useState<number>(5); // default 5 min

  useEffect(() => {
    const calculateAvg = async () => {
      // Get recently served entries to calculate average service time
      const { data } = await supabase
        .from("queue_entries")
        .select("entered_at, served_at")
        .eq("status", "served")
        .not("served_at", "is", null)
        .order("served_at", { ascending: false })
        .limit(20);

      if (data && data.length > 0) {
        const times = data
          .map((entry) => {
            const entered = new Date(entry.entered_at).getTime();
            const served = new Date(entry.served_at!).getTime();
            return (served - entered) / 60000; // minutes
          })
          .filter((t) => t > 0 && t < 120); // filter outliers

        if (times.length > 0) {
          const avg = times.reduce((a, b) => a + b, 0) / times.length;
          setAvgServiceTime(Math.round(avg * 10) / 10);
        }
      }
    };

    calculateAvg();
    const interval = setInterval(calculateAvg, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  const getSmartEstimate = (position: number | null) => {
    if (!position) return null;
    return Math.ceil(position * avgServiceTime);
  };

  return { avgServiceTime, getSmartEstimate };
}
