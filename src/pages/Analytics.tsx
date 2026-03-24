import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowLeft, LogOut, Clock, Users, Star, TrendingUp, BarChart3, Calendar, Timer, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/components/ExportButton";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";

interface ServedEntry {
  entered_at: string;
  served_at: string;
  party_size: number;
  customer_name: string;
}

interface FeedbackEntry {
  rating: number;
  created_at: string;
  comment: string | null;
  customer_name: string;
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
        .select("entered_at, served_at, party_size, customer_name")
        .eq("status", "served")
        .not("served_at", "is", null)
        .order("served_at", { ascending: false });

      if (timeRange === "7d") {
        const d = new Date(); d.setDate(d.getDate() - 7);
        query = query.gte("served_at", d.toISOString());
      } else if (timeRange === "30d") {
        const d = new Date(); d.setDate(d.getDate() - 30);
        query = query.gte("served_at", d.toISOString());
      }

      const { data } = await query;
      setServedData((data as ServedEntry[]) || []);

      let fbQuery = supabase
        .from("feedback")
        .select("rating, created_at, comment, customer_name")
        .order("created_at", { ascending: false });

      if (timeRange === "7d") {
        const d = new Date(); d.setDate(d.getDate() - 7);
        fbQuery = fbQuery.gte("created_at", d.toISOString());
      } else if (timeRange === "30d") {
        const d = new Date(); d.setDate(d.getDate() - 30);
        fbQuery = fbQuery.gte("created_at", d.toISOString());
      }

      const { data: fb } = await fbQuery;
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

  // Stats
  const totalServed = servedData.length;
  const waitTimes = servedData.map((e) => (new Date(e.served_at).getTime() - new Date(e.entered_at).getTime()) / 60000);
  const avgWaitTime = waitTimes.length > 0 ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) : 0;
  const maxWaitTime = waitTimes.length > 0 ? Math.round(Math.max(...waitTimes)) : 0;
  const avgRating = feedbackData.length > 0
    ? (feedbackData.reduce((a, b) => a + b.rating, 0) / feedbackData.length).toFixed(1) : "—";
  const totalCustomers = servedData.reduce((a, b) => a + b.party_size, 0);

  // Returning customers
  const customerCounts: Record<string, number> = {};
  servedData.forEach((e) => { customerCounts[e.customer_name] = (customerCounts[e.customer_name] || 0) + 1; });
  const returningCustomers = Object.values(customerCounts).filter((c) => c > 1).length;

  // Daily chart
  const dailyServed: Record<string, number> = {};
  servedData.forEach((e) => {
    const day = new Date(e.served_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dailyServed[day] = (dailyServed[day] || 0) + 1;
  });
  const dailyChart = Object.entries(dailyServed).reverse().map(([day, count]) => ({ day, count }));

  // Peak hours
  const hourCounts: Record<number, number> = {};
  servedData.forEach((e) => {
    const hour = new Date(e.entered_at).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  const peakHoursChart = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h.toString().padStart(2, "0")}:00`,
    count: hourCounts[h] || 0,
  })).filter((h) => h.count > 0);

  // Wait time trend
  const waitTimeByDay: Record<string, number[]> = {};
  servedData.forEach((e) => {
    const day = new Date(e.served_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const wait = (new Date(e.served_at).getTime() - new Date(e.entered_at).getTime()) / 60000;
    if (!waitTimeByDay[day]) waitTimeByDay[day] = [];
    waitTimeByDay[day].push(wait);
  });
  const waitTrendChart = Object.entries(waitTimeByDay).reverse().map(([day, times]) => ({
    day,
    avgWait: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
  }));

  // Rating distribution
  const ratingDist = [1, 2, 3, 4, 5].map((r) => ({
    rating: `${r}★`,
    count: feedbackData.filter((f) => f.rating === r).length,
  }));
  const COLORS = ["hsl(0, 72%, 55%)", "hsl(25, 80%, 55%)", "hsl(38, 92%, 50%)", "hsl(100, 50%, 45%)", "hsl(152, 60%, 42%)"];

  // Recent feedback
  const recentFeedback = feedbackData.slice(0, 5);

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
        <div className="flex items-center gap-2">
          <ExportButton />
          <Button variant="ghost" onClick={signOut} size="sm" className="gap-2 text-muted-foreground">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Time Range */}
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
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
            <Timer className="w-5 h-5 text-destructive mx-auto mb-1" />
            <p className="text-2xl font-heading font-bold">{maxWaitTime}m</p>
            <p className="text-xs text-muted-foreground">Max Wait</p>
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
          <div className="glass-card rounded-xl p-4 text-center">
            <Award className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-heading font-bold">{returningCustomers}</p>
            <p className="text-xs text-muted-foreground">Returning</p>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Customers Per Day
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

          <div className="glass-card rounded-xl p-6">
            <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Peak Hours
            </h3>
            {peakHoursChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={peakHoursChart}>
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="hsl(168, 60%, 38%)" fill="hsl(168, 60%, 38%)" fillOpacity={0.2} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">No data yet</p>
            )}
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
              <Timer className="w-4 h-4 text-warning" /> Wait Time Trend
            </h3>
            {waitTrendChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={waitTrendChart}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} unit="m" />
                  <Tooltip formatter={(value: number) => [`${value} min`, "Avg Wait"]} />
                  <Line type="monotone" dataKey="avgWait" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={{ fill: "hsl(38, 92%, 50%)" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">No data yet</p>
            )}
          </div>

          <div className="glass-card rounded-xl p-6">
            <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-warning" /> Rating Distribution
            </h3>
            {feedbackData.length > 0 ? (
              <div className="flex flex-col md:flex-row items-center gap-4">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={ratingDist} dataKey="count" nameKey="rating" cx="50%" cy="50%" outerRadius={65} label={({ rating }) => rating}>
                      {ratingDist.map((_, index) => (<Cell key={index} fill={COLORS[index]} />))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5 w-full">
                  {ratingDist.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i] }} />
                      <span className="text-xs text-foreground font-medium w-6">{item.rating}</span>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div className="h-2 rounded-full" style={{ width: `${(item.count / feedbackData.length) * 100}%`, backgroundColor: COLORS[i] }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-6 text-right">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">No feedback yet</p>
            )}
          </div>
        </div>

        {/* Recent Feedback */}
        {recentFeedback.length > 0 && (
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-warning" /> Recent Feedback
            </h3>
            <div className="space-y-3">
              {recentFeedback.map((fb, i) => (
                <div key={i} className="border border-border rounded-lg p-3 flex items-start gap-3">
                  <div className="flex gap-0.5 shrink-0">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= fb.rating ? "fill-warning text-warning" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{fb.customer_name}</p>
                    {fb.comment && <p className="text-xs text-muted-foreground mt-0.5 italic">"{fb.comment}"</p>}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(fb.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Analytics;
