import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFirstAdminSetup } from "@/hooks/useFirstAdminSetup";
import { useQueue } from "@/hooks/useQueue";
import { useAdminQueue } from "@/hooks/useAdminQueue";
import { AdminQueueTable } from "@/components/AdminQueueTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { ArrowLeft, LogOut, Clock, Users, Timer } from "lucide-react";
import { toast } from "sonner";

const Admin = () => {
  const { user, isAdmin, loading, signIn, signUp, signOut } = useAuth();
  useFirstAdminSetup(user?.id);
  const { entries, waitingCount } = useQueue();
  const { markServing, markServed, removeFromQueue } = useAdminQueue();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const servingCount = entries.filter((e) => e.status === "serving").length;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
        toast.success("Account created! Ask an existing admin to grant you admin access.");
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAction = async (action: () => Promise<void>, label: string) => {
    try {
      await action();
      toast.success(label);
    } catch {
      toast.error("Action failed. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen gradient-hero flex flex-col items-center justify-center px-4">
        <Link to="/" className="absolute top-4 left-4 text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="glass-card rounded-2xl p-8 max-w-sm w-full animate-float-up">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-heading font-bold">Admin Login</h2>
            <p className="text-muted-foreground text-sm mt-1">Manage your queue</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1"
              />
            </div>

            {authError && <p className="text-destructive text-sm">{authError}</p>}

            <Button type="submit" disabled={authLoading} className="w-full gradient-primary text-primary-foreground">
              {authLoading ? "..." : isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          </form>

          {!isSignUp && (
            <div className="text-center mt-2">
              <button
                type="button"
                onClick={async () => {
                  if (!email) {
                    toast.error("Please enter your email first");
                    return;
                  }
                  try {
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${window.location.origin}/reset-password`,
                    });
                    if (error) throw error;
                    toast.success("Password reset email sent! Check your inbox.");
                  } catch (err: any) {
                    toast.error(err.message || "Failed to send reset email");
                  }
                }}
                className="text-sm text-muted-foreground hover:text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground mt-4">
            {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setAuthError(""); }}
              className="text-primary hover:underline font-medium"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Logged in but not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen gradient-hero flex flex-col items-center justify-center px-4">
        <div className="glass-card rounded-2xl p-8 max-w-sm w-full text-center animate-float-up">
          <h2 className="text-xl font-heading font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            Your account doesn't have admin privileges. Contact the business owner to get access.
          </p>
          <Button variant="outline" onClick={signOut} className="gap-2">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg">LineUp Admin</span>
          </div>
        </div>
        <Button variant="ghost" onClick={signOut} size="sm" className="gap-2 text-muted-foreground">
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-card rounded-xl p-4 text-center">
            <Users className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-heading font-bold">{waitingCount}</p>
            <p className="text-xs text-muted-foreground">Waiting</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <Timer className="w-5 h-5 text-warning mx-auto mb-1" />
            <p className="text-2xl font-heading font-bold">{servingCount}</p>
            <p className="text-xs text-muted-foreground">Serving</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <Clock className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-2xl font-heading font-bold">~{waitingCount * 5}</p>
            <p className="text-xs text-muted-foreground">Min total wait</p>
          </div>
        </div>

        <h2 className="font-heading font-bold text-xl mb-4">Current Queue</h2>

        <AdminQueueTable
          entries={entries}
          onServing={(id) => handleAction(() => markServing(id), "Now serving!")}
          onServed={(id) => handleAction(() => markServed(id), "Marked as served")}
          onRemove={(id) => handleAction(() => removeFromQueue(id), "Removed from queue")}
        />
      </main>
    </div>
  );
};

export default Admin;
