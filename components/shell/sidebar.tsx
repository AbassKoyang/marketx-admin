"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ActivityIcon,
  ArrowsLeftRight,
  Briefcase,
  CaretRight,
  ChartBar,
  DotsThree,
  House,
  ListChecks,
  SignOut,
  Tag,
  Users,
  Wallet,
  X,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: House },
  { href: "/users", label: "Users", icon: Users },
  { href: "/markets", label: "Markets", icon: ChartBar },
  { href: "/categories", label: "Categories", icon: Tag },
  { href: "/trades", label: "Trades", icon: ArrowsLeftRight },
  { href: "/orders", label: "Orders", icon: ListChecks },
  { href: "/positions", label: "Positions", icon: Briefcase },
  { href: "/wallet", label: "Wallets", icon: Wallet },
  { href: "/activity", label: "Activity", icon: ActivityIcon },
];

const MOBILE_PRIMARY_HREFS = ["/", "/users", "/markets", "/orders"];

const MOBILE_PRIMARY_ITEMS = NAV_ITEMS.filter((item) =>
  MOBILE_PRIMARY_HREFS.includes(item.href),
);

const MOBILE_MORE_ITEMS = NAV_ITEMS.filter(
  (item) => !MOBILE_PRIMARY_HREFS.includes(item.href),
);

function isItemActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

function getActiveHref(pathname: string) {
  return (
    NAV_ITEMS.slice()
      .reverse()
      .find((item) => isItemActive(pathname, item.href))?.href ?? "/"
  );
}

function getInitials(
  user: { first_name: string; last_name: string; email: string } | null,
) {
  if (!user) return "?";
  return (
    `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() ||
    user.email[0]?.toUpperCase() ||
    "?"
  );
}

// ─── Shared Pieces ────────────────────────────────────────────────────────────

function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-6 items-center justify-center bg-foreground",
        className,
      )}
    >
      <span className="text-[10px] font-bold leading-none tracking-tighter text-background">
        MX
      </span>
    </div>
  );
}

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
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors duration-150",
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

function DesktopSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const activeHref = getActiveHref(pathname);

  return (
    <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border px-5">
        <LogoMark />
        <span className="text-sm font-semibold tracking-tight">MarketX</span>
        <span className="ml-auto bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={activeHref === item.href}
          />
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-border px-3 py-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="size-7">
            <AvatarFallback className="bg-foreground text-[11px] text-background">
              {getInitials(user)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">
              {user?.first_name
                ? `${user.first_name} ${user.last_name}`
                : user?.email}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">
              {user?.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
          >
            <SignOut size={13} />
          </Button>
        </div>
      </div>
    </aside>
  );
}

// ─── Tablet Rail ──────────────────────────────────────────────────────────────

function TabletSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const activeHref = getActiveHref(pathname);

  return (
    <aside className="hidden h-full w-[68px] shrink-0 flex-col border-r border-border bg-sidebar md:flex lg:hidden">
      <div className="flex h-14 shrink-0 items-center justify-center border-b border-border">
        <LogoMark />
      </div>

      <nav
        aria-label="Primary"
        className="flex flex-1 flex-col items-center gap-1 overflow-y-auto py-3"
      >
        {NAV_ITEMS.map((item) => {
          const active = activeHref === item.href;

          return (
            <Tooltip key={item.href}>
              <TooltipTrigger
                render={
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex size-10 items-center justify-center transition-colors duration-150",
                      active
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  />
                }
              >
                <item.icon
                  size={17}
                  weight={active ? "fill" : "regular"}
                />
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <div className="flex flex-col items-center gap-1.5 border-t border-border py-3">
        <span title={user?.email}>
          <Avatar className="size-7">
            <AvatarFallback className="bg-foreground text-[11px] text-background">
              {getInitials(user)}
            </AvatarFallback>
          </Avatar>
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground hover:text-foreground"
          onClick={logout}
          title="Sign out"
          aria-label="Sign out"
        >
          <SignOut size={14} />
        </Button>
      </div>
    </aside>
  );
}

export function Sidebar() {
  return (
    <>
      <DesktopSidebar />
      <TabletSidebar />
    </>
  );
}

// ─── Mobile Bottom Navigation ─────────────────────────────────────────────────

function MobileTab({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium leading-none transition-colors",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {active && (
        <span
          aria-hidden
          className="absolute inset-x-5 top-0 h-0.5 bg-foreground"
        />
      )}
      <Icon size={18} weight={active ? "fill" : "regular"} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const moreActive = !MOBILE_PRIMARY_HREFS.some((href) =>
    isItemActive(pathname, href),
  );

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <div className="flex h-14 items-stretch">
          {MOBILE_PRIMARY_ITEMS.map((item) => (
            <MobileTab
              key={item.href}
              {...item}
              active={isItemActive(pathname, item.href)}
            />
          ))}

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-haspopup="dialog"
            className={cn(
              "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium leading-none transition-colors",
              moreActive ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {moreActive && (
              <span
                aria-hidden
                className="absolute inset-x-5 top-0 h-0.5 bg-foreground"
              />
            )}
            <DotsThree
              size={18}
              weight={moreActive ? "bold" : "regular"}
            />
            <span>More</span>
          </button>
        </div>
      </nav>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="border-border bg-sidebar p-0 pb-[env(safe-area-inset-bottom)]"
        >
          <div className="flex items-center gap-2.5 border-b border-border p-4">
            <LogoMark />
            <SheetTitle className="flex-1 text-sm">Menu</SheetTitle>
            <SheetDescription className="sr-only">
              Other sections and account actions
            </SheetDescription>
            <SheetClose
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Close menu"
                />
              }
            >
              <X size={15} />
            </SheetClose>
          </div>

          <nav aria-label="More sections" className="py-1.5">
            {MOBILE_MORE_ITEMS.map((item) => {
              const active = isItemActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <item.icon
                    size={17}
                    weight={active ? "fill" : "regular"}
                  />
                  <span>{item.label}</span>
                  <CaretRight size={13} className="ms-auto opacity-50" />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5 border-t border-border p-4">
            <Avatar className="size-7">
              <AvatarFallback className="bg-foreground text-[11px] text-background">
                {getInitials(user)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">
                {user?.first_name
                  ? `${user.first_name} ${user.last_name}`
                  : user?.email}
              </p>
              <p className="truncate text-[10px] text-muted-foreground">
                {user?.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={logout}
              aria-label="Sign out"
            >
              <SignOut size={15} />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
