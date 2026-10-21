"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChartBar,
  House,
  Tag,
  ArrowsLeftRight,
  ListChecks,
  Briefcase,
  Wallet,
  ActivityIcon,
  SignOut,
  X,
  List,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: House },
  { href: "/markets", label: "Markets", icon: ChartBar },
  { href: "/categories", label: "Categories", icon: Tag },
  { href: "/trades", label: "Trades", icon: ArrowsLeftRight },
  { href: "/orders", label: "Orders", icon: ListChecks },
  { href: "/positions", label: "Positions", icon: Briefcase },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/activity", label: "Activity", icon: ActivityIcon },
];

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-none px-3 py-2 text-sm font-medium transition-colors duration-150",
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <Icon size={16} weight={active ? "fill" : "regular"} />
      <span>{label}</span>
    </Link>
  );
}

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = user
    ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || user.email[0].toUpperCase()
    : "?";

  const activeHref = NAV_ITEMS.slice()
    .reverse()
    .find((item) => pathname === item.href || pathname.startsWith(item.href + "/"))?.href ?? "/";

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 h-screen sticky top-0 border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-border shrink-0">
        <div className="size-6 rounded-md bg-foreground flex items-center justify-center">
          <span className="text-background text-[10px] font-bold tracking-tighter leading-none">MX</span>
        </div>
        <span className="text-sm font-semibold tracking-tight">MarketX</span>
        <span className="ml-auto text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={activeHref === item.href}
          />
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <Avatar className="size-7">
            <AvatarFallback className="text-[11px] bg-foreground text-background">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">
              {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.email}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={logout}
            title="Sign out"
          >
            <SignOut size={13} />
          </Button>
        </div>
      </div>
    </aside>
  );
}

// ─── Mobile Drawer Sidebar ────────────────────────────────────────────────────
export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = user
    ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || user.email[0].toUpperCase()
    : "?";

  const activeHref = NAV_ITEMS.slice()
    .reverse()
    .find((item) => pathname === item.href || pathname.startsWith(item.href + "/"))?.href ?? "/";

  return (
    <>
      {/* Hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden p-2 text-foreground"
        aria-label="Open menu"
      >
        <List size={20} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Scrim */}
            <motion.div
              key="scrim"
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
            />
            {/* Drawer */}
            <motion.aside
              key="drawer"
              className="fixed left-0 top-0 h-full w-72 bg-sidebar z-50 flex flex-col border-r border-border lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", duration: 0.35, bounce: 0 }}
            >
              {/* Header */}
              <div className="flex items-center gap-2.5 px-5 h-14 border-b border-border">
                <div className="size-6 rounded-md bg-foreground flex items-center justify-center">
                  <span className="text-background text-[10px] font-bold tracking-tighter">MX</span>
                </div>
                <span className="text-sm font-semibold tracking-tight">MarketX</span>
                <button
                  onClick={() => setOpen(false)}
                  className="ml-auto p-1 text-muted-foreground hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Nav */}
              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.href}
                    {...item}
                    active={activeHref === item.href}
                    onClick={() => setOpen(false)}
                  />
                ))}
              </nav>

              {/* User */}
              <div className="px-3 py-3 border-t border-border">
                <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
                  <Avatar className="size-7">
                    <AvatarFallback className="text-[11px] bg-foreground text-background">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.email}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 shrink-0"
                    onClick={logout}
                    title="Sign out"
                  >
                    <SignOut size={13} />
                  </Button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
