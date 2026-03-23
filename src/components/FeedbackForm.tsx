import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface FeedbackFormProps {
  queueEntryId: string;
  customerName: string;
  onDone: () => void;
}

export function FeedbackForm({ queueEntryId, customerName, onDone }: FeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("feedback").insert({
        queue_entry_id: queueEntryId,
        customer_name: customerName,
        rating,
        comment: comment.trim() || null,
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success("Thank you for your feedback!");
    } catch {
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="glass-card rounded-2xl p-8 max-w-md w-full animate-float-up text-center">
        <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
        <h2 className="text-xl font-heading font-bold text-foreground mb-2">Thanks for Your Feedback!</h2>
        <p className="text-muted-foreground mb-4">Your opinion helps us improve.</p>
        <Button onClick={onDone} className="gradient-primary text-primary-foreground">
          Join Queue Again
        </Button>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-8 max-w-md w-full animate-float-up">
      <div className="text-center mb-6">
        <h2 className="text-xl font-heading font-bold text-foreground mb-1">
          You've Been Served! 🎉
        </h2>
        <p className="text-muted-foreground text-sm">
          How was your experience, {customerName}?
        </p>
      </div>

      {/* Star Rating */}
      <div className="flex justify-center gap-2 mb-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-10 h-10 transition-colors ${
                star <= (hoveredRating || rating)
                  ? "fill-warning text-warning"
                  : "text-muted-foreground/30"
              }`}
            />
          </button>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground mb-4">
        {rating === 0 && "Tap a star to rate"}
        {rating === 1 && "Poor 😞"}
        {rating === 2 && "Below Average 😕"}
        {rating === 3 && "Average 🙂"}
        {rating === 4 && "Good 😊"}
        {rating === 5 && "Excellent! 🤩"}
      </p>

      <Textarea
        placeholder="Tell us more (optional)..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="mb-4 resize-none"
        rows={3}
        maxLength={500}
      />

      <div className="flex gap-3">
        <Button variant="outline" onClick={onDone} className="flex-1">
          Skip
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || rating === 0}
          className="flex-1 gradient-primary text-primary-foreground gap-2"
        >
          <Send className="w-4 h-4" />
          {submitting ? "Sending..." : "Submit"}
        </Button>
      </div>
    </div>
  );
}
