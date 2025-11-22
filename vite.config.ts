import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Define process.env as an empty object so accessing process.env.API_KEY returns undefined
    // without crashing the app in the browser.
    'process.env': {}
  },
  build: {
    // Disable sourcemaps in production to prevent users from viewing the original source code
    sourcemap: false,
    // Ensure code is minified
    minify: true,
    outDir: 'dist'
  }
})