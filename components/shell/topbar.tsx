"use client";

import { usePathname } from "next/navigation";
import { MobileSidebar } from "./sidebar";
import { useAuth } from "@/components/providers/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoonStars, Sun } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const LABELS: Record<string, string> = {
  "/": "Overview",
  "/markets": "Markets",
  "/markets/new": "New market",
  "/categories": "Categories",
  "/trades": "Trades",
  "/orders": "Orders",
  "/positions": "Positions",
  "/wallet": "Wallet",
  "/activity": "Activity",
};

function getLabel(pathname: string): string {
  if (LABELS[pathname]) return LABELS[pathname];
  if (pathname.startsWith("/markets/") && pathname.endsWith("/edit"))
    return "Edit market";
  if (pathname.startsWith("/markets/")) return "Market detail";
  return "";
}

export function Topbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const label = getLabel(pathname);
  const initials = user
    ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() ||
      user.email[0].toUpperCase()
    : "?";

  return (
    <header className="h-14 flex items-center gap-3 px-4 lg:px-6 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30">
      {/* Mobile hamburger */}
      <MobileSidebar />

      {/* Page title */}
      <h1 className="text-sm font-semibold tracking-tight flex-1 min-w-0 truncate">
        {label}
      </h1>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={15} /> : <MoonStars size={15} />}
        </Button>

        {/* Avatar */}
        <Avatar className="size-7 cursor-default">
          <AvatarFallback className="text-[11px] bg-foreground text-background font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
