import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { ArrowLeft, Clock, KeyRound } from "lucide-react";
import { toast } from "sonner";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Check if hash contains type=recovery
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      toast.success("Password updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen gradient-hero flex flex-col items-center justify-center px-4">
        <div className="glass-card rounded-2xl p-8 max-w-sm w-full text-center animate-float-up">
          <KeyRound className="w-12 h-12 text-primary mx-auto mb-3" />
          <h2 className="text-xl font-heading font-bold mb-2">Password Updated!</h2>
          <p className="text-muted-foreground mb-4">Your password has been reset successfully.</p>
          <Link to="/admin">
            <Button className="gradient-primary text-primary-foreground">Go to Admin Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!isRecovery) {
    return (
      <div className="min-h-screen gradient-hero flex flex-col items-center justify-center px-4">
        <div className="glass-card rounded-2xl p-8 max-w-sm w-full text-center animate-float-up">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-xl font-heading font-bold mb-2">Invalid Reset Link</h2>
          <p className="text-muted-foreground mb-4">
            This link is invalid or expired. Please request a new password reset.
          </p>
          <Link to="/admin">
            <Button variant="outline">Back to Admin Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero flex flex-col items-center justify-center px-4">
      <Link to="/admin" className="absolute top-4 left-4 text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="glass-card rounded-2xl p-8 max-w-sm w-full animate-float-up">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-6 h-6 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-heading font-bold">Set New Password</h2>
          <p className="text-muted-foreground text-sm mt-1">Enter your new password below</p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <Label htmlFor="password">New Password</Label>
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
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground">
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
