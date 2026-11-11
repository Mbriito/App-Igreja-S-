import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Megaphone, Calendar, Users, Send, CheckCircle, Image as ImageIcon, X } from 'lucide-react';

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
    }
  }, [tab]);

  // Notice Form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isEvent, setIsEvent] = useState(false);
  const [eventDate, setEventDate] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-900">Acesso Restrito</h2>
        <p className="text-slate-500">Apenas administradores podem acessar esta página.</p>
      </div>
    );
  }

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let imageUrl = null;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
    }

    const { error } = await supabase.from('notices').insert({
      title,
      content,
      image_url: imageUrl,
      is_event: isEvent,
      event_date: isEvent ? eventDate : null,
      created_by: profile.id
    });

    if (!error) {
      setTitle('');
      setContent('');
      setIsEvent(false);
      setEventDate('');
      setImageFile(null);
      setImagePreview(null);
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

  return (
    <div className="space-y-6 pb-12">
      <h2 className="text-2xl font-bold text-slate-900">Painel Administrativo</h2>

      <div className="flex p-1 bg-slate-100 rounded-2xl overflow-x-auto no-scrollbar">
        <button
          onClick={() => setTab('notices')}
          className={`flex-1 min-w-fit py-3 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            tab === 'notices' ? 'bg-white text-[#df982a] shadow-sm' : 'text-slate-500'
          }`}
        >
          Novo Aviso
        </button>
        <button
          onClick={() => setTab('schedules')}
          className={`flex-1 min-w-fit py-3 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            tab === 'schedules' ? 'bg-white text-[#df982a] shadow-sm' : 'text-slate-500'
          }`}
        >
          Nova Escala
        </button>
        <button
          onClick={() => setTab('members')}
          className={`flex-1 min-w-fit py-3 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            tab === 'members' ? 'bg-white text-[#df982a] shadow-sm' : 'text-slate-500'
          }`}
        >
          Gerenciar Membros
        </button>
      </div>

      {success && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl border border-emerald-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-bold">Operação realizada com sucesso!</span>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        {tab === 'notices' ? (
          <form onSubmit={handleCreateNotice} className="space-y-6">
            {/* ... form fields for notices ... */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Título do Aviso</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-200 outline-none"
                placeholder="Ex: Culto de Jovens"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Conteúdo</label>
              <textarea
                required
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-200 outline-none resize-none"
                placeholder="Descreva as informações importantes..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Foto do Mural (Opcional)</label>
              {!imagePreview ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImageIcon className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Toque para selecionar</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              ) : (
                <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-slate-100">
                  <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur rounded-full text-rose-500 shadow-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <input
                type="checkbox"
                id="is_event"
                checked={isEvent}
                onChange={(e) => setIsEvent(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-[#df982a] focus:ring-[#df982a]"
              />
              <label htmlFor="is_event" className="flex-1 text-sm text-slate-700 font-bold cursor-pointer">
                Este aviso é um Evento com data?
              </label>
            </div>

            {isEvent && (
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Data e Hora</label>
                <input
                  type="datetime-local"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-200 outline-none"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#df982a] text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-orange-100 hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Send className="w-5 h-5" /> Publicar no Mural</>
              )}
            </button>
          </form>
        ) : tab === 'schedules' ? (
          <form onSubmit={handleCreateSchedule} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Ministério</label>
              <input
                required
                value={ministryName}
                onChange={(e) => setMinistryName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#df982a] outline-none"
                placeholder="Ex: Recepção"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Nome do Membro</label>
              <input
                required
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#df982a] outline-none"
                placeholder="Nome de quem vai servir"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Data do Serviço</label>
              <input
                type="date"
                required
                value={schedDate}
                onChange={(e) => setSchedDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#df982a] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#df982a] text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-orange-100 hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {loading ? 'Processando...' : <><Send className="w-5 h-5" /> Cadastrar na Escala</>}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="relative">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar membro pelo nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-200 outline-none text-sm"
              />
            </div>

            {loadingMembers ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-3 border-[#df982a] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {members
                  .filter(m => m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(member => (
                    <div key={member.id} className="py-4 flex items-center justify-between gap-4">
                      <button 
                        onClick={() => setSelectedMember(member)}
                        className="flex items-center gap-3 min-w-0 text-left hover:opacity-70 transition-opacity flex-1"
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold uppercase flex-shrink-0">
                          {member.full_name?.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{member.full_name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {member.church_position || 'Membro'}
                          </p>
                        </div>
                      </button>
                      
                      <div className="flex items-center gap-2">
                        {member.id !== profile?.id && (
                          <button
                            onClick={() => toggleAdmin(member.id, member.role)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                              member.role === 'admin' 
                                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                                : 'bg-orange-50 text-[#df982a] hover:bg-orange-100'
                            }`}
                          >
                            {member.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                          </button>
                        )}
                        {member.role === 'admin' && member.id === profile?.id && (
                          <span className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest">
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
      </div>

      {/* Member Detail Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#df982a] text-white flex items-center justify-center text-xl font-black uppercase">
                  {selectedMember.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 leading-tight">{selectedMember.full_name}</h3>
                  <p className="text-[10px] font-black text-[#df982a] uppercase tracking-widest">{selectedMember.role}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedMember(null)}
                className="p-2 bg-white rounded-full shadow-sm text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="Cargo" value={selectedMember.church_position} />
                <DetailItem label="Ministérios" value={selectedMember.active_ministries} />
                <DetailItem label="Telefone" value={selectedMember.phone} />
                <DetailItem label="Data Nascimento" value={selectedMember.birth_date} />
                <DetailItem label="Gênero" value={selectedMember.gender === 'M' ? 'Masculino' : 'Feminino'} />
                <DetailItem label="Escolaridade" value={selectedMember.education_level} />
                <DetailItem label="Estado Civil" value={selectedMember.marital_status} />
                <DetailItem label="Profissão" value={selectedMember.profession} />
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Endereço</h4>
                <p className="text-sm font-medium text-slate-600">
                  {selectedMember.address_street}, {selectedMember.address_number}
                  {selectedMember.address_complement && ` - ${selectedMember.address_complement}`}
                  <br />
                  {selectedMember.address_neighborhood} - {selectedMember.address_city}/{selectedMember.address_state}
                  <br />
                  CEP: {selectedMember.address_zip}
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Histórico</h4>
                <DetailItem label="Congregação Anterior" value={selectedMember.prev_church_name} />
                <DetailItem label="Data Batismo" value={selectedMember.baptism_date} />
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={() => setSelectedMember(null)}
                className="w-full py-4 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-200"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailItem: React.FC<{ label: string, value: any }> = ({ label, value }) => (
  <div className="space-y-1">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <p className="text-sm font-bold text-slate-700">{value || '-'}</p>
  </div>
);
