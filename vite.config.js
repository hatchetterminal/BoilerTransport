import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    esbuild: {
      jsx: 'automatic',
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: env.VITE_BASE44_APP_BASE_URL
        ? {
            '/api': {
              target: env.VITE_BASE44_APP_BASE_URL,
              changeOrigin: true,
            },
          }
        : undefined,
    },
  }
});
