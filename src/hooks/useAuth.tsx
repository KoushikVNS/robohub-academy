import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  enrollment_id: string;
  batch_number: string;
  mobile_number: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface VerifyOtpData {
  full_name: string;
  enrollment_id: string;
  batch_number: string;
  mobile_number: string;
  email: string;
  otp: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  sendOtp: (email: string) => Promise<{ error: Error | null }>;
  verifyOtpAndSignUp: (data: VerifyOtpData) => Promise<{ error: Error | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
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

  const sendOtp = async (email: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { email },
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      if (data?.error) {
        return { error: new Error(data.error) };
      }

      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Failed to send OTP') };
    }
  };

  const verifyOtpAndSignUp = async (data: VerifyOtpData) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('verify-otp', {
        body: {
          email: data.email,
          otp: data.otp,
          password: data.password,
          full_name: data.full_name,
          enrollment_id: data.enrollment_id,
          batch_number: data.batch_number,
          mobile_number: data.mobile_number,
        },
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      if (result?.error) {
        return { error: new Error(result.error) };
      }

      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Failed to verify OTP') };
    }
  };

  const signInWithPassword = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Failed to sign in') };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        sendOtp,
        verifyOtpAndSignUp,
        signInWithPassword,
        signOut,
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
