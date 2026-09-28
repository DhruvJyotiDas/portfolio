import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import '@fontsource/space-grotesk/latin-400.css'
import '@fontsource/space-grotesk/latin-500.css'
import '@fontsource/space-grotesk/latin-600.css'
import '@fontsource/space-grotesk/latin-700.css'
import '@fontsource/jetbrains-mono/latin-400.css'
import './styles.css'
import App from './App'

const root = document.getElementById('root')!
if (root.querySelector('main')) hydrateRoot(root, <React.StrictMode><App /></React.StrictMode>)
else createRoot(root).render(<React.StrictMode><App /></React.StrictMode>)
