"use client";
import { useEffect } from "react";

const EVENT_NAME = "change-nav-colors";
let lastColor = "#fffbeb";

export const defaultColors = {
  PRIMARY_NAVBAR_COLOR: "#fffbeb",
  SECONDARY_NAVBAR_COLOR: "#302f2c",
} as const;

type DeafultColorType = keyof typeof defaultColors;

export function useChangeNavColors(onListen?: (color: string) => void) {
  const changeColor = (color: string) => {
    const usingDefualtColor = Object.keys(defaultColors).includes(color);
    if (
      color === lastColor ||
      (usingDefualtColor &&
        defaultColors[color as DeafultColorType] == lastColor)
    )
      return;
    const selectedColor = usingDefualtColor
      ? defaultColors[color as DeafultColorType]
      : color;

    const event = new CustomEvent(EVENT_NAME, {
      detail: { color: selectedColor },
    });

    console.log(`Emitindo: de ${lastColor} para ${selectedColor}!`);
    lastColor = selectedColor;
    window.dispatchEvent(event);
  };

  useEffect(() => {
    if (!onListen) return;

    const handler = (e: Event) => {
      const evt = e as CustomEvent<{ color: string }>;
      const next = evt.detail.color;

      if (next !== lastColor) {
        console.log(`Mudando de ${lastColor} para ${next}!`);
        lastColor = next;
      }

      onListen(next);
    };

    if (lastColor != defaultColors["PRIMARY_NAVBAR_COLOR"]) onListen(lastColor);

    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, [onListen]);

  return { changeColor };
}
