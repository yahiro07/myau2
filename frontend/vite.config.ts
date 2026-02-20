import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";
  return {
    appType: "mpa",
    plugins: [tailwindcss(), react(), tsconfigPaths()],
    build: {
      outDir: "./www_dev",
    },
    resolve: {
      alias: {
        "@core-bridge-dev": path.resolve(
          __dirname,
          isDev
            ? "src/bridge/core-bridge-dev.ts"
            : "src/bridge/core-bridge-dev-purged.ts",
        ),
      },
    },
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
  };
});
