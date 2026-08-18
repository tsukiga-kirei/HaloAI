import { defineConfig } from "tsup";

export default defineConfig({
  external: ["pino"],
  noExternal: [/^@haloai\//u],
});
