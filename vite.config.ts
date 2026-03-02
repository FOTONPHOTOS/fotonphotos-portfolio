import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // FAIL THE BUILD if keys are missing
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    console.error('\n❌ BUILD FAILED: Supabase Environment Variables are missing!\n');
    console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in Vercel.\n');
    process.exit(1);
  }

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': 'http://localhost:3001'
      }
    }
  };
});
