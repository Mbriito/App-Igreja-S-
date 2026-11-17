import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminToast } from '@/contexts/AdminToastContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Heart, Plus, Send, Shield, MessageSquare, X, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
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
  } | null;
}

export const Prayers: React.FC = () => {
  const { user, profile } = useAuth();
  const { showAdminToast } = useAdminToast();
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [prayerToDelete, setPrayerToDelete] = useState<PrayerRequest | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchPrayers();
  }, []);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback((prev) => (prev?.message === message ? null : prev));
    }, 3800);
  };

  const fetchPrayers = async () => {
    const { data, error } = await supabase
      .from('prayer_requests')
      .select('*, profiles(full_name, church_position)')
      .order('created_at', { ascending: false });

    if (!error) setPrayers((data as PrayerRequest[]) || []);
    setLoading(false);
  };

  const canDeletePrayer = (prayer: PrayerRequest) => {
    if (!user) return false;
    return prayer.user_id === user.id || profile?.role === 'admin';
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
        praying_count: 0,
      });

    if (!error) {
      setTitle('');
      setDescription('');
      setIsPrivate(false);
      setIsModalOpen(false);
      await fetchPrayers();
      showFeedback('success', 'Pedido de oração publicado com sucesso!');
    } else {
      showFeedback('error', 'Não foi possível publicar o pedido de oração.');
    }
    setSending(false);
  };

  const handlePraying = async (prayerId: string, currentCount: number) => {
    const { error } = await supabase
      .from('prayer_requests')
      .update({ praying_count: currentCount + 1 })
      .eq('id', prayerId);

    if (!error) {
      setPrayers((prev) =>
        prev.map((p) => (p.id === prayerId ? { ...p, praying_count: p.praying_count + 1 } : p))
      );
    }
  };

  const handleDeletarPedido = async (id: string) => {
    const targetPrayer = prayers.find((p) => p.id === id) || prayerToDelete;
    if (!user || !targetPrayer || (targetPrayer.user_id !== user.id && profile?.role !== 'admin')) {
      setPrayerToDelete(null);
      showFeedback('error', 'Você não tem permissão para excluir este pedido de oração.');
      return;
    }

    setDeletingId(id);
    try {
      const { data, error } = await supabase
        .from('prayer_requests')
        .delete()
        .eq('id', id)
        .select('id');

      if (error) {
        if (error.code === '42501') {
          showFeedback(
            'error',
            'Permissão de exclusão (RLS) ausente no Supabase. Execute o script supabase_schema.sql atualizado.'
          );
        } else {
          showFeedback('error', error.message || 'Erro ao excluir pedido de oração.');
        }
        return;
      }

      if (!data || data.length === 0) {
        showFeedback(
          'error',
          'Não foi possível confirmar a exclusão no banco. Execute o script supabase_schema.sql atualizado no SQL Editor.'
        );
        return;
      }

      setPrayers((prev) => prev.filter((p) => p.id !== id));
      setPrayerToDelete(null);
      if (profile?.role === 'admin') {
        showAdminToast('Pedido de oração excluído do mural!');
      } else {
        showFeedback('success', 'Pedido de oração excluído com sucesso!');
      }
    } catch {
      showFeedback('error', 'Erro inesperado ao excluir o pedido de oração.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full max-w-full overflow-hidden space-y-8 sm:space-y-10 animate-in fade-in duration-1000 pb-20">
      {/* Toast Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            className={clsx(
              'fixed top-20 left-1/2 -translate-x-1/2 z-[120] w-[calc(100vw-2rem)] max-w-md px-5 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center gap-3',
              feedback.type === 'success'
                ? 'bg-slate-900/95 border-amber-500/40 text-amber-300'
                : 'bg-slate-900/95 border-rose-500/40 text-rose-300'
            )}
          >
            {feedback.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-[#df982a] flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            )}
            <p className="text-xs font-bold leading-snug flex-1 break-words">{feedback.message}</p>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="p-1 text-slate-400 hover:text-white transition-colors flex-shrink-0"
              aria-label="Fechar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4 min-w-0">
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-10 bg-[#df982a] rounded-full shadow-[0_0_15px_#df982a]" />
          <span className="text-[10px] font-black text-[#df982a] uppercase tracking-[0.4em]">Intercessão</span>
        </div>
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="space-y-1 min-w-0 flex-1">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter leading-none uppercase">
              Orações
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-bold uppercase tracking-widest mt-1 break-words">
              Carregai as cargas uns dos outros
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-12 h-12 sm:w-14 sm:h-14 bg-[#df982a] text-slate-950 rounded-2xl flex items-center justify-center shadow-[0_15px_40px_rgba(223,152,42,0.3)] active:scale-90 transition-all hover:bg-orange-600 group flex-shrink-0"
            aria-label="Novo pedido de oração"
          >
            <Plus className="w-7 h-7 sm:w-8 sm:h-8 group-hover:rotate-90 transition-transform" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 w-full min-w-0 gap-6 sm:gap-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 bg-slate-900/50 border border-white/5 rounded-3xl sm:rounded-[3rem] animate-pulse" />
            ))}
          </div>
        ) : prayers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 sm:py-24 px-4 text-center bg-slate-900/40 border-2 border-dashed border-white/5 rounded-3xl sm:rounded-[3rem] shadow-2xl">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-orange-500/10 rounded-full flex items-center justify-center mb-6 sm:mb-8 border border-orange-500/20">
              <Heart className="w-9 h-9 sm:w-10 sm:h-10 text-[#df982a]" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-400 uppercase tracking-tight">
              Nenhum pedido aberto
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-bold uppercase tracking-widest mt-2">
              Seja o primeiro a compartilhar
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {prayers.map((prayer, index) => {
              const showDelete = canDeletePrayer(prayer);
              return (
                <motion.div
                  key={prayer.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative w-full max-w-full min-w-0 bg-slate-900/40 backdrop-blur-xl p-5 sm:p-8 rounded-3xl sm:rounded-[3rem] border border-white/5 shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 overflow-hidden"
                >
                  {prayer.is_private && (
                    <div className="mb-4 sm:mb-0 sm:absolute sm:top-0 sm:right-0 inline-flex sm:flex px-4 sm:px-6 py-1.5 sm:py-2.5 bg-slate-950 text-orange-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] rounded-full sm:rounded-none sm:rounded-bl-[2rem] border border-white/5 sm:border-t-0 sm:border-r-0 items-center gap-2">
                      <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      Confidencial
                    </div>
                  )}

                  <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8 min-w-0">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-[1.5rem] bg-slate-950 border border-white/10 flex items-center justify-center text-[#df982a] font-black text-lg sm:text-xl uppercase shadow-inner flex-shrink-0">
                      {prayer.profiles?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm sm:text-base font-black text-white uppercase tracking-tight leading-tight truncate">
                        {prayer.profiles?.full_name || 'Membro da Comunidade'}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 sm:mt-2">
                        <span className="text-[9px] font-black text-[#df982a] uppercase tracking-widest bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 rounded-full">
                          {prayer.profiles?.church_position || 'Membro'}
                        </span>
                        <div className="w-1 h-1 bg-slate-700 rounded-full" />
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">
                          {format(new Date(prayer.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 min-w-0">
                    <h3 className="text-xl sm:text-2xl font-black text-white leading-tight group-hover:text-[#df982a] transition-colors uppercase tracking-tight break-words">
                      {prayer.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed font-medium break-words line-clamp-5">
                      {prayer.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-5 sm:pt-6 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => handlePraying(prayer.id, prayer.praying_count)}
                      className={clsx(
                        'flex items-center gap-2.5 sm:gap-3 px-5 sm:px-8 py-3.5 sm:py-4 rounded-2xl transition-all active:scale-95 text-[10px] font-black uppercase tracking-[0.18em] border',
                        prayer.praying_count > 0
                          ? 'bg-[#df982a] text-slate-950 border-transparent shadow-xl shadow-orange-500/20'
                          : 'bg-white/5 text-slate-500 border-white/5 hover:bg-orange-500/10 hover:text-[#df982a] hover:border-orange-500/20'
                      )}
                    >
                      <Heart
                        className={clsx(
                          'w-4 h-4 transition-transform duration-700 flex-shrink-0',
                          prayer.praying_count > 0 ? 'fill-slate-950 scale-110' : ''
                        )}
                      />
                      <span>Estou orando</span>
                      {prayer.praying_count > 0 && (
                        <span className="bg-slate-950/20 px-2 py-0.5 rounded-full ml-0.5">
                          {prayer.praying_count}
                        </span>
                      )}
                    </button>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {showDelete && (
                        <button
                          type="button"
                          onClick={() => setPrayerToDelete(prayer)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-amber-500/20 hover:border-rose-500/40 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                          title="Excluir pedido"
                          aria-label={`Excluir pedido ${prayer.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Excluir</span>
                        </button>
                      )}
                      <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-600 group-hover:text-[#df982a] transition-colors border border-white/5">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Modal de Novo Pedido */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 bg-slate-950/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-md bg-slate-900 rounded-3xl sm:rounded-[3rem] border border-white/10 p-6 sm:p-10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-center mb-8 sm:mb-10 gap-3">
                <div className="space-y-1 min-w-0">
                  <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter leading-none">
                    Novo Pedido
                  </h3>
                  <p className="text-[10px] text-[#df982a] font-black uppercase tracking-[0.3em]">
                    Compartilhe sua carga
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-11 h-11 sm:w-12 sm:h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-slate-500 hover:text-rose-500 transition-all flex-shrink-0"
                  aria-label="Fechar modal"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateRequest} className="space-y-6 sm:space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">
                    Título do Pedido
                  </label>
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-5 sm:px-6 py-4 sm:py-5 bg-white/5 border border-white/10 rounded-2xl sm:rounded-[1.5rem] focus:ring-2 focus:ring-orange-500/10 focus:border-[#df982a] focus:bg-white/10 outline-none text-sm font-bold text-white placeholder-slate-700 transition-all"
                    placeholder="Ex: Saúde da minha família"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">
                    Sua Oração
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-5 sm:px-6 py-4 sm:py-5 bg-white/5 border border-white/10 rounded-2xl sm:rounded-[1.5rem] focus:ring-2 focus:ring-orange-500/10 focus:border-[#df982a] focus:bg-white/10 outline-none resize-none text-sm font-medium text-white placeholder-slate-700 transition-all"
                    placeholder="Conte-nos o motivo do seu pedido..."
                  />
                </div>

                <div className="flex items-center gap-4 sm:gap-5 p-5 sm:p-6 bg-slate-950 rounded-3xl sm:rounded-[2.5rem] border border-white/5 shadow-2xl group transition-all hover:border-[#df982a]/30">
                  <div className="relative flex-shrink-0">
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
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor="is_private"
                      className="block text-xs font-black text-white uppercase tracking-[0.2em] cursor-pointer"
                    >
                      Confidencial
                    </label>
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">
                      Apenas para a liderança
                    </p>
                  </div>
                  <Shield
                    className={clsx(
                      'w-6 h-6 transition-all duration-500 flex-shrink-0',
                      isPrivate ? 'text-[#df982a] scale-110' : 'text-slate-800'
                    )}
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-4 sm:py-5 bg-[#df982a] text-slate-950 font-black uppercase tracking-[0.25em] rounded-2xl shadow-2xl shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95 transition-all border-b-4 border-orange-700/50"
                >
                  {sending ? (
                    <div className="w-6 h-6 border-4 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" /> Enviar Oração
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmação de Exclusão */}
      <AnimatePresence>
        {prayerToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              className="w-full max-w-sm bg-slate-900 rounded-3xl sm:rounded-[2.5rem] border border-amber-500/30 p-6 sm:p-8 shadow-[0_30px_100px_rgba(0,0,0,0.85)] space-y-6"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Trash2 className="w-7 h-7" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">
                    Excluir Pedido de Oração
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                    Deseja realmente excluir este pedido de oração?
                  </p>
                  <p className="text-xs font-black text-amber-400 uppercase tracking-tight break-words line-clamp-2 px-3 py-2 bg-slate-950/70 rounded-xl border border-amber-500/20">
                    {prayerToDelete.title}
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button
                  type="button"
                  disabled={deletingId !== null}
                  onClick={() => setPrayerToDelete(null)}
                  className="flex-1 py-3.5 px-4 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-black uppercase tracking-widest rounded-2xl border border-white/10 transition-all disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={deletingId !== null}
                  onClick={() => handleDeletarPedido(prayerToDelete.id)}
                  className="flex-1 py-3.5 px-4 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {deletingId === prayerToDelete.id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
