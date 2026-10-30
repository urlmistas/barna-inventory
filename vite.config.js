import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base relativa: funciona em qualquer nome de repositório no GitHub Pages
export default defineConfig({ base: './', plugins: [react()] })
