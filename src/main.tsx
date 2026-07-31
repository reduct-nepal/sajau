import { createRoot } from 'react-dom/client'
import App from './App.tsx'
// Self-hosted so html-to-image can inline it into exported PNGs.
import '@fontsource/inter/600.css'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);
