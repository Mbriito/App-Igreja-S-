import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminToast } from '@/contexts/AdminToastContext';
import {
  DEFAULT_OFFERING_INFO,
  SETTINGS_KEYS,
  getMultipleAppSettings,
  saveAppSetting,
} from '@/lib/appSettings';
import {
  HandHeart,
  HeartHandshake,
  Copy,
  Check,
  Sparkles,
  Landmark,
  Edit3,
  Save,
  X,
  QrCode,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

export const Offerings: React.FC = () => {
  const { user, profile } = useAuth();
  const { showAdminToast } = useAdminToast();

  const [contributionType, setContributionType] = useState<'ofertas' | 'dizimo'>('ofertas');
  const [offeringCategory, setOfferingCategory] = useState<string>('Oferta Voluntária');
  const [copied, setCopied] = useState(false);

  const [pixInfo, setPixInfo] = useState(DEFAULT_OFFERING_INFO);
  const [isEditingPix, setIsEditingPix] = useState(false);
  const [savingPix, setSavingPix] = useState(false);
  const [pixDraft, setPixDraft] = useState(DEFAULT_OFFERING_INFO);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getMultipleAppSettings([
        SETTINGS_KEYS.PIX_KEY,
        SETTINGS_KEYS.PIX_RECIPIENT,
        SETTINGS_KEYS.PIX_BANK,
      ]);

      const rawPixKey = settings[SETTINGS_KEYS.PIX_KEY];
      const resolvedPixKey =
        rawPixKey && rawPixKey !== 'secretaria@aigrejadavila-se.online'
          ? rawPixKey
          : DEFAULT_OFFERING_INFO.pix_key;

      const merged = {
        pix_key: resolvedPixKey,
        pix_recipient: settings[SETTINGS_KEYS.PIX_RECIPIENT] || DEFAULT_OFFERING_INFO.pix_recipient,
        pix_bank: settings[SETTINGS_KEYS.PIX_BANK] || DEFAULT_OFFERING_INFO.pix_bank,
      };
      setPixInfo(merged);
      setPixDraft(merged);
    };

    loadSettings();
  }, []);

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(pixInfo.pix_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = pixInfo.pix_key;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleSavePix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSavingPix(true);

    try {
      const r1 = await saveAppSetting(SETTINGS_KEYS.PIX_KEY, pixDraft.pix_key.trim(), user?.id);
      const r2 = await saveAppSetting(
        SETTINGS_KEYS.PIX_RECIPIENT,
        pixDraft.pix_recipient.trim(),
        user?.id
      );
      const r3 = await saveAppSetting(SETTINGS_KEYS.PIX_BANK, pixDraft.pix_bank.trim(), user?.id);

      setPixInfo({
        pix_key: pixDraft.pix_key.trim() || DEFAULT_OFFERING_INFO.pix_key,
        pix_recipient: pixDraft.pix_recipient.trim() || DEFAULT_OFFERING_INFO.pix_recipient,
        pix_bank: pixDraft.pix_bank.trim() || DEFAULT_OFFERING_INFO.pix_bank,
      });
      setIsEditingPix(false);

      if (r1.usedFallback || r2.usedFallback || r3.usedFallback) {
        showAdminToast(
          'Dados salvos localmente. Execute o supabase_schema.sql para sincronizar com todos os membros.',
          'info'
        );
      } else {
        showAdminToast('Dados de Dízimos e Ofertas atualizados com sucesso!');
      }
    } finally {
      setSavingPix(false);
    }
  };

  const categories = ['Oferta Voluntária', 'Missões & Ação Social', 'Estrutura da Igreja'];

  return (
    <div className="w-full max-w-full overflow-hidden space-y-8 animate-in fade-in duration-700 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-3 min-w-0">
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-10 bg-[#df982a] rounded-full shadow-[0_0_15px_#df982a]" />
          <span className="text-[10px] font-black text-[#df982a] uppercase tracking-[0.4em]">
            Generosidade
          </span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter leading-none uppercase">
              Ofertas & Dízimos
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-bold uppercase tracking-wider mt-1">
              Contribua com alegria para o Reino
            </p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsEditingPix((prev) => !prev)}
              className="p-3 rounded-2xl bg-slate-900 border border-amber-500/30 text-[#df982a] hover:bg-amber-500/15 transition-all flex-shrink-0"
              title="Configurar dados PIX"
              aria-label="Configurar dados PIX"
            >
              {isEditingPix ? <X className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Type Selector: Ofertas / Dízimo */}
      <div className="w-full max-w-full flex p-1.5 bg-slate-900 border border-white/10 rounded-3xl shadow-2xl gap-2">
        <button
          type="button"
          onClick={() => setContributionType('ofertas')}
          className={clsx(
            'flex-1 py-3.5 px-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.18em] transition-all flex items-center justify-center gap-2',
            contributionType === 'ofertas'
              ? 'bg-[#df982a] text-slate-950 shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          )}
        >
          <HandHeart className="w-4 h-4 flex-shrink-0" />
          Ofertas
        </button>
        <button
          type="button"
          onClick={() => setContributionType('dizimo')}
          className={clsx(
            'flex-1 py-3.5 px-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.18em] transition-all flex items-center justify-center gap-2',
            contributionType === 'dizimo'
              ? 'bg-[#df982a] text-slate-950 shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          )}
        >
          <HeartHandshake className="w-4 h-4 flex-shrink-0" />
          Dízimo
        </button>
      </div>

      {/* Admin Edit Form */}
      <AnimatePresence>
        {isAdmin && isEditingPix && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSavePix}
            className="overflow-hidden bg-slate-900/90 border border-amber-500/30 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center gap-2 text-[#df982a]">
              <Landmark className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                Configurar Dados de Contribuição (Admin)
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Chave PIX (E-mail, CNPJ, Telefone ou Aleatória)
                </label>
                <input
                  required
                  value={pixDraft.pix_key}
                  onChange={(e) => setPixDraft((prev) => ({ ...prev, pix_key: e.target.value }))}
                  className="mt-1 w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-sm font-bold text-white outline-none focus:border-[#df982a]"
                  placeholder="aigrejadavilanase@gmail.com"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Nome / Favorecido
                </label>
                <input
                  required
                  value={pixDraft.pix_recipient}
                  onChange={(e) =>
                    setPixDraft((prev) => ({ ...prev, pix_recipient: e.target.value }))
                  }
                  className="mt-1 w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-sm font-bold text-white outline-none focus:border-[#df982a]"
                  placeholder="Igreja da Vila Sé"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Banco / Observação
                </label>
                <input
                  value={pixDraft.pix_bank}
                  onChange={(e) => setPixDraft((prev) => ({ ...prev, pix_bank: e.target.value }))}
                  className="mt-1 w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-sm font-bold text-white outline-none focus:border-[#df982a]"
                  placeholder="Ex: Banco Inter - Ag 0001"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingPix}
              className="w-full py-3.5 bg-[#df982a] hover:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {savingPix ? 'Salvando...' : 'Salvar Dados PIX'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Main PIX & Contribution Card */}
      <motion.div
        key={contributionType}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-full min-w-0 bg-slate-900/60 backdrop-blur-xl rounded-3xl sm:rounded-[2.5rem] border border-amber-500/20 p-5 sm:p-8 shadow-2xl space-y-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#df982a]/15 border border-[#df982a]/30 flex items-center justify-center text-[#df982a] flex-shrink-0">
            <QrCode className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-black text-[#df982a] uppercase tracking-[0.2em]">
              {contributionType === 'ofertas' ? 'Oferta Direcionada' : 'Fidelidade no Dízimo'}
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-0.5 break-words">
              {contributionType === 'ofertas'
                ? 'Entregar Minha Oferta'
                : 'Entregar Meu Dízimo'}
            </h3>
          </div>
        </div>

        {contributionType === 'ofertas' && (
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Finalidade da Oferta
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setOfferingCategory(cat)}
                  className={clsx(
                    'px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all',
                    offeringCategory === cat
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 sm:p-6 bg-slate-950/90 rounded-2xl border border-white/10 space-y-4">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">
              Chave PIX Oficial
            </span>
            <p className="text-sm sm:text-base font-black text-[#df982a] break-all select-all">
              {pixInfo.pix_key}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/5">
            <div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                Favorecido
              </span>
              <p className="text-xs sm:text-sm font-bold text-white break-words mt-0.5">
                {pixInfo.pix_recipient}
              </p>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                Instituição
              </span>
              <p className="text-xs sm:text-sm font-bold text-slate-300 break-words mt-0.5">
                {pixInfo.pix_bank}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyPix}
            className={clsx(
              'w-full py-4 px-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-xl',
              copied
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                : 'bg-[#df982a] hover:bg-amber-500 text-slate-950 shadow-amber-500/20'
            )}
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                Chave PIX Copiada!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copiar Chave PIX
              </>
            )}
          </button>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
          <Sparkles className="w-5 h-5 text-[#df982a] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            {contributionType === 'ofertas'
              ? '"Cada um contribua segundo propôs no seu coração; não com tristeza, ou por necessidade; porque Deus ama ao que dá com alegria." — 2 Coríntios 9:7'
              : '"Trazei todos os dízimos à casa do tesouro, para que haja mantimento na minha casa..." — Malaquias 3:10'}
          </p>
        </div>
      </motion.div>
    </div>
  );
};
