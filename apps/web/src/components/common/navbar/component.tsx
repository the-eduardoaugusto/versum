"use client";

import gsap from "gsap";
import { ListIcon } from "@phosphor-icons/react";
import { useChangeNavColors } from "./use-change-nav-colors";

export function Navbar() {
  useChangeNavColors((newColor) => {
    gsap.to("#landing-page-navbar", {
      color: newColor,
      duration: 0.3,
    });
  });
  return (
    <nav
      id="landing-page-navbar"
      className="flex justify-between items-center w-screen fixed top-0 left-0 z-99 px-8 py-4 text-amber-50"
    >
      <p className="font-instrument-serif text-2xl">Versum</p>

      <ListIcon size={26} weight="duotone" />
    </nav>
  );
}
