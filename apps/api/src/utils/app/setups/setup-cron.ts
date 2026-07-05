import { logger } from "@versum/logger";
import { PurgeService } from "../../../modules/auth/services/purge.service.ts";
import { env } from "../../env/parser.ts";

export class SetupCron {
  constructor() {
    if (env.CRON_ENABLED !== "true") {
      logger("info", "[CRON] Desabilitado via CRON_ENABLED env var");
      return;
    }
    this.setupDailyPurge();
  }

  private setupDailyPurge() {
    const runPurge = async () => {
      logger("info", "[CRON] Executando purge diário...");
      try {
        const service = new PurgeService();
        const result = await service.runDailyPurge();
        logger(
          { level: "info", icon: "🧹" },
          `[PURGE] Magic links: ${result.magicLinks} deletados, Sessões: ${result.sessions} deletadas`,
        );
      } catch (error) {
        logger(
          "error",
          `[PURGE] Falha ao executar purge: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    };

    const msUntilNext3amUtc = (): number => {
      const now = new Date();
      const next = new Date();
      next.setUTCHours(3, 0, 0, 0);
      if (next.getTime() <= now.getTime()) {
        next.setUTCDate(next.getUTCDate() + 1);
      }
      return next.getTime() - now.getTime();
    };

    const scheduleNext = () => {
      const delay = msUntilNext3amUtc();
      logger(
        "info",
        `[CRON] Próximo purge em ${Math.round(delay / 1000 / 60)} minutos`,
      );
      setTimeout(() => {
        runPurge();
        setInterval(runPurge, 24 * 60 * 60 * 1000);
      }, delay);
    };

    scheduleNext();
    logger("info", "[CRON] Purge job registrado — 03:00 diário");
  }
}
