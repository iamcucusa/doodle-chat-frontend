import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeConfig } from '@config/env.ts';
import '@styles/tokens.css';
import '@styles/base.css';
import App from './App.tsx';

/**
 * This ensures we fail fast if the configuration is invalid (e.g., missing env vars)
 */
initializeConfig();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
