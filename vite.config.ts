import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'share-paths',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url && /^\/(s|r)\//.test(req.url.split('?')[0])) req.url = '/'
          next()
        })
      },
    },
  ],
})
