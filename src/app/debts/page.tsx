import { getDebtClients } from "@/lib/queries";
import { formatDZD } from "@/lib/currency";
import { PageHeader, Badge } from "@/components/ui";
import { Users } from "lucide-react";
import Link from "next/link";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-DZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function DebtsPage() {
  const clients = getDebtClients();

  const totalDebt = clients.reduce(
    (s, c) => (c.balance > 0 ? s + c.balance : s),
    0
  );
  const withDebt = clients.filter((c) => c.balance > 0).length;

  return (
    <div className="p-6 space-y-6 max-w-300 mx-auto">
      {/* Header */}
      <PageHeader
        title="الديون"
        subtitle={`${clients.length} عميل — ${withDebt} مديون — ${formatDZD(totalDebt)} إجمالي الديون`}
      />

      {/* Summary card */}
      {totalDebt > 0 && (
        <div className="rounded-xl border bg-destructive/10 border-destructive/20 p-4 flex items-center justify-between">
          <p className="text-sm font-medium text-destructive">
            إجمالي الديون المستحقة
          </p>
          <p className="text-lg font-bold text-destructive tabular-nums">
            {formatDZD(totalDebt)}
          </p>
        </div>
      )}

      {/* Table */}
      {clients.length === 0 ? (
        <div className="rounded-xl border bg-card flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
          <Users size={36} className="opacity-30" />
          <p className="text-sm">لا يوجد عملاء</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground">
                <th className="py-3 px-4 text-start font-medium">الاسم</th>
                <th className="py-3 px-4 text-end font-medium">الرصيد</th>
                <th className="py-3 px-4 text-end font-medium hidden md:table-cell">
                  المعاملات
                </th>
                <th className="py-3 px-4 text-start font-medium hidden lg:table-cell">
                  تاريخ الإنشاء
                </th>
                <th className="py-3 px-4 text-start font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr
                  key={c.id}
                  className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="py-3 px-4 font-medium">
                    <Link href={`/debts/${c.id}`} className="hover:underline hover:text-primary transition-colors">
                      {c.name}
                    </Link>
                  </td>
                  <td
                    className={`py-3 px-4 text-end font-bold tabular-nums ${
                      c.balance > 0
                        ? "text-destructive"
                        : "text-green-600 dark:text-green-400"
                    }`}
                  >
                    {formatDZD(c.balance)}
                  </td>
                  <td className="py-3 px-4 text-end text-muted-foreground hidden md:table-cell">
                    {c.transactionCount}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">
                    {formatDate(c.createdAt)}
                  </td>
                  <td className="py-3 px-4">
                    {c.balance > 0 ? (
                      <Badge variant="destructive">مديون</Badge>
                    ) : (
                      <Badge variant="success">مسدد</Badge>
                    )}
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
