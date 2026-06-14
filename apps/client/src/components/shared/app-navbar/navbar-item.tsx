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
      className="flex flex-col items-center justify-center p-2 text-center"
      aria-label={label}
    >
      <Icon size={24} weight={isActive ? "fill" : "regular"} />
      <span className={cn("font-instrument-sans")}>{label}</span>
    </Link>
  );
}
