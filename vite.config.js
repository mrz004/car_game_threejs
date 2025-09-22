import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// Configure base path for GitHub Pages project site
// Production builds will be served from https://mrz004.github.io/car_game_threejs/
// so we use "/car_game_threejs/" as base. In dev, keep base as "/".
export default defineConfig(({ mode }) => ({
    base: mode === "production" ? "/car_game_threejs/" : "/",
    plugins: [tailwindcss()],
}));
