"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { AdminUserCompact } from "@/lib/types";

export function userDisplayName(user: AdminUserCompact): string {
  const full = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return full || user.username || user.email;
}

export function userInitials(user: AdminUserCompact): string {
  const name = userDisplayName(user);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function UserCell({
  user,
  href,
  className,
}: {
  user: AdminUserCompact;
  href?: string;
  className?: string;
}) {
  const body = (
    <div className={cn("group flex min-w-0 items-center gap-2.5", className)}>
      <Avatar className="size-7 shrink-0">
        {user.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
        <AvatarFallback className="bg-muted text-[10px] font-medium">
          {userInitials(user)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium group-hover:underline">
          {userDisplayName(user)}
        </p>
        <p className="truncate text-[10px] text-muted-foreground">
          {user.email}
        </p>
      </div>
    </div>
  );

  if (!href) return body;

  return (
    <Link href={href} className="block min-w-0">
      {body}
    </Link>
  );
}
