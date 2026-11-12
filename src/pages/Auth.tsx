import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { LogIn, UserPlus, Mail, Lock, User, ArrowRight, Sparkles, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [view, setView] = useState<'login' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message === 'Email not confirmed' 
        ? 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada ou peça ao admin para desabilitar a confirmação no Supabase.' 
        : error.message);
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
    }
    setLoading(false);
  };

  if (view === 'forgot') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl p-10 space-y-8 relative z-10"
        >
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/10 text-[#df982a] border border-orange-500/20">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Esqueci a Senha</h2>
            <p className="text-sm text-slate-400 font-medium">Digite seu e-mail para receber as instruções de recuperação.</p>
          </div>

          {resetSent ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
              <p className="text-emerald-400 text-sm font-bold uppercase tracking-widest">Link enviado!</p>
              <p className="text-emerald-500/70 text-xs">Verifique sua caixa de entrada para redefinir sua senha.</p>
              <button 
                onClick={() => setView('login')}
                className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
              >
                Voltar ao Login
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleForgotPassword}>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">E-mail de Cadastro</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-[#df982a] outline-none text-sm font-bold text-white transition-all"
                    placeholder="exemplo@email.com"
                  />
                </div>
              </div>

              {error && <p className="text-rose-500 text-xs font-bold text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-[#df982a] text-slate-950 font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar Link'}
              </button>

              <button 
                type="button"
                onClick={() => setView('login')}
                className="w-full text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
              >
                Voltar
              </button>
            </form>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6 relative overflow-hidden">
      {/* Premium background effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-orange-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-slate-800/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-slate-900/50 backdrop-blur-2xl rounded-[3rem] shadow-2xl p-10 space-y-10 relative z-10 border border-white/10"
      >
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2.5rem] bg-slate-950 text-white shadow-2xl relative overflow-hidden group border border-white/5">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#df982a] to-orange-400 opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
            <LogIn className="w-10 h-10 relative z-10 text-[#df982a]" />
          </div>
          <div className="space-y-3">
            <div className="flex flex-col items-center gap-4">
              <div className="h-14 w-14 overflow-hidden rounded-2xl bg-slate-950 p-2 border border-white/10 shadow-lg">
                <img 
                  src="/assets/aistudio/SE_Logotipo__a4729038.png" 
                  alt="Logo" 
                  className="h-full w-full object-contain"
                />
              </div>
              <h2 className="text-4xl font-black text-white tracking-tight uppercase">Bem-vindo</h2>
            </div>
            <p className="text-[10px] text-[#df982a] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-2">
              <Sparkles className="w-3 h-3" />
              A Igreja da Vila - SÉ
            </p>
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-rose-500 text-[10px] leading-tight font-black uppercase tracking-widest text-center"
          >
            {error}
          </motion.div>
        )}

        <form className="space-y-6" onSubmit={handleLogin}>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Seu E-mail</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#df982a] transition-colors" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-5 py-5 bg-white/5 border border-white/10 rounded-[1.5rem] focus:ring-2 focus:ring-orange-500/10 focus:border-[#df982a] focus:bg-white/10 transition-all outline-none text-sm font-bold text-white placeholder-slate-600"
                placeholder="exemplo@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Sua Senha</label>
              <button 
                type="button"
                onClick={() => setView('forgot')}
                className="text-[10px] font-black text-[#df982a] uppercase tracking-widest hover:underline"
              >
                Esqueci a senha
              </button>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#df982a] transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-5 bg-white/5 border border-white/10 rounded-[1.5rem] focus:ring-2 focus:ring-orange-500/10 focus:border-[#df982a] focus:bg-white/10 transition-all outline-none text-sm font-bold text-white placeholder-slate-600"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#df982a] transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-[#df982a] hover:bg-orange-600 text-slate-950 font-black uppercase tracking-[0.25em] rounded-2xl shadow-xl shadow-orange-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group mt-4"
          >
            {loading ? (
              <div className="w-6 h-6 border-4 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Acessar Conta <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-slate-500 text-sm font-bold">
            Não tem uma conta?{' '}
            <Link to="/registro" className="text-[#df982a] font-black hover:underline underline-offset-4 uppercase tracking-widest text-xs">
              Criar agora
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      if (data.session) {
        navigate('/');
      } else {
        setRegistered(true);
        setLoading(false);
      }
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl rounded-[3rem] border border-white/10 shadow-2xl p-10 text-center space-y-8"
        >
          <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-[2rem] border border-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckCircle className="w-12 h-12" />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">Cadastro Realizado!</h2>
            <p className="text-sm text-slate-400 font-medium leading-relaxed">
              Se a confirmação de e-mail estiver ativa, verifique sua caixa de entrada. 
              Caso contrário, você já pode fazer login.
            </p>
          </div>
          
          <div className="bg-orange-500/10 border border-orange-500/20 p-5 rounded-3xl text-left">
            <p className="text-[10px] font-black text-[#df982a] uppercase tracking-widest mb-1.5 flex items-center gap-2">
              <Sparkles className="w-3 h-3" /> Dica para o Admin:
            </p>
            <p className="text-[10px] text-orange-200/60 leading-relaxed font-bold">
              Para evitar erros 404 e facilitar o acesso, desabilite <strong>"Confirm Email"</strong> em 
              {" Authentication > Providers > Email "} no painel do Supabase.
            </p>
          </div>
          
          <Link 
            to="/login"
            className="block w-full py-5 bg-[#df982a] text-slate-950 font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-orange-500/20"
          >
            Ir para Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-slate-800/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900/50 backdrop-blur-2xl rounded-[3rem] shadow-2xl p-10 space-y-8 relative z-10 border border-white/10"
      >
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-[#df982a] text-slate-950 shadow-2xl border border-orange-400 group">
            <UserPlus className="w-10 h-10 group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="space-y-2">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 overflow-hidden rounded-xl bg-slate-950 p-1.5 border border-white/10">
                <img 
                  src="/assets/aistudio/SE_Logotipo__a4729038.png" 
                  alt="Logo" 
                  className="h-full w-full object-contain"
                />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight uppercase">Criar Conta</h2>
            </div>
            <p className="text-[10px] text-[#df982a] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2">
              <Sparkles className="w-3 h-3" />
              Faça parte da Vila
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-rose-500 text-[10px] font-black uppercase tracking-widest text-center">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleRegister}>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Nome Completo</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#df982a] transition-colors" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-12 pr-5 py-4 bg-white/5 border border-white/10 rounded-[1.5rem] focus:ring-2 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white placeholder-slate-600 transition-all"
                placeholder="Seu Nome"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Seu E-mail</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#df982a] transition-colors" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-5 py-4 bg-white/5 border border-white/10 rounded-[1.5rem] focus:ring-2 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white placeholder-slate-600 transition-all"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Escolha uma Senha</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#df982a] transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-[1.5rem] focus:ring-2 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white placeholder-slate-600 transition-all"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#df982a] transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-[#df982a] hover:bg-orange-600 text-slate-950 font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-orange-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group mt-4"
          >
            {loading ? (
              <div className="w-6 h-6 border-4 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Cadastrar Agora <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" /></>
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-slate-500 text-sm font-bold">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-white font-black hover:underline underline-offset-4 uppercase tracking-widest text-xs">
              Fazer login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6 relative overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl rounded-[3rem] border border-white/10 shadow-2xl p-10 space-y-8 relative z-10"
      >
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/10 text-[#df982a] border border-orange-500/20">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Nova Senha</h2>
          <p className="text-sm text-slate-400 font-medium">Digite sua nova senha de acesso.</p>
        </div>

        {success ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
            <p className="text-emerald-400 text-sm font-bold uppercase tracking-widest">Senha redefinida!</p>
            <p className="text-emerald-500/70 text-xs">Você será redirecionado para o login em instantes.</p>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleReset}>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nova Senha</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#df982a] transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-[#df982a] outline-none text-sm font-bold text-white placeholder-slate-600 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#df982a] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && <p className="text-rose-500 text-xs font-bold text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-[#df982a] text-slate-950 font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Atualizando...' : 'Redefinir Senha'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
