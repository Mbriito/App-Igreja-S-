import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { LogIn, UserPlus, Mail, Lock, User, ArrowRight, Sparkles, CheckCircle, Eye, EyeOff } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 relative overflow-hidden">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 space-y-8 relative z-10 border border-white">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-50 text-[#df982a]">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Esqueci a Senha</h2>
            <p className="text-sm text-slate-500 font-medium">Digite seu e-mail para receber as instruções de recuperação.</p>
          </div>

          {resetSent ? (
            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
              <p className="text-emerald-800 text-sm font-bold">Link enviado!</p>
              <p className="text-emerald-600 text-xs">Verifique sua caixa de entrada para redefinir sua senha.</p>
              <button 
                onClick={() => setView('login')}
                className="w-full py-3 bg-white border border-emerald-200 text-emerald-700 rounded-xl text-xs font-black uppercase tracking-widest"
              >
                Voltar ao Login
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleForgotPassword}>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">E-mail de Cadastro</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-100 focus:border-[#df982a] outline-none text-sm font-medium"
                    placeholder="exemplo@email.com"
                  />
                </div>
              </div>

              {error && <p className="text-rose-500 text-xs font-bold text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar Link'}
              </button>

              <button 
                type="button"
                onClick={() => setView('login')}
                className="w-full text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-slate-600"
              >
                Voltar
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-100/30 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-200/50 rounded-full blur-[100px]" />

      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-10 space-y-10 relative z-10 border border-white">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-slate-900 text-white shadow-xl shadow-slate-200 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#df982a] to-orange-300 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <LogIn className="w-8 h-8 relative z-10" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-lg bg-slate-900 p-1 shadow-md">
                <img 
                  src="/assets/aistudio/SE_Logotipo__a4729038.png" 
                  alt="Logo" 
                  className="h-full w-full object-contain"
                />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Bem-vindo</h2>
            </div>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
              <Sparkles className="w-3 h-3 text-[#df982a]" />
              A Igreja da Vila - SÉ
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-rose-600 text-[10px] leading-tight font-bold animate-in shake duration-500">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleLogin}>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Seu E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-[1.25rem] focus:ring-2 focus:ring-orange-100 focus:border-[#df982a] focus:bg-white transition-all outline-none text-sm font-medium"
                placeholder="exemplo@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sua Senha</label>
              <button 
                type="button"
                onClick={() => setView('forgot')}
                className="text-[10px] font-black text-[#df982a] uppercase tracking-widest hover:underline"
              >
                Esqueci a senha
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-[1.25rem] focus:ring-2 focus:ring-orange-100 focus:border-[#df982a] focus:bg-white transition-all outline-none text-sm font-medium"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Acessar Conta <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-slate-400 text-sm font-medium">
            Não tem uma conta?{' '}
            <Link to="/registro" className="text-[#df982a] font-black hover:underline underline-offset-4">
              Criar agora
            </Link>
          </p>
        </div>
      </div>
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
      // Se o usuário já tiver uma sessão, significa que a confirmação está desabilitada
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Cadastro Realizado!</h2>
          <p className="text-sm text-slate-500 font-medium">
            Se a confirmação de e-mail estiver ativa, verifique sua caixa de entrada. 
            Caso contrário, você já pode fazer login.
          </p>
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl text-left">
            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">Dica para o Admin:</p>
            <p className="text-[10px] text-amber-600 leading-tight">
              Para evitar erros 404 e facilitar o acesso, desabilite <strong>"Confirm Email"</strong> em 
              {" Authentication > Providers > Email "} no painel do Supabase.
            </p>
          </div>
          <Link 
            to="/login"
            className="block w-full py-4 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl"
          >
            Ir para Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-100/30 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-slate-200/50 rounded-full blur-[100px]" />

      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-10 space-y-10 relative z-10 border border-white">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-[#df982a] text-white shadow-xl shadow-orange-100 group">
            <UserPlus className="w-8 h-8 group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-lg bg-slate-900 p-1 shadow-md">
                <img 
                  src="/assets/aistudio/SE_Logotipo__a4729038.png" 
                  alt="Logo" 
                  className="h-full w-full object-contain"
                />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Criar Conta</h2>
            </div>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
              <Sparkles className="w-3 h-3 text-[#df982a]" />
              Faça parte da Vila
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-rose-600 text-xs font-bold animate-in shake duration-500">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleRegister}>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-[1.25rem] focus:ring-2 focus:ring-orange-100 focus:border-[#df982a] transition-all outline-none text-sm font-medium"
                placeholder="Seu Nome"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Seu E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-[1.25rem] focus:ring-2 focus:ring-orange-100 focus:border-[#df982a] transition-all outline-none text-sm font-medium"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Escolha uma Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-[1.25rem] focus:ring-2 focus:ring-orange-100 focus:border-[#df982a] transition-all outline-none text-sm font-medium"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-[#df982a] hover:bg-orange-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-orange-100 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group mt-4"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Cadastrar Agora <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" /></>
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-slate-400 text-sm font-medium">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-slate-900 font-black hover:underline underline-offset-4">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 relative overflow-hidden">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 space-y-8 relative z-10 border border-white">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-50 text-[#df982a]">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Nova Senha</h2>
          <p className="text-sm text-slate-500 font-medium">Digite sua nova senha de acesso.</p>
        </div>

        {success ? (
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
            <p className="text-emerald-800 text-sm font-bold">Senha redefinida!</p>
            <p className="text-emerald-600 text-xs">Você será redirecionado para o login em instantes.</p>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleReset}>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nova Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-100 focus:border-[#df982a] outline-none text-sm font-medium"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-rose-500 text-xs font-bold text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-[#df982a] text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-orange-100 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Atualizando...' : 'Redefinir Senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
