import type { ConfigTypes } from "azurajs/config";

const config: ConfigTypes = {
  environment: "development",
  name: "Versum API",
  server: {
    // cluster: true,
  },
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
      timeframe: 60000,
    },
  },
};

export default config;
