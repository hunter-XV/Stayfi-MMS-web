import { getProducts } from "@/lib/queries";
import { formatDZD } from "@/lib/currency";
import { PageHeader, Badge } from "@/components/ui";
import { Package } from "lucide-react";

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const products = getProducts(q ?? "");

  const outOfStock = products.filter((p) => p.stock === 0).length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold).length;

  return (
    <div className="p-6 space-y-6 max-w-300 mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <PageHeader
          title="المخزون"
          subtitle={`${products.length} منتج — ${outOfStock} نفد — ${lowStock} منخفض`}
        />
        <StockSearch q={q ?? ""} />
      </div>

      {/* Stock legend */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          متوفر
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
          منخفض
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          نفد
        </span>
      </div>

      {/* Table */}
      {products.length === 0 ? (
        <div className="rounded-xl border bg-card flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
          <Package size={36} className="opacity-30" />
          <p className="text-sm">لا توجد منتجات</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground">
                <th className="py-3 px-4 text-start font-medium">الاسم</th>
                <th className="py-3 px-4 text-start font-medium hidden md:table-cell">
                  الباركود
                </th>
                <th className="py-3 px-4 text-start font-medium hidden lg:table-cell">
                  الصنف
                </th>
                <th className="py-3 px-4 text-end font-medium">سعر الشراء</th>
                <th className="py-3 px-4 text-end font-medium">سعر البيع</th>
                <th className="py-3 px-4 text-end font-medium">المخزون</th>
                <th className="py-3 px-4 text-start font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const status: "out" | "low" | "ok" =
                  p.stock === 0
                    ? "out"
                    : p.stock <= p.lowStockThreshold
                    ? "low"
                    : "ok";
                return (
                  <tr
                    key={p.id}
                    className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium">{p.name}</td>
                    <td className="py-3 px-4 text-muted-foreground tabular-nums hidden md:table-cell">
                      {p.barcode ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">
                      {p.category ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-end tabular-nums text-muted-foreground">
                      {formatDZD(p.buyPrice)}
                    </td>
                    <td className="py-3 px-4 text-end tabular-nums font-medium">
                      {formatDZD(p.salePrice)}
                    </td>
                    <td className="py-3 px-4 text-end tabular-nums font-semibold">
                      {p.stock}
                    </td>
                    <td className="py-3 px-4">
                      {status === "out" && (
                        <Badge variant="destructive">نفد</Badge>
                      )}
                      {status === "low" && (
                        <Badge variant="warning">منخفض</Badge>
                      )}
                      {status === "ok" && (
                        <Badge variant="success">متوفر</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Search box — needs to be client but we keep the page server by isolating it
function StockSearch({ q }: { q: string }) {
  return (
    <form method="GET">
      <input
        name="q"
        defaultValue={q}
        placeholder="بحث بالاسم أو الباركود…"
        className="h-9 rounded-lg border bg-background px-3 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
    </form>
  );
}
