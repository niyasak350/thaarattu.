import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Requests starting with /api are forwarded to the Node server on port 5000
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:5000' } },
});
