import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Phone, User, Mail } from "lucide-react";

interface JoinQueueFormProps {
  onJoin: (name: string, phone?: string, partySize?: number, email?: string) => Promise<void>;
  waitingCount: number;
}

export function JoinQueueForm({ onJoin, waitingCount }: JoinQueueFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [partySize, setPartySize] = useState("1");
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
      await onJoin(name, phone, parseInt(partySize) || 1, email);
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

        <div>
          <Label htmlFor="phone" className="text-sm font-medium">Phone (optional)</Label>
          <div className="relative mt-1">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="phone"
              placeholder="For notifications"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="pl-10"
              maxLength={20}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email" className="text-sm font-medium">Email (optional)</Label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="For turn notifications"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              maxLength={255}
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

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button
          type="submit"
          disabled={submitting}
          className="w-full gradient-primary text-primary-foreground font-semibold py-6 text-base rounded-xl hover:opacity-90 transition-opacity"
        >
          {submitting ? "Joining..." : "Join Queue"}
        </Button>
      </form>
    </div>
  );
}
