import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, Calendar, Heart, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { clsx } from 'clsx';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { motion } from 'framer-motion';

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
    <div className="min-h-screen bg-[#020617] flex flex-col font-sans selection:bg-orange-500/30 selection:text-white pb-40">
      {/* Premium Sticky Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl px-4 py-3.5 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 overflow-hidden flex items-center justify-center bg-slate-900 rounded-xl p-1.5 shadow-lg shadow-black/20 group border border-white/10">
            <img 
              src="/assets/aistudio/SE_Logotipo__a4729038.png" 
              alt="Logo Igreja da Vila" 
              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-[#df982a] uppercase tracking-[0.3em] leading-none mb-0.5">Comunidade</span>
            <span className="text-base font-black text-white tracking-tighter leading-none uppercase">SÉ</span>
          </div>
        </div>
        
        <NavLink to="/perfil" className="group">
          <div className="w-11 h-11 rounded-2xl border border-white/10 bg-slate-900 p-0.5 transition-all duration-300 group-hover:scale-105 active:scale-95 group-hover:border-[#df982a] shadow-sm">
            <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center text-white font-black text-sm uppercase shadow-lg overflow-hidden">
              <span className="relative z-10">{profile?.full_name?.charAt(0) || 'U'}</span>
              <div className="absolute inset-0 bg-gradient-to-tr from-[#df982a] to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </div>
        </NavLink>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 animate-in fade-in duration-700">
        <OfflineIndicator />
        <div className="min-h-screen">
          <Outlet />
        </div>
        
        {/* Modern Footer Info */}
        <footer className="mt-20 mb-10 py-10 border-t border-white/5 flex flex-col items-center text-center space-y-6">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Contato da Igreja</p>
            <a 
              href="mailto:secretaria@aigrejadavila-se.online" 
              className="text-sm font-black text-white hover:text-[#df982a] transition-all bg-white/5 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 block"
            >
              secretaria@aigrejadavila-se.online
            </a>
          </div>
          
          <div className="pt-6 border-t border-white/5 w-full">
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.4em] mb-1.5">Ecossistema Digital</p>
            <p className="text-xs font-black text-slate-500/80">Gratech Solucoes de Ti</p>
          </div>
        </footer>
      </main>

      {/* Floating Bottom Navigation - Highly Responsive */}
      <nav className="fixed bottom-6 left-6 right-6 z-50 h-18 bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] safe-area-bottom overflow-hidden">
        <div className="flex h-full items-center justify-around px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    "relative flex flex-col items-center justify-center gap-1.5 transition-all duration-500 px-4 min-w-[64px]",
                    isActive ? "text-[#df982a] scale-110" : "text-slate-500 hover:text-white"
                  )
                }
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white/5 rounded-2xl -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon className={clsx("w-5 h-5 transition-transform duration-300", isActive ? "stroke-[2.5px] -translate-y-0.5" : "stroke-[2px]")} />
                <span className={clsx(
                  "text-[8px] font-black uppercase tracking-[0.15em] leading-none transition-all duration-300",
                  isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute -top-1 w-1 h-1 bg-[#df982a] rounded-full shadow-[0_0_12px_#df982a]" />
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

