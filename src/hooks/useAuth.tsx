import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  enrollment_id: string;
  batch_number: string;
  avatar_url: string | null;
  bio: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signInWithOtp: (email: string) => Promise<{ error: Error | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  createProfile: (data: { full_name: string; enrollment_id: string; batch_number: string }) => Promise<{ error: Error | null }>;
  hasProfile: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetch with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      setProfile(data as Profile);
    } else {
      setProfile(null);
    }
  };

  const signInWithOtp = async (email: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { email },
      });

      if (error) {
        return { error: new Error(error.message || 'Failed to send OTP') };
      }

      if (data?.error) {
        return { error: new Error(data.error) };
      }

      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Failed to send OTP') };
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { email, otp },
      });

      if (error) {
        return { error: new Error(error.message || 'Failed to verify OTP') };
      }

      if (data?.error) {
        return { error: new Error(data.error) };
      }

      // Use the token to sign in
      if (data?.token) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: data.token,
          type: 'magiclink',
        });

        if (verifyError) {
          return { error: new Error(verifyError.message) };
        }
      }

      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Failed to verify OTP') };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const createProfile = async (data: { full_name: string; enrollment_id: string; batch_number: string }) => {
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    const { error } = await supabase.from('profiles').insert({
      user_id: user.id,
      full_name: data.full_name,
      enrollment_id: data.enrollment_id,
      batch_number: data.batch_number,
    });

    if (!error) {
      await fetchProfile(user.id);
    }

    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signInWithOtp,
        verifyOtp,
        signOut,
        createProfile,
        hasProfile: !!profile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
