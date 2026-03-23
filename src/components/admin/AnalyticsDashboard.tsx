import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Users, Eye, TrendingUp, Calendar } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from "recharts";

interface Visit {
  id: string;
  user_id: string | null;
  session_id: string;
  visited_at: string;
  user_agent: string | null;
  page_path: string | null;
}

type Period = "daily" | "weekly" | "monthly";

const AnalyticsDashboard = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("daily");

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("site_visits")
        .select("*")
        .order("visited_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      setVisits(data || []);
    } catch (e) {
      console.error("Failed to fetch visits:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  const stats = useMemo(() => {
    const totalVisits = visits.length;
    const uniqueSessions = new Set(visits.map((v) => v.session_id)).size;
    const uniqueUsers = new Set(visits.filter((v) => v.user_id).map((v) => v.user_id)).size;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 86400000);
    const monthAgo = new Date(today.getTime() - 30 * 86400000);

    const todayVisits = visits.filter((v) => new Date(v.visited_at) >= today).length;
    const weekVisits = visits.filter((v) => new Date(v.visited_at) >= weekAgo).length;
    const monthVisits = visits.filter((v) => new Date(v.visited_at) >= monthAgo).length;

    return { totalVisits, uniqueSessions, uniqueUsers, todayVisits, weekVisits, monthVisits };
  }, [visits]);

  const chartData = useMemo(() => {
    const buckets = new Map<string, number>();
    const now = new Date();

    visits.forEach((v) => {
      const d = new Date(v.visited_at);
      let key: string;
      if (period === "daily") {
        key = d.toISOString().slice(0, 10);
      } else if (period === "weekly") {
        const weekStart = new Date(d);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        key = weekStart.toISOString().slice(0, 10);
      } else {
        key = d.toISOString().slice(0, 7);
      }
      buckets.set(key, (buckets.get(key) || 0) + 1);
    });

    return Array.from(buckets.entries())
      .map(([date, count]) => ({ date, visits: count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);
  }, [visits, period]);

  const topUsers = useMemo(() => {
    const counts = new Map<string, number>();
    visits.forEach((v) => {
      const key = v.user_id || `anon:${v.session_id}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([id, count]) => ({
        id,
        isAnonymous: id.startsWith("anon:"),
        label: id.startsWith("anon:") ? `Anonymous (${id.slice(5, 13)}...)` : id.slice(0, 8) + "...",
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [visits]);

  const chartConfig = {
    visits: { label: "Visits", color: "hsl(var(--primary))" },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Website Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">Track visitor activity on your website</p>
        </div>
        <Button variant="outline" onClick={fetchVisits} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{stats.totalVisits}</p>
            <p className="text-xs text-muted-foreground">Total Visits</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{stats.uniqueSessions}</p>
            <p className="text-xs text-muted-foreground">Unique Visitors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
            <p className="text-xs text-muted-foreground">Logged-in Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{stats.todayVisits}</p>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{stats.weekVisits}</p>
            <p className="text-xs text-muted-foreground">This Week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{stats.monthVisits}</p>
            <p className="text-xs text-muted-foreground">This Month</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg">Visits Over Time</CardTitle>
            <div className="flex gap-1">
              {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={period === p ? "default" : "outline"}
                  onClick={() => setPeriod(p)}
                  className="capitalize text-xs"
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => {
                    if (period === "monthly") return v;
                    return v.slice(5);
                  }}
                />
                <YAxis allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="visits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">No visit data yet</p>
          )}
        </CardContent>
      </Card>

      {/* Top Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Active Users</CardTitle>
        </CardHeader>
        <CardContent>
          {topUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Visits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topUsers.map((user, i) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{i + 1}</TableCell>
                    <TableCell className="font-mono text-xs">{user.label}</TableCell>
                    <TableCell>
                      <Badge variant={user.isAnonymous ? "secondary" : "default"}>
                        {user.isAnonymous ? "Anonymous" : "Registered"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold">{user.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">No visitors yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
