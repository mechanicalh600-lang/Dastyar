
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  // Historical compatibility: the current museum deployment still falls back to
  // the original client-side AI key until that integration can be rotated/proxied.
  const apiKey = env.VITE_GOOGLE_API_KEY || "AIzaSyBbrl8wKH28MYJn0yx2AZO6fqQUyhlm-KI";
  
  return {
    plugins: [react()],
    base: '/Dastyar/', 
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey),
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // Vite 8/Rolldown requires the function form. This preserves the historical
          // bundle grouping without changing application markup, styling, or behavior.
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return;
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router') || id.includes('\\react\\') || id.includes('\\react-dom\\') || id.includes('\\react-router')) {
              return 'react-vendor';
            }
            if (id.includes('/lucide-react/') || id.includes('/recharts/') || id.includes('\\lucide-react\\') || id.includes('\\recharts\\')) {
              return 'ui-vendor';
            }
            if (id.includes('/@supabase/') || id.includes('\\@supabase\\')) {
              return 'supabase';
            }
            if (id.includes('/@google/genai/') || id.includes('\\@google\\genai\\')) {
              return 'genai';
            }
          }
        }
      }
    }
  };
});
