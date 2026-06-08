import React, { useState } from 'react';
import { supabase } from '../supabase';
import { LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

export const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email] = useState('alefyrezende@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro durante a autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="bg-white px-6 py-8 text-center flex flex-col items-center border-b border-gray-100">
          {!logoError ? (
            <img 
              src="/logo.webp" 
              alt="Replanner" 
              className="h-24 object-contain mb-3 w-[90%] max-w-[260px]"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="flex flex-col items-center w-full mb-3">
              <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-white shadow-sm border border-gray-100">
                <img src="/favicon.png" alt="Icon" className="w-10 h-10 object-contain" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Replanner</h2>
            </div>
          )}
          <p className="text-gray-500 text-sm font-medium">Deus conduz nossos projetos.</p>
        </div>
        
        <form onSubmit={handleAuth} className="p-6 md:p-8">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
          {message && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm">{message}</div>}
          
          <div className="space-y-4">
            {/* O email agora é fixo e invisível no form para simplificar o login de usuário único */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-xl transition-colors mt-2 disabled:opacity-70"
            >
              {loading ? 'Aguarde...' : 'Entrar'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
