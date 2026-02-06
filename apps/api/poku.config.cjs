const { defineConfig } = require("poku");

module.exports = defineConfig({
  include: "./src",
  filter: /\.(test.|.spec)\./,
  concurrency: 0,
});
