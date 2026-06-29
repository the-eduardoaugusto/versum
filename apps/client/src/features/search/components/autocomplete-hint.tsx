"use client";

import { ArrowElbowDownLeftIcon } from "@phosphor-icons/react";

interface AutocompleteHintProps {
  visible: boolean;
  isMobile: boolean;
}

export function AutocompleteHint({ visible, isMobile }: AutocompleteHintProps) {
  if (!visible) return null;

  return (
    <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
      {isMobile ? (
        <>
          <ArrowElbowDownLeftIcon size={12} weight="regular" />
          <span>Enter para completar</span>
        </>
      ) : (
        <>
          <kbd className="inline-flex items-center rounded border border-border px-1 font-mono text-xs">
            Tab
          </kbd>
          <span>para completar</span>
        </>
      )}
    </div>
  );
}
