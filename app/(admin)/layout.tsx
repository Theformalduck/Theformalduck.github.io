import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { LayoutDashboard, Users, ShoppingBag, Rocket, LogOut, Shield, Flag } from "lucide-react";

const NAV = [
  { href: "/admin",           icon: LayoutDashboard, label: "Overview" },
  { href: "/admin/reports",   icon: Flag,            label: "Reports" },
  { href: "/admin/users",     icon: Users,           label: "Users" },
  { href: "/admin/orders",    icon: ShoppingBag,     label: "Orders" },
  { href: "/admin/campaigns", icon: Rocket,          label: "Campaigns" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/admin");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, name: true },
  });

  if (user?.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-white flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-gray-700 flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-400" />
          <span className="font-bold text-sm tracking-wide">Admin Panel</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-700">
          <p className="px-3 text-xs text-gray-500 mb-2 truncate">{user.name ?? "Admin"}</p>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
