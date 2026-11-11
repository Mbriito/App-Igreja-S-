import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, Calendar, Heart, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { clsx } from 'clsx';
import { OfflineIndicator } from '@/components/OfflineIndicator';

export const Layout: React.FC = () => {
  const { profile } = useAuth();
  const location = useLocation();

  const navItems = [
    { to: '/', icon: Home, label: 'Mural' },
    { to: '/escalas', icon: Calendar, label: 'Escalas' },
    { to: '/oracao', icon: Heart, label: 'Oração' },
    { to: '/perfil', icon: User, label: 'Perfil' },
  ];

  if (profile?.role === 'admin') {
    navItems.push({ to: '/admin', icon: ShieldCheck, label: 'Admin' });
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/95 backdrop-blur-lg px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Logo container with the Anniversary banner */}
          <div className="h-12 w-12 overflow-hidden flex items-center justify-center bg-slate-900 rounded-xl p-1.5 shadow-inner group">
            <img 
              src="/assets/aistudio/SE_Logotipo__a4729038.png" 
              alt="Logo Igreja da Vila" 
              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-[#df982a] uppercase tracking-[0.3em] leading-none mb-0.5">Comunidade</span>
            <span className="text-sm font-black text-slate-900 tracking-tight leading-none uppercase">SÉ</span>
          </div>
        </div>
        
        <NavLink to="/perfil" className="group">
          <div className="w-11 h-11 rounded-2xl border border-orange-100 bg-orange-50/50 p-1 transition-all duration-300 group-hover:scale-105 active:scale-95 group-hover:border-[#df982a] shadow-sm">
            <div className="w-full h-full rounded-xl bg-[#df982a] flex items-center justify-center text-white font-black text-sm uppercase shadow-lg shadow-orange-200/50">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
          </div>
        </NavLink>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6">
        <OfflineIndicator />
        <Outlet />
        
        {/* Footer Info */}
        <footer className="mt-12 mb-20 py-8 border-t border-slate-100 flex flex-col items-center text-center space-y-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contato da Igreja</p>
            <a 
              href="mailto:secretaria@aigrejadavila-se.online" 
              className="text-sm font-bold text-slate-600 hover:text-[#df982a] transition-colors"
            >
              secretaria@aigrejadavila-se.online
            </a>
          </div>
          <div className="pt-4">
            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em]">Desenvolvido por</p>
            <p className="text-sm font-black text-slate-400">Gratech Solucoes de Ti</p>
          </div>
        </footer>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-6 left-6 right-6 z-50 h-16 bg-slate-900/90 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl shadow-slate-900/40 safe-area-bottom">
        <div className="flex h-full items-center justify-around px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    "relative flex flex-col items-center justify-center gap-1 transition-all duration-300 px-4",
                    isActive ? "text-[#df982a] scale-110" : "text-slate-500 hover:text-slate-300"
                  )
                }
              >
                {isActive && (
                  <div className="absolute -top-1 w-1 h-1 bg-[#df982a] rounded-full shadow-[0_0_8px_#df982a]" />
                )}
                <item.icon className={clsx("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
                <span className={clsx(
                  "text-[9px] font-black uppercase tracking-widest leading-none",
                  isActive ? "opacity-100" : "opacity-0 scale-50"
                )}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
