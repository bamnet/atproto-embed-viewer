import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '127.0.0.1',  // OAuth loopback requires 127.0.0.1 or [::1], not localhost.
  }
})
