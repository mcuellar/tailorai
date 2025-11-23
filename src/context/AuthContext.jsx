import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import supabase from '../services/supabaseClient';

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  authError: null,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
  clearAuthError: () => {},
});

const isMissingProfile = profile => !profile || Object.keys(profile).length === 0;

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const fetchProfile = async userId => {
    if (!userId) {
      setProfile(null);
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    setProfile(data);
    return data;
  };

  const ensureProfile = async user => {
    if (!user) {
      return null;
    }

    const existing = await fetchProfile(user.id);
    if (!isMissingProfile(existing)) {
      return existing;
    }

    const firstName = user.user_metadata?.first_name || '';
    const lastName = user.user_metadata?.last_name || '';

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        first_name: firstName || 'Friend',
        last_name: lastName || 'of TuneIt',
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    setProfile(data);
    return data;
  };

  useEffect(() => {
    const init = async () => {
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession();

      setSession(initialSession);
      if (initialSession?.user) {
        try {
          await ensureProfile(initialSession.user);
        } catch (profileError) {
          console.error('[TuneIt] Unable to load profile on init.', profileError);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    };

    init();

    const {
      data: authListener,
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        ensureProfile(nextSession.user).catch(profileError => {
          console.error('[TuneIt] Unable to ensure profile after auth change.', profileError);
        });
      } else {
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signUp = async ({ email, password, firstName, lastName }) => {
    setAuthError(null);

    const {
      data: { user, session: signUpSession },
      error,
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (error) {
      setAuthError(error);
      throw error;
    }

    if (signUpSession?.user) {
      await ensureProfile(signUpSession.user);
    } else if (user) {
      try {
        await ensureProfile(user);
      } catch (profileError) {
        console.error('[TuneIt] Unable to create profile after sign up.', profileError);
      }
    }

    return { user, session: signUpSession };
  };

  const signIn = async ({ email, password }) => {
    setAuthError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError(error);
      throw error;
    }

    if (data.user) {
      await ensureProfile(data.user);
    }

    return data;
  };

  const signOut = async () => {
    setAuthError(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(error);
      throw error;
    }
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (!session?.user) {
      setProfile(null);
      return null;
    }
    return fetchProfile(session.user.id);
  };

  const clearAuthError = () => setAuthError(null);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      profile,
      loading,
      authError,
      signUp,
      signIn,
      signOut,
      refreshProfile,
      clearAuthError,
    }),
    [session?.user, profile, loading, authError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
