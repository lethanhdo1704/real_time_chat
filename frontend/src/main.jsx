// frontend/src/main.jsx
import { createRoot } from 'react-dom/client'
import './user/styles/index.css'
import App from './App.jsx'
import "./user/i18n";

createRoot(document.getElementById('root')).render(
    <App />
)
