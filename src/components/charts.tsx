"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// ─── Revenue vs Cost Bar Chart ───────────────────────────────────────────

interface RevenueChartProps {
  dailyRevenue: Array<{ date: string; revenue: number }>;
  dailyCost: Array<{ date: string; cost: number }>;
}

export function RevenueChart({ dailyRevenue, dailyCost }: RevenueChartProps) {
  // Merge by date
  const dateMap: Record<string, { date: string; revenue: number; cost: number }> = {};
  for (const d of dailyRevenue) {
    dateMap[d.date] = { date: d.date, revenue: d.revenue, cost: 0 };
  }
  for (const d of dailyCost) {
    if (dateMap[d.date]) dateMap[d.date].cost = d.cost;
    else dateMap[d.date] = { date: d.date, revenue: 0, cost: d.cost };
  }
  const data = Object.values(dateMap).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-56 text-muted-foreground text-sm">
        لا توجد بيانات
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickFormatter={(v: string) => v.slice(5)}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
        />
        <Tooltip
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            fontSize: 12,
          }}
          formatter={(value: number, name: string) => [
            `${value.toLocaleString("fr-DZ")} DA`,
            name === "revenue" ? "إيرادات" : "تكاليف",
          ]}
        />
        <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={32} />
        <Bar dataKey="cost" fill="var(--muted-foreground)" radius={[4, 4, 0, 0]} opacity={0.5} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Wholesale vs Regular Pie Chart ──────────────────────────────────────

interface WholesalePieProps {
  wholesaleRevenue: number;
  regularRevenue: number;
}

const COLORS = ["var(--primary)", "var(--muted-foreground)"];

export function WholesalePie({
  wholesaleRevenue,
  regularRevenue,
}: WholesalePieProps) {
  const data = [
    { name: "جملة", value: wholesaleRevenue },
    { name: "تجزئة", value: regularRevenue },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-56 text-muted-foreground text-sm">
        لا توجد بيانات
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            fontSize: 12,
          }}
          formatter={(value: number) => [
            `${value.toLocaleString("fr-DZ")} DA`,
          ]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
              {value}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
