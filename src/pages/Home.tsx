import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Megaphone, Calendar as CalendarIcon, Clock, ArrowRight, Share2, Sparkles, ChevronRight, Instagram } from 'lucide-react';
import { PWAInstallBanner } from '@/components/PWAInstallButton';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface Notice {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  event_date: string | null;
  is_event: boolean;
  created_at: string;
}

export const Home: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      const fetchedNotices = data || [];
      if (fetchedNotices.length === 0) {
        setNotices([
          {
            id: 'banner-10',
            title: '10 Anos de Fé e Propósito',
            content: 'Celebre conosco uma década de história, amor e serviço ao Reino na Igreja da Vila SÉ.',
            image_url: '/assets/aistudio/10_Anos_de_F__e_Prop_sito_2481fe78.png', 
            event_date: null,
            is_event: true,
            created_at: new Date().toISOString()
          },
          {
            id: 'culto-1',
            title: 'Dias de Culto',
            content: 'Quarta Profética às 19:50 e Domingo às 10:00. Venha adorar com a gente!',
            image_url: '/assets/aistudio/WhatsApp_Image_2026-11-10_at_11.30.04__1__a4e5f9f3.jpeg',
            event_date: null,
            is_event: true,
            created_at: new Date(Date.now() - 86400000).toISOString()
          }
        ]);
      } else {
        setNotices(fetchedNotices);
      }
    }
    setLoading(false);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 pb-20">
      <div className="flex flex-col gap-4">
        <PWAInstallBanner />
        <div className="flex items-center gap-3 mt-6">
          <div className="h-1.5 w-10 bg-[#df982a] rounded-full shadow-[0_0_15px_#df982a]"></div>
          <span className="text-[10px] font-black text-[#df982a] uppercase tracking-[0.4em]">Novidades da Vila</span>
        </div>
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-white tracking-tighter leading-none uppercase">Mural</h2>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Nossa comunidade unida</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-8">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 bg-slate-900/50 border border-white/5 rounded-[3rem] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-10">
          <AnimatePresence>
            {notices.map((notice, index) => (
              <motion.div 
                key={notice.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-slate-900/40 backdrop-blur-xl rounded-[3rem] shadow-2xl transition-all duration-500 border border-white/5 overflow-hidden active:scale-[0.98]"
              >
                {notice.image_url && (
                  <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate-950 flex items-center justify-center border-b border-white/5">
                    <img 
                      src={notice.image_url} 
                      className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-1000" 
                      alt={notice.title} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
                  </div>
                )}

                <div className="relative p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className={clsx(
                      "px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2.5 border transition-all duration-500",
                      notice.is_event 
                        ? "bg-orange-500/10 text-[#df982a] border-orange-500/20 group-hover:bg-orange-500/20" 
                        : "bg-white/5 text-slate-500 border-white/5"
                    )}>
                      {notice.is_event ? (
                        <><Sparkles className="w-3.5 h-3.5" /> Evento Vila</>
                      ) : (
                        <><Megaphone className="w-3.5 h-3.5" /> Comunicado</>
                      )}
                    </div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                      {format(new Date(notice.created_at), "dd 'de' MMM", { locale: ptBR })}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-3xl font-black text-white leading-[1.1] group-hover:text-[#df982a] transition-colors uppercase tracking-tight">{notice.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed font-medium">{notice.content}</p>
                  </div>
                  
                  {notice.event_date && (
                    <div className="flex items-center gap-4 p-5 bg-white/5 rounded-3xl border border-white/10 group-hover:bg-white/10 transition-colors">
                      <div className="w-10 h-10 bg-slate-950 rounded-2xl flex items-center justify-center shadow-2xl text-[#df982a] border border-white/5">
                        <CalendarIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Data e Horário</p>
                        <p className="text-sm font-black text-white leading-none uppercase tracking-tighter">
                          {format(new Date(notice.event_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-600 group-hover:text-white transition-all">
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Instagram Section */}
          <motion.a 
            href="https://instagram.com/aigrejadavila" 
            target="_blank" 
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="group relative bg-gradient-to-br from-[#df982a] to-orange-600 rounded-[3rem] p-10 text-slate-950 shadow-[0_20px_50px_rgba(223,152,42,0.3)] flex flex-col items-center text-center space-y-6 overflow-hidden active:scale-95 transition-all"
          >
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-1000 rotate-12">
              <Instagram className="w-48 h-48" />
            </div>
            <div className="w-20 h-20 bg-slate-950/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center mb-2 shadow-inner">
              <Instagram className="w-10 h-10 text-slate-950" />
            </div>
            <div className="space-y-2 relative z-10">
              <h3 className="text-3xl font-black tracking-tighter uppercase leading-none">Nosso Instagram</h3>
              <p className="text-slate-950/60 font-black tracking-[0.4em] text-[10px] uppercase">@AIGREJADAVILA</p>
            </div>
            <div className="px-8 py-4 bg-slate-950 text-[#df982a] rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] shadow-2xl relative z-10 group-hover:scale-105 transition-transform">
              Seguir a Vila
            </div>
          </motion.a>
        </div>
      )}

      {/* Floating Action Hint */}
      <div className="fixed bottom-28 left-1/2 -translate-x-1/2 px-6 py-2.5 bg-slate-900/90 backdrop-blur-xl text-white rounded-full text-[9px] font-black uppercase tracking-[0.3em] shadow-2xl z-40 animate-bounce border border-white/10">
        Role para as Novidades
      </div>
    </div>
  );
};
