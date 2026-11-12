import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Megaphone, Calendar, Users, Send, CheckCircle, Image as ImageIcon, X, Edit3, Shield, Search, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

export const Admin: React.FC = () => {
  const { profile } = useAuth();
  const [tab, setTab] = useState<'notices' | 'schedules' | 'members'>('notices');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  const fetchMembers = async () => {
    setLoadingMembers(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');
    
    if (!error) {
      setMembers(data || []);
    }
    setLoadingMembers(false);
  };

  const toggleAdmin = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);
    
    if (!error) {
      setMembers(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m));
      showSuccess();
    }
  };

  React.useEffect(() => {
    if (tab === 'members') {
      fetchMembers();
    } else if (tab === 'notices') {
      fetchNotices();
    }
  }, [tab]);

  // Notice Form
  const [notices, setNotices] = useState<any[]>([]);
  const [editingNotice, setEditingNotice] = useState<any | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isEvent, setIsEvent] = useState(false);
  const [eventDate, setEventDate] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchNotices = async () => {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) {
      setNotices(data || []);
    }
  };

  const handleEditNotice = (notice: any) => {
    setEditingNotice(notice);
    setTitle(notice.title);
    setContent(notice.content);
    setIsEvent(notice.is_event);
    setEventDate(notice.event_date ? notice.event_date.substring(0, 16) : '');
    setImagePreview(notice.image_url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteNotice = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este aviso?')) return;
    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (!error) {
      setNotices(prev => prev.filter(n => n.id !== id));
      showSuccess();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `notices/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avisos')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avisos')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-8 animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-center text-slate-500 shadow-2xl">
          <Shield className="w-10 h-10" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">Acesso Restrito</h2>
          <p className="text-xs text-slate-400 font-bold max-w-xs mx-auto">
            Este painel é exclusivo para administradores da Igreja da Vila SÉ.
          </p>
        </div>

        <div className="w-full max-w-sm bg-orange-500/10 border border-orange-500/20 rounded-[2rem] p-6 text-left space-y-5 shadow-2xl">
          <div className="flex items-center gap-3 text-[#df982a]">
            <Edit3 className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Liberar acesso:</span>
          </div>
          <p className="text-[10px] text-orange-200/60 leading-relaxed font-bold">
            Se você é o proprietário do app, execute este comando no <strong>SQL Editor</strong> do Supabase:
          </p>
          <code className="block bg-slate-950 p-4 rounded-xl border border-white/10 text-[9px] text-orange-200 font-mono break-all select-all shadow-inner">
            UPDATE public.profiles SET role = 'admin' WHERE id = '{profile?.id}';
          </code>
          <p className="text-[10px] text-orange-500/60 italic font-bold">
            * Após rodar o comando, recarregue esta página.
          </p>
        </div>
      </div>
    );
  }

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let imageUrl = editingNotice?.image_url || null;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
    }

    const noticeData = {
      title,
      content,
      image_url: imageUrl,
      is_event: isEvent,
      event_date: isEvent ? eventDate : null,
      created_by: profile.id
    };

    const { error } = editingNotice 
      ? await supabase.from('notices').update(noticeData).eq('id', editingNotice.id)
      : await supabase.from('notices').insert(noticeData);

    if (!error) {
      setTitle('');
      setContent('');
      setIsEvent(false);
      setEventDate('');
      setImageFile(null);
      setImagePreview(null);
      setEditingNotice(null);
      fetchNotices();
      showSuccess();
    }
    setLoading(false);
  };

  // Schedule Form
  const [ministryName, setMinistryName] = useState('');
  const [memberName, setMemberName] = useState('');
  const [schedDate, setSchedDate] = useState('');

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('schedules').insert({
      ministry_name: ministryName,
      member_name: memberName,
      event_date: schedDate
    });
    if (!error) {
      setMinistryName('');
      setMemberName('');
      setSchedDate('');
      showSuccess();
    }
    setLoading(false);
  };

  const showSuccess = () => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const tabs = [
    { id: 'notices', label: 'Avisos', icon: Megaphone },
    { id: 'schedules', label: 'Escalas', icon: Calendar },
    { id: 'members', label: 'Membros', icon: Users },
  ];

  return (
    <div className="space-y-8 pb-32 px-1">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Admin</h2>
        <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">Gerenciamento da Comunidade</p>
      </div>

      <div className="flex p-1.5 bg-slate-900 border border-white/5 rounded-[2rem] overflow-x-auto no-scrollbar shadow-2xl gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`relative flex-1 flex-shrink-0 min-w-[120px] py-4 px-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
              tab === t.id ? 'bg-orange-500 text-slate-950 shadow-xl shadow-orange-500/20' : 'text-slate-500 hover:text-white'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-8 shadow-2xl"
        >
          {success && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 bg-emerald-500/10 text-emerald-400 p-5 rounded-2xl border border-emerald-500/20 flex items-center gap-3"
            >
              <CheckCircle className="w-6 h-6" />
              <span className="text-xs font-black uppercase tracking-widest">Operação realizada com sucesso!</span>
            </motion.div>
          )}

          {tab === 'notices' ? (
            <div className="space-y-12">
              <form onSubmit={handleCreateNotice} className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                    <Edit3 className="w-6 h-6 text-[#df982a]" />
                    {editingNotice ? 'Editar Aviso' : 'Novo Aviso'}
                  </h3>
                  {editingNotice && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setEditingNotice(null);
                        setTitle('');
                        setContent('');
                        setIsEvent(false);
                        setEventDate('');
                        setImagePreview(null);
                      }}
                      className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                    >
                      Cancelar
                    </button>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Título do Aviso</label>
                    <input
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white transition-all"
                      placeholder="Ex: Culto de Jovens"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Conteúdo</label>
                    <textarea
                      required
                      rows={4}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-orange-500/10 focus:border-[#df982a] outline-none resize-none text-sm font-bold text-white transition-all"
                      placeholder="Descreva as informações importantes..."
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Mídia do Mural</label>
                    {!imagePreview ? (
                      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/10 rounded-3xl cursor-pointer hover:bg-white/5 hover:border-orange-500/20 transition-all group">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <ImageIcon className="w-10 h-10 text-slate-600 mb-3 group-hover:text-[#df982a] transition-colors" />
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Selecionar Imagem</p>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                      </label>
                    ) : (
                      <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-white/10 bg-slate-950 flex items-center justify-center group shadow-inner">
                        <img src={imagePreview} className="max-w-full max-h-full object-contain" alt="Preview" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          <button
                            type="button"
                            onClick={() => { setImageFile(null); setImagePreview(null); }}
                            className="p-4 bg-rose-500 text-white rounded-full shadow-2xl hover:scale-110 transition-transform"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    )}
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest text-center">Tamanho ideal: 1280x720px (16:9)</p>
                  </div>

                  <div className="flex items-center gap-4 p-5 bg-white/5 rounded-2xl border border-white/10 transition-colors hover:bg-white/10">
                    <input
                      type="checkbox"
                      id="is_event"
                      checked={isEvent}
                      onChange={(e) => setIsEvent(e.target.checked)}
                      className="w-6 h-6 rounded-lg border-white/10 bg-slate-950 text-[#df982a] focus:ring-[#df982a] cursor-pointer"
                    />
                    <label htmlFor="is_event" className="flex-1 text-xs text-white font-black uppercase tracking-widest cursor-pointer">
                      Este aviso é um Evento com data?
                    </label>
                  </div>

                  {isEvent && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Data e Hora</label>
                      <input
                        type="datetime-local"
                        required
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white transition-all [color-scheme:dark]"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-[#df982a] text-slate-950 font-black uppercase tracking-[0.2em] rounded-3xl shadow-2xl shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-3 transition-all active:scale-95"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-4 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>{editingNotice ? <><CheckCircle className="w-6 h-6" /> Salvar Alterações</> : <><Send className="w-6 h-6" /> Publicar no Mural</>}</>
                  )}
                </button>
              </form>

              <div className="pt-12 border-t border-white/5 space-y-8">
                <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                  <Megaphone className="w-6 h-6 text-[#df982a]" />
                  Avisos Ativos
                </h3>
                <div className="grid gap-3">
                  {notices.map(notice => (
                    <div key={notice.id} className="bg-slate-900/90 border border-amber-500/20 hover:border-amber-500/40 rounded-2xl p-4 shadow-lg transition-all flex items-center justify-between gap-3 group/card">
                      <div className="flex items-center gap-4 min-w-0">
                        {notice.image_url ? (
                          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-white/5 shadow-inner">
                            <img src={notice.image_url} className="w-full h-full object-cover" alt="" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center text-slate-600 flex-shrink-0">
                            <Megaphone className="w-5 h-5 text-[#df982a]/60" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm sm:text-base font-semibold text-slate-100 truncate tracking-tight">{notice.title}</p>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <span className={clsx(
                              "text-[10px] font-bold px-2 py-0.5 rounded-md border inline-flex items-center gap-1 uppercase tracking-wider",
                              notice.is_event 
                                ? "text-amber-400 bg-amber-500/10 border-amber-500/20" 
                                : "text-slate-400 bg-slate-500/10 border-slate-500/20"
                            )}>
                              {notice.is_event ? <Sparkles className="w-2.5 h-2.5" /> : <Megaphone className="w-2.5 h-2.5" />}
                              {notice.is_event ? 'Evento' : 'Comunicado'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button 
                          onClick={() => handleEditNotice(notice)}
                          className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-amber-500/20 text-amber-400 transition-all border border-white/5 shadow-sm active:scale-90"
                          title="Editar"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteNotice(notice.id)}
                          className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-rose-500/20 text-rose-400 transition-all border border-white/5 shadow-sm active:scale-90"
                          title="Excluir"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {notices.length === 0 && (
                    <p className="text-center text-slate-600 text-xs py-10 uppercase font-black tracking-[0.2em] italic">Nenhum aviso publicado ainda.</p>
                  )}
                </div>
              </div>
            </div>
          ) : tab === 'schedules' ? (
            <div className="space-y-8">
              <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                <Calendar className="w-6 h-6 text-[#df982a]" />
                Nova Escala
              </h3>
              <form onSubmit={handleCreateSchedule} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Ministério</label>
                  <input
                    required
                    value={ministryName}
                    onChange={(e) => setMinistryName(e.target.value)}
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white transition-all"
                    placeholder="Ex: Recepção"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nome do Membro</label>
                  <input
                    required
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white transition-all"
                    placeholder="Nome de quem vai servir"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Data do Serviço</label>
                  <input
                    type="date"
                    required
                    value={schedDate}
                    onChange={(e) => setSchedDate(e.target.value)}
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white transition-all [color-scheme:dark]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-[#df982a] text-slate-950 font-black uppercase tracking-widest rounded-3xl shadow-2xl shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-3 transition-all active:scale-95"
                >
                  {loading ? 'Processando...' : <><Send className="w-6 h-6" /> Cadastrar na Escala</>}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-8">
              <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                <Users className="w-6 h-6 text-[#df982a]" />
                Membros
              </h3>
              
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-[#df982a] transition-colors" />
                <input
                  type="text"
                  placeholder="Pesquisar membro pelo nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-[1.5rem] focus:ring-2 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white placeholder-slate-600 transition-all"
                />
              </div>

              {loadingMembers ? (
                <div className="flex justify-center py-20">
                  <div className="w-10 h-10 border-4 border-[#df982a] border-t-transparent rounded-full animate-spin shadow-lg" />
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {members
                    .filter(m => m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(member => (
                      <div key={member.id} className="py-6 flex items-center justify-between gap-6 group hover:bg-white/5 px-4 -mx-4 rounded-2xl transition-all">
                        <button 
                          onClick={() => setSelectedMember(member)}
                          className="flex items-center gap-4 min-w-0 text-left hover:opacity-80 transition-opacity flex-1"
                        >
                          <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-center text-[#df982a] font-black text-xl uppercase flex-shrink-0 shadow-lg">
                            {member.full_name?.charAt(0) || 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-white truncate uppercase tracking-tight">{member.full_name}</p>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">
                              {member.church_position || 'Membro'}
                            </p>
                          </div>
                        </button>
                        
                        <div className="flex items-center gap-3">
                          {member.id !== profile?.id && (
                            <button
                              onClick={() => toggleAdmin(member.id, member.role)}
                              className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                member.role === 'admin' 
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20' 
                                  : 'bg-orange-500/10 text-[#df982a] border border-orange-500/20 hover:bg-orange-500/20'
                              }`}
                            >
                              {member.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                            </button>
                          )}
                          {member.role === 'admin' && member.id === profile?.id && (
                            <span className="px-4 py-2.5 bg-white/5 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/10">
                              Você
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Member Detail Modal */}
      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 w-full max-w-lg rounded-[3rem] border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-[#df982a] text-slate-950 flex items-center justify-center text-2xl font-black uppercase shadow-2xl">
                    {selectedMember.full_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white leading-tight uppercase tracking-tight">{selectedMember.full_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 rounded-full bg-[#df982a] animate-pulse" />
                      <p className="text-[10px] font-black text-[#df982a] uppercase tracking-[0.2em]">{selectedMember.role}</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedMember(null)}
                  className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all border border-white/10"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                <div className="grid grid-cols-2 gap-8">
                  <DetailItem label="Cargo" value={selectedMember.church_position} />
                  <DetailItem label="Ministérios" value={selectedMember.active_ministries} />
                  <DetailItem label="Telefone" value={selectedMember.phone} />
                  <DetailItem label="Nascimento" value={selectedMember.birth_date} />
                  <DetailItem label="Gênero" value={selectedMember.gender === 'M' ? 'Masculino' : 'Feminino'} />
                  <DetailItem label="Escolaridade" value={selectedMember.education_level} />
                  <DetailItem label="Estado Civil" value={selectedMember.marital_status} />
                  <DetailItem label="Profissão" value={selectedMember.profession} />
                </div>

                <div className="space-y-4 pt-8 border-t border-white/5">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                    <div className="w-4 h-[1px] bg-slate-700" /> Endereço
                  </h4>
                  <p className="text-sm font-bold text-slate-300 leading-relaxed bg-white/5 p-5 rounded-3xl border border-white/10">
                    {selectedMember.address_street}, {selectedMember.address_number}
                    {selectedMember.address_complement && ` - ${selectedMember.address_complement}`}
                    <br />
                    {selectedMember.address_neighborhood} - {selectedMember.address_city}/{selectedMember.address_state}
                    <br />
                    CEP: {selectedMember.address_zip}
                  </p>
                </div>

                <div className="space-y-6 pt-8 border-t border-white/5">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                    <div className="w-4 h-[1px] bg-slate-700" /> Histórico
                  </h4>
                  <div className="grid gap-4">
                    <DetailItem label="Congregação Anterior" value={selectedMember.prev_church_name} />
                    <DetailItem label="Data Batismo" value={selectedMember.baptism_date} />
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-950/50 border-t border-white/5">
                <button 
                  onClick={() => setSelectedMember(null)}
                  className="w-full py-5 bg-white/5 text-white font-black uppercase tracking-[0.2em] rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
                >
                  Fechar Detalhes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DetailItem: React.FC<{ label: string, value: any }> = ({ label, value }) => (
  <div className="space-y-2">
    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">{label}</p>
    <p className="text-sm font-bold text-white tracking-tight">{value || '-'}</p>
  </div>
);
