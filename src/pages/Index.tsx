import { useState } from "react";
import { JoinQueueForm } from "@/components/JoinQueueForm";
import { QueuePositionCard } from "@/components/QueuePositionCard";
import { useQueue } from "@/hooks/useQueue";
import { Link } from "react-router-dom";
import { Settings, Clock } from "lucide-react";

const Index = () => {
  const { entries, joinQueue, getPosition, getEstimatedWait, waitingCount } = useQueue();
  const [myEntryId, setMyEntryId] = useState<string | null>(() => {
    return localStorage.getItem("queueEntryId");
  });

  const myEntry = entries.find((e) => e.id === myEntryId);
  const position = myEntryId ? getPosition(myEntryId) : null;
  const estimatedWait = getEstimatedWait(position);

  const handleJoin = async (name: string, phone?: string, partySize?: number) => {
    const entry = await joinQueue(name, phone, partySize);
    setMyEntryId(entry.id);
    localStorage.setItem("queueEntryId", entry.id);
  };

  const handleLeave = () => {
    setMyEntryId(null);
    localStorage.removeItem("queueEntryId");
  };

  // If the entry no longer exists in active entries, clear it
  if (myEntryId && !myEntry) {
    // entry was served or removed
  }

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
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
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

        {myEntryId && myEntry ? (
          <QueuePositionCard
            customerName={myEntry.customer_name}
            position={position}
            estimatedWait={estimatedWait}
            status={myEntry.status}
            onLeave={handleLeave}
          />
        ) : myEntryId && !myEntry ? (
          <div className="glass-card rounded-2xl p-8 max-w-md w-full animate-float-up text-center">
            <h2 className="text-xl font-heading font-bold text-foreground mb-2">
              You've Been Served! 🎉
            </h2>
            <p className="text-muted-foreground mb-4">
              Thanks for using LineUp. Hope you had a great experience!
            </p>
            <button
              onClick={handleLeave}
              className="text-primary hover:underline font-medium"
            >
              Join again
            </button>
          </div>
        ) : (
          <JoinQueueForm onJoin={handleJoin} waitingCount={waitingCount} />
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-muted-foreground">
        Powered by LineUp — Virtual Small-Biz Queue
      </footer>
    </div>
  );
};

export default Index;
