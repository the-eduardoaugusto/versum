import { cn } from "@/lib/utils";
import { normalizeText } from "../utils/normalize-text";

interface SuggestionItemProps {
  id: string;
  label: string;
  matchedPart: string;
  isActive: boolean;
  onSelect: () => void;
  onMouseEnter: () => void;
}

function HighlightedLabel({
  label,
  matchedPart,
}: {
  label: string;
  matchedPart: string;
}) {
  if (!matchedPart) return <span>{label}</span>;

  const normLabel = normalizeText(label);
  const normPart = normalizeText(matchedPart);

  if (!normLabel.startsWith(normPart)) return <span>{label}</span>;

  const matchEnd = matchedPart.length;
  return (
    <>
      <strong className="font-semibold">{label.slice(0, matchEnd)}</strong>
      <span className="text-muted-foreground">{label.slice(matchEnd)}</span>
    </>
  );
}

export function SuggestionItem({
  id,
  label,
  matchedPart,
  isActive,
  onSelect,
  onMouseEnter,
}: SuggestionItemProps) {
  return (
    <div
      id={id}
      role="option"
      aria-selected={isActive}
      tabIndex={-1}
      className={cn(
        "cursor-pointer px-4 py-2.5 text-sm transition-colors",
        isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
      )}
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect();
      }}
      onMouseEnter={onMouseEnter}
    >
      <HighlightedLabel label={label} matchedPart={matchedPart} />
    </div>
  );
}
