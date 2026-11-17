import { supabase } from '@/lib/supabaseClient';

export const SETTINGS_KEYS = {
  HOME_BANNER_URL: 'home_banner_url',
  PIX_KEY: 'pix_key',
  PIX_RECIPIENT: 'pix_recipient',
  PIX_BANK: 'pix_bank',
} as const;

export const DEFAULT_OFFERING_INFO = {
  pix_key: 'aigrejadavilanase@gmail.com',
  pix_recipient: 'Igreja da Vila Sé',
  pix_bank: 'Banco / Instituição Financeira da Igreja',
};

const LOCAL_PREFIX = 'vila_se_setting_';

export const getAppSetting = async (key: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (!error && data?.value !== undefined && data?.value !== null) {
      try {
        localStorage.setItem(`${LOCAL_PREFIX}${key}`, data.value);
      } catch {
        // ignore storage quota errors
      }
      return data.value;
    }
  } catch {
    // ignore and fallback to localStorage
  }

  try {
    return localStorage.getItem(`${LOCAL_PREFIX}${key}`);
  } catch {
    return null;
  }
};

export const getMultipleAppSettings = async (
  keys: string[]
): Promise<Record<string, string>> => {
  const result: Record<string, string> = {};

  for (const k of keys) {
    try {
      const local = localStorage.getItem(`${LOCAL_PREFIX}${k}`);
      if (local) result[k] = local;
    } catch {
      // ignore
    }
  }

  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', keys);

    if (!error && data) {
      for (const row of data) {
        if (row.value !== null && row.value !== undefined) {
          result[row.key] = row.value;
          try {
            localStorage.setItem(`${LOCAL_PREFIX}${row.key}`, row.value);
          } catch {
            // ignore
          }
        }
      }
    }
  } catch {
    // keep local cache
  }

  return result;
};

export const saveAppSetting = async (
  key: string,
  value: string,
  userId?: string
): Promise<{ ok: boolean; usedFallback: boolean; errorMessage?: string }> => {
  try {
    localStorage.setItem(`${LOCAL_PREFIX}${key}`, value);
  } catch {
    // ignore
  }

  try {
    const { error } = await supabase.from('app_settings').upsert(
      {
        key,
        value,
        updated_at: new Date().toISOString(),
        updated_by: userId || null,
      },
      { onConflict: 'key' }
    );

    if (error) {
      return {
        ok: true,
        usedFallback: true,
        errorMessage: error.message,
      };
    }

    return { ok: true, usedFallback: false };
  } catch (err: any) {
    return {
      ok: true,
      usedFallback: true,
      errorMessage: err?.message || 'Erro ao salvar no banco.',
    };
  }
};
