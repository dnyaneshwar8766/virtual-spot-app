import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QrCode, Download } from "lucide-react";

export function QRCodeDisplay() {
  const [open, setOpen] = useState(false);
  const joinUrl = `${window.location.origin}`;

  const handleDownload = () => {
    const svg = document.querySelector("#queue-qr-code svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      ctx?.drawImage(img, 0, 0, 512, 512);
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "lineup-qr-code.png";
      link.href = pngUrl;
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <QrCode className="w-4 h-4" /> QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading text-center">Scan to Join Queue</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div id="queue-qr-code" className="bg-white p-4 rounded-xl">
            <QRCodeSVG value={joinUrl} size={220} level="H" includeMargin />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Display this QR code for customers to scan and join the queue from their phone.
          </p>
          <Button onClick={handleDownload} variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Download QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
