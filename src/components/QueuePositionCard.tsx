import { Clock, Hash, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QueuePositionCardProps {
  customerName: string;
  position: number | null;
  estimatedWait: number | null;
  status: string;
  onLeave: () => void;
}

export function QueuePositionCard({
  customerName,
  position,
  estimatedWait,
  status,
  onLeave,
}: QueuePositionCardProps) {
  const isServing = status === "serving";

  return (
    <div className="glass-card rounded-2xl p-8 max-w-md w-full animate-float-up text-center">
      {isServing ? (
        <>
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
            It's Your Turn!
          </h2>
          <p className="text-muted-foreground">
            {customerName}, please head to the counter now.
          </p>
        </>
      ) : (
        <>
          <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-heading font-bold text-primary-foreground">
              {position ?? "—"}
            </span>
          </div>
          <h2 className="text-2xl font-heading font-bold text-foreground mb-1">
            You're in Line, {customerName}!
          </h2>
          <p className="text-muted-foreground mb-6">Your queue updates in real time</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-secondary rounded-xl p-4">
              <Hash className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-heading font-bold text-foreground">{position ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Position</p>
            </div>
            <div className="bg-secondary rounded-xl p-4">
              <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-heading font-bold text-foreground">
                ~{estimatedWait ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">Min wait</p>
            </div>
          </div>
        </>
      )}

      <Button
        variant="outline"
        onClick={onLeave}
        className="mt-4 gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Leave Queue
      </Button>
    </div>
  );
}
