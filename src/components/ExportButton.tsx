import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

export function ExportButton() {
  const [exporting, setExporting] = useState(false);

  const exportData = async (type: "queue" | "feedback" | "all") => {
    setExporting(true);
    try {
      let csvContent = "";

      if (type === "queue" || type === "all") {
        const { data } = await supabase
          .from("queue_entries")
          .select("*")
          .order("entered_at", { ascending: false })
          .limit(1000);

        if (data && data.length > 0) {
          const headers = ["Name", "Status", "Party Size", "Phone", "Email", "Priority", "Entered At", "Served At", "Notes"];
          csvContent += "=== QUEUE DATA ===\n";
          csvContent += headers.join(",") + "\n";
          data.forEach((row) => {
            csvContent += [
              `"${row.customer_name}"`,
              row.status,
              row.party_size,
              `"${row.phone || ""}"`,
              `"${row.email || ""}"`,
              (row as any).priority || "normal",
              row.entered_at,
              row.served_at || "",
              `"${(row.notes || "").replace(/"/g, '""')}"`,
            ].join(",") + "\n";
          });
        }
      }

      if (type === "feedback" || type === "all") {
        const { data } = await supabase
          .from("feedback")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1000);

        if (data && data.length > 0) {
          if (type === "all") csvContent += "\n=== FEEDBACK DATA ===\n";
          const headers = ["Customer", "Rating", "Comment", "Date"];
          csvContent += headers.join(",") + "\n";
          data.forEach((row) => {
            csvContent += [
              `"${row.customer_name}"`,
              row.rating,
              `"${(row.comment || "").replace(/"/g, '""')}"`,
              row.created_at,
            ].join(",") + "\n";
          });
        }
      }

      if (!csvContent) {
        toast.error("No data to export");
        return;
      }

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lineup-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported!");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={exporting}>
          <Download className="w-4 h-4" />
          {exporting ? "Exporting..." : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => exportData("queue")} className="gap-2">
          <FileSpreadsheet className="w-4 h-4" /> Queue Data
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportData("feedback")} className="gap-2">
          <FileSpreadsheet className="w-4 h-4" /> Feedback Data
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportData("all")} className="gap-2">
          <FileSpreadsheet className="w-4 h-4" /> All Data
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
