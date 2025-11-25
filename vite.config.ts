import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Disable sourcemaps in production to prevent users from viewing the original source code
    sourcemap: false,
    // Ensure code is minified
    minify: true,
    outDir: 'dist'
  }
})