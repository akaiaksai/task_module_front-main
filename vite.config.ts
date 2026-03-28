import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import svgr from 'vite-plugin-svgr';

const stripWrappingQuotes = (value: string) =>
  value.trim().replace(/^["']|["']$/g, '');

const trimTrailingSlashes = (value: string) => value.replace(/\/+$/g, '');

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, '');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = stripWrappingQuotes(env.VITE_BASE_PATH || '/');

  const apiBase = trimTrailingSlashes(
    stripWrappingQuotes(env.VITE_API_BASE || '')
  );
  const apiPrefix = trimSlashes(stripWrappingQuotes(env.VITE_API_PREFIX || ''));
  const proxy =
    apiBase && apiPrefix
      ? {
          [`/${apiPrefix}`]: {
            target: apiBase,
            changeOrigin: true,
          },
        }
      : undefined;

  return {
    base,
    plugins: [react(), svgr()],
    build: {
      sourcemap: true,
    },
    server: {
      port: 5173,
      proxy,
    },
    preview: { port: 5174 },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@logos': fileURLToPath(new URL('./src/assets/logos', import.meta.url)),
        '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
        '@components': fileURLToPath(
          new URL('./src/components', import.meta.url)
        ),
      },
    },
  };
});
