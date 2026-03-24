import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { History, Clock, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface HistoryEntry {
  id: string;
  customer_name: string;
  status: string;
  entered_at: string;
  served_at: string | null;
  party_size: number;
}

interface FeedbackEntry {
  rating: number;
  comment: string | null;
  queue_entry_id: string;
}

export function CustomerHistoryDialog({ customerName }: { customerName: string }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    const fetchHistory = async () => {
      const { data: entries } = await supabase
        .from("queue_entries")
        .select("id, customer_name, status, entered_at, served_at, party_size")
        .eq("customer_name", customerName)
        .order("entered_at", { ascending: false })
        .limit(20);

      setHistory((entries as HistoryEntry[]) || []);

      if (entries && entries.length > 0) {
        const ids = entries.map((e) => e.id);
        const { data: fb } = await supabase
          .from("feedback")
          .select("rating, comment, queue_entry_id")
          .in("queue_entry_id", ids);
        setFeedback((fb as FeedbackEntry[]) || []);
      }
      setLoading(false);
    };

    fetchHistory();
  }, [open, customerName]);

  const totalVisits = history.length;
  const avgRating = feedback.length > 0
    ? (feedback.reduce((a, b) => a + b.rating, 0) / feedback.length).toFixed(1)
    : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <History className="w-3.5 h-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">History: {customerName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 flex justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-secondary rounded-lg p-3 text-center">
                <p className="text-xl font-heading font-bold">{totalVisits}</p>
                <p className="text-xs text-muted-foreground">Total Visits</p>
              </div>
              <div className="bg-secondary rounded-lg p-3 text-center">
                <p className="text-xl font-heading font-bold">{avgRating || "—"}</p>
                <p className="text-xs text-muted-foreground">Avg Rating</p>
              </div>
            </div>

            {/* Visit List */}
            <div className="space-y-2">
              {history.map((entry) => {
                const fb = feedback.find((f) => f.queue_entry_id === entry.id);
                const waitTime = entry.served_at
                  ? Math.round((new Date(entry.served_at).getTime() - new Date(entry.entered_at).getTime()) / 60000)
                  : null;

                return (
                  <div key={entry.id} className="border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(entry.entered_at), { addSuffix: true })}
                      </span>
                      <Badge variant={entry.status === "served" ? "default" : "secondary"} className={entry.status === "served" ? "bg-success text-success-foreground" : ""}>
                        {entry.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Party of {entry.party_size}</span>
                      {waitTime !== null && <span>Wait: {waitTime}m</span>}
                      {fb && (
                        <span className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-warning text-warning" /> {fb.rating}/5
                        </span>
                      )}
                    </div>
                    {fb?.comment && (
                      <p className="text-xs text-muted-foreground mt-1 italic">"{fb.comment}"</p>
                    )}
                  </div>
                );
              })}
              {history.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No visit history found.</p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
