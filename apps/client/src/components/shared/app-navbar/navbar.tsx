"use client";

import { HouseIcon, UserIcon } from "@phosphor-icons/react";
import type { ComponentPropsWithoutRef } from "react";
import { NavbarItem } from "./navbar-item";

interface NavbarItens extends ComponentPropsWithoutRef<typeof NavbarItem> {}

const NAVBAR_ITEMS: NavbarItens[] = [
  {
    icon: HouseIcon,
    label: "Início",
    redirectTo: "/",
  },
  {
    icon: UserIcon,
    label: "Perfil",
    redirectTo: "/@me",
  },
];

export function AppNavbar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:relative md:bottom-auto md:left-auto md:right-auto md:z-auto w-full h-[58px] md:w-16 md:h-screen bg-background border-t border-r-0 md:border-t-0 md:border-r border-foreground/30 flex flex-row md:flex-col items-center justify-between md:justify-start px-8 py-2 gap-6">
      {NAVBAR_ITEMS.map((item) => (
        <NavbarItem key={item.label} {...item} />
      ))}
    </nav>
  );
}
