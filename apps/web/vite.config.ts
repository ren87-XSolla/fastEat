import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    strictPort: true,
    proxy: { '/graphql': process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:4000' },
  },
});
