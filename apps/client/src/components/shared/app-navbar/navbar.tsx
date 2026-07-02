"use client";

import {
  HouseIcon,
  MagnifyingGlassIcon,
  UserIcon,
} from "@phosphor-icons/react";
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
    icon: MagnifyingGlassIcon,
    label: "Pesquisar",
    redirectTo: "/search",
  },
  {
    icon: UserIcon,
    label: "Perfil",
    redirectTo: "/@me",
  },
];

export function AppNavbar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:relative md:bottom-auto md:left-auto md:right-auto md:z-auto w-full h-[58px] md:w-22 md:h-screen bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 border-t border-r-0 md:border-t-0 md:border-r border-border flex flex-row md:flex-col items-center justify-around md:justify-start px-2 py-1 md:pt-8 gap-1 md:gap-3">
      {NAVBAR_ITEMS.map((item) => (
        <NavbarItem key={item.label} {...item} />
      ))}
    </nav>
  );
}
