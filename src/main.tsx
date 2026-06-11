import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { supabase } from './supabase';

// Solução silenciosa: Força a renovação do token de trás dos panos.
// Isso pega o token gigante corrompido, joga fora, e pede um novo limpo pro Supabase
// SEM deslogar você!
supabase.auth.refreshSession().then(() => {
  console.log("Sessão atualizada silenciosamente!");
}).catch(e => console.error("Erro na renovação", e));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
