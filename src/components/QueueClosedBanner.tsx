import { AlertCircle, Clock } from "lucide-react";

interface QueueClosedBannerProps {
  message: string;
  businessHoursEnabled: boolean;
  openTime: string;
  closeTime: string;
}

export function QueueClosedBanner({ message, businessHoursEnabled, openTime, closeTime }: QueueClosedBannerProps) {
  return (
    <div className="glass-card rounded-2xl p-8 max-w-md w-full animate-float-up text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-8 h-8 text-destructive" />
      </div>
      <h2 className="text-xl font-heading font-bold text-foreground mb-2">
        Queue is Closed
      </h2>
      <p className="text-muted-foreground mb-4">{message}</p>
      {businessHoursEnabled && (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm">
          <Clock className="w-4 h-4" />
          <span>Business Hours: {openTime} – {closeTime}</span>
        </div>
      )}
    </div>
  );
}
