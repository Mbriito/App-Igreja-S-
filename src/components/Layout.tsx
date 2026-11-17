import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Megaphone, Calendar, Heart, User, ShieldCheck, HandHeart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { clsx } from 'clsx';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { motion } from 'framer-motion';

export const Layout: React.FC = () => {
  const { profile } = useAuth();
  const location = useLocation();

  const navItems = [
    { to: '/', icon: Megaphone, label: 'Avisos' },
    { to: '/escalas', icon: Calendar, label: 'Escalas' },
    { to: '/ofertas', icon: HandHeart, label: 'Ofertas' },
    { to: '/oracao', icon: Heart, label: 'Oração' },
    { to: '/perfil', icon: User, label: 'Perfil' },
  ];

  if (profile?.role === 'admin') {
    navItems.push({ to: '/admin', icon: ShieldCheck, label: 'Admin' });
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#020617] flex flex-col font-sans selection:bg-orange-500/30 selection:text-white pb-36">
      {/* Premium Sticky Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#020617]/85 backdrop-blur-xl px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 shadow-2xl">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 flex-shrink-0 overflow-hidden flex items-center justify-center bg-slate-900 rounded-xl p-1.5 shadow-lg shadow-black/20 group border border-white/10">
            <img
              src="/assets/aistudio/SE_Logotipo__a4729038.png"
              alt="Logo Igreja da Vila Sé"
              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-black text-[#df982a] uppercase tracking-[0.25em] leading-none mb-1 truncate">
              Comunidade
            </span>
            <span className="text-sm sm:text-base font-black text-white tracking-tight leading-none uppercase truncate">
              Igreja da Vila Sé
            </span>
          </div>
        </div>

        <NavLink to="/perfil" className="group flex-shrink-0" aria-label="Ir para Perfil">
          <div className="w-11 h-11 rounded-2xl border border-white/10 bg-slate-900 p-0.5 transition-all duration-300 group-hover:scale-105 active:scale-95 group-hover:border-[#df982a] shadow-sm">
            <div className="relative w-full h-full rounded-xl bg-slate-950 flex items-center justify-center text-white font-black text-sm uppercase shadow-lg overflow-hidden">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || 'Perfil'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <span className="relative z-10">{profile?.full_name?.charAt(0) || 'U'}</span>
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#df982a] to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </>
              )}
            </div>
          </div>
        </NavLink>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-2xl min-w-0 mx-auto px-4 sm:px-6 py-6 overflow-hidden animate-in fade-in duration-700">
        <OfflineIndicator />
        <div className="min-h-screen w-full max-w-full min-w-0">
          <Outlet />
        </div>

        {/* Modern Footer Info */}
        <footer className="mt-16 mb-8 py-10 border-t border-white/5 flex flex-col items-center text-center space-y-6 w-full max-w-full">
          <div className="space-y-2 w-full max-w-full">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">
              Contato da Igreja
            </p>
            <a
              href="mailto:secretaria@aigrejadavila-se.online"
              className="text-xs sm:text-sm font-black text-white hover:text-[#df982a] transition-all bg-white/5 backdrop-blur-md px-4 sm:px-6 py-4 rounded-2xl border border-white/10 inline-block max-w-full break-all"
            >
              secretaria@aigrejadavila-se.online
            </a>
          </div>

          <div className="pt-6 border-t border-white/5 w-full">
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.4em] mb-1.5">
              Ecossistema Digital
            </p>
            <p className="text-xs font-black text-slate-500/80">Gratech Solucoes de Ti</p>
          </div>
        </footer>
      </main>

      {/* Floating Bottom Navigation - Fits 6 items cleanly from 320px+ */}
      <nav className="fixed bottom-4 sm:bottom-6 left-2 right-2 sm:left-6 sm:right-6 z-50 h-18 bg-slate-900/95 backdrop-blur-2xl rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] safe-area-bottom overflow-hidden max-w-2xl mx-auto">
        <div className="flex h-full items-center justify-between px-1 sm:px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'relative flex-1 min-w-0 flex flex-col items-center justify-center gap-1 transition-all duration-300 px-0.5 sm:px-2 py-2',
                    isActive ? 'text-[#df982a]' : 'text-slate-500 hover:text-white'
                  )
                }
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0.5 bg-white/5 rounded-2xl -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <item.icon
                  className={clsx(
                    'w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 flex-shrink-0',
                    isActive ? 'stroke-[2.5px] -translate-y-0.5' : 'stroke-[2px]'
                  )}
                />
                <span
                  className={clsx(
                    'text-[7px] sm:text-[8px] font-black uppercase tracking-[0.06em] sm:tracking-[0.14em] leading-none truncate max-w-full transition-all duration-300',
                    isActive ? 'opacity-100 text-[#df982a]' : 'opacity-70'
                  )}
                >
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute top-0.5 w-1 h-1 bg-[#df982a] rounded-full shadow-[0_0_10px_#df982a]" />
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
