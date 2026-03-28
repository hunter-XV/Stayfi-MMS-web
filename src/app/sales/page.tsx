import { getSales } from "@/lib/queries";
import { formatDZD } from "@/lib/currency";
import { PageHeader, Badge } from "@/components/ui";
import { DateRangeFilter } from "@/components/date-range-filter";
import { ShoppingCart } from "lucide-react";

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

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("fr-DZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function SalesPage({
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
  const sales = getSales(from, to, 200);

  const totalRevenue = sales.reduce((s, r) => s + r.total, 0);

  return (
    <div className="p-6 space-y-6 max-w-300 mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <PageHeader
          title="المبيعات"
          subtitle={`${sales.length} عملية بيع — ${formatDZD(totalRevenue)} إجمالي`}
        />
        <DateRangeFilter activeRange={range} />
      </div>

      {/* Table */}
      {sales.length === 0 ? (
        <div className="rounded-xl border bg-card flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
          <ShoppingCart size={36} className="opacity-30" />
          <p className="text-sm">لا توجد مبيعات في هذه الفترة</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground">
                <th className="py-3 px-4 text-start font-medium">#</th>
                <th className="py-3 px-4 text-start font-medium">التاريخ</th>
                <th className="py-3 px-4 text-start font-medium">المنتجات</th>
                <th className="py-3 px-4 text-end font-medium">المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale, i) => (
                <tr
                  key={sale.id}
                  className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="py-3 px-4 text-muted-foreground tabular-nums">
                    {i + 1}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground tabular-nums">
                    {formatDateTime(sale.createdAt)}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline">{sale.itemCount} قطعة</Badge>
                  </td>
                  <td className="py-3 px-4 text-end font-semibold tabular-nums">
                    {formatDZD(sale.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
