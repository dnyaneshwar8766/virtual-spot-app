import { useState } from "react";
import { JoinQueueForm } from "@/components/JoinQueueForm";
import { QueuePositionCard } from "@/components/QueuePositionCard";
import { CustomerQueueList } from "@/components/CustomerQueueList";
import { FeedbackForm } from "@/components/FeedbackForm";
import { QueueClosedBanner } from "@/components/QueueClosedBanner";
import { useQueue } from "@/hooks/useQueue";
import { useSmartWaitTime } from "@/hooks/useSmartWaitTime";
import { useQueueSettings } from "@/hooks/useQueueSettings";
import { Link } from "react-router-dom";
import { Settings, Clock, Users, Timer, Zap } from "lucide-react";

const Index = () => {
  const { entries, joinQueue, getPosition, waitingCount } = useQueue();
  const { avgServiceTime, getSmartEstimate } = useSmartWaitTime();
  const { settings, isQueueOpen } = useQueueSettings();
  const [myEntryId, setMyEntryId] = useState<string | null>(() => {
    return localStorage.getItem("queueEntryId");
  });
  const [myName, setMyName] = useState<string>(() => {
    return localStorage.getItem("queueCustomerName") || "";
  });

  const myEntry = entries.find((e) => e.id === myEntryId);
  const position = myEntryId ? getPosition(myEntryId) : null;
  const estimatedWait = getSmartEstimate(position);

  const handleJoin = async (name: string, phone?: string, partySize?: number, email?: string, priority?: string) => {
    const entry = await joinQueue(name, phone, partySize, email, priority);
    setMyEntryId(entry.id);
    setMyName(name);
    localStorage.setItem("queueEntryId", entry.id);
    localStorage.setItem("queueCustomerName", name);
  };

  const handleLeave = () => {
    setMyEntryId(null);
    setMyName("");
    localStorage.removeItem("queueEntryId");
    localStorage.removeItem("queueCustomerName");
  };

  const wasServed = myEntryId && !myEntry;
  const servingCount = entries.filter((e) => e.status === "serving").length;

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Clock className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-heading font-bold text-lg text-foreground">LineUp</span>
        </div>
        <Link
          to="/admin"
          className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-1"
        >
          <Settings className="w-4 h-4" />
          Admin
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-4 pb-12 pt-6">
        <div className="text-center mb-8 animate-float-up">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground leading-tight">
            Skip the Wait,
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Not the Line
            </span>
          </h1>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto">
            Join the virtual queue from your phone. We'll let you know when it's your turn.
          </p>
        </div>

        {/* Live Stats Strip */}
        <div className="flex items-center gap-4 mb-6 animate-float-up" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-sm">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium">{waitingCount}</span>
            <span className="text-muted-foreground">waiting</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-sm">
            <Zap className="w-3.5 h-3.5 text-warning" />
            <span className="font-medium">{servingCount}</span>
            <span className="text-muted-foreground">serving</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-sm">
            <Timer className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-medium">~{avgServiceTime}m</span>
            <span className="text-muted-foreground">avg</span>
          </div>
        </div>

        {/* Queue Closed Banner */}
        {!isQueueOpen && !myEntryId ? (
          <QueueClosedBanner
            message={settings.paused_message}
            businessHoursEnabled={settings.business_hours_enabled}
            openTime={settings.business_open_time}
            closeTime={settings.business_close_time}
          />
        ) : myEntryId && myEntry ? (
          <div className="flex flex-col items-center gap-6 w-full max-w-md">
            <QueuePositionCard
              customerName={myEntry.customer_name}
              position={position}
              estimatedWait={estimatedWait}
              status={myEntry.status}
              onLeave={handleLeave}
            />
            <CustomerQueueList entries={entries} myEntryId={myEntryId} avgServiceTime={avgServiceTime} />
          </div>
        ) : wasServed ? (
          <FeedbackForm
            queueEntryId={myEntryId!}
            customerName={myName || "Customer"}
            onDone={handleLeave}
          />
        ) : (
          <div className="flex flex-col items-center gap-6 w-full max-w-md">
            <JoinQueueForm onJoin={handleJoin} waitingCount={waitingCount} />
            <CustomerQueueList entries={entries} myEntryId={null} avgServiceTime={avgServiceTime} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-muted-foreground">
        Powered by LineUp — Virtual Queue Management
      </footer>
    </div>
  );
};
export default Index;
