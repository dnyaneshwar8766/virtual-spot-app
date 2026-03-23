import { Users, User, Clock } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type QueueEntry = Tables<"queue_entries">;

interface CustomerQueueListProps {
  entries: QueueEntry[];
  myEntryId: string | null;
  avgServiceTime?: number;
}

export function CustomerQueueList({ entries, myEntryId, avgServiceTime = 5 }: CustomerQueueListProps) {
  const waitingEntries = entries.filter((e) => e.status === "waiting");
  const servingEntries = entries.filter((e) => e.status === "serving");

  if (waitingEntries.length === 0 && servingEntries.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 max-w-md w-full text-center animate-float-up">
        <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground text-sm">No one in the queue yet. Be the first!</p>
      </div>
    );
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="glass-card rounded-2xl p-6 max-w-md w-full animate-float-up">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="font-heading font-bold text-foreground text-lg">Live Queue</h3>
        <span className="ml-auto text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full">
          {waitingEntries.length} waiting
        </span>
      </div>

      {/* Currently Serving */}
      {servingEntries.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Now Serving
          </p>
          {servingEntries.map((entry) => (
            <div
              key={entry.id}
              className={`flex items-center gap-3 p-3 rounded-xl mb-1.5 ${
                entry.id === myEntryId
                  ? "bg-primary/15 border-2 border-primary ring-2 ring-primary/20"
                  : "bg-success/10 border border-success/30"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-success">✓</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">
                  {entry.customer_name}
                  {entry.id === myEntryId && (
                    <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      You
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Waiting List */}
      {waitingEntries.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Waiting
          </p>
          <div className="space-y-1.5">
            {waitingEntries.map((entry, index) => {
              const isMe = entry.id === myEntryId;
              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isMe
                      ? "bg-primary/15 border-2 border-primary ring-2 ring-primary/20 scale-[1.02]"
                      : "bg-secondary/50 border border-border/50"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isMe ? "gradient-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`text-sm font-bold ${
                        isMe ? "text-primary-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${isMe ? "font-bold text-foreground" : "font-medium text-foreground/80"}`}>
                      {entry.customer_name}
                      {isMe && (
                        <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>Joined {formatTime(entry.entered_at)}</span>
                      {entry.party_size > 1 && (
                        <>
                          <span className="mx-1">•</span>
                          <User className="w-3 h-3" />
                          <span>Party of {entry.party_size}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {isMe && (
                    <span className="text-xs text-primary font-semibold shrink-0">
                      ~{(index + 1) * 5} min
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
