import type { JourneyStatusResponseData } from "@/dal/orval/fetch/schemas/journeyStatusResponseData";

interface JourneyProgressSectionProps {
  journey: JourneyStatusResponseData;
}

export function JourneyProgressSection({
  journey,
}: JourneyProgressSectionProps) {
  const stats = [
    { value: journey.chaptersRead, label: "Cap. lidos" },
    { value: journey.chaptersRemaining, label: "Cap. restantes" },
    { value: `${journey.percentComplete}%`, label: "Progresso" },
  ] as const;

  return (
    <section className="px-6 pb-6" aria-label="Progresso da Jornada">
      <h2 className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-3">
        Jornada
      </h2>

      <div className="bg-muted/50 rounded-2xl px-5 py-4 max-w-sm">
        <div className="grid grid-cols-3 gap-2 mb-5">
          {stats.map(({ value, label }) => (
            <div
              key={label}
              className="journey-stat flex flex-col items-center gap-1.5 text-center"
            >
              <span className="text-2xl font-semibold tabular-nums leading-none">
                {value}
              </span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        {journey.isAtEnd ? (
          <div className="flex items-center justify-center py-1">
            <span className="text-xs text-muted-foreground tracking-wide">
              Jornada concluída
            </span>
          </div>
        ) : (
          <div
            role="progressbar"
            aria-valuenow={journey.percentComplete}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progresso geral da jornada"
            className="h-1 rounded-full bg-muted overflow-hidden"
          >
            <div className="progress-fill h-full rounded-full bg-foreground" />
          </div>
        )}
      </div>
    </section>
  );
}
