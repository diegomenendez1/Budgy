import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // Esto asegura que process.env.API_KEY funcione en el código del cliente
      // tomando el valor de las variables de entorno de Netlify durante el build
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});