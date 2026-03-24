import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Users, Phone, User, Mail, Crown } from "lucide-react";

interface JoinQueueFormProps {
  onJoin: (name: string, phone?: string, partySize?: number, email?: string, priority?: string) => Promise<void>;
  waitingCount: number;
}

export function JoinQueueForm({ onJoin, waitingCount }: JoinQueueFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [partySize, setPartySize] = useState("1");
  const [isPriority, setIsPriority] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (/\d/.test(name)) {
      setError("Name should only contain letters, no digits");
      return;
    }
    if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) {
      setError("Name should only contain letters, spaces, hyphens or apostrophes");
      return;
    }
    if (name.trim().length > 100) {
      setError("Name must be under 100 characters");
      return;
    }
    if (phone && !/^[\d+\-() ]+$/.test(phone.trim())) {
      setError("Phone should only contain numbers and +, -, (, ) characters");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    setSubmitting(true);
    try {
      await onJoin(name, phone, parseInt(partySize) || 1, email, isPriority ? "priority" : "normal");
    } catch {
      setError("Failed to join queue. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-8 max-w-md w-full animate-float-up">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
          <Users className="w-4 h-4" />
          <span>{waitingCount} {waitingCount === 1 ? "person" : "people"} in line</span>
        </div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Join the Queue</h2>
        <p className="text-muted-foreground mt-1">Skip the physical wait — join from anywhere</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-sm font-medium">Your Name *</Label>
          <div className="relative mt-1">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-10"
              maxLength={100}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="phone"
                placeholder="Optional"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10"
                maxLength={20}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="partySize" className="text-sm font-medium">Party Size</Label>
            <div className="relative mt-1">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="partySize"
                type="number"
                min={1}
                max={20}
                value={partySize}
                onChange={(e) => setPartySize(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="email" className="text-sm font-medium">Email (for notifications)</Label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="Optional"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              maxLength={255}
            />
          </div>
        </div>

        {/* Priority Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-warning/5 border border-warning/20">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-warning" />
            <div>
              <p className="text-sm font-medium">Priority / VIP</p>
              <p className="text-xs text-muted-foreground">Skip ahead in the queue</p>
            </div>
          </div>
          <Switch checked={isPriority} onCheckedChange={setIsPriority} />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button
          type="submit"
          disabled={submitting}
          className="w-full gradient-primary text-primary-foreground font-semibold py-6 text-base rounded-xl hover:opacity-90 transition-opacity"
        >
          {submitting ? "Joining..." : isPriority ? "Join as VIP ⚡" : "Join Queue"}
        </Button>
      </form>
    </div>
  );
}
