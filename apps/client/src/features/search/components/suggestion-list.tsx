import { Skeleton } from "@/components/ui/skeleton";
import type { Suggestion } from "../types";
import { SuggestionItem } from "./suggestion-item";

interface SuggestionListProps {
  id: string;
  suggestions: Suggestion[];
  activeSuggestion: number;
  matchedPart: string;
  isLoading: boolean;
  onSelect: (suggestion: Suggestion) => void;
  onActiveChange: (index: number) => void;
}

export function SuggestionList({
  id,
  suggestions,
  activeSuggestion,
  matchedPart,
  isLoading,
  onSelect,
  onActiveChange,
}: SuggestionListProps) {
  if (!isLoading && suggestions.length === 0) return null;

  return (
    <div
      id={id}
      role="listbox"
      className="absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden rounded-lg border border-border bg-background shadow-md"
    >
      {isLoading
        ? (["sk-a", "sk-b", "sk-c"] as const).map((key) => (
            <div key={key} className="px-4 py-2.5">
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))
        : suggestions.map((suggestion, index) => (
            <SuggestionItem
              key={suggestion.value}
              id={`${id}-option-${index}`}
              label={suggestion.label}
              matchedPart={matchedPart}
              isActive={index === activeSuggestion}
              onSelect={() => onSelect(suggestion)}
              onMouseEnter={() => onActiveChange(index)}
            />
          ))}
    </div>
  );
}
