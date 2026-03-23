import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowLeft, LogOut, Clock, Users, Star, TrendingUp, BarChart3, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

interface ServedEntry {
  entered_at: string;
  served_at: string;
  party_size: number;
}

interface FeedbackEntry {
  rating: number;
  created_at: string;
}

const Analytics = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const [servedData, setServedData] = useState<ServedEntry[]>([]);
  const [feedbackData, setFeedbackData] = useState<FeedbackEntry[]>([]);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("7d");

  useEffect(() => {
    if (!isAdmin) return;

    const fetchData = async () => {
      let query = supabase
        .from("queue_entries")
        .select("entered_at, served_at, party_size")
        .eq("status", "served")
        .not("served_at", "is", null)
        .order("served_at", { ascending: false });

      if (timeRange === "7d") {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        query = query.gte("served_at", d.toISOString());
      } else if (timeRange === "30d") {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        query = query.gte("served_at", d.toISOString());
      }

      const { data } = await query;
      setServedData((data as ServedEntry[]) || []);

      const { data: fb } = await supabase
        .from("feedback")
        .select("rating, created_at")
        .order("created_at", { ascending: false });
      setFeedbackData((fb as FeedbackEntry[]) || []);
    };

    fetchData();
  }, [isAdmin, timeRange]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen gradient-hero flex flex-col items-center justify-center px-4">
        <div className="glass-card rounded-2xl p-8 max-w-sm w-full text-center animate-float-up">
          <h2 className="text-xl font-heading font-bold mb-2">Admin Access Required</h2>
          <p className="text-muted-foreground mb-4">Please log in as admin to view analytics.</p>
          <Link to="/admin">
            <Button className="gradient-primary text-primary-foreground">Go to Admin</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalServed = servedData.length;
  const avgWaitTime = servedData.length > 0
    ? Math.round(
        servedData.reduce((acc, e) => {
          const wait = (new Date(e.served_at).getTime() - new Date(e.entered_at).getTime()) / 60000;
          return acc + wait;
        }, 0) / servedData.length
      )
    : 0;

  const avgRating = feedbackData.length > 0
    ? (feedbackData.reduce((a, b) => a + b.rating, 0) / feedbackData.length).toFixed(1)
    : "—";

  const totalCustomers = servedData.reduce((a, b) => a + b.party_size, 0);

  // Chart: Customers served per day
  const dailyServed: Record<string, number> = {};
  servedData.forEach((e) => {
    const day = new Date(e.served_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dailyServed[day] = (dailyServed[day] || 0) + 1;
  });
  const dailyChart = Object.entries(dailyServed)
    .reverse()
    .map(([day, count]) => ({ day, count }));

  // Chart: Peak hours
  const hourCounts: Record<number, number> = {};
  servedData.forEach((e) => {
    const hour = new Date(e.entered_at).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  const peakHoursChart = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h.toString().padStart(2, "0")}:00`,
    count: hourCounts[h] || 0,
  })).filter((h) => h.count > 0);

  // Chart: Rating distribution
  const ratingDist = [1, 2, 3, 4, 5].map((r) => ({
    rating: `${r}★`,
    count: feedbackData.filter((f) => f.rating === r).length,
  }));
  const COLORS = [
    "hsl(0, 72%, 55%)",
    "hsl(25, 80%, 55%)",
    "hsl(38, 92%, 50%)",
    "hsl(100, 50%, 45%)",
    "hsl(152, 60%, 42%)",
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg">Queue Analytics</span>
          </div>
        </div>
        <Button variant="ghost" onClick={signOut} size="sm" className="gap-2 text-muted-foreground">
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Time Range Filter */}
        <div className="flex gap-2 mb-6">
          {(["7d", "30d", "all"] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}
              className={timeRange === range ? "gradient-primary text-primary-foreground" : ""}
            >
              {range === "7d" ? "Last 7 Days" : range === "30d" ? "Last 30 Days" : "All Time"}
            </Button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card rounded-xl p-4 text-center">
            <Users className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-heading font-bold">{totalServed}</p>
            <p className="text-xs text-muted-foreground">Served</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <Clock className="w-5 h-5 text-warning mx-auto mb-1" />
            <p className="text-2xl font-heading font-bold">{avgWaitTime}m</p>
            <p className="text-xs text-muted-foreground">Avg Wait</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <Star className="w-5 h-5 text-warning mx-auto mb-1" />
            <p className="text-2xl font-heading font-bold">{avgRating}</p>
            <p className="text-xs text-muted-foreground">Avg Rating</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <TrendingUp className="w-5 h-5 text-success mx-auto mb-1" />
            <p className="text-2xl font-heading font-bold">{totalCustomers}</p>
            <p className="text-xs text-muted-foreground">Total People</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Daily served */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Customers Per Day
            </h3>
            {dailyChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dailyChart}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(168, 60%, 38%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">No data yet</p>
            )}
          </div>

          {/* Peak hours */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Peak Hours
            </h3>
            {peakHoursChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={peakHoursChart}>
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(168, 60%, 38%)"
                    strokeWidth={2}
                    dot={{ fill: "hsl(168, 60%, 38%)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">No data yet</p>
            )}
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-warning" />
            Feedback Distribution
          </h3>
          {feedbackData.length > 0 ? (
            <div className="flex flex-col md:flex-row items-center gap-6">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={ratingDist}
                    dataKey="count"
                    nameKey="rating"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ rating }) => rating}
                  >
                    {ratingDist.map((_, index) => (
                      <Cell key={index} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {ratingDist.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-sm text-foreground font-medium w-8">{item.rating}</span>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${feedbackData.length > 0 ? (item.count / feedbackData.length) * 100 : 0}%`,
                          backgroundColor: COLORS[i],
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">No feedback yet</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default Analytics;
