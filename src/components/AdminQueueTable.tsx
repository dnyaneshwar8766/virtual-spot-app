import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Play, Trash2, Clock, Users } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";

type QueueEntry = Tables<"queue_entries">;

interface AdminQueueTableProps {
  entries: QueueEntry[];
  onServing: (id: string) => void;
  onServed: (id: string) => void;
  onRemove: (id: string) => void;
}

export function AdminQueueTable({ entries, onServing, onServed, onRemove }: AdminQueueTableProps) {
  const waiting = entries.filter((e) => e.status === "waiting");
  const serving = entries.filter((e) => e.status === "serving");
  const all = [...serving, ...waiting];

  if (all.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="font-heading text-lg">No one in the queue</p>
        <p className="text-sm">Customers will appear here when they join.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {all.map((entry, i) => (
        <div
          key={entry.id}
          className={`glass-card rounded-xl p-4 flex items-center gap-4 transition-all ${
            entry.status === "serving" ? "ring-2 ring-success/50 bg-success/5" : ""
          }`}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-primary-foreground">
              {entry.status === "serving" ? "⚡" : i + 1}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-heading font-semibold text-foreground truncate">
                {entry.customer_name}
              </p>
              <Badge
                variant={entry.status === "serving" ? "default" : "secondary"}
                className={entry.status === "serving" ? "bg-success text-success-foreground" : ""}
              >
                {entry.status}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(entry.entered_at), { addSuffix: true })}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                Party of {entry.party_size}
              </span>
              {entry.phone && <span>📱 {entry.phone}</span>}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {entry.status === "waiting" && (
              <Button
                size="sm"
                onClick={() => onServing(entry.id)}
                className="gradient-primary text-primary-foreground gap-1"
              >
                <Play className="w-3 h-3" /> Serve
              </Button>
            )}
            {entry.status === "serving" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onServed(entry.id)}
                className="text-success border-success/30 hover:bg-success/10 gap-1"
              >
                <CheckCircle className="w-3 h-3" /> Done
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemove(entry.id)}
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
