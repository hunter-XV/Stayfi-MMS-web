import { getDebtClient, getDebtTransactions } from "@/lib/queries";
import { formatDZD } from "@/lib/currency";
import { PageHeader, Badge } from "@/components/ui";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-DZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const typeLabels: Record<string, string> = {
  purchase: "شراء",
  payment: "دفعة",
  add: "إضافة دين",
  initial: "رصيد أولي",
};

export default async function DebtDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clientId = parseInt(id, 10);
  const client = getDebtClient(clientId);

  if (!client) {
    return (
      <div className="p-6 space-y-4">
        <Link
          href="/debts"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          العودة إلى الديون
        </Link>
        <p className="text-muted-foreground">العميل غير موجود</p>
      </div>
    );
  }

  const transactions = getDebtTransactions(clientId);

  // Compute running balance (transactions are newest-first; walk forward to show per-row balance)
  const txWithBalance: Array<(typeof transactions)[0] & { running: number }> =
    [];
  let running = client.balance;
  for (const tx of transactions) {
    txWithBalance.push({ ...tx, running });
    if (tx.type === "payment") running += tx.amount;
    else running -= tx.amount;
  }

  return (
    <div className="p-6 space-y-6 max-w-300 mx-auto">
      {/* Breadcrumb */}
      <Link
        href="/debts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        الديون
      </Link>

      <PageHeader
        title={client.name}
        subtitle={`${transactions.length} معاملة`}
      />

      {/* Balance card */}
      <div
        className={`rounded-xl border p-5 flex items-center justify-between ${
          client.balance > 0
            ? "bg-destructive/10 border-destructive/20"
            : "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
        }`}
      >
        <div>
          <p className="text-xs text-muted-foreground mb-1">الرصيد الحالي</p>
          <p
            className={`text-3xl font-bold tabular-nums ${
              client.balance > 0
                ? "text-destructive"
                : "text-green-600 dark:text-green-400"
            }`}
          >
            {formatDZD(client.balance)}
          </p>
        </div>
        {client.balance > 0 ? (
          <Badge variant="destructive">مديون</Badge>
        ) : (
          <Badge variant="success">مسدد</Badge>
        )}
      </div>

      {/* Transaction table */}
      {transactions.length === 0 ? (
        <div className="rounded-xl border bg-card flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
          <p className="text-sm">لا توجد معاملات</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground">
                <th className="py-3 px-4 text-start font-medium">التاريخ</th>
                <th className="py-3 px-4 text-start font-medium">النوع</th>
                <th className="py-3 px-4 text-start font-medium hidden md:table-cell">
                  الوصف
                </th>
                <th className="py-3 px-4 text-end font-medium">المبلغ</th>
                <th className="py-3 px-4 text-end font-medium">الرصيد</th>
              </tr>
            </thead>
            <tbody>
              {txWithBalance.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="py-3 px-4 text-muted-foreground text-xs">
                    {formatDate(tx.createdAt)}
                  </td>
                  <td className="py-3 px-4">
                    {tx.type === "payment" ? (
                      <Badge variant="success">
                        {typeLabels[tx.type] ?? tx.type}
                      </Badge>
                    ) : tx.type === "purchase" ? (
                      <Badge variant="destructive">
                        {typeLabels[tx.type] ?? tx.type}
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        {typeLabels[tx.type] ?? tx.type}
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                    {tx.description ?? "—"}
                  </td>
                  <td
                    className={`py-3 px-4 text-end font-bold tabular-nums ${
                      tx.type === "payment"
                        ? "text-green-600 dark:text-green-400"
                        : "text-destructive"
                    }`}
                  >
                    {tx.type === "payment" ? "−" : "+"}
                    {formatDZD(tx.amount)}
                  </td>
                  <td className="py-3 px-4 text-end tabular-nums text-muted-foreground">
                    {formatDZD(tx.running)}
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
