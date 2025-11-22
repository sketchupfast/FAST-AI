import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Safely replace process.env.API_KEY with undefined for browser environments
    // We do not overwrite the entire process.env object to avoid breaking React (which needs process.env.NODE_ENV)
    'process.env.API_KEY': JSON.stringify(undefined)
  },
  build: {
    // Disable sourcemaps in production to prevent users from viewing the original source code
    sourcemap: false,
    // Ensure code is minified
    minify: true,
    outDir: 'dist'
  }
})