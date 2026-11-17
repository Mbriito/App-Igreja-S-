import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminToast } from '@/contexts/AdminToastContext';
import { uploadMediaFile } from '@/lib/mediaUpload';
import { getAppSetting, saveAppSetting, SETTINGS_KEYS } from '@/lib/appSettings';
import { isNoticeActiveByDate } from '@/pages/Home';
import {
  Megaphone,
  Calendar,
  Users,
  Send,
  CheckCircle,
  Image as ImageIcon,
  X,
  Edit3,
  Shield,
  Search,
  Sparkles,
  Download,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Mail,
  Phone,
  Trash2,
  Camera,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { MemberFormModal, type MemberFormData, type MemberRecord } from '@/components/MemberFormModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ScheduleRecord {
  id: string;
  ministry_name: string;
  member_name: string;
  event_date: string;
  description?: string | null;
}

export const Admin: React.FC = () => {
  const { profile } = useAuth();
  const { showAdminToast } = useAdminToast();
  const [searchParams] = useSearchParams();

  const initialTabParam = searchParams.get('tab');
  const [tab, setTab] = useState<'notices' | 'schedules' | 'members'>(
    initialTabParam === 'schedules' || initialTabParam === 'members' ? initialTabParam : 'notices'
  );

  const [loading, setLoading] = useState(false);

  // Members state
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberRecord | null>(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberRecord | null>(null);
  const [savingMember, setSavingMember] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Home Banner state
  const [homeBannerUrl, setHomeBannerUrl] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Notices state
  const [notices, setNotices] = useState<any[]>([]);
  const [showExpiredNotices, setShowExpiredNotices] = useState(false);
  const [editingNotice, setEditingNotice] = useState<any | null>(null);
  const [noticeToDelete, setNoticeToDelete] = useState<any | null>(null);
  const [deletingNoticeId, setDeletingNoticeId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isEvent, setIsEvent] = useState(false);
  const [eventDate, setEventDate] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Schedules state
  const [schedules, setSchedules] = useState<ScheduleRecord[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleRecord | null>(null);
  const [scheduleToDelete, setScheduleToDelete] = useState<ScheduleRecord | null>(null);
  const [deletingScheduleId, setDeletingScheduleId] = useState<string | null>(null);
  const [ministryName, setMinistryName] = useState('');
  const [memberName, setMemberName] = useState('');
  const [schedDate, setSchedDate] = useState('');
  const [schedDescription, setSchedDescription] = useState('');

  useEffect(() => {
    const paramTab = searchParams.get('tab');
    if (paramTab === 'notices' || paramTab === 'schedules' || paramTab === 'members') {
      setTab(paramTab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (tab === 'members') {
      fetchMembers();
      setCurrentPage(1);
    } else if (tab === 'notices') {
      fetchNotices();
      loadHomeBanner();
    } else if (tab === 'schedules') {
      fetchSchedules();
    }
  }, [tab]);

  const loadHomeBanner = async () => {
    const banner = await getAppSetting(SETTINGS_KEYS.HOME_BANNER_URL);
    setHomeBannerUrl(banner || null);
  };

  const handleHomeBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    try {
      const uploadRes = await uploadMediaFile(file, {
        bucket: 'avisos',
        folder: 'home-banner',
        maxWidth: 1400,
        quality: 0.84,
      });

      const saveRes = await saveAppSetting(
        SETTINGS_KEYS.HOME_BANNER_URL,
        uploadRes.url,
        profile?.id
      );

      setHomeBannerUrl(uploadRes.url);
      if (saveRes.usedFallback || uploadRes.usedFallback) {
        showAdminToast(
          'Imagem de capa salva! Execute o supabase_schema.sql para sincronizar com todos os membros.',
          'info'
        );
      } else {
        showAdminToast('Imagem de destaque da Home atualizada com sucesso!');
      }
    } catch (err: any) {
      showAdminToast(err?.message || 'Erro ao enviar imagem da Home.', 'error');
    } finally {
      setUploadingBanner(false);
      e.target.value = '';
    }
  };

  const handleRemoveHomeBanner = async () => {
    setUploadingBanner(true);
    try {
      await saveAppSetting(SETTINGS_KEYS.HOME_BANNER_URL, '', profile?.id);
      setHomeBannerUrl(null);
      showAdminToast('Imagem de fundo da Home removida.');
    } finally {
      setUploadingBanner(false);
    }
  };

  const fetchMembers = async () => {
    setLoadingMembers(true);
    const { data, error } = await supabase.from('profiles').select('*').order('full_name');
    if (!error) {
      setMembers(data || []);
    }
    setLoadingMembers(false);
  };

  const toggleAdmin = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);

    if (!error) {
      setMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m)));
      if (selectedMember?.id === userId) {
        setSelectedMember((prev) => (prev ? { ...prev, role: newRole } : null));
      }
      showAdminToast(
        newRole === 'admin' ? 'Usuário promovido a Administrador!' : 'Permissão de Admin removida.'
      );
    } else {
      showAdminToast(error.message || 'Erro ao alterar permissão do membro.', 'error');
    }
  };

  const handleOpenAddMember = () => {
    setEditingMember(null);
    setIsMemberModalOpen(true);
  };

  const handleOpenEditMember = (member: MemberRecord) => {
    setEditingMember(member);
    setIsMemberModalOpen(true);
  };

  const handleSaveMember = async (formData: MemberFormData) => {
    setSavingMember(true);
    try {
      const payload = {
        full_name: formData.name.trim(),
        email: formData.email.trim() || null,
        role: formData.role,
        church_position: formData.church_position || 'Membro',
        status: formData.status || 'Ativo',
        phone: formData.phone.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (editingMember) {
        const { data, error } = await supabase
          .from('profiles')
          .update(payload)
          .eq('id', editingMember.id)
          .select()
          .single();

        if (error) {
          if (error.code === '42703' || error.code === 'PGRST204') {
            throw new Error(
              'Colunas "email" ou "status" ausentes no banco. Execute o script supabase_schema.sql atualizado no SQL Editor do Supabase.'
            );
          }
          if (error.code === '42501') {
            throw new Error(
              'Sem permissão (RLS) para atualizar este membro. Verifique as políticas no supabase_schema.sql.'
            );
          }
          throw new Error(error.message || 'Erro ao atualizar cadastro do membro.');
        }

        const updatedRecord = (data || { ...editingMember, ...payload }) as MemberRecord;
        setMembers((prev) =>
          prev
            .map((m) => (m.id === editingMember.id ? updatedRecord : m))
            .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '', 'pt-BR'))
        );

        if (selectedMember?.id === editingMember.id) {
          setSelectedMember(updatedRecord);
        }

        setIsMemberModalOpen(false);
        setEditingMember(null);
        showAdminToast('Membro atualizado com sucesso!');
      } else {
        const newId =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        const { data, error } = await supabase
          .from('profiles')
          .insert({
            id: newId,
            ...payload,
          })
          .select()
          .single();

        if (error) {
          if (
            error.code === '42703' ||
            error.code === 'PGRST204' ||
            error.code === '23503' ||
            error.code === '42501'
          ) {
            throw new Error(
              'Banco de dados precisa da atualização de schema/permissões. Execute o arquivo supabase_schema.sql atualizado no SQL Editor do Supabase.'
            );
          }
          throw new Error(error.message || 'Erro ao cadastrar novo membro.');
        }

        const createdRecord = (data || { id: newId, ...payload }) as MemberRecord;
        setMembers((prev) =>
          [createdRecord, ...prev].sort((a, b) =>
            (a.full_name || '').localeCompare(b.full_name || '', 'pt-BR')
          )
        );
        setCurrentPage(1);
        setIsMemberModalOpen(false);
        setEditingMember(null);
        showAdminToast('Membro cadastrado com sucesso!');
      }
    } finally {
      setSavingMember(false);
    }
  };

  // Notices CRUD
  const fetchNotices = async () => {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) {
      setNotices(data || []);
    }
  };

  const resetNoticeForm = () => {
    setEditingNotice(null);
    setTitle('');
    setContent('');
    setIsEvent(false);
    setEventDate('');
    setExpiresAt('');
    setImageFile(null);
    setImagePreview(null);
  };

  const handleEditNotice = (notice: any) => {
    setEditingNotice(notice);
    setTitle(notice.title || '');
    setContent(notice.content || '');
    setIsEvent(Boolean(notice.is_event));
    setEventDate(notice.event_date ? notice.event_date.substring(0, 16) : '');
    setExpiresAt(notice.expires_at ? notice.expires_at.substring(0, 10) : '');
    setImageFile(null);
    setImagePreview(notice.image_url || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDeleteNotice = async () => {
    if (!noticeToDelete) return;
    setDeletingNoticeId(noticeToDelete.id);
    try {
      const { data, error } = await supabase
        .from('notices')
        .delete()
        .eq('id', noticeToDelete.id)
        .select('id');

      if (error) {
        showAdminToast(error.message || 'Erro ao excluir aviso.', 'error');
        return;
      }

      if (!data || data.length === 0) {
        showAdminToast(
          'Exclusão bloqueada por permissão RLS. Execute o supabase_schema.sql atualizado.',
          'error'
        );
        return;
      }

      setNotices((prev) => prev.filter((n) => n.id !== noticeToDelete.id));
      if (editingNotice?.id === noticeToDelete.id) {
        resetNoticeForm();
      }
      setNoticeToDelete(null);
      showAdminToast('Aviso excluído com sucesso!');
    } finally {
      setDeletingNoticeId(null);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);

    try {
      let imageUrl: string | null = imagePreview ? editingNotice?.image_url || null : null;
      let usedMediaFallback = false;

      if (imageFile) {
        const uploadRes = await uploadMediaFile(imageFile, {
          bucket: 'avisos',
          folder: 'notices',
          maxWidth: 1280,
          quality: 0.84,
        });
        imageUrl = uploadRes.url;
        usedMediaFallback = uploadRes.usedFallback;
      }

      const baseNoticeData: Record<string, any> = {
        title: title.trim(),
        content: content.trim(),
        image_url: imageUrl,
        is_event: isEvent,
        event_date: isEvent && eventDate ? eventDate : null,
        created_by: profile.id,
      };

      const noticeDataWithExpiry = {
        ...baseNoticeData,
        expires_at: expiresAt ? `${expiresAt}T23:59:59` : null,
      };

      let result = editingNotice
        ? await supabase
            .from('notices')
            .update(noticeDataWithExpiry)
            .eq('id', editingNotice.id)
            .select()
            .single()
        : await supabase.from('notices').insert(noticeDataWithExpiry).select().single();

      // Graceful retry if expires_at column hasn't been added in Supabase yet
      if (
        result.error &&
        (result.error.code === '42703' || result.error.code === 'PGRST204')
      ) {
        result = editingNotice
          ? await supabase
              .from('notices')
              .update(baseNoticeData)
              .eq('id', editingNotice.id)
              .select()
              .single()
          : await supabase.from('notices').insert(baseNoticeData).select().single();
      }

      if (result.error) {
        showAdminToast(result.error.message || 'Erro ao salvar o aviso.', 'error');
        return;
      }

      resetNoticeForm();
      await fetchNotices();

      if (usedMediaFallback) {
        showAdminToast(
          'Aviso salvo com imagem incorporada! Execute o supabase_schema.sql para usar Storage.',
          'info'
        );
      } else {
        showAdminToast(
          editingNotice ? 'Aviso atualizado com sucesso!' : 'Aviso publicado com sucesso!'
        );
      }
    } catch (err: any) {
      showAdminToast(err?.message || 'Falha ao processar imagem ou salvar aviso.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Schedules CRUD
  const fetchSchedules = async () => {
    setLoadingSchedules(true);
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .order('event_date', { ascending: true });
    if (!error) {
      setSchedules((data as ScheduleRecord[]) || []);
    }
    setLoadingSchedules(false);
  };

  const resetScheduleForm = () => {
    setEditingSchedule(null);
    setMinistryName('');
    setMemberName('');
    setSchedDate('');
    setSchedDescription('');
  };

  const handleEditSchedule = (sched: ScheduleRecord) => {
    setEditingSchedule(sched);
    setMinistryName(sched.ministry_name || '');
    setMemberName(sched.member_name || '');
    setSchedDate(sched.event_date ? sched.event_date.substring(0, 10) : '');
    setSchedDescription(sched.description || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ministry_name: ministryName.trim(),
        member_name: memberName.trim(),
        event_date: schedDate,
        description: schedDescription.trim() || null,
      };

      if (editingSchedule) {
        const { data, error } = await supabase
          .from('schedules')
          .update(payload)
          .eq('id', editingSchedule.id)
          .select()
          .single();

        if (error) {
          if (error.code === '42501') {
            showAdminToast(
              'Permissão de edição (RLS) ausente. Execute o supabase_schema.sql atualizado.',
              'error'
            );
          } else {
            showAdminToast(error.message || 'Erro ao atualizar escala.', 'error');
          }
          return;
        }

        const updated = (data || { ...editingSchedule, ...payload }) as ScheduleRecord;
        setSchedules((prev) =>
          prev
            .map((s) => (s.id === editingSchedule.id ? updated : s))
            .sort((a, b) => a.event_date.localeCompare(b.event_date))
        );
        resetScheduleForm();
        showAdminToast('Escala atualizada com sucesso!');
      } else {
        const { data, error } = await supabase.from('schedules').insert(payload).select().single();

        if (error) {
          showAdminToast(error.message || 'Erro ao cadastrar na escala.', 'error');
          return;
        }

        if (data) {
          setSchedules((prev) =>
            [...prev, data as ScheduleRecord].sort((a, b) =>
              a.event_date.localeCompare(b.event_date)
            )
          );
        } else {
          fetchSchedules();
        }
        resetScheduleForm();
        showAdminToast('Membro adicionado à escala!');
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteSchedule = async () => {
    if (!scheduleToDelete) return;
    setDeletingScheduleId(scheduleToDelete.id);
    try {
      const { data, error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', scheduleToDelete.id)
        .select('id');

      if (error) {
        if (error.code === '42501') {
          showAdminToast(
            'Permissão de exclusão (RLS) ausente para escalas. Execute o supabase_schema.sql.',
            'error'
          );
        } else {
          showAdminToast(error.message || 'Erro ao remover item da escala.', 'error');
        }
        return;
      }

      if (!data || data.length === 0) {
        showAdminToast(
          'Não foi possível remover no banco (RLS). Execute o supabase_schema.sql atualizado.',
          'error'
        );
        return;
      }

      setSchedules((prev) => prev.filter((s) => s.id !== scheduleToDelete.id));
      if (editingSchedule?.id === scheduleToDelete.id) {
        resetScheduleForm();
      }
      setScheduleToDelete(null);
      showAdminToast('Item removido da escala com sucesso!');
    } finally {
      setDeletingScheduleId(null);
    }
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
            Este painel é exclusivo para administradores da Igreja da Vila Sé.
          </p>
        </div>

        <div className="w-full max-w-sm bg-orange-500/10 border border-orange-500/20 rounded-[2rem] p-6 text-left space-y-5 shadow-2xl">
          <div className="flex items-center gap-3 text-[#df982a]">
            <Edit3 className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Liberar acesso:</span>
          </div>
          <p className="text-[10px] text-orange-200/60 leading-relaxed font-bold">
            Se você é o proprietário do app, execute este comando no <strong>SQL Editor</strong> do
            Supabase:
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

  const getFilteredMembers = () => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.full_name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.phone?.toLowerCase().includes(q) ||
        m.church_position?.toLowerCase().includes(q) ||
        m.status?.toLowerCase().includes(q)
    );
  };

  const handleExportCSV = () => {
    const filteredMembers = getFilteredMembers();

    const headers = ['Nome', 'E-mail', 'Cargo', 'Status', 'Nivel de Acesso', 'Telefone'];
    const rows = filteredMembers.map((m) => [
      m.full_name || '',
      m.email || '',
      m.church_position || 'Membro',
      m.status || 'Ativo',
      m.role || 'member',
      m.phone || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `membros_vila_se_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showAdminToast('Lista de membros exportada em CSV!');
  };

  const activeNotices = notices.filter(isNoticeActiveByDate);
  const expiredNotices = notices.filter((n) => !isNoticeActiveByDate(n));
  const displayedNotices = showExpiredNotices ? notices : activeNotices;

  const tabs = [
    { id: 'notices', label: 'Avisos', icon: Megaphone },
    { id: 'schedules', label: 'Escalas', icon: Calendar },
    { id: 'members', label: 'Membros', icon: Users },
  ];

  return (
    <div className="w-full max-w-full overflow-hidden space-y-6 sm:space-y-8 pb-24 px-0 sm:px-1">
      <div className="space-y-2 min-w-0">
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Admin</h2>
        <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">
          Gerenciamento da Comunidade
        </p>
      </div>

      <div className="w-full max-w-full flex flex-wrap sm:flex-nowrap p-1.5 bg-slate-900 border border-white/5 rounded-3xl sm:rounded-[2rem] shadow-2xl gap-1.5 sm:gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as any)}
            className={`relative flex-1 min-w-[90px] py-3 sm:py-4 px-2.5 sm:px-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.12em] sm:tracking-[0.15em] transition-all whitespace-nowrap flex items-center justify-center gap-1.5 sm:gap-2 ${
              tab === t.id
                ? 'bg-orange-500 text-slate-950 shadow-xl shadow-orange-500/20'
                : 'text-slate-500 hover:text-white'
            }`}
          >
            <t.icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="w-full max-w-full overflow-hidden bg-slate-900/50 backdrop-blur-xl rounded-3xl sm:rounded-[2.5rem] border border-white/10 p-4 sm:p-8 shadow-2xl"
        >
          {tab === 'notices' ? (
            <div className="space-y-10 sm:space-y-12 w-full max-w-full min-w-0">
              {/* Home Cover Image Upload */}
              <div className="p-4 sm:p-6 bg-slate-950/70 rounded-2xl sm:rounded-3xl border border-amber-500/20 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Camera className="w-5 h-5 text-[#df982a] flex-shrink-0" />
                    <h3 className="text-sm font-black text-white uppercase tracking-tight">
                      Imagem de Destaque da Home
                    </h3>
                  </div>
                  {homeBannerUrl && (
                    <button
                      type="button"
                      disabled={uploadingBanner}
                      onClick={handleRemoveHomeBanner}
                      className="text-[10px] font-black text-rose-400 uppercase tracking-wider hover:underline"
                    >
                      Remover Capa
                    </button>
                  )}
                </div>

                {homeBannerUrl && (
                  <div className="relative w-full aspect-[16/7] rounded-2xl overflow-hidden border border-white/10 bg-slate-900">
                    <img
                      src={homeBannerUrl}
                      alt="Capa da Home"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <label className="flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-white/5 hover:bg-amber-500/15 border border-amber-500/30 rounded-2xl text-amber-300 text-xs font-black uppercase tracking-widest cursor-pointer transition-all">
                  <Camera className="w-4 h-4" />
                  <span>
                    {uploadingBanner
                      ? 'Enviando imagem...'
                      : homeBannerUrl
                      ? 'Alterar Imagem da Home'
                      : 'Enviar Imagem da Home'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingBanner}
                    onChange={handleHomeBannerUpload}
                  />
                </label>
              </div>

              {/* Notice Form */}
              <form onSubmit={handleCreateNotice} className="space-y-6 sm:space-y-8 w-full max-w-full min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight flex items-center gap-3 min-w-0">
                    <Edit3 className="w-5 h-5 sm:w-6 sm:h-6 text-[#df982a] flex-shrink-0" />
                    <span className="truncate">{editingNotice ? 'Editar Aviso' : 'Novo Aviso'}</span>
                  </h3>
                  {editingNotice && (
                    <button
                      type="button"
                      onClick={resetNoticeForm}
                      className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline flex-shrink-0"
                    >
                      Cancelar
                    </button>
                  )}
                </div>

                <div className="space-y-5 sm:space-y-6 w-full max-w-full min-w-0">
                  <div className="space-y-2 min-w-0">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">
                      Título do Aviso
                    </label>
                    <input
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full max-w-full min-w-0 px-4 sm:px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white transition-all"
                      placeholder="Ex: Culto de Jovens"
                    />
                  </div>

                  <div className="space-y-2 min-w-0">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">
                      Conteúdo
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full max-w-full min-w-0 px-4 sm:px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-orange-500/10 focus:border-[#df982a] outline-none resize-none text-sm font-bold text-white transition-all"
                      placeholder="Descreva as informações importantes..."
                    />
                  </div>

                  <div className="space-y-3 min-w-0">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">
                      Imagem do Aviso
                    </label>
                    {!imagePreview ? (
                      <label className="flex flex-col items-center justify-center w-full max-w-full h-40 border-2 border-dashed border-white/10 rounded-3xl cursor-pointer hover:bg-white/5 hover:border-orange-500/20 transition-all group">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                          <ImageIcon className="w-10 h-10 text-slate-600 mb-3 group-hover:text-[#df982a] transition-colors" />
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                            Selecionar Imagem
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </label>
                    ) : (
                      <div className="relative w-full max-w-full aspect-video rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 bg-slate-950 flex items-center justify-center group shadow-inner">
                        <img
                          src={imagePreview}
                          className="max-w-full max-h-full object-contain"
                          alt="Preview"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          className="absolute top-3 right-3 p-2.5 bg-rose-500 text-white rounded-full shadow-2xl hover:scale-110 transition-transform"
                          aria-label="Remover imagem"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest text-center">
                      Tamanho ideal: 1280x720px (16:9)
                    </p>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-white/5 rounded-2xl border border-white/10 transition-colors hover:bg-white/10 min-w-0">
                    <input
                      type="checkbox"
                      id="is_event"
                      checked={isEvent}
                      onChange={(e) => setIsEvent(e.target.checked)}
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg border-white/10 bg-slate-950 text-[#df982a] focus:ring-[#df982a] cursor-pointer flex-shrink-0"
                    />
                    <label
                      htmlFor="is_event"
                      className="flex-1 min-w-0 text-xs text-white font-black uppercase tracking-wider sm:tracking-widest cursor-pointer break-words"
                    >
                      Este aviso é um Evento com data?
                    </label>
                  </div>

                  {isEvent && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300 min-w-0">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">
                        Data e Hora do Evento
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full max-w-full min-w-0 appearance-none px-4 sm:px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white transition-all [color-scheme:dark]"
                      />
                    </div>
                  )}

                  <div className="space-y-2 min-w-0">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">
                      Exibir aviso até (opcional — remove antigos automaticamente)
                    </label>
                    <input
                      type="date"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full max-w-full min-w-0 appearance-none px-4 sm:px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white transition-all [color-scheme:dark]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full max-w-full py-4 sm:py-5 px-4 bg-[#df982a] text-slate-950 font-black text-xs sm:text-sm uppercase tracking-[0.18em] rounded-2xl sm:rounded-3xl shadow-2xl shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-3 transition-all active:scale-95"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-4 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : editingNotice ? (
                    <>
                      <CheckCircle className="w-5 h-5 flex-shrink-0" /> Salvar Alterações
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 flex-shrink-0" /> Publicar Aviso
                    </>
                  )}
                </button>
              </form>

              {/* Active Notices List */}
              <div className="pt-10 sm:pt-12 border-t border-white/5 space-y-6 w-full max-w-full min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                    <Megaphone className="w-5 h-5 sm:w-6 sm:h-6 text-[#df982a] flex-shrink-0" />
                    Avisos Ativos ({activeNotices.length})
                  </h3>
                  {expiredNotices.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowExpiredNotices((prev) => !prev)}
                      className="text-[10px] font-black text-amber-400 uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl hover:bg-amber-500/20 transition-all"
                    >
                      {showExpiredNotices
                        ? 'Ocultar expirados'
                        : `Ver expirados (${expiredNotices.length})`}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 w-full min-w-0 gap-3">
                  {displayedNotices.map((notice) => {
                    const isExpired = !isNoticeActiveByDate(notice);
                    return (
                      <div
                        key={notice.id}
                        className={clsx(
                          'w-full max-w-full min-w-0 overflow-hidden bg-slate-900/90 border rounded-2xl p-3.5 sm:p-4 shadow-lg transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group/card',
                          isExpired
                            ? 'border-white/10 opacity-65'
                            : 'border-amber-500/20 hover:border-amber-500/40'
                        )}
                      >
                        <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full">
                          {notice.image_url ? (
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden flex-shrink-0 border border-white/5 shadow-inner bg-slate-950">
                              <img
                                src={notice.image_url}
                                className="w-full h-full object-cover"
                                alt=""
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center text-slate-600 flex-shrink-0">
                              <Megaphone className="w-5 h-5 text-[#df982a]/60" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <p className="text-sm sm:text-base font-semibold text-slate-100 break-words line-clamp-2 tracking-tight leading-snug">
                              {notice.title}
                            </p>
                            {notice.content && (
                              <p className="text-xs text-slate-400 break-words line-clamp-2 mt-1 leading-relaxed">
                                {notice.content}
                              </p>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span
                                className={clsx(
                                  'text-[10px] font-bold px-2.5 py-0.5 rounded-md border inline-flex items-center gap-1 uppercase tracking-wider',
                                  notice.is_event
                                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                                    : 'text-slate-400 bg-slate-500/10 border-slate-500/20'
                                )}
                              >
                                {notice.is_event ? (
                                  <Sparkles className="w-2.5 h-2.5 flex-shrink-0" />
                                ) : (
                                  <Megaphone className="w-2.5 h-2.5 flex-shrink-0" />
                                )}
                                {notice.is_event ? 'Evento' : 'Aviso'}
                              </span>
                              {isExpired && (
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-rose-500/30 bg-rose-500/10 text-rose-300 uppercase tracking-wider">
                                  Expirado
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 flex-shrink-0 w-full sm:w-auto pt-2.5 sm:pt-0 border-t border-white/5 sm:border-t-0">
                          <button
                            type="button"
                            onClick={() => handleEditNotice(notice)}
                            className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-amber-500/20 text-amber-400 transition-all border border-white/5 shadow-sm active:scale-90"
                            title="Editar"
                            aria-label={`Editar aviso ${notice.title}`}
                          >
                            <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setNoticeToDelete(notice)}
                            className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-rose-500/20 text-rose-400 transition-all border border-white/5 shadow-sm active:scale-90"
                            title="Excluir"
                            aria-label={`Excluir aviso ${notice.title}`}
                          >
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {displayedNotices.length === 0 && (
                    <p className="text-center text-slate-600 text-xs py-10 uppercase font-black tracking-[0.2em] italic">
                      Nenhum aviso ativo no momento.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : tab === 'schedules' ? (
            <div className="space-y-10 w-full max-w-full min-w-0">
              <form onSubmit={handleSaveSchedule} className="space-y-6 w-full max-w-full min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-[#df982a] flex-shrink-0" />
                    <span>{editingSchedule ? 'Alterar Escala' : 'Nova Escala'}</span>
                  </h3>
                  {editingSchedule && (
                    <button
                      type="button"
                      onClick={resetScheduleForm}
                      className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline flex-shrink-0"
                    >
                      Cancelar
                    </button>
                  )}
                </div>

                <div className="space-y-2 min-w-0">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">
                    Ministério
                  </label>
                  <input
                    required
                    value={ministryName}
                    onChange={(e) => setMinistryName(e.target.value)}
                    className="w-full max-w-full min-w-0 px-4 sm:px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white transition-all"
                    placeholder="Ex: Recepção, Louvor, Mídia"
                  />
                </div>

                <div className="space-y-2 min-w-0">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">
                    Nome do Membro
                  </label>
                  <input
                    required
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    className="w-full max-w-full min-w-0 px-4 sm:px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white transition-all"
                    placeholder="Nome de quem vai servir"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 min-w-0">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">
                      Data do Serviço
                    </label>
                    <input
                      type="date"
                      required
                      value={schedDate}
                      onChange={(e) => setSchedDate(e.target.value)}
                      className="w-full max-w-full min-w-0 appearance-none px-4 sm:px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white transition-all [color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">
                      Turno / Observação (Opcional)
                    </label>
                    <input
                      value={schedDescription}
                      onChange={(e) => setSchedDescription(e.target.value)}
                      className="w-full max-w-full min-w-0 px-4 sm:px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white transition-all"
                      placeholder="Ex: Domingo 10:00h"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 sm:py-5 px-4 bg-[#df982a] text-slate-950 font-black text-xs sm:text-sm uppercase tracking-widest rounded-2xl sm:rounded-3xl shadow-2xl shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-3 transition-all active:scale-95"
                >
                  {loading ? (
                    'Processando...'
                  ) : editingSchedule ? (
                    <>
                      <CheckCircle className="w-5 h-5" /> Salvar Alteração na Escala
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" /> Cadastrar na Escala
                    </>
                  )}
                </button>
              </form>

              {/* Schedule List with Edit & Remove */}
              <div className="pt-10 border-t border-white/5 space-y-6 w-full max-w-full min-w-0">
                <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-[#df982a] flex-shrink-0" />
                  Escalas Cadastradas ({schedules.length})
                </h3>

                {loadingSchedules ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-[#df982a] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : schedules.length === 0 ? (
                  <p className="text-center text-slate-600 text-xs py-10 uppercase font-black tracking-[0.2em] italic">
                    Nenhuma escala cadastrada ainda.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 w-full min-w-0 gap-3">
                    {schedules.map((sched) => (
                      <div
                        key={sched.id}
                        className="w-full max-w-full min-w-0 overflow-hidden bg-slate-900/90 border border-amber-500/20 hover:border-amber-500/40 rounded-2xl p-4 shadow-lg transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-slate-950 border border-amber-500/20 flex items-center justify-center text-[#df982a] flex-shrink-0">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-black text-[#df982a] uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                                {sched.ministry_name}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">
                                {sched.event_date
                                  ? format(new Date(sched.event_date + 'T12:00:00'), 'dd/MM/yyyy', {
                                      locale: ptBR,
                                    })
                                  : '-'}
                              </span>
                            </div>
                            <p className="text-sm sm:text-base font-bold text-white break-words">
                              {sched.member_name}
                            </p>
                            {sched.description && (
                              <p className="text-xs text-slate-400 break-words">
                                {sched.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 flex-shrink-0 w-full sm:w-auto pt-2.5 sm:pt-0 border-t border-white/5 sm:border-t-0">
                          <button
                            type="button"
                            onClick={() => handleEditSchedule(sched)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-wider border border-white/10 transition-all active:scale-95"
                            title="Alterar escala"
                            aria-label={`Alterar escala de ${sched.member_name}`}
                          >
                            <Edit3 className="w-4 h-4" />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setScheduleToDelete(sched)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-wider border border-white/10 transition-all active:scale-95"
                            title="Remover da escala"
                            aria-label={`Remover ${sched.member_name} da escala`}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Remover</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8 w-full max-w-full min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                  <Users className="w-6 h-6 text-[#df982a]" />
                  Membros
                </h3>
                <button
                  type="button"
                  onClick={handleOpenAddMember}
                  className="w-full sm:w-auto px-5 py-3.5 bg-[#df982a] hover:bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  Novo Membro
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative group flex-1 w-full">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-[#df982a] transition-colors" />
                  <input
                    type="text"
                    placeholder="Pesquisar por nome, e-mail, cargo ou status..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-[1.5rem] focus:ring-2 focus:ring-orange-500/10 focus:border-[#df982a] outline-none text-sm font-bold text-white placeholder-slate-600 transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="w-full sm:w-auto px-6 py-4 bg-slate-900 border border-amber-500/30 hover:border-amber-500/60 rounded-2xl flex items-center justify-center gap-3 text-slate-100 text-xs font-black uppercase tracking-widest transition-all group flex-shrink-0"
                >
                  <Download className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  Baixar Lista (CSV)
                </button>
              </div>

              {loadingMembers ? (
                <div className="flex justify-center py-20">
                  <div className="w-10 h-10 border-4 border-[#df982a] border-t-transparent rounded-full animate-spin shadow-lg" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="divide-y divide-white/5">
                    {(() => {
                      const filtered = getFilteredMembers();
                      const totalPages = Math.ceil(filtered.length / itemsPerPage);
                      const displayed = filtered.slice(
                        (currentPage - 1) * itemsPerPage,
                        currentPage * itemsPerPage
                      );

                      if (displayed.length === 0) {
                        return (
                          <p className="text-center text-slate-600 text-xs py-10 uppercase font-black tracking-widest">
                            Nenhum membro encontrado.
                          </p>
                        );
                      }

                      return (
                        <>
                          {displayed.map((member) => {
                            const memberStatus = member.status || 'Ativo';
                            return (
                              <div
                                key={member.id}
                                className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-white/5 px-4 -mx-4 rounded-2xl transition-all"
                              >
                                <button
                                  type="button"
                                  onClick={() => setSelectedMember(member)}
                                  className="flex items-start sm:items-center gap-4 min-w-0 text-left hover:opacity-90 transition-opacity flex-1"
                                >
                                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-950 border border-amber-500/20 flex items-center justify-center text-[#df982a] font-black text-lg sm:text-xl uppercase flex-shrink-0 shadow-lg overflow-hidden">
                                    {member.avatar_url ? (
                                      <img
                                        src={member.avatar_url}
                                        alt={member.full_name || 'Membro'}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      member.full_name?.charAt(0) || 'U'
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-sm font-black text-white truncate uppercase tracking-tight">
                                        {member.full_name || 'Sem Nome'}
                                      </p>
                                      <span
                                        className={clsx(
                                          'text-[9px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider',
                                          memberStatus === 'Ativo'
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            : memberStatus === 'Inativo' ||
                                              memberStatus === 'Transferido'
                                            ? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                        )}
                                      >
                                        {memberStatus}
                                      </span>
                                    </div>
                                    <p className="text-[10px] font-black text-amber-400/80 uppercase tracking-[0.18em]">
                                      {member.church_position || 'Membro'}{' '}
                                      {member.role === 'admin' ? '• ADMIN' : ''}
                                    </p>
                                    {(member.email || member.phone) && (
                                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-slate-400 pt-0.5">
                                        {member.email && (
                                          <span className="inline-flex items-center gap-1 truncate max-w-full min-w-0">
                                            <Mail className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                            <span className="truncate">{member.email}</span>
                                          </span>
                                        )}
                                        {member.phone && (
                                          <span className="inline-flex items-center gap-1">
                                            <Phone className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                            <span>{member.phone}</span>
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </button>

                                <div className="flex items-center justify-end gap-2 flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditMember(member)}
                                    className="p-2.5 rounded-xl bg-slate-800/70 hover:bg-amber-500/20 text-amber-400 border border-white/10 transition-all active:scale-95"
                                    title="Editar membro"
                                    aria-label={`Editar ${member.full_name || 'membro'}`}
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>

                                  {member.id !== profile?.id && (
                                    <button
                                      type="button"
                                      onClick={() => toggleAdmin(member.id, member.role || 'member')}
                                      className={`px-3.5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                        member.role === 'admin'
                                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                                          : 'bg-orange-500/10 text-[#df982a] border border-orange-500/20 hover:bg-orange-500/20'
                                      }`}
                                    >
                                      {member.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                                    </button>
                                  )}
                                  {member.role === 'admin' && member.id === profile?.id && (
                                    <span className="px-3.5 py-2.5 bg-white/5 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/10">
                                      Você
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {totalPages > 1 && (
                            <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                Página {currentPage} de {totalPages}
                              </p>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={currentPage === 1}
                                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                  className="px-4 py-2.5 bg-slate-900 border border-amber-500/30 rounded-xl text-slate-100 hover:border-amber-500/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest"
                                >
                                  <ChevronLeft className="w-4 h-4 text-amber-400" />
                                  Anterior
                                </button>
                                <button
                                  type="button"
                                  disabled={currentPage === totalPages}
                                  onClick={() =>
                                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                                  }
                                  className="px-4 py-2.5 bg-slate-900 border border-amber-500/30 rounded-xl text-slate-100 hover:border-amber-500/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest"
                                >
                                  Próxima
                                  <ChevronRight className="w-4 h-4 text-amber-400" />
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
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
              <div className="p-6 sm:p-8 border-b border-white/5 flex items-center justify-between bg-white/5 gap-3">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[1.5rem] bg-[#df982a] text-slate-950 flex items-center justify-center text-2xl font-black uppercase shadow-2xl overflow-hidden flex-shrink-0">
                    {selectedMember.avatar_url ? (
                      <img
                        src={selectedMember.avatar_url}
                        alt={selectedMember.full_name || 'Membro'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      selectedMember.full_name?.charAt(0) || 'U'
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-xl font-black text-white leading-tight uppercase tracking-tight truncate">
                      {selectedMember.full_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 rounded-full bg-[#df982a] animate-pulse" />
                      <p className="text-[10px] font-black text-[#df982a] uppercase tracking-[0.2em]">
                        {selectedMember.role}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all border border-white/10 flex-shrink-0"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-10 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                  <DetailItem label="E-mail" value={selectedMember.email} />
                  <DetailItem label="Status / Categoria" value={selectedMember.status || 'Ativo'} />
                  <DetailItem label="Cargo" value={selectedMember.church_position} />
                  <DetailItem label="Ministérios" value={selectedMember.active_ministries} />
                  <DetailItem label="Telefone" value={selectedMember.phone} />
                  <DetailItem label="Nascimento" value={selectedMember.birth_date} />
                  <DetailItem
                    label="Gênero"
                    value={
                      selectedMember.gender === 'M'
                        ? 'Masculino'
                        : selectedMember.gender === 'F'
                        ? 'Feminino'
                        : '-'
                    }
                  />
                  <DetailItem label="Escolaridade" value={selectedMember.education_level} />
                  <DetailItem label="Estado Civil" value={selectedMember.marital_status} />
                  <DetailItem label="Profissão" value={selectedMember.profession} />
                </div>

                <div className="space-y-4 pt-8 border-t border-white/5">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                    <div className="w-4 h-[1px] bg-slate-700" /> Endereço
                  </h4>
                  <p className="text-sm font-bold text-slate-300 leading-relaxed bg-white/5 p-5 rounded-3xl border border-white/10 break-words">
                    {selectedMember.address_street || '-'}, {selectedMember.address_number || '-'}
                    {selectedMember.address_complement && ` - ${selectedMember.address_complement}`}
                    <br />
                    {selectedMember.address_neighborhood || '-'} -{' '}
                    {selectedMember.address_city || '-'}/{selectedMember.address_state || '-'}
                    <br />
                    CEP: {selectedMember.address_zip || '-'}
                  </p>
                </div>

                <div className="space-y-6 pt-8 border-t border-white/5">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                    <div className="w-4 h-[1px] bg-slate-700" /> Histórico
                  </h4>
                  <div className="grid gap-4">
                    <DetailItem
                      label="Congregação Anterior"
                      value={selectedMember.prev_church_name}
                    />
                    <DetailItem label="Data Batismo" value={selectedMember.baptism_date} />
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 bg-slate-950/50 border-t border-white/5 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => handleOpenEditMember(selectedMember)}
                  className="flex-1 py-4 bg-[#df982a] hover:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Edit3 className="w-4 h-4" />
                  Editar Membro
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="flex-1 py-4 bg-white/5 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
                >
                  Fechar Detalhes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Delete Notice Modal */}
      <AnimatePresence>
        {noticeToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              className="w-full max-w-sm bg-slate-900 rounded-3xl border border-amber-500/30 p-6 sm:p-8 shadow-[0_30px_100px_rgba(0,0,0,0.85)] space-y-6"
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">
                  Excluir Aviso
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  Deseja realmente excluir este aviso?
                </p>
                <p className="text-xs font-bold text-amber-400 break-words line-clamp-2">
                  {noticeToDelete.title}
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button
                  type="button"
                  disabled={deletingNoticeId !== null}
                  onClick={() => setNoticeToDelete(null)}
                  className="flex-1 py-3.5 px-4 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-black uppercase tracking-widest rounded-2xl border border-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={deletingNoticeId !== null}
                  onClick={confirmDeleteNotice}
                  className="flex-1 py-3.5 px-4 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {deletingNoticeId ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Delete Schedule Modal */}
      <AnimatePresence>
        {scheduleToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              className="w-full max-w-sm bg-slate-900 rounded-3xl border border-amber-500/30 p-6 sm:p-8 shadow-[0_30px_100px_rgba(0,0,0,0.85)] space-y-6"
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">
                  Remover da Escala
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  Deseja realmente remover este item da escala?
                </p>
                <p className="text-xs font-bold text-amber-400 break-words">
                  {scheduleToDelete.ministry_name} — {scheduleToDelete.member_name}
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button
                  type="button"
                  disabled={deletingScheduleId !== null}
                  onClick={() => setScheduleToDelete(null)}
                  className="flex-1 py-3.5 px-4 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-black uppercase tracking-widest rounded-2xl border border-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={deletingScheduleId !== null}
                  onClick={confirmDeleteSchedule}
                  className="flex-1 py-3.5 px-4 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {deletingScheduleId ? 'Removendo...' : 'Remover'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add / Edit Member Modal */}
      <MemberFormModal
        isOpen={isMemberModalOpen}
        initialMember={editingMember}
        isSaving={savingMember}
        onClose={() => {
          setIsMemberModalOpen(false);
          setEditingMember(null);
        }}
        onSubmit={handleSaveMember}
      />
    </div>
  );
};

const DetailItem: React.FC<{ label: string; value: any }> = ({ label, value }) => (
  <div className="space-y-2 min-w-0">
    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">{label}</p>
    <p className="text-sm font-bold text-white tracking-tight break-words">{value || '-'}</p>
  </div>
);
