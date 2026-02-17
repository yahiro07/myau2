import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
// import mkcert from "vite-plugin-mkcert";
import tsconfigPaths from "vite-tsconfig-paths";

const configs = {
  useDevServerHttps: false,
  devServerPort: 3000,
};
// if (1) {
//   //AudioWorkletを使用し、スマホなどLAN内でアクセスする場合はhttpsにする
//   configs.useDevServerHttps = true;
//   configs.devServerPort = 3002;
// }

export default defineConfig({
  appType: "mpa",
  plugins: [
    tailwindcss(),
    react(),
    tsconfigPaths(),
    // configs.useDevServerHttps && mkcert(),
  ],
  build: {
    outDir: "./www",
  },
  // base: "./",
  server: {
    port: configs.devServerPort,
    host: "0.0.0.0",
  },
});
