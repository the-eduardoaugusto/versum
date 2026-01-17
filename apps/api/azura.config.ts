import type { ConfigTypes } from "azurajs/config";

const environment = (
  process.env.NODE_ENV != "test" ? process.env.NODE_ENV : "development"
) as "production" | "development";

const config: ConfigTypes = {
  environment,
  logging: {
    enabled: true,
    showDetails: true,
  },
  plugins: {
    cors: {
      enabled: true,
      origins: ["*"],
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    rateLimit: {
      enabled: false,
      limit: 100,
      timeframe: 60000, // 1 minuto
    },
  },
};

export default config;
