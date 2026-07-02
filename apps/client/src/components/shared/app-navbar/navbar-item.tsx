"use client";

import type { Icon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavbarItemProps {
  icon: Icon;
  label: string;
  redirectTo: string;
}

export function NavbarItem({ icon: Icon, label, redirectTo }: NavbarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === redirectTo;

  return (
    <Link
      href={redirectTo}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 rounded-2xl px-4 py-1.5 text-center transition-colors duration-150 ease-out active:scale-90 md:w-16 md:rounded-xl md:py-2.5 md:hover:bg-accent/60",
        isActive
          ? "text-primary md:bg-accent md:text-accent-foreground"
          : "text-muted-foreground",
      )}
      aria-label={label}
    >
      <Icon
        size="1em"
        weight={isActive ? "fill" : "regular"}
        className="text-[22px] md:text-[24px]"
      />
      <span className="font-instrument-sans text-[10px] font-medium leading-none tracking-tight md:text-[11px]">
        {label}
      </span>
    </Link>
  );
}
