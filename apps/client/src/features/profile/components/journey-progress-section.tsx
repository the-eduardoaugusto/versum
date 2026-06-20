import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { JourneyStatusResponseData } from "@/dal/orval/fetch/schemas/journeyStatusResponseData";

interface JourneyProgressSectionProps {
  journey: JourneyStatusResponseData;
}

export function JourneyProgressSection({
  journey,
}: JourneyProgressSectionProps) {
  const stats = [
    { value: journey.chaptersRead, label: "Lidos" },
    { value: journey.chaptersRemaining, label: "Restantes" },
    { value: `${journey.percentComplete}%`, label: "Progresso" },
  ] as const;

  return (
    <section className="px-6 pb-6 max-w-" aria-label="Progresso da Jornada">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest shrink-0">
          Jornada
        </h2>
        <Separator className="flex-1" />
      </div>

      <Card>
        <CardContent className="pt-5 pb-5">
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
        </CardContent>
      </Card>
    </section>
  );
}
