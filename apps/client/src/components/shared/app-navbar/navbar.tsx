"use client";

import { ComponentPropsWithoutRef } from "react";
import { NavbarItem } from "./navbar-item";
import { HouseIcon, UserIcon } from "@phosphor-icons/react";

interface NavbarItens extends ComponentPropsWithoutRef<typeof NavbarItem> {

}

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
  }
];

export function AppNavbar() {
  return (
    <nav className="w-screen h-30 md:w-16 md:h-svh border-t border-r-0 md:border-t-0 md:border-r border-foreground/30 flex flex-row md:flex-col items-center justify-between md:justify-start p-4 gap-4">
      {NAVBAR_ITEMS.map((item) => (
        <NavbarItem key={item.label} {...item} />
      ))}
    </nav>
  )
}
