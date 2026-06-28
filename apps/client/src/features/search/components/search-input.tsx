"use client";

import type { Ref } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useBibleSearch } from "../hooks/use-bible-search";
import { AutocompleteHint } from "./autocomplete-hint";
import { SuggestionList } from "./suggestion-list";

interface SearchInputProps {
  placeholder?: string;
  className?: string;
  ref?: Ref<HTMLInputElement>;
}

const LISTBOX_ID = "bible-search-suggestions";

export function SearchInput({ placeholder, className, ref }: SearchInputProps) {
  const {
    inputValue,
    onInputChange,
    suggestions,
    activeSuggestion,
    matchedPart,
    onKeyDown,
    isLoadingVerses,
    completeWith,
    onHoverSuggestion,
    isMobile,
  } = useBibleSearch();

  const showList = suggestions.length > 0 || isLoadingVerses;
  const activeDescendant =
    activeSuggestion >= 0
      ? `${LISTBOX_ID}-option-${activeSuggestion}`
      : undefined;

  return (
    <div className="relative w-full">
      <Input
        ref={ref}
        value={inputValue}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={cn("h-15 font-instrument-sans p-5 text-xl!", className)}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={LISTBOX_ID}
        aria-activedescendant={activeDescendant}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
      />
      <SuggestionList
        id={LISTBOX_ID}
        suggestions={suggestions}
        activeSuggestion={activeSuggestion}
        matchedPart={matchedPart}
        isLoading={isLoadingVerses}
        onSelect={completeWith}
        onActiveChange={onHoverSuggestion}
      />
      <AutocompleteHint
        visible={showList && !isLoadingVerses}
        isMobile={isMobile}
      />
    </div>
  );
}
