import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Phone, Shield, Briefcase, Tag, AlertCircle, CheckCircle } from 'lucide-react';

export interface MemberFormData {
  name: string;
  email: string;
  role: 'member' | 'admin';
  church_position: string;
  status: string;
  phone: string;
}

export interface MemberRecord {
  id: string;
  full_name?: string | null;
  email?: string | null;
  role?: 'member' | 'admin' | string | null;
  church_position?: string | null;
  status?: string | null;
  phone?: string | null;
  [key: string]: any;
}

interface MemberFormModalProps {
  isOpen: boolean;
  initialMember: MemberRecord | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (data: MemberFormData) => Promise<void>;
}

const DEFAULT_FORM_DATA: MemberFormData = {
  name: '',
  email: '',
  role: 'member',
  church_position: 'Membro',
  status: 'Ativo',
  phone: '',
};

const CHURCH_POSITIONS = [
  'Visitante',
  'Novo convertido',
  'Jovem',
  'Membro',
  'Obreiro',
  'Diácono',
  'Evangelista',
  'Presbítero',
  'Pastor',
  'Missionário',
];

const MEMBER_STATUSES = [
  'Ativo',
  'Em Discipulado',
  'Visitante',
  'Transferido',
  'Inativo',
];

export const MemberFormModal: React.FC<MemberFormModalProps> = ({
  isOpen,
  initialMember,
  isSaving,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<MemberFormData>(DEFAULT_FORM_DATA);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setFormError(null);
    if (initialMember) {
      setFormData({
        name: initialMember.full_name || '',
        email: initialMember.email || '',
        role: initialMember.role === 'admin' ? 'admin' : 'member',
        church_position: initialMember.church_position || 'Membro',
        status: initialMember.status || 'Ativo',
        phone: initialMember.phone || '',
      });
    } else {
      setFormData(DEFAULT_FORM_DATA);
    }
  }, [isOpen, initialMember]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, name: value }));
    if (formError) setFormError(null);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, email: value }));
    if (formError) setFormError(null);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, phone: value }));
  };

  const handlePositionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, church_position: value }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, status: value }));
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === 'admin' ? 'admin' : 'member';
    setFormData((prev) => ({ ...prev, role: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('O nome completo do membro é obrigatório.');
      return;
    }

    const trimmedEmail = formData.email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFormError('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    try {
      await onSubmit({
        name: formData.name.trim(),
        email: trimmedEmail,
        role: formData.role,
        church_position: formData.church_position,
        status: formData.status,
        phone: formData.phone.trim(),
      });
      setFormData(DEFAULT_FORM_DATA);
      setFormError(null);
    } catch (err: any) {
      setFormError(err?.message || 'Erro ao salvar dados do membro. Tente novamente.');
    }
  };

  const handleClose = () => {
    if (isSaving) return;
    setFormError(null);
    setFormData(DEFAULT_FORM_DATA);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            className="bg-slate-900 w-full max-w-lg rounded-[2.5rem] border border-amber-500/20 shadow-[0_30px_100px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 sm:px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-[#df982a]/15 border border-[#df982a]/30 flex items-center justify-center text-[#df982a] flex-shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-black text-white uppercase tracking-tight truncate">
                    {initialMember ? 'Editar Membro' : 'Novo Membro'}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em]">
                    {initialMember ? 'Atualizar cadastro completo' : 'Cadastrar membro da igreja'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSaving}
                className="p-2.5 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all border border-white/10 disabled:opacity-40"
                aria-label="Fechar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5 custom-scrollbar">
              {formError && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-bold leading-relaxed">{formError}</p>
                </div>
              )}

              {/* Nome */}
              <div className="space-y-2">
                <label htmlFor="member-name" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#df982a]" />
                  Nome Completo *
                </label>
                <input
                  id="member-name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="Ex: Maria da Silva"
                  className="w-full px-5 py-3.5 bg-slate-950/70 border border-white/10 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:border-[#df982a] outline-none text-sm font-bold text-white placeholder-slate-600 transition-all"
                />
              </div>

              {/* E-mail */}
              <div className="space-y-2">
                <label htmlFor="member-email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#df982a]" />
                  E-mail
                </label>
                <input
                  id="member-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleEmailChange}
                  placeholder="exemplo@email.com"
                  className="w-full px-5 py-3.5 bg-slate-950/70 border border-white/10 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:border-[#df982a] outline-none text-sm font-bold text-white placeholder-slate-600 transition-all"
                />
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <label htmlFor="member-phone" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#df982a]" />
                  Telefone / WhatsApp
                </label>
                <input
                  id="member-phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="(11) 99999-9999"
                  className="w-full px-5 py-3.5 bg-slate-950/70 border border-white/10 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:border-[#df982a] outline-none text-sm font-bold text-white placeholder-slate-600 transition-all"
                />
              </div>

              {/* Cargo e Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="member-position" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-[#df982a]" />
                    Cargo / Função
                  </label>
                  <select
                    id="member-position"
                    name="church_position"
                    value={formData.church_position}
                    onChange={handlePositionChange}
                    className="w-full px-4 py-3.5 bg-slate-950/70 border border-white/10 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:border-[#df982a] outline-none text-sm font-bold text-white transition-all [color-scheme:dark]"
                  >
                    {CHURCH_POSITIONS.map((pos) => (
                      <option key={pos} value={pos} className="bg-slate-900 text-white">
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="member-status" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#df982a]" />
                    Status / Categoria
                  </label>
                  <select
                    id="member-status"
                    name="status"
                    value={formData.status}
                    onChange={handleStatusChange}
                    className="w-full px-4 py-3.5 bg-slate-950/70 border border-white/10 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:border-[#df982a] outline-none text-sm font-bold text-white transition-all [color-scheme:dark]"
                  >
                    {MEMBER_STATUSES.map((st) => (
                      <option key={st} value={st} className="bg-slate-900 text-white">
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nível de Acesso */}
              <div className="space-y-2">
                <label htmlFor="member-role" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#df982a]" />
                  Nível de Acesso no App
                </label>
                <select
                  id="member-role"
                  name="role"
                  value={formData.role}
                  onChange={handleRoleChange}
                  className="w-full px-4 py-3.5 bg-slate-950/70 border border-white/10 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:border-[#df982a] outline-none text-sm font-bold text-white transition-all [color-scheme:dark]"
                >
                  <option value="member" className="bg-slate-900 text-white">
                    Membro (Padrão)
                  </option>
                  <option value="admin" className="bg-slate-900 text-white">
                    Administrador (Admin)
                  </option>
                </select>
              </div>

              {/* Actions */}
              <div className="pt-4 flex flex-col-reverse sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-6 py-4 bg-white/5 hover:bg-white/10 text-slate-300 font-black text-xs uppercase tracking-widest rounded-2xl border border-white/10 transition-all disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-4 px-6 bg-[#df982a] hover:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      {initialMember ? 'Salvar Alterações' : 'Cadastrar Membro'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
