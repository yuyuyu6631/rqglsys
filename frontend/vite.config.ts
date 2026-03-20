import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const backendPort = Number(process.env.BACKEND_PORT || '5010')
const frontendPort = Number(process.env.PORT || '5173')

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        host: '127.0.0.1',
        port: frontendPort,
        proxy: {
            '/api': {
                target: `http://127.0.0.1:${backendPort}`,
                changeOrigin: true,
            },
            '/uploads': {
                target: `http://127.0.0.1:${backendPort}`,
                changeOrigin: true,
            }
        }
    }
})
