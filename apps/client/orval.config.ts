import { defineConfig } from "orval";

const apiUrl = new URL(
  process.env.NEXT_PUBLIC_API_URL || "https://localhost:4002/",
);

const openApiUrl = new URL(apiUrl);
openApiUrl.pathname = "/openapi.json";

export default defineConfig({
  tanstackQuery: {
    input: openApiUrl.toString(),
    output: {
      mode: "tags-split",
      target: "./src/dal/orval/tanstackQuery/",
      schemas: "./src/dal/orval/tanstackQuery/schemas",
      client: "react-query",
      baseUrl: "/",
    },
  },
  fetch: {
    input: openApiUrl.toString(),
    output: {
      mode: "tags-split",
      target: "./src/dal/orval/fetch/",
      schemas: "./src/dal/orval/fetch/schemas",
      client: "fetch",
      baseUrl: apiUrl.toString(),
      override: {
        mutator: {
          path: "./src/lib/api-fetcher.ts",
          default: true,
        },
        fetch: {
          includeHttpResponseReturnType: false,
        },
      },
    },
  },
  zod: {
    input: openApiUrl.toString(),
    output: {
      baseUrl: apiUrl.toString(),
      mode: "tags-split",
      target: "./src/dal/orval/zod/",
      schemas: "./src/dal/orval/zod/schemas",
      client: "zod",
    },
  },
});
