"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Boxes, ExternalLink, HandCoins, KeyRound, Wheat, FileBarChart, Tag, Megaphone, FolderTree, LayoutDashboard, LogOut, Menu, Package, Settings, ShoppingCart, X } from "lucide-react";
import { Logo } from "../brand/Logo";
import { logoutAction } from "@/app/admin/actions";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/reports", label: "Sales reports", icon: FileBarChart },
  { href: "/admin/stickers", label: "Packing stickers", icon: Tag },
  { href: "/admin/products", label: "Products & Prices", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/ingredients", label: "Ingredients stock", icon: Wheat },
  { href: "/admin/investors", label: "Investors & money", icon: HandCoins },
  { href: "/admin/popup", label: "Website popup", icon: Megaphone },
  { href: "/admin/settings", label: "Settings & Payments", icon: Settings },
];

export function AdminNav({ email, name }: { email: string; name: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (h: string) => (h === "/admin" ? path === h : path.startsWith(h));
  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-maroon-700/10 bg-white px-4 py-3 lg:hidden">
        <Logo className="h-9 w-auto" />
        <button onClick={() => setOpen(!open)} className="rounded-xl p-2 ring-1 ring-maroon-700/15" aria-label="Menu">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
      </div>
      <aside className={`${open ? "block" : "hidden"} border-r border-maroon-700/10 bg-white lg:sticky lg:top-0 lg:block lg:h-dvh lg:overflow-y-auto`}>
        <div className="flex min-h-full flex-col p-4">
          <Link href="/admin" className="hidden px-2 py-3 lg:block"><Logo className="h-11 w-auto" /></Link>
          <p className="px-3 pb-2 pt-2 text-[11px] font-bold uppercase tracking-widest text-ink/40">Admin panel</p>
          <nav className="space-y-1">
            {NAV.map(({ href, label, icon: I }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition [@media(max-height:820px)]:py-1.5 ${active(href) ? "bg-maroon-700 text-cream" : "hover:bg-cream"}`}>
                <I className="h-4 w-4" /> {label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto space-y-1 border-t border-maroon-700/10 bg-white pt-4">
            <Link href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-cream"><ExternalLink className="h-4 w-4" /> View website</Link>
            <Link href="/admin/account" onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${active("/admin/account") ? "bg-maroon-700 text-cream" : "hover:bg-cream"}`}><KeyRound className="h-4 w-4" /> My account & logins</Link>
            <form action={logoutAction}><button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-cream"><LogOut className="h-4 w-4" /> Sign out</button></form>
            <p className="truncate px-3 pt-2 text-xs text-ink/40"><b className="text-ink/60">{name}</b> · {email}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
