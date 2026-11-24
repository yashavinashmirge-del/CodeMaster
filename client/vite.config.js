
//////////////////////////////////////////////////////
// vite.config.js
// ---------------------------------------------------
// Description : Configures Vite and Tailwind CSS
// Input       : Vite configuration
// Output      : Frontend development configuration
// Author      : Your Name
// Date        : 23/11/2026
//////////////////////////////////////////////////////

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// ---------------------------------------------------
// Vite Configuration
// ---------------------------------------------------

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
});
