import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Heart, Plus, Send, Shield, Globe, MessageSquare, Sparkles, X, User } from 'lucide-react';
import { clsx } from 'clsx';

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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="h-1 w-8 bg-[#df982a] rounded-full"></div>
          <span className="text-[10px] font-black text-[#df982a] uppercase tracking-[0.3em]">Intercessão</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Coração da Vila</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Carregai as cargas uns dos outros.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-14 h-14 bg-[#df982a] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200 active:scale-95 transition-all hover:bg-orange-600"
          >
            <Plus className="w-8 h-8" />
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-white border border-slate-100 rounded-[2.5rem] animate-pulse" />
            ))}
          </div>
        ) : prayers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
              <Heart className="w-8 h-8 text-[#df982a]" />
            </div>
            <h3 className="text-lg font-bold text-slate-400">Nenhum pedido aberto</h3>
            <p className="text-sm text-slate-300">Seja o primeiro a compartilhar.</p>
          </div>
        ) : (
          prayers.map((prayer) => (
            <div key={prayer.id} className="group relative bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 active:scale-[0.99] overflow-hidden">
              {prayer.is_private && (
                <div className="absolute top-0 right-0 px-4 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-bl-2xl flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-orange-400" /> Confidencial
                </div>
              )}
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shadow-inner">
                  <User className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-black text-slate-900 leading-none">{prayer.profiles?.full_name}</h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] font-black text-[#df982a] uppercase tracking-tighter bg-orange-50 px-2 py-0.5 rounded-full">
                      {prayer.profiles?.church_position || 'Membro'}
                    </span>
                    <div className="h-1 w-1 bg-slate-200 rounded-full" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                      {format(new Date(prayer.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-[#df982a] transition-colors">{prayer.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium line-clamp-4">{prayer.description}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <button
                  onClick={() => handlePraying(prayer.id, prayer.praying_count)}
                  className={clsx(
                    "flex items-center gap-2.5 px-5 py-2.5 rounded-2xl transition-all active:scale-95 text-xs font-black uppercase tracking-widest",
                    prayer.praying_count > 0 
                      ? "bg-orange-50 text-[#df982a] shadow-sm" 
                      : "bg-slate-50 text-slate-400 hover:bg-orange-50 hover:text-[#df982a]"
                  )}
                >
                  <Heart className={clsx("w-4 h-4 transition-transform duration-500", prayer.praying_count > 0 ? "fill-[#df982a] scale-110" : "")} />
                  Estou orando {prayer.praying_count > 0 && <span className="bg-white px-2 py-0.5 rounded-full shadow-sm ml-1">{prayer.praying_count}</span>}
                </button>
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300">
                     <MessageSquare className="w-4 h-4" />
                   </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Pedido */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-12 duration-500">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Novo Pedido</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Compartilhe sua carga</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Título do Pedido</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-200 focus:border-[#df982a] outline-none text-sm font-black tracking-tight"
                  placeholder="Ex: Saúde da minha família"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Sua Oração</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-200 focus:border-[#df982a] outline-none resize-none text-sm font-medium"
                  placeholder="Conte-nos o motivo do seu pedido..."
                />
              </div>

              <div className="flex items-center gap-4 p-5 bg-slate-900 rounded-[2rem] border border-slate-800 shadow-xl">
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
                    className="block w-12 h-6 bg-slate-700 rounded-full peer-checked:bg-[#df982a] transition-colors cursor-pointer after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-6"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="is_private" className="block text-xs font-black text-white uppercase tracking-widest cursor-pointer">Confidencial</label>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Apenas para a liderança</p>
                </div>
                <Shield className={clsx("w-5 h-5 transition-colors", isPrivate ? "text-[#df982a]" : "text-slate-600")} />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full py-5 bg-[#df982a] text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-orange-100 hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95 transition-all"
              >
                {sending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Send className="w-5 h-5" /> Enviar Oração</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
