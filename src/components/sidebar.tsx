"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Store,
} from "lucide-react";

const links = [
  { href: "/", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/sales", label: "المبيعات", icon: ShoppingCart },
  { href: "/stock", label: "المخزون", icon: Package },
  { href: "/debts", label: "الديون", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-e border-border bg-card flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Store className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold tracking-tight">StayEFI</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }
              `}
            >
              <Icon className="w-4.5 h-4.5" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          StayEFI Dashboard
        </p>
        <p className="text-xs text-muted-foreground text-center mt-0.5">
          للقراءة فقط
        </p>
      </div>
    </aside>
  );
}
