import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { supabase } from './supabase';

// Sistema de Auto-Recuperação: Se o token ficar gigante (causando o erro 520), limpa e desloga na hora!
const token = localStorage.getItem('sb-nzlqolllmruntddyommw-auth-token');
if (token && token.length > 8000) {
  console.error("Token corrompido detectado! Limpando a sessão para recuperar o app...");
  localStorage.removeItem('sb-nzlqolllmruntddyommw-auth-token');
  localStorage.clear();
  sessionStorage.clear();
  supabase.auth.signOut().then(() => {
    window.location.reload();
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
