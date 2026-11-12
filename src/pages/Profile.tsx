import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { 
  User, LogOut, Phone, Cake, Church, Save, MapPin, 
  Briefcase, GraduationCap, Users, Heart, Shield, Landmark,
  ChevronDown, ChevronUp, Mail, Edit3, PlusCircle, Instagram, Sparkles
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface SectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

const ProfileSection: React.FC<SectionProps> = ({ title, icon: Icon, children, isOpen, onToggle }) => (
  <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden transition-all duration-500">
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between p-6 text-left active:bg-white/5 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-orange-500/10 text-[#df982a] rounded-2xl border border-orange-500/20">
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="font-black text-white uppercase tracking-tight text-sm">{title}</h3>
      </div>
      {isOpen ? <ChevronUp className="w-5 h-5 text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="px-6 pb-8 space-y-6">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export const Profile: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    personal: true,
    address: false,
    contact: false,
    professional: false,
    church: false,
    additional: false
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const [formData, setFormData] = useState({
    full_name: '',
    gender: '',
    birth_date: '',
    rg: '',
    cpf: '',
    phone: '',
    baptism_date: '',
    marital_status: '',
    spouse_name: '',
    marriage_date: '',
    address_street: '',
    address_complement: '',
    address_number: '',
    address_neighborhood: '',
    address_zip: '',
    address_city: '',
    address_state: '',
    education_level: '',
    employment_status: '',
    profession: '',
    prev_church_name: '',
    prev_church_pastor: '',
    prev_church_phone: '',
    church_position: '',
    active_ministries: '',
    children_count: 0,
    prev_church_name_other: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        gender: profile.gender || '',
        birth_date: profile.birth_date || '',
        rg: profile.rg || '',
        cpf: profile.cpf || '',
        phone: profile.phone || '',
        baptism_date: profile.baptism_date || '',
        marital_status: profile.marital_status || '',
        spouse_name: profile.spouse_name || '',
        marriage_date: profile.marriage_date || '',
        address_street: profile.address_street || '',
        address_complement: profile.address_complement || '',
        address_number: profile.address_number || '',
        address_neighborhood: profile.address_neighborhood || '',
        address_zip: profile.address_zip || '',
        address_city: profile.address_city || '',
        address_state: profile.address_state || '',
        education_level: profile.education_level || '',
        employment_status: profile.employment_status || '',
        profession: profile.profession || '',
        prev_church_name: profile.prev_church_name || '',
        prev_church_pastor: profile.prev_church_pastor || '',
        prev_church_phone: profile.prev_church_phone || '',
        church_position: profile.church_position || '',
        active_ministries: profile.active_ministries || '',
        children_count: profile.children_count || 0,
        prev_church_name_other: ''
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'number' ? parseInt(value) || 0 : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setMessage(null);

    try {
      const dataToSave = {
        full_name: formData.full_name,
        gender: formData.gender || null,
        birth_date: formData.birth_date || null,
        rg: formData.rg || null,
        cpf: formData.cpf || null,
        phone: formData.phone || null,
        baptism_date: formData.baptism_date || null,
        marital_status: formData.marital_status || null,
        spouse_name: formData.spouse_name || null,
        marriage_date: formData.marriage_date || null,
        address_street: formData.address_street || null,
        address_complement: formData.address_complement || null,
        address_number: formData.address_number || null,
        address_neighborhood: formData.address_neighborhood || null,
        address_zip: formData.address_zip || null,
        address_city: formData.address_city || null,
        address_state: formData.address_state || null,
        education_level: formData.education_level || null,
        employment_status: formData.employment_status || null,
        profession: formData.profession || null,
        prev_church_name: formData.prev_church_name === 'Outra' ? formData.prev_church_name_other : formData.prev_church_name,
        prev_church_pastor: formData.prev_church_pastor || null,
        prev_church_phone: formData.prev_church_phone || null,
        church_position: formData.church_position || null,
        active_ministries: formData.active_ministries || null,
        children_count: parseInt(formData.children_count as any) || 0,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(dataToSave)
        .eq('id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Update error:', err);
      setMessage({ type: 'error', text: `Erro ao salvar: ${err.message || 'Tente novamente.'}` });
    } finally {
      setLoading(false);
    }
  };

  const churchPositions = [
    'Visitante', 'Novo convertido', 'Jovem (menor)', 'Membro', 'Obreiro(a) cooperador',
    'Diácono', 'Evangelista', 'Presbítero', 'Pastor', 'Missionário'
  ];

  const maritalStatuses = ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'];

  const educationLevels = [
    'Ensino Fundamental', 'Ensino Médio', 'Ensino Superior', 
    'Pós-graduação', 'Mestrado', 'Doutorado'
  ];

  const ministriesList = [
    'Louvor', 'Mídia / Som', 'Infantil (Vila Kids)', 'Recepção', 
    'Intercessão', 'Diaconato', 'Ação Social', 'Teatro / Dança', 'Outro'
  ];

  const congregations = [
    'Nenhuma / Primeira Igreja', 'Assembleia de Deus', 'Batista', 
    'Presbiteriana', 'Metodista', 'Quadrangular', 'Outra'
  ];

  return (
    <div className="space-y-8 pb-40 max-w-lg mx-auto">
      {/* Premium Header Card */}
      <div className="bg-slate-900 rounded-[3rem] shadow-2xl p-10 flex flex-col items-center text-center relative overflow-hidden group border border-white/5">
        <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:rotate-12 transition-transform duration-1000">
          <Sparkles className="w-16 h-16 text-[#df982a]" />
        </div>
        
        <div className="absolute top-8 right-8 z-20">
          <button
            onClick={() => signOut()}
            className="p-3 bg-white/5 backdrop-blur-md text-white rounded-2xl hover:bg-rose-500/80 transition-all active:scale-95 border border-white/10"
            title="Sair"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
        
        <div className="relative z-10">
          <div className="w-24 h-24 rounded-[2rem] border-4 border-[#df982a]/30 p-1.5 mb-4 shadow-2xl relative bg-slate-800 mx-auto">
            <div className="w-full h-full rounded-[1.5rem] bg-gradient-to-br from-[#df982a] to-orange-600 flex items-center justify-center text-slate-950 text-3xl font-black uppercase shadow-inner">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="absolute -bottom-1 -right-1 p-2.5 bg-slate-950 rounded-2xl shadow-xl border border-white/10">
              <Edit3 className="w-4 h-4 text-[#df982a]" />
            </div>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight leading-none mb-2">{profile?.full_name || 'Usuário'}</h2>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-500/10 text-[#df982a] border border-orange-500/20 text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg">
            <Shield className="w-3 h-3" />
            {profile?.church_position || 'Membro'}
          </div>
        </div>
      </div>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={clsx(
            "p-6 rounded-[2rem] text-sm font-black flex items-center gap-5 border shadow-2xl uppercase tracking-widest",
            message.type === 'success' 
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
          )}
        >
          <div className={clsx(
            "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg",
            message.type === 'success' ? "bg-emerald-500/20" : "bg-rose-500/20"
          )}>
            <PlusCircle className={clsx("w-6 h-6", message.type === 'success' ? "rotate-45" : "")} />
          </div>
          <span className="flex-1">{message.text}</span>
        </motion.div>
      )}

      <form onSubmit={handleUpdate} className="space-y-5 px-1">
        <ProfileSection 
          title="Dados Pessoais" 
          icon={User} 
          isOpen={openSections.personal} 
          onToggle={() => toggleSection('personal')}
        >
          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nome Completo</label>
              <input
                required
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Seu nome completo"
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-[#df982a] transition-all outline-none text-sm font-bold text-white placeholder-slate-600"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">RG</label>
                <input
                  name="rg"
                  value={formData.rg}
                  onChange={handleChange}
                  placeholder="00.000.000-0"
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white placeholder-slate-600"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">CPF</label>
                <input
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  placeholder="000.000.000-00"
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white placeholder-slate-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Gênero</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1.25rem_center] bg-no-repeat transition-all"
                >
                  <option value="" className="bg-slate-900">Selecione</option>
                  <option value="M" className="bg-slate-900">Masculino</option>
                  <option value="F" className="bg-slate-900">Feminino</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Estado Civil</label>
                <select
                  name="marital_status"
                  value={formData.marital_status}
                  onChange={handleChange}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1.25rem_center] bg-no-repeat transition-all"
                >
                  <option value="" className="bg-slate-900">Selecione</option>
                  {maritalStatuses.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Data Batismo</label>
                <input
                  type="date"
                  name="baptism_date"
                  value={formData.baptism_date}
                  onChange={handleChange}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white [color-scheme:dark]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Data Casamento</label>
                <input
                  type="date"
                  name="marriage_date"
                  value={formData.marriage_date}
                  onChange={handleChange}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white [color-scheme:dark]"
                />
              </div>
            </div>
          </div>
        </ProfileSection>

        <ProfileSection 
          title="Endereço" 
          icon={MapPin} 
          isOpen={openSections.address} 
          onToggle={() => toggleSection('address')}
        >
          <div className="grid gap-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Logradouro</label>
                <input
                  name="address_street"
                  value={formData.address_street}
                  onChange={handleChange}
                  placeholder="Rua, Av..."
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nº</label>
                <input
                  name="address_number"
                  value={formData.address_number}
                  onChange={handleChange}
                  placeholder="123"
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Bairro</label>
              <input
                name="address_neighborhood"
                value={formData.address_neighborhood}
                onChange={handleChange}
                placeholder="Nome do bairro"
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-orange-50 focus:border-[#df982a] outline-none text-sm font-bold text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Cidade</label>
                <input
                  name="address_city"
                  value={formData.address_city}
                  onChange={handleChange}
                  placeholder="Cidade"
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-orange-50 focus:border-[#df982a] outline-none text-sm font-bold text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Estado</label>
                <input
                  name="address_state"
                  value={formData.address_state}
                  onChange={handleChange}
                  maxLength={2}
                  placeholder="UF"
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-orange-50 focus:border-[#df982a] outline-none text-sm font-bold text-white uppercase"
                />
              </div>
            </div>
          </div>
        </ProfileSection>

        <ProfileSection 
          title="Contato" 
          icon={Mail} 
          isOpen={openSections.contact} 
          onToggle={() => toggleSection('contact')}
        >
          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">WhatsApp / Telefone</label>
              <div className="relative group">
                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-[#df982a] transition-colors" />
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(00) 00000-0000"
                  className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">E-mail</label>
              <div className="relative opacity-40">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  disabled
                  value={user?.email || ''}
                  className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none text-sm font-bold text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </ProfileSection>

        <ProfileSection 
          title="Profissional & Histórico" 
          icon={Briefcase} 
          isOpen={openSections.professional} 
          onToggle={() => toggleSection('professional')}
        >
          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Situação Profissional</label>
              <select
                name="employment_status"
                value={formData.employment_status}
                onChange={handleChange}
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1.25rem_center] bg-no-repeat transition-all"
              >
                <option value="" className="bg-slate-900">Selecione</option>
                <option value="Empregado" className="bg-slate-900">Empregado</option>
                <option value="Desempregado" className="bg-slate-900">Desempregado</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Escolaridade</label>
              <select
                name="education_level"
                value={formData.education_level}
                onChange={handleChange}
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1.25rem_center] bg-no-repeat transition-all"
              >
                <option value="" className="bg-slate-900">Selecione</option>
                {educationLevels.map(level => <option key={level} value={level} className="bg-slate-900">{level}</option>)}
              </select>
            </div>

            <div className="p-8 bg-white/5 rounded-3xl border border-white/10 space-y-6 shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Landmark className="w-20 h-20 text-[#df982a]" />
              </div>
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Histórico Religioso</h4>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Congregação Anterior</label>
                  <select
                    name="prev_church_name"
                    value={formData.prev_church_name}
                    onChange={handleChange}
                    className="w-full px-6 py-4 bg-slate-900 border border-white/10 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1.25rem_center] bg-no-repeat transition-all"
                  >
                    <option value="" className="bg-slate-900">Selecione</option>
                    {congregations.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                  </select>
                </div>

                {formData.prev_church_name === 'Outra' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <input
                      name="prev_church_name_other"
                      value={formData.prev_church_name_other}
                      onChange={handleChange}
                      placeholder="Nome da outra igreja"
                      className="w-full px-6 py-4 bg-slate-900 border border-orange-500/30 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white"
                    />
                  </motion.div>
                )}
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nome do Pastor</label>
                  <input
                    name="prev_church_pastor"
                    value={formData.prev_church_pastor}
                    onChange={handleChange}
                    placeholder="Pastor da igreja anterior"
                    className="w-full px-6 py-4 bg-slate-900 border border-white/10 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </ProfileSection>

        <ProfileSection 
          title="Posição Eclesiástica" 
          icon={Church} 
          isOpen={openSections.church} 
          onToggle={() => toggleSection('church')}
        >
          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Cargo na Igreja</label>
              <select
                name="church_position"
                value={formData.church_position}
                onChange={handleChange}
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1.25rem_center] bg-no-repeat transition-all"
              >
                <option value="" className="bg-slate-900">Selecione</option>
                {churchPositions.map(pos => <option key={pos} value={pos} className="bg-slate-900">{pos}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Ministério Ativo</label>
              <select
                name="active_ministries"
                value={formData.active_ministries}
                onChange={handleChange}
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1.25rem_center] bg-no-repeat transition-all"
              >
                <option value="" className="bg-slate-900">Selecione</option>
                {ministriesList.map(m => <option key={m} value={m} className="bg-slate-900">{m}</option>)}
              </select>
            </div>
          </div>
        </ProfileSection>

        <ProfileSection 
          title="Vida Familiar" 
          icon={Heart} 
          isOpen={openSections.additional} 
          onToggle={() => toggleSection('additional')}
        >
          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nome do Cônjuge</label>
              <input
                name="spouse_name"
                value={formData.spouse_name}
                onChange={handleChange}
                placeholder="Se casado(a), nome do cônjuge"
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Quantidade de Filhos</label>
              <div className="relative group">
                <Users className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-[#df982a] transition-colors" />
                <input
                  type="number"
                  name="children_count"
                  value={formData.children_count}
                  onChange={handleChange}
                  min="0"
                  className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white"
                />
              </div>
            </div>
          </div>
        </ProfileSection>

        {/* Fixed Save Button Container - Mobile First Optimized */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#020617] via-[#020617]/95 to-transparent z-[50] safe-area-bottom">
          <button
            type="submit"
            disabled={loading}
            className="w-full max-w-lg mx-auto py-5 bg-[#df982a] text-slate-950 font-black uppercase tracking-[0.25em] rounded-[1.8rem] shadow-[0_20px_50px_rgba(223,152,42,0.3)] hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-3 transition-all duration-300 active:scale-95 border-b-4 border-orange-700/50"
          >
            {loading ? (
              <div className="w-6 h-6 border-4 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Save className="w-6 h-6" /> Salvar Cadastro</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
