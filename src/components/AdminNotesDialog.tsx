import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StickyNote } from "lucide-react";
import { toast } from "sonner";

interface AdminNotesDialogProps {
  entryId: string;
  customerName: string;
  currentNotes: string | null;
}

export function AdminNotesDialog({ entryId, customerName, currentNotes }: AdminNotesDialogProps) {
  const [notes, setNotes] = useState(currentNotes || "");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("queue_entries")
        .update({ notes: notes.trim() || null })
        .eq("id", entryId);
      if (error) throw error;
      toast.success("Notes saved");
      setOpen(false);
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={`${currentNotes ? "text-warning" : "text-muted-foreground"}`}>
          <StickyNote className="w-3.5 h-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Notes for {customerName}</DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder="Add internal notes (e.g., special requests, allergies)..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          maxLength={500}
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground">
            {saving ? "Saving..." : "Save Notes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
