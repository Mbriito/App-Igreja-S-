import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { 
  User, LogOut, Phone, Cake, Church, Save, MapPin, 
  Briefcase, GraduationCap, Users, Heart, Shield, Landmark,
  ChevronDown, ChevronUp, Mail, Edit3, PlusCircle, Instagram
} from 'lucide-react';
import { clsx } from 'clsx';

interface SectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

const ProfileSection: React.FC<SectionProps> = ({ title, icon: Icon, children, isOpen, onToggle }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between p-5 text-left active:bg-slate-50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-50 text-[#df982a] rounded-xl">
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="font-bold text-slate-800 tracking-tight">{title}</h3>
      </div>
      {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
    </button>
    <div className={clsx(
      "px-5 pb-6 space-y-5 transition-all duration-300",
      isOpen ? "block" : "hidden"
    )}>
      {children}
    </div>
  </div>
);

export const Profile: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Section toggle state
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

  // Form State
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
    prev_church_address: '',
    prev_church_number: '',
    prev_church_neighborhood: '',
    prev_church_zip: '',
    prev_church_city: '',
    prev_church_state: '',
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
        prev_church_address: profile.prev_church_address || '',
        prev_church_number: profile.prev_church_number || '',
        prev_church_neighborhood: profile.prev_church_neighborhood || '',
        prev_church_zip: profile.prev_church_zip || '',
        prev_church_city: profile.prev_church_city || '',
        prev_church_state: profile.prev_church_state || '',
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

    // Limpar dados antes de enviar (evitar erros de tipo no DB)
    const { prev_church_name_other, ...dataToSave } = formData;
    
    const cleanedData = {
      ...dataToSave,
      prev_church_name: formData.prev_church_name === 'Outra' ? formData.prev_church_name_other : formData.prev_church_name,
      birth_date: formData.birth_date || null,
      baptism_date: formData.baptism_date || null,
      marriage_date: formData.marriage_date || null,
      children_count: parseInt(formData.children_count as any) || 0,
    };

    const { error } = await supabase
      .from('profiles')
      .update({
        ...cleanedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      console.error('Update error:', error);
      setMessage({ type: 'error', text: `Erro ao atualizar: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setLoading(false);
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

  const ministries = [
    'Louvor', 'Mídia / Som', 'Infantil (Vila Kids)', 'Recepção', 
    'Intercessão', 'Diaconato', 'Ação Social', 'Teatro / Dança', 'Outro'
  ];

  const congregations = [
    'Nenhuma / Primeira Igreja', 'Assembleia de Deus', 'Batista', 
    'Presbiteriana', 'Metodista', 'Quadrangular', 'Outra'
  ];

  return (
    <div className="space-y-6 pb-32">
      {/* Welcome Card / Header */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
          <button
            onClick={() => signOut()}
            className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        
        <div className="w-24 h-24 rounded-full border-4 border-orange-50 p-1 mb-4 shadow-sm relative">
          <div className="w-full h-full rounded-full bg-[#df982a] flex items-center justify-center text-white text-3xl font-black uppercase">
            {profile?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-md border border-slate-50">
            <Edit3 className="w-3 h-3 text-[#df982a]" />
          </div>
        </div>

        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{profile?.full_name || 'Usuário'}</h2>
        <div className="mt-1 px-3 py-1 bg-orange-50 text-[#df982a] text-xs font-black uppercase tracking-widest rounded-full">
          {profile?.church_position || 'Membro'}
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
        }`}>
          <PlusCircle className={clsx("w-5 h-5", message.type === 'success' ? "rotate-45" : "")} />
          {message.text}
        </div>
      )}

      <form onSubmit={handleUpdate} className="space-y-4">
        {/* 1. Dados Pessoais */}
        <ProfileSection 
          title="Dados Pessoais" 
          icon={User} 
          isOpen={openSections.personal} 
          onToggle={() => toggleSection('personal')}
        >
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
              <input
                required
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-200 focus:border-[#df982a] transition-all outline-none text-sm font-medium"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RG</label>
                <input
                  name="rg"
                  value={formData.rg}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-200 focus:border-[#df982a] outline-none text-sm font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF</label>
                <input
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-200 focus:border-[#df982a] outline-none text-sm font-medium"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gênero</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-200 focus:border-[#df982a] outline-none text-sm font-medium appearance-none"
                >
                  <option value="">Selecione</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado Civil</label>
                <select
                  name="marital_status"
                  value={formData.marital_status}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-200 focus:border-[#df982a] outline-none text-sm font-medium appearance-none"
                >
                  <option value="">Selecione</option>
                  {maritalStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Batismo</label>
                <input
                  type="date"
                  name="baptism_date"
                  value={formData.baptism_date}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-200 focus:border-[#df982a] outline-none text-sm font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Casamento</label>
                <input
                  type="date"
                  name="marriage_date"
                  value={formData.marriage_date}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-200 focus:border-[#df982a] outline-none text-sm font-medium"
                />
              </div>
            </div>
          </div>
        </ProfileSection>

        {/* 2. Endereço */}
        <ProfileSection 
          title="Endereço" 
          icon={MapPin} 
          isOpen={openSections.address} 
          onToggle={() => toggleSection('address')}
        >
          <div className="grid gap-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Logradouro</label>
                <input
                  name="address_street"
                  value={formData.address_street}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-200 focus:border-[#df982a] outline-none text-sm font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nº</label>
                <input
                  name="address_number"
                  value={formData.address_number}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-200 focus:border-[#df982a] outline-none text-sm font-medium"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Complemento</label>
              <input
                name="address_complement"
                value={formData.address_complement}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-200 focus:border-[#df982a] outline-none text-sm font-medium"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bairro</label>
                <input
                  name="address_neighborhood"
                  value={formData.address_neighborhood}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-200 focus:border-[#df982a] outline-none text-sm font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CEP</label>
                <input
                  name="address_zip"
                  value={formData.address_zip}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-200 focus:border-[#df982a] outline-none text-sm font-medium"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cidade</label>
                <input
                  name="address_city"
                  value={formData.address_city}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-200 focus:border-[#df982a] outline-none text-sm font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado</label>
                <input
                  name="address_state"
                  value={formData.address_state}
                  onChange={handleChange}
                  maxLength={2}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-200 focus:border-[#df982a] outline-none text-sm font-medium"
                />
              </div>
            </div>
          </div>
        </ProfileSection>

        {/* 3. Contato */}
        <ProfileSection 
          title="Contato" 
          icon={Mail} 
          isOpen={openSections.contact} 
          onToggle={() => toggleSection('contact')}
        >
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp / Telefone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(00) 00000-0000"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-200 focus:border-[#df982a] outline-none text-sm font-medium"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
              <div className="relative opacity-60">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  disabled
                  value={user?.email || ''}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl outline-none text-sm font-medium cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </ProfileSection>

        {/* 4. Profissional & Histórico */}
        <ProfileSection 
          title="Profissional & Histórico" 
          icon={Briefcase} 
          isOpen={openSections.professional} 
          onToggle={() => toggleSection('professional')}
        >
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Situação Profissional</label>
              <select
                name="employment_status"
                value={formData.employment_status}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-200 focus:border-[#df982a] outline-none text-sm font-medium appearance-none"
              >
                <option value="">Selecione</option>
                <option value="Empregado">Empregado</option>
                <option value="Desempregado">Desempregado</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Profissão</label>
              <input
                name="profession"
                value={formData.profession}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-200 focus:border-[#df982a] outline-none text-sm font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Escolaridade</label>
              <select
                name="education_level"
                value={formData.education_level}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-200 focus:border-[#df982a] outline-none text-sm font-medium appearance-none"
              >
                <option value="">Selecione</option>
                {educationLevels.map(level => <option key={level} value={level}>{level}</option>)}
              </select>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Congregação Anterior</h4>
              <div className="space-y-3">
                <select
                  name="prev_church_name"
                  value={formData.prev_church_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium appearance-none"
                >
                  <option value="">Selecione</option>
                  {congregations.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {formData.prev_church_name === 'Outra' && (
                  <input
                    name="prev_church_name_other"
                    value={formData.prev_church_name_other}
                    onChange={handleChange}
                    placeholder="Nome da Igreja"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium mt-2"
                  />
                )}
                <input
                  name="prev_church_pastor"
                  value={formData.prev_church_pastor}
                  onChange={handleChange}
                  placeholder="Nome do Pastor"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium"
                />
              </div>
            </div>
          </div>
        </ProfileSection>

        {/* 5. Posição Eclesiástica */}
        <ProfileSection 
          title="Posição Eclesiástica" 
          icon={Church} 
          isOpen={openSections.church} 
          onToggle={() => toggleSection('church')}
        >
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargo na Igreja</label>
              <select
                name="church_position"
                value={formData.church_position}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-200 focus:border-[#df982a] outline-none text-sm font-medium appearance-none"
              >
                <option value="">Selecione</option>
                {churchPositions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ministérios Ativos</label>
              <select
                name="active_ministries"
                value={formData.active_ministries}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-200 focus:border-[#df982a] outline-none text-sm font-medium appearance-none"
              >
                <option value="">Selecione</option>
                {ministries.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
        </ProfileSection>

        {/* 6. Informações Adicionais */}
        <ProfileSection 
          title="Informações Adicionais" 
          icon={Heart} 
          isOpen={openSections.additional} 
          onToggle={() => toggleSection('additional')}
        >
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Cônjuge</label>
              <input
                name="spouse_name"
                value={formData.spouse_name}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-200 focus:border-[#df982a] outline-none text-sm font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantidade de Filhos</label>
              <input
                type="number"
                name="children_count"
                value={formData.children_count}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-200 focus:border-[#df982a] outline-none text-sm font-medium"
              />
            </div>
          </div>
        </ProfileSection>

        {/* Fixed Save Button Container */}
        <div className="fixed bottom-20 left-0 right-0 px-6 py-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pointer-events-none z-40">
          <button
            type="submit"
            disabled={loading}
            className="w-full max-w-md mx-auto py-4.5 bg-[#df982a] text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-orange-200 hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-3 pointer-events-auto active:scale-95 transition-all duration-200"
          >
            {loading ? (
              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Save className="w-5 h-5" /> Salvar Alterações</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
