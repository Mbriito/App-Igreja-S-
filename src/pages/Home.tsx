import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminToast } from '@/contexts/AdminToastContext';
import { uploadMediaFile } from '@/lib/mediaUpload';
import { getAppSetting, saveAppSetting, SETTINGS_KEYS } from '@/lib/appSettings';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Megaphone,
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  ChevronRight,
  Instagram,
  Camera,
  Trash2,
  Church,
} from 'lucide-react';
import { PWAInstallBanner } from '@/components/PWAInstallButton';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface Notice {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  event_date: string | null;
  expires_at?: string | null;
  is_event: boolean;
  created_at: string;
}

const RECURRING_SERVICES = [
  {
    id: 'service-familia',
    title: 'Culto da Família',
    schedule: 'Todo domingo às 10:00h',
    description: 'Venha celebrar e adorar ao Senhor com toda a sua família.',
  },
  {
    id: 'service-quarta-profetica',
    title: 'Quarta Profética',
    schedule: 'Toda quarta-feira às 20:00h',
    description: 'Momento de clamor, palavra profética, intercessão e busca pela presença de Deus.',
  },
];

export const isNoticeActiveByDate = (notice: Pick<Notice, 'event_date' | 'expires_at'>): boolean => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const threshold = startOfToday.getTime();

  if (notice.expires_at) {
    const expTime = new Date(notice.expires_at).getTime();
    if (!Number.isNaN(expTime) && expTime < threshold) {
      return false;
    }
  }

  if (notice.event_date) {
    const evtTime = new Date(notice.event_date).getTime();
    if (!Number.isNaN(evtTime) && evtTime < threshold) {
      return false;
    }
  }

  return true;
};

export const Home: React.FC = () => {
  const { user, profile } = useAuth();
  const { showAdminToast } = useAdminToast();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [homeBannerUrl, setHomeBannerUrl] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    fetchNotices();
    loadHomeBanner();
  }, []);

  const loadHomeBanner = async () => {
    const banner = await getAppSetting(SETTINGS_KEYS.HOME_BANNER_URL);
    if (banner) {
      setHomeBannerUrl(banner);
    }
  };

  const fetchNotices = async () => {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      const activeOnly = ((data as Notice[]) || []).filter(isNoticeActiveByDate);
      setNotices(activeOnly);
    }
    setLoading(false);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isAdmin) return;

    setUploadingBanner(true);
    try {
      const uploadResult = await uploadMediaFile(file, {
        bucket: 'avisos',
        folder: 'home-banner',
        maxWidth: 1400,
        quality: 0.84,
      });

      const saveResult = await saveAppSetting(
        SETTINGS_KEYS.HOME_BANNER_URL,
        uploadResult.url,
        user?.id
      );

      setHomeBannerUrl(uploadResult.url);

      if (saveResult.usedFallback || uploadResult.usedFallback) {
        showAdminToast(
          'Capa atualizada! Para sincronizar com todos os membros, execute o supabase_schema.sql.',
          'info'
        );
      } else {
        showAdminToast('Imagem de destaque da Home atualizada com sucesso!');
      }
    } catch (err: any) {
      showAdminToast(err?.message || 'Erro ao atualizar imagem da Home.', 'error');
    } finally {
      setUploadingBanner(false);
      e.target.value = '';
    }
  };

  const handleRemoveBanner = async () => {
    if (!isAdmin) return;
    setUploadingBanner(true);
    try {
      await saveAppSetting(SETTINGS_KEYS.HOME_BANNER_URL, '', user?.id);
      setHomeBannerUrl(null);
      showAdminToast('Imagem de fundo da Home removida.');
    } finally {
      setUploadingBanner(false);
    }
  };

  return (
    <div className="w-full max-w-full overflow-hidden space-y-8 sm:space-y-10 animate-in fade-in duration-700 pb-16">
      {/* PWA Install Banner */}
      <div className="min-w-0">
        <PWAInstallBanner />
      </div>

      {/* Hero Header - Igreja da Vila Sé + Optional Uploaded Highlight/Background Image */}
      <div className="relative w-full max-w-full min-w-0 rounded-3xl sm:rounded-[2.5rem] border border-amber-500/20 bg-slate-900/70 overflow-hidden shadow-2xl">
        {homeBannerUrl && (
          <>
            <img
              src={homeBannerUrl}
              alt="Destaque Igreja da Vila Sé"
              className="absolute inset-0 w-full h-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/75 to-slate-950/50" />
          </>
        )}

        <div className="relative z-10 p-6 sm:p-8 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-10 bg-[#df982a] rounded-full shadow-[0_0_15px_#df982a]" />
              <span className="text-[10px] font-black text-[#df982a] uppercase tracking-[0.35em]">
                Bem-vindo à Casa
              </span>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950/80 hover:bg-amber-500/20 border border-amber-500/30 text-[#df982a] text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all">
                  <Camera className="w-3.5 h-3.5" />
                  <span>{uploadingBanner ? 'Enviando...' : homeBannerUrl ? 'Alterar Capa' : 'Enviar Capa'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingBanner}
                    onChange={handleBannerUpload}
                  />
                </label>
                {homeBannerUrl && (
                  <button
                    type="button"
                    disabled={uploadingBanner}
                    onClick={handleRemoveBanner}
                    className="p-2 rounded-xl bg-slate-950/80 hover:bg-rose-500/20 border border-white/10 text-rose-400 transition-all"
                    title="Remover imagem de fundo"
                    aria-label="Remover imagem de fundo da Home"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1.5 min-w-0">
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none uppercase break-words">
              Igreja da Vila Sé
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-bold uppercase tracking-widest">
              Avisos e Programação Semanal
            </p>
          </div>
        </div>
      </div>

      {/* Recurring Services */}
      <section className="space-y-4 min-w-0">
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <Church className="w-5 h-5 text-[#df982a] flex-shrink-0" />
            <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight truncate">
              Cultos
            </h2>
          </div>
          <span className="text-[9px] font-black text-[#df982a] uppercase tracking-[0.2em] bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full flex-shrink-0">
            Toda Semana
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 w-full min-w-0">
          {RECURRING_SERVICES.map((service) => (
            <div
              key={service.id}
              className="w-full max-w-full min-w-0 bg-slate-900/80 border border-amber-500/25 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#df982a]/15 border border-[#df982a]/30 text-[#df982a] text-[10px] font-black uppercase tracking-wider">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  Culto
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight break-words">
                {service.title}
              </h3>
              <p className="text-xs sm:text-sm font-black text-[#df982a] break-words">
                {service.schedule}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed break-words">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Active Notices Section (Renamed from Mural to Avisos) */}
      <section className="space-y-5 min-w-0">
        <div className="flex items-center gap-2.5 px-1">
          <Megaphone className="w-5 h-5 text-[#df982a] flex-shrink-0" />
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
            Avisos
          </h2>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-56 bg-slate-900/50 border border-white/5 rounded-3xl sm:rounded-[3rem] animate-pulse"
              />
            ))}
          </div>
        ) : notices.length === 0 ? (
          <div className="w-full bg-slate-900/40 border border-white/10 rounded-3xl p-8 text-center space-y-2">
            <Megaphone className="w-8 h-8 text-[#df982a]/70 mx-auto" />
            <p className="text-sm font-black text-white uppercase tracking-tight">
              Nenhum aviso extra ativo no momento
            </p>
            <p className="text-xs text-slate-400">
              Confira nossa programação semanal acima ou acompanhe pelas redes sociais.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 w-full min-w-0 gap-6 sm:gap-8">
            <AnimatePresence>
              {notices.map((notice, index) => {
                const showImage = Boolean(notice.image_url && !brokenImages[notice.id]);
                return (
                  <motion.div
                    key={notice.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="group relative w-full max-w-full min-w-0 bg-slate-900/50 backdrop-blur-xl rounded-3xl sm:rounded-[2.5rem] shadow-2xl transition-all duration-500 border border-white/10 overflow-hidden"
                  >
                    {showImage && (
                      <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate-950 flex items-center justify-center border-b border-white/5">
                        <img
                          src={notice.image_url!}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          alt={notice.title}
                          onError={() =>
                            setBrokenImages((prev) => ({ ...prev, [notice.id]: true }))
                          }
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
                      </div>
                    )}

                    <div className="relative p-5 sm:p-8 space-y-5 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div
                          className={clsx(
                            'px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border',
                            notice.is_event
                              ? 'bg-orange-500/10 text-[#df982a] border-orange-500/20'
                              : 'bg-white/5 text-slate-400 border-white/10'
                          )}
                        >
                          {notice.is_event ? (
                            <>
                              <Sparkles className="w-3.5 h-3.5 flex-shrink-0" /> Evento Vila
                            </>
                          ) : (
                            <>
                              <Megaphone className="w-3.5 h-3.5 flex-shrink-0" /> Aviso
                            </>
                          )}
                        </div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          {format(new Date(notice.created_at), "dd 'de' MMM", { locale: ptBR })}
                        </span>
                      </div>

                      <div className="space-y-3 min-w-0">
                        <h3 className="text-xl sm:text-2xl font-black text-white leading-tight group-hover:text-[#df982a] transition-colors uppercase tracking-tight break-words">
                          {notice.title}
                        </h3>
                        <p className="text-slate-300 text-sm leading-relaxed font-medium break-words overflow-hidden">
                          {notice.content}
                        </p>
                      </div>

                      {notice.event_date && (
                        <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-white/5 rounded-2xl sm:rounded-3xl border border-white/10 min-w-0 w-full overflow-hidden">
                          <div className="w-10 h-10 bg-slate-950 rounded-2xl flex items-center justify-center shadow-2xl text-[#df982a] border border-white/5 flex-shrink-0">
                            <CalendarIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">
                              Data e Horário
                            </p>
                            <p className="text-xs sm:text-sm font-black text-white leading-tight uppercase tracking-tighter break-words">
                              {format(new Date(notice.event_date), "dd/MM/yyyy 'às' HH:mm", {
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 flex-shrink-0">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Instagram Section */}
      <motion.a
        href="https://instagram.com/aigrejadavila"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="group relative w-full max-w-full min-w-0 bg-gradient-to-br from-[#df982a] to-orange-600 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 text-slate-950 shadow-[0_20px_50px_rgba(223,152,42,0.28)] flex flex-col items-center text-center space-y-5 overflow-hidden active:scale-95 transition-all"
      >
        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-1000 rotate-12 pointer-events-none">
          <Instagram className="w-44 h-44" />
        </div>
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-950/20 backdrop-blur-md rounded-2xl sm:rounded-[2rem] flex items-center justify-center shadow-inner">
          <Instagram className="w-8 h-8 sm:w-10 sm:h-10 text-slate-950" />
        </div>
        <div className="space-y-1.5 relative z-10 max-w-full">
          <h3 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase leading-none break-words">
            Nosso Instagram
          </h3>
          <p className="text-slate-950/60 font-black tracking-[0.3em] text-[10px] uppercase">
            @AIGREJADAVILA
          </p>
        </div>
        <div className="px-7 py-3.5 bg-slate-950 text-[#df982a] rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] shadow-2xl relative z-10 group-hover:scale-105 transition-transform">
          Seguir a Vila
        </div>
      </motion.a>
    </div>
  );
};
