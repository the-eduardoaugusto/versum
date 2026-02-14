import path from "node:path";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  sourcemap: true,
  clean: true,
  dts: false,
  splitting: false,
  treeshake: false,
  bundle: true,
  ignoreWatch: ["**/*.html"],

  // Copia arquivos HTML para o dist
  async onSuccess() {
    const fs = await import("fs/promises");
    const sourceDir = path.resolve(__dirname, "src");
    const distDir = path.resolve(__dirname, "dist");

    // Encontra todos os arquivos .html recursivamente
    async function copyHtmlFiles(dir: string, baseDir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const sourcePath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await copyHtmlFiles(sourcePath, baseDir);
        } else if (entry.name.endsWith(".html")) {
          const relativePath = path.relative(baseDir, sourcePath);
          const destPath = path.join(distDir, relativePath);

          // Cria o diretório de destino se não existir
          await fs.mkdir(path.dirname(destPath), { recursive: true });

          // Copia o arquivo
          await fs.copyFile(sourcePath, destPath);
          console.log(`✓ Copiado: ${relativePath}`);
        }
      }
    }

    await copyHtmlFiles(sourceDir, sourceDir);
  },

  esbuildOptions(options) {
    options.alias = {
      "@": path.resolve(__dirname, "src"),
    };
  },
});
