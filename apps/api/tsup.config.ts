import path from "node:path";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  sourcemap: true,
  clean: true,
  dts: true,
  esbuildOptions(options) {
    options.alias = {
      "@": path.resolve(__dirname, "src"),
    };
  },
});
