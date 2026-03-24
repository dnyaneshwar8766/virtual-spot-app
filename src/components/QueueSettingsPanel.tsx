import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PauseCircle, PlayCircle, Clock, Settings2 } from "lucide-react";
import { toast } from "sonner";

interface QueueSettingsPanelProps {
  settings: {
    is_paused: boolean;
    paused_message: string;
    business_hours_enabled: boolean;
    business_open_time: string;
    business_close_time: string;
    business_days: number[];
  };
  isQueueOpen: boolean;
  onTogglePause: () => Promise<void>;
  onUpdateSettings: (updates: any) => Promise<void>;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function QueueSettingsPanel({ settings, isQueueOpen, onTogglePause, onUpdateSettings }: QueueSettingsPanelProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [pausedMessage, setPausedMessage] = useState(settings.paused_message);
  const [openTime, setOpenTime] = useState(settings.business_open_time);
  const [closeTime, setCloseTime] = useState(settings.business_close_time);
  const [selectedDays, setSelectedDays] = useState<number[]>(settings.business_days);
  const [hoursEnabled, setHoursEnabled] = useState(settings.business_hours_enabled);

  const handleTogglePause = async () => {
    try {
      await onTogglePause();
      toast.success(settings.is_paused ? "Queue resumed!" : "Queue paused");
    } catch {
      toast.error("Failed to toggle queue status");
    }
  };

  const handleSaveSettings = async () => {
    try {
      await onUpdateSettings({
        paused_message: pausedMessage,
        business_hours_enabled: hoursEnabled,
        business_open_time: openTime,
        business_close_time: closeTime,
        business_days: selectedDays,
      });
      toast.success("Settings saved!");
      setShowSettings(false);
    } catch {
      toast.error("Failed to save settings");
    }
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  return (
    <div className="space-y-4">
      {/* Pause/Resume + Status */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleTogglePause}
          variant={settings.is_paused ? "default" : "outline"}
          className={`gap-2 ${settings.is_paused ? "gradient-primary text-primary-foreground" : ""}`}
        >
          {settings.is_paused ? (
            <><PlayCircle className="w-4 h-4" /> Resume Queue</>
          ) : (
            <><PauseCircle className="w-4 h-4" /> Pause Queue</>
          )}
        </Button>
        <Badge variant={isQueueOpen ? "default" : "destructive"} className={isQueueOpen ? "bg-success text-success-foreground" : ""}>
          {isQueueOpen ? "Queue Open" : "Queue Closed"}
        </Badge>
        <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)} className="ml-auto gap-1">
          <Settings2 className="w-4 h-4" /> Settings
        </Button>
      </div>

      {/* Expanded Settings */}
      {showSettings && (
        <div className="glass-card rounded-xl p-5 space-y-4 animate-float-up">
          <div>
            <Label>Paused Message</Label>
            <Textarea
              value={pausedMessage}
              onChange={(e) => setPausedMessage(e.target.value)}
              className="mt-1"
              rows={2}
              maxLength={300}
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={hoursEnabled} onCheckedChange={setHoursEnabled} />
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" /> Enable Business Hours
            </Label>
          </div>

          {hoursEnabled && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Open Time</Label>
                  <Input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Close Time</Label>
                  <Input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Open Days</Label>
                <div className="flex gap-2 mt-2">
                  {DAY_NAMES.map((name, i) => (
                    <button
                      key={i}
                      onClick={() => toggleDay(i)}
                      className={`w-10 h-10 rounded-lg text-xs font-medium transition-colors ${
                        selectedDays.includes(i)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <Button onClick={handleSaveSettings} className="gradient-primary text-primary-foreground">
            Save Settings
          </Button>
        </div>
      )}
    </div>
  );
}
