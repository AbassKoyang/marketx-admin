"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoonStars, Sun } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const LABELS: Record<string, string> = {
  "/": "Overview",
  "/users": "Users",
  "/markets": "Markets",
  "/markets/new": "New market",
  "/categories": "Categories",
  "/trades": "Trades",
  "/orders": "Orders",
  "/positions": "Positions",
  "/wallet": "Wallets",
  "/activity": "Activity",
};

function getLabel(pathname: string): string {
  if (LABELS[pathname]) return LABELS[pathname];
  if (pathname.startsWith("/users/")) return "User detail";
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
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2.5 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-5 lg:px-6">
      {/* Mobile brand mark */}
      <div className="flex size-6 shrink-0 items-center justify-center bg-foreground md:hidden">
        <span className="text-[10px] font-bold leading-none tracking-tighter text-background">
          MX
        </span>
      </div>

      {/* Page title */}
      <h1 className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight">
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
