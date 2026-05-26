import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [
//     react(),
//     babel({ presets: [reactCompilerPreset()] })
//   ],
// })

// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Whenever React tries to fetch '/api/...', forward it to the backend
      '/api': {
        target: 'http://localhost:5000', // CHANGE THIS to your actual backend port
        changeOrigin: true,
        secure: false,
      },
    },
  },
})