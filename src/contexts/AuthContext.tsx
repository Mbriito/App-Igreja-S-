import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';
import { AlertCircle, ExternalLink } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string | null;
  role: 'member' | 'admin';
  gender?: 'M' | 'F';
  birth_date?: string;
  rg?: string;
  cpf?: string;
  phone?: string;
  baptism_date?: string;
  marital_status?: string;
  spouse_name?: string;
  marriage_date?: string;
  address_street?: string;
  address_complement?: string;
  address_number?: string;
  address_neighborhood?: string;
  address_zip?: string;
  address_city?: string;
  address_state?: string;
  education_level?: string;
  employment_status?: 'Empregado' | 'Desempregado';
  profession?: string;
  prev_church_name?: string;
  prev_church_address?: string;
  prev_church_number?: string;
  prev_church_neighborhood?: string;
  prev_church_zip?: string;
  prev_church_city?: string;
  prev_church_state?: string;
  prev_church_pastor?: string;
  prev_church_phone?: string;
  church_position?: string;
  active_ministries?: string;
  children_count?: number;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tablesMissing, setTablesMissing] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        fetchProfile(initialSession.user.id, initialSession.user.email, initialSession.user.user_metadata);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id, currentSession.user.email, currentSession.user.user_metadata);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const [rlsError, setRlsError] = useState(false);

  const fetchProfile = async (userId: string, userEmail?: string, metaData?: any) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST205') {
          setTablesMissing(true);
        } else if (error.code === '42P17' || error.code === '42501') {
          setRlsError(true);
        }
        throw error;
      }

      if (!data) {
        // Profile doesn't exist, create it (fallback if trigger didn't run)
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: metaData?.full_name || userEmail?.split('@')[0] || 'Usuário',
            role: 'member'
          })
          .select()
          .maybeSingle();

        if (insertError) {
          if (insertError.code === '42501' || insertError.code === '42P17') {
            setRlsError(true);
          }
          throw insertError;
        }
        setProfile(newProfile);
      } else {
        setProfile(data);
        setRlsError(false);
        setTablesMissing(false);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const retry = () => {
    if (user) {
      setLoading(true);
      setRlsError(false);
      setTablesMissing(false);
      fetchProfile(user.id, user.email, user.user_metadata);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (!isSupabaseConfigured || tablesMissing || rlsError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600">
            <AlertCircle className="w-10 h-10" />
          </div>
          
          {rlsError ? (
            <>
              <h2 className="text-2xl font-bold text-slate-900">Erro de Segurança (RLS)</h2>
              <p className="text-slate-600">
                O banco de dados detectou um conflito nas regras de acesso (Recursão Infinita).
              </p>
              <div className="bg-slate-50 p-4 rounded-2xl text-left text-sm space-y-2 border border-slate-100">
                <p className="font-bold text-slate-700">Como resolver agora:</p>
                <ol className="list-decimal list-inside text-slate-500 space-y-2">
                  <li>Abra o <strong>SQL Editor</strong> no painel do Supabase.</li>
                  <li>Copie <strong>todo</strong> o conteúdo de <code>supabase_schema.sql</code>.</li>
                  <li>Cole e clique em <strong>Run</strong>.</li>
                  <li>Depois de rodar, clique no botão abaixo.</li>
                </ol>
              </div>
              <button
                onClick={retry}
                className="w-full py-4 bg-[#df982a] text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all active:scale-95"
              >
                Já rodei o script, tentar novamente
              </button>
            </>
          ) : tablesMissing ? (
            <>
              <h2 className="text-2xl font-bold text-slate-900">Tabelas não encontradas</h2>
              <p className="text-slate-600">
                Você configurou as chaves, mas as tabelas ainda não foram criadas no banco de dados.
              </p>
              <div className="bg-slate-50 p-4 rounded-2xl text-left text-sm space-y-2 border border-slate-100">
                <p className="font-bold text-slate-700">Como resolver:</p>
                <ol className="list-decimal list-inside text-slate-500 space-y-2">
                  <li>Abra o <strong>SQL Editor</strong> no seu painel do Supabase.</li>
                  <li>Copie o conteúdo do arquivo <code>supabase_schema.sql</code> (na raiz deste projeto).</li>
                  <li>Cole no editor e clique em <strong>Run</strong>.</li>
                </ol>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-slate-900">Configuração Necessária</h2>
              <p className="text-slate-600">
                Para o app funcionar, você precisa configurar as chaves do <strong>Supabase</strong> no painel de <strong>Secrets</strong> do AI Studio.
              </p>
              <div className="bg-slate-50 p-4 rounded-2xl text-left text-sm space-y-2 border border-slate-100">
                <p className="font-bold text-slate-700">Adicione estes Secrets:</p>
                <ul className="list-disc list-inside text-slate-500 space-y-1">
                  <li>VITE_SUPABASE_URL</li>
                  <li>VITE_SUPABASE_ANON_KEY</li>
                </ul>
              </div>
            </>
          )}

          <a
            href="https://supabase.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-[#df982a] font-bold hover:underline"
          >
            Ir para o Supabase <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
