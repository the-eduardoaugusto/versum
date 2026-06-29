import type { HTMLProps } from "react";
import { cn } from "@/lib/utils";

export function FormInput(props: HTMLProps<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm",
        "text-neutral-900 placeholder-neutral-400 outline-none ring-0",
        "transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10",
        "dark:border-neutral-700 dark:bg-neutral-800 dark:text-white",
        "dark:placeholder-neutral-500 dark:focus:border-white dark:focus:ring-white/10",
        props.className,
      )}
    />
  );
}
