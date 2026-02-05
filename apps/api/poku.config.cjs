const { defineConfig } = require("poku");

module.exports = defineConfig({
  include: "./src",
  envFile: "./.env",
  filter: /\.(test.|.spec)\./,
  concurrency: 0,
});
