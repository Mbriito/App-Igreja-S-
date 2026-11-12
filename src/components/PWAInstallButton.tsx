import React, { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Download, X, Smartphone, Plus, Share2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // If already installed or manually dismissed, don't show the banner
  if (isInstalled || isDismissed) return null;

  // Banner visual for Android / Desktop (Installable)
  if (isInstallable) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 rounded-[2.5rem] border border-white/10 p-6 shadow-2xl mb-8"
      >
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Sparkles className="w-24 h-24 text-[#df982a]" />
        </div>

        <button 
          onClick={() => setIsDismissed(true)}
          className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-2xl">
            <Smartphone className="w-8 h-8 text-[#df982a]" />
          </div>
          
          <div className="flex-1 text-center sm:text-left space-y-1">
            <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none">Instalar Aplicativo</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Acesse a Vila Sé com um toque</p>
          </div>

          <button
            onClick={install}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-[#df982a] text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] shadow-[0_15px_30px_rgba(223,152,42,0.3)] hover:bg-orange-600 transition-all active:scale-95 border-b-4 border-orange-700/50"
          >
            <Download className="w-4 h-4" />
            Instalar Agora
          </button>
        </div>
      </motion.div>
    );
  }

  // iOS Safari Flow
  if (isIOS) {
    return (
      <>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 rounded-[2.5rem] border border-white/10 p-6 shadow-2xl mb-8"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Smartphone className="w-24 h-24 text-[#df982a]" />
          </div>

          <button 
            onClick={() => setIsDismissed(true)}
            className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-2xl">
              <Smartphone className="w-8 h-8 text-[#df982a]" />
            </div>
            
            <div className="flex-1 text-center sm:text-left space-y-1">
              <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none">Vila Sé no seu iPhone</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Transforme este site em app</p>
            </div>

            <button
              onClick={() => setShowIOSGuide(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-[#df982a] text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] shadow-[0_15px_30px_rgba(223,152,42,0.3)] hover:bg-orange-600 transition-all active:scale-95 border-b-4 border-orange-700/50"
            >
              <Plus className="w-4 h-4" />
              Como Instalar
            </button>
          </div>
        </motion.div>

        <AnimatePresence>
          {showIOSGuide && (
            <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 bg-slate-950/80 backdrop-blur-xl">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="relative w-full max-w-md bg-slate-900 rounded-[3rem] border border-white/10 p-10 shadow-[0_30px_100px_rgba(0,0,0,0.8)]"
              >
                <div className="flex justify-between items-center mb-10">
                  <div className="space-y-1">
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Instalar no iOS</h3>
                    <p className="text-[10px] text-[#df982a] font-black uppercase tracking-[0.3em]">Siga os passos abaixo</p>
                  </div>
                  <button 
                    onClick={() => setShowIOSGuide(false)} 
                    className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-slate-500 hover:text-white transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-8 mb-10">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#df982a] border border-white/10 flex-shrink-0">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-white uppercase">Passo 1</p>
                      <p className="text-xs text-slate-400 font-medium">Toque no botão de <strong>Compartilhar</strong> na barra inferior do Safari.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#df982a] border border-white/10 flex-shrink-0">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-white uppercase">Passo 2</p>
                      <p className="text-xs text-slate-400 font-medium">Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#df982a] border border-white/10 flex-shrink-0">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-white uppercase">Passo 3</p>
                      <p className="text-xs text-slate-400 font-medium">Toque em <strong>Adicionar</strong> no canto superior direito e pronto!</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="w-full py-5 bg-white/5 text-white font-black uppercase tracking-[0.2em] rounded-2xl border border-white/10 hover:bg-white/10 transition-all active:scale-95"
                >
                  Entendi, vou instalar
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return null;
};
