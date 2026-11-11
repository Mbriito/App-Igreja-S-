import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Megaphone, Calendar as CalendarIcon, Clock, ArrowRight, Share2, Sparkles } from 'lucide-react';
import { PWAInstallButton } from '@/components/PWAInstallButton';
import { clsx } from 'clsx';

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
      // Se não houver avisos, vamos adicionar um aviso de boas-vindas com a imagem do cronograma
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
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col gap-2">
        <PWAInstallButton />
        <div className="flex items-center gap-2 mt-4">
          <div className="h-1 w-8 bg-[#df982a] rounded-full"></div>
          <span className="text-[10px] font-black text-[#df982a] uppercase tracking-[0.3em]">Novidades</span>
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Mural da Vila</h2>
        <p className="text-sm text-slate-500 font-medium">Acompanhe tudo o que acontece em nossa comunidade.</p>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-white border border-slate-100 rounded-[2rem] animate-pulse" />
          ))}
        </div>
      ) : notices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm border-dashed">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <Megaphone className="w-8 h-8 text-slate-200" />
          </div>
          <h3 className="text-lg font-bold text-slate-400">Nenhum aviso no momento</h3>
          <p className="text-sm text-slate-300">Fique atento, novidades em breve!</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {notices.map((notice) => (
            <div key={notice.id} className="group relative bg-white rounded-[2.5rem] shadow-sm hover:shadow-xl hover:shadow-orange-100/50 transition-all duration-500 border border-slate-100 overflow-hidden active:scale-[0.98]">
              {notice.image_url && (
                <div className="relative w-full aspect-video overflow-hidden">
                  <img 
                    src={notice.image_url} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    alt={notice.title} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              )}

              <div className="relative p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className={clsx(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
                    notice.is_event ? "bg-orange-50 text-[#df982a]" : "bg-slate-100 text-slate-500"
                  )}>
                    {notice.is_event ? (
                      <><Sparkles className="w-3 h-3" /> Evento Próximo</>
                    ) : (
                      <><Megaphone className="w-3 h-3" /> Comunicado</>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    {format(new Date(notice.created_at), "dd 'de' MMM", { locale: ptBR })}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 leading-[1.1] group-hover:text-[#df982a] transition-colors">{notice.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">{notice.content}</p>
                </div>
                
                {notice.event_date && (
                  <div className="flex items-center gap-2 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-[#df982a]">
                      <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Data e Horário</p>
                      <p className="text-sm font-bold text-slate-700 leading-none">
                        {format(new Date(notice.event_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Instagram Section */}
          <a 
            href="https://instagram.com/aigrejadavila" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group relative bg-gradient-to-br from-[#df982a] to-orange-400 rounded-[2.5rem] p-8 text-white shadow-xl shadow-orange-100 flex flex-col items-center text-center space-y-4 overflow-hidden active:scale-95 transition-all"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <Share2 className="w-32 h-32" />
            </div>
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-2">
              <Share2 className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-1 relative z-10">
              <h3 className="text-2xl font-black tracking-tight uppercase">Siga nosso Instagram</h3>
              <p className="text-white/80 font-bold tracking-widest text-xs">@AIGREJADAVILA</p>
            </div>
            <div className="px-6 py-3 bg-white text-[#df982a] rounded-full text-xs font-black uppercase tracking-widest shadow-lg relative z-10">
              Ver Perfil
            </div>
          </a>
        </div>
      )}

      {/* Floating Action Hint */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-2 bg-slate-900/90 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl z-40 animate-bounce">
        Role para baixo
      </div>
    </div>
  );
};
