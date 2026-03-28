import { getDashboardStats } from "@/lib/queries";
import { formatDZD, formatNumber } from "@/lib/currency";
import { StatCard, PageHeader, Separator } from "@/components/ui";
import { DateRangeFilter } from "@/components/date-range-filter";
import { RevenueChart, WholesalePie } from "@/components/charts";
import {
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  RotateCcw,
  DollarSign,
} from "lucide-react";

type Range = "today" | "week" | "month" | "3months";

function getDateRange(range: Range): { from: string; to: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = fmt(now);
  if (range === "today") return { from: today, to: today };
  if (range === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return { from: fmt(d), to: today };
  }
  if (range === "month") {
    const d = new Date(now);
    d.setDate(d.getDate() - 29);
    return { from: fmt(d), to: today };
  }
  const d = new Date(now);
  d.setDate(d.getDate() - 89);
  return { from: fmt(d), to: today };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rawRange } = await searchParams;
  const range: Range =
    rawRange === "today" ||
    rawRange === "week" ||
    rawRange === "month" ||
    rawRange === "3months"
      ? rawRange
      : "month";

  const { from, to } = getDateRange(range);
  const stats = getDashboardStats(from, to);
  const margin =
    stats.totalRevenue > 0
      ? Math.round((stats.grossProfit / stats.totalRevenue) * 100)
      : 0;

  return (
    <div className="p-6 space-y-6 max-w-300 mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <PageHeader title="لوحة التحكم" subtitle="نظرة عامة على أداء المتجر" />
        <DateRangeFilter activeRange={range} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="إجمالي الإيرادات"
          value={formatDZD(stats.totalRevenue)}
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          title="الربح الإجمالي"
          value={formatDZD(stats.grossProfit)}
          subtitle={`هامش ${margin}%`}
          icon={<DollarSign size={18} />}
          highlight={stats.grossProfit > 0 ? "success" : "destructive"}
        />
        <StatCard
          title="عدد المبيعات"
          value={formatNumber(stats.salesCount)}
          subtitle={`متوسط السلة: ${formatDZD(stats.avgBasket)}`}
          icon={<ShoppingCart size={18} />}
        />
        <StatCard
          title="التكاليف"
          value={formatDZD(stats.totalCost)}
          icon={<Package size={18} />}
        />
        <StatCard
          title="المرتجعات"
          value={formatDZD(stats.totalReturns)}
          icon={<RotateCcw size={18} />}
          highlight={stats.totalReturns > 0 ? "destructive" : "default"}
        />
        <StatCard
          title="منخفض المخزون"
          value={formatNumber(stats.lowStockCount)}
          icon={<AlertTriangle size={18} />}
          highlight={stats.lowStockCount > 0 ? "warning" : "default"}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border bg-card p-5 space-y-3">
          <div>
            <p className="font-semibold text-sm">الإيرادات مقابل التكاليف</p>
            <p className="text-xs text-muted-foreground">يومياً</p>
          </div>
          <RevenueChart
            dailyRevenue={stats.dailyRevenue}
            dailyCost={stats.dailyCost}
          />
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-primary inline-block" />
              إيرادات
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-muted-foreground opacity-50 inline-block" />
              تكاليف
            </span>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div>
            <p className="font-semibold text-sm">الجملة مقابل التجزئة</p>
            <p className="text-xs text-muted-foreground">توزيع الإيرادات</p>
          </div>
          <WholesalePie
            wholesaleRevenue={stats.wholesaleRevenue}
            regularRevenue={stats.regularRevenue}
          />
        </div>
      </div>

      {/* Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <p className="font-semibold text-sm">أفضل 5 منتجات — الإيرادات</p>
          <Separator />
          {stats.topByRevenue.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              لا توجد بيانات
            </p>
          ) : (
            <ol className="space-y-3">
              {stats.topByRevenue.map((p, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm truncate">{p.name}</span>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatDZD(p.revenue)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <p className="font-semibold text-sm">أفضل 5 منتجات — الكمية</p>
          <Separator />
          {stats.topByQuantity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              لا توجد بيانات
            </p>
          ) : (
            <ol className="space-y-3">
              {stats.topByQuantity.map((p, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm truncate">{p.name}</span>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatNumber(p.totalQty)} قطعة
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
