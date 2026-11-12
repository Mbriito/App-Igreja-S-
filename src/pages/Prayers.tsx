import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Heart, Plus, Send, Shield, Globe, MessageSquare, Sparkles, X, User, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface PrayerRequest {
  id: string;
  title: string;
  description: string;
  is_private: boolean;
  praying_count: number;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    church_position?: string;
  };
}

export const Prayers: React.FC = () => {
  const { user, profile } = useAuth();
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchPrayers();
  }, []);

  const fetchPrayers = async () => {
    const { data, error } = await supabase
      .from('prayer_requests')
      .select('*, profiles(full_name, church_position)')
      .order('created_at', { ascending: false });

    if (!error) setPrayers(data as any || []);
    setLoading(false);
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSending(true);

    const { error } = await supabase
      .from('prayer_requests')
      .insert({
        user_id: user.id,
        title,
        description,
        is_private: isPrivate,
        praying_count: 0
      });

    if (!error) {
      setTitle('');
      setDescription('');
      setIsPrivate(false);
      setIsModalOpen(false);
      fetchPrayers();
    }
    setSending(false);
  };

  const handlePraying = async (prayerId: string, currentCount: number) => {
    const { error } = await supabase
      .from('prayer_requests')
      .update({ praying_count: currentCount + 1 })
      .eq('id', prayerId);

    if (!error) {
      setPrayers(prev => prev.map(p => p.id === prayerId ? { ...p, praying_count: p.praying_count + 1 } : p));
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-10 bg-[#df982a] rounded-full shadow-[0_0_15px_#df982a]"></div>
          <span className="text-[10px] font-black text-[#df982a] uppercase tracking-[0.4em]">Intercessão</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-4xl font-black text-white tracking-tighter leading-none uppercase">Orações</h2>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Carregai as cargas uns dos outros</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-14 h-14 bg-[#df982a] text-slate-950 rounded-2xl flex items-center justify-center shadow-[0_15px_40px_rgba(223,152,42,0.3)] active:scale-90 transition-all hover:bg-orange-600 group"
          >
            <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform" />
          </button>
        </div>
      </div>

      <div className="grid gap-8">
        {loading ? (
          <div className="grid gap-6">
            {[1, 2].map(i => (
              <div key={i} className="h-48 bg-slate-900/50 border border-white/5 rounded-[3rem] animate-pulse" />
            ))}
          </div>
        ) : prayers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-slate-900/40 border-2 border-dashed border-white/5 rounded-[3rem] shadow-2xl">
            <div className="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center mb-8 border border-orange-500/20">
              <Heart className="w-10 h-10 text-[#df982a]" />
            </div>
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-tight">Nenhum pedido aberto</h3>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-2">Seja o primeiro a compartilhar</p>
          </div>
        ) : (
          <AnimatePresence>
            {prayers.map((prayer, index) => (
              <motion.div 
                key={prayer.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-slate-900/40 backdrop-blur-xl p-8 rounded-[3rem] border border-white/5 shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 active:scale-[0.99] overflow-hidden"
              >
                {prayer.is_private && (
                  <div className="absolute top-0 right-0 px-6 py-2.5 bg-slate-950 text-orange-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-bl-[2rem] border-l border-b border-white/5 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Confidencial
                  </div>
                )}
                
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-slate-950 border border-white/10 flex items-center justify-center text-[#df982a] font-black text-xl uppercase shadow-inner">
                    {prayer.profiles?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-black text-white uppercase tracking-tight leading-none">{prayer.profiles?.full_name}</h4>
                    <div className="flex items-center gap-2.5 mt-2">
                      <span className="text-[9px] font-black text-[#df982a] uppercase tracking-widest bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full">
                        {prayer.profiles?.church_position || 'Membro'}
                      </span>
                      <div className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                      <span className="text-[10px] text-slate-600 font-black uppercase tracking-tighter">
                        {format(new Date(prayer.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <h3 className="text-2xl font-black text-white leading-tight group-hover:text-[#df982a] transition-colors uppercase tracking-tight">{prayer.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed font-medium line-clamp-5">{prayer.description}</p>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <button
                    onClick={() => handlePraying(prayer.id, prayer.praying_count)}
                    className={clsx(
                      "flex items-center gap-3 px-8 py-4 rounded-2xl transition-all active:scale-95 text-[10px] font-black uppercase tracking-[0.2em] border",
                      prayer.praying_count > 0 
                        ? "bg-[#df982a] text-slate-950 border-transparent shadow-xl shadow-orange-500/20" 
                        : "bg-white/5 text-slate-500 border-white/5 hover:bg-orange-500/10 hover:text-[#df982a] hover:border-orange-500/20"
                    )}
                  >
                    <Heart className={clsx("w-4 h-4 transition-transform duration-700", prayer.praying_count > 0 ? "fill-slate-950 scale-110" : "")} />
                    Estou orando {prayer.praying_count > 0 && <span className="bg-slate-950/20 px-2 py-0.5 rounded-full ml-1">{prayer.praying_count}</span>}
                  </button>
                  
                  <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-600 group-hover:text-[#df982a] transition-colors border border-white/5">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Modal de Pedido */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 bg-slate-950/80 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-md bg-slate-900 rounded-[3rem] border border-white/10 p-10 shadow-[0_30px_100px_rgba(0,0,0,0.8)]"
            >
              <div className="flex justify-between items-center mb-10">
                <div className="space-y-1">
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Novo Pedido</h3>
                  <p className="text-[10px] text-[#df982a] font-black uppercase tracking-[0.3em]">Compartilhe sua carga</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-slate-500 hover:text-rose-500 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateRequest} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Título do Pedido</label>
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-[1.5rem] focus:ring-2 focus:ring-orange-500/10 focus:border-[#df982a] focus:bg-white/10 outline-none text-sm font-bold text-white placeholder-slate-700 transition-all"
                    placeholder="Ex: Saúde da minha família"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Sua Oração</label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-[1.5rem] focus:ring-2 focus:ring-orange-500/10 focus:border-[#df982a] focus:bg-white/10 outline-none resize-none text-sm font-medium text-white placeholder-slate-700 transition-all"
                    placeholder="Conte-nos o motivo do seu pedido..."
                  />
                </div>

                <div className="flex items-center gap-5 p-6 bg-slate-950 rounded-[2.5rem] border border-white/5 shadow-2xl group transition-all hover:border-[#df982a]/30">
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="is_private"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="sr-only peer"
                    />
                    <label 
                      htmlFor="is_private" 
                      className="block w-14 h-7 bg-white/5 rounded-full peer-checked:bg-[#df982a] transition-all cursor-pointer after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-7 shadow-inner"
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="is_private" className="block text-xs font-black text-white uppercase tracking-[0.2em] cursor-pointer">Confidencial</label>
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">Apenas para a liderança</p>
                  </div>
                  <Shield className={clsx("w-6 h-6 transition-all duration-500", isPrivate ? "text-[#df982a] scale-110" : "text-slate-800")} />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-5 bg-[#df982a] text-slate-950 font-black uppercase tracking-[0.25em] rounded-2xl shadow-2xl shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95 transition-all border-b-4 border-orange-700/50"
                >
                  {sending ? (
                    <div className="w-6 h-6 border-4 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><Send className="w-6 h-6" /> Enviar Oração</>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
